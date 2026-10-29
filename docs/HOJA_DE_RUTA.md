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
| M10 · Plantas 3 y 4 | 24 | Dos plantas como la 2 |
| M11 · Planta 5 | 13 | Una planta más dos armas |
| M12 · Servicio Técnico | 12 | Requisitos, piso especial, final verdadero y créditos |
| M13 · Cinco personajes | 14 | Cuatro personajes nuevos con arma, habilidad, historia y final |
| M14 · Más contenido | 30 | De ~5 armas, ~50 objetos y ~22 enemigos a 30/80/30, más 2 jefes |
| M15 · Escritorio | 6 | Empaquetado, guardado en disco y flujo de instaladores |
| **Total** | **122** | **~159 con un 30 % de margen** (arreglos, notas del humano, sorpresas) |

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

## M8 · Planta 2: Informática

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

## M9 · El centro y la historia

- [ ] Mostrador de Devoluciones como centro entre partidas.
- [ ] PNJs con diálogos que cambian con el progreso.
- [ ] Desbloqueo de personajes jugables.
- [ ] Objetos de historia que revelan poco a poco la verdad del Servicio Técnico.

## M10 · Plantas 3 y 4

- [ ] Planta 3: Juguetería, con su juego de casillas, 4 enemigos nuevos, un jefe (El Muñeco de Moda) y 10 objetos.
- [ ] Planta 4: Oficinas, con su juego de casillas, 4 enemigos nuevos, un jefe (El Director de Recursos Inhumanos) y 10 objetos.

**Criterios de aceptación:** se puede jugar de la planta 1 a la 4 seguidas; cada planta se
distingue a la primera en una captura; el bot llega a la planta 4 en alguna partida. Pasar de la
planta 3 tiene que ser difícil de verdad (nota del humano): el bot con daño la supera menos de
una vez de cada cuatro, y la planta 3 es donde más partidas acaban.

## M11 · Planta 5: Atención al Cliente

- [ ] Juego de casillas (centralita, cubículos, colas con cinta) y color propio.
- [ ] 4 enemigos nuevos y un jefe propio (La Centralita: te pasa de un departamento a otro).
- [ ] 10 objetos nuevos y 2 armas nuevas.

**Criterios de aceptación:** una partida normal tiene 5 plantas y termina al vencer al jefe de
la quinta; el bot completa la partida entera alguna vez.

## M12 · El Servicio Técnico (piso final secreto)

- [ ] Requisitos de desbloqueo guardados entre partidas (por ejemplo: vencer a los 5 jefes,
  ganar con 3 personajes distintos y reunir las piezas de historia). Se ven en el centro.
- [ ] Piso final especial, distinto de los demás: la trituradora del Servicio Técnico, con su
  jefe final en varias fases.
- [ ] Final verdadero (el jugador es el producto) y créditos.

**Criterios de aceptación:** el piso final solo aparece si se cumplen los requisitos (test);
sin ellos la partida acaba en la planta 5.

## M13 · Cinco personajes jugables

- [ ] 5 personajes: Tostadora Reacondicionada, Batidora de Vaso, Plancha de Vapor, el Becario
  Eterno y el Móvil Reacondicionado, cada uno con estadísticas, arma inicial y una habilidad propias.
- [ ] Una historia distinta por personaje: por qué está en el vertedero, una escena al empezar
  y su propio final.
- [ ] Desbloqueo de cada personaje con una condición propia.

**Criterios de aceptación:** cada personaje tiene un test de su habilidad; el bot gana la
planta 1 con todos; los cinco se distinguen a la primera en una captura.

## M14 · Más contenido y rejugabilidad

- [ ] Mucha variedad: hasta 30 armas, 80 objetos, 30 enemigos y 8 jefes en total.
- [ ] Salas especiales raras, retos diarios con semilla fija.

## M15 · Versión de escritorio (lo último)

- [ ] Empaquetado con Tauri (o Electron) para Windows, macOS y Linux.
- [ ] Guardado en disco, pantalla completa, soporte de mando completo.
- [ ] Flujo de GitHub Actions que genera los instaladores.
