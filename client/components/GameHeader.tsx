'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Copy, Check, Clock, Eye } from 'lucide-react';
import { sound } from '../lib/sound';

interface GameHeaderProps {
  roomCode: string;
  round: number;
  totalRounds: number;
  isDrawer: boolean;
  word?: string | null;
  wordMask?: string;
  wordLength?: number[];
  endsAt: number | null;
  serverTime: number;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  roomCode,
  round,
  totalRounds,
  isDrawer,
  word,
  wordMask,
  wordLength = [],
  endsAt
}) => {
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Sync timer
  useEffect(() => {
    if (!endsAt) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
      setTimeLeft(left);

      // Play tick sound when <= 10 seconds
      if (left <= 10 && left > 0) {
        sound.playTick(left <= 5);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/r/${roomCode}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleMute = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 px-4 py-2.5 sm:py-3 shadow-md flex items-center justify-between gap-2">
      {/* Left: Logo & Room Code & Round */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5 font-black text-lg sm:text-xl tracking-tight text-white">
          <span className="text-indigo-400">Draft</span>
          <span className="bg-indigo-600 px-1.5 py-0.5 rounded-lg text-white">Room</span>
        </div>

        {/* Room Code Pill */}
        <button
          type="button"
          onClick={handleCopyLink}
          title="Click to copy shareable room link"
          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
        >
          <span>{roomCode}</span>
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {/* Round display */}
        {round > 0 && (
          <div className="hidden sm:inline-flex text-xs font-semibold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
            Round {round} / {totalRounds}
          </div>
        )}
      </div>

      {/* Middle: Word Display (Secret or Masked) */}
      <div className="flex-1 flex flex-col items-center justify-center px-2">
        {isDrawer && word ? (
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
              Draw:
            </span>
            <span className="text-base sm:text-xl font-black text-white bg-slate-800/80 px-3 py-0.5 rounded-xl border border-amber-500/30 uppercase tracking-widest shadow-inner">
              {word}
            </span>
          </div>
        ) : wordMask ? (
          <div className="flex flex-col items-center">
            <div className="text-base sm:text-xl font-mono font-black text-indigo-300 tracking-[0.25em] uppercase">
              {wordMask}
            </div>
            {wordLength.length > 0 && (
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {wordLength.join(' + ')} letters
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Waiting for next turn...
          </div>
        )}
      </div>

      {/* Right: Timer & Sound Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {timeLeft !== null && (
          <div
            className={`flex items-center gap-1 px-3 py-1 rounded-xl font-mono font-bold text-sm border transition-all ${
              timeLeft <= 10
                ? 'bg-red-950/80 border-red-500/50 text-red-400 animate-pulse scale-105'
                : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-current" />
            <span>{timeLeft}s</span>
          </div>
        )}

        {/* Sound toggle button */}
        <button
          type="button"
          onClick={handleToggleMute}
          title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
