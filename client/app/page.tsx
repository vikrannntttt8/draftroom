'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarPicker } from '../components/Avatar';
import { Avatar as AvatarType } from '../lib/types';
import { getSocket, getClientId } from '../lib/socket';
import { Sparkles, Play, LogIn, AlertCircle } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<AvatarType>({
    color: '#3B82F6',
    face: 0,
    accessory: 0
  });

  const [joinCode, setJoinCode] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Restore saved profile
  useEffect(() => {
    const savedName = localStorage.getItem('draftroom_nickname');
    const savedAvatar = localStorage.getItem('draftroom_avatar');
    if (savedName) setNickname(savedName);
    if (savedAvatar) {
      try {
        setAvatar(JSON.parse(savedAvatar));
      } catch {
        // ignore
      }
    }
  }, []);

  const saveProfile = () => {
    localStorage.setItem('draftroom_nickname', nickname.trim());
    localStorage.setItem('draftroom_avatar', JSON.stringify(avatar));
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 16) {
      setErrorMessage('Nickname must be between 2 and 16 characters.');
      return;
    }

    saveProfile();
    setIsCreating(true);

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const handleRoomState = (data: { roomCode: string }) => {
      socket.off('room:state', handleRoomState);
      socket.off('error', handleError);
      router.push(`/r/${data.roomCode}`);
    };

    const handleError = (err: { message: string }) => {
      setIsCreating(false);
      setErrorMessage(err.message || 'Failed to create room.');
    };

    socket.once('room:state', handleRoomState);
    socket.once('error', handleError);

    socket.emit('room:create', {
      nickname: trimmed,
      avatar,
      clientId: getClientId(),
      customCode: useCustomCode && customCode.trim() ? customCode.trim().toUpperCase() : undefined
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 16) {
      setErrorMessage('Nickname must be between 2 and 16 characters.');
      return;
    }

    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setErrorMessage('Please enter a valid 4-letter room code.');
      return;
    }

    saveProfile();
    setIsJoining(true);

    router.push(`/r/${code}`);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Background ambient decorative glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header Branding */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="font-black text-2xl tracking-tight text-white flex items-center">
            <span className="text-indigo-400">Draft</span>
            <span className="bg-indigo-600 px-2 py-0.5 rounded-xl text-white ml-1 shadow-lg shadow-indigo-600/30">
              Room
            </span>
          </div>
        </div>
        <div className="text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
          v1.0 Real-time Pictionary
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="relative z-10 max-w-4xl mx-auto w-full my-6 sm:my-10">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Draw, Guess, Win!
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            The zero-friction real-time party game. Pick a nickname, create a room, and start sketching in under 15 seconds.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3 bg-red-950/80 border border-red-500/50 rounded-2xl text-red-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Avatar Customizer */}
          <div className="md:col-span-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                Your Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname..."
                maxLength={16}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-base text-white font-bold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all mb-4"
              />

              <AvatarPicker value={avatar} onChange={setAvatar} />
            </div>
          </div>

          {/* Right Column: Actions (Create & Join) */}
          <div className="md:col-span-6 space-y-6 flex flex-col justify-center">
            {/* Create Room Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Host a Game
                </span>
                <h3 className="text-xl font-black text-white">Create New Room</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Start a private room and invite your friends with a 4-letter code.
                </p>
              </div>

              {/* Custom Code checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomCode}
                    onChange={(e) => setUseCustomCode(e.target.checked)}
                    className="rounded accent-indigo-500 cursor-pointer"
                  />
                  <span>Use custom 4-letter room code</span>
                </label>
                {useCustomCode && (
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. COOL"
                    maxLength={4}
                    className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono uppercase text-white font-bold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={isCreating || !nickname.trim()}
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-base rounded-2xl shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{isCreating ? 'Creating Room...' : 'Create Room'}</span>
              </button>
            </div>

            {/* Join Room Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Have a Code?
                </span>
                <h3 className="text-xl font-black text-white">Join Friend&apos;s Room</h3>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  maxLength={6}
                  className="w-32 bg-slate-950 border border-slate-700 rounded-2xl px-3 py-3 text-center text-lg font-mono font-black uppercase text-indigo-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={handleJoinRoom}
                  disabled={isJoining || !nickname.trim() || !joinCode.trim()}
                  className="flex-1 py-3 px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isJoining ? 'Joining...' : 'Join Game'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full text-center py-4 text-xs text-slate-500 border-t border-slate-900">
        DraftRoom &bull; Real-time Canvas 2D &bull; Node.js + Socket.io &bull; Zero Accounts Required
      </footer>
    </main>
  );
}
