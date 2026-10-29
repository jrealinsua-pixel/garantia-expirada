# Errores conocidos

La lista viva de lo que está mal o se ve mal. Sale de los «Problemas conocidos» de la bitácora
(repasados uno a uno el 2026-10-29, contra el código y las capturas) y se mantiene a mano: quien
encuentre un error lo apunta aquí, y quien lo arregle lo pasa a «Arreglados» con la fecha.

El hito M7 pedía que las dos primeras secciones quedaran **vacías** (lo están desde el
2026-10-29). Las otras no cuentan: son decisiones tomadas o trabajo que ya tiene sitio en otro
hito. A partir de M8, un error nuevo se apunta aquí y se arregla antes de cerrar su hito.

## Errores (algo funciona mal)

Ninguno conocido.

## Asperezas (se ve o se nota feo, sin romper nada)

Ninguna conocida.

## No son errores (decidido, con su motivo)

- La portada usa la música de la planta y no hay música de victoria ni de parte de baja:
  silencio a propósito, de momento (M6).
- «Armas descubiertas: 0 de 2» al empezar: la de salida no se «descubre», viene con la caja.
- Los cupones no caducan en el suelo, y a la caja de la tienda no se le puede disparar ni robar.
- Con **Texto grande**, la ventana de descripción (3–7 s) puede tapar a la tostadora y el
  minimapa, y la lista del inventario enseña dos cosas a la vez: es lo que cuesta leer a doble
  tamaño en 480 × 270. El parte grande tapa la sala: es una pantalla de final.
- La ventana del arma no enseña el daño por segundo: sale de daño y cadencia, y llenaría la
  ventana de cifras.
- El rótulo de la sala y su cartel pueden decir cosas parecidas («Devoluciones» y «Pasillo de
  Devoluciones»).
- El sello de «Planta superada» puede quedar unos segundos sobre el montón de piezas: se lee
  gracias a su banda.
- El minimapa puede medir hasta 9 salas de ancho (unos 100 px) en plantas alargadas: no tapa
  nada importante.
- El rebote en una esquina exacta invierte los dos ejes (vuelve por donde vino).
- Los ganchos de prueba de la consola (`giveActive`, colocar un cofre) no tienen animación de
  caída ni apartan lo que sueltan: son herramientas de test, no juego.
- El bot llega a la tienda a menudo con pocos cupones y no vuelve: es el bot, no el juego.
- Las cifras de `npm run rendimiento` dependen de la máquina, y las de `npm run objetos` tienen
  un ruido de ±8 puntos con 40 combates: se comparan antes y después, no en absoluto.
- Todos los nombres de sala salen arriba en el centro, sobre la pared del fondo, que es donde
  está la puerta norte; en salas estrechas (el tesoro) la placa pisa el marco de la puerta. Se lee
  gracias a la placa y se va a los 3 s.
- El nombre de un objeto recién recogido puede coincidir un segundo con el nombre de la sala: van
  en líneas distintas y se leen los dos.
- Al cambiar una tecla en la pausa, lo que ya estaba en pantalla (un letrero, la ventana de
  descripción) se va en unos segundos con la tecla vieja; lo que sale después ya nombra la nueva.

## Para otro hito

- La pared del fondo de la planta 1 es la misma estantería en todas las salas → M8 (entornos
  bien diseñados, con variantes).
- La voltereta es el sprite girado, no fotogramas dibujados → M14 (variedad y pulido de arte).
- No se puede borrar el historial desde el juego → M9 (el Mostrador de Devoluciones, donde vivirá
  el historial).

## Arreglados

- 2026-10-29 · **Portada**: el fondo es ahora la Cola de Atención al Cliente (20 casillas, tan
  ancha como la pantalla: sin bordes oscuros), y créditos, opciones, controles e historial se
  ponen a la derecha, sin tapar a la tostadora.
- 2026-10-29 · **Objetos del HUD**: al irse la ayuda de controles bajan de 1 en 1 px, con su placa,
  en vez de saltar una fila de golpe.
