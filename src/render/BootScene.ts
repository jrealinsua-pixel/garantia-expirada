// Loads the sprite sheets listed in assets/sprites.json and registers the bitmap font.
import { registerFont } from './textures.ts';

interface SheetInfo {
  file: string;
  frameW: number;
  frameH: number;
  frames: number;
}

import { dailyKey, isDailyKey } from '../sim/daily.ts';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.load.json('sprites', 'assets/sprites.json');
    this.load.once('filecomplete-json-sprites', () => {
      const manifest = this.cache.json.get('sprites') as Record<string, SheetInfo>;
      for (const [key, s] of Object.entries(manifest)) {
        if (s.frames > 1) this.load.spritesheet(key, `assets/${s.file}`, { frameWidth: s.frameW, frameHeight: s.frameH });
        else this.load.image(key, `assets/${s.file}`);
      }
    });
  }

  create(): void {
    registerFont(this);
    // Links with a room or a seed (tests, the panel's previews) go straight into the game.
    const params = new URLSearchParams(location.search);
    // ?mostrador: straight into the Mostrador de Devoluciones, as «Partida nueva» does.
    if (params.has('mostrador')) this.scene.start('game', { hub: true });
    // ?reto[=AAAA-MM-DD]: straight into the daily challenge (today's, or that day's), as the title's «Reto del día» does.
    else if (params.has('reto')) this.scene.start('game', { daily: isDailyKey(params.get('reto') ?? '') ? params.get('reto')! : dailyKey(new Date()) });
    // ?final[=n]: straight into the true ending (M12 (5)), as if seen n times before.
    else if (params.has('final')) this.scene.start('final', { times: Number(params.get('final')) || 0 });
    else this.scene.start(params.has('sala') || params.has('semilla') ? 'game' : 'title');
  }
}
