// Wooden Fish (木魚) sound generator using Web Audio API
let audioCtx: AudioContext | null = null;
let knockAudio: HTMLAudioElement | null = null;

export const playKnockSound = (): void => {
  // Try loading real knock.aac if available, fallback to Web Audio synthesis
  try {
    if (!knockAudio) {
      knockAudio = new Audio('/knock.aac');
    }
    knockAudio.currentTime = 0;
    const promise = knockAudio.play();
    if (promise) {
      promise.catch(() => {
        // Fallback to Web Audio API synthesis
        synthWoodenFish();
      });
    }
  } catch (e) {
    synthWoodenFish();
  }
};

function synthWoodenFish(): void {
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Resonant wooden fish oscillator
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    // Wooden fish pitch around 550Hz dropping quickly to 350Hz
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

    // Bandpass filter to simulate hollow wooden body resonance
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, now);
    filter.Q.setValueAtTime(3.5, now);

    // Envelope for sharp click knock sound
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
}

export function playBellSound(): void {
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Create a deep resonant bell sound by mixing multiple oscillators (fundamental + harmonics)
    const frequencies = [180, 220, 330, 440];
    const gains = [0.6, 0.4, 0.3, 0.2];

    frequencies.forEach((freq, idx) => {
      const osc = audioCtx!.createOscillator();
      const gainNode = audioCtx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Bell chime attack & slow decay envelope
      gainNode.gain.setValueAtTime(gains[idx], now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + (idx === 0 ? 3.5 : 2.0));

      osc.connect(gainNode);
      gainNode.connect(audioCtx!.destination);

      osc.start(now);
      osc.stop(now + 3.6);
    });
  } catch (e) {
    console.warn('Bell audio playback error:', e);
  }
}
