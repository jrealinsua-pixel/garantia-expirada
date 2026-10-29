// Plays the synthesised effects and the music with the Web Audio API. Created lazily after the
// first input (browsers block audio until the player interacts).
import { SFX, synth } from '../audio/synth.ts';
import { renderSong, SONGS } from '../audio/music.ts';

export class Sound {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private master: GainNode | null = null;
  volume = 0.7;
  /** Music: its own volume (0 to 1), the song that should be playing and the one that is. */
  musicVolume = 0.6;
  private musicGain: GainNode | null = null;
  private songs = new Map<string, AudioBuffer>();
  private wanted: string | null = null;
  private playing: { name: string; src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private ducked = false;

  setMusicVolume(v: number): void {
    this.musicVolume = Math.max(0, Math.min(1, v));
    this.applyMusicGain(0.05);
  }

  private applyMusicGain(ramp: number): void {
    const g = this.musicGain;
    if (!g || !this.ctx) return;
    const to = this.musicVolume * 0.55 * (this.ducked ? 0.35 : 1);
    g.gain.cancelScheduledValues(this.ctx.currentTime);
    g.gain.setValueAtTime(g.gain.value, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(to, this.ctx.currentTime + ramp);
  }

  /** Quieter while the game is paused. */
  duckMusic(on: boolean): void {
    this.ducked = on;
    this.applyMusicGain(0.25);
  }

  /**
   * Plays song `name` in a loop (src/audio/music.ts), fading out the one before; the same song
   * again carries on where it is. Null fades the music out. Before the first input it waits.
   */
  playMusic(name: string | null, fade = 0.6): void {
    this.wanted = name;
    const ctx = this.ctx;
    if (!ctx || !this.musicGain || this.playing?.name === name) return;
    const now = ctx.currentTime;
    if (this.playing) {
      const old = this.playing;
      old.gain.gain.setValueAtTime(old.gain.gain.value, now);
      old.gain.gain.linearRampToValueAtTime(0, now + fade);
      old.src.stop(now + fade + 0.05);
      this.playing = null;
    }
    const def = name ? SONGS[name] : undefined;
    if (!name || !def) return;
    let buf = this.songs.get(name);
    if (!buf) {
      const data = renderSong(def, ctx.sampleRate);
      buf = ctx.createBuffer(1, data.length, ctx.sampleRate);
      buf.getChannelData(0).set(data);
      this.songs.set(name, buf);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + Math.min(fade, 0.4));
    src.connect(gain).connect(this.musicGain);
    src.start(now);
    this.playing = { name, src, gain };
  }

  /** Changes the effects volume (0 to 1) at once, sounds already playing included. */
  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.volume;
  }

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume * 0.55;
    this.musicGain.connect(this.ctx.destination);
    for (const [name, p] of Object.entries(SFX)) {
      const data = synth(p, this.ctx.sampleRate, name);
      const buf = this.ctx.createBuffer(1, data.length, this.ctx.sampleRate);
      buf.getChannelData(0).set(data);
      this.buffers.set(name, buf);
    }
    // The song asked for before the first input starts now.
    const w = this.wanted;
    this.wanted = null;
    if (w) this.playMusic(w);
  }

  play(name: string, opts: { volume?: number; detune?: number } = {}): void {
    const ctx = this.ctx;
    const buf = this.buffers.get(name);
    if (!ctx || !buf || !this.master || ctx.state !== 'running') return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.detune.value = opts.detune ?? 0;
    const g = ctx.createGain();
    g.gain.value = opts.volume ?? 1;
    src.connect(g).connect(this.master);
    src.start();
  }
}
