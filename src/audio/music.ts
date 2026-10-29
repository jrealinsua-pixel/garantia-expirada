// Chiptune music made in code: each song is data (tempo, chords, a melody and a drum line, in
// sixteenth-note steps) and renderSong turns it into one loop of samples, seamless (what rings
// past the end wraps round to the start). Pure and deterministic, like the effects.
import { Rng } from '../sim/rng.ts';

/** One bar: 16 steps. Melody tokens are notes («A4», «C#5»), «-» to hold the last one, «.» for silence. */
export interface SongDef {
  id: string;
  /** Beats per minute (a beat is 4 steps). */
  bpm: number;
  /** One chord per bar: root and quality, e.g. «A:m», «F», «E:7». The bass and the arpeggio follow it. */
  chords: string[];
  /** One string of 16 tokens per bar (space-separated), as many bars as chords. */
  melody: string[];
  /** Drum line for one bar, repeated: k kick, s snare, h hat, «.» nothing (16 characters). */
  drums: string;
  /** Drum line of the last bar (a fill), if different. */
  fill?: string;
  /** How the bass plays each bar: «pulse» (root and fifth on the beats) or «run» (sixteenths). */
  bass: 'pulse' | 'run';
  /** Duty of the melody's square wave, and whether the arpeggio plays. */
  leadDuty: number;
  arpeggio: boolean;
  volume: number;
}

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as const;

/** MIDI number of a note name like «A4», «C#5» or «Bb3». */
export function midi(name: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`Nota mal escrita: ${name}`);
  const base = NOTE[m[1] as keyof typeof NOTE] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 12 * (Number(m[3]) + 1) + base;
}

export const freqOf = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);

/** The notes of a chord (MIDI, root in octave 3): «A:m» → A C E; «E:7» → E G# B D. */
export function chordNotes(chord: string): number[] {
  const [root, q = ''] = chord.split(':');
  const r = midi(`${root}3`);
  if (q === 'm') return [r, r + 3, r + 7];
  if (q === '7') return [r, r + 4, r + 7, r + 10];
  if (q === 'm7') return [r, r + 3, r + 7, r + 10];
  if (q === 'dim') return [r, r + 3, r + 6];
  return [r, r + 4, r + 7];
}

/** A note to play: from step `at`, `len` steps long. */
interface NoteEv {
  at: number;
  len: number;
  m: number;
}

/** Reads the melody bars into notes (holds extend the note before). */
export function melodyNotes(song: SongDef): NoteEv[] {
  const out: NoteEv[] = [];
  let cur: NoteEv | null = null;
  song.melody.forEach((bar, b) => {
    const toks = bar.trim().split(/\s+/);
    if (toks.length !== 16) throw new Error(`${song.id}: el compás ${b + 1} tiene ${toks.length} pasos, no 16`);
    toks.forEach((t, i) => {
      const at = b * 16 + i;
      if (t === '-') {
        if (cur) cur.len++;
      } else if (t === '.') cur = null;
      else {
        cur = { at, len: 1, m: midi(t) };
        out.push(cur);
      }
    });
  });
  return out;
}

type Voice = 'square' | 'triangle';

/** Adds one note to the buffer (wrapping past the end), with a short attack and a decay. */
function addTone(buf: Float32Array, sr: number, start: number, dur: number, f: number, voice: Voice, vol: number, duty = 0.5, decayTo = 0.6): void {
  const n = Math.floor((dur + 0.04) * sr);
  const s0 = Math.floor(start * sr);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    phase = (phase + f / sr) % 1;
    const w = voice === 'square' ? (phase < duty ? 1 : -1) : phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4;
    const a = Math.min(1, t / 0.004);
    const body = t < dur ? 1 - (1 - decayTo) * Math.min(1, t / Math.max(0.05, dur)) : decayTo * Math.max(0, 1 - (t - dur) / 0.04);
    buf[(s0 + i) % buf.length]! += w * a * body * vol;
  }
}

/** Drums: a kick (falling sine), a snare (noise, a little body) and a hat (short bright noise). */
function addDrum(buf: Float32Array, sr: number, start: number, kind: string, rng: Rng, vol: number): void {
  const s0 = Math.floor(start * sr);
  const len = kind === 'k' ? 0.14 : kind === 's' ? 0.13 : 0.035;
  const n = Math.floor(len * sr);
  let phase = 0;
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.pow(1 - t / len, kind === 'h' ? 1 : 2);
    let s: number;
    if (kind === 'k') {
      const f = 150 * Math.pow(45 / 150, t / len);
      phase = (phase + f / sr) % 1;
      s = Math.sin(phase * Math.PI * 2) * 1.1;
    } else {
      const nz = rng.range(-1, 1);
      lp += (nz - lp) * (kind === 's' ? 0.45 : 0.9);
      s = kind === 's' ? lp * 0.8 + Math.sin(t * 2 * Math.PI * 190) * 0.25 : nz - lp * 0.6;
    }
    buf[(s0 + i) % buf.length]! += s * env * vol * (kind === 'h' ? 0.35 : kind === 's' ? 0.55 : 0.8);
  }
}

