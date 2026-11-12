// M13 (7c): what flies off each playable character when it goes down (the toaster's own pieces,
// the slices, the spring and the knob, are `despiece` in props.ts). Four 8 x 8 pieces per sheet,
// in the same order the game flings them: the first two from high up, the other two from low.
//
// Same rules as the toaster's bits: 1 px dark outline, a light top-left, the character's own
// colours so each pile of debris says whose it was.
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { CREAM, ICE, RED, STEEL, WHITE, YEL, outline, ramp } from '../../src/art/lib.ts';

const VIOLET = ramp('#c7a6ec', '#9670cf', '#6c4ea3', '#47337a');
const GLASS = ramp('#f2fbfc', '#cfe8ee', '#9fc3cf', '#6a8f9e');
const SMOOTHIE = ramp('#c9e07a', '#93b84c', '#66893a', '#435f28');
const TEAL = ramp('#8fd9c8', '#3fa996', '#2a7b74', '#1b4f55');
const NAVY = ramp('#7d93c4', '#43588f', '#2d3c6a', '#1d2748');
const SHOE = ramp('#5a5f7a', '#2e3250', '#1c1f36', '#0e0c16');
const SHIRT = ramp('#ffffff', '#e4e8ee', '#b3bccb', '#7e889c');
const SCORCH = ramp('#a8702f', '#6b4220', '#3e2616', '#24160c');
const ROSE = ramp('#fdd9c8', '#f0a994', '#c97b70', '#8a4c52');
const SCREEN = ramp('#3d4c7a', '#242d4e', '#171d36', '#0e0c16');
const CRACK: RGBA = [176, 190, 214, 255];
const COFFEE = ramp('#c08a5c', '#7a4e3c', '#4e301a', '#33200f');
const PEN = ramp('#7d93c4', '#3f66a6', '#27447a', '#1d2748');

/** A piece from a pattern: one character per pixel, '.' is empty. */
function piece(rows: readonly string[], cols: Record<string, RGBA>): Canvas {
  const cv = new Canvas(8, 8);
  rows.forEach((row, y) => [...row].forEach((ch, x) => cv.set(x, y, cols[ch])));
  return outline(cv);
}

function sheet(pieces: readonly Canvas[]): Canvas {
  const out = new Canvas(8 * pieces.length, 8);
  pieces.forEach((p, i) => out.blit(p, 8 * i, 0));
  return out;
}

/**
 * The Batidora de Vaso: the jar's lid with its red stopper, the striped straw, a blade off the
 * motor and a shard of the jar with the green smoothie still dried on.
 */
export function makeBlenderBits(): Canvas {
  const lid = piece(['........', '...rr...', '..rRRr..', '.dddddd.', '.dDDDDd.', '.ssssss.', '........', '........'], {
    r: RED[0]!, R: RED[1]!, d: STEEL[2]!, D: STEEL[3]!, s: STEEL[4]!,
  });
  const straw = piece(['......w.', '.....rw.', '....wr..', '...rw...', '..wr....', '.rw.....', '.w......', '........'], {
    w: WHITE, r: RED[1]!,
  });
  const blade = piece(['........', '.ll.....', '..lL....', '...hh...', '...hhLl.', '....L.l.', '....l...', '........'], {
    l: STEEL[0]!, L: STEEL[2]!, h: VIOLET[3]!,
  });
  const shard = piece(['........', '..gg....', '.gGGg...', '.gssGg..', '.gSSsGg.', '..SSSs..', '...SS...', '........'], {
    g: GLASS[1]!, G: GLASS[0]!, s: SMOOTHIE[1]!, S: SMOOTHIE[2]!,
  });
  return sheet([lid, straw, blade, shard]);
}

/**
 * The Plancha de Vapor: the selector still stuck on LINO, the burnt shirt collar from the job
 * interview, the water tank's cap and one of her black interview shoes.
 */
