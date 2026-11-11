const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

const GameManager = require('../src/game');
const {
  RoomCreateSchema,
  RoomJoinSchema,
  SettingsSchema,
  KickSchema,
  SelectWordSchema,
  DrawStrokeSchema,
  FillSchema,
  ChatGuessSchema
} = require('../src/schemas');

const { renderDashboardHtml } = require('../src/dashboard');

function createTestServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  const gameManager = new GameManager(io);

  app.get('/', (req, res) => {
    res.send(renderDashboardHtml());
  });

  app.get('/api/status', (req, res) => {
    res.json(gameManager.getDebugStats());
  });

  io.on('connection', (socket) => {
    socket.on('room:create', (data) => gameManager.createRoom(socket, data));
    socket.on('room:join', (data) => gameManager.joinRoom(socket, data));
    socket.on('room:update_settings', (data) => gameManager.updateSettings(socket, data));
    socket.on('room:kick', (data) => gameManager.kickPlayer(socket, data.playerId));
    socket.on('game:start', () => gameManager.startGame(socket));
    socket.on('game:select_word', (data) => {
      const { room, player } = gameManager.getPlayerBySocket(socket.id);
      if (room && player) gameManager.selectWord(room, player.id, data.word);
    });
    socket.on('canvas:draw_stroke', (data) => gameManager.handleDrawStroke(socket, data));
    socket.on('canvas:fill', (data) => gameManager.handleFill(socket, data));
    socket.on('canvas:undo', () => gameManager.handleUndo(socket));
    socket.on('canvas:clear', () => gameManager.handleClear(socket));
    socket.on('chat:guess', (data) => gameManager.handleChatGuess(socket, data.text));
    socket.on('game:rematch', () => gameManager.rematch(socket));
    socket.on('disconnect', () => gameManager.handleDisconnect(socket));
  });

  return { server, gameManager, io };
}

test('End-to-End Game Lifecycle: Create, Join, Settings, Draw, Guess, Score, Tally', async (t) => {
  const { server, gameManager, io } = createTestServer();

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const url = `http://localhost:${port}`;

  const client1 = Client(url);
  const client2 = Client(url);

  await new Promise((resolve) => {
    let connected = 0;
    const check = () => {
      connected++;
      if (connected === 2) resolve();
    };
    client1.on('connect', check);
    client2.on('connect', check);
  });

  let roomCode = null;
  let client1State = null;
  let client2State = null;

  // 1. Client 1 creates room
  const createPromise = new Promise((resolve) => {
    client1.once('room:state', (state) => {
      roomCode = state.roomCode;
      client1State = state;
      resolve(state);
    });
  });

  client1.emit('room:create', {
    nickname: 'Aisha',
    clientId: 'client_aisha_123'
  });

  await createPromise;
  assert.ok(roomCode, 'Room code should be generated');
  assert.strictEqual(client1State.state, 'LOBBY');
  assert.strictEqual(client1State.players.length, 1);
  assert.strictEqual(client1State.players[0].nickname, 'Aisha');

  // 2. Client 2 joins room
  const joinPromise = new Promise((resolve) => {
    client2.once('room:state', (state) => {
      client2State = state;
      resolve(state);
    });
  });

  client2.emit('room:join', {
    roomCode,
    nickname: 'Rohan',
    clientId: 'client_rohan_456'
  });

  await joinPromise;
  assert.strictEqual(client2State.players.length, 2);

  // 3. Update settings
  const settingsPromise = new Promise((resolve) => {
    client2.once('room:settings_updated', (data) => {
      resolve(data);
    });
  });

  client1.emit('room:update_settings', {
    rounds: 2,
    drawTime: 60,
    wordSet: 'default',
    maxPlayers: 6,
    hints: true,
    customWords: ['rocket', 'banana']
  });

  const updatedSettings = await settingsPromise;
  assert.strictEqual(updatedSettings.settings.drawTime, 60);

  // 4. Start Game
  const startPromise = new Promise((resolve) => {
    let received = 0;
    const handleState = (data) => {
      if (data.state === 'WORD_SELECT') {
        received++;
        if (received === 2) resolve(data);
      }
    };
    client1.on('game:state_change', handleState);
    client2.on('game:state_change', handleState);
  });

  client1.emit('game:start');
  const wordSelectState = await startPromise;

  assert.strictEqual(wordSelectState.state, 'WORD_SELECT');
  const drawerId = wordSelectState.drawerId;
  assert.ok(drawerId, 'Drawer should be selected');

  const drawerClient = drawerId === client1State.selfId ? client1 : client2;
  const guesserClient = drawerId === client1State.selfId ? client2 : client1;

  // 5. Drawer picks a word
  const drawingPromise = new Promise((resolve) => {
    let count = 0;
    const handleState = (data) => {
      if (data.state === 'DRAWING') {
        count++;
        if (count === 2) resolve(data);
      }
    };
    client1.on('game:state_change', handleState);
    client2.on('game:state_change', handleState);
  });

  drawerClient.emit('game:select_word', { word: 'rocket' });
  const drawingState = await drawingPromise;
  assert.strictEqual(drawingState.state, 'DRAWING');

  // Guesser sees mask, not the word
  assert.ok(drawingState.wordMask.includes('_'), 'Guesser receives masked word');

  // 6. Stroke broadcast
  const strokePromise = new Promise((resolve) => {
    guesserClient.once('canvas:draw_stroke', (stroke) => {
      resolve(stroke);
    });
  });

  drawerClient.emit('canvas:draw_stroke', {
    strokeId: 's_test_1',
    tool: 'brush',
    color: '#FF0000',
    size: 6,
    points: [[0.1, 0.1], [0.2, 0.2]],
    isStart: true,
    isEnd: false
  });

  const receivedStroke = await strokePromise;
  assert.strictEqual(receivedStroke.strokeId, 's_test_1');

  // 7. Close guess detection (Levenshtein distance = 1 on word of 5+ letters)
  const closePromise = new Promise((resolve) => {
    guesserClient.once('chat:system', (sys) => {
      if (sys.kind === 'close') {
        resolve(sys);
      }
    });
  });

  guesserClient.emit('chat:guess', { text: 'rocke' });
  const closeMsg = await closePromise;
  assert.ok(closeMsg.text.includes('close'), 'Nudge says close');

  // 8. Correct guess submission
  const guessPromise = new Promise((resolve) => {
    drawerClient.once('chat:system', (sys) => {
      if (sys.kind === 'guessed') {
        resolve(sys);
      }
    });
  });

  guesserClient.emit('chat:guess', { text: 'rocket' });
  const correctMsg = await guessPromise;
  assert.strictEqual(correctMsg.kind, 'guessed');
  assert.ok(correctMsg.scoreDelta > 0, 'Score delta awarded');

  // 9. Verify Backend Observer Dashboard & API
  const dashboardRes = await fetch(url + '/');
  assert.strictEqual(dashboardRes.status, 200);
  const dashboardHtml = await dashboardRes.text();
  assert.ok(dashboardHtml.includes('DRAFTROOM'), 'Dashboard includes brand title');

  const statusRes = await fetch(url + '/api/status');
  assert.strictEqual(statusRes.status, 200);
  const statusJson = await statusRes.json();
  assert.strictEqual(statusJson.activeRoomsCount, 1);
  assert.strictEqual(statusJson.rooms[0].code, roomCode);
  assert.ok(statusJson.recentEvents.length > 0, 'Recent events logged');

  // Cleanup
  client1.disconnect();
  client2.disconnect();
  clearInterval(gameManager.sweeperInterval);
  await new Promise((resolve) => server.close(resolve));
});