- 2026-10-29 · **Letreros sin placa** (puertas abiertas, cambio de arma, reposición, montacargas):
  llevan la misma placa oscura que el HUD.
- 2026-10-29 · **Inventario**: con más cosas de las que caben, una barra a la derecha dice cuántas
  hay y por dónde va la lista.
- 2026-10-29 · **Destellos suaves**: los avisos ya no parpadean; el enemigo se tiñe de amarillo
  fijo mientras avisa.
- 2026-10-29 · **Texto grande**: también la tarjeta de la jefa (subtítulo y lema a doble tamaño, el
  lema en dos líneas si hace falta) y los textos flotantes (cupones, corazones, sellos).
- 2026-10-29 · **e2e**: la prueba de la bala que quita medio corazón fallaba a veces si la tostadora
  tenía una caja a la izquierda (la bala nacía dentro); ahora llega por el lado libre.
- 2026-10-29 · **Animación: las piernas del Mando se tapaban** en los pasos elevados y **la boquilla
  del Aspirador subía con el cuerpo**. Las piernas juntas (5 px o menos) ya no se cruzan por el
  centro: pasan a su distancia de reposo y la zapatilla que avanza se levanta 2 px
  (`narrowPoseCycle` en `tools/sprites/pose.ts`; también el Aspirador, que tenía el mismo
  borrón). El final de la manguera y la boquilla van en la capa del suelo y no se mueven.
- 2026-10-29 · **La jefa salía cortada por arriba** al empezar el combate, con el nombre de la
  sala encima de la cabeza: la cámara ahora encuadra a la jefa entera (corona incluida) siempre
  que quepa con la tostadora (`frameAxis` en `src/render/camera.ts`), y el nombre de la sala sale
  en la franja negra de arriba durante la presentación, no después. Si la tostadora está en la
  puerta de abajo no caben las dos (366 px en una vista de 270): manda la tostadora y la cámara
  se acerca a la jefa todo lo que puede.
- 2026-10-29 · **Los trozos del despiece cruzaban paredes**: ahora rebotan contra paredes y cajas.
- 2026-10-29 · **Parón al primer clic** (se sintetizaban los 56 efectos y la canción): ahora se
  sintetizan en segundo plano desde que carga la página, uno cada 30 ms, sin `AudioContext`; el
  e2e comprueba que están listos antes del primer clic. La canción más larga aún cuesta ~0,1 s de
  golpe, pero en la portada, antes de jugar.
- 2026-10-29 · **No había e2e de la sala de la jefa desde la planta**: ahora el e2e entra desde la
  entrada de una planta generada y comprueba que la jefa está, se presenta y cierra (captura 16f).
- 2026-10-29 · **Rendijas**: entre un carrito y la caja de debajo (`cola-atencion`), o detrás de
  una caja pegada a la pared del fondo, quedaba un hueco de 5–13 px donde solo cabían los pies:
  la tostadora se colaba dibujada a través de las dos cosas y el bot se atascaba. Ahora
  `buildRoom` estira hacia arriba la caja de choque del obstáculo de abajo hasta cerrar la
  rendija (`SLIT` en `src/sim/room.ts`); lo comprueba un test con cada plantilla y cada obstáculo.
- 2026-10-29 · **Los enemigos no chocaban entre sí**: se amontonaban unos dentro de otros. Ahora
  los que andan se apartan con suavidad (`separate` en `src/sim/enemies.ts`); la polilla vuela por
  encima y la jefa no se aparta.
- 2026-10-29 · **Los cupones de la jefa caían encima del montacargas** y lo tapaban: ahora salen
  despedidos en corona y se quedan fuera de la plataforma.
- 2026-10-29 · **Al volver a la sala de la jefa, el montacargas volvía a «subir»** con su ruido y
  su polvo: ahora ya está ahí, en silencio.
- Comprobado el 2026-10-29, ya estaban bien: el número de expediente del parte ya no cambia al
  repintarse; el bocadillo de la caja y la descripción de lo comprado ya no se pisan; el volumen
  de la música tiene su línea; las armas ya hacen daños distintos; la prueba del mando del e2e no
  ha vuelto a fallar.
