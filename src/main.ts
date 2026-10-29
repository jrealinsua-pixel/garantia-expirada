// Entry point. Phaser is loaded as a global from vendor/phaser (see index.html).
import { BootScene } from './render/BootScene.ts';
import { GameScene, VIEW_H, VIEW_W } from './render/GameScene.ts';
import { PauseScene, TitleScene } from './render/PauseScene.ts';

declare const __VERSION__: string;

function integerZoom(): number {
  return Math.max(1, Math.floor(Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H)));
}

const errors: string[] = [];
window.addEventListener('error', (e) => errors.push(String(e.message)));
(window as unknown as { __GE_ERRORS__: string[] }).__GE_ERRORS__ = errors;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'juego',
  width: VIEW_W,
  height: VIEW_H,
  backgroundColor: '#0e0c16',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.NONE, zoom: integerZoom() },
  fps: { target: 60 },
  banner: false,
  scene: [BootScene, TitleScene, GameScene, PauseScene],
});

// Tests look at which scene is running.
(window as unknown as { __GE_PHASER__: Phaser.Game }).__GE_PHASER__ = game;

window.addEventListener('resize', () => game.scale.setZoom(integerZoom()));
console.info(`Garantía Expirada ${__VERSION__}`);
