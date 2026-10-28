// Turns the shared pixel Canvas into Phaser textures, and registers the bitmap font.
import { Canvas } from '../art/canvas.ts';
import { buildFontAtlas, FONT_H, FONT_LINE } from '../art/font.ts';

export const FONT = 'letra-pequena';

export function canvasToHtml(cv: Canvas): HTMLCanvasElement {
  const el = document.createElement('canvas');
  el.width = cv.w;
  el.height = cv.h;
  const ctx = el.getContext('2d')!;
  const img = ctx.createImageData(cv.w, cv.h);
  let o = 0;
  for (let y = 0; y < cv.h; y++) {
    for (let x = 0; x < cv.w; x++) {
      const c = cv.p[y]![x]!;
      img.data[o++] = c[0];
      img.data[o++] = c[1];
      img.data[o++] = c[2];
      img.data[o++] = c[3];
    }
  }
  ctx.putImageData(img, 0, 0);
  return el;
}

export function addCanvasTexture(scene: Phaser.Scene, key: string, cv: Canvas): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, canvasToHtml(cv));
}

/** Soft floor shadow (pixel ellipse) of the given radii. */
export function shadowTexture(scene: Phaser.Scene, rx: number, ry: number): string {
  const key = `sombra-${rx}x${ry}`;
  if (scene.textures.exists(key)) return key;
  const cv = new Canvas(rx * 2 + 1, ry * 2 + 1);
  for (let y = 0; y <= ry * 2; y++) {
    for (let x = 0; x <= rx * 2; x++) {
      if (((x - rx) / rx) ** 2 + ((y - ry) / ry) ** 2 <= 1) cv.set(x, y, [8, 6, 16, 105]);
    }
  }
  addCanvasTexture(scene, key, cv);
  return key;
}

export function registerFont(scene: Phaser.Scene): void {
  const { canvas, cells } = buildFontAtlas();
  addCanvasTexture(scene, FONT, canvas);
  let xml = `<font><info face="${FONT}" size="${FONT_H}"/><common lineHeight="${FONT_LINE}"/><chars>`;
  xml += `<char id="32" x="0" y="0" width="0" height="0" xoffset="0" yoffset="0" xadvance="3"/>`;
  for (const [ch, c] of cells) {
    xml += `<char id="${ch.codePointAt(0)}" x="${c.x}" y="0" width="${c.w}" height="${FONT_H + 2}" xoffset="0" yoffset="0" xadvance="${c.w - 1}"/>`;
  }
  xml += '</chars></font>';
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const frame = scene.textures.getFrame(FONT);
  const data = Phaser.GameObjects.BitmapText.ParseXMLBitmapFont(doc, frame, 0, 0);
  scene.cache.bitmapFont.add(FONT, { data, texture: FONT, frame: null });
}
