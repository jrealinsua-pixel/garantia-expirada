// Reads keyboard, mouse and gamepad and turns them into a sim Input for this tick.
import type { Input } from '../sim/world.ts';
import { PATTERNS } from '../data/patterns.ts';
import { actionOf, type Action } from './keymap.ts';
import { settings } from './settings.ts';

const DEADZONE = 0.22;

export interface AimSource {
  /** Player body centre in world space, for stick aiming. */
  bodyX: number;
  bodyY: number;
}

export class Controls {
  /** Keys held down right now (KeyboardEvent.code). */
  private held = new Set<string>();
  private scene: Phaser.Scene;
  private rollQueued = false;
  private patternQueued: string | undefined;
  private prevPadRoll = false;
  private prevPadSwap = false;
  private swapQueued = 0;
  private useQueued = false;
  private prevPadUse = false;
  private lastWheel = -1e9;
  private lastStickAim = { x: 1, y: 0 };
  /** 'mouse' or 'pad': whichever was used last decides the aim and the crosshair. */
  mode: 'mouse' | 'pad' = 'mouse';
  /** Set by tests / bots to drive the game without real devices. */
  override: Partial<Input> | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const kb = scene.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    // The page must not scroll with the arrows or the space bar.
    kb.addCapture([K.SPACE, K.UP, K.DOWN, K.LEFT, K.RIGHT]);
    // The keys are read by what they do (Opciones › Teclas can change them), from the options.
    kb.on('keydown', (e: KeyboardEvent) => {
      this.held.add(e.code);
      if (e.repeat) return;
      const a = actionOf(settings().keys, e.code);
      if (a === 'roll') this.rollQueued = true;
      // Change weapon: its key (next), or the mouse wheel (below).
      else if (a === 'swap') this.swapQueued = 1;
      else if (a === 'use') this.useQueued = true;
    });
    kb.on('keyup', (e: KeyboardEvent) => this.held.delete(e.code));
    // Keys let go while the window was not looking would stay held.
    const forget = (): void => this.held.clear();
    scene.game.events.on(Phaser.Core.Events.BLUR, forget);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.game.events.off(Phaser.Core.Events.BLUR, forget));
    scene.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      const now = scene.time.now;
      if (dy === 0 || now - this.lastWheel < 140) return;
      this.lastWheel = now;
      this.swapQueued = Math.sign(dy);
    });
    // Test room: number keys fire the enemy bullet patterns from the first dummy.
    const names = Object.keys(PATTERNS);
    kb.on('keydown', (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= names.length) this.patternQueued = names[n - 1];
    });
    scene.input.mouse?.disableContextMenu();
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.mode = 'mouse';
      if (p.rightButtonDown()) this.rollQueued = true;
    });
    scene.input.on('pointermove', () => (this.mode = 'mouse'));
  }

  private pad(): Gamepad | null {
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) if (p && p.connected) return p;
    return null;
  }

  private prevPadStart = true;

  /** The pad's Start button was just pressed (it opens the pause menu). */
  padPause(): boolean {
    const pad = this.pad();
    const down = !!pad?.buttons[9]?.pressed;
    const hit = down && !this.prevPadStart;
    this.prevPadStart = down;
    return hit;
  }

  /** Whether any key of `a` is held. */
  private down(a: Action): boolean {
    return settings().keys[a].some((c) => this.held.has(c));
  }

  /** Forgets every key held (the pause menu was up: their key-ups went elsewhere). */
  releaseAll(): void {
    this.held.clear();
  }

  read(src: AimSource): Input {
    let mx = (this.down('right') ? 1 : 0) - (this.down('left') ? 1 : 0);
    let my = (this.down('down') ? 1 : 0) - (this.down('up') ? 1 : 0);
    const pointer = this.scene.input.activePointer;
    const cam = this.scene.cameras.main;
    const wp = cam.getWorldPoint(pointer.x, pointer.y);
    let aimX = wp.x;
    let aimY = wp.y;
    let fire = pointer.leftButtonDown();
    let reload = this.down('reload');
    let roll = this.rollQueued;
    this.rollQueued = false;
    let swap = this.swapQueued;
    this.swapQueued = 0;
    let use = this.useQueued;
    this.useQueued = false;

    const pad = this.pad();
    if (pad) {
      const ax = pad.axes[0] ?? 0;
      const ay = pad.axes[1] ?? 0;
      if (Math.hypot(ax, ay) > DEADZONE) {
        mx = ax;
        my = ay;
      }
      const rx = pad.axes[2] ?? 0;
      const ry = pad.axes[3] ?? 0;
      const btn = (i: number): boolean => !!pad.buttons[i]?.pressed;
      if (Math.hypot(rx, ry) > DEADZONE) {
        this.mode = 'pad';
        const l = Math.hypot(rx, ry);
        this.lastStickAim = { x: rx / l, y: ry / l };
      }
      // Standard mapping: 0 A, 2 X, 4 LB, 5 RB, 6 LT, 7 RT.
      if (btn(7) || btn(5)) {
        fire = true;
        this.mode = 'pad';
      }
      const padRoll = btn(0) || btn(4) || btn(6);
      if (padRoll && !this.prevPadRoll) roll = true;
      this.prevPadRoll = padRoll;
      if (btn(2)) reload = true;
      // Y: next weapon.
      const padSwap = btn(3);
      if (padSwap && !this.prevPadSwap) swap = 1;
      this.prevPadSwap = padSwap;
      // B: active item.
      const padUse = btn(1);
      if (padUse && !this.prevPadUse) use = true;
      this.prevPadUse = padUse;
      if (this.mode === 'pad') {
        aimX = src.bodyX + this.lastStickAim.x * 60;
        aimY = src.bodyY + this.lastStickAim.y * 60;
      }
    }
    const input: Input = { moveX: mx, moveY: my, aimX, aimY, fire, roll, reload };
    if (swap) input.swap = swap;
    if (use) input.useItem = true;
    if (this.patternQueued) {
      input.debugPattern = this.patternQueued;
      this.patternQueued = undefined;
    }
    if (this.override) Object.assign(input, this.override);
    if (this.override?.roll) this.override.roll = false;
    if (this.override?.swap) this.override.swap = 0;
    if (this.override?.useItem) this.override.useItem = false;
    return input;
  }
}
