// Props, bullets, effects and HUD pieces. Props and bullets are ports of tools/referencia/build2.py.
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { BLUE, BROWN, BURNT, CARD, CREAM, DSTEEL, FRT, GLOVE, GLOW, GLOW2, GREEN, ICE, K, RED, RUSTR, STEEL, TOASTC, WHITE, YEL } from '../../src/art/lib.ts';
import { stencil, stencilWidth } from '../../src/art/warehouse.ts';
import { GLYPHS, textWidth } from '../../src/art/font.ts';
import { box, cube, ellipse, hand, OFFICE, outline, ramp, type Ramp } from '../../src/art/lib.ts';

export function makeCaja(): Canvas {
  const cv = new Canvas(24, 24);
  box(cv, 1, 3, 22, 20, CARD);
  cv.rect(1, 8, 22, 1, CARD[3]!);
  cv.rect(10, 3, 4, 20, CARD[0]!);
  cv.rect(16, 12, 5, 5, RED[1]!);
  cv.set(18, 14, WHITE);
  cv.set(2, 20, CARD[3]!);
  return outline(cv);
}

export function makeBarril(): Canvas {
  const cv = new Canvas(16, 24);
  box(cv, 2, 2, 12, 20, RED);
  cv.rect(2, 7, 12, 1, RED[3]!);
  cv.rect(2, 16, 12, 1, RED[3]!);
  cv.rect(5, 10, 6, 4, YEL[1]!);
  cv.rect(7, 11, 2, 1, K);
  cv.rect(7, 13, 2, 1, K);
  return outline(cv);
}

export function makeCarrito(): Canvas {
  const cv = new Canvas(28, 24);
  for (const [x, y] of [[0, 2], [1, 2], [2, 2], [2, 3], [3, 4]] as const) cv.set(x, y, STEEL[1]!);
  cv.rect(4, 4, 22, 1, STEEL[1]!);
  cv.rect(6, 14, 18, 1, STEEL[2]!);
  for (const x of [4, 9, 14, 19, 24]) cv.rect(x, 4, 1, 11, STEEL[2]!);
  cv.rect(4, 9, 22, 1, STEEL[2]!);
  const goods: Array<[number, number, number, number, RGBA]> = [[7, 10, 4, 4, RED[1]!], [12, 11, 5, 3, YEL[1]!], [18, 10, 4, 4, BLUE[1]!], [8, 6, 3, 3, GREEN]];
  for (const [x, y, w, h, c] of goods) cv.rect(x, y, w, h, c);
  for (const x of [8, 21]) {
    ellipse(cv, x, 19, 2.5, 2.5, GLOVE[1]!);
    cv.set(x, 19, STEEL[1]!);
  }
  cv.rect(8, 15, 1, 2, STEEL[3]!);
  cv.rect(21, 15, 1, 2, STEEL[3]!);
  return outline(cv);
}

// Floor 2 (Informática) versions of the three obstacles: same footprint and collision box as the
// warehouse's (src/data/props.ts), so the simulation does not change; only the look.

const BEIGE = ramp('#efe6c8', '#d4c79f', '#a99b74', '#766b4e');

/** «Caja» upstairs: a dead CRT monitor, beige, with a sticky note nobody read. */
export function makeMonitorCrt(): Canvas {
  const cv = new Canvas(24, 24);
  cube(cv, 1, 3, 22, 19, 7, 4, BEIGE, BEIGE, BEIGE);
  // The side is the darkest ramp (it faces away from the light).
  cv.rect(1, 7, 7, 14, BEIGE[2]!);
  cv.rect(1, 7, 1, 14, BEIGE[3]!);
  for (let y = 9; y < 19; y += 2) cv.rect(3, y, 3, 1, BEIGE[3]!);
  // Screen: dark glass, a glint top left, a crack.
  cv.rect(9, 8, 12, 10, hx('#1a2a26'));
  cv.rect(9, 8, 12, 1, hx('#2c4440'));
  cv.set(10, 9, WHITE);
  cv.set(11, 9, hx('#6f8f88'));
  for (const [x, y] of [[17, 10], [16, 11], [16, 12], [15, 13], [17, 12], [18, 13]] as const) cv.set(x, y, hx('#6f8f88'));
  // Power LED (off) and the sticky note.
  cv.set(20, 19, hx('#4a4538'));
  cv.rect(18, 15, 4, 4, YEL[1]!);
  cv.rect(18, 15, 4, 1, YEL[0]!);
  cv.rect(19, 17, 2, 1, YEL[3]!);
  return outline(cv);
}

/** «Barril» upstairs: a water cooler with the bottle upside down (and almost empty). */
export function makeWaterCooler(): Canvas {
  const cv = new Canvas(16, 24);
  // Bottle.
  ellipse(cv, 8, 6, 5, 4, BLUE[0]!);
  cv.rect(3, 6, 11, 4, BLUE[0]!);
  cv.rect(4, 5, 2, 4, WHITE);
  cv.rect(3, 9, 11, 1, BLUE[1]!);
  cv.rect(6, 2, 4, 1, BLUE[2]!);
  // Body.
  box(cv, 3, 10, 11, 12, ramp('#f4f1e8', '#d3d8e4', '#aab1c4', '#7d8499'));
  cv.rect(11, 11, 2, 10, hx('#aab1c4'));
  // Two taps: cold and hot.
  cv.rect(5, 13, 2, 2, BLUE[1]!);
  cv.rect(8, 13, 2, 2, RED[1]!);
  cv.rect(4, 17, 7, 1, hx('#7d8499'));
  return outline(cv);
}

/** «Carrito» upstairs: an office chair on wheels, the backrest behind (it rolls; bullets go over it). */
export function makeOfficeChair(): Canvas {
  const cv = new Canvas(28, 24);
  // Backrest (on the left: the chair faces right, like everything else).
  box(cv, 5, 1, 7, 12, OFFICE);
  cv.rect(6, 2, 1, 9, hx('#7a7f9a'));
  // Seat.
  box(cv, 7, 11, 16, 4, OFFICE);
  cv.rect(8, 11, 14, 1, hx('#7a7f9a'));
  // Armrest.
  cv.rect(12, 8, 8, 1, OFFICE[1]!);
  cv.rect(18, 9, 1, 2, OFFICE[1]!);
  // Gas lift and the star base with wheels.
  cv.rect(14, 15, 2, 4, STEEL[2]!);
  cv.rect(14, 15, 1, 4, STEEL[1]!);
  cv.rect(5, 19, 20, 1, OFFICE[1]!);
  cv.rect(9, 18, 12, 1, OFFICE[1]!);
  for (const x of [5, 15, 24]) {
    ellipse(cv, x, 21, 1.6, 1.6, GLOVE[2]!);
    cv.set(x, 21, GLOVE[0]!);
  }
  return outline(cv);
}

// Floor 3 (Juguetería) versions of the three obstacles: same footprint and collision box again.

const PLAST_PINK = ramp('#eec2c8', '#d899a6', '#ad6f80', '#7c4a5c');
const ROOF = ramp('#b8b0d8', '#8a7fb8', '#625892', '#423a6a');

/** «Caja» on floor 3: a dolls' house, closed for refurbishment (tape across the door). */
export function makeDollhouse(): Canvas {
  const cv = new Canvas(24, 24);
  // Walls: pink plastic, the right side in shadow.
  box(cv, 2, 10, 20, 13, PLAST_PINK);
  cv.rect(17, 10, 5, 13, PLAST_PINK[2]!);
  cv.rect(17, 10, 1, 13, PLAST_PINK[3]!);
  // Roof: a triangle of lilac tiles, a chimney.
  for (let j = 0; j < 8; j++) cv.rect(12 - j - 2, 2 + j, 2 * j + 4, 1, j === 0 ? ROOF[0]! : j % 2 === 0 ? ROOF[2]! : ROOF[1]!);
  cv.rect(1, 9, 22, 1, ROOF[3]!);
  cv.rect(16, 2, 3, 4, ROOF[2]!);
  cv.rect(16, 2, 3, 1, ROOF[1]!);
  // Windows: pale glass with a white cross frame (not dark holes: dark ones read as eyes), and the door.
  for (const wx of [3, 12]) {
    cv.rect(wx, 12, 5, 5, WHITE);
    cv.rect(wx + 1, 13, 3, 3, BLUE[0]!);
    cv.rect(wx + 2, 13, 1, 3, WHITE);
    cv.rect(wx + 1, 14, 3, 1, WHITE);
  }
  cv.rect(8, 17, 4, 6, hx('#6a4a3a'));
  cv.set(11, 20, YEL[1]!);
  // «Cerrado por reformas»: yellow and black tape across the door.
  for (let i = 0; i < 14; i++) {
    const x = 3 + i;
    const y = 20 - Math.floor(i / 3);
    cv.set(x, y, Math.floor(i / 2) % 2 === 0 ? YEL[1]! : K);
    cv.set(x, y + 1, Math.floor((i + 1) / 2) % 2 === 0 ? YEL[2]! : K);
  }
  return outline(cv);
}

/** «Barril» on floor 3: a party helium tank, with the balloons still tied on (it goes up the same). */
export function makeHeliumTank(): Canvas {
  const cv = new Canvas(16, 24);
  // Two half-deflated balloons on their strings, behind the valve.
  ellipse(cv, 4, 3, 2.5, 2.8, BLUE[1]!);
  cv.set(3, 2, BLUE[0]!);
  ellipse(cv, 12, 4, 2.5, 2.8, YEL[1]!);
  cv.set(11, 3, YEL[0]!);
  for (let j = 6; j < 10; j++) {
    cv.set(4 + Math.floor((j - 6) / 2), j, STEEL[3]!);
    cv.set(12 - Math.floor((j - 6) / 2), j + 1, STEEL[3]!);
  }
  // Valve.
  cv.rect(6, 7, 4, 3, STEEL[2]!);
  cv.rect(6, 7, 4, 1, STEEL[1]!);
  cv.rect(9, 8, 3, 1, STEEL[3]!);
  // The tank: red like the drum downstairs (it means the same thing), a rounded shoulder.
  box(cv, 3, 11, 10, 11, RED);
  cv.rect(4, 10, 8, 1, RED[1]!);
  cv.rect(4, 12, 1, 8, RED[0]!);
  // Warning label on yellow, like the drum's (two black lines of small print), and a white band.
  cv.rect(5, 14, 6, 4, YEL[1]!);
  cv.rect(5, 14, 6, 1, YEL[0]!);
  cv.rect(6, 15, 4, 1, K);
  cv.rect(6, 17, 3, 1, K);
  cv.rect(3, 19, 10, 1, WHITE);
  cv.rect(3, 21, 10, 1, RED[3]!);
  return outline(cv);
}

/** «Carrito» on floor 3: a rocking horse, faded, its mane half gone (low: bullets go over it). */
export function makeRockingHorse(): Canvas {
  const cv = new Canvas(28, 24);
  const BODY = ramp('#f0e2c2', '#d8c49a', '#ab966c', '#7a6848');
  // Rockers: a curved runner.
  for (let x = 2; x < 26; x++) {
    const y = 20 + Math.round(((x - 14) / 12) ** 2 * -2.5) + 2;
    cv.set(x, y, hx('#b8683a'));
    cv.set(x, y + 1, hx('#8a4528'));
  }
  // Legs down to the rockers.
  for (const x of [7, 9, 18, 20]) cv.rect(x, 14, 1, 6, x === 9 || x === 20 ? BODY[3]! : BODY[2]!);
  // Body and the saddle.
  box(cv, 6, 9, 16, 6, BODY);
  cv.rect(11, 9, 6, 3, RED[1]!);
  cv.rect(11, 9, 6, 1, RED[0]!);
  // Neck and head, facing right (like everything else), with an ear and an eye.
  cv.rect(19, 4, 4, 7, BODY[1]!);
  cv.rect(21, 3, 5, 4, BODY[1]!);
  cv.rect(25, 5, 1, 2, BODY[2]!);
  cv.set(20, 2, BODY[2]!);
  cv.set(23, 4, K);
  // The mane: a few tufts of red wool left.
  for (const [x, y] of [[18, 4], [18, 6], [19, 3], [18, 8]] as const) cv.set(x, y, hx('#a42f37'));
  // The tail: what is left of it.
  cv.rect(4, 9, 2, 1, hx('#a42f37'));
  cv.set(3, 10, hx('#a42f37'));
  // A handle sticking out of the head.
  cv.rect(20, 5, 1, 1, STEEL[2]!);
  return outline(cv);
}

// Floor 4 (Oficinas) versions of the three obstacles: same footprint and collision box again.

const FILING = ramp('#a8a7b0', '#8a8994', '#66656f', '#47464e');

/** «Caja» on floor 4: a metal filing cabinet, three drawers, the middle one never closes. */
export function makeFilingCabinet(): Canvas {
  const cv = new Canvas(24, 24);
  cube(cv, 3, 2, 18, 21, 5, 3, FILING, FILING, FILING);
  cv.rect(3, 5, 5, 17, FILING[2]!);
  cv.rect(3, 5, 1, 17, FILING[3]!);
  // Three drawers, each with a handle and a label slot; the middle one sticks out, papers in it.
  for (const [i, y] of [[0, 6], [1, 12], [2, 18]] as const) {
    const out = i === 1 ? 1 : 0;
    cv.rect(9, y, 11, 5, FILING[1]!);
    cv.rect(9, y, 11, 1, FILING[0]!);
    cv.rect(9, y + 4, 11, 1, FILING[3]!);
    cv.rect(12, y + 2, 5, 1, FILING[3]!);
    cv.rect(11, y + 1, 3, 1, WHITE);
    if (out) {
      cv.rect(8, y - 1, 13, 1, FILING[0]!);
      cv.rect(10, y - 2, 8, 1, CREAM[0]!);
      cv.set(12, y - 3, CREAM[1]!);
      cv.set(15, y - 3, CREAM[0]!);
    }
  }
  // «Activo n.º 00412»: the inventory sticker.
  cv.rect(5, 8, 2, 3, WHITE);
  return outline(cv);
}

