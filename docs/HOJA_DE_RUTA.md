# Hoja de ruta

Cada hito tiene tareas y **criterios de aceptación**. Un hito solo está terminado cuando se
cumplen todos sus criterios. Las tareas se pueden dividir, reordenar dentro del hito o
ampliar. Cuando se acabe la lista, Claude escribe hitos nuevos al final.

Estados: `- [ ]` pendiente · `- [x]` hecha.

## Estimación de tiempo (revisada el 2026-10-29, 13:55)

Cuento en **sesiones de trabajo** (cada una cierra una tarea, a veces dos). Ritmo medido: entre
el 28 y el 29 de octubre se cerraron 47 tareas (M0–M4 y medio M5) en unas 33 sesiones. Las
tareas que quedan son más gordas (una planta entera, un personaje con historia), así que estimo
por tarea y no por hito. La misma tabla está en `progress.json → estimacion` y el panel la
muestra junto a cada hito; si un hito se desvía mucho, se corrige aquí y allí.

| Hito | Sesiones | Por qué |
| --- | ---: | --- |
| M5 · Armas, objetos y sinergias | hecho | Terminado el 29 a las 11:55 |
| M6 · Partida completa | hecho | Terminado el 29 a las 13:55 (en 10 sesiones, lo estimado) |
| M7 · Pulido | hecho | Terminado el 29 a las 17:40 (en unas 12 sesiones) |
| M8 · Planta 2: Informática | 13 | Casillas 1, entornos 1, enemigos 4, jefe 5 (como la Nevera), objetos 2 |
| M9 · El centro y la historia | 10 | Mostrador, PNJs con diálogos, desbloqueos, objetos de historia |
| M10 · Plantas 3 y 4 | hecho | Terminado el 5 de noviembre (34 tareas cerradas; se estimaron 24 sesiones) |
| M11 · Planta 5 | hecho | Terminado el 11 de noviembre (en unas 25 tareas; se estimaron 22) |
| M12 · Servicio Técnico | 12 | Requisitos, piso especial, final verdadero y créditos |
| M13 · Cinco personajes | 14 | Cuatro personajes nuevos con arma, habilidad, historia y final |
| M14 · Más contenido | 30 | De ~5 armas, ~50 objetos y ~22 enemigos a 30/80/30, más 2 jefes |
| M14b · Notas del 13 de noviembre | 22 | Vida, economía, cofres, corazones, bidones, mesas, saltar, hitboxes; enemigos (5) y jefes (2) únicos; escenarios (3) |
| M14c · Arte nuevo | 26 | Guía nueva, herramientas, entrada de arte de fuera, personajes, enemigos, jefes, suelos, props, efectos, interfaz, luz |
| M15 · Escritorio | 6 | Empaquetado, guardado en disco y flujo de instaladores |
| **Quedan** (13 de noviembre) | **~100** | **~130 con un 30 % de margen**. M14b y M14c suman 48 sesiones, un 77 % más que las 62 que quedaban (el humano pidió al menos un 50 % más) |

En calendario: con una sesión por hora sin parones, la primera versión jugable (M6) llegaría en
medio día o un día, la versión pulida (M7) en uno o dos días y el juego completo con escritorio
(M15) en unos 6–8 días. Si las sesiones se espacian por los créditos (unas 10 al día), unas 2–3
semanas. Es una estimación, no una promesa: el pulido de cada planta puede pedir más vueltas.

---

## M0 · Cimientos (hecho)

Que exista un proyecto sano, con tests, bot, capturas y publicación automática.

- [x] Proyecto TypeScript + Phaser 3 con `pixelArt: true`, resolución interna 480 × 270 escalada con enteros. (Sin Vite: esbuild; ver bitácora 2026-10-28.)
- [x] Estructura `src/sim/` (lógica pura con semilla), `src/render/` (Phaser), `src/data/` (contenido) y `src/art/` (dibujo compartido).
- [x] Generador aleatorio con semilla y su test.
- [x] Tests de la simulación configurados (`node:test` en lugar de Vitest; ver bitácora).
- [x] `npm run bot`: ejecuta N partidas de la simulación sin interfaz y falla con excepciones, invariantes rotos o falta de determinismo.
- [x] `npm run e2e`: arranca el build en Chromium sin interfaz, juega 30 s con teclado y ratón simulados y guarda capturas en `capturas/`.
- [x] `npm run sprites`: porta a TypeScript el método de `tools/referencia/` y regenera los sprites aprobados (idénticos píxel a píxel) en `public/assets/`.
- [x] `npm run stats`: calcula las métricas y el avance de los hitos y los escribe en `progress.json`.
- [x] Typecheck y reglas de lint propias en `npm run check`.
- [x] El flujo de GitHub Actions comprueba, construye y publica el juego y el panel en GitHub Pages.

**Criterios de aceptación:** todos los comandos de `CLAUDE.md` funcionan; `main` publica en
Pages; el panel muestra datos reales; la escena de prueba enseña la Tostadora en una sala.

## M1 · Bucle de combate (hecho)

Que moverse, apuntar, disparar y rodar se sienta muy bien antes de añadir nada más.

- [x] Movimiento en 8 direcciones con aceleración y frenada cortas; el sprite mira hacia el cursor.
- [x] Animaciones de la Tostadora: reposo, andar y rodar. (Golpe y muerte pasan a M2, con el daño.)
- [x] Apuntar con ratón; el arma rota alrededor de la mano flotante.
- [x] Disparo del Secador Mágnum: cadencia, dispersión, retroceso, fogonazo, casquillos (pelusas).
- [x] Esquiva rodando con invulnerabilidad, enfriamiento y destello.
- [x] Colisiones con paredes y obstáculos (cajas, barriles).
- [x] Cámara que sigue al jugador y se adelanta un poco hacia donde apunta.
- [x] Respuesta al impacto: temblor de cámara, parón de impacto, partículas, números o destellos.
- [x] Soporte de mando (Gamepad API). (Probado en el e2e con un mando simulado; falta probar uno de verdad.)
- [x] Sala de pruebas con un muñeco de práctica (un maniquí de tienda) para probar el arma.
- [x] Efectos de sonido generados: disparo, rodar, golpe.

**Criterios de aceptación:** las capturas muestran la tostadora en movimiento y disparando;
la entrada responde en menos de un fotograma; ningún test ni bot falla.

## M2 · Enemigos y patrones de balas (hecho)

- [x] Sistema de patrones de balas declarativo (anillo, abanico, espiral, ráfaga, onda) con tests.
- [x] Telegrafía de ataques (parpadeo y sonido previo).
- [x] Aspirador Desahuciado (carga en línea recta).
- [x] Microondas Sin Seguro (anillos de ondas).
- [x] Bombilla de Bajo Consumo (espirales) con su polilla.
- [x] Primer enemigo nuevo de `docs/DISENO.md`: Batidora de Mano (persigue, se lanza cuerpo a cuerpo y entra en TURBO), diseñada y dibujada al estilo aprobado.
- [x] Segundo enemigo nuevo de `docs/DISENO.md`: Mando a Distancia (débil, viene en grupo de tres, dispara y se apaga como una tele vieja para aparecer en otro sitio), diseñado y dibujado al estilo aprobado.
- [x] Vida, daño, muerte con desmontaje en piezas y botín (cupones). (Los enemigos; el daño al jugador va con los corazones.)
- [x] Animaciones de golpe y muerte de la Tostadora (se desmonta: tostadas, muelle, tornillos) y parte de baja provisional.
- [x] Corazones del jugador y HUD (corazones, munición, cupones, objeto activo). (La ranura del objeto activo está vacía hasta M5.)
- [x] IA de los bots capaz de esquivar de forma básica, para medir dificultad.

**Criterios de aceptación:** una sala con los 5 enemigos es jugable y legible; el bot sobrevive
a una sala media más del 40 % de las veces.
*Cumplidos el 2026-10-29: la Sala de Pruebas con los seis enemigos (y la polilla) se lee bien en
las capturas del e2e; el bot la vacía sin caer el 52,5 % de las veces y sobrevive el 92 %.*

## M3 · Salas y planta (hecho)

- [x] Plantillas de sala hechas a mano (al menos 15) con huecos para enemigos y obstáculos.
- [x] Generador de planta: grafo de 10–15 salas con entrada, combate, tesoro, tienda, secreta y jefe; tests de conectividad con 10.000 semillas. (La distribución; la planta jugable llega con las plantillas, las puertas y la transición.)
- [x] Puertas que se cierran durante el combate (persianas con piloto rojo). (Cerrar y abrir; cruzarlas llega con la transición entre salas.)
- [x] Minimapa.
- [x] Juego de casillas de la planta 1 (almacén) con variaciones y decoración.
- [x] Transición entre salas. (Fundido entre salas; la planta generada es ya la partida por defecto. Las puertas secretas siguen cerradas hasta que haya algo que las abra.)

**Criterios de aceptación:** 10.000 semillas generan plantas válidas; el bot recorre una planta
entera sin quedarse atascado.
*Cumplidos el 2026-10-29: las 10.000 semillas del test de `tests/floor.test.ts` dan plantas
válidas, y sin daño el bot recorre la planta entera en 20 de 20 plantas (y 100 de 100 en una
prueba aparte) sin atascarse.*

## M4 · La Nevera Suprema (hecho)

- [x] Sala del jefe con presentación (nombre y lema en pantalla).
- [x] Fase 1: ráfagas de cubitos, escarcha que ralentiza.
- [x] Fase 2: tarjetas de fidelización que persiguen; la nevera se abre y escupe productos caducados.
- [x] Barra de vida del jefe, transición de fase, muerte espectacular.
- [x] Recompensa y subida a la siguiente planta (de momento, pantalla de victoria).

