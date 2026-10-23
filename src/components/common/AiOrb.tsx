import React from 'react';

export type AiOrbState = 'idle' | 'thinking' | 'speaking' | 'listening' | 'success' | 'error' | 'offline';

interface AiOrbProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  state?: AiOrbState;
  className?: string;
  onClick?: () => void;
}

export const AiOrb: React.FC<AiOrbProps> = ({
  size = 'md',
  state = 'idle',
  className = '',
  onClick
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-44 h-44'
  }[size];

  const glowColor = {
    idle: 'rgba(6, 182, 212, 0.5)',
    thinking: 'rgba(168, 85, 247, 0.7)',
    speaking: 'rgba(59, 130, 246, 0.8)',
    listening: 'rgba(16, 185, 129, 0.8)',
    success: 'rgba(34, 197, 94, 0.85)',
    error: 'rgba(244, 63, 94, 0.75)',
    offline: 'rgba(100, 116, 139, 0.3)'
  }[state];

  const ringColor = {
    idle: 'border-cyan-400/30 border-t-cyan-400 border-r-indigo-500/50',
    thinking: 'border-purple-400/40 border-t-purple-400 border-r-indigo-500/60',
    speaking: 'border-cyan-400/50 border-t-sky-400 border-r-blue-500/70',
    listening: 'border-emerald-400/50 border-t-emerald-400 border-r-teal-500/60',
    success: 'border-emerald-400/60 border-t-emerald-300 border-r-green-500/70',
    error: 'border-rose-400/50 border-t-rose-400 border-r-amber-500/60',
    offline: 'border-slate-600/30 border-t-slate-500 border-r-slate-700/40'
  }[state];

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center cursor-pointer select-none transition-transform hover:scale-105 ${sizeClasses} ${className}`}
      title={`EchoCare AI Assistant (${state})`}
    >
      {/* Outer ambient glow */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-700 blur-xl opacity-75 animate-pulse"
        style={{ backgroundColor: glowColor }}
      />

      {/* Outer rotating luminous ring */}
      <div className={`absolute inset-[-4px] rounded-full border animate-orb-rotate ${ringColor}`} />

      {/* Secondary reverse counter ring */}
      <div
        className="absolute inset-[-8px] rounded-full border border-indigo-400/20 border-b-sky-300/40"
        style={{ animation: 'orbRotate 18s linear infinite reverse' }}
      />

      {/* Core Sphere */}
      <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl bg-gradient-to-tr from-[#06182c] via-[#0b2847] to-[#123e6b] border border-cyan-400/40 flex items-center justify-center">
        {/* Animated plasma filaments */}
        <div
          className="absolute inset-0 opacity-80 mix-blend-screen"
          style={{
            background: state === 'error'
              ? 'radial-gradient(circle at 35% 35%, rgba(244, 63, 94, 0.9), rgba(217, 119, 6, 0.4) 45%, transparent 70%)'
              : state === 'success'
              ? 'radial-gradient(circle at 35% 35%, rgba(34, 197, 94, 0.9), rgba(6, 182, 212, 0.4) 45%, transparent 70%)'
              : state === 'offline'
              ? 'radial-gradient(circle at 35% 35%, rgba(100, 116, 139, 0.5), rgba(71, 85, 105, 0.3) 45%, transparent 70%)'
              : 'radial-gradient(circle at 35% 35%, rgba(6, 182, 212, 0.9), rgba(99, 102, 241, 0.4) 45%, transparent 70%)',
            filter: 'blur(3px)'
          }}
        />

        <div
          className="absolute inset-0 opacity-70 mix-blend-screen"
          style={{
            background: state === 'error'
              ? 'radial-gradient(circle at 65% 65%, rgba(239, 68, 68, 0.8), rgba(245, 158, 11, 0.3) 50%, transparent 75%)'
              : state === 'success'
              ? 'radial-gradient(circle at 65% 65%, rgba(16, 185, 129, 0.8), rgba(52, 211, 153, 0.3) 50%, transparent 75%)'
              : state === 'offline'
              ? 'radial-gradient(circle at 65% 65%, rgba(51, 65, 85, 0.5), rgba(30, 41, 59, 0.3) 50%, transparent 75%)'
              : 'radial-gradient(circle at 65% 65%, rgba(139, 92, 246, 0.8), rgba(14, 165, 233, 0.3) 50%, transparent 75%)',
            filter: 'blur(2px)'
          }}
        />

        {/* Dynamic State Core Pulse */}
        <div
          className={`w-3/5 h-3/5 rounded-full blur-[2px] transition-all duration-500 flex items-center justify-center ${
            state === 'thinking' ? 'scale-125 bg-purple-300 animate-spin' :
            state === 'speaking' ? 'scale-110 bg-sky-300/80 animate-pulse' :
            state === 'listening' ? 'scale-115 bg-emerald-300 animate-ping' :
            state === 'success' ? 'scale-110 bg-emerald-300/90' :
            state === 'offline' ? 'scale-75 bg-slate-500/50' :
            state === 'error' ? 'scale-95 bg-rose-400/80' : 'scale-90 bg-cyan-200/90 opacity-80 animate-pulse'
          }`}
        />

        {/* State-specific center visual artifacts */}
        {state === 'speaking' && (
          <div className="absolute inset-0 flex items-center justify-center gap-1 z-10 pointer-events-none">
            <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-5 bg-cyan-200 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-6 bg-white rounded-full animate-bounce" />
            <span className="w-1 h-4 bg-cyan-200 rounded-full animate-bounce [animation-delay:-0.2s]" />
            <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.35s]" />
          </div>
        )}

        {state === 'success' && (
          <div className="absolute inset-0 flex items-center justify-center z-10 text-emerald-100 font-bold text-xs pointer-events-none animate-in zoom-in-50 duration-300">
            <svg className="w-5 h-5 text-emerald-200 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {state === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center z-10 text-rose-100 font-bold text-xs pointer-events-none animate-in zoom-in-50 duration-300">
            <svg className="w-4 h-4 text-rose-200 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        )}

        {/* Specular glass highlight reflection */}
        <div className="absolute top-1.5 left-2 w-1/3 h-1/4 rounded-full bg-white/40 blur-[1px] transform -rotate-12 pointer-events-none" />
      </div>
    </div>
  );
};