/** «Barril» on floor 4: the coffee urn of the meeting room (it goes up the same: red band, yellow label). */
export function makeCoffeeUrn(): Canvas {
  const cv = new Canvas(16, 24);
  // A stack of paper cups on the lid.
  cv.rect(6, 1, 4, 4, WHITE);
  cv.rect(6, 1, 4, 1, CREAM[1]!);
  cv.rect(9, 1, 1, 4, CREAM[2]!);
  // Lid and the steel body.
  cv.rect(3, 5, 10, 2, STEEL[1]!);
  cv.rect(3, 5, 10, 1, STEEL[0]!);
  box(cv, 3, 7, 10, 15, STEEL);
  cv.rect(4, 8, 1, 12, STEEL[0]!);
  // The red band and the warning label, like the drum downstairs.
  cv.rect(3, 10, 10, 3, RED[1]!);
  cv.rect(3, 10, 10, 1, RED[0]!);
  cv.rect(6, 14, 5, 3, YEL[1]!);
  cv.rect(7, 15, 3, 1, K);
  // The tap, with a drip.
  cv.rect(12, 17, 3, 2, OFFICE[0]!);
  cv.set(14, 20, BROWN[2]!);
  cv.rect(4, 21, 8, 1, STEEL[3]!);
  return outline(cv);
}

/** «Carrito» on floor 4: a plastic office plant in its pot, dusty (low: bullets go over the pot). */
export function makeOfficePlant(): Canvas {
  const cv = new Canvas(28, 24);
  const LEAF = ramp('#7ea86a', '#5a8a4e', '#3f6a3a', '#2a4a2a');
  // The pot: grey plastic, the price sticker still on.
  box(cv, 9, 15, 10, 8, ramp('#8a8994', '#66656f', '#47464e', '#2f2e35'));
  cv.rect(8, 15, 12, 1, hx('#a8a7b0'));
  cv.rect(15, 18, 3, 2, WHITE);
  // Leaves in fans, the top ones grey with dust.
  const leaves: Array<[number, number, number]> = [[6, 12, 1], [8, 9, 1], [11, 6, 0], [14, 4, 0], [17, 6, 0], [20, 9, 1], [22, 12, 1], [12, 11, 2], [16, 10, 2], [14, 13, 3]];
  for (const [x, y, k] of leaves) {
    ellipse(cv, x, y, 2.6, 1.6, LEAF[k]!);
    cv.set(x - 1, y - 1, k === 0 ? hx('#a8b0a0') : LEAF[0]!);
  }
  cv.rect(14, 8, 1, 7, LEAF[3]!);
  return outline(cv);
}

// Floor 5 (Atención al Cliente) versions of the three obstacles: same footprint and collision box again.

const SEAT = ramp('#7aa8e0', '#3f66a6', '#2a4a7a', '#1f3456');
const BEAM = ramp('#b7bed0', '#858ea8', '#5a627c', '#3a4058');

/** «Caja» on floor 5: two moulded waiting-room chairs on their steel beam, bolted to the floor. */
export function makeWaitingChairs(): Canvas {
  const cv = new Canvas(24, 24);
  // The beam and its two feet, with the bolts.
  cv.rect(1, 17, 22, 2, BEAM[1]!);
  cv.rect(1, 17, 22, 1, BEAM[0]!);
  for (const x of [3, 19]) {
    cv.rect(x, 19, 2, 4, BEAM[2]!);
    cv.rect(x - 1, 22, 4, 1, BEAM[3]!);
    cv.set(x - 1, 22, BEAM[0]!);
  }
  // Two seats, each a back and a seat in one shell; the right one has a chewing gum and a crack.
  for (const x of [1, 12]) {
    cv.rect(x, 3, 11, 8, SEAT[1]!);
    cv.rect(x, 3, 11, 1, SEAT[0]!);
    cv.rect(x + 1, 5, 9, 1, SEAT[2]!);
    cv.rect(x, 11, 11, 5, SEAT[2]!);
    cv.rect(x, 11, 11, 1, SEAT[1]!);
    cv.rect(x, 15, 11, 1, SEAT[3]!);
    cv.rect(x + 10, 3, 1, 13, SEAT[3]!);
    // The hand holes at the top of the back.
    cv.rect(x + 4, 4, 3, 1, SEAT[3]!);
  }
  cv.set(16, 13, hx('#e88fa4'));
  cv.set(6, 7, SEAT[3]!);
  cv.set(7, 8, SEAT[3]!);
  cv.set(7, 9, SEAT[3]!);
  return outline(cv);
}

/** «Barril» on floor 5: the red complaints box, full to bursting (it goes up the same: red, the yellow label). */
export function makeComplaintsBox(): Canvas {
  const cv = new Canvas(16, 24);
  // The post it stands on.
  cv.rect(7, 18, 2, 4, DSTEEL[1]!);
  cv.rect(5, 21, 6, 1, DSTEEL[2]!);
  // The box: red sheet metal with a rounded top and the slot, sheets sticking out of it.
  box(cv, 2, 4, 12, 14, RED);
  cv.rect(3, 3, 10, 1, RED[0]!);
  cv.rect(4, 6, 8, 1, K);
  cv.rect(5, 4, 2, 3, WHITE);
  cv.rect(8, 3, 2, 4, CREAM[0]!);
  cv.set(11, 5, WHITE);
  cv.rect(2, 9, 12, 1, RED[3]!);
  // «Reclamaciones»: the yellow label, and the padlock nobody has the key to.
  cv.rect(4, 11, 8, 3, YEL[1]!);
  cv.rect(5, 12, 6, 1, K);
  cv.rect(7, 15, 2, 2, STEEL[1]!);
  cv.set(7, 15, STEEL[0]!);
  return outline(cv);
}

/** «Carrito» on floor 5: the mop bucket and its yellow «suelo mojado» sign (low: bullets go over it). */
export function makeWetFloorSign(): Canvas {
  const cv = new Canvas(28, 24);
  // The bucket: blue plastic on castors, the wringer on top, the mop leaning out.
  box(cv, 3, 14, 11, 7, ramp('#7aa8e0', '#3f66a6', '#2a4a7a', '#1f3456'));
  cv.rect(4, 15, 9, 2, hx('#5a7a6a'));
  cv.rect(5, 12, 7, 2, hx('#e0b23c'));
  cv.rect(5, 12, 7, 1, hx('#f6dc7a'));
  for (const x of [4, 12]) cv.set(x, 21, K);
  for (let j = 0; j < 10; j++) cv.set(10 - Math.floor(j / 3), 3 + j, BROWN[1]!);
  cv.rect(6, 1, 3, 3, CREAM[1]!);
  // The A-frame sign: yellow, the figure slipping, the bottom scuffed.
  const Y = ramp('#fff1a8', '#f6c431', '#d9932a', '#8f5a1c');
  for (let j = 0; j < 14; j++) {
    const half = 2 + Math.floor(j / 3);
    cv.rect(21 - half, 7 + j, half * 2 + 1, 1, j === 0 ? Y[0]! : Y[1]!);
  }
  cv.rect(17, 20, 9, 1, Y[3]!);
  cv.rect(21, 7, 1, 14, Y[2]!);
  // The slipping figure, in black.
  cv.set(19, 11, K);
  cv.rect(19, 12, 1, 3, K);
  cv.set(18, 15, K);
  cv.set(20, 15, K);
  cv.set(20, 12, K);
  cv.set(17, 13, K);
  cv.rect(17, 17, 4, 1, K);
  return outline(cv);
}

// Floor 6 (the Taller de Reacondicionado) versions of the three obstacles: same footprint and collision box again.

const CRATE = ramp('#a8aea4', '#7c8278', '#5a5e56', '#3a3d36');
const WS_GREEN = ramp('#8ad88a', '#58b45a', '#3a7a3e', '#22482a');

/** «Caja» on floor 6: two grey stacking crates of parts, the top one overflowing (a motor, a coil of cable), with the green label. */
export function makePartsCrates(): Canvas {
  const cv = new Canvas(24, 24);
  // The bottom crate: ribbed grey plastic with the hand hole.
  box(cv, 1, 13, 22, 10, CRATE);
  for (let x = 4; x < 21; x += 4) cv.rect(x, 15, 1, 6, CRATE[2]!);
  cv.rect(9, 15, 6, 2, CRATE[3]!);
  // The top crate, shorter and a little to the left (stacked in a hurry).
  box(cv, 2, 6, 18, 8, CRATE);
  cv.rect(2, 6, 18, 2, CRATE[3]!);
  cv.rect(3, 6, 16, 1, CRATE[2]!);
  for (let x = 5; x < 18; x += 4) cv.rect(x, 9, 1, 4, CRATE[2]!);
  // What sticks out of it: a small motor (a cylinder with its shaft) and a loop of red cable.
  cv.rect(5, 2, 6, 5, DSTEEL[1]!);
  cv.rect(5, 2, 6, 1, DSTEEL[0]!);
  cv.rect(10, 2, 1, 5, DSTEEL[2]!);
  cv.rect(11, 4, 2, 1, STEEL[1]!);
  for (const [x, y] of [[14, 5], [15, 4], [16, 3], [17, 3], [18, 4], [18, 5]] as const) cv.set(x, y, RED[1]!);
  // The label: «Reacondicionado · como nuevo», green with a white tick.
  cv.rect(13, 16, 7, 4, WS_GREEN[1]!);
  cv.rect(13, 16, 7, 1, WS_GREEN[0]!);
  cv.set(14, 18, WHITE);
  cv.set(15, 19, WHITE);
  cv.set(16, 18, WHITE);
  cv.set(17, 17, WHITE);
  return outline(cv);
}

/** «Barril» on floor 6: a drum of used grease (it goes up the same): black-green steel, the yellow band, grease running down. */
export function makeGreaseDrum(): Canvas {
  const cv = new Canvas(16, 24);
  const D = ramp('#5a6a52', '#3a4a36', '#26321f', '#151c12');
  box(cv, 1, 4, 14, 19, D);
  // The lid seen from above, with its bung.
  cv.rect(2, 2, 12, 3, D[0]!);
  cv.rect(3, 3, 10, 1, D[1]!);
  cv.rect(10, 2, 2, 2, STEEL[2]!);
  // The rolling hoops.
  cv.rect(1, 9, 14, 1, D[3]!);
  cv.rect(1, 18, 14, 1, D[3]!);
  // The yellow band with the flame diamond.
  cv.rect(1, 11, 14, 5, YEL[1]!);
  cv.rect(1, 11, 14, 1, YEL[0]!);
  cv.rect(14, 11, 1, 5, YEL[2]!);
  cv.set(7, 12, RED[1]!);
  cv.rect(6, 13, 3, 1, RED[1]!);
  cv.set(7, 14, RED[1]!);
  // Grease down the side, from the bung, and a puddle at the foot.
  for (let j = 4; j < 22; j++) cv.set(11 + (j > 14 ? 1 : 0), j, hx('#1a1408'));
  cv.set(12, 8, hx('#4a3a1a'));
  cv.rect(9, 22, 6, 1, hx('#1a1408'));
  return outline(cv);
}

/** «Carrito» on floor 6: a pallet jack, orange, its forks under an empty pallet and the handle up (low: bullets go over it). */
export function makePalletJack(): Canvas {
  const cv = new Canvas(28, 24);
  const O = ramp('#ffb347', '#e07a2a', '#a8521c', '#5a2a10');
  const PAL = ramp('#d2b184', '#a98258', '#7a5a3c', '#4f3a28');
  // The pallet: three planks on top, the blocks at the front.
  for (const y of [13, 16, 19]) {
    cv.rect(9, y, 18, 2, PAL[1]!);
    cv.rect(9, y, 18, 1, PAL[0]!);
  }
  for (const x of [9, 17, 25]) cv.rect(x, 21, 2, 2, PAL[2]!);
  // The forks, sticking out from under it.
  cv.rect(9, 22, 17, 1, O[2]!);
  // The hydraulic unit and its wheel.
  box(cv, 3, 13, 7, 9, O);
  cv.rect(4, 15, 5, 1, O[3]!);
  cv.rect(4, 21, 4, 2, K);
  cv.set(5, 21, DSTEEL[0]!);
  // The handle, leaning back, with its grip and the lever.
  for (let j = 0; j < 11; j++) cv.set(5 - Math.floor(j / 4), 12 - j, O[1]!);
  for (let j = 0; j < 11; j++) cv.set(6 - Math.floor(j / 4), 12 - j, O[2]!);
  cv.rect(0, 1, 6, 2, K);
  cv.rect(1, 1, 4, 1, DSTEEL[1]!);
  cv.set(5, 4, YEL[1]!);
  return outline(cv);
}

/** Player shot: 8x8 orange ball with a yellow core (build2.shot8). */
export function makeShot(): Canvas {
  const cv = new Canvas(8, 8);
  const pat = ['..1111..', '.122221.', '12233221', '12333321', '12333321', '12233221', '.122221.', '..1111..'];
  const cols: Record<string, RGBA> = { '1': GLOW2, '2': GLOW, '3': YEL[0]! };
  pat.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(i, j, cols[ch]!)));
  return cv;
}

/**
 * Enemy bullet: 9x9, a dark rim, a saturated ring, a lighter band and a white core. It was 5x5
 * (build2.bullet5); bigger since the human's note of 2026-10-30, so they are harder to slip
 * through. The hit box covers the coloured 7x7 (ENEMY_BULLET_RADIUS); the dark rim only lifts it
 * off the floor.
 */
export function makeEnemyBullet(rim: RGBA, out: RGBA, mid: RGBA): Canvas {
  const cv = new Canvas(9, 9);
  const pat = ['..00000..', '.0011100.', '001222100', '012333210', '012333210', '012333210', '001222100', '.0011100.', '..00000..'];
  const cols: Record<string, RGBA> = { '0': rim, '1': out, '2': mid, '3': WHITE };
  pat.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(i, j, cols[ch]!)));
  return cv;
}

export const enemyBulletRed = (): Canvas => makeEnemyBullet(RED[3]!, RED[1]!, RED[0]!);
export const enemyBulletCyan = (): Canvas => makeEnemyBullet(ICE[3]!, ICE[2]!, ICE[1]!);

/** The floating front hand (3x3 plus outline). */
export function makeHand(): Canvas {
  const cv = new Canvas(5, 5);
  hand(cv, 1, 1);
  return outline(cv);
}

/** Muzzle flash: 2 frames of 12x10, hot air blast pointing right. */
export function makeMuzzle(): Canvas {
  const sheet = new Canvas(24, 10);
  const f0 = ['....11......', '..112211....', '.12233221...', '1233333221..', '1233333221..', '.12233221...', '..112211....', '....11......'];
  const f1 = ['......1.....', '...1122.1...', '..12332211..', '.123333321.1', '.123333321..', '..12332211..', '...1122.1...', '......1.....'];
  const cols: Record<string, RGBA> = { '1': GLOW2, '2': GLOW, '3': YEL[0]! };
  [f0, f1].forEach((f, k) => f.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && sheet.set(k * 12 + i, j + 1, cols[ch]!))));
  return sheet;
}

