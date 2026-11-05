// npm run e2e: builds the game, opens it in headless Chromium, plays ~30 s with simulated
// keyboard and mouse, and saves screenshots to capturas/. Fails on page errors or if the game
// does not react to input.
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, requirePackage } from './lib/deps.ts';
import { serve } from './lib/serve.ts';

interface State {
  ready: boolean;
  tick: number;
  x: number;
  y: number;
  ammo: number;
  bullets: number;
  rolling: boolean;
  dummyDamage: number;
  warnings: number;
  charges: number;
  enemyDamage: number;
  fps: number;
  shots: number;
  kills: number;
  coupons: number;
  pickups: number;
  hp: number;
  over: boolean;
  report: string[];
}

interface Page {
  goto(url: string): Promise<unknown>;
  waitForFunction(fn: string, arg?: unknown, opts?: { timeout: number }): Promise<unknown>;
  evaluate<T>(fn: string): Promise<T>;
  screenshot(o: { path: string }): Promise<unknown>;
  keyboard: { down(k: string): Promise<void>; up(k: string): Promise<void>; press(k: string): Promise<void> };
  mouse: { move(x: number, y: number, o?: { steps: number }): Promise<void>; down(): Promise<void>; up(): Promise<void>; wheel(dx: number, dy: number): Promise<void> };
  waitForTimeout(ms: number): Promise<void>;
  on(ev: string, cb: (x: { message?: string; type?: () => string; text?: () => string }) => void): void;
}
interface Browser {
  newPage(o: { viewport: { width: number; height: number } }): Promise<Page>;
  close(): Promise<void>;
}
interface Playwright {
  chromium: { launch(o?: object): Promise<Browser> };
}

const seconds = Number(process.env.E2E_SECONDS ?? 30);
const out = join(ROOT, 'capturas');
mkdirSync(out, { recursive: true });

