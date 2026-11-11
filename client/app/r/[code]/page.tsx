'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Socket } from 'socket.io-client';
import {
  Player,
  RoomSettings,
  GameState,
  ChatMessage,
  Avatar as AvatarType,
  RoomStatePayload,
  StateChangePayload
} from '../../../lib/types';
import { getSocket, getClientId } from '../../../lib/socket';
import { sound } from '../../../lib/sound';
import { GameHeader } from '../../../components/GameHeader';
import { PlayerList } from '../../../components/PlayerList';
import { DrawingCanvas } from '../../../components/DrawingCanvas';
import { ChatBox } from '../../../components/ChatBox';
import { LobbyView } from '../../../components/LobbyView';
import { WordChoiceModal } from '../../../components/WordChoiceModal';
import { TurnTallyOverlay } from '../../../components/TurnTallyOverlay';
import { GameOverModal } from '../../../components/GameOverModal';
import { AvatarPicker } from '../../../components/Avatar';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

function RoomPageContent() {
  const router = useRouter();
  const urlParams = useParams();
  const rawCode = (urlParams?.code as string) || '';
  const roomCode = rawCode.toUpperCase();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile modal if joining via direct link without profile
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<AvatarType>({
    color: '#3B82F6',
    face: 0,
    accessory: 0
  });

  // Room & Game state
  const [selfId, setSelfId] = useState<string>('');
  const [hostId, setHostId] = useState<string>('');
  const [gameState, setGameState] = useState<GameState>('LOBBY');
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<RoomSettings>({
    rounds: 3,
    drawTime: 80,
    wordSet: 'default',
    maxPlayers: 8,
    hints: true,
    customWords: []
  });
  const [round, setRound] = useState<number>(0);
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [wordMask, setWordMask] = useState<string>('');
  const [wordLength, setWordLength] = useState<number[]>([]);
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [turnEndsAt, setTurnEndsAt] = useState<number | null>(null);
  const [serverTime, setServerTime] = useState<number>(Date.now());
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Tally & Game Over data
  const [turnScores, setTurnScores] = useState<
    { playerId: string; turnPoints: number; total: number }[]
  >([]);
  const [leaderboard, setLeaderboard] = useState<
    {
      playerId: string;
      nickname: string;
      avatar: AvatarType;
      score: number;
      rank: number;
    }[]
  >([]);

  // 1. Check or load profile
  useEffect(() => {
    const savedName = localStorage.getItem('draftroom_nickname');
    const savedAvatar = localStorage.getItem('draftroom_avatar');

    if (savedName) {
      setNickname(savedName);
      let parsedAvatar = avatar;
      if (savedAvatar) {
        try {
          parsedAvatar = JSON.parse(savedAvatar);
          setAvatar(parsedAvatar);
        } catch {
          // ignore
        }
      }
      joinWithProfile(savedName, parsedAvatar);
    } else {
      setConnecting(false);
      setProfileModalOpen(true);
    }
  }, [roomCode]);

  // 2. Connect & Join Room
  const joinWithProfile = (nameToUse: string, avatarToUse: AvatarType) => {
    setConnecting(true);
    setProfileModalOpen(false);

    const sock = getSocket();
    setSocket(sock);

    if (!sock.connected) {
      sock.connect();
    }

    const clientId = getClientId();

    // Listen for room state
    sock.on('room:state', (data: RoomStatePayload) => {
      setConnecting(false);
      setSelfId(data.selfId);
      setHostId(data.hostId);
      setGameState(data.state);
      setPlayers(data.players);
      setSettings(data.settings);
      setRound(data.round);
      setTotalRounds(data.totalRounds);
      setDrawerId(data.drawerId);
      setWordMask(data.wordMask || '');
      setWordLength(data.wordLength || []);
      setCurrentWord(data.word || null);
      if (data.wordChoices) setWordChoices(data.wordChoices);
      setTurnEndsAt(data.endsAt);
      setServerTime(data.serverTime);
    });

    // Roster events
    sock.on('room:player_joined', (data: { player: Player }) => {
      setPlayers((prev) => {
        const filtered = prev.filter((p) => p.id !== data.player.id);
        return [...filtered, data.player];
      });
    });

    sock.on('room:player_left', (data: { playerId: string }) => {
      setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
    });

    sock.on('room:player_updated', (data: { player: Player }) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === data.player.id ? { ...p, ...data.player } : p))
      );
    });

    sock.on('room:host_changed', (data: { hostId: string }) => {
      setHostId(data.hostId);
    });

    sock.on('room:settings_updated', (data: { settings: RoomSettings }) => {
      setSettings(data.settings);
    });

    sock.on('room:rematch', () => {
      setGameState('LOBBY');
      setRound(0);
      setDrawerId(null);
      setCurrentWord(null);
      setWordMask('');
      setTurnEndsAt(null);
      setTurnScores([]);
      setLeaderboard([]);
    });

    // Game state transitions
    sock.on('game:state_change', (data: StateChangePayload) => {
      setGameState(data.state);
      setRound(data.round);
      setTotalRounds(data.totalRounds);
      setDrawerId(data.drawerId);
      setWordMask(data.wordMask || '');
      setWordLength(data.wordLength || []);
      setCurrentWord(data.word || null);
      if (data.wordChoices) setWordChoices(data.wordChoices);
      setTurnEndsAt(data.endsAt);
      setServerTime(data.serverTime);

      if (data.scores) setTurnScores(data.scores);
      if (data.leaderboard) setLeaderboard(data.leaderboard);

      // Play audio cues
      if (data.state === 'WORD_SELECT') {
        sound.playTurnStart();
      } else if (data.state === 'TURN_TALLY') {
        sound.playRoundEnd();
      } else if (data.state === 'GAME_OVER') {
        sound.playGameOver();
      }
    });

    sock.on('game:hint', (data: { wordMask: string }) => {
      setWordMask(data.wordMask);
    });

    // Chat events
    sock.on('chat:message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    sock.on('chat:system', (sys: ChatMessage) => {
      setMessages((prev) => [...prev, sys]);
      if (sys.kind === 'guessed') {
        sound.playCorrectGuess();
      } else if (sys.kind === 'close') {
        sound.playCloseGuess();
      }
    });

    // Error events
    sock.on('error', (err: { message: string; code?: string; recoverable?: boolean }) => {
      setErrorMessage(err.message || 'An error occurred.');
      setConnecting(false);
    });

    // Emit join
    sock.emit('room:join', {
      roomCode,
      nickname: nameToUse,
      avatar: avatarToUse,
      clientId
    });
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 16) {
      setErrorMessage('Nickname must be between 2 and 16 characters.');
      return;
    }

    localStorage.setItem('draftroom_nickname', trimmed);
    localStorage.setItem('draftroom_avatar', JSON.stringify(avatar));
    joinWithProfile(trimmed, avatar);
  };

  const handleSelectWord = (word: string) => {
    if (!socket) return;
    socket.emit('game:select_word', { word });
  };

  const handleKickPlayer = (playerId: string) => {
    if (!socket) return;
    socket.emit('room:kick', { playerId });
  };

  const handleRematch = () => {
    if (!socket) return;
    socket.emit('game:rematch');
  };

  const selfPlayer = players.find((p) => p.id === selfId) || null;
  const currentDrawer = players.find((p) => p.id === drawerId) || null;
  const isDrawer = selfId === drawerId;
  const hasGuessed = selfPlayer ? selfPlayer.hasGuessed : false;
  const isHost = selfId === hostId;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.off('room:state');
        socket.off('room:player_joined');
        socket.off('room:player_left');
        socket.off('room:player_updated');
        socket.off('room:host_changed');
        socket.off('room:settings_updated');
        socket.off('room:rematch');
        socket.off('game:state_change');
        socket.off('game:hint');
        socket.off('chat:message');
        socket.off('chat:system');
        socket.off('error');
      }
    };
  }, [socket]);

  // Loading Screen
  if (connecting) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <h2 className="text-xl font-bold tracking-tight">Connecting to Room {roomCode}...</h2>
        <p className="text-xs text-slate-400">Syncing with game server...</p>
      </div>
    );
  }

  // Profile Prompt Modal
  if (profileModalOpen) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Join Room {roomCode}
            </span>
            <h2 className="text-2xl font-black text-white mt-1">Set Up Your Profile</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose your nickname and avatar to jump right in.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname..."
                maxLength={16}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-bold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <AvatarPicker value={avatar} onChange={setAvatar} />

            <button
              type="submit"
              disabled={!nickname.trim()}
              className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg transition-all cursor-pointer"
            >
              Enter Game Room
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Room Not Found or Fatal Error
  if (errorMessage && players.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 mb-2">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-white">Unable to Join Room</h2>
        <p className="text-sm text-slate-400 max-w-md">{errorMessage}</p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <GameHeader
        roomCode={roomCode}
        round={round}
        totalRounds={totalRounds}
        isDrawer={isDrawer}
        word={currentWord}
        wordMask={wordMask}
        wordLength={wordLength}
        endsAt={turnEndsAt}
        serverTime={serverTime}
      />

      {/* Main Game Stage */}
      <main className="flex-1 p-3 sm:p-5 flex flex-col items-center justify-start">
        {/* LOBBY State */}
        {gameState === 'LOBBY' ? (
          <LobbyView
            socket={socket}
            roomCode={roomCode}
            selfId={selfId}
            hostId={hostId}
            players={players}
            settings={settings}
          />
        ) : (
          /* Active Playing State: WORD_SELECT, DRAWING, TURN_TALLY, GAME_OVER */
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
            {/* Left Column: Player Leaderboard / Roster */}
            <div className="order-2 lg:order-1 lg:col-span-3 w-full">
              <PlayerList
                players={players}
                selfId={selfId}
                hostId={hostId}
                drawerId={drawerId}
                onKick={handleKickPlayer}
              />
            </div>

            {/* Center Column: Drawing Canvas */}
            <div className="order-1 lg:order-2 lg:col-span-6 w-full flex flex-col items-center">
              <DrawingCanvas
                socket={socket}
                isDrawer={isDrawer && gameState === 'DRAWING'}
              />
            </div>

            {/* Right Column: Chat & Guesses Box */}
            <div className="order-3 lg:order-3 lg:col-span-3 w-full">
              <ChatBox
                socket={socket}
                messages={messages}
                selfPlayer={selfPlayer}
                isDrawer={isDrawer}
                hasGuessed={hasGuessed}
                isDrawingState={gameState === 'DRAWING'}
              />
            </div>
          </div>
        )}
      </main>

      {/* Word Selection Modal (Drawer only) */}
      {gameState === 'WORD_SELECT' && isDrawer && (
        <WordChoiceModal
          words={wordChoices}
          endsAt={turnEndsAt}
          serverTime={serverTime}
          onSelectWord={handleSelectWord}
        />
      )}

      {/* Turn Tally Overlay */}
      {gameState === 'TURN_TALLY' && (
        <TurnTallyOverlay
          word={currentWord}
          drawer={currentDrawer}
          players={players}
          scores={turnScores}
          endsAt={turnEndsAt}
        />
      )}

      {/* Final Game Over Leaderboard Podium Modal */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          isHost={isHost}
          leaderboard={leaderboard}
          onRematch={handleRematch}
        />
      )}
    </div>
  );
}

export default function RoomPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <h2 className="text-xl font-bold tracking-tight">Loading Room...</h2>
        </div>
      }
    >
      <RoomPageContent />
    </React.Suspense>
  );
}