/** Lint casing ejected by the hair dryer: 3 frames of 4x4. */
export function makePelusa(): Canvas {
  const sheet = new Canvas(12, 4);
  const L = hx('#c9c4d8');
  const D = hx('#8d88a0');
  const frames = [
    ['.LL.', 'LDLL', '.LD.', '....'],
    ['..L.', '.LLD', 'LDL.', '.L..'],
    ['.L..', 'LLL.', '.DLL', '..L.'],
  ];
  frames.forEach((f, k) => f.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && sheet.set(k * 4 + i, j, ch === 'L' ? L : D))));
  return sheet;
}

/** Small spark/debris squares used by the particles: white, yellow, orange, grey. 4 frames of 2x2. */
export function makeSparks(): Canvas {
  const sheet = new Canvas(8, 2);
  [WHITE, YEL[1]!, GLOW2, STEEL[2]!].forEach((c, k) => sheet.rect(k * 2, 0, 2, 2, c));
  return sheet;
}

/** Dust puff for the roll and bullet impacts: 4 frames of 8x8. */
export function makePuff(): Canvas {
  const sheet = new Canvas(32, 8);
  const C: RGBA[] = [[200, 200, 214, 220], [160, 160, 178, 190], [120, 120, 140, 150], [95, 95, 110, 110]];
  for (let k = 0; k < 4; k++) {
    const r = 1.6 + k * 0.8;
    ellipse(sheet, k * 8 + 3.5, 3.5, r, r * 0.85, C[k]!);
    if (k > 0) ellipse(sheet, k * 8 + 3.5, 3.5, r - 1.2, (r - 1.2) * 0.85, [0, 0, 0, 0]);
  }
  // Hollow rings: clear the inside pixels so later frames read as dissipating.
  for (let k = 1; k < 4; k++) {
    const r = 1.6 + k * 0.8 - 1.2;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (((x - 3.5) / r) ** 2 + ((y - 3.5) / (r * 0.85)) ** 2 <= 1) sheet.put(k * 8 + x, y, [0, 0, 0, 0]);
  }
  return sheet;
}

/** Crosshair 15x15 (the reference reticle, with an outline so it reads on any floor). */
export function makeCrosshair(): Canvas {
  const cv = new Canvas(15, 15);
  const c = 7;
  for (const d of [4, 5, 6, 7]) for (const [ox, oy] of [[d, 0], [-d, 0], [0, d], [0, -d]] as const) cv.set(c + ox, c + oy, WHITE);
  cv.set(c, c, RED[1]!);
  return outline(cv);
}

/** Hearts: full, half, empty. 3 frames of 9x8 (heart pattern from the reference HUD plus outline). */
export function makeHearts(): Canvas {
  const sheet = new Canvas(27, 8);
  const pat = ['.11.11.', '1221111', '1111111', '.11111.', '..111..', '...1...'];
  for (let k = 0; k < 3; k++) {
    const cv = new Canvas(9, 8);
    pat.forEach((row, j) =>
      [...row].forEach((ch, i) => {
        if (ch === '.') return;
        const empty = k === 2 || (k === 1 && i >= 4);
        const c1 = empty ? hx('#3a3f5c') : RED[1]!;
        const c2 = empty ? hx('#4c5374') : WHITE;
        cv.set(i + 1, j + 1, ch === '1' ? c1 : c2);
      }),
    );
    sheet.blit(outline(cv), k * 9, 0);
  }
  return sheet;
}

/** Ammo pip for the HUD: full and spent, 2 frames of 4x6. */
export function makeAmmoPip(): Canvas {
  const sheet = new Canvas(8, 6);
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(4, 6);
    if (k === 0) {
      cv.rect(1, 1, 2, 4, GLOW);
      cv.set(1, 1, YEL[0]!);
      cv.rect(1, 4, 2, 1, GLOW2);
    } else cv.rect(1, 1, 2, 4, hx('#3a3f5c'));
    sheet.blit(outline(cv), k * 4, 0);
  }
  return sheet;
}

/** Shop mannequin used as training dummy. Original design, same rules as the approved cast. */
export function makeManiqui(): Canvas {
  const cv = new Canvas(32, 40);
  const SKIN = [hx('#f6e6cc'), hx('#e2c9a2'), hx('#bf9f76'), hx('#8a6e4e')];
  const SHIRT = [hx('#ff8a70'), hx('#e0453b'), hx('#a42f37'), hx('#6a1d2a')];
  // stand: round base and pole
  cv.rect(10, 35, 12, 3, STEEL[3]!);
  cv.rect(11, 35, 10, 1, STEEL[1]!);
  cv.rect(15, 27, 2, 8, STEEL[2]!);
  cv.set(15, 27, STEEL[0]!);
  // torso with the season's t-shirt and a target drawn by staff with a marker
  box(cv, 10, 19, 12, 9, SHIRT);
  cv.rect(10, 26, 12, 1, SHIRT[3]!);
  cv.rect(14, 21, 5, 5, WHITE);
  cv.rect(15, 22, 3, 3, RED[1]!);
  cv.set(16, 23, WHITE);
  // neck
  cv.rect(14, 17, 4, 2, SKIN[2]!);
  // big egg head looking right, shaded from the top-left
  const cx = 16.5;
  const cy = 9.5;
  for (let y = 0; y < 19; y++) {
    for (let x = 6; x < 28; x++) {
      const dx = (x - cx) / 8.6;
      const dy = (y - cy) / 8.4;
      if (dx * dx + dy * dy <= 1) {
        const t = 0.7 * dx + 0.7 * dy;
        cv.set(x, y, t < -0.55 ? SKIN[0]! : t < 0.25 ? SKIN[1]! : t < 0.7 ? SKIN[2]! : SKIN[3]!);
      }
    }
  }
  // painted, bored half-closed eyes
  for (const ex of [18, 23]) {
    cv.rect(ex, 9, 3, 2, K);
    cv.rect(ex, 9, 3, 1, SKIN[2]!);
    cv.set(ex + 1, 10, WHITE);
  }
  // marker moustache somebody added
  const ink = hx('#2c4f94');
  for (const [x, y] of [[19, 13], [20, 12], [21, 12], [22, 13], [23, 12], [24, 12], [25, 13]] as const) cv.set(x, y, ink);
  // flat mouth
  cv.rect(21, 15, 3, 1, SKIN[3]!);
  // wig, slightly crooked
  const HAIR = [hx('#8a5a34'), hx('#5c3a22'), hx('#3e2616')];
  for (let x = 8; x < 23; x++) {
    const h = x < 12 ? 4 : x < 18 ? 3 : 2;
    for (let y = 1 + (x > 19 ? 1 : 0); y < 1 + h + (x > 19 ? 1 : 0); y++) cv.set(x, y, y === 1 ? HAIR[0]! : HAIR[1]!);
  }
  cv.rect(7, 4, 2, 5, HAIR[1]!);
  cv.set(7, 8, HAIR[2]!);
  // price tag hanging from the ear: «REBAJAS»
  cv.set(10, 11, CREAM[2]!);
  cv.set(9, 12, CREAM[2]!);
  cv.rect(5, 13, 5, 4, WHITE);
  cv.rect(6, 14, 3, 1, RED[1]!);
  cv.rect(6, 15, 2, 1, RED[1]!);
  // floating hands, pale plastic
  hand(cv, 6, 21, [SKIN[0]!, SKIN[1]!, SKIN[2]!, SKIN[3]!]);
  hand(cv, 23, 21, [SKIN[0]!, SKIN[1]!, SKIN[2]!, SKIN[3]!]);
  const o = outline(cv);
  // a dusty smudge on the base
  o.set(19, 37, BROWN[2]!);
  return o;
}

/** Roll-up shutter door with a red pilot light (build2.shutter), as a standalone sprite. */
export function makeShutter(w: number, h: number, light: 'red' | 'green' = 'red', slat = '#3a4058', groove = '#2b3048'): Canvas {
  const cv = new Canvas(w, h);
  cv.rect(0, 0, w, h, hx(slat));
  for (let j = 2; j < h; j += 3) cv.rect(0, j, w, 1, hx(groove));
  cv.rect(0, 0, w, 1, K);
  cv.rect(0, 0, 1, h, K);
  cv.rect(w - 1, 0, 1, h, K);
  cv.rect(Math.floor(w / 2) - 6, 4, 12, 4, K);
  cv.rect(Math.floor(w / 2) - 4, 5, 8, 2, light === 'red' ? RED[1]! : GREEN);
  cv.rect(Math.floor(w / 2) - 4, 5, 3, 1, light === 'red' ? RED[0]! : hx('#a8e89a'));
  return cv;
}

/**
 * The shutters of a room's doors, two frames each (pilot light red: shut; green: open). Bottom
 * edge: a black lip and a worn yellow-and-black kick strip, so it reads as the moving part.
 */
export function makeShutterFrames(w: number, h: number, level = 1): Canvas {
  const out = new Canvas(w * 2, h);
  // Upstairs (Informática) the shutter is green-grey and its kick strip a grey rubber with
  // ribs, like the skirting duct; downstairs, blue steel with hazard stripes.
  // On floor 3, plum slats, a kick strip in the foam mats' colours and a string of fair lights
  // across it, every bulb fused but one. On floor 4, office grey and a laminated «Reunión» card
  // hanging over it.
  const [slat, groove, a, b] =
    level === 5
      ? ['#3a5266', '#2a3c4c', '#8aa0b0', '#263e50']
      : level === 6
      ? ['#4c4e46', '#383a32', '#58b45a', '#e2dccc']
      : level === 4
      ? ['#4a4952', '#36353c', '#6a6974', '#3a3940']
      : level === 3
        ? ['#4a3a50', '#36293c', '#8a5a5c', '#5a5a3c']
        : level === 2
          ? ['#3a4a47', '#28332f', '#7e8a87', '#2a3231']
          : ['#3a4058', '#2b3048', '#b08a1c', '#191622'];
  (['red', 'green'] as const).forEach((light, i) => {
    const f = makeShutter(w, h, light, slat, groove);
    for (let x = 1; x < w - 1; x++) {
      f.set(x, h - 4, Math.floor(x / 3) % 2 === 0 ? hx(a) : hx(b));
      f.set(x, h - 3, Math.floor((x + 1) / 3) % 2 === 0 ? hx(a) : hx(b));
    }
    f.rect(0, h - 2, w, 2, K);
    if (level === 3) fairLights(f, w, h);
    if (level === 4) meetingSign(f, w, h);
    if (level === 5) closedSign(f, w, h);
    if (level === 6) brokenSign(f, w, h);
    out.blit(f, i * w, 0);
  });
  return out;
}

/** «Reunión en curso»: a laminated card hanging from a string over the shutter (the meeting never ends). */
function meetingSign(f: Canvas, w: number, h: number): void {
  const word = 'REUNIÓN';
  const tw = stencilWidth(word);
  if (tw + 6 > w - 4 || h < 22) {
    // The side shutters are too narrow for the word: a red card with two lines of small print.
    const x = Math.floor(w / 2) - 5;
    const y = Math.min(h - 16, 14);
    f.rect(x, y, 10, 8, K);
    f.rect(x + 1, y + 1, 8, 6, hx('#d8d6ce'));
    f.rect(x + 2, y + 2, 6, 1, RED[1]!);
    f.rect(x + 2, y + 4, 5, 1, hx('#66656f'));
    return;
  }
  const x = Math.floor((w - tw) / 2) - 3;
  const y = Math.min(h - 15, 12);
  f.set(x + 2, y - 2, hx('#1a1a20'));
  f.set(x + tw + 3, y - 2, hx('#1a1a20'));
  f.rect(x, y - 1, tw + 6, 9, K);
  f.rect(x + 1, y, tw + 4, 7, hx('#d8d6ce'));
  f.rect(x + 1, y, tw + 4, 1, WHITE);
  stencil(f, x + 3, y + 3, word, RED[2]!);
}

/**
 * «Ventanilla cerrada. Diríjase a la ventanilla de al lado.»: a card taped on the shutter with
 * an arrow pointing to the next one (which is also closed).
 */
function closedSign(f: Canvas, w: number, h: number): void {
  const word = 'CERRADA';
  const tw = stencilWidth(word);
  if (tw + 6 > w - 4 || h < 22) {
    // Side shutters: a white card with the arrow only.
    const x = Math.floor(w / 2) - 5;
    const y = Math.min(h - 16, 14);
    f.rect(x, y, 10, 9, K);
    f.rect(x + 1, y + 1, 8, 7, hx('#d8dee6'));
    f.rect(x + 2, y + 2, 6, 1, RED[1]!);
    f.rect(x + 2, y + 5, 4, 1, hx('#2f4a6a'));
    f.set(x + 6, y + 4, hx('#2f4a6a'));
    f.set(x + 6, y + 6, hx('#2f4a6a'));
    f.set(x + 7, y + 5, hx('#2f4a6a'));
    return;
  }
  const x = Math.floor((w - tw) / 2) - 3;
  const y = Math.min(h - 17, 11);
  f.rect(x, y - 1, tw + 6, 13, K);
  f.rect(x + 1, y, tw + 4, 11, hx('#d8dee6'));
  f.rect(x + 1, y, tw + 4, 1, WHITE);
  stencil(f, x + 3, y + 3, word, RED[2]!);
  // The arrow: «diríjase a la de al lado».
  const ay = y + 8;
  f.rect(x + 3, ay, tw - 2, 1, hx('#2f4a6a'));
  f.set(x + tw, ay - 1, hx('#2f4a6a'));
  f.set(x + tw, ay + 1, hx('#2f4a6a'));
  f.set(x + tw + 1, ay, hx('#2f4a6a'));
  // The tape at the corners.
  f.rect(x, y - 1, 2, 2, [230, 226, 200, 200]);
  f.rect(x + tw + 4, y - 1, 2, 2, [230, 226, 200, 200]);
}

/**
 * «Averiada»: the Servicio Técnico's own shutter is out of order, with yellow and black tape
 * across it and a hand-written card (nobody has opened a ticket).
 */
