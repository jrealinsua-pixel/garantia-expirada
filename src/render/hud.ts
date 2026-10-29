// Where every piece of the HUD goes. Pure (no Phaser): the scene asks for a layout and draws it,
// and tests/hud.test.ts checks that nothing steps on anything else.
import { textWidth } from '../art/font.ts';

export const HUD_W = 480;
export const HUD_H = 270;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function inside(a: Box, outer: Box): boolean {
  return a.x >= outer.x && a.y >= outer.y && a.x + a.w <= outer.x + outer.w && a.y + a.h <= outer.y + outer.h;
}

/** What the HUD has to show right now. */
export interface HudState {
  /** Heart containers (one per 2 life). */
  hearts: number;
  coupons: number;
  tickets: number;
  hasActive: boolean;
  /** Passive items carried. */
  items: number;
  /** Rounds in the magazine of the weapon in hand. */
  magazine: number;
  /** Size of the minimap's plate (0 × 0 when there is none). */
  mapW: number;
  mapH: number;
  /** The controls hint, while it is up. */
  hint: string | null;
}

export interface HudLayout {
  /** Top left: hearts, coupons, tickets and (if any) the active item. */
  status: Box;
  hearts: Point[];
  coupon: Point;
  couponText: Point;
  ticket: Point;
  ticketText: Point;
  /** The active item's slot (its sprite sits 2 px in) and its battery marks. */
  active: Point | null;
  /** Bottom right: the gun, the ammo count and the magazine's pips. */
  weapon: Box;
  gun: Point;
  ammoText: Point;
  pips: Point[];
  /** Bottom left: the passive items, in rows that grow upwards. */
  itemsBox: Box | null;
  items: Point[];
  /** Bottom left, under the items: the controls hint (one or two lines). */
  hintBox: Box | null;
  hintLines: { text: string; x: number; y: number }[];
  /** Top right. */
  map: Box | null;
  /** Free space along the top for the room's name. */
  titleSpan: { left: number; right: number };
  /** Where the description window may go: up top or down below, clear of the rest. */
  cardTop: number;
  cardBottom: number;
}

const PAD = 3;
const HEART_STEP = 10;
const ITEM_STEP = 17;
const ITEM_ROW = 18;
const PIPS_PER_ROW = 24;
const LINE = 10;
const MARGIN = 4;

