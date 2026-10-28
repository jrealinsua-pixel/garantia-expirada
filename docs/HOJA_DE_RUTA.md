# Hoja de ruta

Cada hito tiene tareas y **criterios de aceptación**. Un hito solo está terminado cuando se
cumplen todos sus criterios. Las tareas se pueden dividir, reordenar dentro del hito o
ampliar. Cuando se acabe la lista, Claude escribe hitos nuevos al final.

Estados: `- [ ]` pendiente · `- [x]` hecha.

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

## M2 · Enemigos y patrones de balas

- [x] Sistema de patrones de balas declarativo (anillo, abanico, espiral, ráfaga, onda) con tests.
- [x] Telegrafía de ataques (parpadeo y sonido previo).
- [x] Aspirador Desahuciado (carga en línea recta).
- [x] Microondas Sin Seguro (anillos de ondas).
- [x] Bombilla de Bajo Consumo (espirales) con su polilla.
- [ ] Dos enemigos nuevos de `docs/DISENO.md`, diseñados y dibujados al estilo aprobado.
- [x] Vida, daño, muerte con desmontaje en piezas y botín (cupones). (Los enemigos; el daño al jugador va con los corazones.)
- [ ] Animaciones de golpe y muerte de la Tostadora (se desmonta: tostadas, muelle, tornillos) y parte de baja provisional.
- [x] Corazones del jugador y HUD (corazones, munición, cupones, objeto activo). (La ranura del objeto activo está vacía hasta M5.)
- [x] IA de los bots capaz de esquivar de forma básica, para medir dificultad.

**Criterios de aceptación:** una sala con los 5 enemigos es jugable y legible; el bot sobrevive
a una sala media más del 40 % de las veces.

## M3 · Salas y planta

- [ ] Plantillas de sala hechas a mano (al menos 15) con huecos para enemigos y obstáculos.
- [ ] Generador de planta: grafo de 10–15 salas con entrada, combate, tesoro, tienda, secreta y jefe; tests de conectividad con 10.000 semillas.
- [ ] Puertas que se cierran durante el combate (persianas con piloto rojo).
- [ ] Minimapa.
- [ ] Juego de casillas de la planta 1 (almacén) con variaciones y decoración.
- [ ] Transición entre salas.

**Criterios de aceptación:** 10.000 semillas generan plantas válidas; el bot recorre una planta
entera sin quedarse atascado.

## M4 · La Nevera Suprema

- [ ] Sala del jefe con presentación (nombre y lema en pantalla).
- [ ] Fase 1: ráfagas de cubitos, escarcha que ralentiza.
- [ ] Fase 2: tarjetas de fidelización que persiguen; la nevera se abre y escupe productos caducados.
- [ ] Barra de vida del jefe, transición de fase, muerte espectacular.
- [ ] Recompensa y subida a la siguiente planta (de momento, pantalla de victoria).

**Criterios de aceptación:** el combate dura entre 60 y 120 s para el bot; las dos fases se
distinguen claramente en las capturas.

## M5 · Armas, objetos y sinergias

- [ ] Sistema de modificadores de estadísticas y de comportamiento de balas.
- [ ] 3 armas (Secador Mágnum, Grapadora Táctica y una nueva).
- [ ] 10 objetos pasivos y 3 activos, con nombre y descripción según la guía de humor.
- [ ] Al menos 4 sinergias con texto propio.
- [ ] Cofres (se abren con tickets), tienda con vendedor y precios en cupones.
- [ ] Ventana de descripción al recoger un objeto.

**Criterios de aceptación:** cada objeto tiene un test de su efecto; las partidas del bot con
semillas distintas acaban con builds distintas.

## M6 · Partida completa (primera versión jugable)

- [ ] Menú principal, pausa, opciones (volumen, pantalla completa, controles).
- [ ] Parte de baja al morir (causa, vida útil, recomendación del fabricante).
- [ ] Pantalla de victoria.
- [ ] Guardado local de desbloqueos y estadísticas.
- [ ] Una pista de música chiptune para la planta y otra para el jefe.
- [ ] Revisión completa de textos con la guía de humor.

**Criterios de aceptación:** se cumple el «contenido mínimo de la primera versión jugable» de
`docs/DISENO.md`; el humano puede jugar una partida completa en el enlace publicado.

## M7 · Pulido de la primera versión

- [ ] Equilibrio con datos del bot: tiempo por sala, daño recibido, tasa de victoria.
- [ ] Rendimiento: 60 fps estables con 300 balas en pantalla.
- [ ] Accesibilidad: remapeo de controles, opción de reducir temblores y destellos, tamaño de texto.
- [ ] Animaciones completas de todos los enemigos.
- [ ] Lista de errores conocidos vacía.

## M8 · Planta 2: Informática

- [ ] Juego de casillas y color propio.
- [ ] 4 enemigos nuevos (impresora que se atasca, router, cargador falso, ratón inalámbrico sin pilas…).
- [ ] Jefe: El Router del Wifi.
- [ ] 10 objetos nuevos.

## M9 · El centro y la historia

- [ ] Mostrador de Devoluciones como centro entre partidas.
- [ ] PNJs con diálogos que cambian con el progreso.
- [ ] Desbloqueo de personajes jugables.
- [ ] Objetos de historia que revelan poco a poco la verdad del Servicio Técnico.

## M10 · Plantas 3 y 4

- [ ] Juguetería y Oficinas, con enemigos, jefes y objetos propios.
- [ ] Final verdadero.

## M11 · Más contenido y rejugabilidad

- [ ] Hasta 30 armas y 80 objetos.
- [ ] Salas especiales raras, retos diarios con semilla fija.

## M12 · Versión de escritorio

- [ ] Empaquetado con Tauri (o Electron) para Windows, macOS y Linux.
- [ ] Guardado en disco, pantalla completa, soporte de mando completo.
- [ ] Flujo de GitHub Actions que genera los instaladores.