function brokenSign(f: Canvas, w: number, h: number): void {
  // The tape, a diagonal across the whole shutter.
  for (let x = 1; x < w - 1; x++) {
    const y = Math.round(3 + ((h - 9) * x) / w);
    for (let k = 0; k < 3; k++) f.set(x, y + k, Math.floor((x + k) / 3) % 2 === 0 ? hx('#f6c431') : hx('#191622'));
  }
  const word = 'AVERIADA';
  const tw = stencilWidth(word);
  if (tw + 6 > w - 4 || h < 22) {
    // Side shutters: a small card with a red cross.
    const x = Math.floor(w / 2) - 4;
    const y = Math.min(h - 16, 14);
    f.rect(x, y, 9, 9, K);
    f.rect(x + 1, y + 1, 7, 7, hx('#e2dccc'));
    for (let i = 0; i < 5; i++) {
      f.set(x + 2 + i, y + 2 + i, RED[1]!);
      f.set(x + 6 - i, y + 2 + i, RED[1]!);
    }
    return;
  }
  const x = Math.floor((w - tw) / 2) - 3;
  const y = Math.min(h - 15, 12);
  f.rect(x, y - 1, tw + 6, 9, K);
  f.rect(x + 1, y, tw + 4, 7, hx('#e2dccc'));
  f.rect(x + 1, y, tw + 4, 1, WHITE);
  stencil(f, x + 3, y + 3, word, RED[2]!);
  f.rect(x, y - 1, 2, 2, [230, 226, 200, 200]);
  f.rect(x + tw + 4, y - 1, 2, 2, [230, 226, 200, 200]);
}

/** A sagging string of fair lights across a shutter; all fused but one, which glows a faded pink. */
function fairLights(f: Canvas, w: number, h: number): void {
  const y0 = Math.min(12, h - 9);
  const yAt = (x: number): number => y0 + Math.round(Math.sin((x / (w - 1)) * Math.PI) * 3);
  for (let x = 1; x < w - 1; x++) f.set(x, yAt(x), hx('#1c1620'));
  let n = 0;
  for (let x = 4; x < w - 3; x += 7) {
    const lit = n++ === 2;
    const y = yAt(x) + 1;
    // Dead bulbs keep the colour of their glass, dark.
    const glass = ['#6a3438', '#3a5a3a', '#34446a', '#6a5a2c'][n % 4]!;
    f.rect(x, y, 2, 3, lit ? hx('#f2a0bc') : hx(glass));
    f.set(x, y, lit ? hx('#ffe0ea') : hx('#8a8090'));
  }
}

/** Screen vignette for 480x270: transparent centre, darker corners. */
export function makeVignette(w = 480, h = 270, strength = 0.5): Canvas {
  const cv = new Canvas(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const md = Math.hypot(cx, cy);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - cx, y - cy) / md;
      const a = Math.round(255 * strength * d ** 2.2);
      // Quantise to a few levels so the vignette stays in the no-smooth-gradients spirit.
      const q = Math.round(a / 16) * 16;
      if (q > 0) cv.put(x, y, [8, 6, 16, Math.min(255, q)]);
    }
  }
  return cv;
}

/**
 * Discount coupon (the currency): a yellow ticket with a perforated stub and a red «%».
 * 2 frames of 12x9: plain and with a glint, so the ones on the floor catch the eye.
 */
export function makeCoupon(): Canvas {
  const sheet = new Canvas(24, 9);
  const pct = ['X.X', '..X', '.X.', 'X..', 'X.X'];
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(12, 9);
    cv.rect(1, 1, 10, 7, YEL[1]!);
    cv.rect(1, 1, 10, 1, YEL[0]!);
    cv.rect(1, 7, 10, 1, YEL[2]!);
    cv.rect(1, 2, 1, 5, YEL[2]!);
    // Perforation between the stub and the body.
    for (const y of [2, 4, 6]) cv.set(3, y, YEL[3]!);
    pct.forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && cv.set(6 + i, 2 + j, RED[2]!)));
    // Notches cut in both edges.
    cv.put(1, 4, [0, 0, 0, 0]);
    cv.put(10, 4, [0, 0, 0, 0]);
    if (k === 1) {
      for (const [x, y] of [[4, 2], [5, 2], [4, 3], [9, 5], [9, 6], [8, 6]] as const) cv.set(x, y, WHITE);
    }
    sheet.blit(outline(cv), k * 12, 0);
  }
  return sheet;
}

/** Scrap an enemy leaves when it comes apart: screw, nut, spring and a bent plate. 4 frames of 6x6. */
export function makeScrap(): Canvas {
  const sheet = new Canvas(24, 6);
  const frames: string[][] = [
    // screw: head and thread
    ['....', '.LL.', '.BB.', '..B.', '..D.', '....'],
    // nut with its hole
    ['....', '.LB.', 'LKB.', '.BD.', '....', '....'],
    // spring
    ['....', '.LB.', '..D.', '.LB.', '..D.', '....'],
    // bent plate
    ['....', 'LL..', 'BBB.', '.DDD', '....', '....'],
  ];
  const col: Record<string, RGBA> = { L: STEEL[0]!, B: STEEL[2]!, D: STEEL[3]!, K };
  frames.forEach((f, k) => {
    const cv = new Canvas(6, 6);
    f.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(i + 1, j, col[ch]!)));
    sheet.blit(outline(cv), k * 6, 0);
  });
  return sheet;
}

/** HUD slot for the active item: a dark recessed square with a bevel. 20x20. */
export function makeSlot(): Canvas {
  const cv = new Canvas(20, 20);
  cv.rect(1, 1, 18, 18, hx('#3a3f5c'));
  cv.rect(2, 2, 16, 16, hx('#1c1f36'));
  cv.rect(1, 1, 18, 1, hx('#5a627c'));
  cv.rect(1, 1, 1, 18, hx('#5a627c'));
  // Corner screws.
  for (const [x, y] of [[2, 2], [17, 2], [2, 17], [17, 17]] as const) cv.set(x, y, STEEL[2]!);
  return outline(cv);
}

/**
 * What the toaster comes apart into: a slice of toast, the burnt slice, the big spring of the
 * lever mechanism and the lever knob. 4 frames of 8x8.
 */
export function makeToasterBits(): Canvas {
  const sheet = new Canvas(32, 8);
  const slice = (T: Ramp): Canvas => {
    const cv = new Canvas(8, 8);
    cv.rect(1, 1, 5, 6, T[1]!);
    cv.rect(1, 1, 5, 1, T[3]!);
    cv.rect(1, 1, 1, 6, T[2]!);
    cv.rect(5, 1, 1, 6, T[3]!);
    cv.rect(1, 6, 5, 1, T[3]!);
    cv.set(2, 3, T[0]!);
    cv.set(3, 4, T[2]!);
    cv.set(4, 2, T[0]!);
    return outline(cv);
  };
  sheet.blit(slice(TOASTC), 0, 0);
  sheet.blit(slice(BURNT), 8, 0);
  // Spring: four coils, light on top, dark underneath.
  const sp = new Canvas(8, 8);
  for (const y of [1, 3, 5]) {
    sp.rect(2, y, 3, 1, STEEL[0]!);
    sp.set(5, y + 1, STEEL[2]!);
    sp.set(1, y + 1, STEEL[3]!);
  }
  sp.rect(2, 7, 3, 1, STEEL[2]!);
  sheet.blit(outline(sp), 16, 0);
  // Lever knob: the little black handle with a red dot (the toaster's own).
  const kn = new Canvas(8, 8);
  kn.rect(2, 3, 4, 3, hx('#3a3f5c'));
  kn.rect(2, 3, 4, 1, hx('#5a627c'));
  kn.set(3, 4, RED[1]!);
  kn.rect(1, 4, 1, 1, STEEL[2]!);
  sheet.blit(outline(kn), 24, 0);
  return sheet;
}

/**
 * La Nevera Suprema's ice cube: 6x6, a cube in three-quarter view (white top, cyan front, dark
 * left side) with the saturated cyan rim of the enemy bullets, so it reads as one.
 */
export function makeIceCube(): Canvas {
  const cv = new Canvas(6, 6);
  // Square corners (a cube, not a ball): white top face, pale front, cyan side on the left.
  const pat = ['111111', '133331', '142221', '142221', '142221', '111111'];
  const cols: Record<string, RGBA> = { '1': ICE[2]!, '2': ICE[1]!, '3': WHITE, '4': ICE[2]! };
  pat.forEach((row, j) => [...row].forEach((ch, i) => cv.set(i, j, cols[ch]!)));
  cv.set(3, 2, WHITE);
  return cv;
}

/** A ball of frost flying through the air: 8x8 snowball with an icy rim and a black outline. */
export function makeFrostBall(): Canvas {
  const cv = new Canvas(9, 9);
  ellipse(cv, 4, 4, 3.2, 3.2, ICE[1]!);
  ellipse(cv, 3.6, 3.6, 2.4, 2.4, WHITE);
  cv.set(3, 2, ICE[0]!);
  cv.set(5, 6, ICE[2]!);
  cv.set(6, 5, ICE[2]!);
  cv.set(6, 6, ICE[3]!);
  return outline(cv);
}

/**
 * A patch of frost on the floor (radius 22, flattened to 0.6 for the three-quarter view): a
 * see-through icy sheet with a brighter, broken rim, cracks and a few crystals standing up.
 * Two frames: the second has the glints in other places, so it sparkles.
 */
export function makeFrostPatch(): Canvas {
  const W = 46;
  const H = 28;
  const sheet = new Canvas(W * 2, H);
  const cx = 23;
  const cy = 14;
  const rx = 22;
  const ry = 13.2;
  for (let f = 0; f < 2; f++) {
    const ox = f * W;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        const d = Math.sqrt(dx * dx + dy * dy);
        // A wobbly edge, the same in both frames.
        const wob = 0.06 * Math.sin(Math.atan2(dy, dx) * 7 + 1.3) + 0.04 * Math.sin(Math.atan2(dy, dx) * 13);
        if (d > 0.98 + wob) continue;
        const edge = d > 0.84 + wob;
        // put(), not set(): blending onto a transparent pixel would darken it.
        sheet.put(ox + x, y, edge ? hx('#e4fbfa', 215) : hx('#b6f1f0', d < 0.55 ? 95 : 130));
      }
    }
    // Cracks in the ice.
    const cracks: Array<[number, number, number, number]> = [[-12, -2, 7, 1], [-4, 4, 9, -1], [5, -5, 6, 2], [-15, 5, 5, -1], [9, 3, 7, 1]];
    for (const [x0, y0, len, slope] of cracks) for (let i = 0; i < len; i++) sheet.put(ox + cx + x0 + i, cy + y0 + Math.round((i * slope) / 3), hx('#f4f1e8', 190));
    // Little crystals standing up (with the dark side on the left, as everything else).
    for (const [x, y] of [[-16, -3], [12, -6], [3, 6], [-6, -8], [16, 4]] as const) {
      sheet.set(ox + cx + x, cy + y - 1, WHITE);
      sheet.set(ox + cx + x, cy + y, ICE[1]!);
      sheet.set(ox + cx + x - 1, cy + y, ICE[3]!);
    }
    // Glints that move from one frame to the other.
    const glints = f === 0 ? [[-9, -5], [7, 1], [-2, 8]] : [[-13, 2], [10, -3], [1, -2]];
    for (const [x, y] of glints) {
      sheet.set(ox + cx + x!, cy + y!, WHITE);
      sheet.put(ox + cx + x! + 1, cy + y!, hx('#f4f1e8', 200));
      sheet.put(ox + cx + x!, cy + y! - 1, hx('#f4f1e8', 200));
    }
  }
  return sheet;
}

/** Paints a grid of characters onto `cv` at (ox, oy); '.' is left transparent. */
function paintGrid(cv: Canvas, ox: number, oy: number, rows: readonly string[], cols: Record<string, RGBA>): void {
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    const c = cols[ch];
    if (c) cv.set(ox + i, oy + j, c);
  }));
}

/**
 * La Nevera Suprema's loyalty card («Tarjeta Club Suprema»), spinning as it flies: 4 frames of
 * 10x8. Red with a white band (the saturated colour and white core of the enemy bullets), a little
 * gold chip on the front and the black magnetic stripe on the back.
 */
export function makeLoyaltyCard(): Canvas {
  const W = 10;
  const H = 8;
  const frames: Array<readonly string[]> = [
    ['aaaaaaaa', 'wwwwwwww', 'byybbbbb', 'bbbbbbwb', 'cccccccc'],
    ['aaaaa', 'wwwww', 'bybbb', 'bbbwb', 'ccccc'],
    ['aw', 'ww', 'bw', 'bw', 'cw'],
    ['aaaaa', 'kkkkk', 'bbbbb', 'bwwwb', 'ccccc'],
  ];
  const cols: Record<string, RGBA> = { a: RED[0]!, b: RED[1]!, c: RED[2]!, w: WHITE, y: YEL[1]!, k: K };
  const sheet = new Canvas(W * frames.length, H);
  frames.forEach((rows, f) => {
    const cv = new Canvas(W, H);
    paintGrid(cv, Math.floor((W - rows[0]!.length) / 2), 1, rows, cols);
    sheet.blit(outline(cv), f * W, 0);
  });
  return sheet;
}

/**
 * The printer's invoices (enemy bullets): a white sheet with a thick red border and a total,
 * fluttering as it flies (4 frames of 10x10: flat, turning, edge on, turning back).
 */
export function makeInvoice(): Canvas {
  const W = 10;
  const H = 10;
  const frames: Array<readonly string[]> = [
    ['rrrrrr', 'rwwwwr', 'rwggwr', 'rwwwwr', 'rwwkwr', 'rrrrrr'],
    ['rrrr', 'rwwr', 'rwgr', 'rwwr', 'rwkr', 'rrrr'],
    ['rr', 'rw', 'rw', 'rw', 'rw', 'rr'],
    ['rrrr', 'rwwr', 'rggr', 'rwwr', 'rwwr', 'rrrr'],
  ];
  const cols: Record<string, RGBA> = { r: RED[1]!, w: WHITE, g: CREAM[2]!, k: RED[2]! };
  const sheet = new Canvas(W * frames.length, H);
  frames.forEach((rows, f) => {
    const cv = new Canvas(W, H);
    paintGrid(cv, Math.floor((W - rows[0]!.length) / 2), 2, rows, cols);
    sheet.blit(outline(cv), f * W, 0);
  });
  return sheet;
}

/**
 * The wind-up robot's nuts (M10): an enemy bullet the same 9x9 as the round ones, red with a white
 * core like them, but a hex nut with its hole, lit on the top-left facets. 2 frames: flat on top,
 * and turned 30 degrees (it spins as it flies).
 */
export function makeNut(): Canvas {
  const frames: Array<readonly string[]> = [
    ['..00000..', '.0222210.', '022222110', '022333110', '022343110', '012333510', '011115550', '.0115550.', '..00000..'],
    ['...000...', '..02210..', '.0222110.', '022333110', '022343110', '012333510', '.0115550.', '..01550..', '...000...'],
  ];
  const cols: Record<string, RGBA> = { '0': RED[3]!, '1': RED[1]!, '2': RED[0]!, '3': WHITE, '4': RED[3]!, '5': RED[2]! };
  const sheet = new Canvas(9 * frames.length, 9);
  frames.forEach((rows, f) => paintGrid(sheet, f * 9, 0, rows, cols));
  return sheet;
}

