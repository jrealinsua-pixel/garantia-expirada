// Loads the sprite sheets listed in assets/sprites.json and registers the bitmap font.
import { registerFont } from './textures.ts';

interface SheetInfo {
  file: string;
  frameW: number;
  frameH: number;
  frames: number;
}

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
    this.scene.start(params.has('sala') || params.has('semilla') ? 'game' : 'title');
  }
}