export function makeIronBits(): Canvas {
  const dial = piece(['........', '..cccc..', '.cCCCCc.', '.cCrCCc.', '.cCrCCd.', '.cddddd.', '..dddd..', '........'], {
    c: CREAM[0]!, C: CREAM[1]!, d: CREAM[2]!, r: RED[1]!,
  });
  const collar = piece(['........', '.w....w.', '.ww..ww.', '..wwbbw.', '..wbBBw.', '...wbw..', '........', '........'], {
    w: SHIRT[1]!, b: SCORCH[0]!, B: SCORCH[2]!,
  });
  const cap = piece(['........', '...nn...', '..nNNn..', '.tttttt.', '.tTTTTt.', '.ttwwtt.', '........', '........'], {
    n: NAVY[1]!, N: NAVY[0]!, t: TEAL[2]!, T: TEAL[1]!, w: ICE[1]!,
  });
  const shoe = piece(['........', '........', '.ss.....', '.sSs....', '.sSSsss.', '.ssssssh', '..kkkkk.', '........'], {
    s: SHOE[1]!, S: SHOE[0]!, k: SHOE[3]!, h: SHOE[2]!,
  });
  return sheet([dial, collar, cap, shoe]);
}

/**
 * El Becario Eterno is not an appliance: nothing comes apart. Off fly his «BECARIO» badge (no
 * photo), the paper cup of coffee, his unsigned internship agreement and the blue biro.
 */
export function makeInternBits(): Canvas {
  const badge = piece(['...bb...', '..wwww..', '.wWWWWw.', '.wddWWw.', '.wddWWw.', '.wRRRRw.', '.wwwwww.', '........'], {
    b: PEN[1]!, w: SHIRT[2]!, W: SHIRT[0]!, d: SHIRT[2]!, R: RED[1]!,
  });
  const cup = piece(['........', '.cCCCCc.', '..wWWw..', '..wrrw..', '..wWWw..', '...ww...', '........', '........'], {
    c: COFFEE[2]!, C: COFFEE[1]!, w: CREAM[1]!, W: CREAM[0]!, r: RED[1]!,
  });
  const paper = piece(['.pppp...', '.pPPPp..', '.pllPp..', '.pPPPp..', '.pllPp..', '.pPPyp..', '.ppppp..', '........'], {
    p: SHIRT[2]!, P: SHIRT[0]!, l: SHIRT[3]!, y: YEL[1]!,
  });
  const biro = piece(['........', '......k.', '.....bk.', '....bB..', '...bB...', '..bB....', '.ww.....', '........'], {
    b: PEN[2]!, B: PEN[0]!, k: SHOE[2]!, w: WHITE,
  });
  return sheet([badge, cup, paper, biro]);
}

/**
 * The Móvil Reacondicionado: the swollen battery (at 1 %, as ever), a shard of the cracked screen,
 * the SIM card and the charger plug with its yellow tape.
 */
export function makePhoneBits(): Canvas {
  const battery = piece(['........', '.kkkkkk.', '.kggggk.', '.kgGGgkk', '.kgrGgkk', '.kggggk.', '.kkkkkk.', '........'], {
    k: STEEL[3]!, g: STEEL[1]!, G: STEEL[0]!, r: RED[1]!,
  });
  const glass = piece(['........', '.ss.....', '.sSs....', '.scSss..', '.sSScSs.', '.ssssSc.', '........', '........'], {
    s: SCREEN[1]!, S: SCREEN[0]!, c: CRACK,
  });
  const sim = piece(['........', '.wwww...', '.wyyww..', '.wyYyw..', '.wyyyw..', '.wwwww..', '........', '........'], {
    w: ROSE[0]!, y: YEL[1]!, Y: YEL[0]!,
  });
  const plug = piece(['........', '..ss....', '.wwww...', '.wWWw...', '.wyyw...', '..ww....', '...w....', '...w....'], {
    s: STEEL[1]!, w: hx('#d3d8e4'), W: WHITE, y: YEL[1]!,
  });
  return sheet([battery, glass, sim, plug]);
}
