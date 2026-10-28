# Bitácora

La entrada más reciente va arriba. Cada sesión añade una.

## 2026-10-28 20:00 — Hito M0 (terminado) y M1 — Cimientos y primera sala jugable

- Hecho: M0 completo. Proyecto TypeScript + Phaser 3.90 con resolución 480 × 270 y zoom entero; `src/sim/` (simulación pura y determinista con `Rng` sfc32), `src/data/` (personaje, arma, accesorios, maniquí y sala como datos), `src/art/` (lienzo, rampas, contorno, cubos, fuente «Letra Pequeña» y pintor de salas), `src/render/` (Phaser) y `src/audio/` (sintetizador estilo sfxr). Los comandos `dev`, `build`, `check`, `test`, `bot`, `e2e`, `sprites` y `stats` funcionan. `npm run sprites` porta `build4.py`/`build2.py`/`build.py` y regenera los sprites aprobados **idénticos píxel a píxel** (test incluido; hubo que imitar el redondeo bancario de Python al mezclar alfa). El flujo de Pages ahora pasa check, tests y bot antes de publicar.
- Hecho (M1, nota del humano): la Sala de Pruebas de Devoluciones (26 × 16 casillas) con la tostadora: andar en 8 direcciones con aceleración y frenada cortas, animación de reposo y de andar, apuntar con ratón con el Secador girando en la mano flotante, disparo con cadencia, dispersión, retroceso, fogonazo y pelusas como casquillos, recarga (automática y con R), esquiva rodando (≈3 casillas, 0,4 s invulnerable, enfriamiento, destello), colisiones con paredes, cajas, bidones y carros, cámara que se adelanta hacia la mira, temblor, parón de impacto, chispas, polvo, números de daño y efectos de sonido sintetizados. Dos «Maniquíes de Rebajas» (diseño nuevo: peluca torcida, bigote pintado con rotulador, diana en la camiseta, etiqueta de REBAJAS) como blanco. Mando programado (sin probar).
- Decisiones:
  - **El entorno de las sesiones automáticas no llega a npm** (`registry.npmjs.org` responde 403 en el proxy; tampoco jsDelivr ni unpkg). Por eso: (1) Phaser 3.90.0 lo descarga un flujo de GitHub Actions (`vendor.yml`) a `vendor/phaser/` y se carga como global; (2) **Vite → esbuild** y **Vitest → `node:test`**, que ya están en el entorno o en Node; (3) `package.json` no tiene dependencias y `tools/lib/deps.ts` busca las herramientas donde estén; (4) ESLint sin plugin de TypeScript no sirve, así que `npm run check` = `tsc` + reglas propias en `tools/lint.ts` (simulación sin Phaser ni DOM, sin `Math.random`, sin `any`, sin red externa, imports con `.ts`). CLAUDE.md actualizado. Si algún día hay red, volver a Vite/Vitest es fácil: el código no depende de ellos.
  - Los `.ts` se ejecutan con Node 22 sin compilar (solo sintaxis borrable).
  - La fuente del juego es propia y solo de mayúsculas (con tildes, Ñ, ¿, ¡, «»). Las minúsculas, cuando haga falta texto largo.
  - El arma pivota alrededor de un punto 7 px sobre los pies y se apunta desde ahí, para que las balas vayan exactamente a la mira.
  - No se dispara mientras se rueda (como en el género).
  - Las salas se pintan en tiempo de ejecución con el mismo método que la maqueta aprobada, para que el generador de M3 pueda pintar cualquier forma.
- Medidas: 43 tests en verde. Bot: 200 partidas de 60 s, 0 fallos, 134 disparos de media, 89,7 % de precisión contra los maniquíes, 5 atascos breves (rodea sola los obstáculos), 5,7 ms por partida. e2e: 30 s a ~60 fps, 93 disparos, 49 impactos.
- Problemas conocidos: el mando no se ha probado; la tostadora todavía no tiene animaciones de golpe ni de muerte (no hay daño aún); el giro al rodar es una rotación del sprite, no fotogramas dibujados; la nube de polvo es sencilla.
- Siguiente paso: cerrar M1 (fotogramas de golpe y muerte de la tostadora, probar el mando simulando la Gamepad API en el e2e) y empezar M2 por el sistema declarativo de patrones de balas.

## 2026-10-28 — Antes de M0 — Kit de arranque

- Hecho: documento de diseño, estilo de arte aprobado por el humano, hoja de ruta, panel de progreso, protocolo de sesión autónoma, flujo de publicación y sprites de referencia.
- Decisiones: TypeScript + Phaser 3 + Vite; lógica pura con semilla separada del dibujo para poder probar con bots; arte generado por código.
- Siguiente paso: empezar el hito M0 por el proyecto Vite + Phaser y la estructura de carpetas.