/**
 * The shredder's paper strips (M10 planta 4 (4a)): an enemy bullet the same 9x9 as the round ones,
 * a wavy strip of white paper with a red edge (the saturated rim of every enemy bullet). 2 frames:
 * the wave one way and the other (it wriggles as it flies).
 */
export function makeShredStrip(): Canvas {
  const frames: Array<readonly string[]> = [
    ['..rrr..', '..rwr..', '...rwr.', '...rwr.', '..rwr..', '..rwr..', '...rwr.', '...rrr.'],
    ['...rrr.', '...rwr.', '..rwr..', '..rwr..', '...rwr.', '...rwr.', '..rwr..', '..rrr..'],
  ];
  const cols: Record<string, RGBA> = { r: RED[1]!, w: WHITE };
  const sheet = new Canvas(9 * frames.length, 9);
  frames.forEach((rows, f) => {
    const cv = new Canvas(9, 9);
    paintGrid(cv, 0, 0, rows, cols);
    sheet.blit(outline(cv), f * 9, 0);
  });
  return sheet;
}

/**
 * The photocopier's sheets (M10 planta 4 (4b)): an enemy bullet the same 9x9 as the round ones, a
 * little white sheet with two grey toner lines and the red rim of every enemy bullet. 2 frames:
 * upright and tipped over (it tumbles as it flies).
 */
export function makeSheet(): Canvas {
  const frames: Array<readonly string[]> = [
    ['.rrrrr.', '.rwwwr.', '.rggwr.', '.rwwwr.', '.rgggr.', '.rwwwr.', '.rrrrr.'],
    ['rrrrrrr', 'rwgwgwr', 'rwgwgwr', 'rwwwgwr', 'rrrrrrr'],
  ];
  const cols: Record<string, RGBA> = { r: RED[1]!, w: WHITE, g: hx('#959ba8') };
  const sheet = new Canvas(9 * frames.length, 9);
  frames.forEach((rows, f) => {
    const cv = new Canvas(9, 9);
    paintGrid(cv, 1, Math.floor((9 - rows.length) / 2), rows, cols);
    sheet.blit(outline(cv), f * 9, 0);
  });
  return sheet;
}

/**
 * What the fridge spits in its second phase (see EXPIRED_PRODUCTS): 3 frames of 12x14.
 * A yogurt with its lid swollen and green, a milk carton with a mouldy stain and a dented can.
 */
export function makeExpiredProducts(): Canvas {
  const W = 12;
  const H = 14;
  const MOLD = ramp('#b5d36a', '#7fa83f', '#4f6e2a');
  const frames: Array<readonly string[]> = [
    // Yogur: swollen foil lid (green), cream cup, red label with a white cross-out.
    ['...gggg...', '..gGGGGg..', '.gGGgGGGg.', '.ssssssss.', '.cwwwwwwc.', '.cwmwwwwc.', '..rrrrrr..', '..rwrrwr..', '..rrwwrr..', '..rwrrwr..', '..cwwwwc..', '...cccc...'],
    // Brick de leche: gabled top, blue band, a green stain and the date stamped.
    ['....ww....', '...wwww...', '..wwwwww..', '..ssssss..', '..wwwwwm..', '..bbbbbb..', '..bwbbwb..', '..wwwwww..', '..wkwkww..', '..wwmmww..', '..wwwmww..', '..ssssss..'],
    // Lata abollada: grey rims, red label with a dent, a bulge at the top.
    ['...hhhh...', '..hHHHHh..', '..hhhhhh..', '..rrrrrr..', '..rwwrrr..', '..rr.rrr..', '..rrrrrr..', '..rrwrrr..', '..rrrrrr..', '..hhhhhh..', '...hhhh...'],
  ];
  const cols: Record<string, RGBA> = {
    g: MOLD[1]!, G: MOLD[0]!, m: MOLD[2]!, s: STEEL[2]!, c: CREAM[1]!, w: WHITE, r: RED[1]!, b: BLUE[1]!, k: K, h: STEEL[2]!, H: STEEL[0]!,
  };
  const sheet = new Canvas(W * frames.length, H);
  frames.forEach((rows, f) => {
    const cv = new Canvas(W, H);
    paintGrid(cv, 1, H - 1 - rows.length, rows, cols);
    sheet.blit(outline(cv), f * W, 0);
  });
  return sheet;
}

/**
 * The goods lift (montacargas) that appears where a boss fell and takes the toaster down to the
 * next floor. A raised steel plate seen from above in three-quarter view, with a worn
 * yellow-and-black hazard edge, a grid of treads and a big painted arrow pointing down, plus a
 * little control post on the back left. Two frames of 44 × 34: closed (red light, dull arrow)
 * and ready (green light, bright arrow).
 */
export function makeGoodsLift(): Canvas {
  const W = 44;
  const H = 34;
  const out = new Canvas(W * 2, H);
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(W, H);
    const x0 = 2;
    const y0 = 10;
    const pw = 40;
    const ph = 20;
    // Front face of the plate (it stands a little off the floor).
    cv.rect(x0, y0 + ph, pw, 3, hx('#2c3048'));
    cv.rect(x0, y0 + ph, pw, 1, hx('#434963'));
    // Hazard edge: diagonal stripes, worn.
    for (let y = y0; y < y0 + ph; y++) {
      for (let x = x0; x < x0 + pw; x++) {
        const edge = x < x0 + 3 || x >= x0 + pw - 3 || y < y0 + 3 || y >= y0 + ph - 3;
        if (!edge) continue;
        const stripe = Math.floor((x + y) / 3) % 2 === 0;
        cv.set(x, y, stripe ? hx('#d9a326') : hx('#1b1d2e'));
      }
    }
    for (const [x, y] of [[x0 + 5, y0], [x0 + 18, y0 + 1], [x0 + pw - 2, y0 + 9], [x0 + 27, y0 + ph - 1], [x0, y0 + 14]] as const) cv.set(x, y, hx('#6b5a3a'));
    // Steel treads inside.
    cv.rect(x0 + 3, y0 + 3, pw - 6, ph - 6, hx('#5d647e'));
    for (let y = y0 + 4; y < y0 + ph - 3; y += 3) for (let x = x0 + 4 + ((y >> 1) % 2); x < x0 + pw - 4; x += 3) cv.set(x, y, hx('#838ca6'));
    cv.rect(x0 + 3, y0 + 3, pw - 6, 1, hx('#838ca6'));
    cv.rect(x0 + 3, y0 + ph - 4, pw - 6, 1, hx('#434963'));
    // Painted arrow pointing down (towards the next floor).
    const arrow = ['..XXX..', '..XXX..', '..XXX..', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
    const ac = k === 1 ? YEL[1]! : hx('#8f7a3c');
    const al = k === 1 ? YEL[0]! : hx('#a8915a');
    arrow.forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && cv.set(x0 + 17 + i, y0 + 6 + j, j === 0 || (j === 3 && i < 2) ? al : ac)));
    // Rivets in the corners of the treads.
    for (const [x, y] of [[x0 + 4, y0 + 4], [x0 + pw - 5, y0 + 4], [x0 + 4, y0 + ph - 5], [x0 + pw - 5, y0 + ph - 5]] as const) cv.set(x, y, hx('#b7bed0'));
    // Control post on the back left: a box on a pole with the pilot light and a down button.
    box(cv, x0 + 2, 0, 7, 8, STEEL);
    cv.rect(x0 + 4, 8, 3, 4, hx('#434963'));
    cv.rect(x0 + 4, 8, 1, 4, hx('#5d647e'));
    cv.rect(x0 + 3, 2, 5, 3, K);
    cv.rect(x0 + 4, 3, 3, 1, k === 1 ? GREEN : RED[1]!);
    cv.set(x0 + 4, 3, k === 1 ? hx('#a8e89a') : RED[0]!);
    cv.set(x0 + 5, 6, YEL[1]!);
    out.blit(outline(cv), k * W, 0);
  }
  return out;
}

/**
 * The Servicio Técnico's lift (M12 (2)), 44 × 44 a frame: the goods lift's plate with its hazard
 * edge in official green and white and a painted arrow pointing up, and behind it the window's
 * sign on two poles, a laminated board with the red header of the «Cita previa» notice. Frame 0
 * coming up (pilot red, arrow dull); frame 1 ready (pilot green, arrow lit). The plate is 10 px
 * lower than in `montacargas`, so its centre is at y 30.
 */
export function makeServiceLift(): Canvas {
  const W = 44;
  const H = 44;
  const out = new Canvas(W * 2, H);
  const OFF = hx('#e8ecef');
  const DARK = hx('#2f6b3c');
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(W, H);
    const x0 = 2;
    const y0 = 20;
    const pw = 40;
    const ph = 20;
    // The sign's poles first (the plate covers their feet).
    for (const px of [x0 + 6, x0 + pw - 7]) {
      cv.rect(px, 9, 2, y0 - 7, hx('#5d647e'));
      cv.rect(px, 9, 1, y0 - 7, hx('#838ca6'));
    }
    // The board: cream, red header, three lines of small print and a green tick box.
    const bx = x0 + 3;
    const bw = pw - 6;
    cv.rect(bx, 0, bw, 11, CREAM[1]!);
    cv.rect(bx, 0, bw, 1, CREAM[0]!);
    cv.rect(bx, 0, bw, 3, RED[1]!);
    cv.rect(bx, 0, bw, 1, RED[0]!);
    for (let i = 0; i < 4; i++) cv.rect(bx + 3 + i * 7, 1, 5, 1, CREAM[0]!);
    cv.rect(bx + 3, 5, 20, 1, CREAM[3]!);
    cv.rect(bx + 3, 7, 16, 1, CREAM[3]!);
    cv.rect(bx + 3, 9, 22, 1, CREAM[2]!);
    cv.rect(bx + bw - 7, 5, 4, 4, CREAM[3]!);
    cv.rect(bx + bw - 6, 6, 2, 2, k === 1 ? GREEN : CREAM[0]!);
    cv.rect(bx, 10, bw, 1, CREAM[2]!);
    // Front face of the plate.
    cv.rect(x0, y0 + ph, pw, 3, hx('#2c3048'));
    cv.rect(x0, y0 + ph, pw, 1, hx('#434963'));
    // Official edge: green and white diagonal stripes, a little worn.
    for (let y = y0; y < y0 + ph; y++) {
      for (let x = x0; x < x0 + pw; x++) {
        const edge = x < x0 + 3 || x >= x0 + pw - 3 || y < y0 + 3 || y >= y0 + ph - 3;
        if (!edge) continue;
        cv.set(x, y, Math.floor((x + y) / 3) % 2 === 0 ? (k === 1 ? GREEN : DARK) : OFF);
      }
    }
    for (const [x, y] of [[x0 + 7, y0], [x0 + 22, y0 + ph - 1], [x0 + pw - 1, y0 + 6]] as const) cv.set(x, y, hx('#8a9a8c'));
    cv.rect(x0 + 3, y0 + 3, pw - 6, ph - 6, hx('#5d647e'));
    for (let y = y0 + 4; y < y0 + ph - 3; y += 3) for (let x = x0 + 4 + ((y >> 1) % 2); x < x0 + pw - 4; x += 3) cv.set(x, y, hx('#838ca6'));
    cv.rect(x0 + 3, y0 + 3, pw - 6, 1, hx('#838ca6'));
    cv.rect(x0 + 3, y0 + ph - 4, pw - 6, 1, hx('#434963'));
    // Painted arrow pointing up (to the floor nobody gets to).
    const arrow = ['...X...', '..XXX..', '.XXXXX.', 'XXXXXXX', '..XXX..', '..XXX..', '..XXX..'];
    const ac = k === 1 ? YEL[1]! : hx('#8f7a3c');
    const al = k === 1 ? YEL[0]! : hx('#a8915a');
    arrow.forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && cv.set(x0 + 17 + i, y0 + 6 + j, j <= 1 || (j === 3 && i < 2) ? al : ac)));
    for (const [x, y] of [[x0 + 4, y0 + 4], [x0 + pw - 5, y0 + 4], [x0 + 4, y0 + ph - 5], [x0 + pw - 5, y0 + ph - 5]] as const) cv.set(x, y, hx('#b7bed0'));
    // The pilot light on the right pole: red while it comes up, green once it takes you.
    cv.rect(x0 + pw - 8, 13, 4, 3, K);
    cv.rect(x0 + pw - 7, 14, 2, 1, k === 1 ? GREEN : RED[1]!);
    out.blit(outline(cv), k * W, 0);
  }
  return out;
}

/**
 * A spare heart lying on the floor (a boss's reward): a red heart with a highlight and a little
 * «original part» tag, 13 × 12. Two frames: the second catches the light.
 */
export function makeSpareHeart(): Canvas {
  const out = new Canvas(26, 12);
  const pat = ['.111.111.', '122111111', '121111111', '111111113', '.1111113.', '..11113..', '...113...', '....3....'];
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(13, 12);
    pat.forEach((row, j) =>
      [...row].forEach((ch, i) => {
        if (ch === '.') return;
        cv.set(i + 1, j + 1, ch === '1' ? RED[1]! : ch === '2' ? (k === 1 ? WHITE : RED[0]!) : RED[2]!);
      }),
    );
    // The tag on a string: a tiny cream label hanging off the right lobe.
    cv.set(9, 2, CREAM[2]!);
    cv.rect(10, 3, 2, 3, CREAM[1]!);
    cv.set(10, 3, CREAM[0]!);
    cv.set(11, 5, CREAM[2]!);
    out.blit(outline(cv), k * 13, 0);
  }
  return out;
}

/**
 * The Garantía Provisional (M9b 12a), the toaster's temporary shield: a heart cut out of a
 * warranty slip, cream paper with a blue rubber stamp and a folded corner. In the HUD, after the
 * hearts: 2 frames of 9x8, whole and half (only the left half: what is left of it after a hit).
 */
export function makeShieldHearts(): Canvas {
  const sheet = new Canvas(18, 8);
  const pat = ['.11.13.', '1111133', '1122111', '.12211.', '..111..', '...1...'];
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(9, 8);
    pat.forEach((row, j) =>
      [...row].forEach((ch, i) => {
        if (ch === '.' || (k === 1 && i >= 4)) return;
        // 1 paper, 2 the stamp, 3 the folded corner (its back, darker).
        cv.set(i + 1, j + 1, ch === '1' ? CREAM[0]! : ch === '2' ? BLUE[1]! : CREAM[2]!);
      }),
    );
    // The paper's shadow edge, so it does not read as a white blob.
    if (k === 0) cv.set(5, 5, CREAM[1]!);
    cv.set(2, 4, CREAM[1]!);
    sheet.blit(outline(cv), k * 9, 0);
  }
  return sheet;
}

