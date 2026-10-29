# Errores conocidos

La lista viva de lo que está mal o se ve mal. Sale de los «Problemas conocidos» de la bitácora
(repasados uno a uno el 2026-10-29, contra el código y las capturas) y se mantiene a mano: quien
encuentre un error lo apunta aquí, y quien lo arregle lo pasa a «Arreglados» con la fecha.

El hito M7 pide que las dos primeras secciones queden **vacías**. Las otras no cuentan: son
decisiones tomadas o trabajo que ya tiene sitio en otro hito.

## Errores (algo funciona mal)

- [ ] Al entrar en la sala de la jefa, durante el primer segundo tras su presentación la cámara
  aún está volviendo y la nevera sale cortada por arriba (visto en M4; por comprobar si sigue).
- [ ] Los trozos del despiece (enemigos y tostadora) pueden cruzar una pared al salir despedidos
  si mueren pegados a ella.
- [ ] Al sintetizar la primera canción hay un parón de unos 0,15 s con el primer gesto.
- [ ] No hay e2e que entre en la sala de la jefa desde la planta (solo la sala suelta `?sala=jefe`):
  el error de M7 por el que la jefa no salía se escapó por eso. Lo cubren los tests de
  simulación, pero falta verlo en el juego de verdad.

## Asperezas (se ve o se nota feo, sin romper nada)

- [ ] Portada: la sala del fondo es más estrecha que la pantalla y se ven bordes oscuros a los
  lados.
- [ ] Portada: los paneles de créditos, opciones, controles e historial tapan media tostadora.
- [ ] Al cambiar una tecla en la pausa, los carteles que ya estaban en pantalla siguen nombrando
  la tecla vieja hasta que se van.
- [ ] El nombre de la sala del tesoro («Objetos perdidos (nadie los reclamó)») cae encima de la
  puerta de arriba.
- [ ] El nombre del objeto recogido sale mientras aún se ve el nombre de la sala (un segundo, en
  líneas distintas).
- [ ] La ayuda de controles: al apagarse, los objetos de abajo bajan una fila de golpe.
- [ ] Los avisos de «cambia de arma» y «agotado» no llevan placa (los demás letreros sí).
- [ ] Inventario: con más cosas de las que caben, solo «...» indica que hay más; no hay barra.
- [ ] Con **Destellos suaves**, los avisos amarillos siguen parpadeando (a unos 8 Hz al final).
- [ ] Con **Texto grande**, la tarjeta de presentación de la jefa y los textos flotantes (daño,
  cupones) siguen a tamaño normal.
- [ ] Animación: en los pasos elevados las dos piernas del Mando casi se tapan, y la boquilla
  del Aspirador sube con el cuerpo (parece que la balancea).

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

## Para otro hito

- La pared del fondo de la planta 1 es la misma estantería en todas las salas → M8 (entornos
  bien diseñados, con variantes).
- La voltereta es el sprite girado, no fotogramas dibujados → M14 (variedad y pulido de arte).
- No se puede borrar el historial desde el juego → M9 (el Mostrador de Devoluciones, donde vivirá
  el historial).

## Arreglados

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