/** Seconds one loop of the song lasts. */
export const songSeconds = (s: SongDef): number => (s.chords.length * 16 * 15) / s.bpm;

/** One loop of the song as samples, ready to loop with no gap. */
export function renderSong(song: SongDef, sr = 44100): Float32Array {
  if (song.melody.length !== song.chords.length) throw new Error(`${song.id}: ${song.melody.length} compases de melodía para ${song.chords.length} acordes`);
  const step = 15 / song.bpm;
  const buf = new Float32Array(Math.round(songSeconds(song) * sr));
  const rng = new Rng(`musica:${song.id}`);
  const v = song.volume;
  // Melody: square lead, an octave as written.
  for (const n of melodyNotes(song)) addTone(buf, sr, n.at * step, n.len * step * 0.92, freqOf(n.m), 'square', 0.16 * v, song.leadDuty, 0.55);
  song.chords.forEach((c, b) => {
    const notes = chordNotes(c);
    const root = notes[0]! - 12;
    const fifth = root + 7;
    // Bass: triangle, low.
    for (let i = 0; i < 16; i++) {
      const at = (b * 16 + i) * step;
      if (song.bass === 'pulse') {
        if (i % 4 === 0) addTone(buf, sr, at, step * 3, freqOf(i % 8 === 0 ? root : fifth), 'triangle', 0.34 * v, 0.5, 0.8);
      } else if (i % 2 === 0) addTone(buf, sr, at, step * 1.6, freqOf(i % 8 === 6 ? root + 12 : i % 4 === 2 ? fifth : root), 'triangle', 0.32 * v, 0.5, 0.7);
    }
    // Arpeggio: thin, quiet square over the chord, up an octave.
    if (song.arpeggio) for (let i = 0; i < 16; i++) addTone(buf, sr, (b * 16 + i) * step, step * 0.7, freqOf(notes[i % notes.length]! + 12), 'square', 0.05 * v, 0.125, 0.3);
    // Drums.
    const line = b === song.chords.length - 1 && song.fill ? song.fill : song.drums;
    [...line].forEach((k, i) => {
      if (k !== '.') addDrum(buf, sr, (b * 16 + i) * step, k, rng, v);
    });
  });
  // Keep it below clipping.
  let peak = 0;
  for (const s of buf) peak = Math.max(peak, Math.abs(s));
  if (peak > 0.95) for (let i = 0; i < buf.length; i++) buf[i]! *= 0.95 / peak;
  return buf;
}

/**
 * The songs. «planta»: the warehouse's background music, a mall muzak in A minor that has been
 * on a loop for twenty years and has gone a little sour. «jefa»: the boss, D minor, faster, the
 * bass running and the snare on every beat.
 */
export const SONGS: Record<string, SongDef> = {
  planta: {
    id: 'planta',
    bpm: 108,
    chords: ['A:m', 'F', 'C', 'G', 'A:m', 'F', 'D:m', 'E:7'],
    melody: [
      'E5 - - . C5 . A4 - - . B4 - C5 - . .',
      'A4 - - - . . C5 . D5 - C5 - A4 - . .',
      'G4 - - . C5 . E5 - - . D5 - C5 - . .',
      'B4 - - - . . D5 . G5 - F5 - D5 - . .',
      'E5 - - . C5 . A4 - - . B4 - C5 - . .',
      'A4 - - - . . C5 . F5 - E5 - C5 - . .',
      'D5 - - . F5 . A5 - - . G5 - F5 - . .',
      'E5 - - - - - G#4 - - - B4 - E5 - - -',
    ],
    drums: 'k...h...k.k.h...',
    fill: 'k...h...k.s.s.ss',
    bass: 'pulse',
    leadDuty: 0.25,
    arpeggio: true,
    volume: 0.8,
  },
  jefa: {
    id: 'jefa',
    bpm: 144,
    chords: ['D:m', 'D:m', 'Bb', 'C', 'D:m', 'D:m', 'G:m', 'A:7'],
    melody: [
      'D5 . D5 . F5 . D5 . A5 - - . G5 . F5 .',
      'E5 - F5 - E5 - D5 - C#5 - - - A4 - - -',
      'D5 . D5 . F5 . D5 . Bb5 - - . A5 . G5 .',
      'G5 - A5 - G5 - F5 - E5 - - - C5 - - -',
      'D5 . D5 . F5 . D5 . A5 - - . G5 . F5 .',
      'E5 - F5 - G5 - A5 - Bb5 - - - A5 - - -',
      'G5 . Bb5 . D6 - - . C6 . Bb5 . A5 . G5 .',
      'A5 - - - G5 - - - F5 - E5 - C#5 - E5 -',
    ],
    drums: 'k.h.s.h.k.k.s.h.',
    fill: 'k.h.s.h.s.s.ssss',
    bass: 'run',
    leadDuty: 0.5,
    arpeggio: false,
    volume: 0.8,
  },
};
