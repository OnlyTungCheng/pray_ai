import { useState, useEffect, useRef } from 'react';
import { setBgmDuckHandler } from '../utils/sound';

interface BgmPlayerProps {
  themeMode?: string;
  onToggleTheme?: () => void;
  isInline?: boolean;
}

const DUCK_VOLUME_RATIO = 0.35;

export default function BgmPlayer({ themeMode, onToggleTheme, isInline = false }: BgmPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [hasInteracted, setHasInteracted] = useState(false);

  // One <audio> element per track (not one element with a dynamically
  // swapped `src`) so switching themes pauses/resumes each track's own
  // playback position and, more importantly, only ever fetches each file
  // once — the browser caches each element's load independently instead of
  // re-requesting the same URL every time `src` changes on a shared element.
  const basicAudioRef = useRef<HTMLAudioElement>(null);
  const remixAudioRef = useRef<HTMLAudioElement>(null);
  const activeAudioRef = themeMode === 'remix' ? remixAudioRef : basicAudioRef;
  const inactiveAudioRef = themeMode === 'remix' ? basicAudioRef : remixAudioRef;

  const duckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  useEffect(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.volume = volume;
    }
    // Depends on themeMode too (not just volume) so switching tracks
    // re-applies the current volume to whichever track just became active.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume, themeMode]);

  // When theme changes: pause whichever track was playing, resume the newly
  // active one from where IT last left off (each track keeps its own
  // currentTime) — no `.load()`/full restart, and no re-fetch of a file
  // already loaded once (each <audio> element caches its own network load).
  useEffect(() => {
    const inactive = inactiveAudioRef.current;
    const active = activeAudioRef.current;

    if (inactive && !inactive.paused) {
      inactive.pause();
    }

    if (active && isPlaying) {
      // preload is 'none' until the user actually plays for the first time
      // (see togglePlay/handleFirstInteraction) — by the time we get here
      // isPlaying is only true after that has already happened once, so
      // this is safe to call without forcing an eager load on mount.
      active.play().catch((e) => {
        console.warn('Audio switch play error:', e);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeMode]);

  // Autoplay on first user interaction (browsers block audio autoplay
  // without a prior gesture). Only starts loading the audio file at this
  // point — preload='none' beforehand means no bytes are fetched for a
  // visitor who never interacts with the page at all.
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        const active = activeAudioRef.current;
        if (active && !isPlaying) {
          active.play().then(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInteracted, isPlaying]);

  // Register a BGM ducking handler (src/utils/sound.ts) so ritual sound
  // effects (bell/knock) briefly lower BGM volume instead of clashing with
  // it, then restore it after the effect's own decay time.
  useEffect(() => {
    setBgmDuckHandler((durationMs: number) => {
      const active = activeAudioRef.current;
      if (!active || active.paused) return;

      if (duckTimeoutRef.current) {
        clearTimeout(duckTimeoutRef.current);
      }

      active.volume = volumeRef.current * DUCK_VOLUME_RATIO;
      duckTimeoutRef.current = setTimeout(() => {
        active.volume = volumeRef.current;
        duckTimeoutRef.current = null;
      }, durationMs);
    });

    return () => {
      setBgmDuckHandler(null);
      if (duckTimeoutRef.current) {
        clearTimeout(duckTimeoutRef.current);
      }
    };
    // Depends on themeMode (not the ref variables themselves) because
    // activeAudioRef is reassigned to a different ref object whenever the
    // theme changes — re-registering the handler keeps its closure pointed
    // at the currently-active track.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeMode]);

  const togglePlay = () => {
    const active = activeAudioRef.current;
    if (!active) return;

    if (isPlaying) {
      active.pause();
      setIsPlaying(false);
    } else {
      active.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error('Audio play error:', e);
      });
    }
  };

  const audioElements = (
    <>
      {/* preload='none': don't fetch either ~300-500KB track until the user
          actually presses play or interacts with the page at all — avoids
          spending bandwidth on visitors who never turn on music. */}
      <audio ref={basicAudioRef} src="/audio.mp3" loop preload="none" />
      <audio ref={remixAudioRef} src="/remix.mp3" loop preload="none" />
    </>
  );

  if (isInline) {
    return (
      <div className="flex items-center gap-2">
        {audioElements}

        {/* Theme Switcher Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={`px-3 py-1.5 rounded-lg border-none text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              themeMode === 'remix'
                ? 'bg-fuchsia-600/40 text-white animate-pulse'
                : 'bg-transparent text-stone-300 hover:text-amber-300 hover:bg-white/10'
            }`}
            title="Bấm để đổi Theme: Basic (Thanh Tịnh) vs Vinahouse Remix (Sập Sình)"
          >
            <span>{themeMode === 'remix' ? '🪩 Remix' : '🏛️ Basic'}</span>
          </button>
        )}

        {/* Play/Pause Sound Icon Button */}
        <div className="flex items-center gap-2">
          <button
            id="btn-toolbar-audio"
            onClick={togglePlay}
            className={`px-3 py-1.5 rounded-lg border-none text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isPlaying
                ? themeMode === 'remix'
                  ? 'bg-fuchsia-500/20 text-fuchsia-300'
                  : 'bg-amber-500/20 text-amber-300'
                : 'bg-transparent text-stone-300 hover:text-amber-300 hover:bg-white/10'
            }`}
            title={isPlaying ? 'Tắt Nhạc Nền' : 'Bật Nhạc Nền'}
          >
            <span>{isPlaying ? '🔊' : '🔇'}</span>
            <span>Âm thanh</span>
          </button>

          {/* Compact Volume Slider */}
          {isPlaying && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-12 h-1 accent-amber-500 bg-stone-700 rounded-lg appearance-none cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
              title={`Âm lượng: ${Math.round(volume * 100)}%`}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 p-2 rounded-full bg-stone-900/90 border border-amber-500/40 backdrop-blur-md shadow-2xl transition-all hover:border-amber-400">
      {audioElements}

      {/* Theme Switcher Button */}
      {onToggleTheme && (
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
      )}

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