**Criterios de aceptación:** el combate dura entre 60 y 120 s para el bot; las dos fases se
distinguen claramente en las capturas.

## M5 · Armas, objetos y sinergias (hecho)

- [x] Sistema de modificadores de estadísticas y de comportamiento de balas.
- [x] 3 armas (Secador Mágnum, Grapadora Táctica y una nueva).
- [x] 10 objetos pasivos, con nombre y descripción según la guía de humor.
- [x] 3 objetos activos (tecla Q), con pilas como cargas, con nombre y descripción según la guía de humor.
- [x] Al menos 4 sinergias con texto propio.
- [x] Cofres que se abren con tickets (la Caja Fuerte de Devoluciones; los tickets salen al limpiar salas).
- [x] Tienda con vendedor y precios en cupones (también vende tickets).
- [x] Ventana de descripción al recoger un objeto.

**Criterios de aceptación:** cada objeto tiene un test de su efecto; las partidas del bot con
semillas distintas acaban con builds distintas.

## M6 · Partida completa (primera versión jugable) (hecho)

- [x] Pausa (Esc, P o Start) con opciones (volumen de efectos, pantalla completa, temblor de
  cámara; se guardan en el navegador) y la lista de controles.
- [x] Menú principal (empezar, opciones, controles, créditos), con la misma maquinaria de la pausa.
- [x] Inventario en la pausa (nota del humano): los objetos que llevas con su descripción, el
  objeto activo, las sinergias encendidas y las estadísticas actuales del personaje y del arma
  (daño, cadencia, alcance, velocidad), con lo que suma o resta cada objeto.
- [x] Interfaz limpia (nota del humano): revisar el HUD entero para que no se pise nada y se lea
  de un vistazo; los textos flotantes no se amontonan.
- [x] Parte de baja al morir (causa, vida útil, recomendación del fabricante, equipaje; Esc a la portada).
- [x] Pantalla de victoria (de momento, la de planta superada: «Incidencia resuelta»; la de la partida entera llegará con la última planta).
- [x] Guardado local de desbloqueos y estadísticas (perfil con partidas, jefas, victorias por personaje y todo lo descubierto; «Historial» en la portada).
- [x] Una pista de música chiptune para la planta y otra para el jefe.
- [x] Revisión completa de textos con la guía de humor (y `tests/textos.test.ts`, que la vigila).

**Criterios de aceptación:** se cumple el «contenido mínimo de la primera versión jugable» de
`docs/DISENO.md`; el humano puede jugar una partida completa en el enlace publicado.

## M7 · Pulido de la primera versión (hecho)

- [x] Equilibrio con datos del bot: tiempo por sala, daño recibido, tasa de victoria. Objetivo
  (nota del humano): dificultad media-alta; la planta 1 se gana con práctica, no a la primera.
  Medido con partidas enteras (jefa y montacargas): el bot gana el 45 % de las plantas; banda
  buscada, 35–55 % (el bot ve todas las balas y apunta casi perfecto: una persona, menos).
- [x] Armas con diferencias reales (nota del humano): tabla de daño por segundo, alcance y
  cadencia medida por el bot; cada arma gana claramente en algo y pierde en otra cosa
  (tabla en `docs/DISENO.md`; `npm run armas` la mide).
- [x] Repaso de los objetos pasivos (nota del humano): la mayoría da y quita (como ya hacen),
  algunos solo dan; ninguno es inútil ni obligatorio (`npm run objetos` lo mide).
- [x] Rendimiento: 60 fps estables con 300 balas en pantalla (`npm run rendimiento`).
- [x] Accesibilidad, parte 1: opción de quitar el temblor (desde M6) y **Destellos suaves** (sin blancos sólidos ni parpadeos rápidos).
- [x] Accesibilidad, parte 2a: **Texto grande** (ventana de descripción, letreros, sinergias, nombre de sala y bocadillos de la caja a doble tamaño).
- [x] Accesibilidad, parte 2b: texto grande en el parte de baja y en la planta superada.
- [x] Accesibilidad, parte 2c: texto grande en el inventario (la ventana de descripción grande, como emergente sobre la parte de abajo; la lista a dos líneas).
- [x] Accesibilidad, parte 3: remapeo de controles (teclado; el mando, con su soporte completo en M15).
- [x] Animaciones completas de todos los enemigos (reposo con respiración y paso de 4 fotogramas por distancia; golpe y muerte ya eran comunes: destello blanco y despiece).
- [x] Lista de errores conocidos vacía (`docs/ERRORES_CONOCIDOS.md`: las secciones «Errores» y «Asperezas» sin nada).
  - [x] Parte 1: reunir la lista (repasando cada «Problema conocido» de la bitácora) y arreglar las rendijas entre obstáculos, los enemigos que se amontonaban, los cupones de la jefa sobre el montacargas y el montacargas que volvía a subir.
  - [x] Parte 2: la sección «Errores» (la jefa cortada al empezar, trozos que cruzan paredes, parón del primer clic, e2e de la jefa desde la planta).
  - [x] Parte 3: las asperezas (portada, letreros con placa, objetos del HUD que se deslizan, barra del inventario, avisos fijos con destellos suaves, tarjeta de la jefa y textos flotantes con texto grande); las que no eran errores, a su sección con el motivo.

## M8 · Planta 2: Informática (hecho)

- [x] Juego de casillas y color propio. (`src/art/informatica.ts`; se ve con `?planta=2`.)
- Entornos bien diseñados sin perder la generación procedural (nota del humano): plantillas
  hechas a mano con variantes (obstáculos, decorado y enemigos que cambian con la semilla),
  cada sala con una idea de combate propia; repasar también las de la planta 1. En tres partes:
  - [x] (1) Variantes: grupos de estanterías (`1`–`9` en la plantilla) que salen o no con la
    semilla, salas de combate reflejadas en las plantas generadas, y la idea de combate de cada
    sala de la planta 1 escrita en su plantilla (`idea`).
  - [x] (2) Obstáculos y decorado propios de Informática (lo que sale en los huecos `o` y las cajas
    de la planta 2) y persianas a juego.
  - [x] (3a) Plantillas propias de la planta 2: las seis primeras de combate (una de cada tamaño),
    cada una con su idea y sus grupos; la planta 2 se arma con ellas (`templatesOf(kind, 2)`).
  - [x] (3b) Seis plantillas de combate más para la planta 2 (para llegar a 12). Las salas
    especiales siguen siendo las del almacén; la del jefe propia va con el Router.
- [x] Encadenar plantas: al bajar en el montacargas tras la jefa se sigue en la planta 2, con la
  misma tostadora, sus armas y sus objetos.
- 4 enemigos nuevos, uno por tarea:
  - [x] (1) Impresora que se Atasca (torreta que se atasca: una ventana para atacarla y un estallido al soltarse).
  - [x] (2) Cargador Falso (espera tirado como cebo, salta al acercarte y da un calambre en corro).
  - [x] (3) Ratón Inalámbrico sin Pilas (se congela sin señal, marca dónde va a aparecer, aparece y hace clic).
  - [x] (4) Webcam Siempre Encendida (te graba si te ve; si no te escondes, comparte pantalla y
    los demás atacan a la vez y con prisa).
- Jefe: El Router del Wifi (con su sala propia en la planta 2). En partes:
  - [x] (1) Su diseño en `docs/DISENO.md` y las salas especiales propias de Informática: tesoro,
    tienda, secreta y la sala del jefe (Sala de Redes). Hasta que llegue el Router, la Nevera
    pelea en ella.
  - [x] (2a) Sprites del Router (reposo, andar y el reinicio con las luces encendiéndose una a una)
    y de su repetidor.
  - [x] (2b) El Router en la simulación: fases, repetidores y reinicio, en la planta 2 en lugar de
    la Nevera, con su cartel y sus sonidos.
- [x] La planta 2 entera medida con el bot (`npm run bot` juega también plantas 2 completas, con
  lo que se trae de la 1) y su dificultad ajustada: más difícil que la 1 sin ser un muro (el muro
  de verdad es la 3, según la nota del humano).
- [x] 10 objetos nuevos, en partes:
  - [x] (1) Cinco pasivos de Informática que solo salen desde la planta 2 (`level: 2`, mazo por
    planta con `itemsUpTo`): Pendrive de 2 GB, Antivirus Gratuito, Cable HDMI Dorado, Ventilador
    de Portátil y Actualización Obligatoria.
  - [x] (2a) Tres con efectos nuevos (no solo cifras): Ratón Gaming RGB (golpes críticos),
    Batería Externa (una pila más por sala) y Cookies de Terceros (cupones de más por baja).
  - [x] (2b) Modo Avión (la voltereta corta balas) y Copia de Seguridad (vuelve una vez de la
    baja con un corazón y se gasta), y dos sinergias: Setup Gamer (Ratón + Ventilador) y
    Conflicto de Software (Antivirus + Actualización).

## M9 · El centro y la historia (hecho)

- [x] (0) El centro diseñado en `docs/DISENO.md` («El Mostrador de Devoluciones») y el hito partido en tareas.
- Mostrador de Devoluciones como centro entre partidas. En partes:
  - [x] (1) La sala en la simulación: plantilla `mostrador` (clase `hub`, sin enemigos ni
    persianas), con el mostrador, la cola de cinta, el tablón, el archivador, el teléfono y la
    **cinta de entrada al almacén**: pisarla termina el centro y empieza una partida (evento y
    `World.leaveHub`). Tests: se recorre entera, nada hace daño, la cinta lleva a una planta 1.
  - [x] (2a) Su arte: sprites del mostrador con la Caja, los postes y su cinta, la máquina de
    turnos, el archivador, el Chatarrero, el tablón, el teléfono y la cinta del almacén con sus
    cortinas y el cartel «Mercancía devuelta». Una hoja de contacto para revisarlos.
  - [x] (2b) El centro en el juego: «Partida nueva» de la portada lleva al Mostrador; la cinta
    empieza la partida; al acabar una partida (el parte de baja o la última planta) se vuelve a
    él. Capturas.