/**
 * The Garantía Provisional lying on the floor: the paper heart, a blue stamp across it, the corner
 * folded and a red «30 días» strip at the bottom, 13 × 12. Two frames: the second catches the light.
 */
export function makeShieldPickup(): Canvas {
  const out = new Canvas(26, 12);
  const pat = ['.111.1133', '111111133', '111111111', '111111114', '.1111114.', '..11114..', '...114...', '....4....'];
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(13, 12);
    pat.forEach((row, j) =>
      [...row].forEach((ch, i) => {
        if (ch === '.') return;
        cv.set(i + 1, j + 1, ch === '1' ? CREAM[0]! : ch === '3' ? CREAM[2]! : CREAM[1]!);
      }),
    );
    // The rubber stamp: a blue ring slightly askew, with a dot in the middle.
    for (const [x, y] of [[3, 3], [4, 2], [5, 2], [6, 3], [6, 4], [5, 5], [4, 5], [3, 4]] as const) cv.set(x, y, BLUE[1]!);
    cv.set(4, 3, BLUE[2]!);
    cv.set(5, 4, BLUE[0]!);
    // Lines of small print and the red validity strip.
    cv.rect(3, 7, 3, 1, CREAM[2]!);
    cv.rect(5, 6, 2, 1, RED[1]!);
    cv.set(7, 6, RED[2]!);
    if (k === 1) {
      cv.set(2, 2, WHITE);
      cv.set(3, 2, WHITE);
    }
    out.blit(outline(cv), k * 13, 0);
  }
  return out;
}

/** A heart pattern drawn into `cv` at (ox, oy): 1 body, 2 highlight, 3 shade (as makeSpareHeart). */
function heartInto(cv: Canvas, ox: number, oy: number, pat: readonly string[], col: (ch: string) => RGBA | null): void {
  pat.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (ch === '.') return;
      const c = col(ch);
      if (c) cv.set(ox + i, oy + j, c);
    }),
  );
}

const BIG_HEART = ['.111.111.', '122111111', '121111111', '111111113', '.1111113.', '..11113..', '...113...', '....3....'];
const SMALL_HEART = ['.11.11.', '1211111', '1111113', '.11113.', '..113..', '...3...'];

/**
 * The Corazón Modo Turbo (M9b 12b) on the floor: a red heart with a yellow racing stripe across it
 * and a flame coming out behind, like the turbo button on a hairdryer, 13 × 12. Two frames: the
 * flame flickers and the heart catches the light.
 */
export function makeTurboHeart(): Canvas {
  const out = new Canvas(26, 12);
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(13, 12);
    heartInto(cv, 3, 1, BIG_HEART, (ch) => (ch === '1' ? RED[1]! : ch === '2' ? (k === 1 ? WHITE : RED[0]!) : RED[2]!));
    // The racing stripe: light on top, darker under it, across the middle.
    for (let x = 3; x <= 11; x++) if (cv.get(x, 4)[3]) cv.set(x, 4, YEL[0]!);
    for (let x = 4; x <= 10; x++) if (cv.get(x, 5)[3]) cv.set(x, 5, YEL[1]!);
    // The exhaust flame on the left, longer in the second frame.
    const flame: [number, number, RGBA][] = k === 0
      ? [[2, 4, YEL[0]!], [2, 5, GLOW], [1, 5, RED[0]!]]
      : [[2, 4, YEL[0]!], [1, 4, GLOW], [2, 5, GLOW], [1, 5, YEL[1]!], [0, 5, RED[0]!]];
    for (const [x, y, c] of flame) cv.set(x, y, c);
    out.blit(outline(cv), k * 13, 0);
  }
  return out;
}

/**
 * The Corazón de Sobretensión (M9b 12b) on the floor: a yellow heart with a dark lightning bolt
 * through it, like a high-voltage sign, 13 × 12. Two frames: in the second, cyan sparks jump off it.
 */
export function makeSurgeHeart(): Canvas {
  const out = new Canvas(26, 12);
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(13, 12);
    heartInto(cv, 2, 1, BIG_HEART, (ch) => (ch === '1' ? YEL[1]! : ch === '2' ? YEL[0]! : YEL[2]!));
    // The bolt: a zigzag from the top right lobe down to the tip.
    for (const [x, y] of [[7, 2], [8, 2], [6, 3], [7, 3], [5, 4], [6, 4], [7, 4], [8, 4], [7, 5], [6, 6]] as const) cv.set(x, y, OFFICE[1]!);
    if (k === 1) {
      for (const [x, y] of [[1, 2], [11, 1], [12, 5], [0, 6]] as const) cv.set(x, y, ICE[1]!);
      cv.set(3, 2, WHITE);
    }
    out.blit(outline(cv), k * 13, 0);
  }
  return out;
}

/** The Corazón Modo Turbo in the HUD: 2 frames of 9 × 8, the stripe flickering (it is not lost by halves). */
export function makeTurboHud(): Canvas {
  const sheet = new Canvas(18, 8);
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(9, 8);
    heartInto(cv, 1, 1, SMALL_HEART, (ch) => (ch === '1' ? RED[1]! : ch === '2' ? RED[0]! : RED[2]!));
    for (let x = 1; x <= 7; x++) if (cv.get(x, 3)[3]) cv.set(x, 3, k === 0 ? YEL[0]! : GLOW);
    sheet.blit(outline(cv), k * 9, 0);
  }
  return sheet;
}

/** The Corazón de Sobretensión in the HUD: 2 frames of 9 × 8, whole and half (the left half). */
export function makeSurgeHud(): Canvas {
  const sheet = new Canvas(18, 8);
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(9, 8);
    // The half one keeps the left half only (what is left after a hit).
    const pat = k === 0 ? SMALL_HEART : SMALL_HEART.map((r) => r.slice(0, 4));
    heartInto(cv, 1, 1, pat, (ch) => (ch === '1' ? YEL[1]! : ch === '2' ? YEL[0]! : YEL[2]!));
    for (const [x, y] of [[5, 2], [4, 3], [5, 3], [4, 4]] as const) if (k === 0 || x < 5) cv.set(x, y, OFFICE[1]!);
    sheet.blit(outline(cv), k * 9, 0);
  }
  return sheet;
}

// ---------- Weapons found on the floor (M5) ----------

/** Plancha de Vapor Turbo in the hand: white body, blue water window, hot steel soleplate, taped grip. */
export function makeMiniIron(): Canvas {
  const cv = new Canvas(18, 11);
  const body: Array<[number, number, number]> = [[1, 3, 9], [2, 2, 11], [3, 2, 13], [4, 2, 14], [5, 2, 15]];
  for (const [y, x0, x1] of body) cv.rect(x0, y, x1 - x0 + 1, 1, FRT[1]!);
  cv.rect(3, 1, 7, 1, FRT[0]!);
  cv.rect(2, 2, 1, 4, FRT[0]!);
  cv.rect(3, 5, 13, 1, FRT[2]!);
  for (const [y, , x1] of body) cv.set(x1, y, FRT[2]!);
  cv.set(15, 5, FRT[3]!);
  // Water window and the thermostat dial, stuck on "lino".
  cv.rect(4, 3, 3, 2, BLUE[1]!);
  cv.set(4, 3, BLUE[0]!);
  cv.set(6, 4, BLUE[2]!);
  cv.set(10, 2, RED[1]!);
  cv.set(10, 3, RED[2]!);
  // Soleplate, hot at the tip, with its steam holes.
  cv.rect(1, 6, 16, 1, STEEL[0]!);
  cv.rect(2, 7, 14, 1, STEEL[2]!);
  for (const x of [5, 8, 11]) cv.set(x, 7, STEEL[3]!);
  cv.set(14, 7, GLOW2);
  cv.set(15, 7, GLOW);
  cv.set(16, 6, GLOW);
  // Pistol grip taped on underneath (it never had one).
  box(cv, 5, 8, 3, 3, FRT);
  cv.rect(4, 8, 5, 1, DSTEEL[1]!);
  cv.set(4, 8, DSTEEL[0]!);
  // Frayed cable out of the back.
  cv.set(1, 4, DSTEEL[1]!);
  cv.set(0, 5, DSTEEL[2]!);
  return outline(cv);
}

/** A red-hot staple (player bullet, flies to the right; the game turns it to face its way). */
export function makeStaple(): Canvas {
  const cv = new Canvas(6, 7);
  const pat = ['11111.', '122331', '...231', '...231', '...231', '122331', '11111.'];
  const cols: Record<string, RGBA> = { '1': GLOW2, '2': GLOW, '3': YEL[0]! };
  pat.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(i, j, cols[ch]!)));
  return cv;
}

/** A puff of scalding steam (player bullet of the iron): pale yellow with an orange rim. */
export function makeSteam(): Canvas {
  const cv = new Canvas(9, 9);
  const pat = ['..11.11..', '.1221221.', '122333221', '123333321', '123333321', '122333221', '.1223221.', '..12221..', '...111...'];
  const cols: Record<string, RGBA> = { '1': GLOW, '2': YEL[0]!, '3': WHITE };
  pat.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(i, j, cols[ch]!)));
  return cv;
}

// ---------- Chests and tickets (M5) ----------

/**
 * Caja Fuerte de Devoluciones, 2 frames of 26x24: shut (a ticket slot with a red light, the
 * "returns" label and a hazard strip) and open (the lid up, gold light inside, the light green).
 */
/** Wine-red lacquer and gold of the premium chest (makeChest(true)). */
const WINE = ramp('#c4566a', '#8e2f45', '#64203a', '#3e1428');
const WINE_TOP = ramp('#e07a8a', '#b24458', '#8e2f45', '#64203a');

/**
 * The returns safe: 2 frames of 26x24 (shut, open). `premium`: the rare one (nota del humano del
 * 2026-10-30), wine-red lacquer with gold trim, a gold label and a gold strip along its foot.
 */
export function makeChest(premium = false): Canvas {
  const sheet = new Canvas(52, 24);
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(26, 24);
    const open = k === 1;
    if (open) {
      // The lid stands up at the back.
      box(cv, 6, 0, 18, 6, premium ? WINE : DSTEEL);
      cv.rect(7, 2, 16, 1, premium ? YEL[2]! : DSTEEL[2]!);
    }
    if (premium) cube(cv, 1, 6, 24, 17, 4, 4, WINE, WINE, WINE_TOP);
    else cube(cv, 1, 6, 24, 17, 4, 4, DSTEEL, GLOVE, STEEL);
    if (open) {
      // Inside: dark, with the gold of what is waiting in it.
      for (let j = 0; j < 4; j++) {
        const off = Math.floor((4 - j) / 2);
        cv.rect(1 + off + 1, 6 + j, 22 - off, 1, j < 2 ? GLOVE[3]! : GLOVE[2]!);
      }
      for (const [x, y] of [[12, 8], [13, 8], [14, 9], [16, 7], [10, 9], [18, 9]] as const) cv.set(x, y, YEL[k === 1 ? 1 : 0]!);
      cv.set(13, 7, YEL[0]!);
    }
    // Ticket slot with a stub of paper and the light beside it.
    cv.rect(9, 12, 8, 2, K);
    cv.rect(10, 12, 6, 1, DSTEEL[3]!);
    cv.set(19, 12, open ? GREEN : RED[1]!);
    cv.set(19, 13, open ? GREEN : RED[2]!);
    cv.set(20, 12, open ? WHITE : RED[0]!);
    // The "returns" label: cream with two lines of small print and a red stripe.
    cv.rect(8, 15, 10, 4, premium ? YEL[1]! : CREAM[0]!);
    cv.rect(9, 16, 6, 1, premium ? YEL[3]! : CREAM[2]!);
    cv.rect(9, 17, 8, 1, RED[1]!);
    // Hazard strip along the foot.
    for (let x = 5; x < 24; x++) cv.set(x, 20, premium ? (x % 2 === 0 ? YEL[0]! : YEL[2]!) : (x >> 1) % 2 === 0 ? YEL[1]! : K);
    // Gold corners on the premium one.
    if (premium) for (const [x, y] of [[5, 10], [24, 10], [5, 21], [24, 21]] as const) cv.set(x, y, YEL[1]!);
    // Rivets and a dent.
    for (const [x, y] of [[6, 11], [23, 11], [6, 18]] as const) cv.set(x, y, premium ? YEL[0]! : STEEL[1]!);
    cv.set(21, 16, DSTEEL[2]!);
    if (!premium) cv.set(2, 14, RUSTR[1]!);
    sheet.blit(outline(cv), k * 26, 0);
  }
  return sheet;
}

/** A purchase ticket lying on the floor, 2 frames of 9x11 (the second glints). Also the HUD icon. */
export function makeTicket(): Canvas {
  const sheet = new Canvas(18, 11);
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(9, 11);
    cv.rect(1, 1, 7, 9, WHITE);
    cv.rect(1, 1, 1, 9, CREAM[1]!);
    cv.rect(2, 2, 5, 1, K);
    cv.rect(2, 4, 4, 1, DSTEEL[0]!);
    cv.rect(2, 6, 5, 1, DSTEEL[0]!);
    cv.rect(2, 8, 5, 1, RED[1]!);
    // Torn zigzag foot.
    cv.put(2, 9, [0, 0, 0, 0]);
    cv.put(5, 9, [0, 0, 0, 0]);
    if (k === 1) for (const [x, y] of [[6, 1], [7, 2], [7, 3]] as const) cv.set(x, y, YEL[0]!);
    sheet.blit(outline(cv), k * 9, 0);
  }
  return sheet;
}

/**
 * A story document on the floor of a secret room, 14 × 13: a manila folder with a sheet sticking
 * out, a red «CONFIDENCIAL»-looking stamp and the clip of an old filing system.
 */
export function makeStoryDoc(): Canvas {
  const cv = new Canvas(14, 13);
  // The sheet behind, sticking out of the top.
  cv.rect(3, 1, 8, 4, WHITE);
  cv.rect(4, 2, 5, 1, DSTEEL[0]!);
  cv.rect(4, 3, 4, 1, DSTEEL[0]!);
  // The folder, with its tab on the left.
  cv.rect(1, 3, 4, 2, CARD[1]!);
  cv.rect(1, 4, 12, 8, CARD[1]!);
  cv.rect(1, 4, 12, 1, CARD[0]!);
  cv.rect(1, 11, 12, 1, CARD[2]!);
  cv.rect(12, 5, 1, 6, CARD[2]!);
  // The stamp, a bit askew, and the clip.
  cv.rect(3, 7, 6, 1, RED[1]!);
  cv.rect(4, 8, 6, 1, RED[1]!);
  cv.set(3, 8, RED[2]!);
  cv.rect(10, 2, 1, 4, STEEL[1]!);
  cv.set(10, 2, STEEL[0]!);
  return outline(cv);
}