/** Places everything on the HUD for `s`. */
export function hudLayout(s: HudState): HudLayout {
  // Top left.
  const hearts = Array.from({ length: s.hearts }, (_, i) => ({ x: 8 + i * HEART_STEP, y: 8 }));
  const coupon = { x: 7, y: 19 };
  const couponText = { x: 21, y: 20 };
  const ticket = { x: Math.max(44, couponText.x + textWidth(String(s.coupons)) + 8), y: 18 };
  const ticketText = { x: ticket.x + 12, y: 20 };
  const right = Math.max(8 + s.hearts * HEART_STEP - 2, ticketText.x + textWidth(String(s.tickets)), s.hasActive ? 33 : 0);
  const status = { x: PAD, y: PAD, w: right + 3 - PAD, h: (s.hasActive ? 55 : 30) - PAD };
  const active = s.hasActive ? { x: 7, y: 31 } : null;

  // Bottom right.
  const rows = Math.max(1, Math.ceil(s.magazine / PIPS_PER_ROW));
  const inFirst = Math.min(PIPS_PER_ROW, s.magazine);
  const pips: Point[] = [];
  for (let i = 0; i < s.magazine; i++) {
    const row = Math.floor(i / PIPS_PER_ROW);
    const inRow = Math.min(PIPS_PER_ROW, s.magazine - row * PIPS_PER_ROW);
    pips.push({ x: HUD_W - 8 - (inRow - (i % PIPS_PER_ROW)) * 4, y: HUD_H - 14 - row * 8 });
  }
  const gun = { x: HUD_W - 12 - inFirst * 4 - 20, y: HUD_H - 15 };
  const ammoText = { x: HUD_W - 8, y: HUD_H - 26 - (rows - 1) * 8 };
  // «Recargando» is the widest the ammo count gets.
  const left = Math.min(gun.x, HUD_W - 8 - textWidth('RECARGANDO')) - PAD;
  const weapon = { x: left, y: ammoText.y - PAD, w: HUD_W - PAD - left, h: HUD_H - PAD - (ammoText.y - PAD) + 1 };

  // Bottom left: the hint first (one line, or two if it would run into the weapon), the items over it.
  const room = weapon.x - MARGIN - 8;
  let hintLines: string[] = [];
  if (s.hint) {
    if (textWidth(s.hint) <= room) hintLines = [s.hint];
    else {
      const parts = s.hint.split(' · ');
      let best = 1;
      let bestW = Infinity;
      for (let k = 1; k < parts.length; k++) {
        const w = Math.max(textWidth(parts.slice(0, k).join(' · ')), textWidth(parts.slice(k).join(' · ')));
        if (w < bestW) {
          bestW = w;
          best = k;
        }
      }
      hintLines = [parts.slice(0, best).join(' · '), parts.slice(best).join(' · ')];
    }
  }
  const hintTop = HUD_H - 16 - (hintLines.length - 1) * LINE;
  const hintBox = hintLines.length
    ? { x: PAD + 2, y: hintTop - PAD, w: Math.max(...hintLines.map((l) => textWidth(l))) + 6, h: hintLines.length * LINE + PAD + 1 }
    : null;
  const hintPos = hintLines.map((text, i) => ({ text, x: 8, y: hintTop + i * LINE }));
  const perRow = Math.max(1, Math.floor((weapon.x - MARGIN - 8 + (ITEM_STEP - 16)) / ITEM_STEP));
  const itemsBottom = (hintBox ? hintBox.y : HUD_H - PAD) - 2;
  const items: Point[] = [];
  for (let i = 0; i < s.items; i++) {
    const row = Math.floor(i / perRow);
    items.push({ x: 8 + (i % perRow) * ITEM_STEP, y: itemsBottom - 3 - 16 - row * ITEM_ROW });
  }
  const itemRows = Math.ceil(s.items / perRow);
  const itemsBox = s.items
    ? {
        x: PAD + 2,
        y: itemsBottom - 3 - 16 - (itemRows - 1) * ITEM_ROW - PAD,
        w: Math.min(s.items, perRow) * ITEM_STEP - 1 + 6,
        h: 16 + (itemRows - 1) * ITEM_ROW + PAD * 2,
      }
    : null;

  // Top right and top middle.
  const map = s.mapW > 0 ? { x: HUD_W - 6 - s.mapW, y: 6, w: s.mapW, h: s.mapH } : null;
  const titleSpan = { left: status.x + status.w + MARGIN, right: (map ? map.x : HUD_W - PAD) - MARGIN };

  // The description window: below the room's name, clear of the status corner and the minimap if
  // they reach that far in; or above whatever sits along the bottom.
  const cardX = Math.round((HUD_W - CARD_WIDTH) / 2);
  const cardTop = Math.max(TITLE_BOTTOM + MARGIN, ...[status, map].filter((b): b is Box => overlapsX(b, cardX)).map((b) => b.y + b.h + MARGIN));
  const bottoms = [weapon, itemsBox, hintBox].filter((b): b is Box => overlapsX(b, cardX)).map((b) => b.y);
  const cardBottom = Math.min(HUD_H - PAD, ...bottoms) - MARGIN;

  return { status, hearts, coupon, couponText, ticket, ticketText, active, weapon, gun, ammoText, pips, itemsBox, items, hintBox, hintLines: hintPos, map, titleSpan, cardTop, cardBottom };
}

/** Width of the description window (its x is centred). */
export const CARD_WIDTH = 292;
/** The room's name sits in a strip along the top, down to here. */
export const TITLE_TOP = 4;
export const TITLE_BOTTOM = 20;

function overlapsX(b: Box | null, cardX: number): boolean {
  return !!b && b.x < cardX + CARD_WIDTH && cardX < b.x + b.w;
}

/**
 * A room's name, split into what it is and the joke in brackets after it
 * («Muelle de Reclamaciones» and «(Cerrado por Reformas)»), so the joke can go in a quieter colour.
 */
export function splitTitle(name: string): { main: string; sub: string } {
  const i = name.indexOf(' (');
  return i < 0 ? { main: name, sub: '' } : { main: name.slice(0, i), sub: name.slice(i + 1) };
}

/**
 * Where the room's name goes: centred on the screen if it fits there, otherwise centred in the
 * free strip between the status corner and the minimap. Returns the x of its left edge.
 */
export function titleX(width: number, span: { left: number; right: number }): number {
  const centred = Math.round((HUD_W - width) / 2);
  if (centred >= span.left && centred + width <= span.right) return centred;
  return Math.round(span.left + Math.max(0, (span.right - span.left - width) / 2));
}

/**
 * Floating text that would land on top of another one still in the air goes up above it
 * instead. Returns the y for `box` (its top).
 */
export function stackFloat(placed: Box[], box: Box): number {
  let y = box.y;
  for (let tries = 0; tries < 8; tries++) {
    const hit = placed.find((o) => overlaps(o, { ...box, y }));
    if (!hit) break;
    y = hit.y - box.h - 1;
  }
  return y;
}
