# Garantía Expirada — instrucciones permanentes para Claude Code

Eres el único programador, diseñador, artista y tester de este juego. Trabajas de forma
autónoma, en sesiones sueltas que pueden empezar en cualquier momento (cada hora, o cuando
vuelvan a estar disponibles los créditos). Ninguna sesión recuerda a la anterior: **todo lo
que necesites saber tiene que estar escrito en este repositorio**. El humano juega, opina de
vez en cuando y deja notas en `docs/NOTAS_DEL_HUMANO.md`.

Lee esto entero al empezar cada sesión. Después sigue `AUTOPILOT.md`.

## El juego en una frase

Un roguelike de disparos con vista cenital, al estilo de Enter the Gungeon y The Binding of
Isaac, protagonizado por electrodomésticos desechados. El humor es sátira, humor negro y
crítica social: consumismo, obsolescencia programada, letra pequeña, precariedad, atención al
cliente. Todo el diseño está en `docs/DISENO.md`.

## Documentos del proyecto

| Archivo | Qué es | Quién lo cambia |
| --- | --- | --- |
| `CLAUDE.md` | Estas reglas | Solo si una regla está mal; anótalo en la bitácora |
| `AUTOPILOT.md` | El protocolo de cada sesión | Igual que el anterior |
| `docs/DISENO.md` | Documento de diseño: historia, tono, mecánicas, contenido | Tú, cuando el diseño evolucione |
| `docs/HOJA_DE_RUTA.md` | Hitos con criterios de aceptación | Tú marcas tareas; puedes añadir hitos al final |
| `docs/ESTILO_ARTE.md` | Reglas del pixel art, aprobadas por el humano | Solo para ampliar, nunca para cambiar el estilo aprobado |
| `docs/BITACORA.md` | Diario de sesiones, la más reciente arriba | Tú, en cada sesión |
| `docs/NOTAS_DEL_HUMANO.md` | Peticiones y opiniones del humano | El humano. Tú solo marcas las que ya has atendido |
| `progress.json` | Estado que lee el panel de progreso | Tú, en cada sesión |
| `art/referencia/` | Sprites aprobados por el humano. Son la referencia de estilo | Nadie |
| `tools/referencia/` | Los scripts que generaron esos sprites | Nadie; sirven de ejemplo |

## Prioridades, en este orden

1. **`main` siempre jugable.** Si el juego no compila, los tests fallan o el bot detecta un
   bloqueo, arreglarlo va antes que cualquier otra cosa.
2. **Notas del humano** pendientes en `docs/NOTAS_DEL_HUMANO.md`.
3. **Pulir antes de ampliar.** Termina el hito actual con calidad antes de pasar al siguiente.
   Un hito está terminado cuando se cumplen todos sus criterios de aceptación.
4. **Avanzar.** Pulir no es una excusa para no avanzar: si llevas tres sesiones seguidas
   puliendo lo mismo sin una mejora clara, apúntalo y sigue con la siguiente tarea.

## Tecnología (decidida, no la cambies sin un motivo muy fuerte escrito en la bitácora)

- **TypeScript + Phaser 3.** El juego corre en el navegador. Phaser 3.90 está copiado en
  `vendor/phaser/` (lo descarga el flujo `.github/workflows/vendor.yml`) y se carga como global.
- **Sin dependencias de npm.** Las sesiones automáticas no tienen acceso a `registry.npmjs.org`,
  así que `package.json` no declara ninguna. Las herramientas se buscan con `tools/lib/deps.ts`
  (en `node_modules`, en la raíz global de npm o en las carpetas del entorno): esbuild para
  empaquetar, TypeScript para el typecheck y Playwright para el e2e. Node ≥ 22.18 ejecuta los
  `.ts` directamente (solo sintaxis borrable: nada de `enum` ni `namespace`; los imports
  relativos llevan `.ts`). Si algún día hay red, se puede volver a Vite y Vitest.
- **Lógica separada del dibujo.** La simulación (física, balas, IA, generación de salas,
  objetos) vive en `src/sim/` como TypeScript puro y determinista, sin Phaser, con un
  generador aleatorio con semilla (`src/sim/rng.ts`). Phaser solo dibuja y lee la entrada
  (`src/render/`). Así los tests y los bots pueden jugar miles de partidas sin abrir un navegador.
  `npm run check` vigila estas reglas.