- PNJs con diálogos que cambian con el progreso (los textos y su elección, puros y con tests,
  a partir de `Profile`). En partes:
  - [x] (3a) Los textos de los tres PNJs y de la máquina de turnos, y su elección según el perfil
    (`src/data/dialogues.ts`, `src/sim/dialogue.ts`; `Profile.last` recuerda cómo acabó la última
    partida). Tests con perfiles hechos a mano. Las partes (3)–(5) quedan para ponerlos en el juego.
  - [x] (3) La Caja de Devoluciones (comenta la última partida: la causa de baja, la planta a la
    que llegó, el jefe que la tumbó) y el bocadillo de los PNJs (el de la tienda, reutilizado).
  - [x] (4) El teléfono del Servicio Técnico (la grabación avanza con los jefes vencidos y va
    soltando la historia) y la máquina de turnos (su número es el de partidas jugadas).
  - [x] (5) El Chatarrero (sale tras vencer al primer jefe; da pistas de los desbloqueos).
- [x] (6a) El mecanismo: `src/data/unlocks.ts` (los cinco del tablón con su condición y su texto),
  `src/sim/unlocks.ts` (comprobar, avance, `rosterBoard`) y `Profile.unlocked`, comprobado en
  cada `recordRun` y al leer una partida guardada. Falta el tablón en el centro (6).
- [x] (6) Desbloqueo de personajes: condiciones en datos (`src/data/`), guardadas en `Profile`,
  comprobadas al acabar cada partida; el tablón «Productos en Exposición» del centro enseña a
  los cinco con su condición (siluetas los bloqueados). Los personajes nuevos jugables llegan
  en M13; aquí, el mecanismo y el tablón.
- Objetos de historia que revelan poco a poco la verdad del Servicio Técnico. En partes:
  - [x] (7a) Los documentos en datos (`src/data/lore.ts`: uno por jefe y uno por sala secreta de
    las plantas 1 y 2), `Profile.docs` (los de los jefes al acabar la partida; los de las salas
    secretas llegan en `RunResult.docs`) y `src/sim/archive.ts` para el archivador. Falta recogerlos
    en la sala secreta y el archivador en el centro (7).
  - [x] (7b) El archivador «Reclamaciones sin Resolver» en el centro: al acercarse, un panel con
    la lista (los que faltan, «Expediente extraviado»; lo nuevo, marcado) y la hoja abierta; la
    tecla de usar pasa la hoja (`src/render/archivo.ts`, `firstCursor`/`nextCursor`).
  - [x] (7c) Recoger el documento de la sala secreta de cada planta (un papel en el suelo que se
    coge al pisarlo, con su aviso) y que llegue a `RunResult.docs` al acabar la partida.
  - [x] (7) Documentos de historia en datos (uno por jefe vencido por primera vez y alguno en las
    salas secretas), guardados en `Profile` y leídos en el archivador «Reclamaciones sin
    Resolver» del centro.
  - [x] (8) Repaso del centro: que se lea, que los textos no se repitan y que el bot lo cruce.

**Criterios de aceptación:** al abrir el juego y al acabar cada partida se está en el Mostrador;
desde él se empieza una partida andando; los tres PNJs dicen cosas distintas según el progreso
(tests con perfiles hechos a mano); el tablón y el archivador enseñan lo desbloqueado y lo que
falta; todo se guarda entre sesiones del navegador.

## M9b · Lo que pidió el humano el 30 de octubre (hecho)

Las dos primeras notas del humano del 2026-10-30, partidas en tareas. Van antes que M10 porque
las notas del humano tienen prioridad, y porque cambian la economía y la dificultad sobre las que
se van a medir las plantas 3 y 4. Lo que la nota marca «para más adelante» (jefes al azar en cada
planta, glosario, logros que desbloquean contenido, PNJs en las plantas, una portada más grande y
el pixel art más distinguible) está en «Pautas del humano (2026-10-30)» de `docs/DISENO.md` y
repartido en M12–M14.

- [x] (1) Fallo: si se entra en una sala con una tecla de movimiento pulsada, el personaje no anda
  hasta soltarla y volver a pulsarla.
- [x] (2) Fuera los números de daño sobre los enemigos y el texto que sale al matar a uno.
- [x] (3) Balas enemigas más grandes y más difíciles de esquivar (sprites y caja de golpe),
  medido con el bot.
- [x] (4) Botón de interactuar (una tecla nueva, reasignable): hablar con los PNJs, comprar en la
  tienda y abrir cofres ya no se hace pisando, sino con ese botón. Con su aviso en pantalla.
- [x] (5) Economía más escasa: se empieza con 1 ticket; muchos menos cupones y tickets; los objetos
  solo salen de cofres o de la tienda (nunca sueltos en una sala); unos 2 cofres por planta y
  alguno más al limpiar salas; los cupones se recogen solos al limpiar la sala. Medido con el bot.
- [x] (6) Calidades de cofre: el de cartón (el normal) da pasivos o armas flojas; el bueno (raro)
  solo armas y objetos buenos. Cada objeto y arma lleva su calidad en los datos.
- [x] (7) Menos daño y menos estadística: las armas hacen menos daño de base y los objetos suben
  menos; el activo que curaba dos corazones en dos salas tarda muchas más salas o es de un solo uso.
  Medido con el bot.
- [x] (8) Jefes que se mueven, erráticos, y que van más deprisa (andar y disparar) cuanto menos
  vida les queda: la Nevera y el Router. Medido con el bot.
- [x] (9) La Música de Espera ya no congela al jefe: ralentiza sus balas y su movimiento.
- [x] (10) Los enemigos que esperan quietos a que te acerques (los cargadores falsos y similares) se
  activan solos al pasar un tiempo o al quedarse solos en la sala.
- [x] (11) Corazones que suben o bajan con objetos (contenedores de vida que se ganan y se pierden).
- [x] (12) Un escudo temporal con el aguante de un corazón, con una idea de la trama en vez de un
  escudo; y corazones especiales temporales (daño a toda la sala, más daño un rato…), cada uno con
  su sprite y su probabilidad: el escudo es lo más probable; cuanto más potente, más raro.
  - [x] (12a) El escudo: la Garantía Provisional, un corazón de papel que aguanta un corazón de
    daño y caduca al cambiar de planta. Sale a veces al limpiar una sala.
  - [x] (12b) Los corazones especiales temporales, cada uno con su sprite y su probabilidad (más
    raros que el escudo, y cuanto más potentes, más raros).
- [x] (13) Objetos del escenario: unos se vuelcan con el botón de interactuar y sirven de cobertura;
  otros explotan o hacen otras cosas.
  - [x] (13a) Los bidones de aceite usado aguantan unos disparos y explotan: dañan a enemigos y a la
    tostadora alrededor y encienden a los bidones vecinos.
  - [x] (13b) Muebles que se vuelcan con el botón de interactuar y paran balas por un lado.
- [x] (14) Sinergias indirectas: parejas de objetos que se complementan sin crear nada nuevo,
  pensadas y medidas.
- [x] (15) Repaso del equilibrio después de todo lo anterior: con las balas grandes, la escasez y
  los jefes nuevos el bot con daño ya no gana la planta 1 (0 de 20 el 2026-11-04). Difícil sí,
  imposible no: que el bot con daño la gane entre un 15 % y un 30 % de las veces (un humano que
  juega bien, bastante más), sin devolver la abundancia de objetos.

**Criterios de aceptación:** cada punto de las dos notas tiene su test o su medida; el bot sigue
pasando sin bloqueos; el juego es más difícil que antes según el bot (menos victorias contra los
jefes y menos plantas ganadas), y los números están en la bitácora.

## M10 · Plantas 3 y 4 (hecho)

