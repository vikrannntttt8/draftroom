const {
  generateRoomCode,
  normalizeText,
  levenshteinDistance,
  checkWordMatch,
  sanitizeNickname,
  createWordMask,
  getWordLengths
} = require('./utils');
const { getRandomWords } = require('./words');

class GameManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomCode -> Room
    this.socketToRoom = new Map(); // socketId -> roomCode
    this.socketToPlayer = new Map(); // socketId -> playerId
    this.rateLimits = new Map(); // socketId -> { strokeCount, chatCount, lastReset }
    this.eventLogs = []; // ring-buffer of last 100 events

    // Run cleanup sweeper every 60s
    this.sweeperInterval = setInterval(() => this.sweepRooms(), 60000);
  }

  logEvent(roomCode, type, message) {
    const entry = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ts: Date.now(),
      roomCode,
      type,
      message
    };
    this.eventLogs.unshift(entry);
    if (this.eventLogs.length > 100) this.eventLogs.pop();
  }

  getDebugStats() {
    const roomsList = [];
    let totalPlayers = 0;
    for (const [code, room] of this.rooms.entries()) {
      const playersList = Array.from(room.players.values()).map(p => ({
        id: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        score: p.score,
        turnScore: p.turnScore,
        hasGuessed: p.hasGuessed,
        connected: p.connected
      }));
      totalPlayers += playersList.length;

      const drawer = room.drawerId ? room.players.get(room.drawerId) : null;
      const host = room.players.get(room.hostId);

      roomsList.push({
        code,
        state: room.state,
        host: host ? host.nickname : 'Unknown',
        hostId: room.hostId,
        round: room.round,
        totalRounds: room.settings.rounds,
        drawer: drawer ? drawer.nickname : null,
        currentWord: room.currentWord,
        wordMask: room.currentWord ? createWordMask(room.currentWord, room.revealedIndexes) : '',
        turnEndsAt: room.turnEndsAt,
        playersCount: playersList.length,
        maxPlayers: room.settings.maxPlayers,
        drawTime: room.settings.drawTime,
        canvasOps: room.canvasHistory.length,
        players: playersList,
        createdAt: room.createdAt,
        lastActivityAt: room.lastActivityAt
      });
    }

    return {
      serverTime: Date.now(),
      uptime: Math.floor(process.uptime()),
      memory: {
        rssMB: (process.memoryUsage().rss / (1024 * 1024)).toFixed(1),
        heapUsedMB: (process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(1)
      },
      activeRoomsCount: this.rooms.size,
      totalPlayersCount: totalPlayers,
      connectedSocketsCount: this.socketToRoom.size,
      rooms: roomsList,
      recentEvents: this.eventLogs.slice(0, 50)
    };
  }

  // --- Rate limiting ---
  checkRateLimit(socketId, type) {
    const now = Date.now();
    let record = this.rateLimits.get(socketId);
    if (!record || now - record.lastReset > 1000) {
      record = { strokeCount: 0, chatCount: 0, lastReset: now };
      this.rateLimits.set(socketId, record);
    }

    if (type === 'stroke') {
      record.strokeCount++;
      return record.strokeCount <= 75; // 60/s with small headroom
    }
    if (type === 'chat') {
      record.chatCount++;
      return record.chatCount <= 6; // 5/s
    }
    return true;
  }

  clearSocketRateLimit(socketId) {
    this.rateLimits.delete(socketId);
  }

  // --- Room helpers ---
  getRoom(roomCode) {
    if (!roomCode) return null;
    return this.rooms.get(roomCode.toUpperCase().trim());
  }

  getPlayer(room, playerId) {
    return room?.players.get(playerId) || null;
  }

  getPlayerBySocket(socketId) {
    const roomCode = this.socketToRoom.get(socketId);
    const playerId = this.socketToPlayer.get(socketId);
    if (!roomCode || !playerId) return { room: null, player: null };
    const room = this.rooms.get(roomCode);
    const player = room?.players.get(playerId);
    return { room, player };
  }

  // Deduplicate nickname
  assignNickname(room, requestedNickname, existingPlayerId = null) {
    const sanitized = sanitizeNickname(requestedNickname);
    const existingNames = new Set();
    for (const [pId, p] of room.players.entries()) {
      if (pId !== existingPlayerId) {
        existingNames.add(p.nickname.toLowerCase());
      }
    }

    if (!existingNames.has(sanitized.toLowerCase())) {
      return sanitized;
    }

    let counter = 2;
    while (existingNames.has(`${sanitized} ${counter}`.toLowerCase())) {
      counter++;
    }
    return `${sanitized} ${counter}`;
  }

  // Create Room
  createRoom(socket, data) {
    let code = data.customCode ? data.customCode.toUpperCase().trim() : null;
    if (code) {
      if (this.rooms.has(code)) {
        socket.emit('error', {
          event: 'error',
          code: 'ROOM_CODE_TAKEN',
          message: 'That custom room code is already taken.',
          recoverable: true
        });
        return;
      }
    } else {
      const existing = new Set(this.rooms.keys());
      code = generateRoomCode(existing);
    }

    const playerId = `p_${Math.random().toString(36).substring(2, 9)}`;
    const nickname = sanitizeNickname(data.nickname);
    const avatar = data.avatar || { color: '#3B82F6', face: 0, accessory: 0 };

    const player = {
      id: playerId,
      clientId: data.clientId,
      socketId: socket.id,
      nickname,
      avatar,
      score: 0,
      turnScore: 0,
      hasGuessed: false,
      guessedAt: null,
      connected: true,
      disconnectedAt: null
    };

    const room = {
      code,
      hostId: playerId,
      settings: {
        rounds: 3,
        drawTime: 80,
        wordSet: 'default',
        maxPlayers: 8,
        hints: true,
        customWords: []
      },
      players: new Map([[playerId, player]]),
      kickedClientIds: new Set(),
      state: 'LOBBY',
      round: 0,
      turnOrder: [],
      turnIndex: -1,
      drawerId: null,
      currentWord: null,
      wordChoices: [],
      revealedIndexes: new Set(),
      hintTimers: [],
      canvasHistory: [],
      usedWords: new Set(),
      turnEndsAt: null,
      timer: null,
      graceTimer: null,
      pauseTimer: null,
      createdAt: Date.now(),
      lastActivityAt: Date.now()
    };

    this.rooms.set(code, room);
    this.socketToRoom.set(socket.id, code);
    this.socketToPlayer.set(socket.id, playerId);
    socket.join(code);

    this.logEvent(code, 'ROOM_CREATE', `Room ${code} created by ${player.nickname}`);
    this.sendRoomState(socket, room, playerId);
  }

  // Join Room
  joinRoom(socket, data) {
    const code = data.roomCode ? data.roomCode.toUpperCase().trim() : '';
    const room = this.rooms.get(code);

    if (!room) {
      socket.emit('error', {
        event: 'error',
        code: 'ROOM_NOT_FOUND',
        message: 'Room not found. Check the room code and try again.',
        recoverable: true
      });
      return;
    }

    if (room.kickedClientIds.has(data.clientId)) {
      socket.emit('error', {
        event: 'error',
        code: 'KICKED',
        message: 'You have been kicked from this room.',
        recoverable: false
      });
      return;
    }

    // Check reconnection by clientId
    let existingPlayer = null;
    for (const p of room.players.values()) {
      if (p.clientId === data.clientId) {
        existingPlayer = p;
        break;
      }
    }

    if (existingPlayer) {
      // Reconnect
      existingPlayer.connected = true;
      existingPlayer.socketId = socket.id;
      existingPlayer.disconnectedAt = null;

      // If drawer reconnected during grace period, cancel grace timer
      if (room.drawerId === existingPlayer.id && room.graceTimer) {
        clearTimeout(room.graceTimer);
        room.graceTimer = null;
        this.broadcastSystemMessage(room, `${existingPlayer.nickname} (the drawer) reconnected! Game resumes.`);
      }

      this.socketToRoom.set(socket.id, code);
      this.socketToPlayer.set(socket.id, existingPlayer.id);
      socket.join(code);

      this.sendRoomState(socket, room, existingPlayer.id);
      socket.to(code).emit('room:player_joined', { player: this.sanitizePlayer(existingPlayer) });

      // Send canvas history if in drawing/select
      if (room.canvasHistory.length > 0) {
        socket.emit('canvas:history', { history: room.canvasHistory });
      }
      return;
    }

    // New player join
    if (room.players.size >= room.settings.maxPlayers) {
      socket.emit('error', {
        event: 'error',
        code: 'ROOM_FULL',
        message: 'Room is full.',
        recoverable: true
      });
      return;
    }

    const playerId = `p_${Math.random().toString(36).substring(2, 9)}`;
    const nickname = this.assignNickname(room, data.nickname);
    const avatar = data.avatar || { color: '#3B82F6', face: 0, accessory: 0 };

    const newPlayer = {
      id: playerId,
      clientId: data.clientId,
      socketId: socket.id,
      nickname,
      avatar,
      score: 0,
      turnScore: 0,
      hasGuessed: false,
      guessedAt: null,
      connected: true,
      disconnectedAt: null
    };

    room.players.set(playerId, newPlayer);
    room.lastActivityAt = Date.now();

    // If game in progress, late joiner joins next round/turn order
    if (room.state !== 'LOBBY' && room.state !== 'GAME_OVER') {
      if (!room.turnOrder.includes(playerId)) {
        room.turnOrder.push(playerId);
      }
    }

    this.socketToRoom.set(socket.id, code);
    this.socketToPlayer.set(socket.id, playerId);
    socket.join(code);

    this.sendRoomState(socket, room, playerId);
    socket.to(code).emit('room:player_joined', { player: this.sanitizePlayer(newPlayer) });

    this.logEvent(code, 'PLAYER_JOIN', `${newPlayer.nickname} joined room ${code}`);
    this.broadcastSystemMessage(room, `${newPlayer.nickname} joined the room.`);

    // If game is in DRAWING state, send canvas history to new player
    if (room.state === 'DRAWING' && room.canvasHistory.length > 0) {
      socket.emit('canvas:history', { history: room.canvasHistory });
    }
  }

  // Update Room Settings (Host only)
  updateSettings(socket, settingsData) {
    const { room, player } = this.getPlayerBySocket(socket.id);
    if (!room || !player) return;

    if (room.hostId !== player.id) {
      socket.emit('error', {
        event: 'error',
        code: 'NOT_HOST',
        message: 'Only the host can update room settings.',
        recoverable: true
      });
      return;
    }

    if (room.state !== 'LOBBY') {
      socket.emit('error', {
        event: 'error',
        code: 'INVALID_STATE',
        message: 'Settings are locked once the game starts.',
        recoverable: true
      });
      return;
    }

    room.settings = { ...room.settings, ...settingsData };
    room.lastActivityAt = Date.now();

    this.io.to(room.code).emit('room:settings_updated', { settings: room.settings });
    this.broadcastSystemMessage(room, `Room settings updated.`);
  }

  // Kick Player (Host only)
  kickPlayer(socket, targetPlayerId) {
    const { room, player } = this.getPlayerBySocket(socket.id);
    if (!room || !player) return;

    if (room.hostId !== player.id) {
      socket.emit('error', {
        event: 'error',
        code: 'NOT_HOST',
        message: 'Only the host can kick players.',
        recoverable: true
      });
      return;
    }

    const targetPlayer = room.players.get(targetPlayerId);
    if (!targetPlayer || targetPlayer.id === player.id) return;

    room.kickedClientIds.add(targetPlayer.clientId);
    const targetSocket = this.io.sockets.sockets.get(targetPlayer.socketId);

    if (targetSocket) {
      targetSocket.emit('error', {
        event: 'error',
        code: 'KICKED',
        message: 'You were kicked from the room by the host.',
        recoverable: false
      });
      targetSocket.leave(room.code);
      this.socketToRoom.delete(targetSocket.id);
      this.socketToPlayer.delete(targetSocket.id);
    }

    room.players.delete(targetPlayerId);
    room.turnOrder = room.turnOrder.filter(id => id !== targetPlayerId);

    this.io.to(room.code).emit('room:player_left', { playerId: targetPlayerId });
    this.broadcastSystemMessage(room, `${targetPlayer.nickname} was kicked by the host.`);

    // Check if kicked player was drawer
    if (room.drawerId === targetPlayerId && room.state === 'DRAWING') {
      this.endTurn(room, 'Drawer was kicked.');
    } else {
      this.checkAllGuessed(room);
    }
  }

  // Start Game (Host only)
  startGame(socket) {
    const { room, player } = this.getPlayerBySocket(socket.id);
    if (!room || !player) return;

    if (room.hostId !== player.id) {
      socket.emit('error', {
        event: 'error',
        code: 'NOT_HOST',
        message: 'Only the host can start the game.',
        recoverable: true
      });
      return;
    }

    const connectedCount = Array.from(room.players.values()).filter(p => p.connected).length;
    if (connectedCount < 2) {
      socket.emit('error', {
        event: 'error',
        code: 'NOT_ENOUGH_PLAYERS',
        message: 'At least 2 players are required to start the game.',
        recoverable: true
      });
      return;
    }

    // Reset scores & game state
    for (const p of room.players.values()) {
      p.score = 0;
      p.turnScore = 0;
      p.hasGuessed = false;
      p.guessedAt = null;
    }

    // Set turn order from connected players (shuffled)
    const playerIds = Array.from(room.players.values())
      .filter(p => p.connected)
      .map(p => p.id)
      .sort(() => 0.5 - Math.random());

    room.turnOrder = playerIds;
    room.round = 1;
    room.turnIndex = 0;
    room.usedWords.clear();
    room.lastActivityAt = Date.now();

    this.logEvent(room.code, 'GAME_START', `Game started in room ${room.code} (${room.settings.rounds} rounds)`);
    this.broadcastSystemMessage(room, `Game started! Round 1 of ${room.settings.rounds}.`);
    this.startWordSelection(room);
  }

  // Start Word Selection (10s)
  startWordSelection(room) {
    this.clearTimers(room);

    // Pick drawer
    if (room.turnIndex >= room.turnOrder.length) {
      // Round completed
      room.round++;
      room.turnIndex = 0;
      if (room.round > room.settings.rounds) {
        this.endGame(room);
        return;
      }
      this.broadcastSystemMessage(room, `Round ${room.round} of ${room.settings.rounds}!`);
    }

    const drawerId = room.turnOrder[room.turnIndex];
    const drawer = room.players.get(drawerId);

    // If drawer is disconnected, skip or wait
    if (!drawer || !drawer.connected) {
      room.turnIndex++;
      this.startWordSelection(room);
      return;
    }

    room.state = 'WORD_SELECT';
    room.drawerId = drawerId;
    room.currentWord = null;
    room.canvasHistory = [];
    room.revealedIndexes = new Set();

    // Reset guessed flags
    for (const p of room.players.values()) {
      p.hasGuessed = false;
      p.guessedAt = null;
      p.turnScore = 0;
    }

    // Generate 3 words
    const choices = getRandomWords(
      3,
      room.settings.wordSet,
      room.settings.customWords,
      room.usedWords
    );
    room.wordChoices = choices;

    const selectDuration = 10000;
    room.turnEndsAt = Date.now() + selectDuration;

    // Send state change to everyone
    this.broadcastStateChange(room);

    this.broadcastSystemMessage(room, `${drawer.nickname} is choosing a word...`);

    // Timer: auto-pick word if drawer times out
    room.timer = setTimeout(() => {
      if (room.state === 'WORD_SELECT') {
        const autoPick = room.wordChoices[Math.floor(Math.random() * room.wordChoices.length)];
        this.selectWord(room, drawerId, autoPick);
      }
    }, selectDuration);
  }

  // Drawer selects a word
  selectWord(room, drawerId, word) {
    if (room.state !== 'WORD_SELECT' || room.drawerId !== drawerId) return;

    this.clearTimers(room);
    room.currentWord = word;
    room.usedWords.add(word.toLowerCase());
    room.state = 'DRAWING';
    room.revealedIndexes = new Set();
    room.canvasHistory = [];

    const drawTimeMs = room.settings.drawTime * 1000;
    room.turnEndsAt = Date.now() + drawTimeMs;

    this.logEvent(room.code, 'WORD_SELECT', `${room.players.get(drawerId)?.nickname || 'Drawer'} selected "${word}"`);
    this.broadcastStateChange(room);
    this.broadcastSystemMessage(room, `${room.players.get(drawerId)?.nickname} is drawing now! Start guessing!`);

    // Setup Hints at 50% and 75% elapsed time if enabled
    if (room.settings.hints) {
      const letters = [];
      const wordClean = room.currentWord;
      for (let i = 0; i < wordClean.length; i++) {
        if (wordClean[i] !== ' ' && wordClean[i] !== '-') {
          letters.push(i);
        }
      }

      const maxHints = Math.max(1, Math.floor(letters.length * 0.4)); // max 40%

      const revealHint = () => {
        if (room.state !== 'DRAWING') return;
        const unrevealed = letters.filter(idx => !room.revealedIndexes.has(idx));
        if (unrevealed.length > 0 && room.revealedIndexes.size < maxHints) {
          const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
          room.revealedIndexes.add(pick);
          const mask = createWordMask(room.currentWord, room.revealedIndexes);
          this.io.to(room.code).emit('game:hint', {
            wordMask: mask,
            revealedIndex: pick
          });
          this.broadcastSystemMessage(room, 'A hint was revealed!');
        }
      };

      const timer50 = setTimeout(revealHint, Math.floor(drawTimeMs * 0.5));
      const timer75 = setTimeout(revealHint, Math.floor(drawTimeMs * 0.75));
      room.hintTimers = [timer50, timer75];
    }

    // Turn expiration timer
    room.timer = setTimeout(() => {
      if (room.state === 'DRAWING') {
        this.endTurn(room, "Time's up!");
      }
    }, drawTimeMs);
  }

  // Canvas drawing stroke
  handleDrawStroke(socket, data) {
    const { room, player } = this.getPlayerBySocket(socket.id);
    if (!room || !player) return;

    if (room.state !== 'DRAWING' || room.drawerId !== player.id) {
      return; // Non-drawer canvas events dropped silently or logged
    }

    if (!this.checkRateLimit(socket.id, 'stroke')) return;

    // Check memory bound: max 5000 ops
    if (room.canvasHistory.length >= 5000) return;

    const op = {
      opId: data.strokeId,
      type: 'stroke',
      tool: data.tool,
      color: data.color,
      size: data.size,
      points: data.points,
      isStart: data.isStart,
      isEnd: data.isEnd
    };

    // If continuation of last stroke with same strokeId, append points
    const lastOp = room.canvasHistory[room.canvasHistory.length - 1];
    if (lastOp && lastOp.type === 'stroke' && lastOp.opId === data.strokeId && !data.isStart) {
      if (lastOp.points) {
        lastOp.points.push(...data.points);
      }
      lastOp.isEnd = data.isEnd;
    } else {
      room.canvasHistory.push(op);
    }

    // Broadcast to everyone else in room
    socket.to(room.code).emit('canvas:draw_stroke', data);
  }

  // Canvas flood fill
  handleFill(socket, data) {
    const { room, player } = this.getPlayerBySocket(socket.id);
    if (!room || !player) return;

    if (room.state !== 'DRAWING' || room.drawerId !== player.id) return;
    if (room.canvasHistory.length >= 5000) return;

    const op = {
      opId: data.opId,
      type: 'fill',
      x: data.x,
      y: data.y,
      color: data.color
    };

    room.canvasHistory.push(op);
    socket.to(room.code).emit('canvas:fill', data);
  }

  // Canvas undo
  handleUndo(socket) {
    const { room, player } = this.getPlayerBySocket(socket.id);
    if (!room || !player) return;

    if (room.state !== 'DRAWING' || room.drawerId !== player.id) return;
    if (room.canvasHistory.length === 0) return;

    room.canvasHistory.pop();
    this.io.to(room.code).emit('canvas:undo');
  }

  // Canvas clear
  handleClear(socket) {
    const { room, player } = this.getPlayerBySocket(socket.id);
    if (!room || !player) return;

    if (room.state !== 'DRAWING' || room.drawerId !== player.id) return;

    room.canvasHistory = [];
    this.io.to(room.code).emit('canvas:clear', { by: player.id });
  }

  // Chat Guess & Matching
  handleChatGuess(socket, text) {
    const { room, player } = this.getPlayerBySocket(socket.id);
    if (!room || !player) return;

    if (!this.checkRateLimit(socket.id, 'chat')) return;

    const rawText = text.trim();
    if (!rawText) return;

    // Check if room is in DRAWING state
    if (room.state !== 'DRAWING') {
      // Normal lobby/turn chat
      this.io.to(room.code).emit('chat:message', {
        id: `m_${Math.random().toString(36).substring(2, 9)}`,
        playerId: player.id,
        nickname: player.nickname,
        text: rawText,
        channel: 'public',
        ts: Date.now()
      });
      return;
    }

    // In DRAWING state:
    // If player is the drawer:
    if (player.id === room.drawerId) {
      // Drawer can only chat in guessed-only channel if they want, but cannot leak word
      const normalizedGuess = normalizeText(rawText);
      const normalizedTarget = normalizeText(room.currentWord);
      if (normalizedGuess.includes(normalizedTarget)) {
        socket.emit('chat:system', {
          kind: 'warning',
          text: 'You cannot give away the secret word!'
        });
        return;
      }

      // Send to guessed players and drawer
      this.sendGuessedChannelMessage(room, player, rawText);
      return;
    }

    // If guesser already guessed correctly:
    if (player.hasGuessed) {
      this.sendGuessedChannelMessage(room, player, rawText);
      return;
    }

    // Guesser has NOT guessed yet:
    const normalizedInput = normalizeText(rawText);
    const normalizedTarget = normalizeText(room.currentWord);

    // Check exact or plural/singular match
    if (checkWordMatch(rawText, room.currentWord)) {
      // Exact Match!
      player.hasGuessed = true;
      player.guessedAt = Date.now();

      // Compute scoring
      // T = draw time, t = seconds remaining when guess lands, n = guessers count, k = order
      const T = room.settings.drawTime;
      const t = Math.max(1, Math.round((room.turnEndsAt - Date.now()) / 1000));
      const totalGuessers = Array.from(room.players.values()).filter(
        p => p.connected && p.id !== room.drawerId
      ).length;
      const alreadyGuessedCount = Array.from(room.players.values()).filter(
        p => p.hasGuessed && p.id !== room.drawerId
      ).length; // k is this guesser's order (1 = first)
      const k = alreadyGuessedCount;

      const guesserPoints = Math.round(50 + 450 * (t / T));
      const orderBonus = Math.max(0, (totalGuessers - k)) * 10;
      const totalPoints = guesserPoints + orderBonus;

      player.turnScore = totalPoints;
      player.score += totalPoints;

      // Broadcast system message without leaking the text
      this.io.to(room.code).emit('chat:system', {
        kind: 'guessed',
        playerId: player.id,
        nickname: player.nickname,
        text: `${player.nickname} guessed the word!`,
        scoreDelta: totalPoints
      });

      // Update room state for players (score and hasGuessed)
      this.io.to(room.code).emit('room:player_updated', {
        player: this.sanitizePlayer(player)
      });

      // Check if all guessers have guessed
      this.checkAllGuessed(room);
      return;
    }

    // Check Levenshtein close guess: distance === 1 on words of 5+ letters
    if (normalizedTarget.length >= 5) {
      const dist = levenshteinDistance(normalizedInput, normalizedTarget);
      if (dist === 1) {
        // Send private nudge to sender only
        socket.emit('chat:system', {
          kind: 'close',
          text: `"${rawText}" is very close!`
        });
        return; // Don't broadcast near miss to others
      }
    }

    // Check if input contains secret word inside longer message to prevent spoiling
    if (normalizedTarget.length >= 3 && normalizedInput.includes(normalizedTarget)) {
      socket.emit('chat:system', {
        kind: 'warning',
        text: 'Your message contains the secret word!'
      });
      return; // Do not broadcast
    }

    // Otherwise, normal wrong guess / message -> broadcast to all
    this.io.to(room.code).emit('chat:message', {
      id: `m_${Math.random().toString(36).substring(2, 9)}`,
      playerId: player.id,
      nickname: player.nickname,
      text: rawText,
      channel: 'public',
      ts: Date.now()
    });
  }

  // Send message to guessed-only channel
  sendGuessedChannelMessage(room, player, text) {
    const msg = {
      id: `m_${Math.random().toString(36).substring(2, 9)}`,
      playerId: player.id,
      nickname: player.nickname,
      text,
      channel: 'guessed',
      ts: Date.now()
    };

    for (const p of room.players.values()) {
      if ((p.hasGuessed || p.id === room.drawerId) && p.socketId) {
        this.io.to(p.socketId).emit('chat:message', msg);
      }
    }
  }

  // Check if all guessers have guessed
  checkAllGuessed(room) {
    if (room.state !== 'DRAWING') return;

    const guessers = Array.from(room.players.values()).filter(
      p => p.connected && p.id !== room.drawerId
    );

    if (guessers.length > 0 && guessers.every(p => p.hasGuessed)) {
      this.broadcastSystemMessage(room, 'Everyone has guessed the word!');
      this.endTurn(room, 'Everyone guessed!');
    }
  }

  // End Turn & Tally (5s)
  endTurn(room, reason) {
    this.clearTimers(room);
    room.state = 'TURN_TALLY';

    // Calculate drawer points:
    // drawerPoints = round( average(guesserPoints of all correct guessers) * 0.5 ) + 20 * correctCount
    const drawer = room.players.get(room.drawerId);
    const correctGuessers = Array.from(room.players.values()).filter(
      p => p.id !== room.drawerId && p.hasGuessed
    );

    if (drawer) {
      if (correctGuessers.length > 0) {
        const avgGuesserPoints =
          correctGuessers.reduce((sum, p) => sum + p.turnScore, 0) / correctGuessers.length;
        const drawerScore = Math.round(avgGuesserPoints * 0.5) + (20 * correctGuessers.length);
        drawer.turnScore = drawerScore;
        drawer.score += drawerScore;
      } else {
        drawer.turnScore = 0;
      }
    }

    const scores = Array.from(room.players.values()).map(p => ({
      playerId: p.id,
      turnPoints: p.turnScore,
      total: p.score
    }));

    room.turnEndsAt = Date.now() + 5000;

    // Broadcast state change including the revealed word and scores
    this.broadcastStateChange(room, { scores, reason });
    this.broadcastSystemMessage(room, `The word was: ${room.currentWord}!`);

    // Advance to next turn after 5 seconds
    room.timer = setTimeout(() => {
      room.turnIndex++;
      this.startWordSelection(room);
    }, 5000);
  }

  // End Game & Final Leaderboard
  endGame(room) {
    this.clearTimers(room);
    room.state = 'GAME_OVER';
    room.turnEndsAt = null;

    // Leaderboard sorted by score descending
    const sorted = Array.from(room.players.values()).sort((a, b) => b.score - a.score);
    let rank = 1;
    const leaderboard = sorted.map((p, idx) => {
      if (idx > 0 && p.score < sorted[idx - 1].score) {
        rank = idx + 1;
      }
      return {
        playerId: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        score: p.score,
        rank
      };
    });

    this.broadcastStateChange(room, { leaderboard });
    this.broadcastSystemMessage(room, 'Game over! Check out the final leaderboard.');
  }

  // Rematch / Play Again
  rematch(socket) {
    const { room, player } = this.getPlayerBySocket(socket.id);
    if (!room || !player) return;

    if (room.hostId !== player.id) {
      socket.emit('error', {
        event: 'error',
        code: 'NOT_HOST',
        message: 'Only the host can start a rematch.',
        recoverable: true
      });
      return;
    }

    this.clearTimers(room);
    room.state = 'LOBBY';
    room.round = 0;
    room.turnIndex = -1;
    room.turnOrder = [];
    room.drawerId = null;
    room.currentWord = null;
    room.wordChoices = [];
    room.canvasHistory = [];
    room.revealedIndexes = new Set();
    room.usedWords.clear();

    for (const p of room.players.values()) {
      p.score = 0;
      p.turnScore = 0;
      p.hasGuessed = false;
      p.guessedAt = null;
    }

    this.io.to(room.code).emit('room:rematch');
    for (const p of room.players.values()) {
      const sock = this.io.sockets.sockets.get(p.socketId);
      if (sock) {
        this.sendRoomState(sock, room, p.id);
      }
    }
    this.broadcastSystemMessage(room, 'Rematch started! Back in lobby.');
  }

  // Disconnect handler
  handleDisconnect(socket) {
    const { room, player } = this.getPlayerBySocket(socket.id);
    this.clearSocketRateLimit(socket.id);
    this.socketToRoom.delete(socket.id);
    this.socketToPlayer.delete(socket.id);

    if (!room || !player) return;

    player.connected = false;
    player.socketId = null;
    player.disconnectedAt = Date.now();

    this.io.to(room.code).emit('room:player_updated', {
      player: this.sanitizePlayer(player)
    });
    this.broadcastSystemMessage(room, `${player.nickname} disconnected.`);

    // If host left, transfer host to next oldest connected player
    if (room.hostId === player.id) {
      const nextHost = Array.from(room.players.values()).find(p => p.connected);
      if (nextHost) {
        room.hostId = nextHost.id;
        this.io.to(room.code).emit('room:host_changed', { hostId: nextHost.id });
        this.broadcastSystemMessage(room, `${nextHost.nickname} is now the host.`);
      }
    }

    // Check connected players count
    const connectedPlayers = Array.from(room.players.values()).filter(p => p.connected);
    if (connectedPlayers.length < 2 && (room.state === 'DRAWING' || room.state === 'WORD_SELECT')) {
      this.broadcastSystemMessage(room, 'Not enough players connected. Waiting 30s before returning to lobby...');
      room.pauseTimer = setTimeout(() => {
        const stillConnected = Array.from(room.players.values()).filter(p => p.connected);
        if (stillConnected.length < 2 && room.state !== 'LOBBY' && room.state !== 'GAME_OVER') {
          room.state = 'LOBBY';
          this.broadcastStateChange(room);
          this.broadcastSystemMessage(room, 'Game returned to lobby due to lack of players.');
        }
      }, 30000);
    }

    // If drawer disconnected mid-turn:
    if (room.drawerId === player.id && (room.state === 'DRAWING' || room.state === 'WORD_SELECT')) {
      this.broadcastSystemMessage(room, `${player.nickname} (the drawer) disconnected. 10s grace period to reconnect...`);

      room.graceTimer = setTimeout(() => {
        if (!player.connected && room.drawerId === player.id && (room.state === 'DRAWING' || room.state === 'WORD_SELECT')) {
          this.broadcastSystemMessage(room, `Drawer failed to reconnect. Ending turn.`);
          this.endTurn(room, 'Drawer disconnected.');
        }
      }, 10000);
      return;
    }

    // If guesser disconnected, check if all remaining guessers have guessed
    this.checkAllGuessed(room);
  }

  // --- Broadcast & State helpers ---
  clearTimers(room) {
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }
    if (room.graceTimer) {
      clearTimeout(room.graceTimer);
      room.graceTimer = null;
    }
    if (room.pauseTimer) {
      clearTimeout(room.pauseTimer);
      room.pauseTimer = null;
    }
    if (room.hintTimers && room.hintTimers.length > 0) {
      room.hintTimers.forEach(t => clearTimeout(t));
      room.hintTimers = [];
    }
  }

  sanitizePlayer(p) {
    return {
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      score: p.score,
      turnScore: p.turnScore,
      hasGuessed: p.hasGuessed,
      connected: p.connected
    };
  }

  sendRoomState(socket, room, selfId) {
    socket.emit('room:state', {
      roomCode: room.code,
      selfId,
      hostId: room.hostId,
      settings: room.settings,
      players: Array.from(room.players.values()).map(p => this.sanitizePlayer(p)),
      state: room.state,
      round: room.round,
      totalRounds: room.settings.rounds,
      drawerId: room.drawerId,
      endsAt: room.turnEndsAt,
      serverTime: Date.now(),
      wordMask: room.currentWord ? createWordMask(room.currentWord, room.revealedIndexes) : '',
      wordLength: room.currentWord ? getWordLengths(room.currentWord) : [],
      wordChoices: room.drawerId === selfId ? room.wordChoices : [],
      word: (room.drawerId === selfId || room.state === 'TURN_TALLY' || room.state === 'GAME_OVER')
        ? room.currentWord
        : null
    });
  }

  broadcastStateChange(room, extra = {}) {
    const mask = room.currentWord ? createWordMask(room.currentWord, room.revealedIndexes) : '';
    const lengths = room.currentWord ? getWordLengths(room.currentWord) : [];

    for (const player of room.players.values()) {
      if (!player.connected || !player.socketId) continue;
      const sock = this.io.sockets.sockets.get(player.socketId);
      if (!sock) continue;

      const isDrawer = player.id === room.drawerId;
      const revealWord = isDrawer || room.state === 'TURN_TALLY' || room.state === 'GAME_OVER';

      sock.emit('game:state_change', {
        state: room.state,
        round: room.round,
        totalRounds: room.settings.rounds,
        turnIndex: room.turnIndex,
        drawerId: room.drawerId,
        endsAt: room.turnEndsAt,
        wordMask: mask,
        wordLength: lengths,
        word: revealWord ? room.currentWord : null,
        wordChoices: (isDrawer && room.state === 'WORD_SELECT') ? room.wordChoices : [],
        serverTime: Date.now(),
        ...extra
      });
    }
  }

  broadcastSystemMessage(room, text) {
    this.io.to(room.code).emit('chat:system', {
      kind: 'system',
      text,
      ts: Date.now()
    });
  }

  sweepRooms() {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      const connectedCount = Array.from(room.players.values()).filter(p => p.connected).length;
      const emptyTooLong = connectedCount === 0 && (now - room.lastActivityAt > 5 * 60 * 1000);
      const inactiveTooLong = now - room.lastActivityAt > 30 * 60 * 1000;

      if (emptyTooLong || inactiveTooLong) {
        this.clearTimers(room);
        this.rooms.delete(code);
      }
    }
  }
}

module.exports = GameManager;

