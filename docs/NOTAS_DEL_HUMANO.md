# Notas del humano

Escribe aquí lo que quieras que Claude haga o cambie: una opinión después de jugar, un error,
una idea. Una nota por línea, la más reciente arriba. Claude las atiende antes que la hoja de
ruta y las marca con `[atendida]` cuando termina.

Ejemplo:

- 2026-11-02 · La esquiva se queda corta, que recorra un poco más.

## Pendientes

- [atendida] 2026-10-28 · Quiero poder jugar algo cuanto antes, aunque sea una sala con la tostadora disparando.
  → Ya se puede: la Sala de Pruebas tiene a la tostadora andando, rodando y disparando el Secador a dos maniquíes (botón «Jugar» del panel).

- [atendida] 2026-10-29  La versión de escritorio va a ser lo ultimo para hacer, el juego tiene que tener varios unos 5 pisos y un piso final especial solo desbloqueable completando unos requisitos, mucha variedad de enemigos, jefes, armas, objetos y unos 5 personajes jugables con historias diferentes 
  → Hoja de ruta rehecha: M10 plantas 3 y 4, M11 planta 5 (Atención al Cliente), M12 piso final secreto (el Servicio Técnico, con requisitos de desbloqueo), M13 cinco personajes con historia propia, M14 mucha más variedad, y la versión de escritorio pasa a ser lo último (M15). También en `docs/DISENO.md`.
  
- [atendida] 2026-10-29 Añade cuando puedas un aproximado de lo que crees que tardaras las fases del desarrollo del juego en completarse
  → Estimación por hito en `docs/HOJA_DE_RUTA.md` (al principio) y en el panel, junto a cada hito: quedan unas 143–185 sesiones; la primera versión jugable en unas 12 y el juego completo en 6–8 días con una sesión por hora sin parones (2–3 semanas si van más espaciadas).

- [atendida] 2026-10-29 Todo esto que te escribo son cosas generales para mas adelante, quiero que haya objetos pasivos no solo den mejoras, por ejemplo un objeto que mejore el daño y la velocidad de disparo pero baje la velocidad de disparo (esto no tiene que aplicarse a todos los objetos algunos pueden ser solo buenos), tambien quiero un menu en el que ver los objetos que tienes estadisticas etc, asegurate de que el juego tenga una interfaz mas o menos limpia, tambien quiero que te asegures de que el juego este balanceado, tenga armas con diferencias de daño o velocidad reales y que en general sea un juego tirando a una dificultad media-alta, que sea dificil de verdad pasar de el 3 piso, asegurate tambien de que los entornos del juego esten bien diseñados manteniendo la generacion procedural.
  → Apuntado para cuando toque: inventario con estadísticas e interfaz limpia en M6; dificultad media-alta, armas con diferencias medidas y repaso de objetos en M7; entornos mejor diseñados (plantillas con variantes) en M8; y en M10, que pasar de la planta 3 sea difícil de verdad. Los objetos pasivos ya dan y quitan casi todos (la Pila sube la cadencia y baja el cargador, la Resistencia sube el daño y baja la cadencia). Todo resumido en «Pautas del humano» de `docs/DISENO.md`.

- [atendida] 2026-10-29 Quiero que hagas sesiones de trabajo mas largas (sin perder calidad)
  → `AUTOPILOT.md` (paso 7) dice ahora que cada sesión encadena tareas mientras le quede contexto, cerrando cada una con tests, capturas, bitácora y push. Esta misma sesión ya ha hecho la tienda, la ventana de descripción (M5 terminado) y sigue con M6.