- [x] Planta 3: Juguetería, con su juego de casillas, 4 enemigos nuevos, un jefe (El Muñeco de Moda)
  y 10 objetos. Diseño en `docs/DISENO.md` (enemigos, jefe, objetos y aspecto). En partes:
  - [x] (0) El diseño de la planta 3 y esta lista de tareas.
  - [x] (1) Juego de casillas y color propio (`src/art/jugueteria.ts`, se ve con `?planta=3`):
    suelo de goma EVA, pared de nubes, estanterías de cajas, obstáculos de los huecos `o` y
    persianas propias.
  - [x] (2a) Seis plantillas de combate propias de la planta 3, cada una con su idea y sus grupos.
  - [x] (2b) Seis plantillas de combate más.
  - [x] (2c) Las salas especiales propias (entrada, tesoro, tienda, secreta con su documento de
    historia, y el Escaparate de Novedades del jefe).
  - [x] (3) Encadenar: tras el Router se baja en el montacargas a la planta 3, con todo lo que se
    lleva; hasta que llegue el Muñeco, el Router pelea en el Escaparate.
  - 4 enemigos nuevos, uno por tarea (simulación, tests y captura; los sprites, juntos en la (4s)):
  - [x] (4s) Los sprites de los cuatro, con sus balas y lo que dejan en el suelo (el círculo del
    turno, la cinta de los postes, el escudo de preguntas frecuentes).
    - [x] (4a) Robot de Cuerda (rebota como una bola de billar; sin cuerda, quieto y frágil).
    - [x] (4b) Coche Teledirigido (arcos derrapando, embestida, vuelca contra la pared).
    - [x] (4c) Cubo de Piezas (siembra el suelo de piezas que hacen daño al andar, no al rodar).
    - [x] (4d) Sobre Sorpresa (al romperlo, sorpresa: repetidos, cupones o el Muñequito Dorado).
  - Jefe: El Muñeco de Moda. En partes:
    - [x] (5a) Sprites: con caja (reposo, andar, posar), las etiquetas de rebaja, la caja rota y
      sin ella; y los Muñequitos Repetidos.
    - [x] (5b) Fases 1 y 2 en la simulación (pasarela, rebajas y repetidos), cartel y sonidos.
    - [x] (5c) Fase 3 (liquidación: la caja rota se queda como obstáculo, espirales de pegatinas).
  - 10 objetos nuevos, en partes:
    - [x] (6a) Cinco de cifras o casi: Pilas No Incluidas, Muelle de Juguete, Bote de Purpurina, Juguete
      del Menú Infantil y Caja de Cartón Vacía.
    - [x] (6b1) Tres con efectos nuevos: Pegatina de Edición Limitada, Llave Allen Sobrante y Mando
      con Vibración; y la sinergia Unboxing (con la Caja de Cartón Vacía).
    - [x] (6b2) Plastilina Mezclada y Mascota Virtual, y la sinergia Manualidades.
  - [x] (7) La planta 3 medida con el bot y ajustada para que sea el muro: el bot con daño la
    supera menos de una vez de cada cuatro, y es donde más partidas acaban. Medido con
    `npm run plantas` (ver los criterios): la gana el 5 % de los que llegan, la que menos.
- [x] Planta 4: Oficinas, con su juego de casillas, 4 enemigos nuevos, un jefe (El Director de
  Recursos Inhumanos) y 10 objetos. Diseño en `docs/DISENO.md` (enemigos, jefe, objetos y aspecto).
  En partes:
  - [x] (0) El diseño de la planta 4 y esta lista de tareas.
  - [x] (1) Juego de casillas y color propio (`src/art/oficinas.ts`, se ve con `?planta=4`):
    moqueta gris con manchas de café, mamparas de cubículo, pared de pladur con vinilos de valores,
    archivadores, termos de café, ficus de plástico, mesas de oficina y persianas con «Reunión».
  - [x] (2a) Seis plantillas de combate propias de la planta 4, cada una con su idea y sus grupos.
  - [x] (2b) Seis plantillas de combate más.
  - [x] (2c) Las salas especiales propias (Recepción, Sala de Material, Economato, Papeles para
    Destruir con su acta de reunión, y la Sala de Juntas del jefe).
  - [x] (3) Encadenar: tras el Muñeco se sube a la planta 4, con todo lo que se lleva; hasta que
    llegue el Director, el Muñeco pelea en la Sala de Juntas.
  - 4 enemigos nuevos, uno por tarea (simulación, tests y captura; los sprites, juntos en la (4s)):
  - [x] (4s) Los sprites de los cuatro, con sus balas y lo que dejan en el suelo (el círculo del
    turno, la cinta de los postes, el escudo de preguntas frecuentes).
    - [x] (4a) Destructora de Documentos (siempre de cara, se traga las balas de frente).
    - [x] (4b) Fotocopiadora de Planta (copia a otro enemigo de la sala).
    - [x] (4c) Sello de Denegado (estampa tinta donde no se puede rodar).
    - [x] (4d) Climatizador Portátil (cono de aire que empuja y tuerce las balas).
  - Jefe: El Director de Recursos Inhumanos. En partes:
    - [x] (5a) Sprites: en la silla (reposo, impulso, lanzar), de pie (andar, girar), la silla
      sola, las tarjetas, las cartas de despido y las mamparas que se mueven; y la mesa larga de la
      Sala de Juntas (un objeto nuevo que para balas y no se vuelca), que la (2c) dejó sin poner.
    - [x] (5b) Fases 1 y 2 (cartas de despido, tarjetas, reestructuración de mamparas, sellos),
      cartel y sonidos.
    - [x] (5c) Fase 3 (la silla suelta que embiste y la línea de recortes).
  - 10 objetos nuevos, en partes:
    - [x] (6a) Cinco de cifras o casi: Taza de Mejor Empleado, Corbata de Lunes, Café de Máquina,
      Silla con Ruedas y Bola Antiestrés.
    - [x] (6b1) Tres de economía y plazos: Tarjeta de Fichar, Contrato en Prácticas y Acreditación
      de Visitante.
    - [x] (6b2) Pósit de Urgente y Responder a Todos, las sinergias Pausa para el Café y Cadena de
      Correos, y las dos indirectas (Silla + Etiqueta A+++, Bola + Batería Hinchada), medidas.
  - [x] (7) La planta 4 medida con el bot: el bot llega a ella en alguna partida, cada sala es
    algo más dura que las de la Juguetería, y aun así acaban menos partidas en la 4 que en la 3
    (porque llegan pocas). Medido a la vez que la de la planta 3.

**Criterios de aceptación:** se puede jugar de la planta 1 a la 4 seguidas; cada planta se
distingue a la primera en una captura; el bot llega a la planta 4 en alguna partida. Pasar de la
planta 3 tiene que ser difícil de verdad (nota del humano): el bot con daño la supera menos de
una vez de cada cuatro, y la planta 3 es donde más partidas acaban.

**Cómo se miden (2026-11-05):** desde M9b (el juego más difícil que pidió el humano) el bot gana
la planta 1 una vez de cada cinco o seis, así que en las partidas enteras de `npm run bot` no
llega nunca a la 3 y esos criterios no se pueden medir así. Se miden con `npm run plantas`: en
cada partida, las plantas de abajo se juegan sin daño (el bot recoge armas, objetos y cupones
como un jugador que las pasa) y cada planta se juega con daño desde esa llegada, con la vida
llena. «La planta 3 es donde más partidas acaban» = es la planta que menos gana quien llega a
ella. Con 80 partidas: la 1 la gana el 19 %, la 2 el 9 %, **la 3 el 5 %** y la 4 el 8 %; el bot
llega a la 4 (y la gana) en algunas. Hecho: M10 terminado.

## M11 · Planta 5: Atención al Cliente (hecho)

Diseño en `docs/DISENO.md` (enemigos de la quinta planta, la Centralita, objetos, armas y
aspecto). En partes, como M10:

- [x] (0) El diseño de la planta 5 y esta lista de tareas.
- [x] (1) Juego de casillas y color propio (`src/art/atencion.ts`, se ve con `?planta=5`): linóleo
  azul con la línea amarilla, postes con cinta, sillas de espera atornilladas, mostradores de
  ventanilla con mampara, dispensadores de agua, pared con el cartel de la estrella y relojes, y
  persianas con «Ventanilla cerrada».
- [x] (2a) Seis plantillas de combate propias de la planta 5, cada una con su idea y sus grupos.
- [x] (2b) Seis plantillas de combate más.
- Las salas especiales propias, en dos partes:
  - [x] (2c1) Coja Número, Objetos Perdidos, Repuestos Originales y Grabaciones con Fines de
    Calidad con su registro de llamadas (documento para el archivador).
  - [x] (2c2) La sala de la Centralita, con sus cuatro mostradores bajos (paran balas y se cruzan
    rodando); va con la (5b), que es cuando hay jefa que pelee en ella.
- [x] (3) Encadenar y cerrar: tras el Director se sube a la planta 5 con todo lo que se lleva
  (`LAST_LEVEL` = 5); hasta que llegue la Centralita, el Director pelea en su sala. Vencer al jefe
  de la planta 5 acaba la partida con victoria («Su incidencia ha sido cerrada») y vuelta al
  Mostrador, sin montacargas.
- 4 enemigos nuevos, uno por tarea (simulación, tests y captura; los sprites, juntos en la (4s)):
  - [x] (4s) Los sprites de los cuatro, con sus balas y lo que dejan en el suelo (el círculo del
    turno, la cinta de los postes, el escudo de preguntas frecuentes).
  - [x] (4a) Dispensador de Turnos (llama turnos: hay que llegar al círculo a tiempo).
  - [x] (4b) Postes de Cola (dos postes con una cinta que no se cruza y te hace la cola).
  - [x] (4c) Asistente Virtual (aprende: se escuda del lado desde el que le das).
  - [x] (4d) Teléfono de Recepción (le pasa con un compañero: se cambia de sitio con otro).
- Jefa: La Centralita. En partes:
  - [x] (5a) Sprites: el cuadro de conexiones (reposo, arrastrarse, hablar, sin clavijas, muda),
    las clavijas, las notas, los mostradores bajos y las zonas del menú de voz.
  - [x] (5b) Fases 1 y 2 (el menú de voz, la música de espera, pasar a la tostadora de
    departamento), cartel y sonidos. (Su documento para el archivador también: el test de los
    documentos pide uno por jefe.)
  - [x] (5c) Fase 3 (los cables que barren, muda a ratos).
  - [x] (5d) Pulido de su sala: la barra de vida se aparta si la tostadora o las zonas del menú
    quedan debajo; los nombres de los departamentos, centrados en cada cuarto y lejos de las esquinas.
