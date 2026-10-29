// Menus without Phaser: what the options are, which one is chosen and what a key does to them.
// The pause scene draws a Menu and feeds it keys, pad buttons and clicks; tests drive it directly.

/** One line of a menu: an action, or a setting changed with left and right. */
export type MenuItem =
  | { kind: 'action'; id: string; label: string }
  | { kind: 'range'; id: string; label: string; min: number; max: number; value: number }
  | { kind: 'toggle'; id: string; label: string; value: boolean };

/** What a key press did: nothing, an action to carry out, or a setting that changed. */
export type MenuResult = { type: 'none' } | { type: 'action'; id: string } | { type: 'changed'; id: string; value: number | boolean };

export class Menu {
  index = 0;
  readonly items: MenuItem[];
  constructor(items: MenuItem[]) {
    if (items.length === 0) throw new Error('Un menú sin opciones');
    this.items = items;
  }

  get current(): MenuItem {
    return this.items[this.index]!;
  }

  /** Up (-1) or down (+1), going round. */
  move(d: number): void {
    const n = this.items.length;
    this.index = (((this.index + d) % n) + n) % n;
  }

  /** Left (-1) or right (+1): changes the setting under the cursor (ranges stop at their ends). */
  adjust(d: number): MenuResult {
    const it = this.current;
    if (it.kind === 'range') {
      const v = Math.max(it.min, Math.min(it.max, it.value + d));
      if (v === it.value) return { type: 'none' };
      it.value = v;
      return { type: 'changed', id: it.id, value: v };
    }
    if (it.kind === 'toggle') {
      it.value = !it.value;
      return { type: 'changed', id: it.id, value: it.value };
    }
    return { type: 'none' };
  }

  /** Enter, A or a click: an action is carried out; a toggle flips; a range goes up one and round. */
  confirm(): MenuResult {
    const it = this.current;
    if (it.kind === 'action') return { type: 'action', id: it.id };
    if (it.kind === 'toggle') return this.adjust(1);
    it.value = it.value >= it.max ? it.min : it.value + 1;
    return { type: 'changed', id: it.id, value: it.value };
  }

  /** The text of a line as it is drawn: «Volumen de efectos: 7/10», «Pantalla completa: Sí». */
  static text(it: MenuItem): string {
    if (it.kind === 'range') return `${it.label}: ${it.value}/${it.max}`;
    if (it.kind === 'toggle') return `${it.label}: ${it.value ? 'Sí' : 'No'}`;
    return it.label;
  }
}
