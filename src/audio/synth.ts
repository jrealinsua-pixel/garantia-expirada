// Tiny sfxr-style synthesiser: every sound effect is generated from a handful of parameters.
// Pure function (seeded noise), so tools can also export the same sounds to WAV later.
import { Rng } from '../sim/rng.ts';

export type Wave = 'square' | 'saw' | 'sine' | 'noise' | 'triangle';

export interface SfxParams {
  wave: Wave;
  /** Start and end frequency in Hz (exponential slide). */
  freq: number;
  freqEnd: number;
  attack: number;
  sustain: number;
  decay: number;
  volume: number;
  /** Square duty cycle 0..1. */
  duty?: number;
  /** Vibrato depth (fraction of frequency) and speed (Hz). */
  vibrato?: number;
  vibratoSpeed?: number;
  /** Bit-crush: hold each sample this many times. */
  crush?: number;
  /** Simple one-pole low-pass, 0 (off) .. 1 (heavy). */
  lowpass?: number;
}

export function synth(p: SfxParams, sampleRate = 44100, seed = 'sfx'): Float32Array {
  const rng = new Rng(seed);
  const total = p.attack + p.sustain + p.decay;
  const n = Math.max(1, Math.floor(total * sampleRate));
  const out = new Float32Array(n);
  let phase = 0;
  let noise = 0;
  let lp = 0;
  let held = 0;
  const crush = Math.max(1, Math.floor(p.crush ?? 1));
  const lpk = 1 - Math.min(0.95, p.lowpass ?? 0);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const k = t / total;
    let f = p.freq * Math.pow(p.freqEnd / p.freq, k);
    if (p.vibrato) f *= 1 + p.vibrato * Math.sin(2 * Math.PI * (p.vibratoSpeed ?? 6) * t);
    const prev = phase;
    phase = (phase + f / sampleRate) % 1;
    if (phase < prev) noise = rng.range(-1, 1);
    let s: number;
    switch (p.wave) {
      case 'square':
        s = phase < (p.duty ?? 0.5) ? 0.6 : -0.6;
        break;
      case 'saw':
        s = (phase * 2 - 1) * 0.7;
        break;
      case 'sine':
        s = Math.sin(phase * 2 * Math.PI);
        break;
      case 'triangle':
        s = (phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4) * 0.8;
        break;
      case 'noise':
        s = noise;
        break;
    }
    let env: number;
    if (t < p.attack) env = t / p.attack;
    else if (t < p.attack + p.sustain) env = 1;
    else env = Math.max(0, 1 - (t - p.attack - p.sustain) / p.decay);
    lp += (s - lp) * lpk;
    if (i % crush === 0) held = lp * env * p.volume;
    out[i] = held;
  }
  return out;
}