- 10 objetos nuevos y 2 armas, en partes:
  - [x] (6a) Cinco de cifras o casi: Formulario en Línea, Tecla Almohadilla, Tiempo de Espera
    Estimado, Código Promocional Caducado y Cable de Teléfono Rizado.
  - [x] (6b1) Tres con efectos nuevos: Número de Turno, Contestador Automático y Llamada Grabada.
  - [x] (6b2) Hoja de Reclamaciones y Valoración de Cinco Estrellas, las sinergias Ticket de
    Incidencia y Buzón Lleno, y la indirecta (al final, Formulario + Cinta: la del Turno no se
    sostenía medida), medidas.
  - [x] (6c1) Arma: la Etiquetadora de Precios (sprite, etiquetas que se pegan, «Rebajado»).
  - [x] (6c2) Arma: el Megáfono de Reclamaciones (arco de ondas que atraviesa y empuja).
- [x] (7) La planta 5 medida con `npm run plantas`: sus salas, algo más duras que las de las
  Oficinas; la gana más gente de la que gana la 3 (sigue siendo el muro); y el bot completa la
  partida entera alguna vez llegando con lo de abajo.

**Criterios de aceptación:** una partida normal tiene 5 plantas y termina al vencer al jefe de
la quinta; el bot completa la partida entera alguna vez (medido con `npm run plantas`, como en
M10: llegando a la 5 con lo que se recoge en las de abajo).

## M12 · El Servicio Técnico (piso final secreto) (hecho)

Partido en tareas el 2026-11-12 (diseño en «El Servicio Técnico» de `docs/DISENO.md`).

- [x] (1) Requisitos de desbloqueo guardados entre partidas: vencer a los 5 jefes, ganar con 3
  productos distintos (con los que haya hasta M13) y el expediente completo del archivador. Se
  ven en el Mostrador: el cartel «Cita previa» en la pared, con su panel; el teléfono confirma la cita.
- [x] (2) El acceso: con la cita, vencer a la Centralita apunta la victoria y abre el montacargas
  del Servicio Técnico; sin ella, la partida acaba en la planta 5 (test).
- [x] (3) La planta 6, el Taller de Reacondicionado: su generación (corta, casi en línea, sin
  tienda ni tesoro), sus plantillas y su arte (azulejo de taller, cintas que arrastran).
  - [x] (3a) La planta y sus salas con enemigos reacondicionados de las cinco plantas.
  - [x] (3b) Las cintas transportadoras del suelo y el arte del taller (partida el 2026-11-12: el
    pintor de salas tiene una rama por planta en unos 30 sitios, y es una sesión por parte).
    - [x] (3b1) El juego de losetas del taller (`src/art/taller.ts`: azulejo blanco con grasa, pared,
      fluorescentes fríos, jaulas de piezas como paredes interiores, carteles y plantillas del suelo)
      y el cartel de la entrada «Servicio Técnico Oficial».
    - [x] (3b2) Sus muebles (`-6`: cajas de piezas, bidones de grasa, transpaletas, bancos de trabajo)
      y sus persianas.
    - [x] (3b3) Las cintas transportadoras del suelo que arrastran a todo el que las pisa (letra de
      plantilla con dirección, empuje en la simulación, dibujo animado como la cinta del Mostrador,
      el bot las tiene en cuenta).
      (El motor ya está desde la (4b): `src/sim/conveyors.ts` empuja, muerde con los rodillos, se
      dibuja con `cinta-despiece`/`rodillos-despiece` y el bot anda en contra; falta ponerlas en las
      plantillas con una letra y quizá en otras direcciones que no sean de lado.)
      Hecho el 2026-11-12: flechas `→`/`←` en las plantillas, solo de lado (el sprite de la cinta es
      de perfil); en la Línea de Desmontaje y en la sala nueva Cinta de Clasificación.
  - [x] (3c) Uno o dos enemigos propios del taller (brazo de montaje, carretilla). Hecho el
    2026-11-12 con la Carretilla Elevadora; el brazo de montaje queda para M14 si hace falta.
- [x] (4) El jefe final, la Trituradora, en tres fases, con su sala y sus sprites.
  - [x] (4a) Sprites, sala y fase 1, «Diagnóstico».
  - [x] (4b) Fase 2, «Despiece».
  - [x] (4c) Fase 3, «Control de calidad» (etiquetas «APTO» que frenan y pilas de cajas que cierran
    la sala media columna cada vez; `src/sim/crates.ts`).
- [x] (5) El final verdadero (el jugador es el producto) y los créditos. Hecho el 2026-11-12:
  `FinalScene` (cinta, limpieza, resistencia, caja, estantería de la planta 1, «El producto era
  usted.») y créditos con todo el reparto; `Profile.endings` lo cuenta y la garantía de la caja
  encoge cada vez.
- [x] (6) Medir la planta 6 entera con el bot y ajustar. Hecho el 2026-11-12: `node tools/medir-plantas.ts
  N 0 6` llega con la cita; la fase 3 de la Trituradora empieza al 35 % y dispara más (la planta 6
  la gana el 13 % de quien llega, la 5 el 12 %).

**Criterios de aceptación:** el piso final solo aparece si se cumplen los requisitos (test);
sin ellos la partida acaba en la planta 5.

## M13 · Cinco personajes jugables (hecho)

- [x] 5 personajes: Tostadora Reacondicionada, Batidora de Vaso, Plancha de Vapor, el Becario
  Eterno y el Móvil Reacondicionado, cada uno con estadísticas, arma inicial y una habilidad propias.
  - [x] (0) El diseño de los cinco (tabla y historias en «Los cinco, en detalle» de
    `docs/DISENO.md`) y esta lista de tareas.
  - [x] (1) Elegir personaje: el tablón pone «en exposición» al desbloqueado que se mire y se
    guarda en el perfil; la partida y el Mostrador lo usan (`?personaje=` para probar); el dibujo
    del jugador sale de los datos del personaje (textura y medidas), no de la tostadora fija.
    Hecho el 2026-11-12: `Profile.chosen`, `exhibited`/`nextExhibited`, `setCharacter` y
    `CharacterDef.look`; la captura del tablón con dos se hace en la (3).
  - [x] (2) La habilidad de la Tostadora, «Una de cada dos» (tostadas al recargar). Hecho el
    2026-11-12: `CharacterDef.ability` (`ToastAbility`), `popToast`, la quemada borra balas.
  - [x] (3) La Batidora de Vaso: sprite, Picahielos Turbo y el giro de cuchillas.
    Hecho el 2026-11-12: `BladesAbility` (tritura una vez por enemigo y voltereta, rompe balas),
    el arma `picahielos` (dos cubitos por disparo), sprites, sonidos, `tests/batidora-vaso.test.ts`,
    e2e `47b` y `55a`–`55c`; el bot gana la planta 1 con ella como con la tostadora
    (`node tools/medir-personajes.ts`).
  - [x] (4) La Plancha de Vapor: sprite, Pulverizador de Almidón y la suela caliente.
    Hecho el 2026-11-12: `SoleAbility` (un rastro de vapor cada 7 px andados que quema 2 por
    segundo a quien lo pisa), el arma `almidon` (dos gotas que dejan tiesos, más lentos, a los
    enemigos: `slow.look`), sprites, sonidos, `tests/plancha-vapor.test.ts` y e2e `56a`–`56c`; el
    bot gana la planta 1 con ella como con la tostadora (31,7 % las dos).
  - [x] (5) El Becario Eterno: sprite, experiencia demostrable y sin remunerar. Hecho el
    2026-11-12: `MeritAbility` (+4 % por sala sin daño, hasta 6; un golpe deja la mitad), la mitad
    exacta de cupones, `CharacterLook.hand`, «Experiencia» en el inventario y `npm run bot -- --personaje`.
  - [x] (6) El Móvil Reacondicionado: sprite, Notificaciones Push, carga en movimiento y batería
    al 1 %. Hecho el 2026-11-12: `PhoneAbility` (una pila cada 600 px andando en combate; quieto 3 s
    en combate, apagado 1 s), el arma `notificaciones` (balas lentas que persiguen), sprites
    (`movil`, `movil-apagado`, la pila que avisa), `tests/movil.test.ts` y e2e `19bc`–`19be`; el bot
    gana la planta 1 con él el 31,7 %.
- [x] Una historia distinta por personaje: por qué está en el vertedero, una escena al empezar
  y su propio final.
  - [x] (7a) La escena al empezar: la ficha de devolución de cada uno, que la cinta lee al pisarla.
    Hecho el 2026-11-12: `src/data/stories.ts` (las cinco historias, también la del Móvil),
    `src/render/ficha.ts` (la ficha, que cabe a los dos tamaños), la partida espera mientras se
    lee; `tests/ficha-devolucion.test.ts` y e2e `41a`–`41b`.
  - [x] (7b) El final propio de cada uno: el texto de la caja y de la estantería del final
    verdadero según quién llegue (`FinalScene`), con las frases de «Los cinco, en detalle».
    Hecho el 2026-11-12: `ENDINGS` en `src/data/final.ts` (reparación, etiqueta de la caja,
    estantería, cartel y precio), el dibujo de cada uno en el final (el de la Plancha salía como la
    tostadora), `tests/final.test.ts` y e2e `54h`–`54j`.
  - [x] (7c) La muerte propia de cada uno: su despiece (ahora todos sueltan las tostadas o casi
    nada) y la causa en el parte de baja. Hecho el 2026-11-12: `src/data/bajas.ts` (piezas,
    reventón, humo y chispas, «Unidad», excusas y recomendaciones de cada uno), las cuatro hojas
    `despiece-*` (`tools/sprites/despiece.ts`), `tests/bajas.test.ts` y e2e `57-baja-*`.
- [x] Desbloqueo de cada personaje con una condición propia. Hecho el 2026-11-12 (8): Batidora
  con la Nevera, Móvil con el Router, Becario tras diez bajas y Plancha con el Director (antes,
  Plancha con el Router y Móvil con veinte objetos); y sus armas iniciales salen en los cofres
  de los demás una vez desbloqueados (`WorldOptions.unlocked`, `weaponPool`,
  `tests/desbloqueo-armas.test.ts`).