/**
 * The shopkeeper: a self-checkout till, 3 frames of 30x36 (idle with a smiley on its screen,
 * talking, and refusing with the screen gone red). Scanner on top, a card slot, a receipt
 * printer with a receipt far too long, the bagging shelf and the «call an assistant» lamp that
 * nobody answers.
 */
export function makeSelfCheckout(): Canvas {
  const sheet = new Canvas(90, 36);
  for (let k = 0; k < 3; k++) {
    const cv = new Canvas(30, 36);
    // The «call an assistant» lamp on its pole (lit when it refuses).
    cv.rect(25, 3, 1, 14, DSTEEL[2]!);
    cv.rect(24, 1, 3, 3, k === 2 ? RED[1]! : RED[3]!);
    cv.set(24, 1, k === 2 ? RED[0]! : RED[2]!);
    // The screen, tilted towards the customer, on a short neck.
    cv.rect(13, 13, 4, 3, DSTEEL[2]!);
    box(cv, 6, 1, 18, 13, DSTEEL);
    const scr = k === 2 ? RED[3]! : hx('#16303a');
    cv.rect(8, 3, 14, 9, scr);
    // Its face, in screen pixels.
    const lit = k === 2 ? RED[0]! : hx('#7ef0a0');
    if (k === 2) {
      // X X and a flat mouth: «unexpected item».
      for (const [x, y] of [[11, 5], [13, 7], [12, 6], [13, 5], [11, 7], [17, 5], [19, 7], [18, 6], [19, 5], [17, 7]] as const) cv.set(x, y, lit);
      cv.rect(12, 10, 7, 1, lit);
    } else {
      cv.rect(11, 5, 2, 2, lit);
      cv.rect(18, 5, 2, 2, lit);
      if (k === 0) {
        cv.set(11, 9, lit);
        cv.rect(12, 10, 7, 1, lit);
        cv.set(19, 9, lit);
      } else {
        cv.rect(13, 9, 5, 2, lit);
        cv.rect(14, 9, 3, 1, hx('#3aa86a'));
      }
    }
    // Scanlines and a glare in the corner.
    for (let y = 4; y < 12; y += 2) for (let x = 8; x < 22; x++) if ((x + y) % 7 === 0) cv.set(x, y, k === 2 ? RED[2]! : hx('#1f4450'));
    cv.set(9, 4, WHITE);
    cv.set(10, 4, k === 2 ? RED[0]! : hx('#2f6070'));
    // The body: white plastic, the scanner glass on top with its red line.
    cube(cv, 2, 15, 24, 20, 5, 5, CREAM, DSTEEL, STEEL);
    cv.rect(10, 16, 11, 2, GLOVE[3]!);
    cv.rect(10, 17, 11, 1, RED[1]!);
    // Card slot and coupon slot with their lights.
    cv.rect(9, 22, 6, 2, K);
    cv.rect(10, 22, 4, 1, GLOVE[1]!);
    cv.set(16, 22, k === 2 ? RED[1]! : GREEN);
    cv.rect(18, 22, 5, 2, YEL[2]!);
    cv.rect(19, 22, 3, 1, K);
    // The receipt printer and its receipt, down to the floor and curling.
    cv.rect(10, 26, 8, 2, GLOVE[2]!);
    cv.rect(11, 27, 6, 1, K);
    cv.rect(12, 28, 4, 6, WHITE);
    for (let y = 29; y < 34; y += 2) cv.rect(13, y, 2, 1, CREAM[2]!);
    cv.rect(11, 34, 7, 1, WHITE);
    cv.set(18, 34, CREAM[1]!);
    // Price sticker «-0 %» on the side, and a scuff.
    cv.rect(3, 23, 3, 4, YEL[1]!);
    cv.set(4, 24, RED[2]!);
    cv.set(4, 26, RED[2]!);
    cv.set(23, 31, CREAM[2]!);
    // Bagging shelf on the right, with a sad plastic bag.
    cv.rect(26, 21, 4, 1, STEEL[2]!);
    cv.rect(27, 17, 2, 4, WHITE);
    cv.set(27, 17, CREAM[1]!);
    cv.set(28, 16, WHITE);
    sheet.blit(outline(cv), k * 30, 0);
  }
  return sheet;
}

/** A shop display stand (under each shelf slot), 22x13: a steel plinth with a red «offer» strip. */
export function makeShopStand(): Canvas {
  const cv = new Canvas(22, 13);
  cube(cv, 1, 0, 20, 12, 3, 4, CREAM, DSTEEL, STEEL);
  cv.rect(4, 6, 16, 3, RED[1]!);
  cv.rect(4, 6, 16, 1, RED[0]!);
  for (let x = 6; x < 18; x += 3) cv.set(x, 7, WHITE);
  return outline(cv);
}

// M9b (13b): the table that tips over. Five 28 x 28 frames, the bottom row on the floor line of
// the tile (the sim's prop y): 0 standing; tipped, its top facing 1 north (away from the camera:
// the underside and the legs at us), 2 south (the top at us, the legs behind), 3 east and 4 west
// (on its side, the legs out the other way). Floor 1: a bargain table of pressboard on folding
// legs, with its «saldos» tag; floor 2: a demo desk of beige laminate on steel legs.

interface TableLook {
  top: Ramp;
  under: Ramp;
  leg: Ramp;
  /** Odds and ends on the standing table and the tag on its edge. */
  dress: (cv: Canvas, edgeY: number) => void;
  /** The tag on the top, seen face on (tipped south). */
  tag: (cv: Canvas, x: number, y: number) => void;
}

const TABLE_LOOKS: Record<1 | 2 | 3 | 4 | 5 | 6, TableLook> = {
  1: {
    top: ramp('#c99e6a', '#a77c4c', '#7d5a36', '#553c24'),
    under: ramp('#8f6c40', '#6e5232', '#523c24', '#3a2a1a'),
    leg: DSTEEL,
    dress: (cv, edgeY) => {
      // A pair of socks and a lonely box: the leftovers of the sale.
      cv.rect(6, edgeY - 6, 4, 3, CARD[1]!);
      cv.rect(6, edgeY - 6, 4, 1, CARD[0]!);
      cv.rect(13, edgeY - 4, 3, 2, BLUE[1]!);
      cv.rect(16, edgeY - 4, 2, 2, BLUE[2]!);
      // The «saldos» tag hangs off the front edge: red, a white stripe.
      cv.rect(19, edgeY, 4, 3, RED[1]!);
      cv.rect(20, edgeY + 1, 2, 1, WHITE);
    },
    tag: (cv, x, y) => {
      cv.rect(x, y, 5, 3, RED[1]!);
      cv.rect(x + 1, y + 1, 3, 1, WHITE);
    },
  },
  2: {
    top: BEIGE,
    under: ramp('#a99b74', '#857a5c', '#665d46', '#4a4334'),
    leg: STEEL,
    dress: (cv, edgeY) => {
      // A demo keyboard and the card that says it is not for sale.
      cv.rect(5, edgeY - 5, 8, 3, OFFICE[1]!);
      cv.rect(6, edgeY - 5, 6, 1, OFFICE[0]!);
      cv.rect(16, edgeY - 6, 4, 4, WHITE);
      cv.rect(17, edgeY - 4, 2, 1, RED[1]!);
      cv.rect(19, edgeY, 4, 3, BLUE[1]!);
      cv.rect(20, edgeY + 1, 2, 1, WHITE);
    },
    tag: (cv, x, y) => {
      cv.rect(x, y, 5, 3, BLUE[1]!);
      cv.rect(x + 1, y + 1, 3, 1, WHITE);
    },
  },
  // Floor 3: a children's craft table of yellow plastic on red legs, crayons and a colouring book.
  3: {
    top: ramp('#f6dc7a', '#e0b23c', '#b08a2a', '#7a5e1c'),
    under: ramp('#b08a2a', '#8f6f22', '#6e541a', '#4e3a12'),
    leg: RED,
    dress: (cv, edgeY) => {
      cv.rect(5, edgeY - 6, 6, 4, WHITE);
      cv.rect(5, edgeY - 6, 6, 1, hx('#e9e3d2'));
      cv.rect(6, edgeY - 4, 3, 1, BLUE[1]!);
      cv.rect(14, edgeY - 4, 4, 1, BLUE[1]!);
      cv.rect(14, edgeY - 3, 4, 1, hx('#4b9a4e'));
      cv.set(17, edgeY - 5, RED[1]!);
      cv.rect(19, edgeY, 4, 3, PLAST_PINK[1]!);
      cv.rect(20, edgeY + 1, 2, 1, WHITE);
    },
    tag: (cv, x, y) => {
      cv.rect(x, y, 5, 3, PLAST_PINK[1]!);
      cv.rect(x + 1, y + 1, 3, 1, WHITE);
    },
  },
  // Floor 4: an office desk, grey laminate on black legs, a mug with a ring and the post-it on it.
  4: {
    top: ramp('#c8c8cc', '#a8a7b0', '#84838c', '#5f5e68'),
    under: ramp('#84838c', '#66656f', '#4e4d56', '#36353c'),
    leg: OFFICE,
    dress: (cv, edgeY) => {
      cv.rect(5, edgeY - 6, 7, 4, WHITE);
      cv.rect(6, edgeY - 5, 5, 1, hx('#9a98a4'));
      cv.rect(15, edgeY - 5, 3, 3, BLUE[2]!);
      cv.set(18, edgeY - 4, BLUE[2]!);
      cv.set(16, edgeY - 5, BROWN[2]!);
      cv.rect(19, edgeY, 4, 3, YEL[1]!);
      cv.rect(20, edgeY + 1, 2, 1, K);
    },
    tag: (cv, x, y) => {
      cv.rect(x, y, 5, 3, YEL[1]!);
      cv.rect(x + 1, y + 1, 3, 1, K);
    },
  },
  // Floor 5: the low table of a waiting room, beech laminate on chrome, last year's magazines.
  5: {
    top: ramp('#e6cfa0', '#c8a874', '#a08458', '#74603e'),
    under: ramp('#a08458', '#806a46', '#605034', '#423826'),
    leg: STEEL,
    dress: (cv, edgeY) => {
      // A fan of old magazines (one with a crossword done in pen) and a leaflet.
      cv.rect(5, edgeY - 6, 7, 5, hx('#a42f37'));
      cv.rect(6, edgeY - 5, 7, 4, hx('#3f66a6'));
      cv.rect(7, edgeY - 4, 4, 1, WHITE);
      cv.rect(15, edgeY - 5, 5, 4, CREAM[0]!);
      cv.rect(16, edgeY - 4, 3, 1, hx('#2f4a6a'));
      cv.rect(19, edgeY, 4, 3, BLUE[1]!);
      cv.rect(20, edgeY + 1, 2, 1, WHITE);
    },
    tag: (cv, x, y) => {
      cv.rect(x, y, 5, 3, BLUE[1]!);
      cv.rect(x + 1, y + 1, 3, 1, WHITE);
    },
  },
  // Floor 6: a workbench, a thick beech top black with oil on green steel legs; a vice, and a toaster opened up on it.
  6: {
    top: ramp('#a8865a', '#86683e', '#5e4a2c', '#3e301c'),
    under: ramp('#6a7a62', '#4e5c48', '#3a4636', '#262e22'),
    leg: ramp('#7a8c72', '#4e5c48', '#3a4636', '#262e22'),
    dress: (cv, edgeY) => {
      // The vice bolted to the corner, its jaws and handle.
      cv.rect(4, edgeY - 5, 5, 4, DSTEEL[1]!);
      cv.rect(4, edgeY - 5, 5, 1, DSTEEL[0]!);
      cv.rect(3, edgeY - 2, 7, 1, DSTEEL[2]!);
      cv.rect(6, edgeY - 1, 1, 3, STEEL[1]!);
      // A toaster with its casing off: the element glowing faintly, a screw beside it.
      cv.rect(13, edgeY - 6, 7, 5, STEEL[2]!);
      cv.rect(13, edgeY - 6, 7, 1, STEEL[1]!);
      cv.rect(14, edgeY - 5, 5, 1, hx('#ff7a1f'));
      cv.rect(14, edgeY - 3, 5, 1, hx('#a8521c'));
      cv.set(21, edgeY - 2, STEEL[0]!);
      // Oil soaked into the wood.
      cv.rect(10, edgeY - 3, 2, 1, hx('#3e301c'));
      // The green label on the edge.
      cv.rect(19, edgeY, 4, 3, WS_GREEN[1]!);
      cv.rect(20, edgeY + 1, 2, 1, WHITE);
    },
    tag: (cv, x, y) => {
      cv.rect(x, y, 5, 3, WS_GREEN[1]!);
      cv.rect(x + 1, y + 1, 3, 1, WHITE);
    },
  },
};

function tableStanding(L: TableLook): Canvas {
  const cv = new Canvas(28, 28);
  // Legs first (the top hides where they meet it): the back pair shorter and darker.
  for (const x of [6, 21]) cv.rect(x, 18, 1, 5, L.leg[3]!);
  for (const x of [4, 23]) {
    cv.rect(x, 18, 2, 9, L.leg[2]!);
    cv.rect(x, 18, 1, 9, L.leg[1]!);
  }
  // The cross brace of the folding legs.
  cv.rect(6, 22, 16, 1, L.leg[3]!);
  // The top, seen from above, and its front edge.
  box(cv, 3, 10, 22, 8, L.top);
  cv.rect(3, 17, 22, 2, L.top[2]!);
  cv.rect(3, 18, 22, 1, L.top[3]!);
  // Wood grain (or the laminate's scratches).
  cv.rect(6, 12, 5, 1, L.top[2]!);
  cv.rect(15, 14, 6, 1, L.top[2]!);
  L.dress(cv, 17);
  return outline(cv);
}

