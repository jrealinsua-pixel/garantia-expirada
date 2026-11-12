// M13 (1): elegir personaje en el tablón. El que está «en exposición» se guarda en el perfil, la
// partida y el Mostrador lo usan, y el tablón lo marca. Desde M13 (3) la segunda es la Batidora
// de Vaso de verdad.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS } from '../src/data/characters.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import { emptyProfile, parseProfile, type Profile } from '../src/sim/profile.ts';
import { exhibited, nextExhibited, playableNow, rosterBoard } from '../src/sim/unlocks.ts';
import { createWorld, leaveHub, setCharacter } from '../src/sim/world.ts';
import { boardLayout, boardTextBox, type BoardEntry } from '../src/render/board.ts';
import { BOARD_SHOWN, boardHint, DEFAULT_KEY_WORDS } from '../src/data/texts.ts';
import { HUD_W } from '../src/render/hud.ts';

const unlockedBoth = (): Profile => ({ ...emptyProfile(), unlocked: ['tostadora', 'batidora-vaso'] });

test('todos los personajes tienen su hoja de sprites con las medidas dentro del fotograma', () => {
  for (const c of Object.values(CHARACTERS)) {
    const l = c.look;
    assert.ok(l.sheet.length > 0, c.id);
    assert.ok(l.feetX > 0 && l.feetX < l.w && l.feetY > 0 && l.feetY <= l.h, `${c.id}: los pies dentro del fotograma`);
    assert.ok(l.spinY > 0 && l.spinY < l.feetY, `${c.id}: gira por encima de los pies`);
    assert.ok(WEAPONS[c.startWeapon], `${c.id}: su arma inicial existe`);
  }
});

test('de serie, en exposición está la Tostadora; un personaje que no se puede jugar nunca lo está', () => {
  const p = emptyProfile();
  assert.equal(p.chosen, 'tostadora');
  assert.equal(exhibited(p), 'tostadora');
  assert.deepEqual(playableNow(p), ['tostadora']);
  assert.equal(nextExhibited(p), 'tostadora', 'con una sola, no hay a quién cambiar');
  // Locked, or unlocked but not in this version yet: back to the Tostadora.
  assert.equal(exhibited({ ...p, chosen: 'plancha' }), 'tostadora');
  // The Móvil, the last to come (M13 (6)): locked, no; unlocked, yes.
  assert.equal(exhibited({ ...p, chosen: 'movil' }), 'tostadora');
  assert.equal(exhibited({ ...p, chosen: 'movil', unlocked: ['tostadora', 'movil'] }), 'movil');
  assert.equal(exhibited({ ...p, chosen: 'no-existe' }), 'tostadora');
});

test('el tablón pasa por los desbloqueados que se pueden jugar, en su orden, y vuelve a empezar', () => {
  const p = unlockedBoth();
  assert.deepEqual(playableNow(p), ['tostadora', 'batidora-vaso']);
  assert.equal(nextExhibited(p), 'batidora-vaso');
  assert.equal(nextExhibited({ ...p, chosen: 'batidora-vaso' }), 'tostadora');
  // Not unlocked: skipped even though it exists.
  assert.equal(nextExhibited(emptyProfile()), 'tostadora');
});

test('el que está en exposición se guarda con el perfil', () => {
  const saved = JSON.stringify({ ...emptyProfile(), chosen: 'batidora-vaso', unlocked: ['tostadora', 'batidora-vaso'] });
  const p = parseProfile(saved);
  assert.equal(p.chosen, 'batidora-vaso');
  assert.equal(parseProfile(JSON.stringify({ runs: 3 })).chosen, 'tostadora', 'un perfil viejo empieza con la Tostadora');
  assert.equal(parseProfile(JSON.stringify({ chosen: 7 })).chosen, 'tostadora');
});

test('en el Mostrador se cambia de cuerpo: su vida y su arma, en el mismo sitio; fuera del Mostrador, no', () => {
  const w = createWorld({ seed: 'mostrador', hub: {} });
  const { x, y } = w.player;
  assert.equal(setCharacter(w, 'batidora-vaso'), true);
  assert.equal(w.player.base.def.id, 'batidora-vaso');
  assert.equal(w.player.def.maxHp, 4);
  assert.equal(w.player.hp, 4);
  assert.deepEqual(w.player.arsenal.map((ws) => ws.base.id), ['picahielos']);
  assert.equal(w.player.weapon, w.player.arsenal[0]);
  assert.equal(w.player.weapon.ammo, WEAPONS['picahielos']!.magazine);
  assert.deepEqual([w.player.x, w.player.y], [x, y]);
  assert.equal(setCharacter(w, 'no-existe'), false);
  assert.equal(w.player.base.def.id, 'batidora-vaso');
  // The run it starts takes it along.
  w.leftHub = true;
  const run = leaveHub(w, 'partida-batidora')!;
  assert.equal(run.player.base.def.id, 'batidora-vaso');
  assert.equal(run.player.hp, 4);
  assert.equal(run.player.weapon.base.id, 'picahielos');
  // On a floor nobody swaps bodies.
  assert.equal(setCharacter(run, 'tostadora'), false);
  assert.equal(run.player.base.def.id, 'batidora-vaso');
});

test('el tablón marca al que está en exposición y dice cómo cambiarlo, y cabe a los dos tamaños', () => {
  const p = { ...unlockedBoth(), chosen: 'batidora-vaso' };
  const shown = exhibited(p);
  const entries: BoardEntry[] = rosterBoard(p).map((r) => ({ ...r, soon: r.unlocked && !CHARACTERS[r.id], shown: r.id === shown }));
  const hint = boardHint(DEFAULT_KEY_WORDS);
  for (const scale of [1, 2]) {
    const L = boardLayout(entries, scale, hint);
    const marks = L.texts.filter((t) => t.role === 'shown');
    assert.ok(marks.length >= 1, `marca a la elegida (×${scale})`);
    assert.ok(marks.every((t) => t.text.includes(BOARD_SHOWN)), `«${BOARD_SHOWN}» (×${scale})`);
    assert.ok(L.texts.some((t) => t.role === 'hint' && t.text === hint), `la tecla para cambiar (×${scale})`);
    for (const t of L.texts) {
      const b = boardTextBox(t, L.size);
      assert.ok(b.left >= L.x && b.right <= L.x + L.w, `«${t.text}» cabe (×${scale})`);
    }
    assert.ok(L.x >= 0 && L.x + L.w <= HUD_W);
  }
  // With only one to play, nothing is marked and the foot is the usual small print.
  const one = boardLayout(rosterBoard(emptyProfile()).map((r) => ({ ...r, shown: false })), 1, boardHint(DEFAULT_KEY_WORDS));
  assert.equal(one.texts.filter((t) => t.role === 'shown' || t.role === 'hint').length, 0);
});