**Criterios de aceptación:** cada personaje tiene un test de su habilidad; el bot gana la
planta 1 con todos; los cinco se distinguen a la primera en una captura.
Comprobado el 2026-11-12: habilidades en `tostadora-habilidad`, `batidora-vaso`, `plancha-vapor`,
`becario` y `movil` (tests); el bot gana la planta 1 con los cinco (`medir-personajes`, 60 partidas:
del 23 % al 35 %); la captura es la `47c-los-cinco` del e2e (los cinco en fila en el Mostrador) y
`tests/cinco-juntos.test.ts` vigila que no haya dos con el mismo color dominante ni con casi la
misma silueta. Con la (7c) hecha el 2026-11-12, M13 terminado.

## M14 · Más contenido y rejugabilidad

- [ ] Mucha variedad: hasta 30 armas, 80 objetos, 30 enemigos y 8 jefes en total.
- [x] Salas especiales raras, retos diarios con semilla fija.
  - [x] (r1) El reto del día: una partida al día con la semilla fija, la misma para todos (la
    Tostadora, sin desbloqueos, con un regalo del día), en la portada como «Boletín de ofertas del
    día», con el mejor intento, los intentos y los días seguidos en el perfil. Hecho el 2026-11-12:
    `src/sim/daily.ts`, `tests/reto.test.ts`, e2e `59a`–`59c`, `?reto=AAAA-MM-DD`.
  - [x] (r2) Salas especiales raras: salas que salen pocas veces (por ejemplo, una por cada
    varias plantas) con algo propio: un cambio de cupones, una apuesta, un PNJ o un desafío.
    - [x] (r2a) La sala rara en la generación de plantas (un callejón sin salida que sobra, una
      planta de cada cinco más o menos, con su propio generador para no mover las demás plantas)
      y la primera: la Oficina de Financiación, un arma y un objeto buenos por un corazón de máximo
      cada uno. Hecho el 2026-11-12: `RARE_ROOM_CHANCE` en `src/sim/floor.ts`, `FINANCE` en
      `src/data/shop.ts`, `tests/sala-rara.test.ts`, e2e `60a`–`60b`.
    - [x] (r2b) Una segunda sala rara con otra cosa (una apuesta: el «Sorteo de Fidelización», o un
      cambio de cupones por tickets), elegida al azar entre las raras. Hecho el 2026-11-12: el
      Sorteo de Fidelización (tres rascas de 5 cupones; `RAFFLE_PRIZES` en `src/data/shop.ts`),
      e2e `60c`–`60d`. Más salas raras (un PNJ, un desafío) pueden venir con los PNJs de M14.
- [ ] Jefes al azar: cada planta elige entre varios jefes (la planta 1, la Nevera u otros tres).
  (Nota del humano del 2026-10-30.) Primero un jefe más por planta (cinco nuevos, diseñados en
  «Jefes al azar» de `docs/DISENO.md`); después, si sale bien, más para la planta 1.
  - [x] (j1) Cada planta elige su jefe de una lista con la semilla (`FLOOR_BOSS_POOLS` en
    `src/data/rooms.ts`, `src/sim/bosses.ts`, con su propio generador: no mueve nada más) y lo
    que pedía un jefe concreto pide ahora «el jefe de la planta N»: los personajes del tablón
    (`floorBosses`), la cita del Servicio Técnico y los documentos de los jefes. `?jefe=<letra>`
    lo fuerza. Hecho el 2026-11-12: `tests/jefes-azar.test.ts`.
  - [x] (j2) Planta 1: la Lavadora Programa Eco (diseño, sprite, sus tres programas, presentación,
    despiece, documento… como los demás jefes), en la lista de la planta 1. Hecho el 2026-11-12:
    `lavadora-eco` (letra `À`), `tools/sprites/lavadora.ts`, balas que rebotan (`bounce` en los
    patrones), «Pesando la carga» (`BossPhase.mute.line`), el temblor (`EnemyAnim.rattle`), el bot la
    mide; ya sale en el glosario y en los créditos. `tests/lavadora.test.ts`, e2e `63a`–`63e`.
  - [x] (j3) Planta 2: la Nube de Almacenamiento. Hecho el 2026-11-13: `nube-almacenamiento`
    (letra `Ç`), `tools/sprites/nube.ts`; ataques nuevos en los datos: lluvia en columnas (`rain`),
    «Sincronizando…» (`sync`, la barra que se rompe a tiros) y el muro de carpetas (`folders`, props
    temporales que se deshacen: `PropDef.crumble`, `PropInstance.life`). El bot la mide; glosario y
    créditos. `tests/nube.test.ts`, e2e `64a`–`64f`.
  - [x] (j4) Planta 3: la Consola Edición Coleccionista. Hecho el 2026-11-13: `consola-coleccionista`
    (letra `È`), `tools/sprites/consola.ts`; ataques nuevos en los datos: cajas de botín
    (`BossSummonAttack`, la caja `caja-botin` con `LootboxBrain`: rota a tiros sale de `surprise`,
    abierta sola de `selfSurprise`; `SurpriseDef.pattern` para los cupones falsos) y el «Pase de
    temporada» (`BossPhase.seasons` y `season` en cada ataque). El bot la mide; glosario y créditos.
    `tests/consola.test.ts`, e2e `65a`–`65f`.
  - [ ] (j5) Planta 4: la Fuente de Agua de Oficina.
  - [ ] (j6) Planta 5: la Política de Devoluciones.
  - [ ] (j7) El glosario, los logros y los créditos con los jefes nuevos; el bot mide cada uno.
- [x] Glosario de enemigos y armas descubiertos, en el Mostrador o en la pausa.
  - [x] (g1) El perfil cuenta las bajas de cada tipo de enemigo (`Profile.killed`, `World.killsBy`):
    un enemigo está «descubierto» cuando ha caído una vez. Hecho el 2026-11-12, `tests/glosario.test.ts`.
    También sirve para los logros («matar 100 de un tipo»).
  - [x] (g2) La pantalla del glosario en la pausa: enemigos descubiertos (dibujo, nombre, una línea
    con el tono del juego y cuántos llevas) y armas encontradas; los que faltan, como siluetas «sin
    catalogar». Hecho el 2026-11-12: «Glosario» en la pausa y en la portada abre el «Catálogo de
    siniestros» (`src/sim/glossary.ts`, `src/render/glosario.ts`), dos pestañas con izquierda y
    derecha; e2e `58a`–`58d`.
- [x] Contenido limitado y desbloqueable con logros (matar 100 de un tipo, ganar a un jefe sin
  recibir daño, conseguir una sinergia…).
  - [x] (l1) Los logros, «Méritos del cliente»: 19 en los datos (`src/data/logros.ts`), cada uno
    con un número del perfil; ganados para siempre y pendientes de anunciar (`Profile.achievements`,
    `Profile.unseen`). La partida apunta las sinergias encendidas y los jefes vencidos sin perder
    vida desde su entrada (`World.synergiesSeen`, `World.flawless`). Hecho el 2026-11-12:
    `src/sim/achievements.ts`, `tests/logros.test.ts`.
  - [x] (l2) Verlos: un aviso en la partida al ganar uno («Mérito conseguido») y una pestaña
    «Méritos» en el Catálogo de siniestros con cada logro, su progreso («23/100») y su chiste.
    Hecho el 2026-11-12: el sello `sello-merito` (`tools/sprites/meritos.ts`), la tercera pestaña,
    «Glosario · ¡Mérito nuevo!» en los menús y el aviso en la partida; e2e `62a`–`62e`.
  - [x] (l3) Contenido limitado: algunas armas y objetos solo entran en los cofres y la tienda
    después de ganar un logro concreto (la recompensa, en los datos del logro), con su aviso.
    Hecho el 2026-11-12: 12 premios (`reward` y `lockedContent` en `src/data/logros.ts`,
    `World.locked`), el reto del día sin ninguno, `tests/premios.test.ts`, e2e `62b`–`62d`.
  - [x] (l4) Más premios que no sean lo que ya hay: armas y objetos nuevos que solo existen como
    premio de un logro (por ejemplo, para los logros difíciles que hoy no traen nada).
    - [x] (l4a) Cinco objetos nuevos, solo de premio, para cinco logros difíciles: la Bolsa de Tela
      Reutilizable (25 partidas), la Póliza a Todo Riesgo (50 bajas), el Contenedor Amarillo (1000
      desmontados), la Oferta Tres por Dos (8 sinergias) y el Plástico Protector (4 jefes sin perder
      vida). Hecho el 2026-11-13: datos y sprites, `tests/premios.test.ts`, e2e `62f`.
    - [x] (l4b) Dos armas nuevas, solo de premio, para «Fin de la garantía» (el final de verdad) y
      «Toda la gama» (ganar con los cinco productos): diseño, sprite, bala y sonido. Hecho el
      2026-11-13: el Soldador de Estaño y el Mando Universal (`tools/sprites/premios.ts`), dos
      pedestales más en la Sala de Pruebas, `tests/armas-premio.test.ts`, e2e `19i`–`19j`.
- [ ] PNJs que aparecen a veces en las plantas, piden cosas o proponen desafíos y, encontrados
  (según lo que se haya hecho antes), se quedan en el Mostrador: cuentan historia y desbloquean
  cosas. El Mostrador, más grande y con más cosas.
- [ ] Repaso del pixel art: enemigos más distinguibles entre sí, sin cambiar el estilo aprobado.

