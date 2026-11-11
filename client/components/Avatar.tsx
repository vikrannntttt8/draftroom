'use client';

import React from 'react';
import { Avatar as AvatarType } from '../lib/types';

export const AVATAR_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#A855F7'  // Violet
];

// 12 fun SVG faces
const FACES = [
  // 0: Happy classic
  (
    <g key="f0" fill="currentColor">
      <circle cx="28" cy="38" r="4" />
      <circle cx="52" cy="38" r="4" />
      <path d="M 30 50 Q 40 60 50 50" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  ),
  // 1: Big grin
  (
    <g key="f1" fill="currentColor">
      <ellipse cx="28" cy="38" rx="4" ry="5" />
      <ellipse cx="52" cy="38" rx="4" ry="5" />
      <path d="M 26 48 Q 40 66 54 48 Z" fill="currentColor" />
    </g>
  ),
  // 2: Cool sunglasses
  (
    <g key="f2">
      <rect x="20" y="32" width="16" height="11" rx="3" fill="#1E293B" />
      <rect x="44" y="32" width="16" height="11" rx="3" fill="#1E293B" />
      <line x1="36" y1="36" x2="44" y2="36" stroke="#1E293B" strokeWidth="3" />
      <path d="M 33 53 Q 40 59 47 53" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  // 3: Wink
  (
    <g key="f3" fill="currentColor">
      <circle cx="28" cy="38" r="4" />
      <path d="M 46 38 Q 52 34 58 38" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M 30 51 Q 40 61 50 51" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  ),
  // 4: Silly tongue
  (
    <g key="f4" fill="currentColor">
      <circle cx="28" cy="36" r="4" />
      <circle cx="52" cy="36" r="4" />
      <path d="M 28 48 Q 40 54 52 48" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M 36 50 Q 40 64 44 50 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
    </g>
  ),
  // 5: Surprised / Wow
  (
    <g key="f5" fill="currentColor">
      <circle cx="28" cy="36" r="4.5" />
      <circle cx="52" cy="36" r="4.5" />
      <ellipse cx="40" cy="52" rx="6" ry="8" fill="currentColor" />
    </g>
  ),
  // 6: Cute cat
  (
    <g key="f6" fill="currentColor">
      <circle cx="27" cy="38" r="3.5" />
      <circle cx="53" cy="38" r="3.5" />
      <polygon points="40,46 36,43 44,43" fill="#EC4899" />
      <path d="M 33 49 Q 37 53 40 48 Q 43 53 47 49" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Whiskers */}
      <line x1="15" y1="44" x2="25" y2="46" stroke="currentColor" strokeWidth="1.5" />
      <line x1="15" y1="50" x2="25" y2="49" stroke="currentColor" strokeWidth="1.5" />
      <line x1="55" y1="46" x2="65" y2="44" stroke="currentColor" strokeWidth="1.5" />
      <line x1="55" y1="49" x2="65" y2="50" stroke="currentColor" strokeWidth="1.5" />
    </g>
  ),
  // 7: Robot
  (
    <g key="f7">
      <rect x="23" y="34" width="10" height="7" rx="1" fill="#06B6D4" />
      <rect x="47" y="34" width="10" height="7" rx="1" fill="#06B6D4" />
      <line x1="28" y1="49" x2="52" y2="49" stroke="currentColor" strokeWidth="3" />
      <line x1="34" y1="47" x2="34" y2="51" stroke="currentColor" strokeWidth="2" />
      <line x1="40" y1="47" x2="40" y2="51" stroke="currentColor" strokeWidth="2" />
      <line x1="46" y1="47" x2="46" y2="51" stroke="currentColor" strokeWidth="2" />
    </g>
  ),
  // 8: Star eyes
  (
    <g key="f8" fill="#FBBF24">
      <polygon points="28,32 30,37 35,37 31,40 33,45 28,42 23,45 25,40 21,37 26,37" stroke="#D97706" strokeWidth="1" />
      <polygon points="52,32 54,37 59,37 55,40 57,45 52,42 47,45 49,40 45,37 50,37" stroke="#D97706" strokeWidth="1" />
      <path d="M 28 52 Q 40 64 52 52" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  ),
  // 9: Sleepy
  (
    <g key="f9">
      <path d="M 22 38 Q 28 44 34 38" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M 46 38 Q 52 44 58 38" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="40" cy="52" r="3" fill="currentColor" />
    </g>
  ),
  // 10: Smug / Clever
  (
    <g key="f10" fill="currentColor">
      <path d="M 23 35 Q 29 32 35 37" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="30" cy="38" r="3.5" />
      <circle cx="52" cy="37" r="3.5" />
      <path d="M 32 52 Q 42 54 48 48" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  ),
  // 11: Mustache
  (
    <g key="f11" fill="currentColor">
      <circle cx="28" cy="34" r="4" />
      <circle cx="52" cy="34" r="4" />
      <path d="M 40 46 C 36 41 24 43 24 49 C 29 48 34 50 40 54 C 46 50 51 48 56 49 C 56 43 44 41 40 46 Z" fill="#374151" />
      <path d="M 35 56 Q 40 60 45 56" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  )
];

// 12 fun accessories
const ACCESSORIES = [
  // 0: None
  null,
  // 1: Party Hat
  (
    <g key="a1">
      <polygon points="40,2 26,24 54,24" fill="#F43F5E" />
      <polygon points="34,13 46,13 40,2" fill="#FBBF24" opacity="0.8" />
      <circle cx="40" cy="2" r="4" fill="#FBBF24" />
      <line x1="28" y1="20" x2="52" y2="20" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3,3" />
    </g>
  ),
  // 2: Gold Crown
  (
    <g key="a2">
      <polygon points="20,24 23,12 31,18 40,8 49,18 57,12 60,24" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
      <circle cx="23" cy="12" r="2.5" fill="#EF4444" />
      <circle cx="40" cy="8" r="3" fill="#3B82F6" />
      <circle cx="57" cy="12" r="2.5" fill="#10B981" />
    </g>
  ),
  // 3: Headset / Headphones
  (
    <g key="a3">
      <path d="M 12 40 A 28 28 0 0 1 68 40" fill="none" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
      <rect x="8" y="32" width="8" height="18" rx="4" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.5" />
      <rect x="64" y="32" width="8" height="18" rx="4" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.5" />
      <path d="M 12 46 Q 16 58 26 56" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
      <circle cx="26" cy="56" r="3" fill="#EF4444" />
    </g>
  ),
  // 4: Halo
  (
    <g key="a4">
      <ellipse cx="40" cy="12" rx="22" ry="6" fill="none" stroke="#FDE047" strokeWidth="4" />
    </g>
  ),
  // 5: Cool Beanie
  (
    <g key="a5">
      <path d="M 18 24 Q 40 6 62 24 Z" fill="#6366F1" />
      <rect x="16" y="21" width="48" height="6" rx="2" fill="#4F46E5" />
      <circle cx="40" cy="7" r="4.5" fill="#E0E7FF" />
    </g>
  ),
  // 6: Flower
  (
    <g key="a6">
      <circle cx="20" cy="18" r="4" fill="#F43F5E" />
      <circle cx="26" cy="14" r="4" fill="#F43F5E" />
      <circle cx="28" cy="22" r="4" fill="#F43F5E" />
      <circle cx="22" cy="26" r="4" fill="#F43F5E" />
      <circle cx="16" cy="22" r="4" fill="#F43F5E" />
      <circle cx="22" cy="20" r="3.5" fill="#FDE047" />
    </g>
  ),
  // 7: Wizard Hat
  (
    <g key="a7">
      <ellipse cx="40" cy="22" rx="28" ry="6" fill="#4338CA" />
      <polygon points="40,0 24,20 56,20" fill="#6366F1" />
      <polygon points="38,8 39,11 42,11 40,13 41,16 38,14 35,16 36,13 34,11 37,11" fill="#FDE047" />
    </g>
  ),
  // 8: Chef Hat
  (
    <g key="a8">
      <rect x="26" y="16" width="28" height="8" rx="1" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="1" />
      <circle cx="27" cy="12" r="8" fill="#FFFFFF" />
      <circle cx="40" cy="8" r="9" fill="#FFFFFF" />
      <circle cx="53" cy="12" r="8" fill="#FFFFFF" />
    </g>
  ),
  // 9: Viking Horns
  (
    <g key="a9">
      <path d="M 18 26 Q 8 16 12 6 Q 18 16 22 24 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
      <path d="M 62 26 Q 72 16 68 6 Q 62 16 58 24 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
    </g>
  ),
  // 10: Gamer Glasses
  (
    <g key="a10">
      <rect x="18" y="32" width="18" height="12" rx="2" fill="none" stroke="#10B981" strokeWidth="2.5" />
      <rect x="44" y="32" width="18" height="12" rx="2" fill="none" stroke="#10B981" strokeWidth="2.5" />
      <line x1="36" y1="36" x2="44" y2="36" stroke="#10B981" strokeWidth="2.5" />
    </g>
  ),
  // 11: Top Hat
  (
    <g key="a11">
      <ellipse cx="40" cy="22" rx="24" ry="4" fill="#18181B" />
      <rect x="25" y="6" width="30" height="16" rx="2" fill="#27272A" />
      <rect x="25" y="18" width="30" height="4" fill="#DC2626" />
    </g>
  )
];

interface AvatarProps {
  avatar?: AvatarType;
  size?: number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ avatar, size = 48, className = '' }) => {
  const color = avatar?.color || '#3B82F6';
  const faceIdx = Math.min(Math.max(0, avatar?.face ?? 0), FACES.length - 1);
  const accIdx = Math.min(Math.max(0, avatar?.accessory ?? 0), ACCESSORIES.length - 1);

  return (
    <div
      className={`relative rounded-full flex items-center justify-center shrink-0 shadow-sm select-none overflow-visible ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color
      }}
    >
      <svg
        viewBox="0 0 80 80"
        width={size}
        height={size}
        className="w-full h-full text-slate-900 overflow-visible"
      >
        {/* Face */}
        {FACES[faceIdx]}

        {/* Accessory overlay */}
        {ACCESSORIES[accIdx]}
      </svg>
    </div>
  );
};

interface AvatarPickerProps {
  value: AvatarType;
  onChange: (val: AvatarType) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({ value, onChange }) => {
  return (
    <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-white space-y-4">
      {/* Current Preview */}
      <div className="flex items-center gap-4">
        <Avatar avatar={value} size={64} className="ring-4 ring-indigo-500/30" />
        <div>
          <h4 className="font-semibold text-sm text-slate-200">Custom Avatar</h4>
          <p className="text-xs text-slate-400">Choose your favorite color, face expression and accessory.</p>
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
          Base Color
        </label>
        <div className="grid grid-cols-6 gap-2">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ ...value, color: c })}
              className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                value.color === c ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-105 opacity-80'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Face Expression selector */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Expression ({value.face + 1} / {FACES.length})
          </label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onChange({ ...value, face: (value.face - 1 + FACES.length) % FACES.length })}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-xs rounded font-bold cursor-pointer"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...value, face: (value.face + 1) % FACES.length })}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-xs rounded font-bold cursor-pointer"
            >
              ›
            </button>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
          {FACES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange({ ...value, face: idx })}
              className={`p-1 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                value.face === idx ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center">
                <svg viewBox="0 0 80 80" className="w-6 h-6 text-slate-200">
                  {FACES[idx]}
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Accessory selector */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Accessory ({value.accessory} / {ACCESSORIES.length - 1})
          </label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onChange({ ...value, accessory: (value.accessory - 1 + ACCESSORIES.length) % ACCESSORIES.length })}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-xs rounded font-bold cursor-pointer"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...value, accessory: (value.accessory + 1) % ACCESSORIES.length })}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-xs rounded font-bold cursor-pointer"
            >
              ›
            </button>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
          {ACCESSORIES.map((acc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange({ ...value, accessory: idx })}
              className={`p-1 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                value.accessory === idx ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-xs font-medium">
                {idx === 0 ? (
                  <span className="text-[10px] text-slate-400">None</span>
                ) : (
                  <svg viewBox="0 0 80 80" className="w-6 h-6">
                    {acc}
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

