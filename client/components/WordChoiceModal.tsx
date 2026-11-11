'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Clock } from 'lucide-react';

interface WordChoiceModalProps {
  words: string[];
  endsAt: number | null;
  serverTime: number;
  onSelectWord: (word: string) => void;
}

export const WordChoiceModal: React.FC<WordChoiceModalProps> = ({
  words,
  endsAt,
  onSelectWord
}) => {
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    if (!endsAt) return;
    const updateCountdown = () => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
      setSecondsLeft(left);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 200);
    return () => clearInterval(interval);
  }, [endsAt]);

  const progressPercent = Math.min(100, Math.max(0, (secondsLeft / 10) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Your Turn to Draw!
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Pick a Secret Word
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose what you want to draw. If time runs out, one is picked for you.
          </p>
        </div>

        {/* 10s Timer progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs text-slate-400 font-semibold px-1">
            <span className="flex items-center gap-1 text-amber-400">
              <Clock className="w-3.5 h-3.5" /> {secondsLeft}s
            </span>
            <span>Choose now</span>
          </div>
          <div className="w-full h-2.5 bg-slate-850 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                secondsLeft <= 3 ? 'bg-red-500' : secondsLeft <= 6 ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 3 Word Options */}
        <div className="grid grid-cols-1 gap-3">
          {words.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => onSelectWord(word)}
              className="py-3.5 px-5 bg-slate-800/80 hover:bg-indigo-600 hover:border-indigo-500 border border-slate-700 rounded-2xl text-base font-bold text-white transition-all transform hover:-translate-y-0.5 hover:shadow-lg cursor-pointer capitalize"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

