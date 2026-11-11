'use client';

import React from 'react';
import { Player } from '../lib/types';
import { Avatar } from './Avatar';
import { Crown, Pencil, CheckCircle2, WifiOff, UserX } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  selfId: string;
  hostId: string;
  drawerId: string | null;
  onKick?: (playerId: string) => void;
  className?: string;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  selfId,
  hostId,
  drawerId,
  onKick,
  className = ''
}) => {
  // Sort players by score descending
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const isHost = selfId === hostId;

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <span className="font-bold text-sm text-slate-200">Players</span>
        <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
          {players.length}
        </span>
      </div>

      {/* Players List */}
      <div className="p-2 space-y-1.5 overflow-y-auto max-h-[460px]">
        {sorted.map((p, idx) => {
          const isMe = p.id === selfId;
          const isDrawer = p.id === drawerId;
          const isPlayerHost = p.id === hostId;

          return (
            <div
              key={p.id}
              className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                isMe
                  ? 'bg-indigo-950/40 border border-indigo-800/40'
                  : 'bg-slate-950/50 border border-slate-800/60'
              } ${!p.connected ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[11px] font-bold text-slate-500 w-4 text-center shrink-0">
                  #{idx + 1}
                </span>

                <div className="relative shrink-0">
                  <Avatar avatar={p.avatar} size={34} />
                  {isPlayerHost && (
                    <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1.5 -right-1 bg-slate-950 rounded-full" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white truncate max-w-[100px] sm:max-w-[120px]">
                      {p.nickname}
                    </span>
                    {isMe && (
                      <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950 px-1 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400">
                    {p.score} pts
                  </div>
                </div>
              </div>

              {/* Status Badges & Kick button */}
              <div className="flex items-center gap-1.5 shrink-0">
                {!p.connected && (
                  <span title="Disconnected (Waiting to reconnect)" className="text-red-400">
                    <WifiOff className="w-3.5 h-3.5" />
                  </span>
                )}

                {isDrawer && (
                  <span
                    title="Current Drawer"
                    className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-amber-950/70 border border-amber-800/50 px-1.5 py-0.5 rounded-md"
                  >
                    <Pencil className="w-3 h-3 animate-bounce" />
                    <span className="hidden sm:inline">Drawing</span>
                  </span>
                )}

                {p.hasGuessed && !isDrawer && (
                  <span
                    title="Guessed Correctly!"
                    className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-1.5 py-0.5 rounded-md"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Guessed</span>
                  </span>
                )}

                {/* Host kick button */}
                {isHost && !isMe && onKick && (
                  <button
                    type="button"
                    onClick={() => onKick(p.id)}
                    title={`Kick ${p.nickname}`}
                    className="p-1 hover:bg-red-950/80 text-slate-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

