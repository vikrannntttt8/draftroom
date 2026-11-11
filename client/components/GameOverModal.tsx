'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Avatar } from './Avatar';
import { Avatar as AvatarType } from '../lib/types';
import { Trophy, Crown, RotateCcw, Medal } from 'lucide-react';

interface GameOverModalProps {
  isHost: boolean;
  leaderboard?: {
    playerId: string;
    nickname: string;
    avatar: AvatarType;
    score: number;
    rank: number;
  }[];
  onRematch: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isHost,
  leaderboard = [],
  onRematch
}) => {
  // Trigger fireworks confetti
  useEffect(() => {
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 }
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <Trophy className="w-3.5 h-3.5" /> Match Completed
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Final Leaderboard
          </h2>
        </div>

        {/* Podium for top 3 */}
        {leaderboard.length > 0 && (
          <div className="flex items-end justify-center gap-2 sm:gap-4 pt-4 pb-2">
            {/* 2nd place */}
            {second && (
              <div className="flex flex-col items-center w-24 sm:w-28 space-y-1.5">
                <Avatar avatar={second.avatar} size={48} className="ring-2 ring-slate-400" />
                <div className="font-bold text-xs text-white truncate max-w-full">
                  {second.nickname}
                </div>
                <div className="text-[11px] text-slate-400 font-semibold">{second.score} pts</div>
                <div className="w-full h-20 bg-gradient-to-t from-slate-800 to-slate-700/80 rounded-t-2xl flex flex-col items-center justify-center border-t-2 border-slate-400 shadow-md">
                  <Medal className="w-5 h-5 text-slate-300 mb-0.5" />
                  <span className="text-xs font-black text-slate-200">#2</span>
                </div>
              </div>
            )}

            {/* 1st place */}
            {first && (
              <div className="flex flex-col items-center w-28 sm:w-32 space-y-2 relative">
                <div className="relative">
                  <Crown className="w-6 h-6 text-amber-400 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce" />
                  <Avatar avatar={first.avatar} size={60} className="ring-4 ring-amber-400 shadow-lg" />
                </div>
                <div className="font-black text-sm text-amber-300 truncate max-w-full">
                  {first.nickname}
                </div>
                <div className="text-xs text-amber-200/80 font-bold">{first.score} pts</div>
                <div className="w-full h-28 bg-gradient-to-t from-amber-600/90 to-amber-500 rounded-t-2xl flex flex-col items-center justify-center border-t-2 border-amber-300 shadow-xl">
                  <Trophy className="w-7 h-7 text-white mb-0.5" />
                  <span className="text-sm font-black text-white">WINNER</span>
                </div>
              </div>
            )}

            {/* 3rd place */}
            {third && (
              <div className="flex flex-col items-center w-24 sm:w-28 space-y-1.5">
                <Avatar avatar={third.avatar} size={44} className="ring-2 ring-amber-700" />
                <div className="font-bold text-xs text-white truncate max-w-full">
                  {third.nickname}
                </div>
                <div className="text-[11px] text-slate-400 font-semibold">{third.score} pts</div>
                <div className="w-full h-16 bg-gradient-to-t from-amber-900/60 to-amber-800/80 rounded-t-2xl flex flex-col items-center justify-center border-t-2 border-amber-700 shadow-md">
                  <Medal className="w-4 h-4 text-amber-600 mb-0.5" />
                  <span className="text-xs font-black text-amber-500">#3</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other players rank list */}
        {leaderboard.length > 3 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {leaderboard.slice(3).map((p) => (
              <div
                key={p.playerId}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-500 w-5">#{p.rank}</span>
                  <Avatar avatar={p.avatar} size={28} />
                  <span className="text-xs font-bold text-slate-200">{p.nickname}</span>
                </div>
                <span className="text-xs font-bold text-slate-400">{p.score} pts</span>
              </div>
            ))}
          </div>
        )}

        {/* Rematch action */}
        <div className="pt-2 border-t border-slate-800">
          {isHost ? (
            <button
              type="button"
              onClick={onRematch}
              className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again (Rematch)</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400 font-medium py-2 bg-slate-950/50 rounded-xl border border-slate-800/70">
              Waiting for the host to start a rematch...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
