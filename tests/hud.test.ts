import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CARD_WIDTH, HUD_H, HUD_W, TITLE_BOTTOM, TITLE_TOP, hudLayout, inside, overlaps, splitTitle, stackFloat, titleX, type Box, type HudState } from '../src/render/hud.ts';
import { ROOMS } from '../src/data/rooms.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import { textWidth } from '../src/art/font.ts';

const SCREEN: Box = { x: 0, y: 0, w: HUD_W, h: HUD_H };
const HINT = 'WASD mover · ratón apuntar · clic disparar · espacio rodar · R recargar';
// The widest minimap there can be: a 9 × 9 grid (see src/sim/floor.ts).
const BIG_MAP = { mapW: 9 * 11 - 2 + 6, mapH: 9 * 9 - 2 + 6 };

function states(): HudState[] {
  const out: HudState[] = [];
  const mags = [...Object.values(WEAPONS).map((w) => w.magazine), 1, 40, 48];
  for (const magazine of mags) {
    for (const items of [0, 1, 7, 18, 30]) {
      for (const hearts of [3, 6, 10]) {
        for (const hasActive of [false, true]) {
          for (const hint of [null, HINT, `${HINT} · 1-5 balas enemigas`]) {
            for (const map of [{ mapW: 0, mapH: 0 }, { mapW: 39, mapH: 33 }, BIG_MAP]) {
              out.push({ hearts, coupons: items * 37, tickets: items % 4, hasActive, items, magazine, hint, ...map });
            }
          }
        }
      }
    }
  }
  return out;
}

test('ninguna parte del HUD pisa a otra, y todo cabe en la pantalla', () => {
  for (const s of states()) {
    const l = hudLayout(s);
    const title: Box = { x: l.titleSpan.left, y: TITLE_TOP, w: l.titleSpan.right - l.titleSpan.left, h: TITLE_BOTTOM - TITLE_TOP };
    const zones: [string, Box | null][] = [['estado', l.status], ['arma', l.weapon], ['objetos', l.itemsBox], ['ayuda', l.hintBox], ['mapa', l.map], ['título', title]];
    const live = zones.filter((z): z is [string, Box] => !!z[1]);
    const what = JSON.stringify(s);
    for (const [name, b] of live) assert.ok(inside(b, SCREEN), `${name} se sale de la pantalla con ${what}`);
    for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        assert.ok(!overlaps(live[i]![1], live[j]![1]), `${live[i]![0]} pisa ${live[j]![0]} con ${what}`);
      }
    }
    for (const h of l.hearts) assert.ok(inside({ ...h, w: 9, h: 8 }, l.status), `un corazón fuera de su placa con ${what}`);
    assert.ok(inside({ ...l.ticketText, w: textWidth(String(s.tickets)), h: 7 }, l.status));
    assert.ok(l.ticket.x >= l.couponText.x + textWidth(String(s.coupons)) + 4, 'el ticket no pisa los cupones');
    for (const p of l.pips) assert.ok(inside({ ...p, w: 3, h: 6 }, l.weapon), `munición fuera de su placa con ${what}`);
    assert.ok(inside({ ...l.gun, w: 18, h: 11 }, l.weapon), `el arma fuera de su placa con ${what}`);
    for (const p of l.items) assert.ok(l.itemsBox && inside({ ...p, w: 16, h: 16 }, l.itemsBox), `un objeto fuera de su placa con ${what}`);
    for (const h of l.hintLines) assert.ok(l.hintBox && inside({ x: h.x, y: h.y, w: textWidth(h.text), h: 7 }, l.hintBox));
    // The description window (up to 90 px tall) fits up top and down below without covering anything.
    const cardX = Math.round((HUD_W - CARD_WIDTH) / 2);
    const up: Box = { x: cardX, y: l.cardTop, w: CARD_WIDTH, h: 90 };
    const down: Box = { x: cardX, y: l.cardBottom - 90, w: CARD_WIDTH, h: 90 };
    for (const [name, b] of live) {
      if (name !== 'título') assert.ok(!overlaps(up, b), `la ventana de arriba pisa ${name} con ${what}`);
      assert.ok(!overlaps(down, b), `la ventana de abajo pisa ${name} con ${what}`);
    }
    assert.ok(l.cardTop >= TITLE_BOTTOM, 'la ventana de arriba no tapa el nombre de la sala');
  }
});

test('el nombre de cada sala cabe arriba, entre las corazones y el mapa más ancho', () => {
  const l = hudLayout({ hearts: 10, coupons: 999, tickets: 9, hasActive: true, items: 0, magazine: 14, hint: null, ...BIG_MAP });
  for (const room of Object.values(ROOMS)) {
    const w = textWidth(room.name);
    const x = titleX(w + 8, l.titleSpan);
    assert.ok(x >= l.titleSpan.left && x + w + 8 <= l.titleSpan.right, `«${room.name}» no cabe (${w} px)`);
  }
  assert.equal(titleX(100, { left: 80, right: 400 }), 190, 'si cabe, va en el centro de la pantalla');
  assert.equal(titleX(200, { left: 200, right: 450 }), 225, 'si no, en el centro del hueco');
  assert.deepEqual(splitTitle('Muelle de Reclamaciones (Cerrado por Reformas)'), { main: 'Muelle de Reclamaciones', sub: '(Cerrado por Reformas)' });
  assert.deepEqual(splitTitle('Pasillo de Devoluciones'), { main: 'Pasillo de Devoluciones', sub: '' });
});

test('la ayuda de controles pasa a dos líneas si se iba a meter debajo del arma', () => {
  const long = `${HINT} · 1-5 balas enemigas`;
  const one = hudLayout({ hearts: 3, coupons: 0, tickets: 0, hasActive: false, items: 0, magazine: 14, hint: HINT, mapW: 0, mapH: 0 });
  assert.equal(one.hintLines.length, 1);
  const two = hudLayout({ hearts: 3, coupons: 0, tickets: 0, hasActive: false, items: 3, magazine: 48, hint: long, mapW: 0, mapH: 0 });
  assert.equal(two.hintLines.length, 2);
  assert.equal(two.hintLines.map((h) => h.text).join(' · '), long, 'no se pierde nada al partirla');
  assert.ok(two.itemsBox!.y + two.itemsBox!.h <= two.hintBox!.y, 'los objetos suben para dejarle sitio');
});

test('los textos flotantes no se amontonan: el nuevo sube por encima del que pisa', () => {
  const a: Box = { x: 100, y: 100, w: 20, h: 8 };
  assert.equal(stackFloat([], a), 100);
  const y = stackFloat([a], { x: 105, y: 102, w: 10, h: 8 });
  assert.ok(y + 8 <= 100, 'queda encima');
  const b: Box = { x: 105, y, w: 10, h: 8 };
  const y2 = stackFloat([a, b], { x: 104, y: 101, w: 12, h: 8 });
  assert.ok(!overlaps({ x: 104, y: y2, w: 12, h: 8 }, a) && !overlaps({ x: 104, y: y2, w: 12, h: 8 }, b), 'y el tercero encima de los dos');
  assert.equal(stackFloat([a], { x: 200, y: 100, w: 10, h: 8 }), 100, 'lejos no se mueve');
});
