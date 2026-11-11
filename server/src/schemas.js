const { z } = require('zod');

const AvatarSchema = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#3B82F6'),
  face: z.number().int().min(0).max(11).default(0),
  accessory: z.number().int().min(0).max(11).default(0)
});

const RoomCreateSchema = z.object({
  nickname: z.string().min(2).max(16),
  avatar: AvatarSchema.optional(),
  clientId: z.string().min(1).max(64),
  customCode: z.string().regex(/^[A-Za-z]{4}$/).optional()
});

const RoomJoinSchema = z.object({
  roomCode: z.string().min(4).max(10),
  nickname: z.string().min(2).max(16),
  avatar: AvatarSchema.optional(),
  clientId: z.string().min(1).max(64)
});

const SettingsSchema = z.object({
  rounds: z.number().int().min(2).max(10).default(3),
  drawTime: z.number().int().min(30).max(180).default(80),
  wordSet: z.enum(['default', 'easy', 'hard', 'custom-only', 'default+custom']).default('default'),
  maxPlayers: z.number().int().min(2).max(12).default(8),
  hints: z.boolean().default(true),
  customWords: z.array(z.string().min(1).max(30)).max(100).default([])
});

const KickSchema = z.object({
  playerId: z.string().min(1)
});

const SelectWordSchema = z.object({
  word: z.string().min(1).max(50)
});

const PointSchema = z.tuple([
  z.number().min(0).max(1),
  z.number().min(0).max(1)
]);

const DrawStrokeSchema = z.object({
  strokeId: z.string().min(1).max(64),
  tool: z.enum(['brush', 'eraser']).default('brush'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  size: z.number().min(1).max(60),
  points: z.array(PointSchema).min(1).max(50),
  isStart: z.boolean().default(false),
  isEnd: z.boolean().default(false)
});

const FillSchema = z.object({
  opId: z.string().min(1).max(64),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/)
});

const ChatGuessSchema = z.object({
  text: z.string().min(1).max(100)
});

module.exports = {
  AvatarSchema,
  RoomCreateSchema,
  RoomJoinSchema,
  SettingsSchema,
  KickSchema,
  SelectWordSchema,
  DrawStrokeSchema,
  FillSchema,
  ChatGuessSchema
};