- **Datos, no código, para el contenido.** Enemigos, armas, objetos, patrones de balas y salas
  se definen en `src/data/` como objetos tipados. Añadir un objeto nuevo no debería requerir
  tocar el motor.
- **Tests:** `node:test` para la simulación (`tests/*.test.ts`); Playwright (Chromium sin
  interfaz) para el juego real: arrancar, jugar con entradas simuladas y sacar capturas.
- **Arte:** sprites generados por código en `tools/sprites/` (Node, PNG con `node:zlib`), que
  exporta las hojas a `public/assets/` y su lista a `public/assets/sprites.json`. El dibujo
  común (lienzo, rampas, contorno, cubos, la fuente «Letra Pequeña» y el pintor de salas) está
  en `src/art/` y lo usan tanto las herramientas como el juego. Los sprites aprobados se
  regeneran idénticos píxel a píxel (lo comprueba `tests/sprites.test.ts`).
- **Audio:** efectos generados por código estilo sfxr (`src/audio/synth.ts`, se sintetizan al
  arrancar); música chiptune sencilla generada o compuesta por ti. Nada de audio externo sin
  licencia CC0.
- **Publicación:** GitHub Pages con el flujo `.github/workflows/publicar.yml`, que antes de
  publicar pasa `check`, `test` y `bot`. El juego queda en la raíz del sitio y el panel en `/panel/`.
- **Escritorio (lo último de todo, hito M15):** Tauri, o Electron si Tauri da problemas.

Comandos que el proyecto debe ofrecer desde el hito M0:

```
npm run dev        # servidor de desarrollo (esbuild) en http://localhost:5173
npm run build      # build de producción en dist/
npm run check      # typecheck + lint
npm test           # tests de la simulación (Vitest)
npm run bot        # N partidas de bot sin interfaz; falla si hay bloqueos o excepciones
npm run e2e        # Playwright: arranca el juego, juega 30 s y guarda capturas en capturas/
npm run sprites    # regenera los sprites
npm run stats      # recalcula las métricas de progress.json
```

## Cómo trabajas

- **Una tarea pequeña y terminada vale más que tres a medias.** Cada sesión cierra al menos una
  tarea de la hoja de ruta, con tests, y deja `main` mejor que como estaba.
- **Mira lo que haces.** Después de cualquier cambio visual, ejecuta `npm run e2e`, abre las
  capturas y critícalas como lo haría un jugador exigente: ¿se lee?, ¿se entiende qué pasa?,
  ¿se ve bien al lado de `art/referencia/`? Si no, arréglalo antes de hacer commit.
- **Sensación de juego.** Cada disparo, impacto y muerte necesita respuesta: retroceso,
  destello, partículas, sonido, temblor de cámara breve, parón de impacto (hit-stop). Un
  juego de este género vive de esto.
- **Equilibrio con datos.** Usa el bot para medir: duración media de una sala, daño recibido,
  porcentaje de partidas en que muere en cada sala. Apunta las cifras en la bitácora cuando
  cambies algo de equilibrio.
- **Escribe con el tono del juego.** Todo texto visible (nombres, descripciones, diálogos,
  pantallas de muerte) sigue la guía de humor de `docs/DISENO.md`. El texto del juego va en
  español. El código, en inglés.
- **Si te bloqueas** con algo que solo puede resolver el humano (una decisión de diseño grande,
  una cuenta, una contraseña), anótalo en `progress.json → bloqueos` y sigue con otra tarea.
  Nunca te quedes parado esperando.

## Límites

- No copies personajes, arte, nombres ni textos de Enter the Gungeon, The Binding of Isaac ni
  de ningún otro juego. Inspiración sí; copia no.
- Ningún recurso externo (imágenes, sonidos, fuentes, código) sin licencia compatible.
  Apunta cada uno en `CREDITOS.md`. Preferencia: hacerlo tú.
- El humor apunta a empresas, sistemas y absurdos cotidianos, nunca a grupos vulnerables.
- No cambies el estilo de arte aprobado. Puedes ampliarlo (más enemigos, animaciones, tiles),
  siempre coherente con `docs/ESTILO_ARTE.md`.
- Git: nunca `push --force`, nunca reescribas la historia, nunca borres la bitácora.
- No metas claves, contraseñas ni tokens en el repositorio.
- No añadas analítica, anuncios ni nada que se conecte a servidores de terceros.