## M14b · Lo que pidió el humano el 13 de noviembre

Dos notas largas después de jugar (en `docs/NOTAS_DEL_HUMANO.md`). Van antes que el resto de M14
porque son notas del humano. Lo que se aprendió mirando otros juegos, en «Lo que hacen otros
juegos del género» de `docs/DISENO.md`.

- [x] (h1) Menos vida a los enemigos y a los jefes: que la dificultad venga de las balas y del
  movimiento, no de esponjas. Objetivo: un enemigo normal cae en 2–4 disparos del arma inicial,
  una sala de la planta 1 se limpia en unos 20–30 s y un jefe en 45–90 s. Medir con el bot antes
  y después; si la planta 1 se vuelve fácil, compensar con balas y patrones, no con vida.
- [x] (h2) La economía, como la del Isaac: los cupones (la moneda de la tienda) vuelan solos al
  limpiar la sala, y son mucho más escasos (comprar algo de la tienda tiene que costar una planta
  entera ahorrando, y no siempre); los demás objetos del suelo (armas, objetos, activos, tickets)
  se cogen con el botón de interactuar; los corazones son lo único que se coge al pasar por
  encima.
- [x] (h3) Nunca dos cofres en la misma sala: cada cofre, en una sala distinta.
- [x] (h4) Menos corazones, sobre todo al principio de la planta 1: no puede dar para rellenar la
  vida una vez y media. La primera planta se la tiene que poder pasar cualquiera, pero no fácil.
- [x] (h5) Bidones que explotan antes, con más radio y más daño (y que se vea venir).
  Hecho el 2026-11-13: vida 10 → 4, mecha 0,35 s, radio 36 → 64, daño 12 → 18, el alcance
  pintado en el suelo; `tests/bidones.test.ts`, e2e `11h`–`11j`.
- [x] (h6) Mesas que se vuelcan hacia donde toca (desde la izquierda, hacia la derecha; nunca
  hacia delante si empujas de lado), que aguantan unos cuantos disparos y se rompen.
  Hecho el 2026-11-13: `tipSide` por huecos en píxeles con ventaja para el lado, 8 balas en vez
  de 14, se oscurece y parpadea al gastarse; `tests/mesas.test.ts`, e2e `11l`–`11o`.
- [x] (h7) Saltar por encima de las mesas y de otros obstáculos bajos rodando (la esquiva), como
  en el Gungeon.
  Hecho el 2026-11-13: mesas (de pie y volcadas), cajas, bidones y carros son `low`; la tostadora
  se dibuja 6 px más arriba al saltarlos, con un chirrido; `tests/saltar.test.ts`, e2e `11ka`.
- [x] (h8) Hitboxes más justas: la de la tostadora más pequeña que su dibujo (el núcleo), las
  balas enemigas con una caja algo menor que su dibujo, y las de los enemigos ajustadas a su sprite.
- [x] (h9) Enemigos con movimientos propios. Hoy casi todos se acercan, se paran y disparan.
  Repasar los ~30 y darle a cada uno una forma de moverse que no tenga otro (saltar a donde estás,
  embestir en línea recta y rebotar, rodear, esconderse e invulnerable, dividirse al morir,
  teletransportarse, flotar en diagonal rebotando en las paredes, cavar…), con su aviso. Por plantas:
  - [x] (h9a) Planta 1. Hecho el 2026-11-13: el aspirador rebota en las paredes, el microondas
    gira a tu alrededor, la bombilla flota en diagonal rebotando, la batidora embiste tres veces.
  - [x] (h9b) Planta 2. Hecho el 2026-11-13: la impresora va de lado a lado por su carril y la
    webcam solo se mueve cuando no la miras (se pone detrás de ti).
  - [x] (h9c) Planta 3. Hecho el 2026-11-13: el Cubo de Piezas sigue tus pasos (por tu mismo
    camino, un segundo por detrás); el robot de cuerda (rebota), el coche (rodea y embiste) y el
    sobre (salta) ya eran únicos. El microondas cambia su órbita de la (h9a), que repetía la del
    coche, por ir a tu reflejo en el centro de la sala.
  - [x] (h9d) Planta 4. Hecho el 2026-11-13: la fotocopiadora se esconde detrás del enemigo más
    cercano (al otro lado de la tostadora) y el climatizador va atado a su manguera, enchufada a
    la pared: dentro de su alcance viene deprisa, fuera no puede seguirte. La destructora (siempre
    de cara) y el sello (a saltos y estampando) ya eran únicos.
  - [x] (h9e) Planta 5 y el Servicio Técnico, en dos partes:
    - [x] (h9e1) El Dispensador de Turnos y el Teléfono de Recepción. Hecho el 2026-11-13: el
      dispensador va pegado a las paredes (a su distancia y a la vista); el teléfono ya era único
      (a saltos que se tuercen al azar, y te pasa de sitio con un compañero).
    - [x] (h9e2) El Asistente Virtual y los enemigos del Servicio Técnico. Hecho el 2026-11-13: el
      asistente esquiva la pregunta (se aparta de tu línea de tiro si le apuntas) y la carretilla
      se conduce como una (gira despacio, solo avanza hacia las horquillas) y da marcha atrás
      pitando tras embestir. Los demás del Servicio Técnico son los de las plantas 1–5,
      reacondicionados, y ya se mueven a su manera.
- [x] (h10) Jefes más únicos: cada uno con un movimiento y una idea que solo tenga él (no solo
  ataques distintos): (h10a) los de las plantas 1–2, (h10b) los de las plantas 3–5 y el final.
  - [x] (h10a1) Planta 1: la Nevera Suprema y la Lavadora Programa Eco. Hecho el 2026-11-13: la
    nevera patina (se impulsa y se desliza frenando despacio, más lejos sobre la escarcha que
    lanza, y deja un rastro fino de escarcha que frena un poco); la lavadora anda a pivotes, una
    esquina y luego la otra, a tirones y ladeándose (centrifugando, más ancho y más deprisa).
  - [x] (h10a2) Planta 2: el Router del Wifi y la Nube de Almacenamiento. Hecho el 2026-11-13: el
    router cambia de punto de acceso (avisa y se cambia el sitio con el repetidor más cerca de la
    tostadora, y sale atacando); la nube es un nubarrón (se queda encima de la tostadora,
    meciéndose a la deriva, y flota por encima de los muebles).
  - [x] (h10b1) Planta 3: el Muñeco de Moda y la Consola Edición Coleccionista. Hecho el
    2026-11-14: el Muñeco desfila (tramos rectos, solo de lado o solo arriba y abajo, alrededor de
    la tostadora, y posa al final de cada uno con un flash); la Consola va con lag (su fantasma
    anda delante, dibujado cian, y ella salta a donde ha llegado; a veces vuelve atrás).
  - [x] (h10b2) Planta 4: el Director de Recursos Inhumanos. Hecho el 2026-11-14: «distancia de
    seguridad»: sentado rueda en su silla de cara a la tostadora, impulsándose hacia atrás, lejos de
    ella, y de vuelta cuando se ha alejado demasiado; contra la pared se para en seco. De pie anda.
  - [x] (h10b3) Planta 5 y el final: la Centralita y la Trituradora. Hecho el 2026-11-14: la
    Centralita se arrastra con los cables (enchufa el de delante en la pared, pasado un sitio
    alrededor de la tostadora, y se arrastra por él de un tirón; entre tirones, despacio); la
    Trituradora va sobre orugas (gira sobre sí misma hacia la tostadora, marca su recorrido y avanza
    recto a través de ella, triturando lo que pilla; contra la pared se para en seco).
- [x] (h11) Escenarios mucho mejores: más detalle, más decoración y más cosas que usar en cada
  sala (props que se rompen, charcos, cables que electrocutan, estanterías que caen…), manteniendo
  la generación procedural: (h11a) los props nuevos que se usan, (h11b) decoración por planta,
  (h11c) plantillas de sala nuevas con más forma.
  - [x] (h11a1) La Regleta Sobrecargada: un prop bajo que sale en algunos huecos de obstáculo vacíos
    (con su propio generador, para no mover las salas) y, mientras hay pelea, da una descarga cada
    pocos segundos con aviso (chispas y el alcance en el suelo) a todo lo que tenga cerca, enemigos
    incluidos; a tiros hace cortocircuito y se va. Hecho el 2026-11-13: `regleta` (`PropDef.zap`,
    `REGLETA_CHANCE`, `FillOptions.hazard`), el bot se aparta, `tests/regleta.test.ts`, e2e `11p`–`11s`.
  - [x] (h11a2) La estantería que cae: alta, se tumba a tiros hacia el lado contrario, con su
    sombra de aviso, aplasta lo que pilla y queda como obstáculo bajo. Hecho el 2026-11-13:
    `estanteria` (`PropDef.topple`, `SHELF_CHANCE`, `FillOptions.shelf`, `fallSide`, `FALLEN_BOX`),
    el bot se aparta de la sombra, `tests/estanteria.test.ts`, e2e `11t`–`11w`.
  - [x] (h11a3) Charcos: el agua que deja algo roto (una garrafa, un extintor) moja el suelo y
    conduce las descargas de la regleta. Hecho el 2026-11-13: `garrafa` (`PropDef.spill`,
    `Room.puddles`, `wetPuddles`, `SPILL_CHANCE`, `FillOptions.spill`), el bot sale del charco que se
    va a electrificar, `tests/charcos.test.ts`, e2e `11x`–`11za`. El extintor, para más adelante.
  - [x] (h11b) Decoración por planta: los trastos de cada planta (cuatro o tres por planta, bajos,
    apagados y sin los colores de las balas) amontonados en los rincones, junto a las paredes y al
    pie de las estanterías, y la sombra de las paredes en el suelo. Hecho el 2026-11-13:
    `src/art/decor.ts`, `tests/decoracion.test.ts`.
  - [x] (h11c) Plantillas de sala nuevas con más forma (columnas, rincones, salas en L, islas de
    muebles), unas cuantas por planta. Hecho el 2026-11-14: dos de combate por planta, de la 1 a la 6
    (salas en ele, en cruz, con las esquinas cortadas, de pilares, de columnas y de islas de mesas, y
    una casa maciza en el centro); lo que queda fuera de la forma va con ` ` en la plantilla
    (`Room.outside`) y se pinta como más pared de fuera, con la pared del fondo que dobla la esquina
    (`cutOut` en `src/art/room.ts`); `tests/salas-forma.test.ts`, e2e `14d`–`14g`.

