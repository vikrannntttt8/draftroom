'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { ChatMessage, Player } from '../lib/types';
import { Send, Lock, Sparkles, AlertCircle } from 'lucide-react';

interface ChatBoxProps {
  socket: Socket | null;
  messages: ChatMessage[];
  selfPlayer: Player | null;
  isDrawer: boolean;
  hasGuessed: boolean;
  isDrawingState: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  socket,
  messages,
  selfPlayer,
  isDrawer,
  hasGuessed,
  isDrawingState
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || !socket) return;

    socket.emit('chat:guess', { text: trimmed });
    setInputText('');
  };

  // Prevent paste, drop, cut to deter automated wordlist dumping as per PRD 5.5
  const preventCheatInput = (e: React.ClipboardEvent | React.DragEvent) => {
    e.preventDefault();
  };

  const isGuessedChannel = isDrawingState && (hasGuessed || isDrawer);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Chat Header */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-200">Chat & Guesses</span>
          {isGuessedChannel && (
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-pulse">
              <Lock className="w-3 h-3" /> Guessed Channel
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500">{messages.length} msgs</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm min-h-[220px] max-h-[460px]">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 italic py-8">
            Type your guesses or chat here!
          </div>
        )}

        {messages.map((msg) => {
          // Correct guess broadcast banner
          if (msg.kind === 'guessed') {
            return (
              <div
                key={msg.id}
                className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-xl font-medium text-xs flex items-center justify-between animate-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{msg.text}</span>
                </div>
                {msg.scoreDelta && (
                  <span className="font-bold text-emerald-400 bg-emerald-900/50 px-1.5 py-0.5 rounded text-[11px]">
                    +{msg.scoreDelta}
                  </span>
                )}
              </div>
            );
          }

          // Close guess private nudge
          if (msg.kind === 'close') {
            return (
              <div
                key={msg.id}
                className="bg-amber-950/70 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-xl font-medium text-xs flex items-center gap-2 animate-bounce duration-300"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{msg.text}</span>
              </div>
            );
          }

          // Warning
          if (msg.kind === 'warning') {
            return (
              <div
                key={msg.id}
                className="bg-red-950/70 border border-red-500/40 text-red-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{msg.text}</span>
              </div>
            );
          }

          // System message
          if (msg.kind === 'system' || !msg.nickname) {
            return (
              <div key={msg.id} className="text-center text-xs text-slate-500 italic py-0.5">
                {msg.text}
              </div>
            );
          }

          // Guessed-channel message
          if (msg.channel === 'guessed') {
            const isMe = selfPlayer && msg.playerId === selfPlayer.id;
            return (
              <div
                key={msg.id}
                className={`p-2 rounded-xl text-xs bg-emerald-950/30 border border-emerald-900/40 ${
                  isMe ? 'ml-4 bg-emerald-900/40' : 'mr-4'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-bold text-emerald-400">{msg.nickname}</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-950 px-1 py-0.2 rounded">
                    Guessed
                  </span>
                </div>
                <div className="text-emerald-100 break-words">{msg.text}</div>
              </div>
            );
          }

          // Normal public message / guess
          const isMe = selfPlayer && msg.playerId === selfPlayer.id;
          return (
            <div
              key={msg.id}
              className={`p-2 rounded-xl text-xs transition-colors ${
                isMe
                  ? 'ml-4 bg-indigo-950/50 border border-indigo-900/40 text-slate-200'
                  : 'mr-4 bg-slate-950/60 border border-slate-800/80 text-slate-300'
              }`}
            >
              <span className="font-bold text-indigo-400 mr-1.5">{msg.nickname}:</span>
              <span className="break-words">{msg.text}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onPaste={preventCheatInput}
          onDrop={preventCheatInput}
          onCut={preventCheatInput}
          placeholder={
            isDrawer && isDrawingState
              ? 'You are drawing (chat with guessers)'
              : hasGuessed && isDrawingState
              ? 'Chat with other guessers...'
              : 'Type your guess here...'
          }
          maxLength={100}
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl transition-all cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
