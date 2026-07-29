// Wooden Fish (木魚) + bell sound synthesis via Web Audio API.
//
// Both sounds are fully synthesized (oscillators + envelopes), not sample
// playback — this used to also try fetching /knock.aac first and falling
// back to synthesis on failure, but that file never actually existed in
// public/, so every single knock click cost a guaranteed-to-fail network
// request before falling back. Removed entirely; synthesis is the only
// path now, which is also strictly faster (no network round-trip at all).

let audioCtx: AudioContext | null = null;

/**
 * Optional hook a BGM player can register to duck (temporarily lower) its
 * volume while a ritual sound effect (bell/knock) plays, then restore it —
 * so the two audio sources don't clash/clip when both are audible at once.
 * Kept as a simple settable callback rather than a full event bus since
 * there is at most one BGM player mounted at a time in this app.
 */
type DuckCallback = (durationMs: number) => void;
let duckBgmCallback: DuckCallback | null = null;

export function setBgmDuckHandler(handler: DuckCallback | null): void {
  duckBgmCallback = handler;
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

/** Disconnects a node on `onended` so it (and its listeners) can be GC'd promptly instead of lingering until the AudioContext itself is torn down. */
function disconnectWhenDone(node: AudioScheduledSourceNode, ...connected: AudioNode[]): void {
  node.onended = () => {
    node.disconnect();
    connected.forEach((n) => n.disconnect());
  };
}

export function playKnockSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    duckBgmCallback?.(150);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Wooden fish pitch around 580Hz dropping quickly to 320Hz.
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

    // Bandpass filter to simulate hollow wooden body resonance.
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, now);
    filter.Q.setValueAtTime(3.5, now);

    // Envelope for a sharp click/knock sound.
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    disconnectWhenDone(osc, filter, gain);

    osc.start(now);
    osc.stop(now + 0.13);
  } catch (e) {
    console.warn('Knock audio playback error:', e);
  }
}

export function playBellSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    duckBgmCallback?.(2000);

    // Deep resonant bell sound by mixing multiple oscillators (fundamental + harmonics).
    const frequencies = [180, 220, 330, 440];
    const gains = [0.6, 0.4, 0.3, 0.2];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Bell chime attack & slow decay envelope.
      const decayDuration = idx === 0 ? 3.5 : 2.0;
      gainNode.gain.setValueAtTime(gains[idx], now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + decayDuration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      disconnectWhenDone(osc, gainNode);

      osc.start(now);
      osc.stop(now + decayDuration + 0.1);
    });
  } catch (e) {
    console.warn('Bell audio playback error:', e);
  }
}
