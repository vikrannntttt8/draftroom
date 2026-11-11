'use client';

import React, { useState, useEffect } from 'react';
import { Player } from '../lib/types';
import { Avatar } from './Avatar';
import { Award, Clock } from 'lucide-react';

interface TurnTallyOverlayProps {
  word: string | null;
  drawer: Player | null;
  players: Player[];
  scores?: { playerId: string; turnPoints: number; total: number }[];
  endsAt: number | null;
}

export const TurnTallyOverlay: React.FC<TurnTallyOverlayProps> = ({
  word,
  drawer,
  players,
  scores = [],
  endsAt
}) => {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (!endsAt) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
      setSecondsLeft(left);
    }, 200);
    return () => clearInterval(interval);
  }, [endsAt]);

  // Map scores
  const scoreMap = new Map(scores.map(s => [s.playerId, s]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Round Summary
          </span>
          <h2 className="text-sm text-slate-300 mt-1">The word was:</h2>
          <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-pink-400 to-amber-300 uppercase tracking-widest mt-1">
            {word || '—'}
          </div>
        </div>

        {/* Scores list */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {players.map((p) => {
            const sc = scoreMap.get(p.id);
            const turnPoints = sc ? sc.turnPoints : p.turnScore || 0;
            const isDrawer = drawer && drawer.id === p.id;

            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80"
              >
                <div className="flex items-center gap-3">
                  <Avatar avatar={p.avatar} size={36} />
                  <div className="text-left">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                      <span>{p.nickname}</span>
                      {isDrawer && (
                        <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/50 px-1.5 py-0.2 rounded">
                          Drawer
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Total: {sc ? sc.total : p.score} pts
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {turnPoints > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                      <Award className="w-3 h-3" /> +{turnPoints}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">0 pts</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Next turn countdown */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 pt-2 border-t border-slate-800">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next turn in {secondsLeft} seconds</span>
        </div>
      </div>
    </div>
  );
};