/** The game's sound effects. Names are used by the renderer. */
export const SFX: Record<string, SfxParams> = {
  // Hair dryer shot: a puff of noise with a falling whine.
  disparo: { wave: 'noise', freq: 2400, freqEnd: 500, attack: 0.002, sustain: 0.02, decay: 0.09, volume: 0.32, lowpass: 0.35 },
  disparoTono: { wave: 'square', freq: 520, freqEnd: 180, attack: 0.001, sustain: 0.01, decay: 0.07, volume: 0.12, duty: 0.3 },
  golpe: { wave: 'square', freq: 180, freqEnd: 60, attack: 0.001, sustain: 0.02, decay: 0.08, volume: 0.3, duty: 0.5, crush: 2 },
  golpeRuido: { wave: 'noise', freq: 900, freqEnd: 300, attack: 0.001, sustain: 0.01, decay: 0.06, volume: 0.25 },
  pared: { wave: 'noise', freq: 3000, freqEnd: 1500, attack: 0.001, sustain: 0.005, decay: 0.04, volume: 0.12, lowpass: 0.5 },
  rodar: { wave: 'noise', freq: 400, freqEnd: 1600, attack: 0.02, sustain: 0.08, decay: 0.16, volume: 0.22, lowpass: 0.6 },
  recargar: { wave: 'square', freq: 900, freqEnd: 1300, attack: 0.001, sustain: 0.02, decay: 0.03, volume: 0.14, duty: 0.25 },
  recargado: { wave: 'square', freq: 1300, freqEnd: 1800, attack: 0.001, sustain: 0.03, decay: 0.05, volume: 0.14, duty: 0.25 },
  // Enemy attack warning: a rising, wobbling beep, like an appliance about to do something bad.
  aviso: { wave: 'square', freq: 380, freqEnd: 1100, attack: 0.01, sustain: 0.16, decay: 0.12, volume: 0.13, duty: 0.4, vibrato: 0.06, vibratoSpeed: 18 },
  // Aspirador Desahuciado: motor revving up for the charge, skid, crash into the wall, bump.
  motor: { wave: 'saw', freq: 90, freqEnd: 260, attack: 0.02, sustain: 0.3, decay: 0.2, volume: 0.16, vibrato: 0.08, vibratoSpeed: 30, lowpass: 0.4 },
  derrape: { wave: 'noise', freq: 2200, freqEnd: 900, attack: 0.01, sustain: 0.18, decay: 0.15, volume: 0.14, lowpass: 0.3 },
  choque: { wave: 'square', freq: 140, freqEnd: 45, attack: 0.001, sustain: 0.05, decay: 0.2, volume: 0.3, duty: 0.5, crush: 3 },
  empujon: { wave: 'square', freq: 260, freqEnd: 90, attack: 0.001, sustain: 0.02, decay: 0.1, volume: 0.24, duty: 0.35 },
  // Bombilla de Bajo Consumo switching on (fluorescent buzz) and its moth diving (wing flutter).
  encender: { wave: 'saw', freq: 100, freqEnd: 125, attack: 0.01, sustain: 0.28, decay: 0.12, volume: 0.13, vibrato: 0.3, vibratoSpeed: 50, lowpass: 0.3 },
  aleteo: { wave: 'noise', freq: 1400, freqEnd: 700, attack: 0.005, sustain: 0.08, decay: 0.1, volume: 0.16, lowpass: 0.4, vibrato: 0.5, vibratoSpeed: 40 },
  // Coming apart: a crunch of plastic and metal, then the bits rattling down.
  desmontar: { wave: 'noise', freq: 1800, freqEnd: 160, attack: 0.001, sustain: 0.06, decay: 0.32, volume: 0.34, lowpass: 0.45, crush: 3 },
  // A coupon picked up: a short, bright till «ding».
  cupon: { wave: 'square', freq: 1350, freqEnd: 2100, attack: 0.001, sustain: 0.03, decay: 0.08, volume: 0.12, duty: 0.25 },
  reponer: { wave: 'square', freq: 520, freqEnd: 260, attack: 0.01, sustain: 0.12, decay: 0.15, volume: 0.12, duty: 0.4, vibrato: 0.04, vibratoSpeed: 9 },
  // The toaster gets hurt: a short electric crackle that drops.
  dolor: { wave: 'square', freq: 700, freqEnd: 120, attack: 0.001, sustain: 0.05, decay: 0.18, volume: 0.3, duty: 0.3, crush: 4, vibrato: 0.2, vibratoSpeed: 45 },
  // Down for good: the motor winding down.
  baja: { wave: 'saw', freq: 320, freqEnd: 35, attack: 0.005, sustain: 0.25, decay: 0.7, volume: 0.3, lowpass: 0.35, vibrato: 0.1, vibratoSpeed: 12 },
  // Hand mixer: the whirr of its lunge, and the jammed slider going into TURBO.
  batir: { wave: 'saw', freq: 220, freqEnd: 420, attack: 0.005, sustain: 0.16, decay: 0.1, volume: 0.16, vibrato: 0.25, vibratoSpeed: 60, lowpass: 0.45 },
  turbo: { wave: 'square', freq: 300, freqEnd: 1500, attack: 0.01, sustain: 0.25, decay: 0.15, volume: 0.17, duty: 0.3, vibrato: 0.15, vibratoSpeed: 35 },
  // Remote control: an old TV switching off (a high whine dropping to nothing) and back on (a click
  // and a burst of static).
  apagar: { wave: 'square', freq: 1600, freqEnd: 90, attack: 0.001, sustain: 0.05, decay: 0.16, volume: 0.13, duty: 0.2, lowpass: 0.6 },
  zapear: { wave: 'noise', freq: 2400, freqEnd: 1200, attack: 0.001, sustain: 0.05, decay: 0.12, volume: 0.17, crush: 2 },
  // The toaster comes apart: the slices pop out, the spring goes «boing», the report is stamped.
  saltar: { wave: 'square', freq: 260, freqEnd: 980, attack: 0.001, sustain: 0.03, decay: 0.09, volume: 0.22, duty: 0.4, crush: 2 },
  muelle: { wave: 'triangle', freq: 330, freqEnd: 520, attack: 0.002, sustain: 0.2, decay: 0.35, volume: 0.28, vibrato: 0.35, vibratoSpeed: 22 },
  sello: { wave: 'noise', freq: 600, freqEnd: 120, attack: 0.001, sustain: 0.03, decay: 0.16, volume: 0.32, lowpass: 0.25, crush: 2 },
  vacio: { wave: 'square', freq: 220, freqEnd: 200, attack: 0.001, sustain: 0.015, decay: 0.02, volume: 0.15, duty: 0.15 },
};
