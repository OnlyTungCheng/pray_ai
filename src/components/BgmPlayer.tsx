import { useState, useEffect, useRef } from 'react';

export default function BgmPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [hasInteracted, setHasInteracted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Attempt autoplay on user first click/tap anywhere on the page
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
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 p-1.5 rounded-full bg-stone-900/90 border border-amber-500/40 backdrop-blur-md shadow-2xl transition-all hover:border-amber-400">
      <audio ref={audioRef} src="/audio.mp3" loop preload="auto" />

      {/* Play/Pause Sound Icon Button */}
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full transition-all cursor-pointer flex items-center justify-center ${
          isPlaying
            ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/40 font-bold scale-105'
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