/** Tipped, top to the north: the underside faces the camera and the legs stick out at it. */
function tableNorth(L: TableLook): Canvas {
  const cv = new Canvas(28, 28);
  // The underside, standing up at the back of the footprint.
  box(cv, 3, 3, 22, 13, L.under);
  cv.rect(3, 15, 22, 1, L.under[3]!);
  // The frame under the top, and the brace.
  cv.rect(5, 5, 18, 1, L.under[2]!);
  cv.rect(5, 13, 18, 1, L.under[2]!);
  cv.rect(5, 5, 1, 9, L.under[2]!);
  cv.rect(22, 5, 1, 9, L.under[2]!);
  // The lower legs lie on the floor towards us; the upper ones stick out in the air.
  for (const x of [4, 23]) {
    cv.rect(x, 15, 2, 11, L.leg[2]!);
    cv.rect(x, 15, 1, 11, L.leg[1]!);
  }
  for (const x of [7, 20]) {
    cv.rect(x, 5, 2, 10, L.leg[1]!);
    cv.rect(x + 1, 5, 1, 10, L.leg[2]!);
    cv.set(x, 14, L.leg[0]!);
  }
  return outline(cv);
}

/** Tipped, top to the south: the top faces the camera; the legs peek over it from behind. */
function tableSouth(L: TableLook): Canvas {
  const cv = new Canvas(28, 28);
  for (const x of [6, 21]) {
    cv.rect(x, 4, 2, 10, L.leg[2]!);
    cv.rect(x, 4, 1, 10, L.leg[1]!);
  }
  box(cv, 3, 13, 22, 13, L.top);
  cv.rect(3, 25, 22, 1, L.top[3]!);
  cv.rect(6, 16, 6, 1, L.top[2]!);
  cv.rect(14, 20, 7, 1, L.top[2]!);
  L.tag(cv, 17, 15);
  return outline(cv);
}

/** Tipped, top to the east: on its side, the top a narrow wall, the legs out to the west. */
function tableEast(L: TableLook): Canvas {
  const cv = new Canvas(28, 28);
  // Legs: lower pair on the floor, upper pair in the air (one row each per end of the table).
  for (const y of [25, 16]) {
    cv.rect(10, y, 12, 2, L.leg[2]!);
    cv.rect(10, y, 12, 1, L.leg[1]!);
  }
  for (const y of [13, 4]) {
    cv.rect(11, y, 11, 2, L.leg[1]!);
    cv.rect(11, y + 1, 11, 1, L.leg[2]!);
  }
  // The top on its edge: its underside a sliver to the west, its thickness to the east.
  cv.rect(20, 3, 3, 24, L.under[1]!);
  cv.rect(20, 3, 1, 24, L.under[2]!);
  cv.rect(23, 2, 3, 25, L.top[1]!);
  cv.rect(23, 2, 1, 25, L.top[0]!);
  cv.rect(25, 2, 1, 25, L.top[2]!);
  cv.rect(23, 26, 3, 1, L.top[3]!);
  return outline(cv);
}

function mirror(cv: Canvas): Canvas {
  const out = new Canvas(cv.w, cv.h);
  for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) out.p[y]![cv.w - 1 - x] = cv.get(x, y);
  return out;
}

export function makeTableFrames(level: 1 | 2 | 3 | 4 | 5 | 6): Canvas[] {
  const L = TABLE_LOOKS[level];
  const east = tableEast(L);
  return [tableStanding(L), tableNorth(L), tableSouth(L), east, mirror(east)];
}

/** The envelope's confetti: a square of red gift wrap with a yellow ribbon, fluttering (2 frames, 7x7). */
export function makeConfetti(): Canvas {
  const frames: Array<readonly string[]> = [
    ['.00000.', '0221120', '0233320', '0123210', '0113110', '0111110', '.00000.'],
    ['.......', '.00000.', '0223320', '0133310', '0111110', '.00000.', '.......'],
  ];
  const cols: Record<string, RGBA> = { '0': RED[3]!, '1': RED[1]!, '2': RED[0]!, '3': YEL[1]! };
  const sheet = new Canvas(7 * frames.length, 7);
  frames.forEach((rows, f) => paintGrid(sheet, f * 7, 0, rows, cols));
  return sheet;
}

/** Rotates a square grid a quarter turn clockwise. */
function quarterTurn(rows: readonly string[]): string[] {
  const n = rows.length;
  return rows.map((_, r) => Array.from({ length: n }, (_, c) => rows[n - 1 - c]![r]!).join(''));
}

/**
 * The Muñeco de Moda's accessories (M10 5b): a pink plastic court shoe and a little handbag with
 * its clasp, each in four quarter turns so they spin as they fly. 8 frames of 9x9: 0-3 the shoe,
 * 4-7 the bag.
 */
export function makeAccessory(): Canvas {
  const shoe = ['.........', '.........', '......00.', '.....0230', '0000.0110', '022200110', '011111110', '000000010', '.......00'];
  const bag = ['...000...', '..0...0..', '..0...0..', '.0000000.', '.0222210.', '.0211110.', '.0113110.', '.0111110.', '.0000000.'];
  const turns = (g: readonly string[]): string[][] => {
    const out: string[][] = [[...g]];
    for (let i = 1; i < 4; i++) out.push(quarterTurn(out[i - 1]!));
    return out;
  };
  const frames = [...turns(shoe), ...turns(bag)];
  const P = ramp('#ffd6ec', '#f07cc0', '#c0468e', '#4a1838');
  const cols: Record<string, RGBA> = { '0': P[3]!, '1': P[1]!, '2': P[0]!, '3': WHITE };
  const sheet = new Canvas(9 * frames.length, 9);
  frames.forEach((rows, f) => paintGrid(sheet, f * 9, 0, rows, cols));
  return sheet;
}

/**
 * The Muñeco de Moda's sale stickers (phase 3, M10 5c): a round yellow price sticker, red-rimmed (it is a bullet, not a coupon), with a red
 * «%», its top-left lit; four quarter turns, so it turns as it flies. 4 frames of 9x9.
 */
export function makeSticker(): Canvas {
  const g = [
    '..00000..',
    '.0221110.',
    '023111310',
    '011113110',
    '011131110',
    '011311110',
    '013111310',
    '.0111110.',
    '..00000..',
  ];
  const frames: string[][] = [[...g]];
  for (let i = 1; i < 4; i++) frames.push(quarterTurn(frames[i - 1]!));
  const Y = ramp('#fff4a8', '#f6c431', '#c98a1a', '#4a2a10');
  const cols: Record<string, RGBA> = { '0': RED[3]!, '1': Y[1]!, '2': Y[0]!, '3': RED[1]! };
  const sheet = new Canvas(9 * frames.length, 9);
  frames.forEach((rows, f) => paintGrid(sheet, f * 9, 0, rows, cols));
  return sheet;
}

/**
 * Plastilina Mezclada (M10 6b2): a stuck bullet, a blob of plasticine that was four colours and is
 * now one, with streaks of what it used to be. 12x10, frames 0-1 wobbling; 2-3 the same with
 * glitter in it (Manualidades).
 */
export function makePegoteFrames(): Canvas[] {
  const shapes = [
    ['............', '....0000....', '..00333300..', '.0332222330.', '.0324452220.', '022225562220', '.0226662210.', '.0122222110.', '..00111100..', '....0000....'],
    ['............', '............', '..00000000..', '.0333223330.', '032244522230', '022225566220', '.0122666210.', '..01111110..', '...000000...', '............'],
  ];
  const cols: Record<string, RGBA> = {
    '0': K, '1': hx('#5a4a54'), '2': hx('#8a7680'), '3': hx('#b3a3aa'), '4': hx('#e0453b'), '5': hx('#4a86d8'), '6': hx('#58b45a'),
  };
  const glitter: [number, number][][] = [[[3, 3], [7, 4], [5, 6], [9, 5]], [[3, 4], [7, 3], [8, 6], [4, 6]]];
  const out: Canvas[] = [];
  for (const sparkly of [false, true]) {
    shapes.forEach((pat, f) => {
      const cv = new Canvas(12, 10);
      pat.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(i, j, cols[ch]!)));
      if (sparkly) for (const [x, y] of glitter[f]!) cv.set(x, y, (x + y) % 2 ? hx('#ea93a8') : hx('#f4f1e8'));
      out.push(cv);
    });
  }
  return out;
}

/**
 * The DENEGADO stamp's drops of ink (M10 planta 4 (4c)): an enemy bullet the same 9x9 as the round
 * ones, a red drop with a white glint (the saturated colour and white core of every enemy bullet).
 * 2 frames: round and stretched (it wobbles as it flies).
 */
export function makeInkDrop(): Canvas {
  const frames: Array<readonly string[]> = [
    ['..000..', '.01110.', '0122210', '0123210', '0122210', '.01110.', '..000..'],
    ['...0...', '..010..', '.01210.', '0122210', '0123210', '.01210.', '..000..'],
  ];
  const cols: Record<string, RGBA> = { '0': RED[3]!, '1': RED[1]!, '2': RED[0]!, '3': WHITE };
  const sheet = new Canvas(9 * frames.length, 9);
  frames.forEach((rows, f) => paintGrid(sheet, f * 9 + 1, 1, rows, cols));
  return sheet;
}

/**
 * The square of ink a DENEGADO stamp leaves on the floor: 40x26 (a 40 px square seen in 3/4).
 * A worn double frame in stamp red with gaps where the rubber is bald, «DENEGADO» across the middle
 * in «Letra Pequeña», and a thin wash of ink inside so the area reads on any floor.
 */
export function makeInkSquare(): Canvas {
  const W = 40;
  const H = 26;
  const cv = new Canvas(W, H);
  const INK = RED[1]!;
  const DARK = RED[2]!;
  const wash: RGBA = [RED[2]![0], RED[2]![1], RED[2]![2], 110];
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) cv.put(x, y, wash);
  // Outer frame, 2 px, bald in a few places (a stamp never inks evenly).
  cv.rect(0, 0, W, 2, INK);
  cv.rect(0, H - 2, W, 2, INK);
  cv.rect(0, 0, 2, H, INK);
  cv.rect(W - 2, 0, 2, H, INK);
  for (const [x, y] of [[7, 0], [8, 0], [23, 1], [31, H - 1], [32, H - 1], [0, 11], [W - 1, 17], [15, H - 2]] as const) cv.put(x, y, wash);
  // Inner frame, 1 px.
  cv.rect(4, 4, W - 8, 1, DARK);
  cv.rect(4, H - 5, W - 8, 1, DARK);
  cv.rect(4, 4, 1, H - 8, DARK);
  cv.rect(W - 5, 4, 1, H - 8, DARK);
  // The word, centred.
  const word = 'DENEGADO';
  let x = Math.floor((W - textWidth(word)) / 2);
  const y = Math.floor((H - 5) / 2);
  for (const ch of word) {
    const g = GLYPHS.get(ch)!;
    g.rows.slice(2, 7).forEach((row, ry) => [...row].forEach((p, rx) => p === '#' && cv.set(x + rx, y + ry, INK)));
    x += g.w + 1;
  }
  // A splash and a smear: too much ink on one corner.
  cv.rect(W - 4, H - 4, 2, 2, INK);
  cv.set(W - 3, H - 5, INK);
  cv.set(3, 3, INK);
  return cv;
}

/**
 * A scratch card of the Sorteo de Fidelización (M14 (r2b)), 11 × 13: the store's blue band with a
 * yellow star at the top, three silver panels to scratch (one of them half done, the coin's
 * scratch marks) and the red line of small print at the foot.
 */
export function makeScratchCard(): Canvas {
  const cv = new Canvas(11, 13);
  cv.rect(1, 1, 9, 11, WHITE);
  cv.rect(1, 1, 1, 11, CREAM[1]!);
  // The band, with its star.
  cv.rect(1, 1, 9, 4, BLUE[1]!);
  cv.rect(1, 4, 9, 1, BLUE[2]!);
  cv.set(5, 1, YEL[1]!);
  cv.rect(3, 2, 5, 1, YEL[0]!);
  cv.set(5, 3, YEL[1]!);
  // Three silver panels (the middle one already scratched: a coupon peeps out).
  for (const x of [2, 4, 6]) {
    cv.rect(x + (x === 6 ? 1 : 0), 6, 2, 3, STEEL[1]!);
    cv.set(x + (x === 6 ? 1 : 0), 6, STEEL[0]!);
  }
  cv.rect(4, 6, 2, 3, YEL[1]!);
  cv.set(5, 8, STEEL[1]!);
  // The small print nobody reads.
  cv.rect(2, 10, 7, 1, RED[1]!);
  return outline(cv);
}

/**
 * M14b (h11a1): the Regleta Sobrecargada, a power strip with an adapter on an adapter and a
 * charger nobody owns. Frame 0: live (the switch's light on); 1: resting (the room is calm).
 */
export function makeRegletaFrames(): Canvas[] {
  return [true, false].map((live) => {
    const cv = new Canvas(24, 18);
    // Cables first: they go under everything (one out to the left, one out of the far end).
    for (const [x, y] of [[0, 14], [1, 14], [2, 13], [3, 13], [3, 12]] as const) cv.set(x, y, GLOVE[2]!);
    for (const [x, y] of [[21, 15], [22, 15], [23, 16]] as const) cv.set(x, y, GLOVE[2]!);
    // The strip: a long light top with its sockets and a thin front.
    cv.rect(2, 9, 20, 5, CREAM[1]!);
    cv.rect(2, 9, 20, 1, CREAM[0]!);
    cv.rect(2, 14, 20, 2, CREAM[2]!);
    cv.rect(2, 16, 20, 1, CREAM[3]!);
    cv.rect(21, 9, 1, 7, CREAM[2]!);
    // A yellow warning sticker on the front, half peeled.
    cv.rect(6, 14, 3, 2, YEL[1]!);
    cv.set(8, 14, YEL[2]!);
    // Socket 1: a black plug, fat.
    box(cv, 4, 5, 4, 7, GLOVE);
    cv.rect(5, 6, 2, 1, GLOVE[0]!);
    // Socket 2: the white adapter («ladrón») with a red charger on top of it.
    box(cv, 9, 4, 5, 8, FRT);
    // Its own socket on the face, two slits (not eyes: it is not an enemy).
    cv.rect(10, 7, 1, 2, FRT[3]!);
    cv.rect(12, 7, 1, 2, FRT[3]!);
    box(cv, 10, 0, 3, 5, RED);
    // Socket 3: a chunky grey charger with its own little light.
    box(cv, 14, 5, 4, 7, DSTEEL);
    cv.set(16, 7, live ? GREEN : DSTEEL[3]!);
    // The empty last socket: two holes.
    cv.set(18, 11, K);
    cv.set(18, 12, K);
    // The switch at the end, lit while it is live.
    cv.rect(19, 10, 2, 3, live ? RED[1]! : RED[3]!);
    cv.set(19, 10, live ? hx('#fff1a8') : RED[2]!);
    return outline(cv);
  });
}
