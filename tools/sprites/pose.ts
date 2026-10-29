// Poses for the enemies' idle and walk frames, drawn the same way as the toaster's (HERO_FRAMES):
// the legs on their own layer and everything above them on another, moved up or down by `bob`.
import { Canvas } from '../../src/art/canvas.ts';
import { feet, type Ramp } from '../../src/art/lib.ts';

export interface Pose {
  /** Back and front leg x positions. */
  xb: number;
  xf: number;
  /** Vertical offset of the body (+1 = breathes out and sinks, -1 = lifted mid-stride). */
  bob: number;
  /** Raise the back (-1) or front (1) foot this many px off the floor (big legs only). */
  lift?: { leg: -1 | 1; px: number };
}

export interface PoseFrame {
  name: string;
  pose: Pose;
}

/**
 * The frame set every walking enemy gets, from its rest leg positions: two of breathing (the
 * first is the rest pose, so it reproduces the approved sprite) and four of stride (contact,
 * passing lifted, contact with the legs swapped, passing). Same rhythm as the toaster's walk.
 */
export function poseCycle(xb: number, xf: number): PoseFrame[] {
  const m = Math.floor((xb + xf) / 2);
  return [
    { name: 'idle0', pose: { xb, xf, bob: 0 } },
    { name: 'idle1', pose: { xb, xf, bob: 1 } },
    { name: 'walk0', pose: { xb: xb - 1, xf: xf + 1, bob: 0 } },
    { name: 'walk1', pose: { xb: m - 1, xf: m + 1, bob: -1 } },
    { name: 'walk2', pose: { xb: xf + 1, xf: xb - 1, bob: 0 } },
    { name: 'walk3', pose: { xb: m + 1, xf: m - 1, bob: -1 } },
  ];
}

/**
 * Short legs for a pose: like `feet`, but when the body is lifted the legs grow one px upwards
 * so they never come loose from it.
 */
export function poseFeet(cv: Canvas, pose: Pose, y: number, opts: { R?: Ramp; L?: number; leg?: Ramp; shoe?: Ramp }): void {
  const L = opts.L ?? 4;
  const up = Math.max(0, -pose.bob);
  feet(cv, pose.xb, pose.xf, y - up, { ...opts, L: L + up });
}

/** Legs layer under the body layer, the body moved by `bob`. */
export function joinPose(legs: Canvas, body: Canvas, pose: Pose): Canvas {
  const out = new Canvas(legs.w, legs.h);
  out.blit(legs, 0, 0);
  out.blit(body, 0, pose.bob);
  return out;
}
