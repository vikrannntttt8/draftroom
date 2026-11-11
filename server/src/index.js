const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const GameManager = require('./game');
const {
  RoomCreateSchema,
  RoomJoinSchema,
  SettingsSchema,
  KickSchema,
  SelectWordSchema,
  DrawStrokeSchema,
  FillSchema,
  ChatGuessSchema
} = require('./schemas');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 15000,
  pingInterval: 10000
});

const gameManager = new GameManager(io);

io.on('connection', (socket) => {
  // Helper for Zod validation
  const validate = (schema, data, callback) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      socket.emit('error', {
        event: 'error',
        code: 'PAYLOAD_INVALID',
        message: 'Invalid payload sent to server: ' + result.error.errors.map(e => e.message).join(', '),
        recoverable: true
      });
      return false;
    }
    return true;
  };

  // --- Room Events ---
  socket.on('room:create', (data) => {
    if (!validate(RoomCreateSchema, data)) return;
    gameManager.createRoom(socket, data);
  });

  socket.on('room:join', (data) => {
    if (!validate(RoomJoinSchema, data)) return;
    gameManager.joinRoom(socket, data);
  });

  socket.on('room:update_settings', (data) => {
    if (!validate(SettingsSchema, data)) return;
    gameManager.updateSettings(socket, data);
  });

  socket.on('room:kick', (data) => {
    if (!validate(KickSchema, data)) return;
    gameManager.kickPlayer(socket, data.playerId);
  });

  // --- Game Flow Events ---
  socket.on('game:start', () => {
    gameManager.startGame(socket);
  });

  socket.on('game:select_word', (data) => {
    if (!validate(SelectWordSchema, data)) return;
    const { room, player } = gameManager.getPlayerBySocket(socket.id);
    if (!room || !player) return;
    gameManager.selectWord(room, player.id, data.word);
  });

  socket.on('game:rematch', () => {
    gameManager.rematch(socket);
  });

  // --- Canvas Events ---
  socket.on('canvas:draw_stroke', (data) => {
    if (!validate(DrawStrokeSchema, data)) return;
    gameManager.handleDrawStroke(socket, data);
  });

  socket.on('canvas:fill', (data) => {
    if (!validate(FillSchema, data)) return;
    gameManager.handleFill(socket, data);
  });

  socket.on('canvas:undo', () => {
    gameManager.handleUndo(socket);
  });

  socket.on('canvas:clear', () => {
    gameManager.handleClear(socket);
  });

  // --- Chat & Guess Events ---
  socket.on('chat:guess', (data) => {
    if (!validate(ChatGuessSchema, data)) return;
    gameManager.handleChatGuess(socket, data.text);
  });

  // --- Disconnect ---
  socket.on('disconnect', () => {
    gameManager.handleDisconnect(socket);
  });
});

server.listen(PORT, () => {
  console.log(`[DraftRoom Server] Listening on port ${PORT}`);
});