## M14c · Arte nuevo (nota del humano del 13 de noviembre)

El humano dice que el arte es feo y pide un hito entero para mejorarlo. El estilo aprobado de
`docs/ESTILO_ARTE.md` se puede **cambiar** en este hito porque lo pide él; `art/referencia/` se
queda como estaba, como historia. Cómo se hace (la respuesta a su pregunta, en las notas): el arte
sigue saliendo de código, pero con mejores herramientas propias y con un sitio para que otra IA
de imagen (o él) deje sprites que el juego adapte a la paleta.

- [x] (a1) Guía de estilo nueva: paleta más rica (rampas de 5–7 tonos por material, luz
  arriba-izquierda, sombras de color y no negras), contorno selectivo, proporciones de los
  personajes (más grandes: 24–32 px), y tres sprites de prueba (la Tostadora, un enemigo y un
  suelo) al lado de los viejos, con la decisión escrita.
  Hecho el 2026-11-14: «M14c · El estilo nuevo» al principio de `docs/ESTILO_ARTE.md`, la paleta
  en `src/art/paleta.ts`, la tostadora, el aspirador y una loseta del almacén en `art/prueba/`
  (con `comparativa.png`), `tools/sprites/prueba-a1.ts` y `tests/estilo-a1.test.ts`.
- [x] (a2) Herramientas de dibujo nuevas en `src/art/`: formas con antialias de pixel art
  (dithering ordenado, rampas por normal, brillos especulares), un «sombreador» de volumen a
  partir de un mapa de alturas, y un comprobador de legibilidad (silueta y contraste) que corra en
  los tests.
  Hecho el 2026-11-14: `src/art/pintor.ts` (`Paint`, `ellipsoid`, `cylinderH`, `heightShade`, el
  antialias `aa`, el contorno selectivo, `legibility` y `silhouetteOverlap`; el tramado Bayer y
  las rampas, en `src/art/paleta.ts`), demostración en `art/prueba/herramientas.png`,
  `tests/pintor.test.ts`.
- [x] (a3) Carpeta `art/entrada/` para sprites hechos fuera (por otra IA de imagen o por el
  humano): un script que los reduce a la paleta del juego, los recorta a la rejilla, los mete en
  las hojas y apunta su origen y licencia en `CREDITOS.md`.
  Hecho el 2026-11-14: `art/entrada/LEEME.md` (cómo se deja un sprite y su JSON), `node
  tools/sprites/entrada.ts` (encuentra la escala y la rejilla, reduce bloque a bloque, ajusta a la
  paleta en OKLab, quita los bordes a medias, recorta de pie en su fotograma, contorno selectivo si
  se pide, rechaza lo que no tiene licencia válida y apunta los créditos), `allSheets` los añade a
  las hojas; `tests/entrada.test.ts`.
- [ ] (a4) Los cinco personajes jugables, redibujados con más fotogramas (andar 6, rodar 6,
  disparar, herido, morir).
  - [x] (a4a) La Tostadora en el juego con el estilo nuevo (parte de `art/prueba/tostadora.png`):
    la hoja nueva, el tamaño de fotograma nuevo en `sprites.json`, el dibujo centrado en su caja
    de choque de siempre, el arma y la mano que gira encajadas, e2e y capturas.
    Hecho el 2026-11-14: `tools/sprites/tostadora.ts` (los ocho fotogramas de siempre en 40 × 46,
    piernas y cuerpo pintados aparte y unidos con `Paint.stamp` para un solo contorno; herida, las
    tostadas saltan; rota, sin tostadas y con la palanca abajo), su guante `mano-tostadora`, una
    sombra más ancha (`CharacterLook.shadowRx`), `classicOrigin` para la portada y el final (que
    estaban hechos para el marco de 40 × 41) y `tests/tostadora-a4a.test.ts`. El Secador sigue con
    el dibujo viejo: va en la (a13).
  - [x] (a4b) Sus fotogramas nuevos: andar 6, rodar 6, disparar, herido y morir.
    Hecho el 2026-11-14: dieciséis fotogramas después de los ocho de siempre (hoja de 24) en
    `tools/sprites/tostadora.ts` (`TOASTER_EXTRA`, `TOASTER_ANIM`): andar en seis pasos con el pie
    que avanza levantado y el cuerpo que baja al apoyar, rodar hecha una bola (piernas recogidas,
    ojos cerrados, el cable que da latigazos) y estirando las piernas para aterrizar, disparar
    (se echa atrás un píxel con los ojos entornados y las tostadas sacudidas), herida en dos
    tiempos (primero el golpe, con los ojos como platos, y luego la cara apretada) y morir con dos
    sacudidas que echan chispas antes de que salten las tostadas. `CharacterLook.anim` dice dónde
    está cada cosa y `src/render/heroAnim.ts` elige el fotograma (los otros cuatro personajes,
    sin `anim`, siguen con los ocho); `tests/tostadora-a4b.test.ts`.
  - [ ] (a4c) La Batidora de Vaso y la Plancha de Vapor. (Al redibujarlas, que
    `tests/plancha-vapor.test.ts` mida su anchura contra la tostadora nueva, no la vieja.)
  - [ ] (a4d) El Becario Eterno y el Móvil.
- [ ] (a5) Los enemigos de las plantas 1 y 2, redibujados (y más distinguibles entre sí).
  - [x] (a5a) El Aspirador y el Microondas (el aspirador parte de `art/prueba/aspirador.png`).
    Hecho el 2026-11-14: `tools/sprites/planta1-nuevo.ts` (aspirador 42 × 40 con 7 fotogramas, el
    último acelerando; microondas 44 × 46 con 7, andando y calentando), el material `crema`,
    `tests/estilo-a5.test.ts`.
  - [x] (a5b) La Bombilla y la Polilla.
    Hecho el 2026-11-14: la bombilla de bajo consumo, 38 × 48, con traje, cuello de rosca y la
    espiral dentro de un globo con cara (encendida y apagada); la polilla, 17 × 15, vista desde
    arriba con dos aleteos. En `tools/sprites/planta1-nuevo.ts`.
  - [x] (a5c) La Batidora y el Mando.
    Hecho el 2026-11-14: la batidora de mano, 42 × 38, verde menta de los setenta (material
    `menta`), con el asa en lazo, el TURBO atascado en rojo y dos varillas de globo que giran; el
    mando, 32 × 46, gris, con zapatillas de cuadros, la ventana de infrarrojos a la altura de la
    que dispara (`MANDO_IR_Y` = `muzzleY`), sin el «1», las pilas con cinta y un ganchito pegado.
    En `tools/sprites/planta1-nuevo.ts`.
  - [x] (a5d) La Impresora y el Cargador.
    Hecho el 2026-11-14: la impresora, 48 × 42, en beige de oficina (material `beige`), ancha y
    plana con el montón de folios detrás, la ranura por boca a la altura de su `muzzleY` con la
    factura asomando, ERR en la pantalla, el pósit del NO y el precio de la tinta; atascada tiembla,
    arruga la factura y echa humo. El cargador, 32 × 32, un ladrillo blanco con los cuernos de
    latón, antifaz de ladrón, sonrisa de dientes y chanclas; tirado en el suelo, tumbado con el
    cable enrollado. En `tools/sprites/planta2-nuevo.ts`.
  - [ ] (a5e) El Ratón Inalámbrico y la Webcam.
- [ ] (a6) Los enemigos de las plantas 3, 4 y 5, redibujados.
- [ ] (a7) Los jefes, redibujados (más grandes, más fotogramas, despiece).
- [ ] (a8) Suelos, paredes y puertas de cada planta: losetas con variantes, bordes, esquinas,
  sombras de pared y luz.
- [ ] (a9) Props y decoración de cada planta (con M14b (h11)).
- [ ] (a10) Efectos: disparos, impactos, explosiones, chispas, humo, muerte (más fotogramas,
  partículas con color).
- [ ] (a11) Interfaz: corazones, marcador, minimapa, menús, ventanas, con la fuente «Letra
  Pequeña» revisada.
- [ ] (a12) Luz y ambiente: sombra bajo cada personaje, luces de color por planta, viñeta, y
  una pasada de capturas comparando antes y después en el panel.
- [ ] (a13) Las armas con el estilo nuevo, empezando por el Secador (ya dibujado en
  `art/prueba/tostadora.png`): el dibujo en la mano (sin cambiar el agarre `GUN_GRIP` ni la boca
  del cañón, o cambiándolos para todas a la vez) y el del suelo y la tienda.

## M15 · Versión de escritorio (lo último)

- [ ] Empaquetado con Tauri (o Electron) para Windows, macOS y Linux.
- [ ] Guardado en disco, pantalla completa, soporte de mando completo.
- [ ] Flujo de GitHub Actions que genera los instaladores.
