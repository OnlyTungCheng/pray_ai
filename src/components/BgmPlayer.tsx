import { useState, useEffect, useRef } from 'react';

export default function BgmPlayer({ themeMode, onToggleTheme }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [hasInteracted, setHasInteracted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Source audio selection
  const audioSrc = themeMode === 'remix' ? '/remix.mp3' : '/audio.mp3';

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // When theme changes, switch audio track automatically!
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.log('Audio switch play error:', e);
      });
    }
  }, [themeMode]);

  // Autoplay on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        if (audioRef.current && !isPlaying) {
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch((err) => {
            console.log('Autoplay blocked until user explicit toggle:', err);
          });
        }
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [hasInteracted, isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error('Audio play error:', e);
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 p-2 rounded-full bg-stone-900/90 border border-amber-500/40 backdrop-blur-md shadow-2xl transition-all hover:border-amber-400">
      <audio ref={audioRef} src={audioSrc} loop preload="auto" />

      {/* Theme Switcher Button */}
      <button
        onClick={onToggleTheme}
        className={`px-3 py-1.5 rounded-full font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer border shadow-lg ${
          themeMode === 'remix'
            ? 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 text-white border-pink-300 shadow-pink-500/50 animate-pulse'
            : 'bg-stone-800 text-amber-300 border-amber-500/40 hover:bg-stone-700'
        }`}
        title="Bấm để đổi Theme: Basic (Thanh Tịnh) vs Vinahouse Remix (Sập Sình)"
      >
        <span>{themeMode === 'remix' ? '🪩 Theme Remix Vinahouse' : '🏛️ Theme Basic'}</span>
      </button>

      {/* Play/Pause Sound Icon Button */}
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full transition-all cursor-pointer flex items-center justify-center ${
          isPlaying
            ? themeMode === 'remix'
              ? 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/50 font-bold scale-105 animate-spin-slow'
              : 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/40 font-bold scale-105'
            : 'bg-stone-800 text-amber-300 hover:bg-stone-700'
        }`}
        title={isPlaying ? 'Tắt Nhạc Nền' : 'Bật Nhạc Nền'}
      >
        <span className="text-base">{isPlaying ? '🔊' : '🔇'}</span>
      </button>

      {/* Compact Volume Slider */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="w-12 h-1 mr-1 accent-amber-500 bg-stone-700 rounded-lg appearance-none cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
        title={`Âm lượng: ${Math.round(volume * 100)}%`}
      />
    </div>
  );
}
