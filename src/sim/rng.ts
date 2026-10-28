// Seeded pseudo-random generator (sfc32). The whole simulation must use this, never Math.random,
// so that a seed reproduces a run exactly (tests and bots depend on it).

export interface RngState {
  a: number;
  b: number;
  c: number;
  d: number;
}

/** Turns any string or number into a 32-bit seed (FNV-1a for strings). */
export function hashSeed(seed: string | number): number {
  if (typeof seed === 'number') return seed >>> 0;
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export class Rng {
  private s: RngState;

  constructor(seed: string | number) {
    const h = hashSeed(seed);
    this.s = { a: 0x9e3779b9, b: 0x243f6a88, c: 0xb7e15162, d: h };
    for (let i = 0; i < 15; i++) this.nextU32();
  }

  static fromState(state: RngState): Rng {
    const r = new Rng(0);
    r.s = { ...state };
    return r;
  }

  state(): RngState {
    return { ...this.s };
  }

  nextU32(): number {
    let { a, b, c, d } = this.s;
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    this.s = { a, b, c, d };
    return t >>> 0;
  }

  /** Float in [0, 1). */
  next(): number {
    return this.nextU32() / 4294967296;
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** Integer in [min, max], both inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick on an empty list');
    return items[Math.floor(this.next() * items.length)]!;
  }

  /** Independent child generator, so adding draws in one system does not shift another. */
  fork(label: string): Rng {
    return new Rng((this.nextU32() ^ hashSeed(label)) >>> 0);
  }
}
