// DraftRoom Client Type Definitions

export type GameState = 'LOBBY' | 'WORD_SELECT' | 'DRAWING' | 'TURN_TALLY' | 'GAME_OVER';

export interface Avatar {
  color: string;
  face: number;
  accessory: number;
}

export interface Player {
  id: string;
  nickname: string;
  avatar: Avatar;
  score: number;
  turnScore?: number;
  hasGuessed: boolean;
  connected: boolean;
}

export interface RoomSettings {
  rounds: number;
  drawTime: number;
  wordSet: 'default' | 'easy' | 'hard' | 'custom-only' | 'default+custom';
  maxPlayers: number;
  hints: boolean;
  customWords: string[];
}

export interface StrokePoint {
  x: number; // 0 to 1
  y: number; // 0 to 1
}

export interface StrokeOp {
  opId: string;
  type: 'stroke' | 'fill';
  tool?: 'brush' | 'eraser';
  color: string;
  size?: number;
  points?: [number, number][];
  x?: number;
  y?: number;
  isStart?: boolean;
  isEnd?: boolean;
}

export interface ChatMessage {
  id: string;
  playerId?: string;
  nickname?: string;
  text: string;
  channel: 'public' | 'guessed';
  ts: number;
  kind?: 'message' | 'system' | 'guessed' | 'close' | 'warning';
  scoreDelta?: number;
}

export interface RoomStatePayload {
  roomCode: string;
  selfId: string;
  hostId: string;
  settings: RoomSettings;
  players: Player[];
  state: GameState;
  round: number;
  totalRounds: number;
  drawerId: string | null;
  endsAt: number | null;
  serverTime: number;
  wordMask: string;
  wordLength: number[];
  wordChoices?: string[];
  word?: string | null;
}

export interface StateChangePayload {
  state: GameState;
  round: number;
  totalRounds: number;
  turnIndex: number;
  drawerId: string | null;
  endsAt: number | null;
  wordMask: string;
  wordLength: number[];
  word?: string | null;
  wordChoices?: string[];
  serverTime: number;
  scores?: { playerId: string; turnPoints: number; total: number }[];
  reason?: string;
  leaderboard?: {
    playerId: string;
    nickname: string;
    avatar: Avatar;
    score: number;
    rank: number;
  }[];
}