execSync('node tools/build.ts', { cwd: ROOT, stdio: 'inherit' });
const { chromium } = requirePackage<Playwright>('playwright', 'Instálalo con «npm install -g playwright».');
const { server, url } = await serve(join(ROOT, 'dist'));
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const errors: string[] = [];
let failed = false;
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => errors.push(String(e.message)));
  page.on('console', (m) => {
    if (m.type?.() === 'error') errors.push(m.text?.() ?? '');
  });
  await page.goto(url + '?semilla=e2e&sala=sala-pruebas');
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  // The scripted play is not about surviving: nothing hurts the toaster until the damage test at the end.
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  // The sounds are synthesised in the background before the first click (no stall on it): within
  // a few seconds every effect and song is ready, with no AudioContext yet.
  await page.waitForFunction('(() => { const s = window.__GE__.scene.sound2; return s.buffers.size >= 50 && s.songs.size >= 2 && !s.ctx; })()', undefined, { timeout: 8000 })
    .catch(() => { throw new Error('Los sonidos no se han preparado antes del primer clic'); });
  const state = (): Promise<State> => page.evaluate<State>('window.__GE__.state()');
  // Screen position of a world point.
  const toScreen = (x: number, y: number): Promise<{ x: number; y: number }> =>
    page.evaluate(`(() => {
      const s = window.__GE__.scene; const cam = s.cameras.main; const c = s.game.canvas.getBoundingClientRect();
      const z = c.width / 480; return { x: c.left + (${x} - cam.scrollX) * z, y: c.top + (${y} - cam.scrollY) * z };
    })()`);
  const dummy = (i: number): Promise<{ x: number; y: number }> => page.evaluate(`(() => { const d = window.__GE__.scene.world.dummies[${i}]; return { x: d.x, y: d.y - 16 }; })()`);
  const aimAt = async (wx: number, wy: number): Promise<void> => {
    const p = await toScreen(wx, wy);
    await page.mouse.move(p.x, p.y, { steps: 4 });
  };
  const shot = (name: string): Promise<unknown> => page.screenshot({ path: join(out, name) });
  const tapKeys = async (...keys: string[]): Promise<void> => {
    for (const k of keys) {
      await page.keyboard.press(k);
      await page.waitForTimeout(60);
    }
  };

  /**
   * M9: «Partida nueva» (or ?mostrador) opens the Mostrador de Devoluciones; stepping on its
   * conveyor starts floor 1. Waits for the hub, puts the toaster just under the conveyor, walks
   * onto it and waits for the run's first room.
   */
  const throughHub = async (name?: string): Promise<void> => {
    const inHub = "window.__GE__ && window.__GE__.state().ready && window.__GE__.scene.world.room.kind === 'hub'";
    await page.waitForFunction(`window.__GE_PHASER__.scene.isActive('game') && ${inHub}`, undefined, { timeout: 20000 })
      .catch(() => { throw new Error('«Partida nueva» no lleva al Mostrador'); });
    await page.waitForTimeout(500);
    if (name) await shot(name);
    await page.evaluate(`(() => { const w = window.__GE__.scene.world; const b = w.room.belt; w.player.x = b.x + b.w / 2; w.player.y = b.y + b.h + 12; })()`);
    await page.keyboard.down('w');
    await page.waitForFunction("window.__GE__.scene.world.leftHub || !!window.__GE__.scene.world.floor", undefined, { timeout: 3000 })
      .catch(() => { throw new Error('Pisar la cinta del Mostrador no hace nada'); });
    await page.keyboard.up('w');
    await page.waitForFunction("!!window.__GE__.scene.world.floor && window.__GE__.state().ready", undefined, { timeout: 5000 })
      .catch(() => { throw new Error('La cinta del Mostrador no lleva a la planta 1'); });
  };

  const s0 = await state();
  await shot('01-inicio.png');

  const d0 = await dummy(0);
  await aimAt(d0.x, d0.y);
  await page.keyboard.down('d');
  await page.waitForTimeout(500);
  await shot('02-andando.png');
  await page.waitForTimeout(400);
  await page.keyboard.up('d');
  const s1 = await state();
  if (s1.x <= s0.x + 20) throw new Error(`La tostadora no se ha movido (x ${s0.x} → ${s1.x})`);

  await aimAt(d0.x, d0.y);
  await page.mouse.down();
  await page.waitForTimeout(450);
  await aimAt(d0.x, d0.y);
  await shot('03-disparando.png');
  await page.waitForTimeout(900);
  await page.mouse.up();
  const s2 = await state();
  if (s2.shots === 0) throw new Error('No se ha disparado');
  if (s2.dummyDamage === 0) throw new Error('Ninguna bala ha dado al maniquí');

  // Attack warning: an aimed burst (key 4) blinks, beeps and shows its direction before firing.
  await page.keyboard.press('4');
  await page.waitForTimeout(300);
  await shot('07-aviso.png');
  if ((await state()).warnings === 0) throw new Error('El ataque no ha avisado antes de disparar');
  await page.waitForTimeout(900);

  // Enemy bullet patterns (test room keys 1-5): check they read well on the floor.
  await page.keyboard.press('1');
  await page.waitForTimeout(700);
  await page.keyboard.press('2');
  await page.waitForTimeout(1400);
  await shot('06-patrones.png');

  await page.keyboard.down('s');
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  await shot('04-rodando.png');
  await page.waitForTimeout(400);
  await page.keyboard.up('s');

  // Bombilla de Bajo Consumo and its moth: stand at a distance and wait for the spiral.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const b = w.enemies.find((e) => e.def.id === 'bombilla');
    w.player.x = b.x + 20; w.player.y = b.y + 110; })()`);
  const bulb = await page.evaluate<{ x: number; y: number }>(`(() => { const b = window.__GE__.scene.world.enemies.find((e) => e.def.id === 'bombilla'); return { x: b.x, y: b.y - 20 }; })()`);
  await aimAt(bulb.x, bulb.y);
  const bulbFiring = `(() => { const w = window.__GE__.scene.world; const b = w.enemies.find((e) => e.def.id === 'bombilla');
    return b.state === 'fire' && b.t > 1.7; })()`;
  await page.waitForFunction(bulbFiring, undefined, { timeout: 8000 });
  await shot('08-bombilla.png');

  // Batidora de Mano: let it come close, and catch it winding up for a lunge, already in TURBO.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const m = w.enemies.find((e) => e.def.id === 'batidora');
    m.damageTaken = Math.ceil(m.def.hp * 0.7); w.player.x = m.x - 70; w.player.y = m.y; })()`);
  const mixerWinding = `(() => { const m = window.__GE__.scene.world.enemies.find((e) => e.def.id === 'batidora');
    return !!m && m.state === 'warn' && m.turbo && m.t > m.until * 0.5; })()`;
  await page.waitForFunction(mixerWinding, undefined, { timeout: 6000 });
  await shot('08b-batidora.png');

  // Mandos a Distancia: stand near the group and catch one switching off like an old TV, with the
  // static crackling where it will come back.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const m = w.enemies.find((e) => e.def.id === 'mando');
    if (m) { w.player.x = m.x + 90; w.player.y = m.y - 20; } })()`);
  const remoteBlinking = `(() => { const w = window.__GE__.scene.world;
    return w.enemies.some((e) => e.def.id === 'mando' && (e.state === 'gone' || (e.state === 'blink' && e.t > e.until * 0.4))); })()`;
  await page.waitForFunction(remoteBlinking, undefined, { timeout: 8000 });
  await shot('08c-mando.png');
  await page.waitForTimeout(600);

  // Taking an enemy apart: the microwave, already worn down, shot from close; then pick up its coupons.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const m = w.enemies.find((e) => e.def.id === 'microondas');
    m.damageTaken = m.def.hp - 3; w.player.x = m.x + 60; w.player.y = m.y + 6; w.player.weapon.ammo = w.player.weapon.def.magazine; w.player.weapon.reload = 0; })()`);
  const mw = await page.evaluate<{ x: number; y: number }>(`(() => { const m = window.__GE__.scene.world.enemies.find((e) => e.def.id === 'microondas'); return { x: m.x, y: m.y - 14 }; })()`);
  // Let the camera settle on the new spot, then keep the crosshair on it while firing.
  await page.waitForTimeout(700);
  await aimAt(mw.x, mw.y);
  await page.mouse.down();
  for (let i = 0; i < 25 && (await state()).kills === 0; i++) {
    await aimAt(mw.x, mw.y);
    await page.waitForTimeout(100);
  }
  await page.mouse.up();
  if ((await state()).kills === 0) {
    await shot('error-desmontaje.png');
    const dbg = await page.evaluate<string>(`(() => { const w = window.__GE__.scene.world; const m = w.enemies.find((e) => e.def.id === 'microondas');
      return JSON.stringify({ m: m && { x: m.x, y: m.y, dmg: m.damageTaken }, p: { x: w.player.x, y: w.player.y, aim: w.player.aim, ammo: w.player.weapon.ammo } }); })()`);
    throw new Error('El microondas no se ha desmontado: ' + dbg);
  }
  await page.waitForTimeout(160);
  await shot('09-desmontaje.png');
  // No damage numbers and no stamp over the dead (nota del humano del 2026-10-30).
  const floating = await page.evaluate<string[]>('window.__GE__.scene.floats.map((f) => f.t.text)');
  if (floating.length > 0) throw new Error(`Hay textos flotando al disparar y matar: ${JSON.stringify(floating)}`);
  await page.waitForTimeout(700);
  await shot('10-cupones.png');
  const sk = await state();
  if (sk.pickups === 0 && sk.coupons === 0) {
    // The loot roll can give nothing only for enemies whose range starts at 0: the microwave always drops some.
    throw new Error('El microondas no ha soltado cupones');
  }
  // Put them next to the toaster, still (they may be sliding from the drop) and ready to be picked up.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; for (const k of w.pickups) { k.x = w.player.x + 12; k.y = w.player.y; k.vx = 0; k.vy = 0; k.age = Math.max(k.age, 1); } })()`);
  await page.waitForFunction('window.__GE__.state().coupons > 0', undefined, { timeout: 2500 }).catch(() => undefined);
  if ((await state()).coupons === 0) throw new Error('La tostadora no ha recogido los cupones');

  // Free play for the rest of the time: strafe around shooting at both dummies.
  const keys = ['w', 'a', 's', 'd'];
  const t0 = Date.now();
  let k = 0;
  while (Date.now() - t0 < Math.max(0, seconds - 5) * 1000) {
    const key = keys[k % 4]!;
    const d = await dummy(k % 2);
    await aimAt(d.x, d.y);
    await page.keyboard.down(key);
    await page.mouse.down();
    await page.waitForTimeout(700);
    if (k % 3 === 0) await page.keyboard.press('Space');
    await page.mouse.up();
    await page.keyboard.up(key);
    k++;
  }
  // Gamepad: a fake pad through the Gamepad API (standard mapping). Reload first, so the trigger
  // test does not land on an empty magazine.
  await page.keyboard.press('r');
  await page.waitForTimeout(1300);
  await page.evaluate(`(() => {
    const pad = { id: 'mando-falso', index: 0, connected: true, mapping: 'standard', timestamp: 0,
      axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    window.__PAD__ = pad;
    navigator.getGamepads = () => [pad];
  })()`);
  // In the middle of the empty row 3, so no box or enemy against its side can hold it back.
  await page.evaluate(`(() => { const p = window.__GE__.scene.world.player; p.x = 240; p.y = 3 * 24 + 12; p.vx = 0; p.vy = 0; })()`);
  const sp0 = await state();
  await page.evaluate(`(() => { const p = window.__PAD__; p.axes[0] = -1; p.axes[2] = -1; p.buttons[7].pressed = true; })()`);
  await page.waitForTimeout(700);
  await page.evaluate(`(() => { const p = window.__PAD__; p.axes[0] = 0; p.axes[2] = 0; p.buttons[7].pressed = false; })()`);
  const sp1 = await state();
  if (sp1.x >= sp0.x - 10) throw new Error(`El mando no mueve a la tostadora (x ${sp0.x} → ${sp1.x})`);
  if (sp1.shots <= sp0.shots) throw new Error('El gatillo del mando no dispara');
  await page.evaluate(`(() => { navigator.getGamepads = () => []; })()`);
  await page.mouse.move(10, 10);

  const d1 = await dummy(1);
  await aimAt(d1.x, d1.y);
  await page.mouse.down();
  await page.waitForTimeout(300);
  await shot('05-final.png');
  await page.mouse.up();
  const s3 = await state();
  console.log(
    `e2e: ${s3.tick} ticks, ${s3.shots} disparos, ${s3.dummyDamage} de daño al maniquí, ${s3.enemyDamage} a los enemigos, ` +
      `${s3.charges} embestidas, ${s3.kills} bajas, ${s3.coupons} cupones, ~${Math.round(s3.fps)} fps.`,
  );
  if (s3.charges === 0) throw new Error('El aspirador no ha embestido en toda la partida');
  if (s3.tick < 60 * seconds * 0.5) throw new Error(`La simulación va lenta: ${s3.tick} ticks en ${seconds} s`);

  // Damage: an enemy bullet at the toaster takes half a heart and leaves it blinking.
  // (From the left, or from the right if a box stands in the way on the left: it would stop it.)
  const bulletAt = (dx: number): string => `(() => { const w = window.__GE__.scene.world; const p = w.player; const y = p.y - 9;
    const blocked = (x0, x1) => w.room.props.some((pr) => pr.box.y <= y && y <= pr.box.y + pr.box.h && pr.box.x < Math.max(x0, x1) && pr.box.x + pr.box.w > Math.min(x0, x1));
    const s = blocked(p.x - ${dx}, p.x) ? -1 : 1;
    w.bullets.push({ id: w.nextId++, owner: 'enemy', x: p.x - s * ${dx}, y, vx: 140 * s, vy: 0, r: 2.5, life: 3, damage: 1, knockback: 0,
      color: 'red', age: 0, dir: s > 0 ? 0 : Math.PI, speed: 140, by: 'microondas' }); })()`;
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = false; w.player.invulnerable = 0; w.player.rollT = -1; })()`);
  const hp0 = (await state()).hp;
  await page.evaluate(bulletAt(24));
  await page.waitForTimeout(260);
  await shot('11-herida.png');
  const sh = await state();
  if (sh.hp !== hp0 - 1) throw new Error(`Una bala enemiga no quita medio corazón (${hp0} → ${sh.hp})`);
  // The Garantía Provisional (M9b 12a): one drops at its feet, it is picked up (paper heart after
  // the hearts in the HUD) and the next bullet takes it instead of the life.
  await page.waitForTimeout(1300);
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; const p = w.player; w.noDamage = true;
    g.dropShield(p.x + 14, p.y); })()`);
  await page.waitForTimeout(250);
  await shot('11b-garantia-en-el-suelo.png');
  await page.evaluate(`(() => { const p = window.__GE__.scene.world.player; const k = window.__GE__.scene.world.pickups.find((q) => q.kind === 'garantia'); p.x = k.x; p.y = k.y; })()`);
  await page.waitForTimeout(400);
  await shot('11c-garantia-cogida.png');
  const shield = await page.evaluate<number>('window.__GE__.scene.world.player.shield');
  if (shield !== 2) throw new Error(`La garantía provisional no se coge (${shield})`);
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = false; w.player.invulnerable = 0; w.player.rollT = -1; })()`);
  const hpBefore = (await state()).hp;
  await page.evaluate(bulletAt(24));
  await page.waitForTimeout(260);
  await shot('11d-garantia-cubre.png');
  const after = await page.evaluate<{ hp: number; shield: number }>('({ hp: window.__GE__.scene.world.player.hp, shield: window.__GE__.scene.world.player.shield })');
  if (after.hp !== hpBefore || after.shield !== 1) throw new Error(`La garantía no cubre el golpe (vida ${hpBefore} → ${after.hp}, garantía ${after.shield})`);
  // The special hearts (M9b 12b): a turbo and a surge heart drop, both are picked up (the HUD shows
  // the surge heart, the warranty and the turbo after the hearts), the shots come out orange, and a
  // bullet breaks the surge heart: a bolt to every enemy in the room.
  await page.waitForTimeout(1300);
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; const p = w.player; w.noDamage = true;
    g.dropHeart(p.x + 16, p.y - 4, 'turbo'); g.dropHeart(p.x + 34, p.y + 4, 'sobretension'); })()`);
  await page.waitForTimeout(300);
  await shot('11e-corazones-especiales.png');
  for (const kind of ['turbo', 'sobretension']) {
    await page.evaluate(`(() => { const w = window.__GE__.scene.world; const p = w.player; const k = w.pickups.find((q) => q.kind === '${kind}'); if (k) { p.x = k.x; p.y = k.y; } })()`);
    await page.waitForTimeout(350);
  }
  const loans = await page.evaluate<{ surge: number; turbo: boolean }>('({ surge: window.__GE__.scene.world.player.surge, turbo: window.__GE__.scene.world.player.turbo })');
  if (loans.surge !== 2 || !loans.turbo) throw new Error(`Los corazones especiales no se cogen (${JSON.stringify(loans)})`);
  {
    const p = await state();
    await aimAt(p.x + 120, p.y - 30);
  }
  await page.mouse.down();
  await page.waitForTimeout(160);
  await shot('11f-modo-turbo.png');
  await page.mouse.up();
  await page.evaluate(`(() => { const g = window.__GE__; const p = g.scene.world.player;
    g.spawnIdle('polilla', p.x + 70, p.y - 50); g.spawnIdle('aspirador', p.x + 110, p.y + 30); g.spawnIdle('mando', p.x - 60, p.y + 40); })()`);
  await page.waitForTimeout(500);
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = false; w.player.invulnerable = 0; w.player.rollT = -1; w.player.surge = 1; })()`);
  const hpSurge = (await state()).hp;
  await page.evaluate(bulletAt(24));
  await page.waitForFunction('window.__GE__.scene.world.player.surge === 0', undefined, { timeout: 3000 });
  await page.waitForTimeout(60);
  await shot('11g-sobretension.png');
  const zapped = await page.evaluate<{ hp: number; hit: number }>('({ hp: window.__GE__.scene.world.player.hp, hit: window.__GE__.scene.world.enemies.filter((e) => e.damageTaken > 0).length })');
  if (zapped.hp !== hpSurge || zapped.hit < 1) throw new Error(`La sobretensión no descarga (vida ${hpSurge} → ${zapped.hp}, tocados ${zapped.hit})`);
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; for (const en of w.enemies) en.damageTaken = en.def.hp; w.player.turbo = false; w.player.shield = 0; })()`);
  // A drum of used oil (M9b 13a): battered (it smokes), lit (it blinks) and blown up (fireball,
  // scorch mark, and it is gone from the room).
  const drumAt = await page.evaluate<{ x: number; y: number } | null>(`(() => { const w = window.__GE__.scene.world; w.noDamage = true;
    w.bullets = w.bullets.filter((b) => b.owner !== 'enemy');
    const mid = (pr) => Math.hypot(pr.x - w.room.w / 2, pr.y - w.room.h / 2);
    const d = w.room.props.filter((pr) => pr.def.id === 'barril').sort((a, b) => mid(a) - mid(b))[0]; if (!d) return null;
    w.player.x = d.x - 60; w.player.y = d.y + 20; d.damage = d.def.hp - 1; return { x: d.x, y: d.y }; })()`);
  if (drumAt) {
    await page.waitForTimeout(700);
    await shot('11h-bidon-tocado.png');
    await page.evaluate(`(() => { const d = window.__GE__.scene.world.room.props.find((pr) => pr.def.id === 'barril' && pr.x === ${drumAt.x} && pr.y === ${drumAt.y}); d.fuse = 0.3; })()`);
    await page.waitForTimeout(150);
    await shot('11i-bidon-encendido.png');
    await page.waitForFunction(`!window.__GE__.scene.world.room.props.some((pr) => pr.x === ${drumAt.x} && pr.y === ${drumAt.y})`, undefined, { timeout: 2000 });
    await page.waitForTimeout(60);
    await shot('11j-bidon-explota.png');
    await page.waitForTimeout(900);
    await shot('11k-bidon-quemado.png');
    await page.evaluate(`(() => { window.__GE__.scene.world.noDamage = false; })()`);
  } else throw new Error('La Sala de Pruebas no tiene bidón');
  // A bargain table (M9b 13b): «F: Volcar» next to it, over it goes away from the toaster, it stops
  // the bullets that come at its top, and shot to bits it breaks.
  await page.waitForTimeout(600);
  const tableAt = await page.evaluate<{ x: number; y: number } | null>(`(() => { const w = window.__GE__.scene.world; w.noDamage = true;
    const t = w.room.props.find((pr) => pr.def.id === 'mesa' && !pr.tipped); if (!t) return null;
    for (const en of w.enemies) en.damageTaken = en.def.hp;
    // A little to one side, so the toaster does not hide it from the camera.
    w.player.x = t.x - 18; w.player.y = t.box.y + t.box.h + 8; return { x: t.x, y: t.y }; })()`);
  if (!tableAt) throw new Error('La Sala de Pruebas no tiene mesa');
  await page.waitForTimeout(400);
  await shot('11l-mesa-de-pie.png');
  await page.keyboard.press('f');
  await page.waitForTimeout(70);
  await shot('11m-mesa-volcando.png');
  const tipped = await page.evaluate<string | null>(`window.__GE__.scene.world.room.props.find((pr) => pr.x === ${tableAt.x} && pr.y === ${tableAt.y})?.tipped ?? null`);
  if (tipped !== 'N') throw new Error(`La mesa no se vuelca hacia el norte (${tipped})`);
  await page.evaluate(`(() => { const w = window.__GE__.scene.world;
    for (let i = 0; i < 5; i++) w.bullets.push({ id: w.nextId++, owner: 'enemy', x: ${tableAt.x} - 10 + i * 5, y: ${tableAt.y} - 40 - i * 5, vx: 0, vy: 150, r: 2.5,
      life: 3, damage: 1, knockback: 0, color: 'red', age: 0, dir: Math.PI / 2, speed: 150, h: 0, by: 'microondas' }); })()`);
  await page.waitForTimeout(240);
  await shot('11n-mesa-cubre.png');
  await page.waitForTimeout(250);
  const wear = await page.evaluate<number>(`window.__GE__.scene.world.room.props.find((pr) => pr.x === ${tableAt.x} && pr.y === ${tableAt.y})?.damage ?? 0`);
  if (wear < 3) throw new Error(`La mesa volcada no para las balas (${wear})`);
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const t = w.room.props.find((pr) => pr.x === ${tableAt.x} && pr.y === ${tableAt.y});
    t.damage = t.def.tip.hp - 1; w.bullets.push({ id: w.nextId++, owner: 'enemy', x: t.x, y: t.y - 60, vx: 0, vy: 150, r: 2.5,
      life: 3, damage: 1, knockback: 0, color: 'red', age: 0, dir: Math.PI / 2, speed: 150, h: 0, by: 'microondas' }); })()`);
  await page.waitForFunction(`!window.__GE__.scene.world.room.props.some((pr) => pr.x === ${tableAt.x} && pr.y === ${tableAt.y})`, undefined, { timeout: 2000 });
  await page.waitForTimeout(90);
  await shot('11o-mesa-rota.png');
  await page.evaluate(`(() => { window.__GE__.scene.world.noDamage = false; })()`);
  // Down: with half a heart left, one more bullet ends it. The toaster comes apart (slices,
  // spring, screws), the sick-leave report drops in with its stamp, and R asks for a new unit.
  await page.waitForTimeout(1300);
  await page.evaluate(`(() => { const p = window.__GE__.scene.world.player; p.hp = 1; p.invulnerable = 0; })()`);
  await page.evaluate(bulletAt(24));
  await page.waitForFunction('window.__GE__.state().over', undefined, { timeout: 3000 });
  await page.waitForTimeout(950);
  await shot('12-desmontaje.png');
  await page.waitForTimeout(2000);
  await shot('13-parte-de-baja.png');
  const rep = (await state()).report;
  if (!rep.some((l) => l.startsWith('Causa: ')) || !rep.some((l) => l.startsWith('Recomendación del fabricante: ')))
    throw new Error(`El parte de baja no trae causa o recomendación: ${JSON.stringify(rep)}`);
  console.log(`Parte de baja: ${rep.join(' | ')}`);
  await page.keyboard.press('r');
  await page.waitForFunction('!window.__GE__.state().over && window.__GE__.state().tick < 120', undefined, { timeout: 4000 });

  // Floor room templates (M3), slots filled for a deep room: they load, nothing breaks, and they read.
  for (const [i, sala] of ['carga-descarga', 'archivo-tickets', 'camara-garantias'].entries()) {
    await page.goto(`${url}?semilla=e2e-${sala}&sala=${sala}&profundidad=5`);
    await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
    await page.evaluate('window.__GE__.scene.world.noDamage = true');
    await page.waitForTimeout(1600);
    await shot(`14${'abc'[i]}-sala-${sala}.png`);
    const n = await page.evaluate<number>('window.__GE__.scene.world.enemies.length');
    if (n === 0) throw new Error(`La sala ${sala} no tiene enemigos`);
    if (!(await page.evaluate<boolean>('window.__GE__.scene.world.doorsShut'))) throw new Error(`La sala ${sala} no cierra las persianas`);
  }
  // Clearing the last room rolls its shutters up.
  await page.evaluate('window.__GE__.scene.world.enemies.forEach((e) => { e.damageTaken = e.def.hp; })');
  await page.waitForTimeout(250);
  await shot('15a-persianas-subiendo.png');
  await page.waitForTimeout(900);
  await shot('15b-persianas-abiertas.png');
  if (await page.evaluate<boolean>('window.__GE__.scene.world.doorsShut')) throw new Error('Las persianas no se abren al vaciar la sala');

  // M8: floor 2 (Informática) has its own tiles, colour and rooms (its special rooms too).
  const p2 = ['sala=carga-descarga&profundidad=5', 'semilla=e2e-planta', 'sala=jefe-informatica', 'sala=tesoro-informatica', 'sala=tienda-informatica', 'sala=secreta-informatica'];
  for (const [i, q] of p2.entries()) {
    await page.goto(`${url}?semilla=e2e-p2-${i}&${q}&planta=2`);
    await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
    await page.evaluate('window.__GE__.scene.world.noDamage = true');
    if ((await page.evaluate<number>('window.__GE__.scene.world.level')) !== 2) throw new Error(`?planta=2 no pone la planta 2 (${q})`);
    await page.waitForTimeout(i === 2 ? 4200 : 1600);
    await shot(`33${'abcdef'[i]}-planta2-${['sala', 'entrada', 'jefe', 'tesoro', 'tienda', 'secreta'][i]}.png`);
  }

  // M10 (1, 2): floor 3 (Juguetería) has its own tiles, colour, obstacles, shutters and rooms.
  const p3 = ['sala=circuito-ocasion&profundidad=5', 'sala=entrada-jugueteria', 'sala=sala-pruebas', 'sala=jefe-jugueteria', 'sala=tienda-jugueteria', 'sala=secreta-jugueteria'];
  for (const [i, q] of p3.entries()) {
    await page.goto(`${url}?semilla=e2e-p3-${i}&${q}&planta=3`);
    await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
    await page.evaluate('window.__GE__.scene.world.noDamage = true');
    if ((await page.evaluate<number>('window.__GE__.scene.world.level')) !== 3) throw new Error(`?planta=3 no pone la planta 3 (${q})`);
    await page.waitForTimeout(i === 3 ? 4200 : 1600);
    await shot(`37${'abcdef'[i]}-planta3-${['sala', 'entrada', 'pruebas', 'jefe', 'tienda', 'secreta'][i]}.png`);
  }

  // M10 planta 4 (1, 2a, 2b): floor 4 (Oficinas) has its own tiles, colour, obstacles, shutters and
  // combat rooms; (2c) its own special rooms (the Muñeco fights in the Sala de Juntas until the Director, M10 planta 4 (5)).
  const p4 = ['sala=open-space&profundidad=5', 'sala=entrada-oficinas', 'sala=jefe-oficinas', 'sala=tienda-oficinas', 'sala=secreta-oficinas',
    'sala=reunion-correo&profundidad=5', 'sala=office-nevera&profundidad=5', 'sala=planta-diafana&profundidad=6',
    // (2b): six more combat rooms.
    'sala=hilera-cubiculos&profundidad=5', 'sala=curso-prevencion&profundidad=5', 'sala=comedor-empresa&profundidad=5',
    'sala=recursos-humanos&profundidad=5', 'sala=cabinas-concentracion&profundidad=5', 'sala=hot-desking&profundidad=6',
    // (2c): the stationery cupboard (the other four specials are above).
    'sala=tesoro-oficinas'];
  for (const [i, q] of p4.entries()) {
    await page.goto(`${url}?semilla=e2e-p4-${i}&${q}&planta=4`);
    await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
    await page.evaluate('window.__GE__.scene.world.noDamage = true');
    if ((await page.evaluate<number>('window.__GE__.scene.world.level')) !== 4) throw new Error(`?planta=4 no pone la planta 4 (${q})`);
    await page.waitForTimeout(i === 2 ? 4200 : 1600);
    const names = ['sala', 'entrada', 'jefe', 'tienda', 'secreta', 'reunion', 'office', 'reforma', 'cubiculos', 'formacion', 'comedor', 'rrhh', 'cabinas', 'compartidos', 'tesoro'];
    await shot(`50${'abcdefghijklmno'[i]}-planta4-${names[i]}.png`);
  }

  // M8: floors in a row. A floor won (here, a lift under the toaster's feet at the entrance) and
  // R: the run goes on in floor 2 with the same toaster, coupons and all.
  await page.goto(`${url}?semilla=e2e-cadena`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = true; w.player.coupons = 37; w.lift = { x: w.player.x, y: w.player.y, t: 10 }; })()`);
  await page.waitForFunction('window.__GE__.state().won && window.__GE__.state().report.length > 0', undefined, { timeout: 8000 });
  await page.waitForTimeout(900);
  const chainReport = (await state()).report.join(' | ');
  if (!chainReport.includes('Informática')) throw new Error(`El parte no anuncia la planta 2: ${chainReport}`);
  await shot('34a-cadena-parte.png');
  await page.waitForTimeout(400);
  await page.keyboard.press('r');
  await page.waitForFunction('window.__GE__.state().ready && !window.__GE__.state().won && window.__GE__.scene.world.level === 2', undefined, { timeout: 8000 });
  const chain = await page.evaluate<{ coupons: number; kind: string }>('(() => { const w = window.__GE__.scene.world; return { coupons: w.player.coupons, kind: w.room.kind }; })()');
  if (chain.coupons !== 37 || chain.kind !== 'start') throw new Error(`La planta 2 no sigue con la misma tostadora: ${JSON.stringify(chain)}`);
  await page.waitForTimeout(600);
  await shot('34b-cadena-planta2.png');
  // And from floor 2 up to the Juguetería (M10 3), the same way.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = true; w.lift = { x: w.player.x, y: w.player.y, t: 10 }; })()`);
  await page.waitForFunction('window.__GE__.state().won && window.__GE__.state().report.length > 0', undefined, { timeout: 8000 });
  await page.waitForTimeout(900);
  const chainReport3 = (await state()).report.join(' | ');
  if (!chainReport3.includes('Juguetería')) throw new Error(`El parte no anuncia la planta 3: ${chainReport3}`);
  await page.waitForTimeout(400);
  await page.keyboard.press('r');
  await page.waitForFunction('window.__GE__.state().ready && !window.__GE__.state().won && window.__GE__.scene.world.level === 3', undefined, { timeout: 8000 });
  const chain3 = await page.evaluate<{ coupons: number; kind: string }>('(() => { const w = window.__GE__.scene.world; return { coupons: w.player.coupons, kind: w.room.kind }; })()');
  if (chain3.coupons !== 37 || chain3.kind !== 'start') throw new Error(`La planta 3 no sigue con la misma tostadora: ${JSON.stringify(chain3)}`);
  await page.waitForTimeout(600);
  await shot('34c-cadena-planta3.png');
  // And from the Juguetería up to the Oficinas (M10 planta 4 (3)).
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = true; w.lift = { x: w.player.x, y: w.player.y, t: 10 }; })()`);
  await page.waitForFunction('window.__GE__.state().won && window.__GE__.state().report.length > 0', undefined, { timeout: 8000 });
  await page.waitForTimeout(900);
  const chainReport4 = (await state()).report.join(' | ');
  if (!chainReport4.includes('Oficinas')) throw new Error(`El parte no anuncia la planta 4: ${chainReport4}`);
  await shot('34d-parte-planta3.png');
  await page.waitForTimeout(400);
  await page.keyboard.press('r');
  await page.waitForFunction('window.__GE__.state().ready && !window.__GE__.state().won && window.__GE__.scene.world.level === 4', undefined, { timeout: 8000 });
  const chain4 = await page.evaluate<{ coupons: number; kind: string }>('(() => { const w = window.__GE__.scene.world; return { coupons: w.player.coupons, kind: w.room.kind }; })()');
  if (chain4.coupons !== 37 || chain4.kind !== 'start') throw new Error(`La planta 4 no sigue con la misma tostadora: ${JSON.stringify(chain4)}`);
  await page.waitForTimeout(600);
  await shot('34e-cadena-planta4.png');
  console.log('Plantas encadenadas: de la 1 a la 4, una tras otra, con la misma tostadora.');

  // M8: floor 2's own passive items, on a treasure pedestal and in the inventory.
  await page.goto(`${url}?semilla=e2e-objetos2&sala=tesoro&planta=2`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  await page.waitForTimeout(1400);
  await shot('35a-planta2-tesoro.png');
  await page.evaluate(`(() => { const g = window.__GE__; for (const id of ['usb', 'antivirus', 'hdmi', 'ventilador', 'actualizacion']) g.giveItem(id); })()`);
  const own2 = await page.evaluate<number>("window.__GE__.scene.world.player.items.filter((id) => ['usb', 'antivirus', 'hdmi', 'ventilador', 'actualizacion'].includes(id)).length");
  if (own2 !== 5) throw new Error(`Faltan objetos de la planta 2 en la tostadora (${own2} de 5)`);
  await page.waitForTimeout(300);
  await tapKeys('Escape', 'ArrowDown', 'Enter');
  await page.waitForTimeout(200);
  await shot('35b-planta2-inventario.png');
  await tapKeys('Escape', 'Escape');
  await page.waitForFunction('!window.__GE__.scene.scene.isPaused()', undefined, { timeout: 3000 });
  // The gaming mouse: a critical hit on a dummy (every shot a critical, for the picture).
  await page.goto(`${url}?semilla=e2e-critico&sala=sala-pruebas&planta=2`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; w.enemies = [];
    for (const id of ['raton', 'bateria', 'cookies', 'avion', 'copia']) g.giveItem(id); w.player.weapon.def.bullets = { crit: { chance: 1, mul: 2 } };
    const d = w.dummies[0]; w.player.x = d.x - 80; w.player.y = d.y; })()`);
  await page.waitForTimeout(500);
  const dc = await dummy(0);
  await aimAt(dc.x, dc.y);
  await page.mouse.down();
  await page.waitForTimeout(450);
  await aimAt(dc.x, dc.y);
  await shot('35c-critico.png');
  await page.mouse.up();
  const crit = await page.evaluate<number>('window.__GE__.scene.world.dummies[0].damageTaken');
  // A critical Secador shot is 1.6 × 2.
  if (crit < 3) throw new Error(`El Ratón Gaming no hace críticos (${crit} de daño)`);
  // The backup: half a heart left and a bullet in the face; it comes back instead of going down.
  await page.waitForTimeout(700);
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = false; w.player.hp = 1; w.player.invulnerable = 0; })()`);
  await page.evaluate(bulletAt(24));
  await page.waitForFunction("window.__GE__.scene.world.player.hp === 2 && !window.__GE__.scene.world.player.items.includes('copia')", undefined, { timeout: 3000 });
  await page.waitForTimeout(350);
  await shot('35d-copia.png');
  if (await page.evaluate<boolean>('window.__GE__.state().over')) throw new Error('La Copia de Seguridad no ha evitado la baja');
  console.log('Planta 2: sus objetos pasivos, en el tesoro y en el inventario; el doble clic del ratón y la copia de seguridad.');

  // M10 (6a): floor 3's first five passive items in the inventory, and the empty box shrugging a hit off.
  const own3 = ['pilas-no-incluidas', 'muelle', 'purpurina', 'menu-infantil', 'caja-vacia'];
  await page.goto(`${url}?semilla=e2e-objetos3&sala=sala-pruebas&planta=3`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; w.enemies = [];
    for (const id of ${JSON.stringify(own3)}) g.giveItem(id); })()`);
  await page.waitForTimeout(300);
  await tapKeys('Escape', 'ArrowDown', 'Enter');
  await page.waitForTimeout(200);
  await shot('39a-planta3-inventario.png');
  await tapKeys('Escape', 'Escape');
  await page.waitForFunction('!window.__GE__.scene.scene.isPaused()', undefined, { timeout: 3000 });
  let shrugged = false;
  for (let i = 0; i < 25 && !shrugged; i++) {
    await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = false; w.player.hp = w.player.def.maxHp; w.player.invulnerable = 0; w.player.rollT = -1; })()`);
    await page.evaluate(bulletAt(24));
    await page.waitForTimeout(200);
    shrugged = await page.evaluate<boolean>('(() => { const w = window.__GE__.scene.world; return w.player.hp === w.player.def.maxHp && w.player.invulnerable > 0; })()');
  }
  if (!shrugged) throw new Error('La Caja de Cartón Vacía no ha parado ni un golpe en 25');
  await shot('39b-era-solo-la-caja.png');
  // M10 (6b1): the vibrating pad shakes a ring of bullets out of the toaster when it is hit
  // (the box taken away, so the hit lands).
  await page.waitForTimeout(1200);
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; g.giveItem('mando-vibracion');
    w.player.mods = w.player.mods.filter((m) => m.id !== 'caja-vacia'); w.player.hp = w.player.def.maxHp; w.player.invulnerable = 0; })()`);
  await page.evaluate(bulletAt(24));
  await page.waitForFunction("window.__GE__.scene.world.bullets.filter((b) => b.owner === 'player').length >= 10", undefined, { timeout: 3000 });
  await page.waitForTimeout(260);
  await shot('39c-mando-vibracion.png');
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  console.log('Planta 3: sus cinco primeros objetos en el inventario, «Era solo la caja» y el corro del mando con vibración.');

  // M10 (6b2): mixed plasticine and glitter (Manualidades): the bullets stick to the wall in
  // glittery blobs. Then the virtual pet is fed when the test room is emptied.
  await page.goto(`${url}?semilla=e2e-plastilina&sala=sala-pruebas&planta=3`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; w.enemies = [];
    for (const id of ['plastilina', 'purpurina', 'mascota-virtual']) g.giveItem(id); w.player.x = 110; w.player.y = 200; })()`);
  await page.waitForTimeout(1600);
  await page.mouse.down();
  for (const y of [110, 160, 210, 260, 310]) {
    await aimAt(0, y);
    await page.waitForTimeout(260);
  }
  await page.mouse.up();
  await page.waitForTimeout(150);
  const stuck = await page.evaluate<number>("window.__GE__.scene.world.bullets.filter((b) => b.stuck).length");
  if (stuck < 2) throw new Error(`La Plastilina Mezclada no deja pegotes (${stuck})`);
  if (!(await page.evaluate<boolean>("window.__GE__.scene.world.player.synergies.includes('manualidades')"))) throw new Error('No salta la sinergia Manualidades');
  await shot('39d-plastilina.png');
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.player.petHurt = false; w.emptyT = w.room.restock - 0.05; })()`);
  await page.waitForFunction('(window.__GE__.scene.world.player.pet ?? 0) === 1', undefined, { timeout: 3000 });
  await page.waitForTimeout(350);
  await shot('39e-mascota.png');
  console.log('Planta 3: los pegotes de plastilina con purpurina (Manualidades) y la mascota virtual alimentada.');

  // M10 planta 4 (6a): floor 4's first five passive items in the inventory, then the mug lost at the first hit.
  const own4 = ['taza-empleado', 'corbata-lunes', 'cafe-maquina', 'silla-ruedas', 'bola-antiestres'];
  await page.goto(`${url}?semilla=e2e-objetos4&sala=sala-pruebas&planta=4`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; w.enemies = [];
    for (const id of ${JSON.stringify(own4)}) g.giveItem(id); })()`);
  await page.waitForTimeout(300);
  await tapKeys('Escape', 'ArrowDown', 'Enter');
  await page.waitForTimeout(200);
  await shot('51a-planta4-inventario.png');
  await tapKeys('Escape', 'Escape');
  await page.waitForFunction('!window.__GE__.scene.scene.isPaused()', undefined, { timeout: 3000 });
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = false; w.player.hp = w.player.def.maxHp; w.player.invulnerable = 0; w.player.rollT = -1; })()`);
  await page.evaluate(bulletAt(24));
  await page.waitForFunction('(() => { const w = window.__GE__.scene.world; return w.player.hp < w.player.def.maxHp; })()', undefined, { timeout: 3000 });
  await page.waitForTimeout(250);
  await shot('51b-taza-perdida.png');
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  console.log('Planta 4: sus cinco primeros objetos en el inventario, y la taza perdida al primer golpe.');

  // M10 planta 4 (6b1): the Economato with the visitor's pass: every price a quarter off.
  await page.goto(`${url}?semilla=e2e-acreditacion&sala=tienda&planta=4`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; w.player.coupons = 12;
    g.giveItem('acreditacion'); const k = w.pickups.find((q) => q.kind === 'ticket' && q.price !== undefined); w.player.x = k.x; w.player.y = k.y + 16; })()`);
  await page.waitForTimeout(900);
  const priceShown = await page.evaluate<string>(`(() => { const s = window.__GE__.scene;
    const k = s.world.pickups.find((q) => q.kind === 'ticket' && q.price !== undefined); return s.pickupSprites.get(k.id).price.text; })()`);
  if (priceShown !== '8') throw new Error(`Con la Acreditación el ticket debería costar 8 y pone ${priceShown}`);
  await shot('51c-acreditacion-tienda.png');
  console.log('Planta 4: la Acreditación de Visitante rebaja los precios del Economato.');

  // M8: the printer of floor 2. Invoices in the air, then a jam («Atasco de papel»).
  // (The seeds pick rooms with the enemy in them; the others are taken out, so only it is in the picture.)
  await page.goto(`${url}?semilla=e2e-impresora-12&sala=taller-expres&planta=2`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate("(() => { const w = window.__GE__.scene.world; w.noDamage = true; w.enemies = w.enemies.filter((e) => e.def.id === 'impresora'); })()");
  if (!(await page.evaluate<boolean>('window.__GE__.scene.world.enemies.length > 0'))) throw new Error('No hay impresora en la sala de la prueba');
  await page.waitForFunction("window.__GE__.scene.world.bullets.some((b) => b.color === 'invoice')", undefined, { timeout: 12000 });
  await page.waitForTimeout(250);
  await shot('35e-impresora.png');
  await page.waitForFunction("window.__GE__.scene.world.enemies.some((e) => e.state === 'jam' && e.t > 0.15)", undefined, { timeout: 25000 });
  await shot('35f-impresora-atasco.png');
  console.log('Impresora: facturas al vuelo y un atasco de papel.');

  // M8: the fake chargers: lying as bait, then jumping up and giving a shock.
  await page.goto(`${url}?semilla=e2e-cargador-2&sala=taller-expres&planta=2`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  // Only the chargers, and the toaster near them (but not near enough to wake them), so the camera shows them.
  // Left on their own they would jump up at once (M9b): they are told to be patient for this test.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = true; w.enemies = w.enemies.filter((e) => e.def.id === 'cargador');
    for (const e of w.enemies) { e.until = 60; e.phase = -60; }
    const c = w.enemies[0]; w.player.x = c.x - 110; w.player.y = c.y + 30; })()`);
  await page.waitForTimeout(1200);
  if (!(await page.evaluate<boolean>("window.__GE__.scene.world.enemies.every((e) => e.state === 'lurk')"))) throw new Error('Los cargadores no esperan tirados en el suelo');
  await shot('35g-cargador-cebo.png');
  await page.evaluate("(() => { const w = window.__GE__.scene.world; const c = w.enemies[0]; w.player.x = c.x - 52; w.player.y = c.y; w.player.vx = 0; w.player.vy = 0; })()");
  await page.waitForFunction("window.__GE__.scene.world.enemies.some((e) => e.state === 'reveal')", undefined, { timeout: 3000 });
  await page.waitForTimeout(200);
  await shot('35h-cargador-descubierto.png');
  await page.waitForFunction("window.__GE__.scene.world.bullets.some((b) => b.owner === 'enemy' && b.color === 'cyan')", undefined, { timeout: 8000 });
  await page.waitForTimeout(120);
  await shot('35i-cargador-calambre.png');
  console.log('Cargador Falso: de cebo en el suelo a calambre.');

  // M8: the wireless mouse: frozen without signal, the spot where it will turn up marked.
  await page.goto(`${url}?semilla=e2e-raton-6&sala=taller-expres&planta=2`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = true; w.enemies = w.enemies.filter((e) => e.def.id === 'raton-inalambrico');
    const r = w.enemies[0]; w.player.x = r.x - 60; w.player.y = r.y + 70; })()`);
  await page.waitForFunction("window.__GE__.scene.world.enemies.some((e) => e.state === 'warn' && e.t > 0.45)", undefined, { timeout: 8000 });
  await shot('35j-raton-congelado.png');
  await page.waitForFunction("window.__GE__.scene.world.enemies.some((e) => e.state === 'brake')", undefined, { timeout: 3000 });
  await page.waitForTimeout(150);
  await shot('35k-raton-clic.png');
  console.log('Ratón Inalámbrico: se congela, aparece donde marcaba y hace clic.');

  // M8: the webcam: recording you with its line of sight, then sharing its screen with the microwave.
  await page.goto(`${url}?semilla=e2e-webcam-17&sala=taller-expres&planta=2`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = true; w.room.props = [];
    w.enemies = w.enemies.filter((e) => e.def.id === 'webcam' || e.def.id === 'microondas');
    if (!w.enemies.some((e) => e.def.id === 'webcam')) throw new Error('No hay webcam en la sala de la prueba');
    const c = w.enemies.find((e) => e.def.id === 'webcam'); w.player.x = c.x - 120; w.player.y = c.y + 20; })()`);
  await page.waitForFunction("window.__GE__.scene.world.enemies.some((e) => e.def.id === 'webcam' && e.state === 'warn' && e.t > 0.6)", undefined, { timeout: 8000 });
  await shot('35l-webcam-grabando.png');
  await page.waitForFunction("window.__GE__.scene.world.enemies.some((e) => e.def.id === 'webcam' && e.state === 'brake')", undefined, { timeout: 3000 });
  await page.waitForTimeout(160);
  await shot('35m-webcam-comparte.png');
  console.log('Webcam: graba con la línea de mira y comparte pantalla.');

  // M10 (4a): the wind-up robot: running and bouncing (a fan of nuts on each bounce), run down
  // with its line over it, and winding itself up.
  await page.goto(`${url}?semilla=e2e-robot&sala=taller-expres`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; w.spawnsEnemies = false; w.enemies = []; w.bullets = [];
    const p = w.player; g.spawnIdle('robot-cuerda', p.x + 60, p.y - 70); const r = w.enemies[0]; r.state = 'jam'; r.t = 0; r.until = 0.6; })()`);
  await page.waitForFunction("window.__GE__.scene.world.bullets.some((b) => b.color === 'nut')", undefined, { timeout: 8000 });
  await page.waitForTimeout(140);
  await shot('35n-robot-rebote.png');
  await page.waitForFunction("window.__GE__.scene.world.enemies.some((e) => e.def.id === 'robot-cuerda' && e.state === 'stun' && e.t > 0.15)", undefined, { timeout: 7000 });
  await shot('35o-robot-agotado.png');
  await page.waitForFunction("window.__GE__.scene.world.enemies.some((e) => e.def.id === 'robot-cuerda' && e.state === 'jam' && e.t > 0.2)", undefined, { timeout: 3000 });
  await shot('35p-robot-cuerda.png');
  console.log('Robot de Cuerda: rebota soltando tuercas, se le acaba la cuerda y se la da solo.');

  // M10 planta 4 (4a): the shredder. Shot from the front it swallows the bullets (no damage) and
  // spits strips of paper back; then, close and in front, it warns with its blades red and lunges.
  await page.goto(`${url}?semilla=e2e-destructora&sala=planta-diafana&planta=4`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; w.spawnsEnemies = false; w.enemies = []; w.bullets = [];
    const p = w.player; p.weapon.ammo = p.weapon.def.magazine; p.weapon.reload = 0; g.spawnIdle('destructora', p.x + 150, p.y - 10); })()`);
  await page.waitForTimeout(700);
  const shred = await page.evaluate<{ x: number; y: number }>(`(() => { const e = window.__GE__.scene.world.enemies[0]; e.until = 99; return { x: e.x, y: e.y - 14 }; })()`);
  await aimAt(shred.x, shred.y);
  await page.mouse.down();
  await page.waitForFunction("window.__GE__.scene.world.bullets.some((b) => b.color === 'strip')", undefined, { timeout: 8000 })
    .catch(() => { throw new Error('La destructora no escupe tiras de papel al tragarse balas'); });
  await page.mouse.up();
  await page.waitForTimeout(160);
  await shot('50p-destructora-tiras.png');
  const swallowed = await page.evaluate<{ hurt: number; n: number }>('(() => { const e = window.__GE__.scene.world.enemies[0]; return { hurt: e.damageTaken, n: e.swallowed }; })()');
  if (swallowed.hurt !== 0 || swallowed.n < 4) throw new Error(`De frente no debería hacerle daño: ${JSON.stringify(swallowed)}`);
  await page.evaluate("(() => { const w = window.__GE__.scene.world; w.bullets = []; const e = w.enemies[0]; e.until = e.t + 0.1; })()");
  await page.waitForFunction("window.__GE__.scene.world.enemies.some((e) => e.state === 'warn' && e.t > 0.2)", undefined, { timeout: 6000 })
    .catch(() => { throw new Error('La destructora no avisa antes de lanzarse'); });
  await shot('50q-destructora-atasco.png');
  console.log('Destructora: se traga las balas de frente, escupe tiras y avisa antes de lanzarse.');

  // M10 planta 4 (4b): the photocopier. Lid up, the green light and the line to the vacuum it
  // copies; the grey copy beside its original; and, broken, its copies fading out.
  await page.goto(`${url}?semilla=e2e-fotocopiadora&sala=planta-diafana&planta=4`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; w.spawnsEnemies = false; w.enemies = []; w.bullets = [];
    const p = w.player; g.spawnIdle('aspirador', p.x + 90, p.y - 40); g.spawnIdle('batidora', p.x + 70, p.y + 45); g.spawnIdle('fotocopiadora', p.x + 170, p.y + 5); })()`);
  await page.waitForFunction("window.__GE__.scene.world.enemies.some((e) => e.def.id === 'fotocopiadora' && e.state === 'warn' && e.t > 0.55)", undefined, { timeout: 8000 })
    .catch(() => { throw new Error('La fotocopiadora no se pone a copiar'); });
  await shot('50r-fotocopiadora-escanea.png');
  await page.waitForFunction('window.__GE__.scene.world.enemies.filter((e) => e.copyOf !== undefined).length >= 2', undefined, { timeout: 12000 })
    .catch(() => { throw new Error('La fotocopiadora no saca copias'); });
  await page.waitForTimeout(500);
  await shot('50s-fotocopiadora-copias.png');
  await page.evaluate("(() => { const w = window.__GE__.scene.world; const e = w.enemies.find((o) => o.def.id === 'fotocopiadora'); e.damageTaken = e.def.hp; })()");
  await page.waitForTimeout(450);
  await shot('50t-fotocopiadora-sin-toner.png');
  const copiesLeft = await page.evaluate<number>('window.__GE__.scene.world.enemies.length');
  await page.waitForTimeout(900);
  const copiesAfter = await page.evaluate<number>('window.__GE__.scene.world.enemies.length');
  if (copiesAfter !== 2) throw new Error(`Al romperla, sus copias tenían que caer: quedaban ${copiesLeft} y luego ${copiesAfter}`);
  console.log('Fotocopiadora: escanea, saca copias grises y sin tóner se destiñen.');

  // M10 planta 4 (4c): the DENEGADO stamp. Up in the air with its square shadow over the toaster;
  // the ink on the floor; and a roll denied on it («Solicitud denegada»).
  await page.goto(`${url}?semilla=e2e-sello&sala=planta-diafana&planta=4`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; w.spawnsEnemies = false; w.enemies = []; w.bullets = [];
    const p = w.player; g.spawnIdle('sello', p.x + 80, p.y + 10); g.spawnIdle('sello', p.x - 90, p.y - 30);
    w.enemies.forEach((e, i) => { e.until = 0.4 + i * 0.5; e.volleys = 1 + i; }); })()`);
  await page.waitForFunction("window.__GE__.scene.world.enemies.some((e) => e.def.id === 'sello' && e.state === 'warn' && e.t > 0.3)", undefined, { timeout: 8000 })
    .catch(() => { throw new Error('El sello no sube a estampar'); });
  await shot('50u-sello-aviso.png');
  await page.waitForFunction('window.__GE__.scene.world.ink.length >= 2', undefined, { timeout: 10000 })
    .catch(() => { throw new Error('El sello no deja tinta'); });
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const k = w.ink[w.ink.length - 1]; w.player.x = k.x + 12; w.player.y = k.y + 8; w.player.rollCooldown = 0; w.bullets = []; })()`);
  await page.keyboard.down('d');
  await page.keyboard.press('Space');
  await page.waitForTimeout(160);
  await page.keyboard.up('d');
  const rolled = await page.evaluate<boolean>('window.__GE__.scene.world.player.rollT >= 0');
  if (rolled) throw new Error('En la tinta no se tenía que poder rodar');
  await shot('50v-sello-denegado.png');
  console.log('Sello: sube con su sombra, estampa tinta y en ella la voltereta se deniega.');

  // M10 planta 4 (4d): the portable air conditioner. Its cone of cold air with the streaks, the
  // toaster pushed along in it and its bullets bending away; then the frost it blows.
  await page.goto(`${url}?semilla=e2e-climatizador&sala=planta-diafana&planta=4`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; w.spawnsEnemies = false; w.enemies = []; w.bullets = [];
    const p = w.player; g.spawnIdle('climatizador', p.x - 120, p.y + 5); g.spawnIdle('batidora', p.x + 110, p.y - 40); w.enemies[0].until = 1.6; })()`);
  const acStart = await page.evaluate<number>('window.__GE__.scene.world.player.x');
  const acAim = await page.evaluate<{ x: number; y: number }>("(() => { const e = window.__GE__.scene.world.enemies[0]; return { x: e.x, y: e.y - 16 }; })()");
  await aimAt(acAim.x, acAim.y);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await shot('50w-climatizador-cono.png');
  await page.mouse.up();
  const acPushed = await page.evaluate<number>('window.__GE__.scene.world.player.x');
  if (acPushed <= acStart + 5) throw new Error(`El aire del climatizador no empuja a la tostadora (${acStart} → ${acPushed})`);
  await page.waitForFunction("window.__GE__.scene.world.bullets.filter((b) => b.owner === 'enemy' && b.color === 'ice').length >= 4", undefined, { timeout: 6000 })
    .catch(() => { throw new Error('El climatizador no sopla escarcha'); });
  await page.waitForTimeout(150);
  await shot('50x-climatizador-copos.png');
  console.log('Climatizador: el cono de aire frío empuja a la tostadora, tuerce sus balas y sopla escarcha.');

  // M10 (4b): the remote-control car: drifting round the toaster (tyre marks), aiming its ram,
  // stalling (batteries not included) and overturned.
  await page.goto(`${url}?semilla=e2e-coche&sala=taller-expres`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; w.spawnsEnemies = false; w.enemies = []; w.bullets = [];
    const p = w.player; p.y -= 60; g.spawnIdle('coche-teledirigido', p.x + 90, p.y); const c = w.enemies[0]; c.state = 'walk'; c.t = 0; c.until = 1.5; c.stallT = 99; })()`);
  await page.waitForFunction("window.__GE__.scene.world.enemies.some((e) => e.state === 'warn' && e.t > 0.2)", undefined, { timeout: 8000 });
  await shot('35q-coche-apunta.png');
  await page.evaluate("(() => { const c = window.__GE__.scene.world.enemies[0]; c.stallT = 0.3; })()");
  await page.waitForFunction("window.__GE__.scene.world.enemies.some((e) => e.state === 'off' && e.t > 0.15)", undefined, { timeout: 8000 });
  await shot('35r-coche-pilas.png');
  await page.evaluate("(() => { const c = window.__GE__.scene.world.enemies[0]; c.state = 'stun'; c.t = 0; c.until = 1.5; c.vx = 0; c.vy = 0; })()");
  await page.waitForTimeout(500);
  await shot('35s-coche-volcado.png');
  console.log('Coche Teledirigido: derrapa alrededor, apunta la embestida, se queda sin pilas y vuelca.');

  // M10 (4c): the bucket of pieces, on floor 3: lid up, a handful in the air (yellow marks where
  // they will land), then the pieces lying on the floor round the toaster.
  await page.goto(`${url}?semilla=e2e-cubo&sala=taller-expres&planta=3`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; w.spawnsEnemies = false; w.enemies = []; w.bullets = [];
    const p = w.player; p.y -= 50; g.spawnIdle('cubo-piezas', p.x + 120, p.y - 10); const c = w.enemies[0]; c.state = 'idle'; c.t = 0; c.until = 0.6; })()`);
  await page.waitForFunction("window.__GE__.scene.world.frost.some((f) => f.brick !== undefined && f.t > -0.45 && f.t < -0.25)", undefined, { timeout: 8000 });
  await shot('35t-cubo-lanza.png');
  await page.evaluate("(() => { const c = window.__GE__.scene.world.enemies[0]; c.until = 0.2; })()");
  await page.waitForFunction("window.__GE__.scene.world.frost.filter((f) => f.brick !== undefined && f.t > 0.3).length >= 6", undefined, { timeout: 8000 });
  await shot('35u-cubo-piezas.png');
  console.log('Cubo de Piezas: levanta la tapa, lanza piezas en parábola y se quedan en el suelo.');

  // M10 (4d): the surprise envelope, on floor 3: hopping and spitting confetti, then torn open
  // (what comes out pops out sideways, with its line).
  await page.goto(`${url}?semilla=e2e-sobre&sala=taller-expres&planta=3`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; w.spawnsEnemies = false; w.enemies = []; w.bullets = [];
    const p = w.player; p.y -= 50; g.spawnIdle('sobre-sorpresa', p.x + 100, p.y - 10); g.spawnIdle('sobre-sorpresa', p.x - 90, p.y + 20);
    for (const e of w.enemies) { e.until = 0.3; } w.enemies[1].volleys = 0; })()`);
  await page.waitForFunction(
    "(() => { const w = window.__GE__.scene.world; return w.enemies[0].state === 'charge' && w.enemies[0].t > 0.15 && w.bullets.length > 3; })()",
    undefined,
    { timeout: 8000 },
  );
  await shot('35v-sobre-salta.png');
  await page.evaluate("(() => { const w = window.__GE__.scene.world; w.bullets = []; for (const e of w.enemies) e.damageTaken = 99; })()");
  await page.waitForTimeout(260);
  await shot('35w-sobre-sorpresa.png');
  console.log('Sobre Sorpresa: salta, escupe confeti y al romperse sale la sorpresa.');

  // M8: el Router del Wifi, floor 2's boss: its card, the waves with their holes from it and its
  // repeaters, the reboot at half life and the dropped connections of phase 2.
  await page.goto(`${url}?semilla=e2e-router&sala=jefe-informatica&planta=2`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  const routerJs = "window.__GE__.scene.world.enemies.find((e) => e.def.id === 'router-wifi')";
  if (!(await page.evaluate<boolean>(`!!${routerJs} && !!window.__GE__.scene.world.intro`))) throw new Error('El Router no está en la Sala de Redes o no se presenta');
  await page.waitForTimeout(2000);
  await shot('36a-router-cartel.png');
  await page.mouse.move(240, 120);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForFunction('!window.__GE__.scene.world.intro', undefined, { timeout: 1500 });
  await page.waitForFunction("window.__GE__.scene.world.enemies.filter((e) => e.def.id === 'repetidor').length === 2", undefined, { timeout: 3000 });
  await page.waitForFunction(
    `(() => { const s = window.__GE__.scene; const v = s.cameras.main.worldView;
      return s.world.bullets.filter((b) => b.color === 'cyan' && b.age > 0.5 && v.contains(b.x, b.y)).length >= 12; })()`,
    undefined,
    { timeout: 20000 },
  );
  await shot('36b-router-ondas.png');
  await page.evaluate(`(() => { const b = ${routerJs}; b.damageTaken = Math.ceil(b.def.hp / 2) + 1; })()`);
  await page.waitForFunction(`${routerJs}.bossPhase === 1`, undefined, { timeout: 3000 });
  await page.waitForTimeout(2400);
  if ((await page.evaluate<string>(`${routerJs}.state`)) !== 'roar') throw new Error('El Router no se está reiniciando');
  if (await page.evaluate<boolean>("window.__GE__.scene.world.enemies.some((e) => e.def.id === 'repetidor')")) throw new Error('Los repetidores siguen en pie durante el reinicio');
  await shot('36c-router-reinicio.png');
  await page.waitForFunction(`${routerJs}.state !== 'roar'`, undefined, { timeout: 4000 });
  await page.waitForFunction(
    `(() => { const w = window.__GE__.scene.world; const b = ${routerJs};
      return w.emitters.filter((e) => e.source === b.id && e.height <= 3 && e.t > -0.5).length >= 3; })()`,
    undefined,
    { timeout: 30000 },
  );
  await shot('36d-router-caidas.png');
  console.log('Router del Wifi: cartel, ondas con hueco y repetidores, reinicio y caídas de conexión.');

  // M10 (5b): el Muñeco de Moda, floor 3's boss: its card, the accessories, the catwalk with its
  // flashes, and the sales (the tag on its box comes down and the repeated dolls come out).
  await page.goto(`${url}?semilla=e2e-muneco&sala=jefe-jugueteria&planta=3`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  const munecoJs = "window.__GE__.scene.world.enemies.find((e) => e.def.id === 'muneco-moda')";
  if (!(await page.evaluate<boolean>(`!!${munecoJs} && !!window.__GE__.scene.world.intro`))) throw new Error('El Muñeco no está en el Escaparate o no se presenta');
  await page.waitForTimeout(2000);
  await shot('38a-muneco-cartel.png');
  await page.mouse.move(240, 120);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForFunction('!window.__GE__.scene.world.intro', undefined, { timeout: 1500 });
  await page.waitForFunction(
    `(() => { const s = window.__GE__.scene; const v = s.cameras.main.worldView;
      return s.world.bullets.filter((b) => b.color === 'accessory' && b.age > 0.3 && v.contains(b.x, b.y)).length >= 8; })()`,
    undefined,
    { timeout: 25000 },
  );
  await shot('38b-muneco-accesorios.png');
  // The catwalk: posing over its lane, then down it with the flashes going off behind.
  await page.waitForFunction(`(() => { const b = ${munecoJs}; return b.state === 'warn' && !!b.runTo && b.t > 0.3; })()`, undefined, { timeout: 40000 });
  await shot('38c-muneco-pose.png');
  await page.waitForFunction(
    `(() => { const w = window.__GE__.scene.world; return w.emitters.some((e) => e.mark === 'flash') &&
      w.bullets.filter((b) => b.by === 'muneco-moda' && b.color === 'red').length >= 12; })()`,
    undefined,
    { timeout: 6000 },
  );
  await shot('38d-muneco-pasarela.png');
  // The sales: down to −50 %, with its repeated dolls out.
  await page.evaluate(`(() => { const b = ${munecoJs}; b.damageTaken = Math.ceil(b.def.hp * 0.42); })()`);
  await page.waitForFunction(`${munecoJs}.bossPhase === 1`, undefined, { timeout: 3000 });
  await page.waitForTimeout(700);
  await shot('38e-muneco-rebajas.png');
  await page.evaluate(`(() => { const b = ${munecoJs}; b.damageTaken = Math.ceil(b.def.hp * 0.55); })()`);
  await page.waitForFunction(`${munecoJs}.bossPhase === 2`, undefined, { timeout: 3000 });
  await page.waitForFunction(
    `(() => { const s = window.__GE__.scene; const v = s.cameras.main.worldView;
      return s.world.bullets.filter((b) => b.color === 'accessory' && b.age > 0.4 && v.contains(b.x, b.y)).length >= 14; })()`,
    undefined,
    { timeout: 25000 },
  );
  await shot('38f-muneco-anillos.png');
  const helpers = await page.evaluate<number>("window.__GE__.scene.world.enemies.filter((e) => e.def.id === 'munequito-repetido').length");
  if (helpers < 2) throw new Error(`Las rebajas no traen repetidos: ${helpers}`);
  // M10 (5c): «Fin de existencias». It breaks out of its box (left behind as an obstacle) and
  // spins on the spot, peeling off spirals of sale stickers.
  await page.evaluate(`(() => { const b = ${munecoJs}; b.damageTaken = Math.ceil(b.def.hp * 0.78); })()`);
  await page.waitForFunction(`${munecoJs}.bossPhase === 4`, undefined, { timeout: 3000 });
  await page.waitForTimeout(450);
  await shot('38g-muneco-sin-caja.png');
  if (!(await page.evaluate<boolean>("window.__GE__.scene.world.room.props.some((p) => p.def.id === 'caja-muneco')"))) throw new Error('El Muñeco no deja su caja');
  await page.waitForFunction(
    `(() => { const s = window.__GE__.scene; const v = s.cameras.main.worldView;
      return s.world.bullets.filter((b) => b.color === 'sticker' && b.age > 0.25 && v.contains(b.x, b.y)).length >= 18; })()`,
    undefined,
    { timeout: 25000 },
  );
  await shot('38h-muneco-pegatinas.png');
  console.log('Muñeco de Moda: cartel, accesorios, pasarela con destellos, rebajas con su etiqueta y sus repetidos, y sin caja con sus pegatinas.');

  // M10 planta 4 (5b): El Director de Recursos Inhumanos, floor 4's boss: his card, the business
  // cards, the dismissal letters, and the «Reestructuración» (the partitions marked and moving,
  // the slides, his own stamp).
  await page.goto(`${url}?semilla=e2e-director&sala=jefe-oficinas&planta=4`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  const directorJs = "window.__GE__.scene.world.enemies.find((e) => e.def.id === 'director-rrhh')";
  if (!(await page.evaluate<boolean>(`!!${directorJs} && !!window.__GE__.scene.world.intro`))) throw new Error('El Director no está en la Sala de Juntas o no se presenta');
  await page.waitForTimeout(2000);
  await shot('39a-director-cartel.png');
  await page.mouse.move(240, 120);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForFunction('!window.__GE__.scene.world.intro', undefined, { timeout: 1500 });
  await page.waitForFunction(
    `(() => { const s = window.__GE__.scene; const v = s.cameras.main.worldView;
      return s.world.bullets.filter((b) => b.color === 'bizcard' && b.age > 0.3 && v.contains(b.x, b.y)).length >= 8; })()`,
    undefined,
    { timeout: 25000 },
  );
  await shot('39b-director-tarjetas.png');
  // The letters in the air, their red rings on the carpet.
  await page.waitForFunction("window.__GE__.scene.world.frost.filter((f) => f.look === 'carta-despido' && f.t > -0.45 && f.t < -0.15).length >= 2", undefined, { timeout: 40000 });
  await shot('39c-director-cartas.png');
  await page.waitForFunction("window.__GE__.scene.world.bullets.filter((b) => b.color === 'sheet' && b.age > 0.3).length >= 8", undefined, { timeout: 4000 });
  await shot('39d-director-folios.png');
  // «Reestructuración»: the clap, the partitions' new places marked with dashes.
  await page.evaluate(`(() => { const b = ${directorJs}; b.damageTaken = Math.ceil(b.def.hp * 0.42); })()`);
  await page.waitForFunction(`${directorJs}.bossPhase === 1`, undefined, { timeout: 3000 });
  await page.waitForFunction("window.__GE__.scene.world.room.props.some((p) => p.slide && p.slide.t > 0.5)", undefined, { timeout: 3000 });
  await shot('39e-director-reestructuracion.png');
  await page.waitForFunction("window.__GE__.scene.world.room.props.some((p) => p.slide && p.slide.t > p.slide.warn + 0.3)", undefined, { timeout: 3000 });
  await shot('39f-director-mamparas.png');
  await page.waitForFunction(
    `(() => { const s = window.__GE__.scene; const v = s.cameras.main.worldView;
      return s.world.bullets.filter((b) => b.color === 'slide' && b.age > 0.4 && v.contains(b.x, b.y)).length >= 14; })()`,
    undefined,
    { timeout: 30000 },
  );
  await shot('39g-director-diapositivas.png');
  // His stamp: two square shadows, then the ink.
  await page.waitForFunction("window.__GE__.scene.world.emitters.filter((e) => e.stamp && e.t > -0.35).length >= 2", undefined, { timeout: 40000 });
  await shot('39h-director-sello.png');
  await page.waitForFunction(`window.__GE__.scene.world.ink.some((k) => k.source === ${directorJs}.id && k.t > 0.3)`, undefined, { timeout: 3000 });
  await shot('39i-director-tinta.png');
  console.log('Director de Recursos Inhumanos: cartel, tarjetas, cartas de despido y sus folios, reestructuración de mamparas, diapositivas y su sello.');

  // A whole floor (the default page): walk out of the entrance through a door and into the next room.
  await page.goto(`${url}?semilla=e2e-planta`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  const where = (): Promise<{ room: number; kind: string; shut: boolean; enemies: number }> =>
    page.evaluate(`(() => { const w = window.__GE__.scene.world; return { room: w.floor.current, kind: w.room.kind, shut: w.doorsShut, enemies: w.enemies.length }; })()`);
  const start = await where();
  if (start.kind !== 'start' || start.shut) throw new Error(`La planta no empieza en una entrada abierta: ${JSON.stringify(start)}`);
  await page.waitForTimeout(600);
  await shot('16a-planta-entrada.png');
  // Stand a few steps from a door and walk into it (east or west if there is one: it is a longer walk on screen).
  const door = await page.evaluate<{ dir: string }>(`(() => {
    const w = window.__GE__.scene.world; const ds = w.room.doors;
    const d = ds.find((x) => x.dir === 'E') || ds.find((x) => x.dir === 'W') || ds[0];
    const p = w.player;
    p.x = d.dir === 'E' ? d.x - 30 : d.dir === 'W' ? d.x + d.w + 30 : d.x + d.w / 2;
    p.y = d.dir === 'N' ? d.y + d.h + 30 : d.dir === 'S' ? d.y - 30 : d.y + d.h / 2 + 4;
    return { dir: d.dir };
  })()`);
  const key = { N: 'w', S: 's', E: 'd', W: 'a' }[door.dir] ?? 'd';
  await page.keyboard.down(key);
  await page.waitForFunction(`window.__GE__.scene.world.floor.current !== ${start.room}`, undefined, { timeout: 4000 });
  await page.waitForTimeout(60);
  await shot('16b-planta-fundido.png');
  // Still holding the key on the other side of the door: the toaster keeps walking in without
  // letting go and pressing it again (nota del humano del 2026-10-30).
  await page.waitForTimeout(500);
  const pos = (): Promise<{ x: number; y: number }> => page.evaluate('(() => { const p = window.__GE__.scene.world.player; return { x: p.x, y: p.y }; })()');
  const p0 = await pos();
  await page.waitForTimeout(300);
  const p1 = await pos();
  const walked = { N: p0.y - p1.y, S: p1.y - p0.y, E: p1.x - p0.x, W: p0.x - p1.x }[door.dir] ?? 0;
  if (walked < 8) throw new Error(`Con la tecla pulsada al cruzar la puerta, el personaje no sigue andando (${walked.toFixed(1)} px en 0,3 s)`);
  await page.keyboard.up(key);
  await page.waitForTimeout(700);
  await shot('16c-planta-sala-vecina.png');
  const next = await where();
  console.log(`Planta: de la sala ${start.room} (entrada) a la ${next.room} (${next.kind}, ${next.enemies} enemigos) por la puerta ${door.dir}`);
  if (next.kind === 'combat' && (!next.shut || next.enemies === 0)) throw new Error('Al entrar en una sala de combate no se cierran las persianas');
  if ((await state()).fps < 30) throw new Error(`Va lento en la planta: ${(await state()).fps} fps`);
  // Clear it and walk back the way we came.
  await page.evaluate('window.__GE__.scene.world.enemies.forEach((e) => { e.damageTaken = e.def.hp; })');
  await page.waitForTimeout(1200);
  const back = { N: 'S', S: 'N', E: 'W', W: 'E' }[door.dir]!;
  await page.evaluate(`(() => {
    const w = window.__GE__.scene.world; const d = w.room.doors.find((x) => x.dir === '${back}'); const p = w.player;
    p.x = d.dir === 'E' ? d.x - 20 : d.dir === 'W' ? d.x + d.w + 20 : d.x + d.w / 2;
    p.y = d.dir === 'N' ? d.y + d.h + 20 : d.dir === 'S' ? d.y - 20 : d.y + d.h / 2 + 4;
  })()`);
  const bkey = { N: 'w', S: 's', E: 'd', W: 'a' }[back] ?? 'a';
  await page.keyboard.down(bkey);
  await page.waitForFunction(`window.__GE__.scene.world.floor.current === ${start.room}`, undefined, { timeout: 4000 });
  await page.keyboard.up(bkey);
  await page.waitForTimeout(500);
  await shot('16d-planta-vuelta.png');
  // The minimap with the whole floor known (as if every room had been visited): icons and corridors.
  await page.evaluate('(() => { const s = window.__GE__.scene; s.world.floor.rooms.forEach((r) => { r.visited = true; }); s.drawMinimap(); })()');
  await page.waitForTimeout(100);
  await shot('16e-minimapa.png');
  // What is left in rooms behind shows on the map, one mark per kind (nota del humano del 2026-11-05).
  await page.evaluate(`(() => { const s = window.__GE__.scene; const f = s.world.floor;
    const others = f.rooms.map((r, i) => i).filter((i) => i !== f.current && f.layout.rooms[i].kind === 'combat');
    const k = (kind) => ({ id: 90000 + Math.floor(Math.random() * 1e5), kind, value: 1, x: 100, y: 100, vx: 0, vy: 0, age: 1 });
    f.rooms[others[0]].pickups.push(k('ticket'), k('cupon'), k('cupon'));
    f.rooms[others[1]].pickups.push(k('corazon'));
    f.rooms[others[2]].pickups.push(k('cupon'), k('corazon'), k('objeto'));
    s.drawMinimap(); })()`);
  await page.waitForTimeout(100);
  await shot('16f-minimapa-botin.png');
  // From the floor into the boss room (not the loose ?sala=jefe): the start room's door is rewired
  // to lead there, as if it were next door. She must be there, with her entrance, doors shut.
  await page.goto(`${url}?semilla=e2e-planta`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  const toBoss = await page.evaluate<{ dir: string }>(`(() => {
    const w = window.__GE__.scene.world; const f = w.floor; const here = f.layout.rooms[f.current];
    const boss = f.layout.rooms[f.layout.boss]; const opp = { N: 'S', S: 'N', E: 'W', W: 'E' };
    const door = here.doors.find((d) => !d.secret && boss.doors.some((b) => b.dir === opp[d.dir])) || here.doors.find((d) => !d.secret);
    door.to = f.layout.boss;
    const d = w.room.doors.find((x) => x.dir === door.dir); const p = w.player;
    p.x = d.dir === 'E' ? d.x - 20 : d.dir === 'W' ? d.x + d.w + 20 : d.x + d.w / 2;
    p.y = d.dir === 'N' ? d.y + d.h + 20 : d.dir === 'S' ? d.y - 20 : d.y + d.h / 2 + 4;
    return { dir: door.dir };
  })()`);
  const tkey = { N: 'w', S: 's', E: 'd', W: 'a' }[toBoss.dir] ?? 'd';
  await page.keyboard.down(tkey);
  await page.waitForFunction(`window.__GE__.scene.world.room.kind === 'boss'`, undefined, { timeout: 4000 });
  await page.keyboard.up(tkey);
  await page.waitForTimeout(900);
  const inBoss = await page.evaluate<{ boss: boolean; intro: boolean; shut: boolean }>(
    '(() => { const w = window.__GE__.scene.world; return { boss: w.enemies.some((e) => e.def.boss), intro: !!w.intro, shut: w.doorsShut }; })()',
  );
  await shot('16f-planta-jefa.png');
  console.log(`Planta: de la entrada a la sala de la jefa por la puerta ${toBoss.dir}: ${JSON.stringify(inBoss)}`);
  // M9b: the floor's treasure room keeps two shut chests, and nothing loose (nota del humano del 2026-10-30).
  await page.goto(`${url}?semilla=e2e-planta`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  const toTreasure = await page.evaluate<{ dir: string }>(`(() => {
    const w = window.__GE__.scene.world; w.noDamage = true; const f = w.floor; const here = f.layout.rooms[f.current];
    const t = f.layout.rooms.find((r) => r.kind === 'treasure'); const opp = { N: 'S', S: 'N', E: 'W', W: 'E' };
    const door = here.doors.find((d) => !d.secret && t.doors.some((b) => b.dir === opp[d.dir])) || here.doors.find((d) => !d.secret);
    door.to = t.id;
    const d = w.room.doors.find((x) => x.dir === door.dir); const p = w.player;
    p.x = d.dir === 'E' ? d.x - 20 : d.dir === 'W' ? d.x + d.w + 20 : d.x + d.w / 2;
    p.y = d.dir === 'N' ? d.y + d.h + 20 : d.dir === 'S' ? d.y - 20 : d.y + d.h / 2 + 4;
    return { dir: door.dir };
  })()`);
  const trkey = { N: 'w', S: 's', E: 'd', W: 'a' }[toTreasure.dir] ?? 'd';
  await page.keyboard.down(trkey);
  await page.waitForFunction(`window.__GE__.scene.world.room.kind === 'treasure'`, undefined, { timeout: 4000 });
  await page.keyboard.up(trkey);
  await page.waitForTimeout(900);
  const inTreasure = await page.evaluate<{ chests: number; loose: number; tickets: number }>(
    "(() => { const w = window.__GE__.scene.world; return { chests: w.room.props.filter((p) => p.chest).length,"
      + " loose: w.pickups.filter((k) => k.kind !== 'cupon').length, tickets: w.player.tickets }; })()",
  );
  if (inTreasure.chests !== 2 || inTreasure.loose !== 0 || inTreasure.tickets !== 1) {
    throw new Error(`El tesoro de la planta no tiene dos cofres y nada suelto, o no se empieza con un ticket: ${JSON.stringify(inTreasure)}`);
  }
  await shot('16g-planta-tesoro.png');
  if (!inBoss.boss || !inBoss.intro || !inBoss.shut) throw new Error(`Al entrar desde la planta, la jefa no está o no se presenta: ${JSON.stringify(inBoss)}`);

  // The boss room (M4): La Nevera Suprema makes her entrance; firing again skips the rest.
  await page.goto(`${url}?semilla=e2e-jefe&sala=jefe`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  if (!(await page.evaluate<boolean>('!!window.__GE__.scene.world.intro'))) throw new Error('La sala del jefe no tiene presentación');
  await page.waitForTimeout(450);
  await shot('17a-jefe-entrada.png');
  await page.waitForTimeout(850);
  await shot('17b-jefe-nombre.png');
  await page.waitForTimeout(700);
  await shot('17c-jefe-lema.png');
  await page.mouse.move(240, 120);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForFunction('!window.__GE__.scene.world.intro', undefined, { timeout: 1500 });
  await page.waitForTimeout(900);
  await shot('17d-jefe-combate.png');
  // The boss's song is on (the click above unlocked the sound).
  const song = await page.evaluate<string | null>('window.__GE__.scene.sound2.playing?.name ?? null');
  if (song !== 'jefa') throw new Error(`En la sala de la jefa suena «${song}» en vez de «jefa»`);
  if (!(await page.evaluate<boolean>('window.__GE__.scene.world.doorsShut'))) throw new Error('La sala del jefe no cierra las persianas');
  // Phase 1: ice cubes from the dispenser, then frost lobbed at the toaster that slows it down.
  await page.waitForFunction(
    `(() => { const s = window.__GE__.scene; const v = s.cameras.main.worldView;
      return s.world.bullets.filter((b) => b.color === 'ice' && b.age > 0.4 && v.contains(b.x, b.y)).length >= 10; })()`,
    undefined,
    { timeout: 15000 },
  );
  await shot('17e-nevera-cubitos.png');
  await page.waitForFunction('window.__GE__.scene.world.frost.some((f) => f.t < 0 && f.t > -0.5)', undefined, { timeout: 20000 });
  await shot('17f-nevera-escarcha-aire.png');
  await page.waitForFunction('window.__GE__.scene.world.frost.some((f) => f.t > 0.3)', undefined, { timeout: 5000 });
  await page.evaluate(`(() => {
    const w = window.__GE__.scene.world; const f = w.frost.find((x) => x.t > 0.3); w.player.x = f.x; w.player.y = f.y;
  })()`);
  await page.keyboard.down('d');
  await page.waitForTimeout(300);
  await shot('17g-nevera-escarcha.png');
  await page.keyboard.up('d');
  if ((await state()).fps < 30) throw new Error(`Va lento contra la jefa: ${(await state()).fps} fps`);
  // Phase 2 («Oferta irrechazable»): half her life gone, the door opens; loyalty cards that chase
  // and expired products spat from the fridge.
  await page.evaluate(`(() => { const b = window.__GE__.scene.world.enemies[0]; b.damageTaken = Math.ceil(b.def.hp / 2) + 1; })()`);
  await page.waitForFunction('window.__GE__.scene.world.enemies[0].bossPhase === 1', undefined, { timeout: 3000 });
  // The phase change: she stops, the screen clears and the phase card comes up over her life bar.
  await page.waitForTimeout(450);
  if ((await page.evaluate<string>('window.__GE__.scene.world.enemies[0].state')) !== 'roar') throw new Error('La nevera no se detiene al cambiar de fase');
  if (await page.evaluate<boolean>("window.__GE__.scene.world.bullets.some((b) => b.owner === 'enemy')")) throw new Error('Quedan balas enemigas al cambiar de fase');
  await shot('17k-nevera-cambio-fase.png');
  // Between attacks, so the open door is not hidden by the warning blink.
  await page.waitForFunction("window.__GE__.scene.world.enemies[0].state === 'idle'", undefined, { timeout: 8000 });
  await shot('17h-nevera-fase2.png');
  await page.waitForFunction(`window.__GE__.scene.world.bullets.filter((b) => b.color === 'card' && b.age > 0.6).length >= 3`, undefined, { timeout: 20000 });
  await shot('17i-nevera-tarjetas.png');
  await page.waitForFunction('window.__GE__.scene.world.frost.some((f) => f.product !== undefined && f.t > -0.45)', undefined, { timeout: 20000 });
  await shot('17j-nevera-caducados.png');
  if ((await state()).fps < 30) throw new Error(`Va lento en la fase 2: ${(await state()).fps} fps`);
  // Her life runs out: she comes apart for a while, then «Liquidación total» and the shutters go up.
  await page.evaluate(`(() => { const b = window.__GE__.scene.world.enemies[0]; b.damageTaken = b.def.hp; })()`);
  await page.waitForFunction("window.__GE__.scene.world.enemies[0]?.state === 'dying'", undefined, { timeout: 3000 });
  await page.waitForTimeout(1500);
  await shot('17l-nevera-cayendo.png');
  await page.waitForFunction('window.__GE__.scene.world.enemies.length === 0', undefined, { timeout: 5000 });
  await page.waitForTimeout(1100);
  await shot('17m-nevera-liquidada.png');
  if (await page.evaluate<boolean>('window.__GE__.scene.world.doorsShut')) throw new Error('Las persianas no suben al caer la jefa');
  // The reward: a spare heart among the coupons, and the goods lift down to the next floor.
  if (!(await page.evaluate<boolean>("window.__GE__.scene.world.pickups.some((k) => k.kind === 'corazon')"))) throw new Error('La jefa no suelta un corazón');
  if (!(await page.evaluate<boolean>('!!window.__GE__.scene.world.lift'))) throw new Error('No aparece el montacargas');
  await page.waitForFunction('window.__GE__.scene.world.lift.t > 3.1', undefined, { timeout: 5000 });
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.player.x = w.lift.x - 40; w.player.y = w.lift.y; })()`);
  await page.waitForTimeout(150);
  await shot('17n-montacargas.png');
  await page.keyboard.down('d');
  await page.waitForFunction('window.__GE__.state().won', undefined, { timeout: 5000 });
  await page.keyboard.up('d');
  await page.waitForTimeout(700);
  await shot('17o-montacargas-bajando.png');
  await page.waitForFunction('window.__GE__.state().report.length > 0', undefined, { timeout: 5000 });
  await page.waitForTimeout(900);
  await shot('17p-planta-superada.png');
  const won = await state();
  console.log(`Planta superada: ${won.report.join(' | ')}`);
  // R asks for a new unit: the run starts again.
  await page.waitForTimeout(400);
  await page.keyboard.press('r');
  await page.waitForFunction('window.__GE__.state().ready && !window.__GE__.state().won', undefined, { timeout: 5000 });

  // M5: modifiers. In the test room the toaster gets three bullets per shot, bigger and bouncing,
  // and a longer magazine (the HUD grows a second row of pips).
  await page.goto(`${url}?semilla=e2e-mods&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => {
    window.__GE__.scene.world.noDamage = true;
    window.__GE__.addModifier({
      id: 'prueba',
      stats: [{ stat: 'pellets', add: 2 }, { stat: 'spreadDeg', add: 8 }, { stat: 'bulletRadius', mul: 1.6 }, { stat: 'magazine', add: 16 }],
      bullets: { bounce: 2 },
    });
  })()`);
  const mag = await page.evaluate<number>('window.__GE__.scene.world.player.weapon.def.magazine');
  const baseMag = await page.evaluate<number>('window.__GE__.scene.world.player.weapon.base.magazine');
  if (mag !== baseMag + 16) throw new Error(`El modificador no cambia el cargador: ${mag}`);
  await page.mouse.move(60, 150);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await shot('18a-modificadores.png');
  await page.mouse.up();
  const bounced = await page.evaluate<number>("window.__GE__.scene.world.bullets.filter((b) => b.owner === 'player' && b.bounce < 2).length");
  console.log(`Modificadores: cargador ${mag}, ${bounced} balas ya rebotadas en pantalla.`);

  // M5: weapons. The test room has the Grapadora and the Plancha on their pedestals: walk onto
  // them, fire each at the enemies, and change weapon with E and the mouse wheel.
  await page.goto(`${url}?semilla=e2e-armas&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  const goTo = (id: string, dx: number): Promise<unknown> =>
    page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = true; const k = w.pickups.find((p) => p.weapon === '${id}'); w.player.x = k.x + ${dx}; w.player.y = k.y + 2; })()`);
  await goTo('grapadora', -40);
  await page.waitForTimeout(500);
  await shot('19a-arma-en-pedestal.png');
  await page.keyboard.down('d');
  await page.waitForFunction('window.__GE__.scene.world.player.arsenal.length === 2', undefined, { timeout: 4000 });
  await page.keyboard.up('d');
  await page.waitForTimeout(250);
  await shot('19b-arma-recogida.png');
  const fireAtEnemy = (): Promise<unknown> =>
    page.evaluate(`(() => { const s = window.__GE__.scene; const w = s.world; const p = w.player;
      const e = w.enemies.filter((x) => x.state !== 'gone').sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
      s.controls.override = e ? { aimX: e.x, aimY: e.y - 14, fire: true } : { aimX: p.x + 80, aimY: p.y - 10, fire: true }; })()`);
  await fireAtEnemy();
  await page.waitForTimeout(450);
  await shot('19c-grapadora.png');
  await page.evaluate('window.__GE__.scene.controls.override = null');
  await goTo('plancha', -40);
  await page.keyboard.down('d');
  await page.waitForFunction('window.__GE__.scene.world.player.arsenal.length === 3', undefined, { timeout: 4000 });
  await page.keyboard.up('d');
  // Up close to an enemy for the steam.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world;
    const e = w.enemies.find((x) => x.state !== 'gone' && x.def.id !== 'bombilla'); if (e) { w.player.x = e.x - 90; w.player.y = e.y; } })()`);
  // Let the camera catch up after the jump.
  await page.waitForTimeout(800);
  await fireAtEnemy();
  await page.waitForFunction("window.__GE__.scene.world.player.weapon.ammo < window.__GE__.scene.world.player.weapon.def.magazine", undefined, { timeout: 3000 });
  await page.waitForTimeout(10);
  await shot('19d-plancha.png');
  await page.evaluate('window.__GE__.scene.controls.override = null');
  const slotOf = (): Promise<string> => page.evaluate<string>('window.__GE__.scene.world.player.weapon.base.id');
  const before = await slotOf();
  await page.keyboard.press('e');
  await page.waitForTimeout(120);
  const afterE = await slotOf();
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(160);
  const afterWheel = await slotOf();
  await shot('19e-cambio-de-arma.png');
  if (before === afterE || afterE === afterWheel) throw new Error(`El cambio de arma no funciona: ${before} → ${afterE} → ${afterWheel}`);
  console.log(`Armas: ${before} → E → ${afterE} → rueda → ${afterWheel}.`);

  // M5: passive items. A treasure room played on its own has a weapon and an item on its
  // pedestals: walk onto the item, read its name and description, then try a full build.
  await page.goto(`${url}?semilla=e2e-objetos&sala=tesoro`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  const item = await page.evaluate<string>(`(() => { const w = window.__GE__.scene.world; const k = w.pickups.find((p) => p.kind === 'objeto');
    w.player.x = k.x - 36; w.player.y = k.y + 2; return k.item; })()`);
  await page.waitForTimeout(600);
  await shot('20a-objeto-en-pedestal.png');
  await page.keyboard.down('d');
  await page.waitForFunction('window.__GE__.scene.world.player.items.length === 1', undefined, { timeout: 4000 });
  await page.keyboard.up('d');
  await page.waitForTimeout(300);
  await shot('20b-objeto-recogido.png');
  await page.goto(`${url}?semilla=e2e-build&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; g.scene.world.noDamage = true; for (const id of ['manual', 'regleta', 'tarjeta', 'resistencia', 'garantia']) g.giveItem(id); })()`);
  await fireAtEnemy();
  await page.waitForTimeout(700);
  await shot('20c-build.png');
  await page.evaluate('window.__GE__.scene.controls.override = null');
  const carried = await page.evaluate<number>('window.__GE__.scene.world.player.items.length');
  if (carried !== 5) throw new Error(`La tostadora lleva ${carried} objetos en vez de 5`);
  console.log(`Objetos: recogido ${item} en el tesoro; build de prueba con ${carried} objetos.`);

  // M5: active items. Pick one up in the treasure room, then in the test room put everything on
  // hold with the Música de Espera and wipe a pattern with the Encuesta (Q).
  await page.goto(`${url}?semilla=e2e-objetos&sala=tesoro`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const k = w.pickups.find((p) => p.kind === 'activo');
    w.player.x = k.x - 36; w.player.y = k.y + 2; })()`);
  await page.waitForTimeout(400);
  await page.keyboard.down('d');
  await page.waitForFunction('window.__GE__.scene.world.player.active !== null', undefined, { timeout: 4000 });
  await page.keyboard.up('d');
  await page.waitForTimeout(300);
  await shot('21a-activo-recogido.png');
  await page.goto(`${url}?semilla=e2e-activos&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; g.scene.world.noDamage = true; g.giveActive('espera'); })()`);
  await page.waitForTimeout(300);
  await page.keyboard.press('3');
  await page.waitForTimeout(500);
  await page.keyboard.press('q');
  await page.waitForTimeout(400);
  await shot('21b-musica-de-espera.png');
  if (!(await page.evaluate<boolean>('window.__GE__.scene.world.holdT > 0'))) throw new Error('La Música de Espera no pone la sala en espera');
  await page.waitForFunction('window.__GE__.scene.world.holdT === 0', undefined, { timeout: 6000 });
  await page.evaluate(`window.__GE__.giveActive('encuesta')`);
  await page.waitForTimeout(400);
  await page.keyboard.press('2');
  await page.waitForTimeout(450);
  const before2 = await page.evaluate<number>("window.__GE__.scene.world.bullets.filter((b) => b.owner === 'enemy').length");
  await page.keyboard.press('q');
  await page.waitForTimeout(150);
  await shot('21c-encuesta.png');
  const after2 = await page.evaluate<number>("window.__GE__.scene.world.bullets.filter((b) => b.owner === 'enemy').length");
  if (before2 === 0 || after2 > 0) throw new Error(`La Encuesta no borra las balas: ${before2} → ${after2}`);
  await page.keyboard.press('q');
  await page.waitForTimeout(200);
  await shot('21d-sin-bateria.png');
  console.log(`Activos: en espera y encuesta (${before2} balas borradas).`);

  // M5: synergies. With the Manual en Chino already carried, pick up the Broca del Ocho in the
  // treasure room: Bricolaje Avanzado switches on, with its banner under the item's.
  await page.goto(`${url}?semilla=e2e-objetos&sala=tesoro`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; g.giveItem('manual'); const k = w.pickups.find((p) => p.kind === 'objeto');
    k.item = 'broca'; w.player.x = k.x - 36; w.player.y = k.y + 2; })()`);
  await page.waitForTimeout(400);
  await page.keyboard.down('d');
  await page.waitForFunction('window.__GE__.scene.world.player.synergies.includes("bricolaje")', undefined, { timeout: 4000 });
  await page.keyboard.up('d');
  await page.waitForTimeout(350);
  await shot('22-sinergia.png');
  console.log('Sinergias: Bricolaje Avanzado al juntar Manual y Broca.');

  // M5: chests. One drops in the test room; without a ticket it complains; with the ticket that
  // pops out next to it, it opens and leaves an item and coupons.
  await page.goto(`${url}?semilla=e2e-cofres&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; w.spawnsEnemies = false; w.enemies = [];
    g.placeChest(w.player.x + 70, w.player.y - 30); })()`);
  await page.waitForTimeout(150);
  await shot('23a-cofre-cayendo.png');
  await page.waitForTimeout(600);
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const c = w.room.props.find((p) => p.chest); w.player.x = c.x; w.player.y = c.y + 30; })()`);
  await page.keyboard.down('w');
  await page.waitForTimeout(200);
  await page.keyboard.up('w');
  // In front of it, the prompt says which key opens it (nota del humano del 2026-10-30: an interact button).
  const prompt = (): Promise<string> => page.evaluate<string>('(() => { const t = window.__GE__.scene.prompt; return t && t.visible ? t.text : ""; })()');
  if (!/F: ABRIR/i.test(await prompt())) throw new Error(`Contra el cofre no sale «F: Abrir»: «${await prompt()}»`);
  await shot('23a2-cofre-boton.png');
  await page.keyboard.press('f');
  await page.waitForTimeout(250);
  await shot('23b-cofre-sin-ticket.png');
  await page.evaluate(`(() => { const c = window.__GE__.scene.world.room.props.find((p) => p.chest); window.__GE__.dropTicket(c.x + 40, c.y + 10); })()`);
  await page.waitForTimeout(300);
  if (await page.evaluate<boolean>('window.__GE__.scene.world.room.props.find((p) => p.chest).chest.open')) throw new Error('El cofre se abre sin ticket');
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const k = w.pickups.find((p) => p.kind === 'ticket'); w.player.x = k.x - 20; w.player.y = k.y; })()`);
  await page.keyboard.down('d');
  await page.waitForFunction('window.__GE__.scene.world.player.tickets === 1', undefined, { timeout: 3000 });
  await page.keyboard.up('d');
  await page.waitForTimeout(200);
  await shot('23c-ticket-recogido.png');
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const c = w.room.props.find((p) => p.chest); w.player.x = c.x; w.player.y = c.y + 22; })()`);
  await page.keyboard.down('w');
  await page.waitForTimeout(400);
  await page.keyboard.up('w');
  if (await page.evaluate<boolean>('window.__GE__.scene.world.room.props.find((p) => p.chest).chest.open')) throw new Error('El cofre se abre solo con andar contra él');
  await page.keyboard.press('f');
  await page.waitForFunction('window.__GE__.scene.world.room.props.find((p) => p.chest).chest.open', undefined, { timeout: 3000 });
  await page.keyboard.down('a');
  await page.waitForTimeout(250);
  await page.keyboard.up('a');
  await page.waitForTimeout(300);
  await shot('23d-cofre-abierto.png');
  // The rare premium chest (nota del humano del 2026-10-30): wine-red and gold, its name in gold as it drops in.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; window.__GE__.placeChest(w.player.x + 60, w.player.y + 30, 'premium'); })()`);
  await page.waitForTimeout(500);
  await shot('23e-cofre-premium.png');
  if (!(await page.evaluate<boolean>("window.__GE__.scene.world.room.props.some((p) => p.chest && p.chest.tier === 'premium')"))) throw new Error('No hay cofre premium');
  // A passive item, an active one or a weapon (not one of the test room's pedestals: those are old).
  const fromChest = "window.__GE__.scene.world.pickups.some((k) => k.kind === 'objeto' || k.kind === 'activo' || (k.kind === 'arma' && k.age < 3))";
  if (!(await page.evaluate<boolean>(fromChest))) throw new Error('El cofre no suelta ningún objeto');
  console.log('Cofres: cerrado sin ticket, abierto con ticket y con su objeto.');

  // M5: the shop. The till greets; without coupons it says no; with them the item is bought.
  await page.goto(`${url}?semilla=e2e-tienda&sala=tienda`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = true; const k = w.pickups.find((p) => p.kind === 'objeto');
    w.player.x = k.x; w.player.y = k.y + 46; })()`);
  await page.waitForTimeout(1100);
  await shot('24a-tienda.png');
  await page.keyboard.down('w');
  await page.waitForTimeout(500);
  await page.keyboard.up('w');
  if (!/F: COMPRAR POR 15/i.test(await prompt())) throw new Error(`Ante la balda no sale «F: Comprar por 15»: «${await prompt()}»`);
  await page.keyboard.press('f');
  await page.waitForFunction("window.__GE__.scene.world.events.some((e) => e.type === 'shop') || window.__GE__.scene.tillNoT > 0", undefined, { timeout: 3000 })
    .catch(() => { throw new Error('La caja no dice nada al pulsar F sin cupones'); });
  await page.waitForTimeout(250);
  await shot('24b-tienda-sin-cupones.png');
  if (await page.evaluate<number>('window.__GE__.scene.world.player.items.length')) throw new Error('Se compra sin cupones');
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.player.coupons = 31; const k = w.pickups.find((p) => p.kind === 'objeto'); w.player.x = k.x; w.player.y = k.y + 10; })()`);
  await page.waitForTimeout(200);
  await page.keyboard.press('f');
  await page.waitForFunction('window.__GE__.scene.world.player.items.length === 1', undefined, { timeout: 3000 })
    .catch(() => { throw new Error('Con cupones, F no compra el objeto'); });
  await page.waitForTimeout(350);
  await shot('24c-tienda-comprado.png');
  if (await page.evaluate<number>('window.__GE__.scene.world.player.coupons') !== 16) throw new Error('La compra no cobra 15 cupones');
  console.log('Tienda: saludo, sin cupones no vende y con cupones cobra 15 y da el objeto.');

  // M6: the pause menu. Esc freezes the game; options change and are kept; the controls are listed; Esc goes back.
  await page.goto(`${url}?semilla=e2e-pausa&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForFunction('window.__GE__.scene.scene.isPaused()', undefined, { timeout: 3000 });
  const pausedAt = await page.evaluate<number>('window.__GE__.scene.world.tick');
  await page.waitForTimeout(400);
  if ((await page.evaluate<number>('window.__GE__.scene.world.tick')) !== pausedAt) throw new Error('El juego sigue en pausa');
  await shot('25a-pausa.png');
  await tapKeys('ArrowDown', 'ArrowDown', 'Enter', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'Enter', 'ArrowDown', 'Enter', 'ArrowDown', 'Enter');
  await page.waitForTimeout(150);
  await shot('25b-opciones.png');
  const saved = await page.evaluate<string | null>("localStorage.getItem('garantia-expirada/opciones')");
  const so = JSON.parse(saved ?? '{}') as Record<string, unknown>;
  if (JSON.stringify([so.volume, so.music, so.shake, so.flashes, so.bigText]) !== JSON.stringify([4, 6, false, false, true])) throw new Error(`Opciones mal guardadas: ${saved}`);
  await tapKeys('Escape', 'ArrowDown', 'Enter');
  await page.waitForTimeout(150);
  await shot('25c-controles.png');
  await tapKeys('Escape', 'Escape');
  await page.waitForFunction('!window.__GE__.scene.scene.isPaused()', undefined, { timeout: 3000 });
  await page.waitForTimeout(300);
  if ((await page.evaluate<number>('window.__GE__.scene.world.tick')) === pausedAt) throw new Error('El juego no vuelve después de la pausa');
  await page.evaluate("localStorage.removeItem('garantia-expirada/opciones')");
  console.log('Pausa: congela el juego, guarda volumen 4, sin temblor, con destellos suaves y texto grande, enseña los controles y vuelve.');

  // M7: Opciones › Teclas. Rolling goes to K and up to I; then K rolls and the space bar does
  // not, I goes up and W does not; the controls hint says so.
  await page.goto(`${url}?semilla=e2e-teclas&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  await page.waitForTimeout(300);
  await tapKeys('Escape', 'ArrowDown', 'ArrowDown', 'Enter', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'Enter');
  await page.waitForTimeout(150);
  await shot('32a-teclas.png');
  await tapKeys('ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'Enter');
  await page.waitForTimeout(150);
  await shot('32b-teclas-esperando.png');
  await tapKeys('k', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'Enter', 'p', 'i');
  await page.waitForTimeout(150);
  await shot('32c-teclas-cambiadas.png');
  const keymap = JSON.parse((await page.evaluate<string | null>("localStorage.getItem('garantia-expirada/opciones')")) ?? '{}').keys as Record<string, string[]>;
  if (keymap?.roll?.[0] !== 'KeyK' || keymap?.up?.[0] !== 'KeyI' || keymap.roll.includes('Space')) throw new Error(`Teclas mal guardadas: ${JSON.stringify(keymap)}`);
  await tapKeys('Escape', 'Escape', 'Escape');
  await page.waitForFunction('!window.__GE__.scene.scene.isPaused()', undefined, { timeout: 3000 });
  await page.waitForTimeout(200);
  const yAt = (): Promise<number> => page.evaluate<number>('window.__GE__.scene.world.player.y');
  const holdKey = async (k: string, ms: number): Promise<number> => {
    const y0 = await yAt();
    await page.keyboard.down(k);
    await page.waitForTimeout(ms);
    await page.keyboard.up(k);
    await page.waitForTimeout(100);
    return (await yAt()) - y0;
  };
  if ((await holdKey('i', 300)) > -8) throw new Error('La I no sube después de cambiarla');
  if (Math.abs(await holdKey('w', 300)) > 0.5) throw new Error('La W sigue subiendo');
  await page.waitForTimeout(800);
  await page.keyboard.press('Space');
  await page.waitForTimeout(60);
  if (await page.evaluate<boolean>('window.__GE__.scene.world.player.rollT >= 0')) throw new Error('El espacio sigue rodando');
  await page.keyboard.press('k');
  await page.waitForFunction('window.__GE__.scene.world.player.rollT >= 0', undefined, { timeout: 1000 });
  const hint = await page.evaluate<string>('window.__GE__.scene.hintText');
  if (!hint.startsWith('I') || !hint.includes('K RODAR')) throw new Error(`La ayuda de controles no dice las teclas nuevas: ${hint}`);
  await page.evaluate("localStorage.removeItem('garantia-expirada/opciones')");
  console.log('Teclas: rodar a la K y subir a la I; la P (pausa) no se deja; la ayuda las nombra.');

  // M6: the inventory, in the pause menu, with a few items, an active one and a synergy.
  await page.goto(`${url}?semilla=e2e-inventario&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; g.scene.world.noDamage = true;
    for (const id of ['pila', 'resistencia', 'garantia', 'etiqueta', 'manual', 'broca', 'cinta']) g.giveItem(id); g.giveActive('espera'); })()`);
  await page.waitForTimeout(300);
  await tapKeys('Escape', 'ArrowDown', 'Enter');
  await page.waitForTimeout(200);
  await shot('27a-inventario.png');
  if (!(await page.evaluate<boolean>("window.__GE__.scene.world.player.synergies.length > 0"))) throw new Error('La prueba del inventario no tiene sinergia');
  await tapKeys('ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown');
  await page.waitForTimeout(150);
  await shot('27b-inventario-activo.png');
  await tapKeys('Escape', 'Escape');
  await page.waitForFunction('!window.__GE__.scene.scene.isPaused()', undefined, { timeout: 3000 });
  console.log('Inventario: siete objetos, el activo y la sinergia, con las estadísticas antes y después.');
  // The sick-leave report lists what it was carrying; Esc goes from it to the title.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = false; w.player.hp = 1; w.player.invulnerable = 0; })()`);
  await page.evaluate(bulletAt(24));
  await page.waitForFunction('window.__GE__.state().over', undefined, { timeout: 3000 });
  await page.waitForTimeout(3200);
  await shot('28-parte-con-equipaje.png');
  await page.keyboard.press('Escape');
  await page.waitForFunction("window.__GE_PHASER__.scene.isActive('title')", undefined, { timeout: 4000 });
  console.log('Parte de baja: con su equipaje, y Esc lleva a la portada.');

  // M7: «Texto grande». The description window, the synergy's plate (after the window goes),
  // the room's name and the till's bubble, all at double size.
  await page.goto(`${url}?semilla=e2e-objetos&sala=tesoro`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`localStorage.setItem('garantia-expirada/opciones', JSON.stringify({ bigText: true }))`);
  await page.goto(`${url}?semilla=e2e-objetos&sala=tesoro`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.waitForTimeout(500);
  await shot('31a-texto-grande-sala.png');
  await page.evaluate(`(() => { const g = window.__GE__; const w = g.scene.world; w.noDamage = true; g.giveItem('manual'); const k = w.pickups.find((p) => p.kind === 'objeto');
    k.item = 'broca'; w.player.x = k.x - 36; w.player.y = k.y + 2; })()`);
  await page.waitForTimeout(400);
  await page.keyboard.down('d');
  await page.waitForFunction('window.__GE__.scene.world.player.synergies.includes("bricolaje")', undefined, { timeout: 4000 });
  await page.keyboard.up('d');
  await page.waitForTimeout(350);
  await shot('31b-texto-grande-objeto.png');
  if (await page.evaluate<boolean>('window.__GE__.scene.synergyText.alpha > 0')) throw new Error('Con texto grande, la sinergia sale encima de la ventana');
  await page.waitForFunction('window.__GE__.scene.synergyText.alpha === 1', undefined, { timeout: 9000 });
  await page.waitForTimeout(200);
  await shot('31c-texto-grande-sinergia.png');
  await page.goto(`${url}?semilla=e2e-tienda&sala=tienda`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = true; const k = w.pickups.find((p) => p.kind === 'objeto');
    w.player.x = k.x; w.player.y = k.y + 46; })()`);
  await page.waitForTimeout(1100);
  await shot('31d-texto-grande-tienda.png');
  await page.goto(`${url}?semilla=e2e-inventario&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; for (const id of ['pila', 'resistencia', 'garantia', 'etiqueta', 'manual', 'broca', 'cinta']) g.giveItem(id);
    const w = g.scene.world; w.player.hp = 1; w.player.invulnerable = 0; })()`);
  await page.evaluate(bulletAt(24));
  await page.waitForFunction('window.__GE__.state().over', undefined, { timeout: 3000 });
  await page.waitForTimeout(3200);
  await shot('31e-texto-grande-parte.png');
  await page.goto(`${url}?semilla=e2e-inventario&sala=sala-pruebas`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const g = window.__GE__; g.scene.world.noDamage = true;
    for (const id of ['pila', 'resistencia', 'garantia', 'etiqueta', 'manual', 'broca', 'cinta']) g.giveItem(id); g.giveActive('encuesta'); })()`);
  await page.waitForTimeout(300);
  await tapKeys('Escape', 'ArrowDown', 'Enter');
  await page.waitForTimeout(200);
  await shot('31f-texto-grande-inventario.png');
  await tapKeys('ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown');
  await page.waitForTimeout(150);
  await shot('31g-texto-grande-inventario-activo.png');
  // Seven items, the active one and two synergies: «Volver» is three lines down.
  await tapKeys('ArrowDown', 'ArrowDown', 'ArrowDown');
  await page.waitForTimeout(150);
  if ((await page.evaluate<string>('window.__GE_PHASER__.scene.getScene("pause").menu.current.id')) !== 'back') throw new Error('El inventario no llega a «Volver»');
  await shot('31h-texto-grande-inventario-volver.png');
  await tapKeys('Escape', 'Escape');
  await page.waitForFunction('!window.__GE__.scene.scene.isPaused()', undefined, { timeout: 3000 });
  // The boss card, with its motto at double size.
  await page.goto(`${url}?semilla=e2e-jefe&sala=jefe`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate('window.__GE__.scene.world.noDamage = true');
  await page.waitForTimeout(2300);
  await shot('31i-texto-grande-jefa.png');
  await page.evaluate("localStorage.removeItem('garantia-expirada/opciones')");
  console.log('Texto grande: ventana de descripción, sinergia después, nombre de sala, bocadillo de la caja, parte de baja, inventario y tarjeta de la jefa.');

  // M6: the title screen. Credits, then a run; from the pause, back to the title.
  await page.goto(url);
  await page.waitForFunction("window.__GE_PHASER__ && window.__GE_PHASER__.scene.isActive('title')", undefined, { timeout: 20000 });
  await page.waitForTimeout(500);
  await shot('26a-portada.png');
  await tapKeys('ArrowUp', 'Enter');
  await page.waitForTimeout(150);
  await shot('26b-creditos.png');
  await tapKeys('Escape', 'ArrowDown', 'Enter');
  await throughHub('26c-mostrador-desde-portada.png');
  await page.waitForTimeout(600);
  await shot('26c-partida-desde-portada.png');
  await tapKeys('Escape', 'ArrowUp', 'Enter');
  await page.waitForTimeout(150);
  await shot('26d-salir-al-menu.png');
  await tapKeys('ArrowDown', 'Enter');
  await page.waitForFunction("window.__GE_PHASER__.scene.isActive('title') && !window.__GE_PHASER__.scene.isActive('game')", undefined, { timeout: 5000 });
  console.log('Portada: créditos, partida nueva y vuelta a la portada desde la pausa.');

  // M6: the record. A run on a floor ends with the toaster down; the title's history shows it.
  await tapKeys('Enter');
  await throughHub();
  await page.waitForTimeout(400);
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.player.hp = 1; w.player.invulnerable = 0; w.player.rollT = -1; })()`);
  await page.evaluate(bulletAt(24));
  await page.waitForFunction('window.__GE__.state().over', undefined, { timeout: 3000 });
  await page.waitForTimeout(3200);
  await page.keyboard.press('Escape');
  await page.waitForFunction("window.__GE_PHASER__.scene.isActive('title')", undefined, { timeout: 4000 });
  const savedProfile = await page.evaluate<string | null>("localStorage.getItem('garantia-expirada/perfil')");
  const prof = JSON.parse(savedProfile ?? '{}') as { runs?: number; downs?: number; causes?: Record<string, number> };
  if (prof.runs !== 1 || prof.downs !== 1 || !prof.causes?.['microondas:bullet']) throw new Error(`El historial no apunta la partida: ${savedProfile}`);
  await tapKeys('ArrowUp', 'ArrowUp', 'Enter');
  await page.waitForTimeout(150);
  await shot('29-historial.png');
  await page.evaluate("localStorage.removeItem('garantia-expirada/perfil')");
  console.log('Historial: una reclamación, una baja por microondas.');

  // M9: the secret room keeps a story document on the floor; walking over it files it.
  await page.goto(`${url}?semilla=e2e-documento&sala=secreta`);
  await page.waitForFunction('window.__GE__ && window.__GE__.state().ready', undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = true; const k = w.pickups.find((p) => p.kind === 'documento');
    w.player.x = k.x; w.player.y = k.y + 34; })()`);
  await page.waitForTimeout(600);
  await shot('39-documento-secreto.png');
  await page.keyboard.down('w');
  await page.waitForFunction('window.__GE__.scene.world.docs.length === 1', undefined, { timeout: 3000 }).catch(() => { throw new Error('El documento de la sala secreta no se coge'); });
  await page.keyboard.up('w');
  await page.waitForTimeout(250);
  await shot('39b-documento-archivado.png');
  console.log('Sala secreta: el documento está en el suelo y se coge al pisarlo.');

  // M9: the Mostrador de Devoluciones. Every run starts on its conveyor and ends back at its counter.
  await page.goto(`${url}?mostrador`);
  await page.waitForFunction("window.__GE__ && window.__GE__.state().ready && window.__GE__.scene.world.room.kind === 'hub'", undefined, { timeout: 20000 });
  await page.waitForTimeout(1200);
  await shot('40-mostrador.png');
  // Nobody shoots in there: holding the trigger fires nothing.
  await page.mouse.down();
  await page.waitForTimeout(400);
  await page.mouse.up();
  if ((await page.evaluate<number>('window.__GE__.scene.world.bullets.length')) !== 0) throw new Error('En el Mostrador se dispara');
  await throughHub();
  await page.waitForTimeout(700);
  await shot('41-de-la-cinta-a-la-planta.png');
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.noDamage = false; w.player.hp = 1; w.player.invulnerable = 0; w.player.rollT = -1; })()`);
  await page.evaluate(bulletAt(24));
  await page.waitForFunction('window.__GE__.state().over', undefined, { timeout: 3000 });
  await page.waitForTimeout(3200);
  await page.keyboard.press('r');
  await page.waitForFunction("window.__GE__.state().ready && window.__GE__.scene.world.room.kind === 'hub'", undefined, { timeout: 5000 })
    .catch(() => { throw new Error('Tras el parte de baja no se vuelve al Mostrador'); });
  await page.waitForTimeout(600);
  await shot('42-vuelta-al-mostrador.png');
  // At the counter the Caja stamps the sick-leave report: «Motivo de la devolución: …».
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const c = w.room.stations.find((s) => s.kind === 'caja'); w.player.x = c.x; w.player.y = c.y + 40; })()`);
  await page.keyboard.down('w');
  await page.waitForTimeout(500);
  await page.keyboard.up('w');
  // Walking up says nothing: the interact button does (nota del humano del 2026-10-30).
  if (await page.evaluate<boolean>('!!window.__GE__.scene.bubble')) throw new Error('La Caja habla sin pulsar el botón de interactuar');
  await page.keyboard.press('f');
  await page.waitForFunction('!!window.__GE__.scene.bubble', undefined, { timeout: 3000 }).catch(() => { throw new Error('La Caja de Devoluciones no dice nada'); });
  const said = await page.evaluate<string>('window.__GE__.scene.bubble.t.text');
  if (!said.startsWith('MOTIVO DE LA DEVOLUCI')) throw new Error(`La Caja no empieza por el motivo de la baja: «${said}»`);
  await page.waitForTimeout(500);
  await shot('43-la-caja-habla.png');
  // The ticket machine and the phone talk too, each in its own bubble.
  const standAt = async (kind: string, dy: number, expect: string, name: string): Promise<void> => {
    await page.evaluate(`(() => { const w = window.__GE__.scene.world; const c = w.room.stations.find((s) => s.kind === '${kind}'); w.player.x = c.x; w.player.y = c.y + ${dy}; })()`);
    await page.waitForTimeout(150);
    await page.keyboard.press('f');
    await page.waitForFunction(`(() => { const b = window.__GE__.scene.bubble; return !!b && b.t.text.includes(${JSON.stringify(expect)}); })()`, undefined, { timeout: 4000 })
      .catch(async () => { throw new Error(`${kind} no dice «${expect}»: «${await page.evaluate<string>('window.__GE__.scene.bubble?.t.text ?? ""')}»`); });
    await page.waitForTimeout(400);
    await shot(name);
  };
  await standAt('turnos', 8, 'ATENDIENDO AL 12', '44-maquina-de-turnos.png');
  await standAt('telefono', 2, '', '45-telefono.png');
  // Back at the phone in the same visit: not the whole recording again, a short line of its own.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.player.y += 70; })()`);
  await page.waitForFunction('!window.__GE__.scene.bubble', undefined, { timeout: 9000 }).catch(() => { throw new Error('El bocadillo del teléfono no se va al irse'); });
  await standAt('telefono', 2, 'PARA VOLVER A ESCUCHAR', '45b-telefono-otra-vez.png');
  // Nothing is fired in the Mostrador: no ammo in the corner.
  if ((await page.evaluate<number>('window.__GE__.scene.ammoText.alpha')) !== 0) throw new Error('En el Mostrador sale la munición');
  // With a boss beaten, the Chatarrero is there and gives a hint.
  await page.evaluate(`localStorage.setItem('garantia-expirada/perfil', JSON.stringify({ runs: 3, downs: 2, bosses: { 'nevera-suprema': 1 } }))`);
  await page.goto(`${url}?mostrador`);
  await page.waitForFunction("window.__GE__ && window.__GE__.state().ready && window.__GE__.scene.world.room.kind === 'hub'", undefined, { timeout: 20000 });
  if (!(await page.evaluate<boolean>("window.__GE__.scene.world.room.stations.some((s) => s.kind === 'chatarrero')"))) throw new Error('El Chatarrero no sale tras vencer a un jefe');
  await standAt('chatarrero', 8, '', '46-chatarrero.png');
  // The board opens its panel: the Batidora is unlocked (the Nevera fell), the rest are silhouettes.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const c = w.room.stations.find((s) => s.kind === 'tablon'); w.player.x = c.x; w.player.y = c.y + 6; })()`);
  await page.waitForTimeout(150);
  await page.keyboard.press('f');
  await page.waitForFunction('window.__GE__.scene.panel.length > 0', undefined, { timeout: 3000 }).catch(() => { throw new Error('El tablón no enseña nada'); });
  const boardTexts = await page.evaluate<string[]>("window.__GE__.scene.panel.filter((o) => o.type === 'BitmapText').map((o) => o.text)");
  const boardOk = boardTexts.some((t) => t.startsWith('RÁPIDA Y FRÁGIL')) && boardTexts.some((t) => t.includes('ROUTER'));
  if (!boardOk) throw new Error(`El tablón no enseña lo desbloqueado y lo que falta: ${boardTexts.join(' | ')}`);
  await page.waitForTimeout(400);
  await shot('47-tablon.png');
  // Walking away closes it.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; w.player.y += 60; })()`);
  await page.waitForFunction('window.__GE__.scene.panel.length === 0', undefined, { timeout: 3000 }).catch(() => { throw new Error('El tablón no se cierra al irse'); });
  // The archivador: the Nevera's albarán is in (beating her filed it); F (interact) turns the sheet.
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const c = w.room.stations.find((s) => s.kind === 'archivador'); w.player.x = c.x + 14; w.player.y = c.y + 4; })()`);
  await page.waitForTimeout(150);
  await page.keyboard.press('f');
  await page.waitForFunction('window.__GE__.scene.panel.length > 0', undefined, { timeout: 3000 }).catch(() => { throw new Error('El archivador no enseña nada'); });
  const sheet = (): Promise<string> => page.evaluate<string>("window.__GE__.scene.panel.filter((o) => o.type === 'BitmapText').map((o) => o.text).join(' | ')");
  const first = await sheet();
  if (!first.includes('ALBARÁN DE ENTRADA') || !first.includes('HOJA 1 DE 3')) throw new Error(`El archivador no abre el albarán: ${first}`);
  await page.keyboard.press('f');
  await page.waitForFunction("window.__GE__.scene.panel.some((o) => o.type === 'BitmapText' && o.text === 'HOJA 2 DE 3')", undefined, { timeout: 2000 })
    .catch(async () => { throw new Error(`F no pasa la hoja del archivador: ${await sheet()}`); });
  await page.waitForTimeout(300);
  await shot('49-archivador.png');
  // With big text it still fits: one line per character.
  await page.evaluate(`localStorage.setItem('garantia-expirada/opciones', JSON.stringify({ bigText: true }))`);
  await page.goto(`${url}?mostrador`);
  await page.waitForFunction("window.__GE__ && window.__GE__.state().ready && window.__GE__.scene.world.room.kind === 'hub'", undefined, { timeout: 20000 });
  await page.evaluate(`(() => { const w = window.__GE__.scene.world; const c = w.room.stations.find((s) => s.kind === 'tablon'); w.player.x = c.x; w.player.y = c.y + 6; })()`);
  await page.waitForTimeout(150);
  await page.keyboard.press('f');
  await page.waitForFunction('window.__GE__.scene.panel.length > 0', undefined, { timeout: 3000 }).catch(() => { throw new Error('El tablón no enseña nada con texto grande'); });
  await page.waitForTimeout(400);
  await shot('48-tablon-texto-grande.png');
  await page.evaluate("localStorage.removeItem('garantia-expirada/opciones')");
  await page.evaluate("localStorage.removeItem('garantia-expirada/perfil')");
  console.log('Mostrador: se empieza en él, la cinta lleva a la planta 1, tras el parte de baja se vuelve; la Caja, la máquina de turnos, el teléfono y el Chatarrero hablan;'
    + ' el tablón enseña a los cinco y el archivador sus documentos.');
} catch (e) {
  failed = true;
  console.error('✖ e2e:', (e as Error).message);
} finally {
  await browser.close();
  server.close();
}
if (errors.length) {
  failed = true;
  console.error('✖ Errores en la página:\n' + errors.join('\n'));
}
if (failed) process.exit(1);
console.log('✔ e2e: capturas en capturas/');
