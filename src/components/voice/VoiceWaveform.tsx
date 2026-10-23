import React, { useEffect, useState, useRef } from 'react';
import { RealtimeAudioAnalyser } from '../../utils/voiceClient';

interface VoiceWaveformProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  isMicActive?: boolean;
  className?: string;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  state,
  isMicActive = false,
  className = ''
}) => {
  const [frequencies, setFrequencies] = useState<number[]>([0.1, 0.2, 0.4, 0.2, 0.5, 0.3, 0.1, 0.2]);
  const analyserRef = useRef<RealtimeAudioAnalyser | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (state === 'listening' && isMicActive) {
      const analyser = new RealtimeAudioAnalyser();
      analyserRef.current = analyser;

      analyser.start().then(started => {
        if (!started || !isMounted) return;

        const loop = () => {
          if (!isMounted) return;
          const freqs = analyser.getFrequencies();
          // Boost and smooth
          const smoothed = freqs.map(f => Math.min(1, Math.max(0.1, f * 1.8)));
          setFrequencies(smoothed);
          animFrameRef.current = requestAnimationFrame(loop);
        };
        loop();
      });
    } else {
      if (analyserRef.current) {
        analyserRef.current.stop();
        analyserRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      // Simulated cadence based on state
      if (state === 'speaking') {
        const interval = setInterval(() => {
          setFrequencies([
            0.2 + Math.random() * 0.6,
            0.3 + Math.random() * 0.7,
            0.4 + Math.random() * 0.6,
            0.5 + Math.random() * 0.5,
            0.4 + Math.random() * 0.6,
            0.3 + Math.random() * 0.7,
            0.2 + Math.random() * 0.5,
            0.1 + Math.random() * 0.4
          ]);
        }, 120);
        return () => clearInterval(interval);
      } else if (state === 'thinking') {
        setFrequencies([0.3, 0.4, 0.6, 0.8, 0.6, 0.4, 0.3, 0.2]);
      } else {
        setFrequencies([0.08, 0.12, 0.16, 0.2, 0.16, 0.12, 0.08, 0.05]);
      }
    }

    return () => {
      isMounted = false;
      if (analyserRef.current) {
        analyserRef.current.stop();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state, isMicActive]);

  const barColor = {
    idle: 'bg-slate-600',
    listening: 'bg-emerald-400 shadow-sm shadow-emerald-400',
    thinking: 'bg-purple-400 shadow-sm shadow-purple-400',
    speaking: 'bg-cyan-400 shadow-sm shadow-cyan-400'
  }[state];

  return (
    <div className={`flex items-center justify-center gap-1.5 h-10 select-none ${className}`}>
      {frequencies.map((val, idx) => {
        const height = Math.max(6, Math.min(36, Math.round(val * 36)));
        return (
          <span
            key={idx}
            className={`w-1 rounded-full transition-all duration-75 ${barColor}`}
            style={{
              height: `${height}px`,
              opacity: state === 'idle' ? 0.4 : 0.95
            }}
          />
        );
      })}
    </div>
  );
};
