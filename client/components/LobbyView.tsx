'use client';

import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { Player, RoomSettings } from '../lib/types';
import { Avatar } from './Avatar';
import {
  Users,
  Settings,
  Play,
  Copy,
  Check,
  Crown,
  Sparkles,
  Sliders,
  HelpCircle
} from 'lucide-react';

interface LobbyViewProps {
  socket: Socket | null;
  roomCode: string;
  selfId: string;
  hostId: string;
  players: Player[];
  settings: RoomSettings;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  socket,
  roomCode,
  selfId,
  hostId,
  players,
  settings
}) => {
  const isHost = selfId === hostId;
  const [copied, setCopied] = useState(false);

  // Local settings edit state for host
  const [localSettings, setLocalSettings] = useState<RoomSettings>(settings);
  const [customWordsText, setCustomWordsText] = useState(
    settings.customWords ? settings.customWords.join(', ') : ''
  );

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/r/${roomCode}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpdateSettings = (newSettings: Partial<RoomSettings>) => {
    const updated = { ...localSettings, ...newSettings };
    setLocalSettings(updated);
    if (socket && isHost) {
      socket.emit('room:update_settings', updated);
    }
  };

  const handleCustomWordsBlur = () => {
    const words = customWordsText
      .split(',')
      .map((w) => w.trim())
      .filter((w) => w.length > 0 && w.length <= 30)
      .slice(0, 100);

    handleUpdateSettings({ customWords: words });
  };

  const handleStartGame = () => {
    if (!socket || !isHost) return;
    socket.emit('game:start');
  };

  const canStart = players.length >= 2;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Invite & Room Code */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Lobby
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Room Code:</span>
            <span className="font-mono text-indigo-400 bg-slate-950 px-3 py-0.5 rounded-xl border border-slate-800">
              {roomCode}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Share this code or link with your friends to play together!
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Player Roster */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Players in Lobby ({players.length} / {settings.maxPlayers})</span>
            </h3>
            {canStart ? (
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                Ready to Start
              </span>
            ) : (
              <span className="text-xs text-amber-400 font-semibold bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-full">
                Waiting for players (min 2)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {players.map((p) => {
              const isPlayerHost = p.id === hostId;
              const isMe = p.id === selfId;

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl flex items-center gap-3 border transition-all ${
                    isMe
                      ? 'bg-indigo-950/40 border-indigo-800/50'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar avatar={p.avatar} size={42} />
                    {isPlayerHost && (
                      <Crown className="w-4 h-4 text-amber-400 absolute -top-1.5 -right-1 bg-slate-950 rounded-full" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white truncate">
                      {p.nickname}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isPlayerHost ? (
                        <span className="text-amber-400 font-medium">Room Host</span>
                      ) : isMe ? (
                        <span className="text-indigo-400 font-medium">You</span>
                      ) : (
                        'Player'
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Start Game Action */}
          <div className="pt-4 border-t border-slate-800">
            {isHost ? (
              <button
                type="button"
                onClick={handleStartGame}
                disabled={!canStart}
                className={`w-full py-4 px-6 rounded-2xl font-black text-base shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  canStart
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white transform hover:-translate-y-0.5'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{canStart ? 'Start Game' : 'Need at least 2 players to start'}</span>
              </button>
            ) : (
              <div className="text-center py-3 px-4 bg-slate-950/50 rounded-2xl border border-slate-800 text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                <span>Waiting for host to start the game...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Room Settings */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>Room Settings</span>
            </h3>
            {!isHost && (
              <span className="text-[11px] text-slate-500 italic">Host only</span>
            )}
          </div>

          <div className="space-y-4">
            {/* Rounds */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Rounds</span>
                <span className="text-indigo-400 font-bold">{localSettings.rounds}</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                value={localSettings.rounds}
                disabled={!isHost}
                onChange={(e) => handleUpdateSettings({ rounds: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>2</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            {/* Draw Time */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Draw Time per Turn</span>
                <span className="text-indigo-400 font-bold">{localSettings.drawTime}s</span>
              </div>
              <input
                type="range"
                min={30}
                max={180}
                step={10}
                value={localSettings.drawTime}
                disabled={!isHost}
                onChange={(e) => handleUpdateSettings({ drawTime: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>30s</span>
                <span>80s</span>
                <span>180s</span>
              </div>
            </div>

            {/* Word Set Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Word Pack
              </label>
              <select
                value={localSettings.wordSet}
                disabled={!isHost}
                onChange={(e) =>
                  handleUpdateSettings({
                    wordSet: e.target.value as RoomSettings['wordSet']
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-medium rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 cursor-pointer"
              >
                <option value="default">Default (Mixed Words)</option>
                <option value="easy">Easy (Simple Objects)</option>
                <option value="hard">Hard (Complex & Abstract)</option>
                <option value="custom-only">Custom Words Only</option>
                <option value="default+custom">Default + Custom Words</option>
              </select>
            </div>

            {/* Hints Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">Letter Hints</span>
                <span className="text-[10px] text-slate-500">
                  Reveal letters at 50% & 75% elapsed time
                </span>
              </div>
              <button
                type="button"
                disabled={!isHost}
                onClick={() => handleUpdateSettings({ hints: !localSettings.hints })}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:cursor-not-allowed ${
                  localSettings.hints ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    localSettings.hints ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Max Players */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Max Players</span>
                <span className="text-indigo-400 font-bold">{localSettings.maxPlayers}</span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                value={localSettings.maxPlayers}
                disabled={!isHost}
                onChange={(e) => handleUpdateSettings({ maxPlayers: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>

            {/* Custom Words (if custom selected) */}
            {(localSettings.wordSet === 'custom-only' ||
              localSettings.wordSet === 'default+custom') && (
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  Custom Words (comma-separated, max 100)
                </label>
                <textarea
                  value={customWordsText}
                  disabled={!isHost}
                  onChange={(e) => setCustomWordsText(e.target.value)}
                  onBlur={handleCustomWordsBlur}
                  rows={2}
                  placeholder="pizza, telescope, time machine, matrix..."
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

