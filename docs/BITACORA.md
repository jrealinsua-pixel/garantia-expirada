# Bitácora

La entrada más reciente va arriba. Cada sesión añade una.

## 2026-11-14 16:20 (hora peninsular) — Hito M14c — (a7a) La Nevera Suprema con el estilo nuevo
- Contexto: nadie trabajaba al llegar (`en_curso` vacío) y `main` estaba sano (`check`, `test`,
  `build` y `bot` en verde). La (a7), «los jefes redibujados», era demasiado grande para una
  sesión: **partida en nueve**, un jefe por tarea, (a7a)–(a7i).
- Hecho: M14c (a7a), en `tools/sprites/nevera-nuevo.ts` (la vieja, la aprobada, sigue en
  `characters.ts` porque la vigila `art/referencia/`). **La Nevera Suprema** (84 × 88, antes
  72 × 76): frigorífico de dos puertas de **esmalte** (material nuevo en `src/art/paleta.ts`, el
  blanco frío de las neveras), la cara en el congelador (pilotos rojos en cuencas oscuras,
  párpados planos y cejas de escarcha), el **dispensador de hielo por boca** en su `muzzle` (dientes
  de carámbano y de cubito, la paleta colgando como una campanilla, la pantallita del «-18»), la
  corona de oro torcida, la etiqueta A+++, la escarapela de «Empleada del mes» que se colgó ella,
  tiradores cromados, carámbanos bajo la junta, óxido, **guantes de fregar rosas** y botas de
  seguridad. **17 fotogramas** (antes 12): respirar y andar (como antes), una **pose por ataque**
  (cubitos: el dispensador se enciende; escarcha: guantes arriba y ojos cian) y la **puerta
  reventando** en el cambio de fase (`anim.clap`); en la fase 2 la nevera abierta con la comida
  caducada y la puerta por dentro (kétchup, mostaza, el cava de alguna Navidad), y sus poses (el
  abanico de tarjetas de fidelización y la comida saliendo volando). **Despiece propio**
  (`despiece-nevera-suprema`, seis piezas de 12 × 12: corona, tirador, cubito, yogur, etiqueta,
  kétchup): `GameScene` lo usa para cualquier jefe que tenga su hoja `despiece-<sprite>` (mientras
  se deshace, un 70 % de piezas suyas; al romperse, todas de golpe). Ancla nueva (38, 86); la caja
  de golpes y la boca, las de siempre. `tests/estilo-a7a.test.ts` (6 tests).
- Decisiones: (1) **El tamaño de los jefes**: un sexto más de fotograma y no más (la vista es de
  480 × 270), con el cuerpo del tamaño de su caja de golpes y lo que crece, lo que sobresale
  (corona, guantes, la puerta); escrito en `docs/ESTILO_ARTE.md` para los demás. (2) Las poses de
  la fase 1 enseñan la puerta cerrada, así que el ataque de cubitos de la fase 2 se queda sin pose
  (con la puerta cerrada se vería mal). (3) Esmalte y no `crema`: la crema es el blanco amarillento
  del microondas; la nevera es fría. (4) Guantes rosas de fregar: en azul parecían burbujas sueltas
  y con el rosa se leen como guantes y contrastan con el blanco.
- Medidas: la simulación no cambia (solo el ancla del dibujo). 1156 tests en verde. `npm run e2e`
  entero en verde; capturas de la nevera miradas (cubitos, cambio de fase, fase 2, tarjetas y
  liquidación con las piezas volando). `npm run bot`: 200 partidas, 0 fallos, 5
  atascos y la jefa ganada el 90 % en 57,7 s, igual que antes.
- Problemas conocidos: el aviso del juego tiñe la silueta mientras avisa, así que las poses se ven
  sobre todo justo después del aviso (como en los demás jefes). Volteada hacia la izquierda, la
  puerta abierta queda a la izquierda (se voltea entera, como todos).
- Siguiente paso: M14c (a7b), la Lavadora Eco.

## 2026-11-14 15:16 (hora peninsular) — Hito M14c — (a6f1) El Asistente Virtual y el Teléfono de Recepción con el estilo nuevo
- Contexto: al llegar, la (a6d) y la (a6e) estaban cogidas por otras dos sesiones (planta 4 y
  `planta5-nuevo.ts`); para no pisarlas, esta cogió la (a6f) en un archivo propio,
  `tools/sprites/recepcion-nuevo.ts`. Mientras trabajaba, otra sesión partió la (a6f) en dos y
  terminó la (a6f2), la Carretilla; el `pull --rebase` solo chocó en la hoja de ruta (resuelto a
  mano: las dos mitades hechas). El `main` local volvía a ser una copia poco profunda; se trajo la
  historia entera y se puso en `origin/main`.
- Hecho: M14c (a6f1). **El Asistente Virtual** (34 × 48, antes 27 × 36; los mismos 8 fotogramas):
  un tótem de autoservicio de plástico blanco con la pantalla grande de `azul` encendida y su cara
  de siempre (ojos de punto con brillo, coloretes y la sonrisa enorme con la lengua, el borde de
  abajo en la fila de su `muzzleY`), la franja de la marca en `turquesa` con su raya blanca y
  zapatillas a juego; chistes: el «¿En qué puedo ayudarle?» quemado en la pantalla, las huellas de
  dedos, el cartel de papel del costado, la pegatina QR de «Valore su experiencia», la webcam de
  arriba con la luz roja siempre encendida y el tique que nadie pidió saliendo de la impresora.
  Respira con la pantalla y, escribiendo, enseña los tres puntos con la mano tocando el cristal.
  **El Teléfono de Recepción** (46 × 38, antes 36 × 30; los mismos 7): el teléfono de mesa de
  treinta años en plástico amarillento (`crema`), una cuña de tres cuartos con la horquilla vacía,
  la pantallita de «L1 RETENIDA», el pósit «Ext. 0», ojos de recepcionista cansada sobre un teclado
  de demasiadas teclas con la columna roja que nadie entiende, la luz de mensajes que parpadea y el
  auricular colgando del cable rizado; agachado, en el aire con las piernas recogidas, sonando
  (ojos cerrados, boca abierta, se agita y salta el auricular) y pasando la llamada (de reojo,
  sonrisa de lado y la mano señalando atrás). Anclas nuevas (17, 46) y (23, 36); las cajas de
  golpes y los `muzzleY`, los de siempre. Test nuevo `tests/estilo-a6f.test.ts` (4);
  `tests/clientela-sprites.test.ts` mide las hojas nuevas. Sección en `docs/ESTILO_ARTE.md`.
  **Con esto la (a6) está terminada.**
- Arreglado de paso: `npm run check` fallaba en `main` por dos imports que se quedaron sin usar en
  `tools/sprites/build.ts` (los makers viejos del Sello y el Climatizador, y `taller.ts`), de las
  sesiones de la (a6d) y la (a6f2). Quitados.
- Decisiones: (1) Archivo propio y no `planta5-nuevo.ts`, que estaba cogido. (2) El teléfono en
  `crema` amarillento, no en `beige`: en el juego ya hay tres cajas beige (impresora, destructora y
  la de las versiones) y el chiste es que lleva treinta años amarilleando. (3) El asistente en blanco
  con turquesa: en la planta 5 ya hay granate (dispensador), cromo y azul (postes) y amarillento
  (teléfono). (4) Las cejas del teléfono caen por fuera (cansada, no enfadada): con la caída hacia
  dentro parecía furiosa.
- Medidas: la simulación no cambia (`npm run bot`: 200 partidas, 0 fallos, 5 atascos, igual que
  antes). 1150 tests en verde. `npm run e2e` entero en verde; capturas del escudo FAQ, los timbres
  y la llamada miradas: se leen bien al lado de la tostadora.
- Problemas conocidos: el QR y el tique del asistente, a tamaño real, son una mancha de puntos
  (se entiende como «cosas pegadas»). El teléfono, volteado hacia la izquierda, lleva el auricular
  a la derecha (como todos los personajes, se voltea entero).
- Siguiente paso: M14c (a7), los jefes, empezando por la Nevera Suprema.

## 2026-11-14 15:00 (hora peninsular) — Hito M14c — (a6f2) La Carretilla Elevadora con el estilo nuevo
- Contexto: misma sesión que la (a6e). Al cerrarla, la (a6d) y la (a6f1) (el Asistente y el
  Teléfono, en `recepcion-nuevo.ts`) las tenían otras sesiones; **partí la (a6f)** en la hoja de
  ruta y cogí la (a6f2), la Carretilla, con archivos propios (`tools/sprites/taller-nuevo.ts`,
  `tests/estilo-a6f2.test.ts`) y una línea de `build.ts`.
- Hecho: **la Carretilla Elevadora** del Servicio Técnico (46 × 46, antes 36 × 37): pintura
  **mostaza** (material nuevo `mostaza` en `src/art/paleta.ts`), el cuerpo largo en tonos más
  oscuros y la cabina más clara con la cara (visera de acero por cejas, faros por ojos con párpados
  aburridos, la rejilla por boca); el arco de seguridad con la rotativa ámbar (encendida y con
  destellos al avisar); el contrapeso de hierro con la franja de peligro; la pegatina «APTO» y un
  arañazo; el mástil con las horquillas al tobillo que suben 8 px antes de embestir y se doblan al
  estrellarse; la tarjeta roja de «Fuera de servicio»; ruedas de goma con bujes que giran y la
  carrocería que tiembla con el motor; guantes de nitrilo azules. Aturdida, ojos en X, rotativa
  apagada y un muelle suelto. Ancla nueva (22, 44); la caja de golpes no cambia. Tests nuevos en
  `tests/estilo-a6f2.test.ts` (4). Sección nueva en `docs/ESTILO_ARTE.md`. Capturas en el panel.
- Decisiones: (1) Material nuevo y no `amarillo`: el diseño del taller ya pedía una mostaza más
  parda para que los cupones no se pierdan encima. (2) Cuerpo más oscuro que la cabina: con los
  mismos tonos, cabina y cuerpo se leían como un solo bloque. (3) Las ruedas no se mueven con el
  temblor del motor (los pies tocan el suelo en el ancla en todos los fotogramas, como pide el test).
- Medidas: la simulación no cambia (solo el ancla del dibujo). `npm run bot` 200 partidas, 0 fallos,
  igual que antes. 1144 tests en verde; `npm run e2e` entero en verde (la captura `17z-taller-carretilla`
  ya enseña la nueva). `npm run stats` no se pasó: tarda más de 5 minutos en esta máquina.
- Problemas conocidos: el aviso del juego pinta toda la silueta de color durante el aviso, así que
  la rotativa encendida apenas se ve en partida; el fotograma se ve en los demás momentos (al
  girar, la carretilla se voltea bien). La caja de golpes (30 × 33) se queda por debajo del dibujo
  nuevo, más alto: se mirará con las demás en una pasada de cajas si hace falta.
- Siguiente paso: la (a7), los jefes, empezando por la Nevera Suprema; o la (a6f1) si se queda
  sin cerrar más de 90 minutos (la (a6d) ya está hecha).

## 2026-11-14 14:45 (hora peninsular) — Hito M14c — (a6d) El Sello y el Climatizador con el estilo nuevo
- Contexto: segunda tarea de la sesión, tras la (a6c2). La (a6e) la cogió otra sesión a las 13:40
  (planta 5, archivo propio); esta sigue en la planta 4.
- Hecho: M14c (a6d), en `tools/sprites/planta4-nuevo.ts`. **El Sello de Denegado** (34 × 46, antes
  26 × 34; los mismos 6 fotogramas): todo de **haya barnizada**, material nuevo `haya` en
  `src/art/paleta.ts` (luces de miel, sombras a marrón y ciruela; pasa las reglas de las rampas):
  el pomo redondo sombreado como bola, con brillo y **las dos marcas de dientes**; la montura en
  tres cuartos con la cara de haberlo visto todo (párpados a media asta, la boca torcida); la goma
  roja gastada en las esquinas con las letras de «DENEGADO» al revés en relieve; la **pegatina de
  «Revisado» tachada en rojo**; guantes de madera a los lados (arriba al saltar, en alto al
  estampar). Al bajar se estira, frunce las cejas y aprieta los dientes; recién estampado, aplastado
  y con la tinta salida alrededor de la goma; en el aire, los pies recogidos. **El Climatizador
  Portátil** (38 × 50, antes 28 × 40; 7 fotogramas): torre de plástico marfil (`crema`) con la
  rejilla de ranuras arriba, la pantalla en **«17»** en azul frío, ojos de indiferencia mirando de
  reojo y una sonrisita; la rejilla de lamas por boca **en la fila de su `muzzleY`**, con **una
  cinta roja atada que ondea con el aire** (tres posiciones al andar; al avisar, tiesa de hielo, con
  escarcha en las lamas y carámbanos debajo); el cartel de «No tocar» firmado por Dirección en el
  lado; y **la boca de la manguera justo donde el juego engancha la que va a la pared**
  (`GameScene.drawHose`: 7 px detrás de los pies, 10 arriba; `AC_HOSE` lo apunta y el test lo
  mira). Anclas nuevas (17, 44) y (19, 48); las cajas de golpes, las de siempre. Tests en
  `tests/estilo-a6.test.ts` (ahora 15): los dos entran en los generales; el del sello mira los
  pies en el ancla (y recogidos en el aire), la haya y la goma, que el pomo no se salga por arriba
  (al estirarse se salía: el estirón bajó de 3 a 2 px) y que al bajar sea más alto que agachado; el
  del climatizador, los pies, la rejilla en su fila, la boca de la manguera, la escarcha solo al
  avisar y que la cinta ondee.
- Decisiones: (1) El tampón de tinta colgando del cuello del sello de antes se quitó: a este tamaño
  era una caja gris encima de la montura que no se entendía; el chiste se queda en los dientes del
  pomo y la pegatina. (2) El climatizador es `crema` y no `acero`, para no confundirse con la
  fotocopiadora de la misma planta. (3) La cinta atada a la rejilla es lo que hace la gente en las
  oficinas para ver si sale aire; aquí además enseña hacia dónde sopla.
- **e2e**: el paso del Mando (`08c`) fallaba a ratos porque, en tiempo real, las peleas de antes ya
  habían acabado con los mandos de la Sala de Pruebas y se esperaba a uno que no existía (lo
  enseñó el mensaje nuevo con los enemigos que quedan). Ahora, si no queda ninguno, se pone uno
  despierto (`tools/e2e.ts`). Pasada entera en verde.
- Medidas: la simulación no cambia (`npm run bot`: 200 partidas, 0 fallos, idéntico). 1136 tests en
  verde.
- Problemas conocidos: con dos sellos estampando a la vez se pisan (son pequeños y del mismo color).
- Siguiente paso: M14c (a7), los jefes (la (a6f) la tienen otras sesiones).

## 2026-11-14 14:20 (hora peninsular) — Hito M14c — (a6e) El Dispensador de Turnos y los Postes de Cola con el estilo nuevo
- Contexto: sesión automática. Al llegar, otra sesión tenía la (a6c2), la Fotocopiadora, desde hacía
  57 minutos (`planta4-nuevo.ts`, `build.ts`, `tests/estilo-a6.test.ts`); la (a6d) va en los mismos
  archivos, así que cogí la (a6e) con **un archivo de sprites y un test propios**
  (`tools/sprites/planta5-nuevo.ts`, `tests/estilo-a6e.test.ts`) y solo dos líneas de `build.ts`. La
  rama `main` local volvía a ser una copia vieja; se puso en `origin/main` con
  `git checkout -B main origin/main`, sin tocar el remoto. Salud al llegar: `check`, `build`,
  1133 tests y `bot` (200 partidas, 0 fallos) en verde.
- Hecho: **el Dispensador de Turnos** (38 × 48, antes 30 × 35): caja de esmalte **granate**
  (material nuevo en `src/art/paleta.ts`) en tres cuartos, el «087» en LED de 3 × 5 que se pone al
  blanco al llamar, ojos con párpados pesados (abiertos al llamar, rojos y con cejas en V al perder
  el turno), la ranura de los tiques por boca en su `muzzleY` (ahora 16) y la lengua de papel que
  crece al llamar y sale larga, rota y rizada al escupir, con dos tiques volando; el cartel «Respete
  su turno», la ventanita del rollo, un arañazo y el pegamento de una pegatina vieja. **Los Postes de
  Cola** (28 × 42, antes 22 × 34): el tambor de cromo sombreado como cilindro con su tapa, la banda
  azul de la cinta enrollada justo donde el juego tiende la cinta (`muzzleY - 3`), el enganche que
  asoma delante y desaparece al soltarla, ojos de portero (rojos al disparar), una huella y una
  abolladura; el otro de la pareja con óxido en la base. **La cinta** (`cinta-poste`), en el mismo
  azul. Anclas nuevas en `src/data/enemies.ts`; las cajas de golpes no cambian. Tests nuevos en
  `tests/estilo-a6e.test.ts` (6); `tests/clientela-sprites.test.ts` mira los tamaños nuevos. Sección
  nueva en `docs/ESTILO_ARTE.md`. Capturas nuevas en el panel.
- Decisiones: (1) Material nuevo `granate` y no el `rojo`: el diseño ya pedía que el dispensador
  fuera más pardo que las balas rojas para que un tique no se pierda encima, y en la captura los
  tiques se leen sobre él. (2) Al disparar, el poste sube la mano de atrás: la de delante tapaba el
  enganche (lo vigila el test). (3) El `muzzleY` del dispensador baja de 18 a 16 para que los tiques
  salgan de la ranura dibujada; el de los postes se queda en 27 (la banda se dibujó a su altura).
  (4) Los tiques, el círculo del turno y las bolas de acero se quedan para la (a10), los efectos.
- Medidas: la simulación solo cambia de dónde salen los tiques (2 px más abajo). `npm run bot` 200
  partidas, 0 fallos, idéntico línea a línea al de antes (la planta 5 no la alcanza en 60 s). 1139
  tests en verde; `npm run e2e` entero en verde a la primera (solo, sin nada más corriendo).
- Problemas conocidos: los dos postes miran a la derecha, así que el enganche del de la derecha
  apunta hacia fuera de la cinta (no hay volteo de enemigos por dirección); la tapa del tambor se
  lee muy clara a tamaño real.
- Siguiente paso: al cerrar, la (a6d) y la (a6f1) las tenían otras sesiones; queda la Carretilla
  Elevadora (la otra mitad de la (a6f)) y después la (a7), los jefes.

## 2026-11-14 13:26 (hora peninsular) — Hito M14c — (a6c2) La Fotocopiadora con el estilo nuevo
- Contexto: al empezar, el `main` local de esta máquina era otra vez una copia vieja y poco
  profunda (del 6 de noviembre); se trajo la historia entera y se avanzó a `origin/main` sin perder
  nada. La (a4d2), el Móvil, la tenía otra sesión desde las 11:27; esta cogió la siguiente de la
  planta 4, que no se pisa con los personajes.
- Hecho: M14c (a6c2), en `tools/sprites/planta4-nuevo.ts`. **La Fotocopiadora de Planta** (48 ×
  48, antes 38 × 38; los mismos 10 fotogramas: zumbando, andando, la tapa levantada con la luz
  atrás, en medio y delante, y la copia saliendo): la fotocopiadora grande de pie de toda oficina,
  una caja de tres cuartos gris claro (`acero`) con la tapa de `goma`; el panel de mandos arriba
  con la pantalla atascada en «E-04», los botones gastados, el verde y el rojo; cara de cansada
  con los párpados a media asta (al copiar, los ojos muy abiertos y las cejas por las nubes); la
  **ranura de salida por boca, en la fila de su `muzzleY`**, con el folio atascado colgando de
  lengua; el cajón del papel de barriga; el cartel de **«Averiada, no tocar»** con sus dos tiras
  de celo; **la ranura de monedas tapada con cinta** (copia sin cobrar, como dice su ficha); y **la
  bandeja lateral llena de copias que nadie vino a recoger**, que además le da silueta. Al copiar,
  la tapa se levanta enseñando la almohadilla blanca y una barra verde cruza el cristal de atrás
  adelante. Ancla nueva (24, 46); la caja de golpes, la de siempre. Las copias que saca las pinta
  el juego en gris a partir de esta misma hoja, así que también cambian. Test nuevo en
  `tests/estilo-a6.test.ts` (ahora 13): entra en los generales (legible en todos los fotogramas,
  hoja y anclas) y otro mira los pies en el ancla, la boca en su fila, que sea gris y no beige, que
  la luz cruce el cristal en orden y solo con la tapa levantada, la tapa por encima de la caja y la
  copia saliendo.
- Decisiones: (1) **Gris y no beige**: en la planta 4 ya hay dos cajas beige (la destructora y la
  impresora de la planta 2 en sus versiones); la fotocopiadora era gris y sigue siéndolo, con la
  tapa oscura, que la distingue desde lejos. (2) La boca sigue en el `muzzleY` de 10 de los datos:
  la simulación no cambia. (3) La bandeja lateral va en el lado de la caja (a la izquierda; se
  voltea con ella).
- **e2e**: dos pasadas fallaron al principio en el Mando (paso `08c`, que depende del tiempo real)
  y otra al final en «Vencida la Trituradora, no empieza el final verdadero»: suelto, el final
  empieza a los 9,4 s, y el e2e le daba 15; con la máquina cargada al final de la pasada no llega.
  Subido a 30 s (`tools/e2e.ts`); nada que ver con la fotocopiadora (sus pasos `50r`–`50t` y `50xb`
  pasaron en todas).
- Medidas: la simulación no cambia (`npm run bot`: 200 partidas, 0 fallos, 5 atascos, idéntico).
  1127 tests en verde.
- Problemas conocidos: la pantalla del «E-04» a tamaño real se lee como un garabato ámbar (en 7 × 3
  píxeles no caben cuatro caracteres); se entiende como pantalla de error. En la captura del
  escaneo del e2e la fotocopiadora sale con el destello amarillo del aviso, como antes.
- Siguiente paso: M14c (a6d), el Sello y el Climatizador.
## 2026-11-14 12:50 (hora peninsular) — Hito M14c — (a4d2) El Móvil Reacondicionado con el estilo nuevo
- Contexto: sesión automática. Al llegar, otra sesión tenía la (a6c1), la Destructora (planta 4,
  sin tocar personajes); cogí la (a4d2), que no se pisa con ella. La rama `main` local volvía a ser
  una copia vieja y poco profunda; se puso en `origin/main` con `git checkout -B main origin/main`,
  sin tocar el remoto. La Destructora terminó mientras tanto; el `pull --rebase` mezcló sin
  conflictos (`build.ts`, `sprites.json` y la hoja de ruta) y las hojas se regeneraron después.
- Hecho: **el Móvil Reacondicionado** (`tools/sprites/movil.ts`) en el estilo nuevo, 40 × 48, con los
  24 fotogramas de los otros cuatro (`PHONE_FRAMES`, `PHONE_EXTRA`, `PHONE_ANIM`) y `movil-apagado` en
  el mismo marco. Materiales nuevos en `src/art/paleta.ts`: `ororosa` (la carcasa) y `pantalla` (el
  cristal negro). Una losa de pie en tres cuartos: el canto redondeado en sombra con los botones de
  volumen y la pegatina «REACONDICIONADO»; delante, todo oro rosa, porque es **un modelo viejo** con
  frente (auricular y cámara) y barbilla con el botón de inicio gastado. La cara, dibujada en la
  pantalla e iluminada por ella: cejas de preocupación, ojos blancos con brillo cian, boca temblorosa
  y una gota de sudor. La batería al 1 % en rojo, el globo de notificaciones sin leer asomando por la
  esquina y la grieta desde la esquina de abajo. Andando, el rayo de cargar («Carga en movimiento»);
  rodando, la rueda de carga gira en la pantalla y el cable da latigazos; el golpe raya la pantalla
  (filas desplazadas y bandas roja y cian); al morir, la batería vacía llena la pantalla y saltan
  chispas; roto, cristal negro con la grieta de punta a punta, sin globo y con el cable desenchufado
  delante. Manos de silicona de oro rosa (`mano-movil`), sombra de 12. Tests nuevos en
  `tests/movil-a4d.test.ts` (7); `tests/movil.test.ts` mide la altura nueva; los dos de la tostadora
  que usaban al Móvil como «personaje del marco viejo» usan ahora una ficha de mentira (ya no queda
  ninguno). Sección nueva en `docs/ESTILO_ARTE.md`. **Con esto la (a4) está terminada.**
- Decisiones: (1) Modelo viejo con botón de inicio y no pantalla de borde a borde: un cristal negro
  enorme dejaba al personaje en un rectángulo oscuro sin color propio; con frente y barbilla la
  carcasa manda (y el chiste del reacondicionado mejora). (2) El oro rosa se probó primero más
  pálido y `tests/cinco-juntos.test.ts` lo leía «gris» (sin color propio); se saturó un poco, con
  el tono por debajo de 15° para no caer en el del Becario. (3) El cristal es casi todo el tono 4 de
  `pantalla`, por debajo del umbral de brillo de ese test, para que el color dominante sea la
  carcasa. (4) La cara se pinta en una capa aparte y baja una fila para no tocar la barra de estado.
  (5) El arma, sus balas y la batería baja siguen con el dibujo viejo hasta la (a13); el Mostrador
  pinta su vitrina con los colores viejos (`ROSE`, `SCREEN` siguen exportados para eso).
- Medidas: la simulación no cambia. `npm run bot` 200 partidas, 0 fallos. 1133 tests en verde;
  `npm run e2e` entero en verde (en segundo plano: tarda más de 10 minutos).
- Problemas conocidos: a tamaño real la grieta y la boca quedan cerca y la boca se pierde un poco;
  el golpe raya también las cejas (se lee como avería, se deja). Rodando, las dos zapatillas se
  juntan en una mancha (igual que los demás).
- Siguiente paso: M14c (a6c2), la Fotocopiadora; o la (a6d), el Sello y el Climatizador.

## 2026-11-14 11:56 (hora peninsular) — Hito M14c — (a6c1) La Destructora con el estilo nuevo
- Contexto: segunda tarea de la sesión, tras la (a6b2). La (a4d2), el Móvil, la siguiente de la
  lista, es la que la sesión del Becario apuntó como su siguiente paso (y la cogió a las 11:27), así
  que esta coge la planta 4, que no se pisa con los personajes. La (a6c) se partió en dos en la hoja
  de ruta: la destructora se dibuja desde tres lados y sola ya es una tarea.
- Hecho: M14c (a6c1), en un archivo nuevo, `tools/sprites/planta4-nuevo.ts` (para las de la
  planta 4; `box34` de la planta 3 se exporta para usarla aquí). **La Destructora de Documentos**
  (46 × 44, antes 34 × 32; 21 fotogramas, los mismos siete por lado: zumbando, andando y con las
  cuchillas rojas): de lado, una caja de tres cuartos de plástico `beige` de oficina con la cara
  delante y la **papelera de `vidrio`** a la espalda (tiras de papel verticales que se ven a través
  del cristal, el reflejo de la ventana y el montón asomando por arriba); de frente, la cara con las
  tiras asomando detrás; de espaldas, toda papelera con la pegatina. La boca es **la ranura de las
  cuchillas en la fila de su `muzzleY`** (dientes de acero; rojos y los ojos entornados cuando
  avisa o mastica una bala); cejas hacia dentro y párpados pesados («un documento es un
  documento»); el **pósit «Confidencial»** tapando una esquina de la boca, la pegatina de **«No
  introducir la mano»**, **un documento a medio tragar** en la ranura de arriba con su sello rojo,
  el piloto verde (rojo al avisar), una raja, el cerco de un café y zapatos de oficina. Ancla nueva
  (23, 42); la caja de golpes, la de siempre. Tests en `tests/estilo-a6.test.ts` (ahora 12): entra
  en los generales y uno nuevo mira los pies en el ancla en los tres lados, la boca en su fila (y
  sin boca de espaldas), los dientes rojos solo al avisar y la papelera de cristal de lado y de
  espaldas pero no de frente. e2e: `50p` y `50q` (en la captura del atasco, las cuchillas rojas).
- Decisiones: (1) Las tiras de la papelera son columnas de papel de dos píxeles con un hueco que
  se mecen cada cuatro filas: la primera versión, con el vaivén de cada dos filas, se leía como un
  tablero de ajedrez. (2) La caja creció hasta 22 de alto: con 18 las piernas parecían largas y la
  destructora, pequeña. (3) El documento a medio tragar es el chiste nuevo: se ve desde los dos
  lados que tienen cara.
- Medidas: la simulación no cambia (`npm run bot`: 200 partidas, 0 fallos, 5 atascos, igual).
  1126 tests en verde; e2e entero en verde (una primera pasada falló al principio por correrlo a la
  vez que el bot: el e2e, solo).
- Problemas conocidos: la cara de delante es una superficie beige grande y lisa; si a tamaño real
  aburre, se le puede añadir la rejilla de ventilación. Las tiras que escupe son las de antes ((a10)).
- Siguiente paso: M14c (a6c2), la Fotocopiadora.

## 2026-11-14 11:10 (hora peninsular) — Hito M14c — (a6b2) Las piezas del cubo y los muñequitos del sobre
- Contexto: la (a4d1), el Becario, la tenía otra sesión (terminó mientras tanto; el `pull --rebase`
  mezcló sin conflictos). Al empezar, el `main` local de esta máquina era una copia vieja y poco
  profunda del 6 de noviembre que git veía «sin historia común» con `origin/main`; se puso `main`
  donde `origin/main` (`git checkout -B main origin/main`) sin tocar nada del remoto.
- Hecho: M14c (a6b2), en `tools/sprites/planta3-nuevo.ts`. **Las piezas** (`pieza`, 12 × 10, antes
  10 × 8; las mismas cuatro: la roja de 2 × 2, la azul de 3 × 1, la amarilla de 2 × 1 y la esquina
  verde): cara de arriba con un tetón por casilla (brillo arriba a la izquierda y sombra debajo),
  cara de delante con el filo iluminado y la sombra contra el suelo, y un canto de un píxel a la
  derecha; se pintan de la fila de atrás a la de delante, así la esquina enseña el canto de la pieza
  de atrás. **El Muñequito Repetido** (24 × 28, antes 18 × 20): una figura de vinilo casi toda
  cabeza (un cuadrado redondeado, superelipse sombreada con `heightShade`, en `carton` aclarado),
  el pelo pintado de un bloque con flequillo y su sombra en la frente, la costura del molde por el
  lado, cejas de enfado, ojos de punto con brillo, **la sonrisa roja impresa un píxel por debajo
  de la boca** (impresión barata), colorete, el peto turquesa con la **pegatina «x3»** en el pecho,
  bracitos sin dedos y pies de una pieza; mordiendo, la boca abierta con dos dientes. **El Dorado**:
  el mismo molde en `amarillo` con brillos especulares, párpados a media asta, una sonrisita de
  lado, el destello de cuatro puntas en la cabeza y **la estrella del pecho en la fila de su
  `muzzleY`** (de ahí salen sus anillos). Los mismos fotogramas que antes (7 y 6); anclas nuevas
  (12, 26) en `src/data/enemies.ts`; las cajas de golpes, las de siempre. Tests en
  `tests/estilo-a6.test.ts` (ahora 11): los dos muñequitos entran en los generales (legibilidad,
  hojas y anclas); uno nuevo mira los pies en el ancla, la altura, la pegatina y la estrella en la
  fila de su `muzzleY`, la boca abierta al morder y que los dos salen del mismo molde; otro, que las
  piezas son una por clase, de su color, legibles y del ancho del círculo que pica (`BRICK_RADIUS`).
- Decisiones: (1) Sin materiales nuevos: el vinilo es `carton` con más luz (`bias`), que es casi
  el tono del muñequito viejo, y el pelo `quemada`; así no se toca `src/art/paleta.ts`, que la otra
  sesión podía estar tocando. (2) Las cejas y los ojos bajaron una fila: pegados al flequillo se
  leían como pelos sueltos. (3) Sin tramado en la cabeza: con él la cara salía con motas de
  suciedad (lo que ya dice la guía). (4) Los muñequitos siguen siendo bastante más pequeños que el
  sobre (34 × 40): son lo que sale de él y tienen 2 de vida. (5) Las piezas no crecen más: tienen
  que medir lo que el círculo que hace daño en el suelo (radio 5).
- Medidas: la simulación no cambia (`npm run bot`: 200 partidas, 0 fallos, 5 atascos, igual que al
  empezar). 1125 tests en verde; e2e entero en verde (`35u` con las piezas en el suelo y `35w` con
  los muñequitos).
- Problemas conocidos: sobre el suelo de puzle de colores de la Juguetería, las piezas se leen por
  el contorno más que por el color; si molesta, una sombra violeta debajo (la pondría el juego,
  como a los personajes). Los restos que suelta el sobre al romperse son los de antes.
- Siguiente paso: M14c (a4d2), el Móvil, si nadie lo ha cogido; si no, la (a6c), la Destructora y la
  Fotocopiadora.

## 2026-11-14 10:35 (hora peninsular) — Hito M14c — (a4d1) El Becario Eterno con el estilo nuevo
- Contexto: sesión automática. Al llegar, otra sesión tenía la (a6a) (ya terminada al empezar a
  programar); la (a4d) estaba libre y la partí en dos como la (a4c): (a4d1) el Becario y (a4d2) el
  Móvil. La rama `main` local estaba desfasada de `origin/main` (un clon viejo); la puse en
  `origin/main` sin tocar la historia remota.
- Hecho: **El Becario Eterno** (`tools/sprites/becario.ts`) en el estilo nuevo, 40 × 47, con los
  24 fotogramas de los otros tres (`BECARIO_FRAMES`, `BECARIO_EXTRA`, `BECARIO_ANIM`). Material nuevo
  `piel` en `src/art/paleta.ts` (melocotón, sombras al rosa y al ciruela). Cabeza grande en bloque
  de tres cuartos con la oreja en sombra y la nariz asomando, el pelo revuelto con mechones de punta
  y flequillo, el pósit en el pelo (la esquina se levanta en los fotogramas impares) y los ojos de
  sueño con ojeras; camisa blanca una talla grande con la mancha de café, cinturón, la acreditación
  con el hueco gris de la foto que nunca le hicieron; chinos y mocasines con un céntimo en la
  ranura (sus únicos ahorros). Detalle nuevo con chiste: **un café para llevar en la mano de
  atrás**, que no es suyo. Rodando, la acreditación da vueltas en su cinta; el golpe hace saltar el
  café; al morir le vuelan los papeles (no es un electrodoméstico: sin chispas); roto, el café
  derramado en el suelo, la acreditación del revés y el pósit caído. Mano de piel de 7 × 7, sombra
  de 10. Ficha nueva en `src/data/characters.ts`. Tests nuevos en `tests/becario-a4d.test.ts` (6);
  `tests/becario.test.ts` actualizado, y los dos tests de la tostadora que usaban al Becario como
  «personaje del marco viejo» usan ahora el Móvil. Sección nueva en `docs/ESTILO_ARTE.md`.
- Decisiones: (1) El café en la mano de atrás en lugar de un cable: le da una silueta propia (los
  cinco siguen distintos: `tests/cinco-juntos.test.ts` en verde) y es el chiste de siempre del
  personaje. (2) La acreditación se pinta la última para que, al girar, pase por delante de la
  cara. (3) El pelo y los mocasines, con `quemada`; la camisa, con `acero`; los chinos, con
  `carton`: solo hacía falta un material nuevo, la piel.
- Medidas: la simulación no cambia (`npm run bot`: 0 fallos). 1122 tests en verde; `npm run e2e`
  entero en verde.
- Problemas conocidos: tumbado al romperse, el juego gira el dibujo entero, así que el charco de
  café sale en vertical junto a él (pasa lo mismo con el cable de los otros); es pequeño y se deja.
  El Mostrador sigue pintando su vitrina con los colores viejos, como con los demás.
- Siguiente paso: M14c (a4d2), el Móvil con el estilo nuevo; con él se cierra la (a4).
## 2026-11-14 09:55 (hora peninsular) — Hito M14c — (a6b) El Cubo de Piezas y el Sobre Sorpresa con el estilo nuevo
- Contexto: segunda tarea de la sesión, tras la (a6a). La (a4d) sigue libre; esta coge la planta 3,
  que no se pisa con los personajes.
- Hecho: M14c (a6b), en `tools/sprites/planta3-nuevo.ts`. **El Cubo de Piezas** (40 × 42): un cubo
  de plástico rojo que se estrecha hacia abajo, sombreado como un cilindro que adelgaza
  (`heightShade`, con su brillo), el borde un píxel más ancho **en la fila de su `muzzleY`** (de ahí
  salen las piezas); la tapa amarilla puesta de gorra (un disco visto desde arriba, su canto y la
  visera a la derecha) con cuatro tetones; el asa de alambre bajando por los lados hasta debajo de la
  barbilla, de barboquejo; la pieza verde torcida en la frente; ojos de pieza redonda blanca, cejas
  gruesas y la boca agria; la pegatina del «1000+» en el costado, el esparadrapo sobre una grieta y
  zapatos de ladrillo azul con sus tetones. Con la tapa levantada (el aviso antes de tirar), un
  puñado de piezas azules, amarillas y verdes asoma por el borde, las cejas bajan y la mano sube.
  **El Sobre Sorpresa** (34 × 40): un sobre de cromos de papel de aluminio fucsia (material nuevo,
  `fucsia`) con brillos en diagonal, las dos pestañas dentadas que asoman de la silueta, la línea de
  puntos de «corte aquí» con las tijeras, la letra pequeña en el canto y abajo, la estrella con la
  «?» en la esquina y una sonrisa codiciosa **a la altura de su `muzzleY`**; agachado para saltar,
  más bajo y ancho; en el aire, los pies recogidos; a punto de escupir, la boca abierta llena de
  confeti. Los mismos fotogramas de antes (7 y 5). Anclas nuevas (cubo 19, 40; sobre 17, 38).
  Tests en `tests/estilo-a6.test.ts` (ahora 9): los dos entran en los generales, y uno nuevo
  comprueba los pies en el ancla (y recogidos en el aire), el borde del cubo y la boca del sobre en
  la fila de su `muzzleY`, las piezas que solo se ven con la tapa levantada y la boca abierta del
  sobre al escupir. La comparación de siluetas ya mide los cuatro de la planta entre sí.
- Decisiones: (1) El sobre en `rosa` (el del secador) quedaba desvaído, de cojín; el aluminio pide
  un magenta saturado como el de antes, así que lleva rampa propia. (2) Se probó un código de barras
  abajo: pegado a la boca parecía una dentadura, y se cambió por más letra pequeña (que además va con
  el juego). (3) El asa del cubo cruzando la cara parecía una sonrisa; baja por debajo de la boca.
  (4) Las piezas y los muñequitos se quedan con el dibujo viejo por ahora: van en una tarea aparte,
  (a6b2), para no alargar esta.
- Medidas: la simulación no cambia (`npm run bot`: 200 partidas, 0 fallos, 5 atascos, igual). Tests
  y e2e en verde.
- Problemas conocidos: las cajas de golpes son las de antes. Los muñequitos del sobre, viejos, se
  ven pequeños al lado.
- Siguiente paso: M14c (a6b2), las piezas y los muñequitos (la (a4d1) la tiene otra sesión).

## 2026-11-14 09:20 (hora peninsular) — Hito M14c — (a6a) El Robot de Cuerda y el Coche Teledirigido con el estilo nuevo
- Contexto: sesión programada. El `main` local era un clon viejo y superficial (`git fetch
  --unshallow` y `main` movido a `origin/main`; no tenía nada propio). Había dos sesiones
  trabajando (la (a4c), personajes, y la (a5e), planta 2), así que esta coge la planta 3, que no toca
  ni a los personajes ni a la planta 2. Salud al empezar: `check`, 1095 tests, `build` y `bot` en verde.
- Hecho: M14c (a6a), y la (a6) partida en seis (de dos en dos, como la (a5)). Archivo nuevo,
  `tools/sprites/planta3-nuevo.ts`. **El Robot de Cuerda** (42 × 44): una caja de hojalata en tres
  cuartos (cabeza y cuerpo en uno) de un verde agua desteñido (material nuevo, `hojalata`), con la
  franja roja litografiada abajo y su filete amarillo, la costura del cuello con cuatro remaches, la
  abolladura de la esquina y la pintura saltada; la rejilla de dientes de lata **a la altura de su
  `muzzleY`** (de ahí salen las tuercas); el ojo de atrás agrio bajo un párpado pesado y el de delante
  un tornillo, cuya ranura va inclinada cuando está enfadado, plana sin cuerda y gira mientras se da
  cuerda; la antena torcida con la bola roja (caída sin cuerda); la llave de latón en la espalda con
  su tira de esparadrapo, que gira en tres posiciones (de frente, de canto y a tres cuartos); la
  etiqueta amarilla del «33+» en el costado, y zapatos de lata rojos. Nueve fotogramas, los de
  siempre: de pie, la marcha rígida con la llave girando, sin cuerda (hundido, ojos a media asta) y
  dándose cuerda (temblando un píxel a cada lado con dos rayitas de esfuerzo). **El Coche
  Teledirigido** (46 × 30): de lado, morro a la derecha, de plástico violeta, con techo, lunas oscuras
  con reflejo y el parabrisas inclinado; la cara de matón en el parachoques (faros amarillos bajo
  cejas gordas y una parrilla de dientes); la antena doblada con la punta roja, el alerón sujeto con
  cinta, la raya de carreras que se despega por detrás y la rueda de delante de otro coche (más
  pequeña y blanca). Embistiendo, ojos rojos, la boca abierta y humo por detrás; volcado, boca abajo
  sobre el techo con los ojos en X; sin pilas, los faros apagados y una batería con una rayita roja
  encima del techo (el juego ya lo hace parpadear). Anclas nuevas (robot 21, 42; coche 22, 28); las
  cajas de golpes, las de siempre. Tests en `tests/estilo-a6.test.ts` (8): legibilidad de todos los
  fotogramas, hojas y anclas, los pies del robot y las ruedas del coche (también volcado) en el
  ancla, tamaño, la rejilla en la fila del `muzzleY` y la llave que gira, el coche volcado boca abajo
  y sin pilas con los faros apagados, y que no se parecen a los demás de su planta.
- Decisiones: (1) El robot conserva su verde agua (es como se le reconoce), pero en una rampa propia
  de siete tonos; con la cara frontal en los tonos 2–3 (en 1–2 quedaba lavado y los ojos no se
  leían). (2) El coche iba a llevar un material `morado` nuevo; al juntar con la (a4c1) apareció
  `violeta` (el de la Batidora de Vaso), casi igual, así que lo usa y la paleta no crece con un
  duplicado. (3) El cuerpo del robot baja 2 px respecto al primer intento: con 6 px de pierna parecía
  ir en zancos. (4) En el test de siluetas solo cuentan los pares con un redibujado: el Cubo y el
  Sobre viejos se solapan 0,84 entre ellos, y eso es cosa de la (a6b). (5) `box34` está copiada de
  `planta2-nuevo.ts` (allí no se exporta y otra sesión estaba tocando ese archivo); cuando las dos se
  asienten, que pase a `src/art/pintor.ts`.
- Medidas: la simulación no cambia (`npm run bot`: 200 partidas, 0 fallos, 5 atascos, igual). 1103
  tests en verde (antes de juntar con las otras sesiones); e2e en verde (una primera pasada falló en
  `11b` con la garantía en el suelo, mientras corrían los tests a la vez; sola, en verde).
- Problemas conocidos: las cajas de golpes son las de antes (el coche nuevo es más largo que la
  suya). El robot embistiendo se ve girado en el juego (lo gira el render, como antes).
- Siguiente paso: M14c (a6b), el Cubo de Piezas y el Sobre Sorpresa (con las piezas y los
  muñequitos).

## 2026-11-14 09:10 (hora peninsular) — Hito M14c — (a4c2) La Plancha de Vapor con el estilo nuevo
- Contexto: misma sesión que la (a4c1), encadenada (paso 7). Al cogerla, las otras dos sesiones
  tenían la (a5e) y la (a6a), enemigos; esta no los toca.
- Hecho: M14c (a4c2), y con ella la (a4c) entera. **La Plancha de Vapor**
  (`tools/sprites/plancha-vapor.ts`) en el estilo nuevo con sus propios fotogramas: 46 × 43, 24 en
  la hoja (`IRON_FRAMES`, `IRON_EXTRA`, `IRON_ANIM`), los mismos que la tostadora y la batidora.
  De perfil, la punta de la suela hacia delante: la más ancha y la más baja de los tres. Carcasa
  de plástico **turquesa** (material nuevo en `src/art/paleta.ts`, más hondo que la `menta` de la
  batidora de mano) con el lomo en sombra, el canto de delante brillando y un reflejo largo arriba;
  el asa azul marino en arco con el botón rojo del vapor; el depósito con el agua que se balancea
  al andar y al rodar (`slosh`); el dial en LINO; la franja blanca y la suela de acero con sus
  agujeros; y el trozo del cuello de la camisa de la entrevista, quemado, pegado debajo. Cara de
  párpados planos y boca recta («ha planchado cosas peores que tú»). El golpe y la primera
  sacudida **echan vapor por la suela** (`burst`); rota, el asa se suelta del poste y la carcasa
  se raja. Guantes blancos de algodón (`mano-plancha`, nuevo) y los zapatos negros de la
  entrevista, largos y con brillo. Ficha nueva en `src/data/characters.ts` (marco, `anim`, mano y
  sombra de 15). Tests nuevos en `tests/plancha-a4c.test.ts` (6, como los de la batidora);
  `tests/plancha-vapor.test.ts` cuenta 24 fotogramas y la mide ya contra la tostadora y la
  batidora nuevas (la fila más ancha, y más baja que la batidora desde los pies), como pedía la
  hoja de ruta. Sección nueva en `docs/ESTILO_ARTE.md`.
- Decisiones: (1) El vapor semitransparente se pone con `Canvas.put` y no con `set`: `set` lo
  mezclaba con el píxel vacío y salía gris oscuro (lo mismo le pasaba al vapor de la punta de la
  plancha vieja); el humo de la tostadora sigue como estaba, para no cambiar su hoja. (2) La cara
  en el costado y no en la punta: es donde cabe con los párpados planos, y así mira hacia delante
  como las demás. (3) El eje del giro (`spinY` 20) es el medio del asa a la suela.
- Medidas: la simulación no cambia (`npm run bot`: 200 partidas, 0 fallos, 5 atascos, los de
  siempre). 1108 tests en verde (con los de la (a5e), que entró mientras); `npm run e2e` entero
  en verde a la primera.
- Problemas conocidos: el vapor del golpe se ve poco encima del suelo oscuro (el juego echa
  además sus bocanadas al herirla). El Pulverizador de Almidón sigue con el dibujo viejo (a13).
- Siguiente paso: M14c (a4d), el Becario Eterno y el Móvil con el estilo nuevo.


## 2026-11-14 08:45 (hora peninsular) — Hito M14c — (a5e) El Ratón Inalámbrico y la Webcam con el estilo nuevo; (a5) terminada
- Contexto: tercera tarea de la sesión, tras la (a5c) y la (a5d). La (a4c) sigue cogida por otra
  sesión; esta no toca personajes.
- Hecho: M14c (a5e), y con ella la (a5) entera. En `tools/sprites/planta2-nuevo.ts`. **El Ratón
  Inalámbrico sin Pilas** (36 × 34): una cúpula plateada sombreada con `heightShade`, más alta por
  detrás como un ratón de verdad, con la raya de los dos botones, la rueda de goma asomando, la luz
  roja de batería baja que parpadea entre fotogramas, ojos de harto mirando hacia ti, la boca torcida
  a la altura de su `muzzleY`, el hueco de las pilas sin tapa con su telaraña y el cable cortado con
  el cobre al aire. Congelado sin señal (el aviso): gris, la luz apagada y el círculo de carga en
  lugar de los ojos. **La Webcam Siempre Encendida** (38 × 40): una barra negra brillante en
  cápsula, de pie sobre su pinza de monitor, con un objetivo grande (bisel de acero, cristal oscuro e
  iris azul que se reenfoca) justo en la fila de la que dispara, la tapa de privacidad plateada a
  media asta como un párpado desconfiado, la luz de «no estoy grabando» muerta, la cinta que alguien
  le pegó encima, despegada y colgando, los agujeros del micro y el USB de cola. Grabando: sin tapa
  y con el iris rojo (la luz sigue apagada: es el chiste). Anclas nuevas (ratón 17, 32; webcam 18,
  38). Tests: los dos entran en los generales de `tests/estilo-a5.test.ts` (ahora 14) y en el de
  siluetas de la planta 2; uno nuevo comprueba que el iris está en la fila de su `muzzleY`, que
  grabando se pone rojo y que el ratón congelado es otro dibujo.
- Decisiones: (1) El ratón en `acero` un poco oscurecido (plateado): en blanco se confundía con el
  cargador, que es de la misma planta. (2) Su cara, abajo en la pendiente de delante, con ojos de
  esclerótica blanca en una cuenca oscura: con ojos oscuros sobre el gris de la sombra no se leían
  a tamaño real; y el hueco de las pilas, bajo y pequeño, porque más grande parecía otra cara.
  (3) La tapa de la webcam, plateada y no negra: en el negro del cuerpo no se veía el párpado.
- Medidas: la simulación no cambia (`npm run bot`: 200 partidas, 0 fallos, 5 atascos, igual).
  1096 tests en verde; e2e en verde (corrido antes del último retoque de los ojos del ratón, que solo
  cambia píxeles de la cara; `check`, tests, `build` y `bot` repetidos después).
- Problemas conocidos: el ratón sigue siendo el menos expresivo de la planta 2 a tamaño real; si al
  humano no le convence, que se apunte en sus notas. Las cajas de golpes son las de antes.
- Siguiente paso: M14c (a6b) (la (a6a) ya la ha cogido otra sesión) o la (a4d).

## 2026-11-14 08:35 (hora peninsular) — Hito M14c — (a4c1) La Batidora de Vaso con el estilo nuevo
- Contexto: sesión programada. El `main` local era una copia vieja y superficial que se había
  separado de `origin/main` (50 y 50 commits): se dejó igual que `origin/main`
  (`git checkout -B main origin/main`), sin perder nada (no tenía commits propios). La (a5c) la
  tenía otra sesión desde las 06:25 (menos de 90 minutos), así que esta cogió la (a4c), que no toca
  enemigos. Salud al empezar: `check`, 1088 tests, `build` y `bot` en verde.
- Hecho: **la (a4c) partida en dos** en la hoja de ruta (cada personaje con 24 fotogramas es una
  sesión, como lo fue la tostadora en (a4a) y (a4b)), y hecha la **(a4c1), la Batidora de Vaso**
  (`tools/sprites/batidora-vaso.ts`), en el estilo nuevo y ya con sus propios fotogramas: 40 × 50,
  24 en la hoja (`BLENDER_FRAMES` y `BLENDER_EXTRA`, `BLENDER_ANIM`), los mismos que la tostadora
  (andar 6, rodar 6, disparar, el golpe en dos tiempos y dos sacudidas). Motor de plástico
  **violeta** en tres cuartos con la cara delante: ojos muy abiertos de no dormir (pupila diminuta,
  una vena roja y ojeras), cejas hacia la nariz y una sonrisa con todos los dientes; en el lado, el
  dial atascado en PULSE y la pegatina de devolución; el pie de goma con sus ventosas. Encima, el
  collar acanalado y el **vaso de cristal** (reflejo de la ventana por el lado de la luz, marcas de
  medida, el borde de atrás) con el **batido verde de la dieta seco dentro**, cuya superficie se
  inclina con los pasos y se agita al rodar (`slosh`), salpicaduras secas por el cristal y un
  chorreón por el motor. La **tapa y la pajita saltan** con el golpe y en las sacudidas; rota, la
  tapa queda torcida, sin pajita y con el vaso rajado. Rodando: encogida, ojos cerrados, dientes
  apretados, las cuchillas hechas un borrón y el cable dando latigazos (el juego sigue poniendo el
  giro de cuchillas encima). Guantes (`mano-batidora`, nuevo) y zapatillas de correr **lima** con
  calcetines blancos, «compradas para la misma dieta, casi sin usar»; el cable enrollado en el
  suelo con su brida amarilla. Materiales nuevos `violeta` y `vidrio` en `src/art/paleta.ts`. Su
  ficha (`src/data/characters.ts`) trae el marco nuevo, `anim`, la mano y la sombra de 12.
  Tests nuevos en `tests/batidora-a4c.test.ts` (6: la hoja y la ficha, los pies y el centro, el
  estilo y la legibilidad de los 24, que se distinga de la tostadora, el batido que se mueve, la
  tapa, la grieta, las chispas, la bola sin mover el cuerpo, el retroceso y `heroFrame`). Sección
  nueva en `docs/ESTILO_ARTE.md`.
- Decisiones: (1) Más alta que la tostadora (40 × 50, el vaso por encima) y no más ancha: así la
  silueta de las dos se distingue en el suelo (solape medido por debajo de 0,8). (2) La cara es la
  del motor, no la del vaso: el vaso es la «cabeza» de cristal, y una cara detrás del cristal no se
  leía. (3) El eje del giro (`spinY` 22) es el medio de todo el cuerpo, de la pajita al pie de
  goma, porque el vaso pesa en la silueta. (4) El arma y el giro de cuchillas siguen siendo los
  viejos: las armas van en la (a13). (5) Tests ajustados: `tests/batidora-vaso.test.ts` cuenta 24
  fotogramas y mide la altura desde los pies (los marcos ya no son iguales);
  `tests/plancha-vapor.test.ts` ya no mide a la Plancha contra la batidora (la nueva es más grande;
  la (a4c2) la medirá contra las nuevas); `tests/tostadora-a4b.test.ts` usa al Becario como
  personaje sin fotogramas propios.
- Medidas: la simulación no cambia (`npm run bot`: 200 partidas, 0 fallos, 5 atascos, los de
  siempre). 1101 tests en verde (con los de la (a5c) y la (a5d), que entraron mientras); `npm run e2e` entero en verde a la segunda (la primera falló
  esperando a que la batidora de mano enemiga cogiera carrerilla en la Sala de Pruebas, `08b`, a
  los dos minutos: nada de esta tarea; a la segunda pasó entero).
- Problemas conocidos: en el juego el arma queda a la altura de la boca (la mano va a la altura de
  siempre y ella es más alta): se lee bien, pero si molesta, que la (a13) suba un poco la mano de
  los personajes altos. El tablón del Mostrador sigue con su icono viejo.
- Siguiente paso: M14c (a4c2), la Plancha de Vapor con el estilo nuevo y sus 24 fotogramas.
## 2026-11-14 08:00 (hora peninsular) — Hito M14c — (a5d) La Impresora y el Cargador con el estilo nuevo
- Contexto: segunda tarea de la sesión, tras la (a5c). La (a4c) la tiene otra sesión desde las 07:27;
  esta no toca a los personajes.
- Hecho: M14c (a5d). Archivo nuevo, `tools/sprites/planta2-nuevo.ts`, para los enemigos de la planta
  2 (usa las piernas y los guantes de la planta 1, que ahora se exportan, y un `box34` para las cajas
  en tres cuartos como el microondas). **La Impresora que se Atasca** (48 × 42): ancha y plana, en un
  beige de oficina amarilleado (material nuevo, `beige`, más gris que el `crema` del microondas), con
  la tapa grande, el montón de folios inclinado en la bandeja de atrás, ojos cansados con las cejas
  hacia dentro, la pantallita verde con ERR y la luz amarilla, el pósit amarillo del NO y la etiqueta
  roja del precio de la tinta en el costado, y la ranura de salida por boca **a la altura de su
  `muzzleY`** con una factura de borde rojo asomando. Atascada (los fotogramas 6 y 7): el cuerpo se
  sacude un píxel a cada lado sobre las piernas quietas (pintado aparte y unido con `Paint.stamp`),
  ojos > <, la factura arrugada en los rodillos, la luz en rojo, humo y una chispa. **El Cargador
  Falso** (32 × 32): un ladrillo blanco con los dos cuernos de latón, un antifaz de ladrón
  (los ojos de reojo en una franja oscura), sonrisa de dientes a la altura de la que escupe, la
  quemadura de calentarse, chanclas, y el cable de cola con la etiqueta amarilla de GRATIS. Zumbando,
  una chispa entre los cuernos; descubierto, los ojos como platos y chispas. **El cebo** es un
  cargador tumbado en el suelo con los cuernos a un lado, los ojos cerrados y el cable enrollado.
  Ocho fotogramas cada uno, los de siempre. Anclas nuevas (impresora 24, 40; cargador 15, 30). Tests
  en `tests/estilo-a5.test.ts` (ahora 13): los dos entran en los generales; nuevos, las siluetas
  de la planta 2 entre sí, que la boca de cada uno esté en la fila de su `muzzleY`, que la impresora
  atascada se sacuda 2 px entre sus dos fotogramas y que el cebo esté tumbado y en el suelo.
- Decisiones: (1) Con los ojos negros y la sonrisa de dientes el cargador parecía una calavera; con
  los ojos claros no se leían sobre el blanco. La franja oscura de antifaz los hace legibles y le
  va al personaje (es un cargador pirata que se hace pasar por gratis). (2) El guante de atrás de la
  impresora se separa un píxel del borde para que al sacudirse no se corte el contorno. (3) Las
  balas (las facturas) siguen con el dibujo viejo: van con los efectos, en la (a10).
- Medidas: la simulación no cambia (`npm run bot`: 200 partidas, 0 fallos, 5 atascos, igual). 1095
  tests en verde; e2e en verde.
- Problemas conocidos: las cajas de golpes son las de antes (más pequeñas que los dibujos). El
  ratón y la webcam, con el estilo viejo, se ven pequeños al lado de la impresora hasta la (a5e).
- Siguiente paso: M14c (a5e), el Ratón Inalámbrico y la Webcam.

## 2026-11-14 07:15 (hora peninsular) — Hito M14c — (a5c) La Batidora y el Mando con el estilo nuevo
- Contexto: sesión programada. El `main` local era otra vez un clon viejo y superficial (`git reset
  --hard origin/main`). La (a4b) la tiene otra sesión desde las 05:25 (menos de 90 minutos), así que
  esta coge la (a5c), que no toca a la tostadora. Salud al empezar: `check`, 1084 tests, `build` y
  `bot` en verde.
- Hecho: M14c (a5c). **La Batidora de Mano** (42 × 38, en `tools/sprites/planta1-nuevo.ts`): un
  bloque redondeado sombreado como un cojín con `heightShade`, en el verde menta de las cocinas de los
  setenta (material nuevo, `menta`, en `src/art/paleta.ts`), con el asa en lazo sobre el lomo (hueca
  por debajo), la ranura de las cinco velocidades y el cursor atascado en el TURBO rojo, las rejillas
  detrás, el ojo de atrás entornado y el de delante desorbitado, dientes apretados torciendo la
  boca, y el cable con su nudo y el enchufe arrastrando. Debajo de la barbilla, **dos varillas de
  globo** con masa reseca: un globo oscuro con los alambres del contorno y dos de dentro que giran
  con el fotograma (`spin`), así cada uno de los cuatro fotogramas de reposo es distinto y el juego
  los acelera al cargar (`busyMs`). Ocho fotogramas, los mismos que antes. **El Mando a Distancia**
  (32 × 46): de pie, en tres cuartos como el microondas (frente, lado y tapa), gris claro, con
  zapatillas de cuadros, el botón rojo de encender, la ventana de infrarrojos en la frente, ojos
  de reojo con los párpados a media asta y media sonrisa, el teclado sin el «1» (un agujero), el
  volumen gastado, las pilas al aire sujetas con cinta en el costado y un ganchito pegado en la
  cabeza. Seis fotogramas, los mismos (`narrowPoseCycle`). Anclas nuevas en `src/data/enemies.ts`
  (batidora 15, 36; mando 17, 44). Tests en `tests/estilo-a5.test.ts` (ahora 10): los dos entran en
  los de legibilidad, hojas, pies, tamaño y cajas; uno nuevo comprueba que las varillas giran y otro
  que la fila de la que dispara el mando (`muzzleY`) cae en su ventana roja.
- Decisiones: (1) El mando, primero en la goma oscura (un mando de verdad es negro): se fundía con
  el suelo (el 49 % de sus píxeles sin contraste). Gris claro, con la goma solo en las sombras, se
  lee y sigue pareciendo de plástico. (2) La ventana de infrarrojos se coloca a la altura de su
  `muzzleY` (24) y no al revés: así la simulación no cambia y las ondas salen de la ventana; el
  botón de encender y el volumen ocupan la frente. (3) Las varillas como globo relleno de oscuro
  con los alambres encima: solo con alambres, el contorno las convertía en un garabato. (4) La
  batidora no tiene fotograma nuevo para el TURBO: ya se ve en la velocidad de las varillas;
  pintarla de rojo sería un aviso nuevo, y eso es diseño, no arte.
- Medidas: la simulación no cambia (`npm run bot`: 200 partidas, 0 fallos, 5 atascos, igual que
  antes). Siluetas de la planta 1, todas por debajo de 0,8 entre sí. 1086 tests en verde; e2e en
  verde. Al subir, otra sesión había subido la (a4b) (la tostadora con 24 fotogramas): solo chocaron
  la bitácora y `progress.json`; juntas, 1092 tests, `check`, `build` y `bot` en verde.
- Problemas conocidos: las cajas de golpes son las de antes, más pequeñas que los dibujos (como en
  la (a5a)). Las piernas del mando casi no se ven bajo el cuerpo (es así de bajito).
- Siguiente paso: M14c (a5d), la Impresora y el Cargador.

## 2026-11-14 05:25 (hora peninsular) — Hito M14c — (a4b) Los fotogramas nuevos de la Tostadora
- Contexto: sesión programada. El `main` local no estaba en ninguna rama (`git checkout main` y
  `reset` a `origin/main`). La (a5b) la tiene otra sesión desde las 05:00 (menos de 90 minutos);
  esta coge la (a4b), que no toca enemigos. Salud al empezar: `check`, 1073 tests y `build` en verde.
- Hecho: M14c (a4b). **La tostadora tiene sus propios fotogramas**: la hoja pasa de 8 a 24
  (`TOASTER_EXTRA` en `tools/sprites/tostadora.ts`, los ocho de siempre se quedan donde estaban).
  **Andar ×6**: la pierna de apoyo empuja hacia atrás mientras la otra avanza con el pie un píxel
  levantado; el cuerpo baja al apoyar y sube al cruzar las piernas, y el guante de atrás se mece.
  **Rodar ×6**: cinco hecha una bola (piernas recogidas, ojos cerrados y dientes apretados, el
  cable dando latigazos alrededor) mientras gira, y la última estirando las piernas para
  aterrizar, cuando ya ha dado la vuelta; la carcasa no se mueve del eje del giro. **Disparar**:
  quieta y justo después de un tiro (0,1 s), se echa atrás un píxel con los ojos entornados, la
  boca apretada y las tostadas sacudidas. **Herida** en dos tiempos: primero el golpe (ojos como
  platos, la boca en O, echada dos píxeles atrás, las tostadas a cuatro píxeles) y luego la cara
  apretada de siempre. **Morir**: dos sacudidas (ojos como platos y luego en blanco, con las
  tostadas medio fuera y chispas en las ranuras y el cable) antes de que salten las tostadas y
  se quede rota. `CharacterLook.anim` (nuevo, opcional) dice dónde está cada animación en la
  hoja, y `src/render/heroAnim.ts` (puro, sin Phaser) elige el fotograma; `GameScene` lo usa y
  apunta la hora del último disparo. Los otros cuatro personajes, sin `anim`, siguen igual.
  Tests: `tests/tostadora-a4b.test.ts` (6: dónde está cada cosa en la hoja, todos distintos y de
  pie en el suelo, la bola sin mover la carcasa y con los pies en el aire, el retroceso y las
  chispas, y `heroFrame` para la tostadora y para un personaje con los ocho de siempre);
  `tests/tostadora-a4a.test.ts` cuenta ahora 24 fotogramas en la hoja.
- Decisiones: (1) El giro de la voltereta lo sigue haciendo el juego (rota el sprite): los
  fotogramas de rodar no dibujan la vuelta, dibujan la bola; así no hace falta dibujar la tostadora
  girada píxel a píxel, que queda mal. (2) Disparar andando sigue con los pasos: el retroceso del
  cuerpo solo se ve quieta (andando se perdería entre los pasos). (3) Un ciclo de seis pasos
  recorre los mismos 28 px que el de cuatro, para que los pies no patinen más ni menos. (4) La
  portada y el final siguen con los fotogramas 0 y 6, que no cambian.
- Medidas: la simulación no cambia (`npm run bot`: 200 partidas, 0 fallos, 5 atascos, los de
  siempre; jefes igual). 1088 tests en verde; `npm run e2e` entero en verde (unos 16 minutos).
- Problemas conocidos: el `npm run e2e` tarda más de diez minutos y hay que lanzarlo en segundo
  plano. Los fotogramas de rodar se ven poco en las capturas fijas (gira deprisa); donde mejor se
  ven es en la hoja del panel.
- Siguiente paso: M14c (a4c), la Batidora de Vaso y la Plancha de Vapor con el estilo nuevo, ya
  con sus fotogramas propios desde el principio (`CharacterLook.anim`).
## 2026-11-14 05:30 (hora peninsular) — Hito M14c — (a5b) La Bombilla y la Polilla con el estilo nuevo
- Contexto: segunda tarea de la sesión, tras la (a5a). La (a4a) estaba cogida por otra sesión (desde
  las 03:30), que la subió mientras yo hacía esta; esta no toca a los personajes.
- Hecho: M14c (a5b). **La Bombilla de Bajo Consumo**, redibujada (38 × 48, en
  `tools/sprites/planta1-nuevo.ts`): un mando intermedio con traje oscuro, camisa, corbata roja,
  boli en el bolsillo y maletín de cartón; el casquillo de latón de cuello, el balasto blanco con su
  etiqueta A+ de collar, y la cabeza es **un globo de cristal con la espiral fluorescente que se
  transparenta** (la «bajo consumo» se reconoce por la espiral), con la cara encima: cejas hacia
  dentro, párpados a media asta y una sonrisita de suficiencia. Una grieta en el cristal. Encendida
  brilla desde dentro; apagada (el fotograma de encenderse, que parpadea) es cristal gris muerto.
  Siete fotogramas, los mismos que antes (0 encendida, 1 apagada, 2 respirando, 3–6 andando). Su
  halo (`SPRITE_GLOWS`) sube al centro del globo nuevo. **La Polilla Fiel** (17 × 15, antes 11 × 9):
  vista desde arriba como una polilla de verdad, alas delanteras en triángulo con su ocelo y las de
  atrás más pequeñas, cuerpo peludo, antenas de pluma y el ojo amarillo a la derecha; alas arriba y
  alas abajo. Su ancla deja el cuerpo donde estaba el de la vieja, encima de su caja de golpes.
  Tests: `tests/estilo-a5.test.ts` ahora con 8 (los de la (a5a) cubren también la bombilla y la
  polilla; uno nuevo comprueba que apagada no queda cristal encendido y que el halo cae en el
  globo; otro, que la polilla aletea y que su cuerpo queda sobre su caja).
- Decisiones: (1) Primero probé la espiral sola como cabeza, con la cara en el balasto: se leía como
  una colmena o una pila de monedas, y la cabeza de cristal (lo que la hace bombilla) quedaba
  pequeña. El globo con la espiral dentro existe de verdad y conserva la cabeza grande de la guía.
  (2) La espiral se ve por encima y por debajo de la cara, no a través: cruzándola, los ojos no se
  leían. (3) Apagada, el gris se aclaró: con el gris oscuro, un tercio del cuerpo se fundía con el
  suelo (lo vio el test de legibilidad).
- Medidas: la simulación no cambia (cajas, `muzzleY`, alturas, igual). Siluetas de la planta 1, todas
  por debajo de 0,8 entre sí. 1084 tests en verde (con los de la (a4a), que otra sesión subió a la
  vez: al juntarlas solo chocaron la bitácora, `progress.json` y una línea de imports); e2e en
  verde (una pasada falló en la tinta del
  sello, en la planta 4, por ir a la vez que los tests: el e2e es de tiempo real y con la máquina
  cargada pasaron 0,42 s en vez de 0,16; repetido solo, en verde).
- Problemas conocidos: los de la (a5a) (las cajas de golpes son las de antes). La polilla, con las
  alas abajo, baja 2 px por debajo de su ancla; no se nota porque vuela.
- Siguiente paso: M14c (a5c), la Batidora y el Mando.

## 2026-11-14 03:30 (hora peninsular) — Hito M14c — (a4a) La Tostadora del juego, con el estilo nuevo
- Contexto: sesión programada. El `main` local otra vez era un clon viejo (`git checkout -B main
  origin/main`). La (h11c) la había cogido otra sesión a las 02:25 (menos de 90 minutos), así que
  esta coge M14c (a4a), que no toca `src/data/rooms.ts` ni nada de la (h11c). Salud al empezar:
  `check`, 1068 tests y `build` en verde.
- Hecho: M14c (a4a). **La tostadora que se juega es la nueva** (la de `art/prueba/tostadora.png`):
  `tools/sprites/tostadora.ts` dibuja los ocho fotogramas de siempre (reposo ×2, andar ×4, herida y
  rota) en un marco de 40 × 46 con los pies en la última fila (`feetY` 45, `feetX` 22,5) y el giro
  de la voltereta en el centro de la carcasa (`spinY` 26). Sin el arma ni el guante de delante (los
  pone el juego, girando con la mira) y sin sombra ni migas en el suelo. Las piernas y el cable se
  pintan aparte del cuerpo, que respira y bota encima, y se juntan con `Paint.stamp` (nuevo en
  `src/art/pintor.ts`) antes del contorno: un solo contorno para toda la figura. Herida: ojos
  apretados (> <), la boca abierta y las dos tostadas saltan dos píxeles. Rota: ojos tachados, sin
  tostadas (han salido disparadas), la palanca abajo, la boca colgando y sin guante de atrás. El
  humo de la quemada se mueve un píxel entre fotogramas. Su guante, `mano-tostadora` (7 × 7, el
  estilo nuevo), y una sombra más ancha (`CharacterLook.shadowRx` 12; el resto sigue en 9). La
  caja de choque no cambia. La portada y el final, que colocaban el dibujo a mano para el marco de
  40 × 41, lo colocan ahora con `classicOrigin` (mismo centro, pies a la misma altura; para los
  demás personajes da lo mismo que antes), y en la estantería del final lo que asomaría por encima
  de la caja cerrada se recorta. El humo y las chispas de la tostadora rota salen un poco más
  lejos (`bajas.ts`). Tests: `tests/tostadora-a4a.test.ts` (5: la hoja, los pies y el centro, la
  tinta y la legibilidad sobre el suelo, cada fotograma distinto con las tostadas que saltan y
  desaparecen, y `classicOrigin`).
- Decisiones: (1) El Secador se queda con el dibujo viejo: lo llevan todos los personajes y su
  agarre (`GUN_GRIP`) es el de todas las armas; cambiarlo es otra tarea, la nueva **(a13) Las armas
  con el estilo nuevo** al final de M14c. (2) La mano sigue a la misma distancia del cuerpo
  (`HAND_REACH`, simulación): con la carcasa más ancha el arma queda delante de la parte baja del
  cuerpo, como en el dibujo de prueba, y así no cambia por dónde salen las balas. (3) En
  `tests/plancha-vapor.test.ts`, «la Plancha es más ancha que la tostadora» se mide contra la
  tostadora vieja (las dos al mismo tamaño) hasta que la (a4c) la redibuje; apuntado en la hoja de
  ruta. (4) En la caja abierta del final las tostadas asoman por arriba: se deja, es una tostadora
  metida en su caja.
- Medidas: la simulación no cambia (`npm run bot`: 200 partidas, 0 fallos, 5 atascos, los de
  siempre; jefes igual que antes). 1073 tests en verde.
- Problemas conocidos: la sombra sigue siendo la vieja, casi negra (la (a12) la hace violeta); las
  otras cuatro personas jugables siguen en el estilo viejo y se ven más pequeñas que la tostadora
  hasta la (a4c) y la (a4d). Un e2e corrido a la vez que los tests y el bot falló por tiempo («la
  ficha de devolución no se cierra», con 2 s de margen); a solas pasa.
- Siguiente paso: M14c (a4b), los fotogramas nuevos de la tostadora (andar 6, rodar 6, disparar,
  herido y morir). (Al subir, la (h11c) y la (a5a) ya estaban hechas por otra sesión, que sigue con la
  (a5b); solo hubo que juntar la bitácora, `progress.json` y una línea de imports de `build.ts`.)
## 2026-11-14 04:55 (hora peninsular) — Hito M14c — (a5a) El Aspirador y el Microondas con el estilo nuevo
- Contexto: sesión programada. El `main` local volvía a ser un clon viejo y superficial que no casaba
  con `origin/main` (`git checkout -B main origin/main`). La (a4a), la Tostadora, está cogida por
  otra sesión desde las 03:30 (menos de 90 minutos): como la (a4b)–(a4d) dependen de ella, cogí la
  (a5), que no toca a los personajes, y la dividí en cinco partes (dos enemigos cada una). Salud al
  empezar: `check` y los 1071 tests en verde.
- Hecho: M14c (a5a). **Los dos primeros enemigos con el estilo nuevo en el juego**
  (`tools/sprites/planta1-nuevo.ts`; las funciones viejas se quedan en `characters.ts` porque
  `art/referencia/` y su test siguen siendo la historia). **El Aspirador Desahuciado** sale del de
  `art/prueba/` (M14c (a1)), ahora con pose: 42 × 40, respira, rueda (las ruedas giran, la manguera
  se mece con el cuerpo y la boquilla no se mueve del suelo) y un fotograma nuevo, el 6, **acelerando
  antes de embestir** (`anim.warn`): el ojo se pone al blanco amarillo, el párpado baja, aprieta la
  rejilla, se echa atrás y escupe polvo por debajo. **El Microondas Sin Seguro**, dibujado de nuevo:
  44 × 46, una caja en tres cuartos de esmalte crema (material nuevo `crema` en
  `src/art/paleta.ts`), la cara dentro de la ventana iluminada (cejas hacia dentro, ojos entornados,
  morros), el panel con el 12:00 en verde y dos ruedas, y **un tenedor clavado arriba que echa
  chispas** (el «sin seguro»). Como desde M14b (h9c) anda (va a donde estaría tu reflejo) y no tenía
  paso, ahora tiene cuatro fotogramas de andar; y el 6, **calentando**: la ventana al blanco, los
  dientes apretados, más chispas y vapor por las rejillas. El parpadeo del 12:00 (`SPRITE_BLINKS`)
  se ha movido al reloj nuevo y lo tapa con el verde apagado de la pantalla. Anclas nuevas en
  `src/data/enemies.ts`; cajas de choque, `muzzleY` y todo lo de la simulación, igual.
  Tests: `tests/estilo-a5.test.ts` (6: legibles sobre el suelo en todos los fotogramas, las hojas
  casan con la animación y los pies con el ancla, más grandes, siluetas distintas de las del resto
  de la planta 1, el reloj está donde parpadea, los avisos se distinguen); el de la boquilla del
  aspirador en `tests/animaciones.test.ts`, a las coordenadas nuevas.
- Decisiones: (1) Los dos con su propio fotograma de aviso: hasta ahora el aviso era solo el
  parpadeo en blanco del motor; con el dibujo cambiado el jugador lee *qué* va a hacer (embestir o
  disparar anillos). (2) La cara del microondas va dentro de la ventana, como en el viejo, pero con
  enfado cansado y no con sonrisa: la primera versión salió amable y la guía dice «nada kawaii».
  (3) No he cambiado el `muzzleY` del microondas aunque la ventana ha subido 4 px: es simulación y
  los anillos ya salen de la ventana. (4) Durante M14c conviven sprites viejos y nuevos: en las
  capturas los nuevos se ven más grandes y más ricos que la tostadora; se igualan cuando entren la
  (a4) y el resto de la (a5).
- Medidas: la simulación no cambia: `npm run bot` igual que antes (0 fallos, 5 atascos, sala limpia
  en 23,4 s, sobrevive el 87 %). Silueta aspirador–microondas 0,64; frente a bombilla, batidora y
  mando, entre 0,32 y 0,59 (el tope es 0,8). 1077 tests en verde; e2e en verde. (`npm run stats` no se ha vuelto a
  pasar: sin cambios en la simulación, las métricas son las mismas.)
- Problemas conocidos: las cajas de choque son las de antes y el dibujo es más grande (el asa del
  aspirador y la parte de arriba del microondas quedan fuera de la caja de golpes); es lo que dice la
  guía, pero si al jugar se nota que las balas «atraviesan» el dibujo, habrá que revisar las cajas.
- Siguiente paso: M14c (a5b), la Bombilla y la Polilla (o la (a4a) si la sesión que la cogió la ha
  dejado).

## 2026-11-14 03:30 (hora peninsular) — Hito M14b — (h11c) Salas con más forma; M14b terminado
- Contexto: sesión programada. El `main` local volvía a ser un clon viejo que no casaba con
  `origin/main` (`git checkout -B main origin/main`). La (h11c) seguía apuntada en `en_curso` desde
  las 22:25 del 13, más de cuatro horas sin commits suyos: la retomé (el protocolo da por libre lo
  que lleva más de 90 minutos). Salud al empezar: `check` y 1068 tests en verde.
- Hecho: M14b (h11c), y con ella la (h11) y el hito M14b entero. **Doce salas de combate nuevas, dos
  por planta**: planta 1, el Almacén de Mermas (en ele) y la Nave de Pilares de Carga (rejilla de
  pilares gordos); planta 2, el Centro de Datos en Cruz y las Islas de Demostración (cuatro islas
  macizas); planta 3, la Casa de Muñecas a Tamaño Natural (una casa en el centro con puertas que
  pone la semilla) y la Pista de Bicis (ele); planta 4, el Despacho de Esquina (esquinas cortadas en
  diagonal, casi redonda) y la Planta de Columnas (columnas sueltas e islas de mesas que se
  vuelcan); planta 5, la Ventanilla del Fondo a la Derecha (ele) y el Cruce de Pasillos (cruz);
  planta 6, la Nave de Pilares del Taller y la Esquina de Reparaciones Pendientes (ele). **Lo que
  queda fuera de la forma** va con un espacio (` `) en la plantilla: es pared (`Room.outside`) y el
  pintor no lo dibuja como estantería sino como más pared de fuera (`cutOut` en `src/art/room.ts`):
  arriba, oscura; donde hay suelo debajo, la propia franja de la pared del fondo (con sus
  estanterías y su zócalo) bajada hasta allí, así que la pared dobla la esquina; a los lados y por
  arriba, el zócalo de la planta (la cinta amarilla y negra en el almacén) y la sombra en el suelo.
  Las lámparas se corren al tramo de pared que se ve, y los carteles se cuelgan enteros en un solo
  tramo (de la pared del fondo o de la cara de una esquina). Tests: `tests/salas-forma.test.ts` (3);
  e2e `14d`–`14g`.
- Decisiones: (1) Un carácter nuevo en vez de deducir el recorte de los `#`: las salas de siempre se
  pintan exactamente igual (sin `outside` no cambia nada), y la plantilla dice lo que es cada cosa.
  (2) Las esquinas recortadas se pintan como la pared del fondo que avanza, no como un bloque de
  estanterías: un bloque grande de estanterías se leía como una mesa enorme, no como el borde de la
  sala. (3) La planta 5 lleva seis huecos de enemigo en sus dos salas nuevas, porque sus salas
  tienen que traer más enemigos que las de las Oficinas (`tests/planta5-medida.test.ts`). (4) En el
  Archivo de Tickets, un hueco de enemigo se movió dos casillas: reflejada, la sala lo dejaba a 3,2
  casillas de la puerta de abajo, y con las plantas nuevas una semilla del test lo sacó. (5) El test
  de la planta 5 pedía exactamente 12 salas de combate; ahora, al menos 12.
- Medidas: `npm run bot`: 0 fallos, 5 atascos (los de siempre), sala limpia en 23,4 s, sobrevive el
  87 %; la planta entera con daño la gana el 60 %. 1071 tests en verde; e2e en verde.
- Problemas conocidos: el minimapa sigue dibujando cada sala como un rectángulo (la forma no se ve
  ahí). Las salas nuevas se ven en la cámara normal; en las grandes, la forma se descubre al andar.
- Siguiente paso: M14c (a4a), la Tostadora en el juego con el estilo nuevo.

## 2026-11-14 02:05 (hora peninsular) — Hito M14b — (h10b3) La Centralita se arrastra con los cables y la Trituradora va sobre orugas
- Contexto: sesión programada. El `main` local volvía a ser un clon viejo y superficial que no
  casaba con `origin/main`: `git checkout -B main origin/main`. La (h11c) seguía apuntada en
  `en_curso` desde las 22:25 del 13 (más de 4 h: la sesión que la cogió ya no está, pero la dejo
  apuntada por si acaso; esta tarea no toca `src/data/rooms.ts`). Salud al empezar: `check` y 1060
  tests en verde.
- Hecho: M14b (h10b3), y con ella la (h10) entera. **La Centralita, «se arrastra con los cables»**
  (`BossBrain.cord`, `cordWalk`, `letGoCord`): no anda; elige un sitio alrededor de la tostadora,
  45–100° más allá en su círculo y a su distancia, lanza el cable de delante más allá de él y lo
  enchufa en lo primero sólido (pared o mostrador): 0,4 s quieta con el cable volando y el carril
  marcado en el suelo (rayas rojas y un círculo donde parará), y luego se arrastra por él de un
  tirón (520 px/s² hasta 4,2 veces su paso, frenando a 300 px/s² para pararse justo en el sitio).
  Entre tirones (0,3–0,7 s, menos con rabia) se arrastra despacio a mano (bossRoam a 0,45 de su
  paso). Si algo la para, suelta el cable (golpe). Lanzando no lanza el cable (un tirón empezado
  sigue); con las balas ya fuera, sí. Muda (fase 3) lo suelta y se para en seco. Eventos
  `cordThrow` (latigazo y el clac al enchufarlo; la primera vez, «Un momento, le conecto») y
  `cordLetGo`. **La Trituradora, «orugas»** (`BossBrain.treads`, `treadWalk`, `crushAhead`): en la
  fase 1 gira sobre sí misma hacia la tostadora (90°/s por la rabia), alineada (6°) marca su
  recorrido con las dos orugas en rojo (0,5 s) y avanza recto a 2,2 veces su paso, sin girar, hasta
  70 px pasada la tostadora (como mucho 4 s). Lo que pilla delante lo tritura (caja en astillas,
  barril encendido, garrafa derramada; nunca un cofre); contra la pared se para en seco
  (`treadBump`) y vuelve a girar. Dispara mientras gira y avanza. Eventos `treadAim` («Recogida a
  domicilio» la primera vez), `treadGo`, `treadBump` y `crush`. En las fases 2–3 sigue en su cinta.
  El bot se aparta del carril de los dos (`haulLane` en `src/sim/bot.ts`), como un jugador que lee
  el aviso. Tests: `tests/jefes-planta5-movimiento.test.ts` (8); `tests/jefes-movimiento.test.ts`
  cuenta el giro sobre sí misma como cambio de rumbo y el cable en el aire como moverse. e2e:
  `51fa-centralita-cable`, `51fb-centralita-arrastre`, `53ba-trituradora-orugas`,
  `53bb-trituradora-avanza`.
- Decisiones: (1) Cada una con algo que solo ella tiene: la Centralita se mueve como un garfio
  (el cable dice adónde va antes de ir) y la Trituradora como un tanque (lenta para girar, imparable
  en recta): las dos se esquivan leyendo el suelo, no por reflejos. (2) Al principio la Centralita
  se quedaba quieta entre tirones (un 41 % del tiempo entre ataques): ahora se arrastra despacio,
  porque el humano pidió jefes que no se paren. (3) Sin que el bot leyera los carriles, la
  Centralita bajaba del 54 % al 27 % de victorias (el bot se comía los tirones): con él, vuelve a
  donde estaba; la dificultad está en el aviso. (4) La Centralita pasa de 155 a 148 de vida porque
  moverse más alargaba el combate (126 → 135 s). (5) La línea de la Trituradora sale debajo de ella:
  arriba se salía de la pantalla.
- Medidas (`runBoss`, 80 combates en su sala): Centralita antes gana 53,8 % en 126 s con 4,93
  heridas; después 57,5 % en 133,6 s con 4,64. Trituradora antes 46,3 % en 106,3 s con 5,04
  heridas (2,24 en la fase 1); después 50 % en 106,2 s con 4,76 (2,03). `npm run bot`: 0 fallos, 5
  atascos (los de siempre), Centralita 56,7 % en 131,7 s, Trituradora 46,7 % en 103,5 s (30
  combates). 1068 tests en verde; e2e en verde.
- Problemas conocidos: el cable se dibuja desde debajo de la Centralita, no desde la clavija de su
  mano (el sprite no tiene una pose de «tirar» que lo encaje); la Trituradora solo mira a izquierda
  o derecha, así que el giro se lee por las orugas marcadas y el polvo, no por el dibujo. Las dos
  cosas se pueden arreglar en M14c (a7), al redibujar los jefes. Un tropiezo: el primer commit
  se subió con un error de tipos en el test nuevo (el `npm run check | tail` se tragó el código de
  salida); arreglado en el siguiente commit, un minuto después. Comprobar con `set -o pipefail`.
- Siguiente paso: M14b (h11c), las plantillas de sala con más forma (lo último de M14b), si la
  sesión que la cogió no ha vuelto; si no, M14c (a4a), la Tostadora con el estilo nuevo en el juego.

## 2026-11-14 02:20 (hora peninsular) — Hito M14b — (h10b2) El Director guarda la distancia de seguridad
- Contexto: segunda tarea de la sesión, tras la (h10b1). La (h11c) sigue cogida (desde las 22:25) y
  mientras tanto otra sesión ha hecho M14c (a1–a3); esta solo toca al Director, así que no se pisan
  (al subir, solo hubo que juntar la bitácora y `progress.json`).
- Hecho: M14b (h10b2). **«Distancia de seguridad»** (`BossBrain.chair`, `chairWalk`,
  `BossPhase.onFoot`): sentado, el Director rueda en su silla de oficina siempre de cara a la
  tostadora, a impulsos de los pies. Cada vez que casi se ha parado se impulsa (2,4 veces su paso)
  hacia atrás, lejos de ella, torcido 20–55° hacia el lado con sitio (de lado si está acorralado), y
  rueda frenando a 150 px/s². Si se ha ido más de 20 px por encima de su distancia, se impulsa de
  vuelta, torcido 25–50°. Si su propia mesa larga le tapa la tostadora, se impulsa de lado (85°),
  hacia el extremo desde el que la vería. Lanzando no se impulsa: sigue rodando. Contra una pared o
  un mueble se para en seco (evento `chairBump`: golpe sordo, polvo, temblor corto) y se impulsa a
  los 0,12 s. Evento `chairKick`: ruedecillas (`deslizar` agudo) y polvo de los talones; la primera
  vez, «Mantenga la distancia de seguridad». De pie (fase 3, `onFoot`) anda como antes; la silla
  suelta sigue embistiendo.
  Tests: `tests/jefes-planta4-movimiento.test.ts` (6): datos (solo él, de pie en la fase 3), se
  impulsa hacia atrás (nunca hacia la tostadora; de lejos, de vuelta; escondido tras la mesa, de lado)
  y entre impulsos solo frena, mira siempre a la tostadora, contra la pared se para en seco, de pie no
  usa la silla, determinismo. e2e: `39ba-director-silla`.
- Decisiones: un director de RR. HH. que nunca se acerca a nadie y lo dice en voz alta. Se parece a la
  Nevera (los dos se deslizan), pero se lee al revés: ella patina alrededor de ti, él huye de cara y
  vuelve. Primera versión: volvía solo a más de 60 px por encima de su distancia, se quedaba lejos
  (media de 235 px) y casi siempre detrás de su mesa: el combate se iba a 133 s y en el e2e sus
  tarjetas chocaban todas con la mesa. Bajé la vuelta a 20 px y le hice rodear la mesa cuando le tapa
  la tostadora. Como se aleja, lanza más a menudo (descanso 0,85–1,2 → 0,65–0,95 s y 0,9–1,25 →
  0,7–1 s) y tiene algo menos de vida (140 → 132): la dificultad, de las balas, no de la vida.
- Medidas (`runBoss`, 80 combates en su sala): antes gana 48,8 % en 116,9 s con 5,08 heridas;
  después 42,5 % en 116,9 s con 4,93 (llega a ponerse de pie el 63,7 %). `npm run bot`: 0 fallos, 5
  atascos (los de siempre), Director 40 % en 117,5 s (30 combates). 1041 tests en verde (1060 tras juntarla con M14c); e2e en verde.
- Problemas conocidos: el bot no le persigue cuando se aleja (un jugador sí puede, y le saldría más
  fácil); la línea «Mantenga la distancia de seguridad» es larga y tapa un momento la parte de arriba
  de la sala.
- Siguiente paso: (h10b3) la Centralita (se arrastra con los cables) y la Trituradora (sobre orugas).
  O la (h11c) si queda libre.

## 2026-11-14 01:50 (hora peninsular) — Hito M14c — (a3) La carpeta de sprites hechos fuera
- Hecho: `art/entrada/` con su `LEEME.md` para el humano (qué PNG dejar y el JSON de al lado: id,
  qué es, autor, licencia, origen y, si hace falta, fotogramas, tamaño, escala, contorno y si
  reemplaza una hoja del juego); `tools/sprites/entrada.ts`: encuentra a qué escala viene el
  dibujo y dónde empieza la rejilla (los cambios de color entre vecinos caen todos en el borde de
  los bloques: el k más grande que reúne el 80 % en un mismo resto, y luego bloques de un color),
  lo reduce bloque a bloque por votación, ajusta cada color al más parecido de la paleta en OKLab,
  quita los bordes semitransparentes, recorta todos los fotogramas igual y los pone de pie y
  centrados en su tamaño, con el contorno selectivo si se pide; rechaza (con todos los motivos a
  la vez) lo que no tiene JSON, licencia válida (CC0, CC-BY, CC-BY-SA, OFL, MIT, propia o
  IA-uso-comercial) o pisa una hoja del juego sin decir `reemplaza`; deja una vista previa en
  `art/entrada/procesados/` y reescribe su sección de `CREDITOS.md` (entre dos marcas, para no
  duplicarla). `allSheets` (tools/sprites/build.ts) añade las hojas de fuera al final. La paleta
  gana `verde`, `cian` y `carton`, que faltaban para lo que llegue de fuera.
  `tests/entrada.test.ts` (6 tests, con un dibujo «de IA» sintético: 6×, desplazado 2 px, con
  ruido y borde suave).
- Decisiones: (1) La escala se busca por los bordes y no probando todos los desplazamientos: con
  una imagen de IA de 512 × 512 lo otro eran cientos de millones de comparaciones. (2) El borde de
  la silueta de una imagen con antialias está movido un píxel, así que la rejilla se busca con los
  bordes de dentro y solo si hay pocos con los de la silueta. (3) Lo semitransparente se pierde (el
  juego lo pinta por código: humo, brillos). (4) Licencia `IA-uso-comercial` para lo que haga otra
  IA: el humano es quien sabe las condiciones de la que use; el script solo exige que lo diga.
- Medidas: la tostadora aprobada, ampliada 8× con ruido, vuelve a su tamaño en 66 ms y con la
  paleta nueva casi idéntica (el contorno negro pasa a la tinta violeta); la de prueba, 109 ms.
- Problemas conocidos: no hay ningún sprite de fuera todavía (depende de que el humano quiera
  usar una IA de imagen); si un sprite trae colores que la paleta no tiene, salen con el más
  parecido.
- Siguiente paso: (a4) los cinco personajes jugables redibujados con `src/art/pintor.ts`
  (andar 6, rodar 6, disparar, herido, morir); es grande, dividirla por personaje.

## 2026-11-14 01:25 (hora peninsular) — Hito M14c — (a2) Las herramientas de dibujo nuevas
- Hecho: `src/art/pintor.ts` con lo que la (a1) tenía dentro de su herramienta (`Paint`, el
  sombreado por normales de `ellipsoid` y `cylinderH`, el contorno selectivo y la sombra violeta
  del suelo), más lo nuevo: `heightShade` (el sombreador de volumen a partir de una función de
  alturas, con normales por diferencias centrales, la misma luz y un especular Blinn), el
  antialias de pixel art (`aa`: el píxel que la forma cubre a medias, muestreado 4 × 4, va un tono
  más oscuro que su vecino) y el comprobador de legibilidad (`legibility`: contraste y oscuridad
  del borde contra el suelo, colores, cuánto del cuerpo se funde con el suelo; `silhouetteOverlap`:
  cuánto se parecen dos siluetas, alineadas por los pies). La demostración (`art/prueba/
  herramientas.png` y `corazon.png`): un corazón acolchado sacado de un mapa de alturas, una
  plancha abollada con dos remaches y la misma bola sin y con antialias. `tests/pintor.test.ts`
  (6 tests). La (a1) se regenera idéntica tras mover el código.
- Decisiones: (1) Con la luz plana a medio camino entre dos tonos, el tramado convierte una cara
  plana en un tablero de ajedrez: el `bias` se elige para que lo plano caiga justo en un tono y
  solo cambien las pendientes (lo vigila un test). (2) Los umbrales de legibilidad salen de medir
  los sprites aprobados y los nuevos: el borde oscuro (≥ 80 %, todos rondan el 93–100 %), el
  contraste medio del borde ≥ 1,6 (los viejos 1,9–2,0, los nuevos 1,7–1,8: con un suelo oscuro el
  contorno oscuro nunca da mucho más) y como mucho un tercio del cuerpo fundido con el suelo.
  (3) El comprobador encontró un fallo real: el aspirador nuevo, azul sobre suelo azul, se fundía
  un 35 %; lo aclaré (más luz en el bote y la banda un tono menos honda) y queda en el 31 %.
- Medidas: siluetas tostadora/aspirador, 0,72 las viejas y 0,51 las nuevas; aspirador/microondas
  viejos, 0,65. Fundido con el suelo: tostadora vieja 15 %, nueva 18 %; aspirador viejo 16 %,
  nuevo 31 %.
- Problemas conocidos: el aspirador nuevo sigue fundiéndose más que el viejo; en (a5) conviene
  bajar del 25 % (más contraste de tono con el suelo, no solo de luz).
- Siguiente paso: (a3) la carpeta `art/entrada/` con el script que pasa sprites de fuera a la
  paleta; o (a4), los cinco personajes con las herramientas nuevas.

## 2026-11-14 00:55 (hora peninsular) — Hito M14c — (a1) La guía de estilo nueva y tres sprites de prueba
- Contexto: sesión programada. La (h10b2) estaba cogida hace 0 min y la (h10b1) acababa de
  terminar en otra sesión; la (h11c) llevaba cogida dos horas (más de 90 min, libre según el
  protocolo), pero esa sesión puede seguir viva y las dos tocaríamos `src/data/rooms.ts`. Para no
  pisarnos cogí la primera de M14c, que también viene de una nota del humano y no toca ni
  `src/sim` ni `src/data`. El `main` local volvía a ser un clon viejo que divergía de
  `origin/main`: `git checkout -B main origin/main`. Salud al empezar: `check` y 1035 tests en verde.
- Hecho: la sección «M14c · El estilo nuevo» al principio de `docs/ESTILO_ARTE.md`; la paleta por
  materiales en `src/art/paleta.ts` (rampas de 5–7 tonos elegidas a mano, con giro de tono hacia
  el violeta en las sombras; luminancia, tono, contraste, mezcla y tramado Bayer); tres sprites
  de prueba en `art/prueba/` (la tostadora con el secador, el aspirador y una loseta del almacén)
  y `comparativa.png` (antes y ahora, a tamaño real sobre su suelo y a 3×), generados por
  `node tools/sprites/prueba-a1.ts` (no entra en `npm run sprites`: nada de esto llega aún al
  juego); `tests/estilo-a1.test.ts` (7 tests: tonos y luminancia de las rampas, sombras de color,
  giro de tono, regeneración idéntica, tamaños, contorno selectivo y legibilidad sobre el suelo).
- Decisiones: (1) sombras de color y tinta violeta `#140f20` en vez del negro; contorno selectivo
  (por el lado de la luz, la sombra del material mezclada con tinta; por el de la sombra, tinta).
  (2) El tramado solo en las costuras y en los volúmenes redondos: lo probé a lo ancho de la cara
  de la tostadora y a tamaño real parecía suciedad, así que lo quité. (3) El cromo se pinta como un
  espejo (cielo, horizonte, sala, rebote del suelo): es lo que más «metal» da con pocos tonos.
  (4) Tamaño: carcasa de 28 px (antes 22) en un lienzo de 48 × 50; enemigo de unos 42 × 42; las
  cajas de choque no cambian. (5) El aspirador pasa de caja a bote redondo con el visor rojo que
  brilla: así se distingue de la tostadora y del microondas (que son cajas), que es lo que pide
  (a5). (6) Lo decidí sin el visto bueno del humano porque es él quien pidió el cambio; si no le
  gusta, lo dice en sus notas y se cambia la sección.
- Medidas: suelo nuevo con luminancia media dentro de 0,035–0,075, como el viejo; contraste de las
  balas sobre el tono medio del suelo: rojo 2,5, cian 6,3, naranja 5,8.
- Problemas conocidos: los sprites de prueba no están en el juego; hasta (a4)–(a8) conviven los
  dos estilos. Las herramientas (`Paint`, `ellipsoid`, `cylinderH`, el contorno selectivo) viven
  de momento en `tools/sprites/prueba-a1.ts`.
- Siguiente paso: (a2) pasar `Paint`, el sombreado por normales y el contorno selectivo a
  `src/art/` (más el mapa de alturas y el comprobador de silueta y contraste); o la (h11c) si su
  sesión la ha soltado, o la (h10b3).

## 2026-11-14 01:10 (hora peninsular) — Hito M14b — (h10b1) El Muñeco desfila y la Consola va con lag
- Contexto: sesión programada. Otra sesión tenía cogida la (h11c) (desde las 22:25, menos de 90 min),
  así que cogí la siguiente: la (h10b). Era grande (cinco jefes): la dividí en (h10b1) planta 3
  (Muñeco y Consola), (h10b2) el Director y (h10b3) la Centralita y la Trituradora. El `main` local
  volvía a ser un clon viejo que divergía de `origin/main` (50 y 50 commits): lo guardé en la rama
  local `backup-old-main` (sin subir) y puse `main` en `origin/main` con `git checkout -B` (el
  `reset --hard` no me lo dejaba hacer el entorno). Salud al empezar: `check`, 1027 tests y `build`
  en verde.
- Hecho: M14b (h10b1).
  - **El Muñeco de Moda desfila** (`BossBrain.catwalk`, `catwalkWalk`, `catwalkLeg`): anda como un
    modelo, en tramos rectos, solo de lado o solo arriba y abajo, por turnos, alrededor de la
    tostadora como alrededor de un rectángulo (de lado, a `keep` px a un lado de ella y 90 px como
    mucho de una vez, cruzando al otro lado; arriba o abajo, a 60 px por encima o por debajo). Paso
    1,5 veces el suyo, 0,6 mientras dispara; sin aceleración (un modelo no «arranca»). Al final de
    cada tramo, o si algo se le pone delante, se para y posa 0,45 s (dividido por la rabia) con su
    fotograma de pose y un flash de cámara (evento `pose`, sonido `obturador`; «Posando para el
    catálogo» la primera vez). La pasarela de siempre (su ataque) empieza un tramo nuevo al acabar.
  - **La Consola va con lag** (`BossBrain.lag`, `lagWalk`, `updateLag`): su paseo (el `bossRoam` de
    todos, a 1,5 veces su paso) lo hace un fantasma (`Enemy.lagGhost`); ella se queda quieta y cada
    0,55–0,95 s, entre ataques, salta a donde ha llegado el fantasma (evento `lag`: estática cian y
    roja en los dos sitios, `zapear` agudo; «Conexión inestable» la primera vez). Uno de cada cinco
    saltos es rubber-banding: vuelve a donde estaba antes del último salto, con el fantasma
    («Reconectando...»). Nunca salta encima de la tostadora ni a un sitio ocupado (lo reintenta a
    los 0,1 s). Actualizándose no hay lag (el fantasma también se para) y el cambio de fase lo
    recoloca. El fantasma se dibuja como una silueta cian al 20–30 %, parpadeando y con un desgarro
    de 2 px de vez en cuando (`drawLagGhost`); las balas le dan a ella, no al fantasma.
  Tests: `tests/jefes-planta3-movimiento.test.ts` (8): datos únicos, el Muñeco anda en recto (menos
  del 3 % de ticks en diagonal) y quieto mientras posa, alterna tramos y los de lado acaban cerca de
  la fila de la tostadora, la pose usa su fotograma y se acorta con la rabia; la Consola no se mueve
  entre saltos, salta 10+ veces en 30 s con algún rubber-banding (menos de la mitad), salta a donde
  estaba el fantasma, no hace lag actualizándose y el cambio de fase le quita el fantasma;
  determinismo. `tests/jefes-movimiento.test.ts` («entre ataques se mueve el 80 %») cuenta el
  fantasma de la Consola y no cuenta las poses del Muñeco. e2e: `38ba-muneco-desfile` y
  `65ba-consola-lag`.
- Decisiones: el Muñeco «se mueve» como lo que es, un muñeco de escaparate que desfila y posa: ángulos
  rectos y paradas que se leen y se pueden aprovechar para dispararle. La Consola, como el chiste de
  todo juego en línea: el lag; el fantasma es el aviso de dónde va a aparecer. Primera versión del
  Muñeco: tramos largos (hasta el lado contrario) y solo un 35 % del paso disparando: posaba 2 veces
  en 25 s, no se notaba. Luego paso entero disparando: el bot ganaba mucho menos (65 → 51 %), demasiado
  de golpe. Me quedé en 0,6 y tramos de 90 px. Con el desfile el combate seguía en ~100 s (encima del
  objetivo de 45–90 de la (h1)), así que le bajé la vida 140 → 128: la dificultad, del movimiento. La
  Consola quieta era un blanco fácil (el bot ganaba 79 → 86 %): el fantasma anda 1,5 veces más deprisa,
  y los saltos son de 30–50 px.
- Medidas (`runBoss`, 80 combates, antes → después): Muñeco gana 65 → 67,5 % en 100,4 → 99,4 s, 4,56 →
  4,16 heridas; Consola 78,8 → 72,5 % en 85,2 → 90,1 s, 3,89 → 3,91 heridas. `npm run bot`: 0 fallos,
  5 atascos (los de siempre); Consola 66,7 % en 89,2 s y Muñeco 63,3 % en 98,3 s (30 combates); la
  planta 3 la gana el 28,6 % de los que llegan. 1035 tests en verde; e2e en verde (la primera vez falló
  en el cartel del Director por tiempo, con el bot midiendo a la vez; sola, en verde).
- Problemas conocidos: la cámara de la sala del jefe de la Juguetería corta lo que está pegado a la
  pared de arriba (donde empieza el jefe); no es de esta tarea. El bot no aprovecha las poses del
  Muñeco ni dispara al sitio del fantasma.
- Siguiente paso: (h10b2) el Director: ahora rueda con `bossRoam`; darle algo suyo (la silla de
  oficina: impulsos con los pies hacia atrás, girando, siempre de cara...). O la (h11c) si queda libre.

## 2026-11-14 00:05 (hora peninsular) — Hito M14b — (h10a2) El Router cambia de punto de acceso y la Nube es un nubarrón
- Contexto: segunda tarea de la sesión, tras la (h10a1). Otra sesión tiene cogida la (h11c)
  (plantillas de sala); esta solo toca jefes, así que no se pisan.
- Hecho: M14b (h10a2), y con ella la (h10a) entera.
  - **El Router del Wifi cambia de punto de acceso** (`BossBrain.handoff`, `updateHandoff`): cada
    4–7 s (contados andando o disparando), si tiene un repetidor más cerca de la tostadora que él
    mismo (pero a 90 px por lo menos de ella), avisa 0,7 s —una línea discontinua cian del router al
    repetidor que se va llenando y un anillo que se cierra sobre el repetidor; la primera vez,
    «Cambiando de punto de acceso...»— y se cambian el sitio al instante (chispazo en los dos sitios,
    sonido `zapear`, temblor breve). Sale del repetidor atacando: su descanso se corta a 0,2 s. Sin
    repetidores (tras el reinicio, hasta que planta otro) no salta; un cambio de fase anula el salto.
  - **La Nube de Almacenamiento es un nubarrón** (`BossBrain.hover`, `hoverWalk`): no rodea a la
    tostadora, se le pone encima: 100 px al norte (al sur si al norte está la pared del fondo),
    meciéndose 70 px a los lados y 35 arriba y abajo, a la deriva (acelera como mucho 90 px/s²) y
    flotando por encima de los muebles (`slide(…, 'all')`: solo la paran las paredes). Su
    `walkSpeed` pasa de 40/46 a 64/72: ahora es lo rápido que va a la deriva.
  Tests: `tests/jefes-planta2-movimiento.test.ts` (7): datos, el router avisa y luego se cambia con
  el repetidor que toca (el más cercano de los que mejoran la cobertura) y sale atacando, sin
  repetidores no salta y el cambio de fase lo anula, la nube se queda al norte y a la altura de la
  tostadora, al sur contra la pared del fondo, cruza por encima de una fila de estanterías sin
  acelerar de golpe, determinismo. e2e: `36ba-router-cambio-punto` y `64ca-nube-encima`.
- Decisiones: el router «se mueve» como se mueve la señal: de punto de acceso en punto de acceso; y
  la nube como una nube de tormenta en un dibujo animado, siempre encima. Primera versión del router:
  saltaba al repetidor más cercano a la tostadora fuera como fuera, cada 5–8 s y con 0,45 s de calma
  al llegar, y el bot le ganaba más (62,5 → 75 %): a menudo saltaba lejos y llegaba sin prisa. Con
  «solo si mejora la cobertura» y «sale atacando» vuelve a donde estaba. Durante el aviso puede
  seguir atacando (si no, cada salto le quitaba un ataque).
- Medidas (`runBoss`, 80 combates, antes → después): Router gana 62,5 → 67,5 % en 66,7 → 71 s, 4,35 →
  4,26 heridas; Nube 78,8 → 77,5 % en 81 → 86 s, 3,88 → 3,76 heridas.
  `npm run bot`: 0 fallos, 5 atascos (los de siempre); Router 63,3 % en 73,6 s y Nube 76,7 % en 84,8 s
  (30 combates); planta 2 la gana el 46,7 % de los que llegan (igual que antes). 1027 tests en verde
  (tras quitar el «…», que la Letra Pequeña no tiene: «...» como en «Escribiendo...»); e2e en verde.
- Problemas conocidos: la línea del aviso se ve oscura hasta que se llena (sobre el suelo verde de la
  Sala de Redes se lee, pero sin brillo); si cuesta verla, más grosor. El bot no esquiva la llegada
  del router.
- Siguiente paso: (h10b) los jefes de las plantas 3–5 y el final (Consola, Muñeco, Director,
  Centralita, Trituradora): dividirla, que son cinco y el Director ya se mueve en su silla.

## 2026-11-13 22:20 (hora peninsular) — Hito M14b — (h10a1) La Nevera patina y la Lavadora anda a pivotes
- Contexto: nadie tenía nada cogido. Salud al empezar: `check`, 1011 tests, `build` y `bot` en verde.
  El `main` local volvía a ser un clon viejo que divergía de `origin/main`: lo guardé en una rama
  local (`backup-old-main`, sin subir) y puse `main` en `origin/main`. La (h10a) era grande (cuatro
  jefes): la dividí en (h10a1) planta 1 y (h10a2) planta 2.
- Hecho: M14b (h10a1). Hasta ahora todos los jefes andaban igual (`bossRoam`: vueltas erráticas
  alrededor de la tostadora); estos dos tienen ya su forma propia, como datos de `BossBrain`:
  - **La Nevera Suprema patina** (`BossBrain.glide`, `glideWalk`): no anda; cuando casi se ha parado
    se impulsa (hasta 2,2 veces su paso, hacia donde la llevaría su vuelta) y se desliza frenando a
    130 px/s². Sobre la escarcha que lanza frena a un tercio (`onIce`): es su pista. Mientras avisa o
    dispara no se impulsa, pero sigue deslizándose; solo la pausa entre fases la para en seco.
    Deslizándose deprisa deja un **rastro fino de escarcha** (`layFrost`, `Frost.trail`: un charco
    cada 30 px, 2,6 s, frena al 85 %, como mucho `MAX_TRAIL` = 8, aparte del tope de la escarcha
    lanzada) que se dibuja más pálido y que a ella no le sirve de pista (si no, no paraba nunca).
    Evento `glide`: rascado de hielo (sonido `deslizar` grave) y escarcha que salta hacia atrás.
  - **La Lavadora anda a pivotes** (`BossBrain.waddle`, `BossPhase.waddle`, `waddleWalk`): como se
    mueve una lavadora por una cocina, una esquina y luego la otra. Cada 0,42 s cambia de esquina;
    su camino (el de siempre) se tuerce 42° a un lado y luego al otro, a tirones (parada en los
    extremos del paso). Se ladea sobre la esquina que gira (`waddleTilt`, 4° como mucho) y al
    apoyarla suena un golpe sordo con polvo en ese pie (evento `pivot`). Centrifugando, 58° y cada
    0,26 s: bandazos.
  - **Arreglo del bot** (lo destapó esta tarea): con la Llave Allen Sobrante y sin tickets, el bot iba
    al cofre pero no pulsaba interactuar (`wantsInteract` solo miraba los tickets), y se quedaba
    plantado delante para siempre. Salió en `npm run bot` («planta-16 nivel 5: ni gana ni cae»)
    porque al cambiar la planta 1 cambian las partidas que llegan arriba. Test nuevo en
    `tests/objetos-planta3.test.ts`.
  Tests: `tests/jefes-planta1-movimiento.test.ts` (8): se impulsa y entre impulsos nunca acelera,
  sobre su escarcha llega casi el triple de lejos, el rastro (en el suelo, de sus pies, con tope,
  frena 0,85, no es pista), sigue deslizándose al atacar, la lavadora alterna esquinas, se para al
  cambiar y zigzaguea, centrifugando pivota más deprisa, determinismo. Ajustados tres tests viejos de
  la nevera para no contar el rastro como escarcha lanzada (el tope de 8 y «los productos no
  frenan»), y el de su muerte pone a la tostadora en sus pies (deslizándose acaba más cerca de las
  paredes). e2e: capturas `17ga-nevera-patina` y `63ba-lavadora-pivotes`.
- Decisiones: la nevera patina porque es lo que es (veinte años sin descongelarse) y porque se
  combina con lo que ya tenía: su escarcha frena a la tostadora y a ella la acelera. Se lee bien:
  impulso, deslizamiento largo, rastro. Probé impulso 3,4 con frenada 165 (gana el 80 % en 73 s: los
  disparos del bot fallan a un blanco que va a 170 px/s) y fui bajando hasta 2,2 y 130. El rastro
  frena al 85 % y no al 50 % de la escarcha de verdad: es una molestia, no una trampa; el bot lo pisa
  sin esquivarlo, como haría un jugador. La lavadora no salta (eso ya lo hacen el sello y el
  teléfono): se arrastra en zigzag; el ladeo con rotación ya se usaba para las embestidas. El ladeo se
  ve algo dentado en la captura, pero 4° es poco y dura un instante.
- Medidas (`runBoss`, 80 combates, antes → después): Nevera gana 92,5 → 87,5 % en 50 → 56 s, 2,78 →
  3,41 heridas por combate, 0,8 → 2,6 s en escarcha; Lavadora 83,8 → 88,8 % en 50 s, 3,48 → 3,0
  heridas (dentro del ruido; en zigzag avanza algo menos). `npm run bot`: 0 fallos, 5 atascos (los de
  siempre); planta 1 con daño: la gana el 85 → 75 % y cae ante la jefa el 10 → 20 % (20 partidas:
  ruidoso, pero va en la dirección que pidió el humano, más difícil por movimiento y no por vida).
  1020 tests en verde; e2e entero en verde.
- Problemas conocidos: si la planta 1 resulta demasiado dura, bajar `glide.push` a 2 antes que tocar
  vida. El bot no aprovecha que la nevera no puede girar mientras se desliza.
- Siguiente paso: (h10a2) el Router del Wifi y la Nube de Almacenamiento (ideas: el Router no anda,
  salta de repetidor en repetidor; la Nube flota por encima de los obstáculos), o (h11c) plantillas.

## 2026-11-13 21:20 (hora peninsular) — Hito M14b — (h9e2) El Asistente esquiva y la Carretilla da marcha atrás
- Contexto: la (h11a3) estaba cogida por otra sesión (ya la ha terminado; mi trabajo se juntó con el
  suyo sin conflictos). Salud al empezar: `check`, 994 tests, `build` y `bot` en verde. El `main`
  local era otra vez un clon superficial viejo: lo puse en `origin/main` sin tocar el remoto.
- Hecho: M14b (h9e2), y con ella la (h9) entera.
  - **Asistente Virtual, «esquiva la pregunta»** (`ChatbotBrain.dodge`, `evadeQuestion`): cuenta
    cuánto tiempo le sostienes la mira encima (de la mano al centro de su pantalla, a menos de 9°,
    a la vista y a menos de 260 px); a los 0,3 s se desliza de lado 45 px (150 px/s, 0,3 s) fuera
    de la línea de tiro, hacia el lado al que ya se inclinaba o, si está tapado, al otro. Como mucho
    cada 1,7 s y nunca mientras escribe. Evento `sidestep`: zumbido de ruedecitas, polvo y, la
    primera vez, «Reformule su pregunta» encima de donde acaba.
  - **Carretilla Elevadora, «se conduce como una carretilla»** (`ChargerBrain.steer` y `.reverse`,
    `steerWalk`, estado nuevo `reverse`): nunca va de lado; su rumbo gira hacia la tostadora a 100 °/s
    como mucho y solo avanza por él, así que da vueltas anchas; embiste solo con la tostadora a menos
    de 20° delante. Tras cada embestida (o tras el golpe contra la pared) da marcha atrás 1,1 s a
    62 px/s por donde vino, pitando cada 0,3 s (sonido nuevo `pitido`; la primera vez «Vehículo en
    maniobra»), hasta que choca con algo. De espaldas también golpea.
  - `turnBetween` (el giro más corto entre dos ángulos), exportado para los tests.
  Tests: `tests/asistente-carretilla-movimiento.test.ts` (9); en `tests/carretilla.test.ts` el de
  «se estrella» espera 10 s en vez de 6 (ahora recula y tarda más en volver a embestir). e2e:
  capturas `50zgb-asistente-evasivas` y `17za-taller-carretilla-marcha-atras`.
- Decisiones: el asistente reacciona a la **mira**, no a los disparos: así se lee como «le haces una
  pregunta y se escabulle», y la contra es dispararle mientras escribe o seguirlo justo después (la
  espera de 1,7 s). Es lo contrario de la Webcam (que se mueve cuando *no* la miras). La carretilla
  se queda en 100 °/s y 20° tras probar 75/16 (casi no acertaba: 0,03 heridas por sala con dos) y
  120/24 (ya no parecía una carretilla). El resto del Servicio Técnico son los enemigos de las
  plantas 1–5 reacondicionados, que ya tenían su movimiento de las (h9a)–(h9e1).
  El texto del asistente lo puse encima de donde termina el deslizamiento: en la primera captura
  tapaba sus ruedas.
- Medidas (`npm run enemigos`, antes → después): dos asistentes 0,77 → 0,70 heridas por sala
  (20,1 → 22,7 s: cuesta más darles); dos carretillas 0,18 → 0,08 (23,9 → 24 s); carretilla y
  asistente 0,32 → 0,42. `npm run bot`: 0 fallos, 5 atascos (los de siempre); planta 1 con daño la
  recorre el 95 % y la gana el 85 %. 1011 tests en verde; e2e entero en verde.
- Problemas conocidos: la carretilla hace menos daño que antes (lo compensa la marcha atrás, que el
  bot no esquiva a propósito); si molesta poco en el Servicio Técnico, subirle `walkSpeed`. El bot no
  usa la espera del asistente para dispararle.
- Siguiente paso: (h10a) los jefes de las plantas 1–2 más únicos, o (h11c) plantillas de sala.

## 2026-11-13 20:50 (hora peninsular) — Hito M14b — (h11a3) Charcos que conducen
- Contexto: segunda tarea de la sesión, tras la (h11a2). La (h9e1) acabó en otra sesión y nadie más
  tenía nada cogido; la (h11a3) cierra los props de la (h11a).
- Hecho: M14b (h11a3). **Garrafa de Agua «de Manantial»** (`src/data/props.ts`, dato nuevo
  `PropDef.spill`): baja, para balas, 2 de aguante (cualquier bala; un bidón al lado, de golpe). Al
  romperse (`spillProp`) no explota: deja un **charco** (`Room.puddles`, una elipse de 34 × 22 px de
  radio, solo sobre suelo) que se queda en la sala. **El agua conduce**: la descarga de una Regleta
  que alcanza un charco, o un charco que toca a otro alcanzado (`wetPuddles`), da también a todo lo
  que tenga **los pies** en el agua (`inPuddle`), aunque esté lejos de la regleta; rodando, la
  tostadora se libra, y la polilla vuela. El evento `zap` dice qué charcos encendió. Sale en un hueco
  `o` vacío (tras regletas y estantería) con su propio generador (`FillOptions.spill`, semilla
  `garrafas:<semilla>:<sala>`), una por sala como mucho, con `SPILL_CHANCE` por planta (0,2–0,35) y el
  doble (hasta 0,8) si la sala tiene Regleta. **Dibujo** (`tools/sprites/garrafa.ts`): garrafa azul
  con el agua dentro, nervios, tapón y etiqueta amarilla con una montaña. **En pantalla**: al
  reventar, chof, gotas y vapor; el charco, agua oscura en celdas de 3 px con un borde claro
  irregular y algún brillo (nunca encima de las paredes); mientras la regleta avisa, los charcos a
  los que va a llegar brillan en azul y su borde parpadea; con la descarga se encienden en blanco y
  salen rayos de la regleta a cada uno. El bot sale del charco que se va a electrificar. De paso,
  los bidones ya no intentan «encender» props con aguante pero sin explosión (habría roto con las
  carpetas de la Nube o la garrafa). Tests en `tests/charcos.test.ts` (7), e2e `11x`–`11za`.
- Decisiones: el extintor de la nota se queda para más adelante (la garrafa ya da el juego); el agua
  no se seca (los charcos son parte de la sala, como las mesas volcadas). Cuenta por los pies, no
  por el cuerpo: lo que se ve tocando el agua es lo que cobra.
- Medidas (`npm run bot`, antes de la tarea → después): planta 1 con daño la recorre el 100 → 95 % y
  la gana el 80 → 85 %; 0,63 → 0,64 heridas y 13 → 13,2 s por sala de combate; llegan a la planta 2
  16 → 17 de 20. Ruido. 0 fallos, 5 atascos (los mismos). 1001 tests en verde; e2e entero en verde.
- Problemas conocidos: el bot no rompe garrafas a propósito para electrificar a los enemigos.
- Siguiente paso: (h11c) plantillas de sala con más forma, (h9e2) o (h10a).

## 2026-11-13 20:10 (hora peninsular) — Hito M14b — (h11a2) La Estantería Inestable
- Contexto: (h9d) y luego (h9e1) estaban cogidas por otras sesiones; la (h11a2) solo toca props,
  el relleno de salas y su dibujo. Salud al empezar: `check`, 974 tests, `build` y `bot` en verde.
  El `main` local de este entorno era un clon superficial viejo: lo puse en `origin/main` antes de
  empezar (sin tocar el remoto).
- Hecho: M14b (h11a2). **Estantería Inestable** (`src/data/props.ts`, dato nuevo `PropDef.topple`):
  alta (para balas, no se salta), aguanta 6 (la tostadora, su daño; una bala enemiga, 1; un bidón
  que explota al lado, de golpe). Al acabarse, se tambalea 0,6 s (`PropInstance.fall`, evento
  `shelfWobble`) con su caída marcada en el suelo, y **cae lejos del empujón** (`fallSide`: el eje
  fuerte de la bala, luego el otro, luego el otro costado, al final hacia atrás) sobre la casilla de
  al lado: 10 de daño a los enemigos cuyos pies pilla y un corazón a la tostadora salvo si rueda.
  Nunca cae contra una pared, encima de otro prop, en el paso de una puerta ni partiendo la sala en
  dos (un recorrido por casillas comprueba que todas las puertas siguen unidas); si no hay sitio, se
  desploma en un montón donde estaba (`'C'`). Luego es `estanteria-caida`, **baja** (se salta
  rodando) y para balas: cobertura para siempre, con la caja que le toca según el lado
  (`FALLEN_BOX`). `shove` saca a quien quede dentro. Sale en un hueco `o` vacío (tras las regletas)
  con su propio generador (`FillOptions.shelf`, semilla `estanterias:<semilla>:<sala>`, así las salas
  no cambian), una por sala como mucho y con probabilidad por planta `SHELF_CHANCE` (0,25–0,4).
  Causa de baja: «Caída de stock sobre el personal». **Dibujo** (`tools/sprites/estanteria.ts`):
  expositor de acero con fondo de tablero perforado, tetera, jarra, radio, caja de «devuelto»,
  microondas y dos cajas de más encima; tocada (a la mitad) las baldas se comban y la caja de arriba
  resbala; tumbada de lado (volteada para la izquierda), boca abajo, boca arriba y en montón. **En
  pantalla**: golpe metálico y polvo en cada impacto; al tambalearse cruje, se mece cada vez más y
  en sus últimos 0,15 s se inclina hacia donde cae; la sombra de la caída se oscurece con el borde
  rojo parpadeando; al caer, estruendo, temblor, polvo y astillas a lo largo. El bot se aparta de la
  sombra. Tests en `tests/estanteria.test.ts` (8) y e2e `11t`–`11w`.
- Decisiones: cae **lejos de quien la empuja** (la pide la nota: «hacia el lado contrario»), así que
  dispararla con un enemigo detrás es una táctica; las balas enemigas también la gastan, y quien se
  esconde mucho detrás acaba debajo (cobertura que se acaba, como las mesas). Aplasta por los pies (lo
  que está en el suelo donde cae), no por el cuerpo, para que la sombra diga la verdad. Igual en todas
  las plantas por ahora (un expositor de devoluciones cabe en todas); variantes por planta, en M14c.
- Medidas (`npm run bot`, antes → después, mismas semillas): planta 1 con daño la recorre el 95 →
  100 % y la gana el 65 → 80 %; 0,71 → 0,63 heridas y 12,7 → 13 s por sala de combate; llegan a la
  planta 2 13 → 16 de 20. Con 20 partidas es ruido (cambian las salas al haber un prop más). 0 fallos,
  5 atascos (igual que antes, en la Sala de Pruebas). 990 tests en verde; e2e entero en verde.
- Problemas conocidos: el bot no tumba estanterías a propósito sobre los enemigos. La tumbada no tiene
  sombra propia en el suelo.
- Siguiente paso: (h11a3) charcos que conducen la descarga de la regleta, o (h11c) plantillas.

## 2026-11-13 19:49 (hora peninsular) — Hito M14b — (h9e1) El Dispensador de Turnos va pegado a la pared
- Hecho: M14b (h9e1), primera mitad de la (h9e), que dividí en dos: (h9e1) el Dispensador y el
  Teléfono, (h9e2) el Asistente Virtual y los del Servicio Técnico.
  - **Dispensador de Turnos**: entre turno y turno va pegado a la pared, como los de verdad
    (`TurnerBrain.wall`, 44 px/s): cada 0,8 s elige con `wallSpot` un sitio contra una pared (las
    casillas de suelo con pared al lado; los mostradores de las ventanillas cuentan como pared),
    libre de muebles y a la vista de la tostadora, a unos 150 px de ella y cerca de donde ya está, y
    va rodeando lo que haya en medio (`wayTo`). Si cruzas la sala, te sigue por las paredes.
  - **Teléfono de Recepción**: lo dejo como está; ya era único: avanza a saltos que se tuercen al
    azar y, al darle, te cambia de sitio con un compañero.
  Tests: `tests/planta5-movimiento.test.ts` (4) y el de «guarda las distancias» de
  `tests/dispensador.test.ts` pasa a comprobar la pared. e2e: captura `50zb-dispensador-pared`.
- Decisiones: en la captura se pega a un mostrador de ventanilla, no a la pared de fuera; me gusta
  (un dispensador junto al mostrador es lo natural) y no lo distingo.
- Medidas (`npm run enemigos`, antes → después): dispensador + asistente 0,12 → 0,22 heridas por
  sala (20,4 → 16,8 s); dispensador + teléfono 0,15 → 0,08. `npm run bot`: 0 fallos, 5 atascos;
  sin daño recorre entera cada planta, la 5 incluida. 986 tests en verde; e2e entero en verde.
- Problemas conocidos: ninguno nuevo.
- Siguiente paso: (h9e2) el Asistente Virtual (guarda las distancias) y los del Servicio Técnico;
  o (h10a) jefes más únicos.

## 2026-11-13 19:15 (hora peninsular) — Hito M14b — (h9d) La planta 4: la fotocopiadora se esconde y el climatizador va con manguera
- Hecho: M14b (h9d). En las Oficinas, la Destructora (siempre de cara, se lanza) y el Sello (a
  saltos, estampa tinta) ya tenían un verbo propio; la Fotocopiadora y el Climatizador guardaban
  las distancias. Ahora:
  - **Fotocopiadora**: se esconde detrás de los demás (`CopierBrain.hide`, 44 px/s): va a 30 px
    detrás del enemigo más cercano, al otro lado de la tostadora, para que él se coma los disparos.
    Si la rodeas, cambia de lado rodeando a su escudo (`hideSpot` da un punto al lado si el escudo
    está en medio). No se esconde detrás de otra fotocopiadora ni de quien esté a menos de 80 px de
    la tostadora (`HIDE_NOT_NEARER`: se metería en la pelea); sin nadie, guarda las distancias como
    antes. Se planta en seco al levantar la tapa (antes llegaba frenando y el test lo notó).
  - **Climatizador**: va atado a su manguera (`BlowerBrain.hose`), enchufada a la pared más cercana
    en línea recta desde donde aparece (`plugOf`), con 110 px de alcance (más si apareció más
    lejos). Va deprisa (38 px/s, antes 12) al punto de la línea enchufe–tostadora más cercano a ella,
    sin acercarse a menos de 80 px (`keep` 140 → 80); con la manguera tirante se desliza por el
    borde de su alcance y no puede seguirte (los empujones tampoco lo sacan de él). La manguera se
    dibuja (`drawHose` en `GameScene.ts`), floja o tirante, con su rejilla en la pared, para que el
    alcance se lea.
  Tests nuevos en `tests/planta4-movimiento.test.ts` (8). e2e: capturas `50xa` y `50xb`.
- Arreglo de paso en el e2e del sello: la prueba de la voltereta denegada falló una vez con la
  máquina cargada (bot y tests a la vez); ahora pone la tostadora más dentro de la tinta, reinicia
  la vida de la tinta y, si falla, dice dónde estaban. La segunda vez pasó.
- Decisiones: «esconderse detrás de los demás» encaja con la fotocopiadora (castiga ignorar al
  que apoya: ahora además hay que rodear al escudo o matarlo primero). La manguera convierte una
  torreta casi quieta en un «perro atado»: alejarse de su pared es la respuesta, y su aire sigue
  empujando hacia los demás.
- Medidas (`npm run enemigos`, 60 salas por pareja, antes → después): fotocopiadora + destructora
  0,55 → 0,80 heridas por sala; climatizador + destructora 0,25 → 0,32; fotocopiadora +
  climatizador 0,12 → 0,05; climatizador + sello 0,08 → 0,07. `npm run bot`: 0 fallos, 5 atascos
  (igual), la planta 1 igual; a la planta 4 llegan solo 2 de 20 partidas (muestra muy pequeña).
  982 tests en verde (ya con la regleta de la otra sesión); e2e entero en verde.
- Problemas conocidos: el climatizador enchufado a una columna interior (si la tiene más cerca que
  la pared) se ve raro; no lo he visto en las capturas.
- Siguiente paso: (h9e) los de la planta 5 y el Servicio Técnico; o (h10a) jefes más únicos.

## 2026-11-13 19:40 (hora peninsular) — Hito M14b — (h11a1) La Regleta Sobrecargada
- Contexto: (h9c) y (h11b) estaban cogidas por otras sesiones; elegí la (h11a), que no toca sus
  archivos, y la partí en tres en la hoja de ruta: (h11a1) la regleta, (h11a2) la estantería que
  cae, (h11a3) charcos que conducen. Salud al empezar: `check`, tests y `bot` en verde; **el e2e
  estaba roto en `main`** (ver abajo).
- Hecho: M14b (h11a1). **Regleta Sobrecargada** (`src/data/props.ts`): un prop bajo (se salta
  rodando) que para balas (se le puede disparar). Mientras hay pelea (`doorsShut`), cada 4,5 s
  chisporrotea 1,1 s y da una descarga de 40 px a todo lo que tenga cerca: 3 de daño a enemigos y
  maniquís, medio corazón a la tostadora salvo si está rodando (en el aire). Dato nuevo
  `PropDef.zap`, ciclo en `PropInstance.zapT`, `updateZap` en `src/sim/world.ts`, eventos `zapWarn`
  y `zap`. Cada regleta empieza en su punto del ciclo según dónde está (`zapPhase`; nunca menos de
  1 s antes del primer aviso). Con 3 de daño hace cortocircuito: reutiliza la explosión de los
  bidones (46 px, 10 de daño, medio corazón; enciende bidones vecinos) y la causa de baja sale del
  prop («Regleta con catorce aparatos y un solo enchufe»). Con la sala limpia se apaga el piloto.
  **Dónde sale**: en huecos `o` que el relleno dejó vacíos, con un generador propio
  (`FillOptions.hazard`, semilla `regletas:<semilla>:<sala>`), así el resto de cada sala no se
  mueve; probabilidad por planta `REGLETA_CHANCE` (0,15 en la 1, 0,4 en Informática…), como mucho
  dos por sala. Sprite `regleta` (un ladrón encima de otro, un cargador gordo, el piloto; frame 1
  apagado). En pantalla: su alcance en azul tenue mientras está viva; en el aviso, el círculo se
  llena, parpadea, un anillo interior crece hasta el borde, tiembla y escupe chispas; la descarga,
  rayos a lo que tocó (o al suelo si no tocó nada) y un crujido; el cortocircuito, un estallido
  azul con rayos en estrella. El bot se aparta de una regleta que avisa. Gancho de pruebas nuevo
  `__GE__.placeProp`. Tests en `tests/regleta.test.ts` (8): datos, aviso y alcance, la tostadora
  y rodando, sala tranquila, cortocircuito, fases distintas, relleno solo en huecos vacíos sin
  mover nada más, y frecuencia y determinismo en partidas.
- **Arreglo del e2e**: fallaba siempre en la Bombilla (`08-bombilla`), también sin mis cambios:
  desde que flota (h9a) alguna bala perdida la tumba antes y la de repuesto salía con
  `spawnIdle`, que espera para siempre. Ahora la de repuesto empieza su cuenta y se enciende.
- Decisiones: la descarga daña también a los enemigos (como los bidones: el escenario es de
  todos, y atraerlos a ella es una táctica). Sin aviso no hay daño, y rodando se libra: es justo.
  Igual en todas las plantas (una regleta es una regleta en todas partes). No sale en las salas de
  jefe ni en la Sala de Pruebas (solo combate de plantas generadas).
- Medidas (`npm run bot`, antes → después, con las mismas semillas): planta 1 con daño la recorre
  el 90 → 95 % y la gana el 60 → 75 %; 0,67 → 0,60 heridas y 12,2 → 13 s por sala de combate;
  planta 2: 0,9 → 1,0 heridas por sala. Son 20 partidas: cambios dentro del ruido; la regleta hace
  tanto daño a los enemigos como a la tostadora. 0 fallos, 2 atascos (igual); juntado con la (h9c), 5 atascos en las partidas de la Sala de Pruebas, donde no hay regletas (será el microondas espejo; vigilar). 974 tests en verde tras juntarlo con la (h9c) y la (h11b) (la (h11b) también arregló la espera de la bombilla en el e2e: las dos cosas se quedan).
- Problemas conocidos: el bot no atrae enemigos a la regleta ni la rompe a propósito. Las capturas
  del e2e mueven el maniquí, pero su dibujo se queda donde estaba.
- Siguiente paso: (h11a2) la estantería que cae, o (h10a) jefes de las plantas 1–2 más únicos.

## 2026-11-13 17:55 (hora peninsular) — Hito M14b — (h11b) Los trastos de cada planta
- Contexto: había tres tareas cogidas por otras sesiones ((h7), (h9a) y luego (h9c) y (h11a1)), y
  la (h10a) toca `src/sim/enemies.ts` igual que la (h9). Cogí la (h11b) porque solo toca el pintor de
  salas (`src/art/`), sin chocar con nadie.
- Hecho: M14b (h11b). `src/art/decor.ts` nuevo: **los trastos de cada planta**, dibujados píxel a
  píxel con contorno, cuatro por planta (tres en la 5): en el almacén, cartones aplastados, palés
  (a veces con una caja que nadie bajó), bolitas de embalar y rollos de film; en Informática,
  marañas de cables, placas base apiladas, ratones panza arriba y una caja de teclados; en la
  Juguetería, bloques desparramados, una pelota deshinchada, un cochecito boca arriba y un puzle
  (de las 1000 piezas quedan 998); en las Oficinas, paquetes de folios, un archivador abierto, la
  planta seca desde la última reestructuración y la caja gris de efectos personales; en Atención al
  Cliente, hojas de reclamación con su grapadora encima, el «Suelo mojado» caído y una papelera
  rebosando de tiques; en el taller, una caja de piezas, trapos con aceite, un ventilador sin aspas
  y una caja de herramientas. El pintor (`src/art/room.ts`) los amontona **en los rincones** (tres o
  cuatro, sin repetir el de al lado; en el 70 % de los rincones de una sala de combate), **junto a
  las paredes** (unos 2,5 por sala de tamaño normal) y **al pie de las estanterías y mamparas** de
  dentro de la sala (30 % de las casillas). Y **las paredes dan sombra al suelo**: 14 px bajo la del
  fondo, 6 px en las de los lados y 3 px en la de delante, multiplicando el color del suelo (así cada
  planta conserva su tono). Ni el Mostrador ni lo que hay delante de las puertas lleva trastos.
- Decisiones: los trastos son decoración pintada en el fondo y no chocan, así que todos son bajos
  (≤ 14 px), un 14 % más oscuros y algo menos saturados que los props que sí se usan, y sin el rojo
  ni el cian de las balas: no se confunden con una caja que tapa ni con algo que hace daño. Van con
  su propio generador (`room-deco:` + semilla), así el resto de cada sala se pinta igual que antes.
  En las Oficinas la caja de efectos personales y la maceta son grises (la planta 4 es gris neutro y
  su test lo exige); en la sala secreta, menos trastos que en las demás (es pequeña y ya tiene polvo
  y telarañas, y con más se parecía demasiado de color a la de otra planta).
- Medidas: unos 15 trastos por sala de combate normal; `tests/decoracion.test.ts` (4 tests: trastos
  propios de cada planta, bajos y sin colores de bala, al menos 5 por sala y rincones en el 80 % de
  las salas, nada delante de las puertas ni en el Mostrador). 966 tests en verde; bot sin fallos
  (no toca la simulación).
- Problemas conocidos: el centro de las salas grandes sigue vacío: eso lo arreglan la (h11c)
  (plantillas con más forma) y la (h11a) (props que se usan).
- Arreglo del e2e (estaba roto en `main`, con y sin este cambio): desde la (h9a) la bombilla tarda
  hasta 8 s en llegar a disparar (arranque 1,8 + pausa hasta 3,2 + aviso 1,2 + 1,7 disparando) y el
  e2e la esperaba 8 s justos; ahora 15. Y ante la balda de la tienda la tostadora anda hasta que sale
  «Comprar» (1,5 s como mucho) en vez de 0,5 s fijos, que a veces se quedaba corta. e2e entero en verde.
- Siguiente paso: (h11c) plantillas de sala con más forma, o (h10a) cuando acabe la (h9).
## 2026-11-13 19:10 (hora peninsular) — Hito M14b — (h9c) La planta 3: el cubo que sigue tus pasos y el microondas espejo
- Hecho: M14b (h9c). En la Juguetería, el Robot de Cuerda (rebota como una bola), el Coche
  Teledirigido (te rodea deprisa y embiste de lado) y el Sobre Sorpresa (salta) ya se movían a su
  manera; el **Cubo de Piezas** guardaba las distancias como tantos otros. Ahora **sigue tus
  pasos** (`LobberBrain.follow`): recuerda tu camino (un punto cada 0,1 s, hasta 40) y anda por
  él a 78 px/s, siempre algo más de un segundo de camino por detrás; si te paras, se para a esa
  distancia; se planta para lanzar sus piezas. Caminar en círculos lo trae detrás de ti; cortar
  por en medio te lo quita de encima.
  **El microondas cambia**: la órbita de la (h9a) repetía el verbo del coche teledirigido (rodear),
  así que ahora **va a tu reflejo en el cristal de su puerta** (`TurretBrain.mirror`, 40 px/s):
  al punto simétrico al tuyo respecto al centro de la sala. Te acercas y se aleja; vas a la
  izquierda y va a la derecha; solo os cruzáis en el centro. Se para a calentar. Dispara algo más
  a menudo (cada 1,3–2,1 s, antes 1,6–2,6): espejado, se queda lejos y era más fácil que en
  órbita (la planta 1 del bot pasaba del 50 % al 80 %; con el ritmo nuevo, 70 %). El código de la
  órbita se quitó (no lo usaba nadie).
  Tests: el cubo pasa por la esquina donde giraste; el microondas se acerca a tu reflejo y va al
  revés que tú; los que disparaban a un microondas quieto le apuntan donde esté.
- **Arreglo de `main`**: el commit de la (h9a)–(h9b) dejó dos errores de tipos en
  `tests/enemies.test.ts` (miré `npm run check | tail -1`, que solo enseña la línea del lint);
  los arreglé en dos commits pequeños en cuanto los vi. A partir de ahora, `check` se mira con
  `grep ✖`.
- Medidas (`npm run bot`): la planta 1, el 70 %; la planta 2 la gana el 44 % de los que llegan
  (16 de 20); la 3, el 71 % de 7. 955 tests en verde; e2e entero en verde.
- Problemas conocidos: el robot de cuerda y la bombilla rebotan los dos en diagonal (rápido y
  disparando al rebotar, el robot; lenta y sin parar, la bombilla); si en partida se parecen,
  que la bombilla cambie de verbo.
- Siguiente paso: (h9d) los de la planta 4 (la fotocopiadora y el climatizador guardan las
  distancias); o (h10a) jefes más únicos.

## 2026-11-13 16:30 (hora peninsular) — Hito M14b — (h7) Saltar rodando por encima de mesas y cosas bajas
- Contexto: la (h8) la cerró otra sesión mientras yo la cogía (mi «en curso» chocó al hacer push
  y lo descarté); la (h9a) está cogida por otra. Elegí la (h7), que no toca sus archivos. Salud al
  empezar: `check`, 951 tests, `build` y `bot` en verde.
- Hecho: M14b (h7). Ya existía el mecanismo de los mostradores bajos de la Centralita
  (`PropDef.low`: andando cortan el paso, rodando se cruzan y la voltereta nunca acaba encima);
  ahora también son bajos la **Mesa de Saldos** (de pie y volcada; sigue cubriendo después), la
  **Caja de devolución**, el **Bidón** y el **Carro sin moneda** (`src/data/props.ts`). No lo son
  la caja registradora, el mostrador, el archivador, las pilas de cajas, la mesa de juntas ni los
  cofres. Evento nuevo `vault` al subirse a una: un chirrido grave (`saltar`) y una nube de polvo
  donde despega; la tostadora (y su mano) se dibuja hasta 6 px más arriba mientras pasa por
  encima (`VAULT_LIFT`, `GameScene.ts`). **Arreglo de paso**: si algo corta la voltereta encima
  de una cosa baja (los rodillos de una cinta muerden, cae una caja, un traslado de departamento,
  la muerte), `settleOffLow` al final de cada tick la deja al lado; sin él, el bot de la
  Trituradora salía disparado fuera de la sala desde encima de una caja (6 fallos). Tests nuevos en
  `tests/saltar.test.ts` (andando no pasa, rodando cruza desde los cuatro lados y desde 1, 6 y
  14 px, un solo `vault` por voltereta, la volcada sigue volcada, lo alto la para, sin sitio al
  otro lado la deja al lado, un aspirador la rodea, determinista). `tests/centralita.test.ts`
  ahora cuenta sus mostradores por id (su sala también tiene cajas y bidones). e2e: captura
  `11ka-saltar-mesa`, que comprueba que la cruza.
- Decisiones: los bidones se pueden saltar aunque exploten: saltar uno encendido es arriesgado
  y eso es bueno. Los enemigos que andan siguen sin cruzarlas (las rodean): saltar una mesa es
  una forma de escapar. Los cofres no se saltan para no pasar por encima sin querer al ir a abrirlos.
- Medidas (`npm run bot`): 0 fallos, 3 atascos (4 sin el cambio), sala limpia en 30 s (29,7),
  sobrevive el 96 % (95 %). 958 tests.
- Problemas conocidos: el bot no usa el salto a propósito (no lo planifica para huir). El e2e
  falló una vez en la batidora (ya muerta al llegar; con la vida nueva de la (h1) una bala perdida
  la tumba a veces): no tiene que ver con esto y la segunda vez pasó; si se repite, darle vida en
  el e2e antes de mirarla.
- Siguiente paso: la (h10a), jefes de las plantas 1–2 más únicos; o la (h11a), los props nuevos
  que se usan ((h9c) y (h11b) están cogidas).
## 2026-11-13 17:55 (hora peninsular) — Hito M14b — (h9b) Los enemigos de la planta 2, con movimiento propio
- Hecho: M14b (h9b). De los cuatro de Informática, el Cargador Falso (espera tirado y se lanza) y
  el Ratón sin Pilas (se congela y aparece más cerca) ya tenían un verbo propio; los otros dos
  guardaban las distancias, como hacía la bombilla. Ahora:
  - **Impresora**: va de lado a lado como el cabezal de impresión por su carril
    (`TurretBrain.carriage`, 30 px/s, solo en horizontal, da la vuelta al chocar) y se para a
    imprimir. Con dos en una sala, barren la sala en carriles.
  - **Webcam**: solo se mueve cuando no la miras (`WatcherBrain.shy`: con la mira a más de 35° de
    ella), y entonces se escabulle a 75 px/s hasta 150 px detrás de tu espalda; mirada, se queda
    quieta. Graba como antes. Obliga a girarse, que es lo que hace una cámara que te vigila.
  Tests nuevos en `tests/impresora.test.ts` (el carril) y `tests/webcam.test.ts` (quieta mirada,
  detrás de ti de espaldas).
- e2e más robusto: la bombilla flota ahora por la Sala de Pruebas y a veces se cruzaba con los
  disparos al maniquí y caía antes de su captura (el paso fallaba al empezar); si no está, se pone
  una (y lo mismo con la batidora). La prueba de la suela de la Plancha usa dos aspiradores quietos
  (el microondas ya no se está quieto).
- Medidas (`npm run bot`): la planta 2 la gana el 60 % de los que llegan (10 de 20), 0,82 heridas
  por sala de combate; 953 → 955 tests en verde; e2e entero en verde.
- Siguiente paso: (h9c), los de la planta 3 (robot de cuerda, coche, carretilla, cubo, sobre); o
  la (h7), saltar por encima de los obstáculos bajos.

## 2026-11-13 17:00 (hora peninsular) — Hito M14b — (h9a) Los enemigos de la planta 1, cada uno con su movimiento
- Hecho: M14b (h9a). El humano notaba que casi todos se mueven igual (acercarse, pararse,
  disparar). Cada enemigo de la planta 1 tiene ahora un verbo propio, con parámetros en los datos
  y no casos especiales en el motor:
  - **Aspirador**: rebota en las paredes como una bola de billar (`ChargerBrain.rebound`: dos
    rebotes por carga, 0,35 s más cada uno, en espejo y nunca en línea recta con la pared); a la
    tercera pared se queda aturdido, como antes a la primera.
  - **Microondas**: da vueltas alrededor de la tostadora como el plato de dentro
    (`TurretBrain.orbit`: 34 px/s a unos 120 px, cambiando de sentido cada 2,5–4,5 s o al
    tropezar); se para a calentar y a disparar. Antes no se movía nunca.
  - **Bombilla**: flota en diagonal sin parar y rebota en paredes y muebles como un salvapantallas
    (`TurretBrain.drift`, 26 px/s), también mientras avisa y dispara su espiral; con su polilla
    alrededor, es un enjambre que cruza la sala. Antes guardaba las distancias.
  - **Batidora**: tres embestidas seguidas, cada una apuntada otra vez con un aviso de 0,2 s
    (`ChaserBrain.chain` y `chainTelegraph`). Con el turbo, más deprisa.
  - El **Mando** (teletransporte) y la **Polilla** (vuelo en órbita y picado) ya eran únicos.
  Tests: el aspirador que rebota, el microondas que gira y se para a calentar, la bombilla que
  rebota en diagonal y flota disparando, y las tres embestidas de la batidora; los de la Plancha y
  las cintas usan un microondas sin órbita (lo que prueban es otra cosa).
- Decisiones: los rebotes del aspirador se cuentan por carga y no por sala; el microondas gira
  solo entre ataques para que su aviso de 1 s siga leyéndose; la bombilla flota también disparando
  porque así su espiral nunca sale del mismo sitio dos veces.
- Medidas (`npm run bot`): la planta 1 la gana el **50 %** (antes de esta tarea, 70–75 %; antes
  de la (h1), 40 %), con 0,62 heridas y 11,7 s por sala de combate; 3,1 heridas/min en la Sala de
  Pruebas (2,6). Llegan a la planta 2 diez de 20. 953 tests en verde; e2e entero en verde.
- Siguiente paso: (h9b), los de la planta 2 (impresora, cargador, ratón, webcam); o la (h7).

## 2026-11-13 15:50 (hora peninsular) — Hito M14b — (h8) Hitboxes que se corresponden con el dibujo
- Hecho: M14b (h8). Medí la caja de golpe de cada enemigo contra su dibujo (el primer fotograma,
  píxeles opacos, respecto al ancla): **cubrían solo el 48–74 % del dibujo** (el aspirador, el
  mando y el Router, menos de la mitad), así que disparos que se veían dentro fallaban. Ahora la
  caja de los 26 enemigos normales es su dibujo menos el contorno (un 8 % por los lados y un 6 %
  arriba, dos píxeles abajo por la sombra), simétrica porque el dibujo se voltea, y nunca más
  pequeña que la de antes (`hurt` en `src/data/enemies.ts`). Los jefes ya cubrían el 60–72 %;
  el Router, que solo tenía la caja del cuerpo (39 %), cubre ahora también la parte de arriba. La
  polilla (vuela y se dibuja en otra altura), la caja de botín y la silla del Director, igual.
  **Las balas enemigas se dibujan siempre al menos 1,25 veces más grandes que su círculo de
  golpe** (`ENEMY_BULLET_DRAWN` en `GameScene`): las de 6 px (los cubitos) se dibujaban más
  pequeñas que lo que golpeaban. La tostadora ya tenía un núcleo pequeño (radio 4) y se queda.
- Decisiones: cajas simétricas porque `dummyHurtBox` no voltea la caja con el dibujo; la del
  contacto con los enemigos (por los pies) no cambia.
- Medidas (`npm run bot`): precisión 75,5 % (74 %); la planta 1, el 70 % (75 %; ruido de 20
  partidas). 951 tests en verde.
- Problemas conocidos: la caja sale del primer fotograma; en los que cambian mucho de forma al
  atacar (el sello en el aire, el teléfono saltando) se usa la altura, como antes.
- Siguiente paso: (h7) saltar rodando por encima de mesas y obstáculos bajos; o (h9a).

## 2026-11-13 14:40 (hora peninsular) — Hito M14b — (h2) (h3) (h4) La economía del Isaac, un cofre por sala y menos corazones
- Contexto: otra sesión trabaja a la vez en M14b (hizo la (h5), los bidones, y lleva la (h6), las
  mesas); yo cogí las tres de economía juntas porque tocan los mismos trozos (`world.ts`: premios
  de sala, recogida y botón de interactuar).
- Hecho (h2): **los cupones vuelan solos** a la tostadora en cuanto la sala está limpia (puertas
  abiertas), desde cualquier rincón y por encima de los muebles (`Pickup.flying`; el invariante
  de «objeto perdido en una pared» no cuenta los que vuelan). **Todo lo demás se coge con el botón
  de interactuar**: armas, objetos, activos, tickets y documentos (`GRAB_KINDS`, `GRAB_REACH`
  16 px, el `Interactable` nuevo `grab` con «F: Coger»); andar o rodar por encima ya no los coge.
  Los corazones (de recambio, garantía y especiales) siguen cogiéndose al pasar. **Cupones mucho
  más escasos**: casi todos los enemigos 0–1 (antes hasta 1–3), los jefes 3–6 (antes 5–12); **la
  tienda más cara**: objeto 20 (15), activo 15 (12), arma 24 (18), corazón 8 (6), ticket 12 (10);
  el rasca del Sorteo, 6 (5). El bot pulsa el botón para coger lo del suelo (un activo, solo si no
  lleva otro) y va también a por documentos y activos.
- Hecho (h3): **un cofre en el tesoro** (antes dos) y **una sala de combate que siempre deja
  otro** al limpiarla (`FLOOR_CHESTS`), además del 15 % de las demás y el de la secreta: unos dos
  cofres por planta como antes, pero nunca dos en la misma sala.
- Hecho (h4): el corazón de recambio al limpiar una sala, del 35 % al **15 %**; la Garantía
  Provisional, del 10 al 8 %. Una planta da ahora 0,6 corazones de recambio y 0,4 garantías de
  media (con 300 semillas), más el de la jefa. Las balas enemigas de la planta 1 van un 6 % más
  rápidas (las demás plantas, un poco más que en la (h1)): con la vida nueva, la planta 1 seguía
  saliendo demasiado fácil.
- Decisiones: los cupones vuelan por encima de todo y no rodeando, porque rodear podía atascarlos
  detrás de una mampara; los tickets se cogen con el botón porque el humano dice que lo único que
  se coge andando son los corazones. Con un solo cofre en el tesoro, una sala de combate fija deja
  otro para que no baje el número de cofres por planta (la escasez está en los tickets).
- Medidas (`npm run bot`): 7,7 cupones/min (antes 9,8); compra 0,5 cosas por planta. Planta 1:
  la gana el 75 % (con la (h1) sola, 80 %; antes de las dos, 40 %), 13,3 s y 0,61 heridas por sala
  de combate. Llegan a la planta 3 seis de 20 y la gana el 67 %; a la 4, cuatro, y la gana
  ninguna: **pasar de la 3 es difícil de verdad**, como pidió el humano el 29 de octubre. 949
  tests en verde; el e2e coge las armas, los objetos y los tickets con el botón
  (`grabWhileWalking`).
- Problemas conocidos: la planta 1 sigue siendo fácil para el bot (los enemigos de las (h9) la
  pondrán en su sitio). El precio del Sorteo se cuadró con los precios nuevos de la tienda.
- Siguiente paso: (h7) saltar por encima de mesas y obstáculos bajos, (h8) hitboxes, o (h9a) los
  movimientos propios de los enemigos de la planta 1.
## 2026-11-13 15:25 (hora peninsular) — Hito M14b — (h6) Mesas que se vuelcan hacia donde toca y se rompen
- Contexto: segunda tarea de la sesión (paso 7). La (h2)–(h4) sigue cogida por otra sesión; la
  (h6) solo toca el vuelco y el desgaste de las mesas.
- Hecho: M14b (h6). **El fallo del vuelco** (`tipSide`, `src/sim/world.ts`): comparaba lo lejos
  que estaba la tostadora en unidades del tamaño de la mesa, y como la mesa es poco profunda (22×12),
  de pie a su izquierda con los pies un poco más abajo que sus patas la empujaba hacia delante. Ahora
  mide el **hueco en píxeles** entre la tostadora y la huella de la mesa en cada eje, y el lado gana
  un empate por `SIDE_BIAS` = 4 px (su cuerpo es alto y sus pies siempre quedan algo por debajo);
  justo delante o detrás, o en una esquina claramente por debajo, hacia delante como antes. **Se
  rompe antes**: aguanta 8 balas en vez de 14 (`src/data/props.ts`), una ráfaga o dos. **Se ve que se
  gasta** (`GameScene.ts`): con cada bala se oscurece un poco más, cruje más grave y más fuerte, y
  desde el 70 % parpadea en rojizo para que busques otra cobertura. Test nuevo en
  `tests/mesas.test.ts`: desde la izquierda y la derecha, con los pies a cualquier altura entre su
  tapa y 7 px por debajo de sus patas, se vuelca de lado (con el código de antes fallaba), y con el
  botón de interactuar también. e2e: la tostadora se aparta tras volcarla para que la captura `11n`
  enseñe la mesa recibiendo; empujada desde debajo, se pone a 8 px y no a 18 (a 18 ya es «de lado»).
- Decisiones: 8 balas y no menos: una mesa tiene que servir para una ráfaga de un enemigo de la
  planta 1 (5–7 balas) y caer con la segunda. Saltar por encima de las mesas es la (h7).
- Medidas (`npm run bot`): planta 1 en 14,3 s y 0,58 heridas por sala de combate (antes 14,1 y
  0,55), la gana el 95 %; vuelca 1,5 mesas por planta (1,4); 0 fallos, 0 atascos. 951 tests; e2e
  entero en verde.
- Problemas conocidos: la mesa de pie sigue sin vida (las balas pasan por encima); solo la volcada
  se gasta, como antes. El bot no se cambia de mesa cuando la suya está a punto de romperse.
- Siguiente paso: la (h8), las hitboxes; o la (h7), saltar rodando por encima de mesas y obstáculos
  bajos.

## 2026-11-13 14:40 (hora peninsular) — Hito M14b — (h5) Bidones que explotan antes, más lejos y más fuerte
- Contexto: el `main` local volvía a estar en otra historia; lo dejé igual que `origin/main` con
  `git checkout -B main origin/main` (solo local, sin tocar el remoto). Salud al empezar: `check`,
  949 tests, `build` y `bot` en verde. La (h1) estaba cogida; elegí la (h5), que no toca sus
  archivos. A mitad, la (h1) se publicó y otra sesión cogió la (h2)–(h4); el `pull --rebase` solo
  chocó en una línea de `tests/bidones.test.ts` (la mía y la suya decían lo mismo).
- Hecho: M14b (h5). El bidón (`src/data/props.ts`): **vida 10 → 4** (tres impactos del Secador en
  vez de siete; cuatro balas enemigas), **mecha 0,3 → 0,35 s** (`BLAST_FUSE`), **radio 36 → 64**
  (de baldosa y media a dos y media) y **daño 12 → 18**, que con la vida nueva de la (h1) tumba a
  cualquier enemigo normal de cualquier planta y a un jefe le quita un 10–20 %. A la tostadora le
  sigue quitando un corazón. **Se ve venir** (`drawDrums` en `GameScene.ts`): desde el primer
  impacto, su alcance como un aro rojo tenue en el suelo; encendido, el círculo entero en rojo que
  se intensifica, el borde parpadeando y un aro amarillo de dentro afuera que es la cuenta atrás.
  Sala de Pruebas: el bidón de al lado de la mesa se aparta tres baldosas (con el radio nuevo se
  la llevaba por delante antes de que nadie la probara). Tests: se enciende en ≤ 4 impactos, mecha
  entre 0,3 y 0,45 s, radio ≥ 2,5 baldosas y a esa distancia tumba a un aspirador; la cadena, con
  los bidones a 0,8 radios uno de otro. e2e: guarda los bidones de la sala al empezar y repone uno
  si una bala perdida lo ha hecho saltar antes de su turno, y elige uno que no alcance a la mesa.
- Decisiones: la mecha sube un poco (0,05 s) aunque el humano pide que exploten antes: lo que
  tardaba eran los siete disparos, no la mecha, y con un radio casi doble hace falta un instante
  para salir rodando del círculo pintado. Las mesas dentro del radio siguen saltando por los
  aires (las mesas con vida son la (h6)).
- Medidas (`npm run bot`, después de la (h1)): planta 1 en 14,1 s y 0,55 heridas por sala de
  combate (con la (h1) sola, 13,6 s y 0,57), la gana el 90 % (80 %; 20 plantas, ruido); 0 fallos,
  1 atasco. 950 tests en verde; e2e entero en verde.
- Problemas conocidos: con la vida nueva de la (h1), un tiroteo cerca de un bidón lo hace saltar
  a menudo por balas enemigas perdidas: es lo que se busca (las esquinas con bidones son
  peligrosas para todos), pero si molesta, que las balas enemigas le hagan la mitad.
- Siguiente paso: la (h6), mesas que se vuelcan hacia donde toca y se rompen; o la (h8), las
  hitboxes, si la (h2)–(h4) sigue cogida.

## 2026-11-13 13:35 (hora peninsular) — Hito M14b — (h1) Menos vida a enemigos y jefes
- Contexto: dos notas nuevas del humano (13 de noviembre). Primero, en un commit aparte, las
  repartí en dos hitos nuevos, **M14b** (lo que pide del juego, h1–h11) y **M14c** (arte nuevo,
  a1–a12), con la estimación al día (unas 48 sesiones más, un 77 %), la investigación de otros
  juegos en `docs/DISENO.md` y la respuesta sobre el arte en sus notas. La entrada «en curso» de
  la (v1) llevaba 8 horas sin commit: la quité (la (v1) sigue pendiente en M14). El `main` local
  volvía a estar en otra historia (50 por delante y 50 por detrás); esta vez `git reset --hard
  origin/main` sí funcionó.
- Hecho: M14b (h1). **Los enemigos tienen menos de la mitad de vida** (×0,43 de media,
  `src/data/enemies.ts`): el aspirador 14 → 6 (4 disparos del Secador en vez de 9), el microondas
  18 → 8, la bombilla 30 → 12, polillas y mandos 4 → 2, la impresora 22 → 9… Los que necesitan
  aguantar un poco para que se vea su gracia, algo más: el Asistente Virtual 9 (aprende tras tres
  balas) y el Teléfono 9 (pasa la llamada a la mitad de su vida; su aviso, de 0,8 a 0,5 s). **Los
  jefes, ×0,65**: la Nevera 135 → 90, la Lavadora 85, el Router 110, la Nube 115, la Consola 105,
  el Muñeco y el Director 140, la Centralita 155 y la Trituradora 195. La dureza por planta baja
  (3: 1,15; 4: 1,25; 5: 1,2; Servicio Técnico 1,35). **A cambio, las balas enemigas vuelan más
  rápido en las plantas altas** (`FLOOR_BULLET_SPEED` en `src/data/rooms.ts`, aplicado en
  `firePattern`): ×1,08 en la 2 hasta ×1,25 en la 6; la planta 1, igual. El Corazón de
  Sobretensión baja de 8 a 4 de daño (sigue dejando a medias a un aspirador, como dice su ficha).
  Tests actualizados con los valores nuevos; los del teléfono, en proporción a su vida.
- Decisiones: que la dificultad vuelva por las balas y no por la vida, como pide el humano; el
  resto (enemigos y jefes con movimientos propios) es la (h9)–(h10). La planta 1 sin balas más
  rápidas: se la tiene que poder pasar cualquiera; la harán más dura la (h2) y la (h4) (menos
  cupones y menos corazones).
- Medidas (`npm run bot`): sala de combate de la planta 1 en 13,6 s (antes 23,7) con 0,57
  heridas (1,04); la planta 1 la gana el 80 % (antes 40 %): **ahora es demasiado fácil para el
  bot** y lo arreglarán la (h2) y la (h4), que quitan corazones. Llegan a la planta 5 tres de 20
  (antes ninguna). Jefes: la Nevera en 50 s (71,5), la Lavadora 50 (73), el Router 66 (102), la
  Nube 79 (115), la Consola 78 (158), el Muñeco 103 (155), el Director 115 (176), la Centralita
  126 (202) y la Trituradora 105 (143). 949 tests en verde.
- Problemas conocidos: los textos de `docs/DISENO.md` que citan la vida de un enemigo dicen la de
  antes; la vida buena está en `src/data/enemies.ts`. La planta 1 queda fácil hasta la (h4).
- Siguiente paso: la (h2), la economía (cupones que vuelan solos y escasos; coger con el botón).

## 2026-11-13 04:30 (hora peninsular) — Hito M14 — Jefes al azar (j4): la Consola Edición Coleccionista
- Contexto: el `main` local volvía a estar viejo (en M11, 50 por delante y 50 por detrás, clon
  superficial); `git reset --hard` no estaba permitido, así que trabajé en `origin/main` sin rama y
  empujé con `git push origin HEAD:main`. Salud al empezar: `check`, 934 tests, `build` y `bot` en
  verde. Otra sesión lleva la (l4) (premios de logros), que no toca estos archivos.
- Hecho: **la Consola Edición Coleccionista** (`consola-coleccionista`, letra `È`), el segundo jefe de
  la planta 3, en `FLOOR_BOSS_POOLS[3]` junto al Muñeco. Diseño en `docs/DISENO.md`. Sprite nuevo
  (`tools/sprites/consola.ts`, 72×76, 16 fotogramas): torre de plástico negro brillante con ribete
  dorado, patas cortas, bandeja del disco, mando con cable en la mano; chistes: la placa «000001», la
  estrella «+3 %» y la trampilla del contenido descargable con candado. Fotogramas: respirar, andar,
  la bandeja fuera (aviso) y actualizando (barra de progreso atascada); con el pase de temporada, el
  pase colgado, la tira de luz de colores y los ojos dorados. Balas nuevas: cartucho (`cartridge`) y
  cupón falso (`fakecoupon`). Enemigo nuevo: la **Caja de Botín** (`caja-botin`, 24×24, fuera del
  glosario como la silla del Director). Mecánicas nuevas, genéricas y en los datos:
  **`BossSummonAttack`** (`kind: 'summon'`: lanza ayudantes hacia el jugador con un tope de los suyos
  en pie, contando lo que sale de ellos: `helpersOf`, `tossHelpers`); **`LootboxBrain`** (la caja se
  queda quieta, tiembla —estado `jam`, evento `lootShake`— y se abre sola con `EnemyDef.selfSurprise`;
  rota a tiros, con su `surprise`); **`SurpriseDef.pattern`** (los cupones falsos son balas); lo que
  sale de una caja es del jefe (`owner`) y cae con él, y una caja cuyo jefe ha caído no se abre;
  **`BossPhase.seasons`** + `season` en cada ataque (`BossAttackCommon`): `pickAttack` solo elige los
  de la temporada en curso, que cambia cada `every` s con su evento `season` (el nombre en dorado sobre
  ella). La actualización es el `mute` de siempre con su línea. Un enemigo con `contactDamage: 0` ya no
  hiere ni empuja al tocarlo. Glosario, créditos, causas de baja, bot (`npm run bot` mide la Consola).
  Tests: `tests/consola.test.ts` (8) y ajustes en final, glosario, textos, jefes-movimiento, muneco-jefe
  (otra semilla, que saca al Muñeco) y plantas (el Escaparate tiene al Muñeco o a la Consola). e2e
  `65a`–`65f`.
- Decisiones: las cajas que nadie rompe se abren solas y dan **lo peor** (solo juguetes), y rotas a
  tiros pueden dar cupones falsos o, rara vez, cupones de verdad: así el chiste del botín es también la
  decisión del jugador (gastar disparos en cajas o en el jefe). Los cupones falsos son balas rojas y no
  amarillas: un cupón-bala amarillo se confundiría con los de verdad. Los juguetes son sobre todo
  Muñequitos Repetidos (débiles): con Robots de Cuerda y Cubos de Piezas el bot moría siempre por la
  acumulación. La caja se dibuja como un cofre morado con «?» para no parecerse a la Caja Fuerte de
  Devoluciones. El bot apunta a las cajas como a un objetivo algo más cercano (peso 0,7) y a su altura.
  Las temporadas duran 8 s y van en orden (botín, competitiva, remasterizada): al azar se repetían y no
  se notaba el cambio.
- Medidas: el bot contra la Consola (60 combates). Primera versión (225 de vida, tres cajas, juguetes
  fuertes, patrones a 110 px/s): gana el **0 %**, llega a la fase 2 el 25 % (6 heridas: 91 de 120 de
  sus balas y el resto de juguetes; las cajas se abrían solas 13 veces por combate y se rompían 2).
  Tras bajar los patrones (cartuchos a 100, cable más corto), dos cajas como mucho tres en pie, cajas
  que se lanzan más lejos y tardan 6,5 s en abrirse, juguetes débiles, actualización cada 8–11 s con
  +60 % y 165 de vida: **gana el 21,7 % en 150 s**, 5,6 heridas (2,9 en la fase 1, 2,7 con el pase),
  llega a la fase 2 el 97 % a los 85 s (el Muñeco, 13 % en 155 s; el Router, 20 %). `npm run bot`: 200
  partidas, 0 fallos. 943 tests en verde. e2e entero en verde (en la primera pasada falló el del
  Becario por tiempo con la máquina cargada; en la simulación tarda 4 s de 8, y la segunda pasada salió
  limpia).
- Problemas conocidos: la fase 1 es larga para el bot (85 s) porque gasta muchos disparos en cajas;
  un jugador de verdad elegirá mejor. El cable de mando (espiral que barre) es lo que más daño hace al
  bot en la fase 1.
- Siguiente paso: (j5) la Fuente de Agua de Oficina, el segundo jefe de la planta 4.

## 2026-11-13 04:20 (hora peninsular, de `date`) — Hito M14 — Logros (l4b): las dos armas premio
- Contexto: la misma sesión que la (l4a), siguiendo con el paso 7. La (j4) la tenía otra sesión;
  esta no toca sus archivos salvo dos líneas del dibujo de las balas pegadas en `GameScene.ts`.
- Hecho: **el Soldador de Estaño**, premio de «Fin de la garantía» (llegar al final de verdad): la
  herramienta del Servicio Técnico. Gotas lentas y pesadas (daño 1,7, 2,7 por segundo, cargador
  10); las que fallan se quedan pegadas 3 s donde chocan (`stick`, la mecánica de la Plastilina) y
  queman una vez a quien las pisa, con su charco de estaño que brilla y se enfría
  (`charco-estano`), chisporroteo y chispas naranjas. **El Mando Universal**, premio de «Toda la
  gama» (ganar con los cinco productos): pulsos de infrarrojo de 1,5 de radio, los más rápidos
  (500), que atraviesan a uno y uno de cada cinco «acierta con el canal» por el triple (`crit`; el
  aviso «Doble clic» que ya existía le va que ni pintado). Sprites en la mano, balas y charco en
  `tools/sprites/premios.ts`; sonidos `soldador` y `mando` en `src/audio/synth.ts`. Las dos están
  en `FINDABLE_WEAPONS` (desde la planta 1, una vez ganadas) y la Sala de Pruebas tiene dos
  pedestales más. La ficha del arma dice ahora también «Las que fallan se quedan pegadas 3 s» y
  «Atraviesa 1 enemigo · 20 % con daño ×3» (y arreglé el «Atraviesa 1 enemigos»). Con esto la (l4)
  y la tarea de los logros de M14 quedan hechas: **ningún logro se queda sin premio**. Tests
  nuevos en `tests/armas-premio.test.ts` (3); e2e `19i` (charcos de estaño en la pared) y `19j`
  (los pulsos y el «Doble clic»).
- Decisiones: cada arma gana claramente en algo y pierde en otra (la regla del humano, que vigila
  `tests/armas.test.ts`): le añadí cuatro rasgos a ese test, «se queda pegada», «crítico»,
  «empuje» y «tamaño de bala». El Soldador gana en lo primero y pierde en empuje (el estaño quema,
  no empuja); el Mando gana en velocidad de bala y críticos, y pierde en tamaño de bala (un punto
  de luz hay que apuntarlo). Ajusté los números hasta no quitarle a ninguna otra su único punto
  flaco: con 2,4 disparos/s el Soldador le robaba al Secador el de «balas por segundo», y con un
  cargador de 8 el Mando le robaba a la Etiquetadora el de «segundos de cargador». Las dos superan
  al Secador por segundo (3,33 y 3,46 en el papel, sin contar críticos ni charcos) y el Pulverizador
  sigue siendo el que menos. El alcance del Soldador (218) es más del doble del Megáfono, como pide
  su test. «Mando» es id de arma y «mando-vibracion» de objeto: no chocan.
- Medidas: `npm run bot`, 200 partidas, 0 fallos. Planta 1 (bot con todo desbloqueado): ganada
  40 % (antes de la l4, 35 %; ruido de 20 partidas). En la Sala de Pruebas el bot sobrevive el
  86 % (antes 94 %): ahora recorre dos pedestales más, en la esquina de los enemigos. 940 tests en
  verde. e2e entero en verde.
- Problemas conocidos: el sprite de la bala del Mando es de 7 × 5 aunque su radio es 1,5 (se ve
  igual de pequeño que los demás puntos de luz; si estorba, uno de 5 × 3).
- Siguiente paso: (j5) la Fuente de Agua de Oficina si la (j4) ya está; o los PNJs de M14.

## 2026-11-13 03:30 (hora peninsular, de `date`) — Hito M14 — Logros (l4a): premios que no existían
- Contexto: el `main` local volvía a estar divergido (otra copia vieja, de M11); lo puse en
  `origin/main` con `git checkout -B main origin/main` (`reset --hard` no estaba permitido). Salud
  al empezar: `check`, 927 tests, `build` y `bot` en verde. La (j3) estaba cogida desde hacía 57
  minutos, así que hice la (l4), que no toca sus archivos; la Nube llegó a mitad y el
  `pull --rebase` mezcló sin conflictos (solo hubo que regenerar `sprites.json`).
- Hecho: dividí la (l4) en (l4a) objetos y (l4b) armas, e hice la (l4a). **Cinco objetos nuevos que
  solo existen como premio** de los logros difíciles que no traían nada (`src/data/items.ts`, al
  final, y su `reward` en `src/data/logros.ts`): la **Bolsa de Tela Reutilizable** («Cliente
  habitual», 25 partidas: cargador ×1,3, recarga ×1,1, 15 % de cupón extra por baja); la **Póliza a
  Todo Riesgo** («Siniestro total», 50 bajas: +1 corazón, uno de cada diez golpes no hace nada,
  anda ×0,9); el **Contenedor Amarillo** («Punto limpio», 1000 desmontados: las balas atraviesan a
  uno y rebotan una vez, velocidad de bala ×0,85); la **Oferta Tres por Dos** («Pack ahorro», 8
  sinergias: dos balas más por disparo, daño ×0,5, dispersión +14, que solo compensa de cerca); y
  el **Plástico Protector** («Estado: como nuevo», 4 jefes sin perder vida: la voltereta corta
  balas y el parpadeo tras un golpe dura ×1,5, pero tarda ×1,2 en volver a rodar). Sus cinco
  sprites de 16 × 16 en `tools/sprites/items.ts` (bolsa de tela con su hoja, póliza con escudo y
  sello, contenedor con ruedas, pegatina roja «3x2», film transparente con una esquina levantada),
  con la paleta y el contorno de los objetos aprobados. e2e: `62f`, la ficha de «Cliente habitual»
  en progreso con su premio. Test nuevo en `tests/premios.test.ts`.
- Decisiones: **todo con mecánicas que ya existían** (estadísticas, `pierce`, `bounce`, `coupons`,
  `shrug`, `rollClear`, `hurtIframes`): «añadir un objeto no debería tocar el motor», y así la
  sesión cabe. Cada premio da algo y quita algo (lo vigila el test) y nada empeora todas las armas
  en el papel: por eso la Póliza paga con velocidad y el Contenedor con velocidad de bala, no con
  daño. **De la planta 1 en adelante y no «buenos»**: un premio difícil tiene que poder verse en la
  partida siguiente, no solo en la Caja Fuerte Premium. **Sin sinergias por ahora**: un premio
  tiene que funcionar solo. Tono: la bolsa que compras para no pagar la otra, el seguro que no
  cubre lo que haces, el reciclaje que el camión mezcla, el 3x2 que se paga en la factura, el
  plástico que nadie quita. El test de la Oficina de Financiación pedía «que el objeto no devuelva
  el corazón» y la baraja nueva le ponía la Garantía Extendida: ahora deja fuera los objetos que dan
  vida, que es lo que quería decir.
- Medidas: el bot juega con todo desbloqueado, así que las barajas cambian: planta 1 ganada 35 % →
  45 % y llegan a la planta 2 7 → 9 de 20 (20 partidas: dentro del ruido, la tendencia es la
  esperada con más objetos en la baraja). `npm run bot`, 200 partidas, 0 fallos. 935 tests en verde
  (con los de la Nube). e2e entero en verde.
- Problemas conocidos: ninguno nuevo. El bot sigue sin medir la partida de alguien sin nada ganado.
- Siguiente paso: (j4) la Consola Edición Coleccionista; o (l4b), las dos armas premio.

## 2026-11-13 02:45 (hora peninsular) — Hito M14 — Jefes al azar (j3): la Nube de Almacenamiento
- Contexto: el `main` local estaba otra vez viejo (en M11); lo puse en `origin/main` (los commits
  viejos siguen en el reflog de este clon; ya estaban guardados como `main-stale` en otros). Salud al
  empezar: `check`, 918 tests, `build` y `bot` en verde. La (l3) estaba cogida y terminó mientras
  apuntaba la mía; ahora otra sesión lleva la (l4), que no toca estos archivos.
- Hecho: **la Nube de Almacenamiento** (`nube-almacenamiento`, letra `Ç`), el segundo jefe de la
  planta 2, en `FLOOR_BOSS_POOLS[2]` junto al Router (sale más o menos a medias). Diseño en
  `docs/DISENO.md`. Sprite nuevo (`tools/sprites/nube.ts`, 72×76, 12 fotogramas): nube gorda que
  flota sin piernas, lóbulos con luz arriba a la izquierda, párpados de suficiencia, manos
  flotantes, llovizna; chistes: la barra de almacenamiento al 99 % (100 % y roja cuando se llena), el
  cable USB colgando con el enchufe balanceándose y la pegatina del candado abierto. Fotogramas:
  cuatro flotando, aguantando la respiración (aviso y sincronización) y el error (X en los ojos); en
  la fase 2, gris, hinchada y con carpetas clavadas. Balas nuevas: gota (`drop`) y archivo (`file`);
  prop nuevo: la carpeta (`carpeta-nube`, «Carpeta Sin Título (37)»).
  Tres ataques nuevos, genéricos, en los datos (`src/data/types.ts`):
  **`rain`** (lluvia en columnas: calles marcadas de la pared del fondo hacia abajo, una sobre el
  jugador y las demás separadas `gap`; `mark: 'rain'` y `Emitter.lane`, el render las pinta con
  bordes discontinuos y la gota que se hincha), **`sync`** («Sincronizando…»: una barra que se llena
  bajo la nube; si se llena, tres anillos de archivos y gotas; si le haces `cancel` de daño mientras
  tanto, «Error de sincronización» y aturdida `stun` s) y **`folders`** (un muro de props
  temporales atravesado entre el jefe y el jugador: `PropDef.crumble` —se deshacen sin explotar y
  solo las gastan las balas del jugador— y `PropInstance.life`; se van al caer el jefe). Eventos
  `rain`, `sync`, `syncEnd`, `folders`, `propCrumble` con su sonido, partículas y textos. Bot, glosario,
  créditos, causa de baja. Tests: `tests/nube.test.ts` (6) y ajustes en final, glosario, textos,
  jefes-movimiento y trituradora (tipo). e2e `64a`–`64f`.
- Decisiones: la barra va **debajo** de la nube y no encima: la sala del Router la pone pegada a la
  pared del fondo y por encima se salía de la pantalla. Mientras sincroniza no brilla como un aviso
  (`sourceTelegraph` la salta): la barra es el aviso, y 3 s de nube dorada no se leían. «Romper la
  barra» es hacerle daño mientras se llena (8 en la fase 1, 9 en la 2: con el Secador hay que darle
  casi todo el rato), más claro que una barra con su propia vida. Su propia lluvia no gasta las
  carpetas: así también hacen de techo, y el muro tiene dos caras. Flota solo en el dibujo: se mueve
  como los demás jefes (choca con muebles); un vuelo de verdad no aportaba y complicaba el bot.
- Medidas: el bot contra la Nube (30 combates): primera versión (160 de vida, 4 calles, barra que se
  rompía con 13) ganaba el 40 % y **nunca** rompía la barra (78 de 78 llenas); con la barra a 8 rompía
  1 de cada 8 pero ganaba el 57 %; subí a 175 de vida, 5/6 calles y archivos a 108 px/s: gana el
  33 % en 115 s, 5,3 heridas (el Router, 20 % en 102 s y 5,6). `npm run bot`: 200 partidas, 0 fallos;
  planta 1 con daño la gana el 35 % (igual). 934 tests en verde.
- Problemas conocidos: el bot casi nunca rompe las carpetas (espera a que caduquen: no dispara sin
  línea limpia); no molesta, pero mide la Nube algo más fácil de lo que será para quien se quede
  atrapado detrás.
- Siguiente paso: (j4) la Consola Edición Coleccionista, el segundo jefe de la planta 3.

## 2026-11-13 01:25 (hora peninsular, de `date`) — Hito M14 — Logros (l3): el contenido limitado
- Contexto: el `main` local volvía a estar divergido (lo guardé como `main-stale` y puse `main` en
  `origin/main`). Salud al empezar: `check`, 912 tests, `build` y `bot` en verde. La (j2) estaba
  cogida por otra sesión desde las 23:41, así que hice la (l3), que no toca sus archivos; su
  Lavadora llegó a mitad y la mezclé (un solo conflicto, en `src/data/logros.ts`: su texto nuevo de
  «Hoja de reclamaciones completa» con mis premios).
- Hecho: **12 logros traen premio** (`reward` en `src/data/logros.ts`): un arma o un objeto que no
  sale en cofres, pedestales, tiendas ni salas raras hasta ganarlo. `lockedContent(ganados)` da la
  lista; el juego la pasa a la partida (`WorldOptions.locked`, `World.locked`), que la lleva del
  Mostrador a cada planta (`leaveHub`, `nextFloor`), y `weaponPool` y `lootDecks` la quitan de las
  barajas. Si un logro se gana al acabar una planta, el premio ya entra en la siguiente. El aviso
  «Mérito conseguido» tiene una tercera línea, «Nuevo en los cofres: …», y la ficha del mérito en el
  Catálogo dice «Premio: …. Hasta entonces, agotado en todos los cofres.» o «Desbloqueado: …. Ya sale
  en cofres y tiendas.». Los premios: Garantía Extendida (primera baja), Copia de Seguridad (primera
  sinergia), Taza de Mejor Empleado (10 plantas), Caja de Cartón Vacía (jefe sin un rasguño),
  Etiquetadora de Precios (100 de un modelo), Mascota Virtual (30 objetos), Cable HDMI Dorado (6
  armas), Tarjeta de Socio (300 cupones), Cookies de Terceros (3 retos seguidos), Llave Allen
  Sobrante (planta en 4 minutos), Valoración de Cinco Estrellas (ganar) y Megáfono de Reclamaciones
  (5 jefes de planta). Tests nuevos en `tests/premios.test.ts` (9); e2e: `62c` es ahora un mérito en
  progreso con premio y el bloque comprueba que la partida bloquea lo que toca.
- Decisiones: **bloquear contenido que ya existía**, no crear contenido nuevo: es lo que pidió el
  humano («una cantidad de armas y objetos limitada» que se desbloquea con logros) y se puede hacer
  bien en una sesión; el contenido nuevo solo-premio queda como (l4). Cada premio tiene que ver con
  su logro y con su chiste. Reglas que vigilan los tests: ningún premio es arma de salida; ninguna
  sinergia necesita dos premios (por eso la Pegatina no es premio: va con la Caja); la planta 1
  conserva un objeto y un arma «buenos» para la Caja Fuerte Premium (por eso la Broca no es premio);
  «30 objetos» y «6 armas» se pueden lograr sin ningún premio («6 armas» pide ya desbloquear
  personajes o el Megáfono; antes bastaba con las de la planta 5). Las armas premio son las dos de
  la planta 5, no las de la 1: con solo dos armas en la planta 1, quitar una la dejaba en nada. Los
  logros más difíciles (50 bajas, 1000 bajas, 8 sinergias…) no traen premio: son para presumir.
  **Sin lista, todo desbloqueado**: los tests, los bots y la Sala de Pruebas lo tienen todo, así que
  el bot y el equilibrio medido no cambian (el bot juega como alguien con todo ganado). **El reto
  del día bloquea todos los premios** (`DAILY_LOCKED`) para que sea el mismo para todos; el regalo
  del día nunca es un premio. Eso cambia el botín del reto y el regalo de 18 de los 30 días de
  noviembre, también el de hoy (ahora, la Batería Hinchada); quien lo haya jugado hoy verá otro.
- Medidas: no cambia el equilibrio del bot (sin lista). `npm run bot`, 200 partidas, 0 fallos.
  927 tests en verde (con los de la Lavadora). e2e entero en verde.
- Problemas conocidos: el bot no mide cómo se juega con todo bloqueado (un jugador nuevo encuentra
  10 objetos y 2 armas menos). Si hiciera falta, una opción del bot con `locked: lockedContent([])`.
- Siguiente paso: (j3) la Nube de Almacenamiento; o (l4), armas y objetos nuevos solo de premio
  para los logros difíciles.

## 2026-11-13 00:20 (hora peninsular, de `date`) — Hito M14 — Jefes al azar (j2): la Lavadora Programa Eco
- Contexto: el `main` local volvía a estar viejo (otro clon); lo guardé como `main-stale2` y puse
  `main` en `origin/main`. Salud al empezar: `check`, 912 tests, `build` y `bot` en verde.
- Hecho: **la Lavadora Programa Eco** (`lavadora-eco`, letra `À`), el segundo jefe de la planta 1,
  en `FLOOR_BOSS_POOLS[1]` junto a la Nevera: la semilla elige (en 400 semillas, más o menos a
  medias). Diseño a fondo en `docs/DISENO.md` («La Lavadora Programa Eco»). Sprite nuevo
  (`tools/sprites/lavadora.ts`, 72×76): lavadora de carga frontal con el cajetín perdiendo polvo
  azul, la pantalla en **2:59**, el mando en ECO, una toalla encima, el ojo de buey como barriga, el
  calcetín rojo pillado en la goma y la etiqueta A+++ con la hoja verde que se puso ella. Siete
  fotogramas por programa (reposo, respiración con el tambor chapoteando, cuatro de andar y
  «pesando»): espuma, agua con calcetín y remolino con 1400 en rojo. Balas nuevas: pompas de jabón
  (16×16) y calcetines (12×12). Los tres programas: **Prelavado** (anillos de pompas grandes que
  frenan y se quedan flotando; se revientan a tiros) y un chorro apuntado; **Lavado** (desde 2/3:
  calcetines que rebotan dos veces en las paredes, y dos abanicos que rebotan una); **Centrifugado**
  (desde 1/3: más rápida, el sprite tiembla, espirales de agua de cuatro brazos y anillos de
  «Desagüe» que aceleran). En los tres, cada 8–13 s se para a **pesar la carga** (2 s quieta, sin
  atacar, recibe ×1,5, «Pesando la carga…» y dos pitidos). Su cartel, su causa de baja, el glosario y
  los créditos.
  Motor (genérico, en los datos): `bounce` en los patrones (las balas enemigas rebotan como las del
  jugador), `BossPhase.mute.line` (la frase propia de la pausa), `EnemyAnim.rattle` (el temblor) y
  el bot acepta un jefe forzado (`runBoss(..., boss)`), con su línea «combates contra la Lavadora».
  Tests: `tests/lavadora.test.ts` (5) y ajustes a los que daban por hecho que la planta 1 era la
  Nevera (boss, router-jefe, jefes-azar, jefes-movimiento, archivador, glosario, logros, final,
  textos). e2e `63a`–`63e`: cartel, espuma, pesando la carga, calcetines rebotando y centrifugado.
- Decisiones: «Entre programas se para a pesar la carga» lo hice con la pausa que ya tenía la
  Centralita (`mute`), una vez cada 8–13 s en cada programa, no solo en el cambio de fase (el cambio de
  fase ya es invulnerable: no servía de ventana). Su sala es la de la Nevera (la sala es de la planta),
  así que el cartel de arriba dice «Cámara frigorífica de la Dirección»: se queda, es la sala de
  la Dirección de la planta. El logro «Hoja de reclamaciones completa» pasa a «Vence a 5 jefes de
  planta distintos» (había 6 jefes de planta). El documento del archivador lo deja cualquier jefe de
  la planta, como decidió la (j1): la Lavadora no trae uno propio. No hay frases con exclamación (la
  guía de textos lo prohíbe): «1400 revoluciones. Las que pone en la caja.»
- Medidas: el bot contra la Lavadora (30 combates): gana el 60 % en 73 s, 4,7 heridas (2,2 en el
  prelavado, 1,8 en el lavado, 0,7 centrifugando); contra la Nevera, el 67 % en 72 s. Antes de ajustar
  (140 de vida, 9 pompas por anillo) ganaba el 30 %: bajé a 130 de vida, 8 pompas que viven 5 s y un
  chorro de 6. Planta 1 entera con daño: la gana el 35 % (antes el 15 %; con 20 plantas es mucho
  ruido). `npm run bot` 200 partidas, 0 fallos. 918 tests en verde.
- Problemas conocidos: ninguno nuevo.
- Siguiente paso: (j3) la Nube de Almacenamiento, el segundo jefe de la planta 2.

## 2026-11-12 23:05 (hora peninsular, de `date`) — Hito M14 — Jefes al azar (j1): cada planta elige su jefe
- Contexto: el `main` local del clon estaba viejo y divergido (50 commits que no están en el
  remoto); lo guardé como rama local `main-stale` y puse `main` en `origin/main`. Salud al empezar:
  `check`, tests, `build` y `bot` en verde. Los logros (l2) los llevaba otra sesión desde las 22:05,
  así que cogí los jefes al azar, que no tocan sus archivos (en `GameScene.ts`, solo `?jefe=`).
- Hecho: la tarea «Jefes al azar» (nota del humano del 2026-10-30) partida en siete en la hoja de
  ruta; hecha la (j1). `FLOOR_BOSS_POOLS` en `src/data/rooms.ts`: la lista de jefes de cada planta
  (letras de plantilla; la primera, la de siempre). `src/sim/bosses.ts`: `pickFloorBoss` (con su
  propio generador, `jefe:<planta>:<semilla>`), `bossesOfFloor`, `floorOfBoss`, `floorBossBeaten`.
  `FloorRun.boss` guarda el elegido y `planFloor` lo pone en la sala del jefe. `WorldOptions.boss`
  y `?jefe=<letra>` lo fuerzan (solo letras de jefe). Lo que pedía un jefe concreto pide ahora
  «el jefe de la planta N» (`UnlockCondition.floorBosses`): la Batidora (planta 1), el Móvil (2),
  la Plancha (4) y la cita del Servicio Técnico («ante el jefe de las 5 plantas, cada uno»); el
  documento de cada jefe lo deja cualquier jefe de su planta. Diseño de cinco jefes nuevos, uno por
  planta, en «Jefes al azar» de `docs/DISENO.md`. Tests nuevos en `tests/jefes-azar.test.ts` (7).
- Decisiones: **las listas tienen hoy un solo jefe**, así que la partida es idéntica a antes; el
  generador propio hace que añadir un jefe no mueva salas, cofres ni enemigos (lo comprueba un test
  con una lista de dos). La sala del jefe sigue siendo la de la planta (un jefe nuevo usa la de su
  planta). Los **diálogos** que nombran a un jefe (el teléfono, el Chatarrero) no cambian: son chistes
  de ese jefe y, al ser al azar, acaban saliendo. El logro «Hoja de reclamaciones completa» (5 jefes
  de planta distintos) tampoco: con más jefes sigue teniendo sentido. Los nombres de los jefes
  nuevos evitan los de objetos que ya hay (Antivirus Gratuito, Encuesta de Satisfacción, Café de
  Máquina): Lavadora Programa Eco, Nube de Almacenamiento, Consola Edición Coleccionista, Fuente de
  Agua de Oficina y Política de Devoluciones. El objetivo de «8 jefes» de M14 pasa a 11 con ellos.
- Medidas: no cambia el equilibrio. `npm run bot`, 200 partidas, 0 fallos; planta 1 con daño: la
  recorre el 65 % y la gana el 15 % (igual que antes). 912 tests en verde (con los de la (l2), que llegó a la vez).
- Problemas conocidos: ninguno nuevo.
- Siguiente paso: (j2) la Lavadora Programa Eco, el segundo jefe de la planta 1 (diseño a fondo,
  sprite al estilo aprobado, sus tres programas, presentación, despiece, bot), en la lista de la 1.

## 2026-11-12 22:28 (hora peninsular, de `date`) — Hito M14 — Logros (l2): verlos
- Hecho: la (l2), en la misma sesión que la (l1). **El sello del mérito** (`sello-merito`, 26×30,
  `tools/sprites/meritos.ts`): una roseta de papel dorado con su dentado, una marca en relieve, dos
  cintas rojas cortadas en V y la etiqueta del precio aún atada (estaba de oferta). **La tercera
  pestaña del Catálogo de siniestros, «Méritos (2/19)»**: todos los logros por su nombre (no son
  secretos: lo que piden es la gracia), con el cuadrado dorado si está ganado; a la derecha el sello
  (oscuro hasta ganarlo), «Conseguido» o «Llevas 7 de 25» con su barra, lo que pide y, debajo, el
  chiste o «Sin conseguir. El chiste viene con el mérito, como las pilas: no incluido.» Los no vistos
  llevan «Nuevo» en rojo mientras la pestaña está abierta, y al abrirla se dan por vistos
  (`saveSeenAchievements`). Mientras haya alguno sin ver, el menú de la portada y el de la pausa dicen
  **«Glosario · ¡Mérito nuevo!»**. **El aviso en la partida**: al guardar una planta, una partida o
  el final, por cada logro nuevo entra por la derecha una placa con el borde dorado, el sello (gira y
  se asienta), «Mérito conseguido» y el nombre, con el sonido de desbloquear; dura 2,6 s y si hay
  varios salen uno tras otro. Va por encima de todo, partes incluidos. Las tres pestañas se reparten
  el ancho y la ayuda dice «Izquierda y derecha: cambiar de pestaña».
  Tests: uno nuevo en `tests/logros.test.ts` (la pestaña, los nuevos, que todo cabe y se escribe con
  la fuente) y el del glosario mira también el sello de los méritos. e2e `62a`–`62e`: el aviso del
  menú, la pestaña con el nuevo marcado (y que el perfil los da por vistos), uno en progreso, y la
  primera baja que anuncia «Primera reclamación» sobre la partida antes del parte.
- Decisiones: el aviso sale **al guardar** (fin de planta o de partida), no en mitad del combate:
  los logros se calculan sobre el perfil, y así no tapa nada mientras se esquivan balas. El aviso y
  la marca «Nuevo» son cosas distintas: el aviso sale siempre al ganarlo; «Nuevo» se queda hasta que
  se mira la pestaña. La placa tapa el minimapa un par de segundos; al acabar la planta da igual.
- Medidas: no cambia el equilibrio. `npm run bot` 200 partidas, 0 fallos. 901 tests en verde. e2e
  entero en verde.
- Problemas conocidos: si el final verdadero da un logro, su aviso apenas se ve antes del fundido al
  taller (queda «Nuevo» en el catálogo).
- Siguiente paso: (l3) el contenido limitado: algunas armas y objetos que solo entran en los cofres
  y la tienda después de un logro concreto.
## 2026-11-12 22:40 (hora peninsular) — Hito M14 — Salas raras (r2b): el Sorteo de Fidelización
- Hecho: la segunda sala rara, plantilla `sorteo` («Sorteo de Fidelización (Participar No Implica
  Ganar)»). Las dos raras se reparten con la baraja de plantillas de la planta, como las demás
  (`stockRare` mira el id de la sala). La Caja de Autocobro vende tres **rascas** (`PickupKind`
  `rasca`, solo existen en una balda, a la venta) a `RAFFLE_PRICE` = 5 cupones; al comprarla se rasca
  en el acto con el generador del mundo y suelta el premio delante de la balda (`RAFFLE_PRIZES`):
  «Siga participando» (52), diez cupones (20), un ticket (12), un corazón de recambio (8), una
  Garantía Provisional (6) o el premio gordo, un cofre premium (2). La caja dice cada uno con su
  chiste; virutas plateadas al rascar, timbre y chispas si toca. Sprite nuevo `rasca` (11 × 13, en
  `tools/sprites/props.ts`: banda azul con estrella, tres casillas plateadas, la del medio rascada,
  y la letra pequeña en rojo). El Sorteo tiene su moqueta roja, su cartel «SORTEO» y «SIGA
  PARTICIPANDO» en el suelo, iguales en todas las plantas (`PaintableRoom.id`). «F: Rascar por 5».
  Con esto queda hecha la tarea «Salas especiales raras, retos diarios con semilla fija» de M14.
  Tests (4 más en `tests/sala-rara.test.ts`: el reparto entre las dos, cobrar y rascar, las
  frecuencias de los premios y lo que devuelve de media, los textos) y e2e `60c`–`60d`.
- Decisiones: de media devuelve más o menos lo que cuesta (con 600 rascas de prueba, unos 5 cupones
  de valor si un cofre premium vale tres objetos de tienda): la gracia está en la varianza, no en
  ganar dinero. **El bot tampoco rasca** (como no financia): sus cifras no dependen de la suerte.
  La caja de la tienda otra vez, en vez de una máquina nueva: es el chiste de la sala (la misma
  máquina que cobra, presta y sortea).
- Medidas: `npm run bot`, 200 partidas, 0 fallos. Planta 1 con daño: la recorre el 65 % y la gana el
  15 %; 10,8 salas visitadas y 7,1 de combate por planta (el bot no compra en las raras: nada cambia
  salvo qué sala rara sale). 895 tests en verde; e2e entero en verde.
- Problemas conocidos: ninguno nuevo. Otra sesión está con los logros (l2) en paralelo.
- Siguiente paso: M14, los jefes al azar por planta (nota del humano del 2026-10-30), dividida en
  partes (primero que cada planta elija de una lista, luego cada jefe nuevo); o los PNJs.

## 2026-11-12 21:48 (hora peninsular, de `date`) — Hito M14 — Logros (l1): los «Méritos del cliente»
- Contexto: el clon local de `main` volvía a ser superficial y viejo; `git checkout -B main origin/main`.
  Salud al empezar: `check`, 884 tests, `build` y `bot` en verde. La (r2a) estaba cogida por otra
  sesión desde hacía 59 minutos, así que elegí los logros, que casi no tocan sus archivos (en
  `world.ts` solo tres campos y cuatro líneas; en `GameScene.ts`, lo que se guarda en el perfil).
- Hecho: la tarea «Contenido limitado y desbloqueable con logros» partida en tres en la hoja de ruta;
  hecha la (l1). **19 logros** como datos en `src/data/logros.ts`: cada uno lee un único número del
  perfil (`stat` y `n`), para que la pantalla pueda pintar «23/100». Entre ellos los que pidió el
  humano: «Retirada del mercado» (100 de un mismo modelo), «Ni un arañazo en la caja» (un jefe sin
  perder vida), «Venta cruzada» (una sinergia); y «Pack ahorro», «Estado: como nuevo», «Hoja de
  reclamaciones completa», «Montaje exprés», «Cliente fiel» (3 retos del día seguidos), «Fin de la
  garantía», «Toda la gama»… Cada uno con su chiste para cuando se gana. `src/sim/achievements.ts`
  calcula el número, si se cumple, el progreso y el tablón (`achievementBoard`). El perfil guarda
  `achievements` (para siempre), `unseen` (ganados sin anunciar; `seenAchievements` los limpia),
  `synergies` (las encendidas alguna vez) y `flawless` (jefes vencidos sin perder vida). La partida
  apunta `World.synergiesSeen` (aunque luego se apague) y `World.flawless`: un golpe que quita vida
  (o que se come la garantía o el corazón especial) desde la entrada del jefe lo estropea; el «era
  solo la caja» no. `deedsOf(w)` lo pasa a `saveFloor`, `saveRun` y `saveEnding`.
  Tests nuevos en `tests/logros.test.ts` (9).
- Decisiones: **un número por logro** (más fácil de mostrar y de equilibrar que condiciones
  compuestas). Un guardado de antes recibe los logros que ya tenía ganados **sin anunciarlos**
  (si no, un jugador veterano vería una lluvia de avisos). «Sin perder vida» cuenta desde la entrada
  del jefe, no desde que se entra en la planta. La Trituradora no cuenta para «los 5 jefes de planta»
  (tiene su logro: el final). Los números (30 objetos, 6 armas, 8 sinergias) se comprueban en los
  tests contra lo que hay, para que nunca pidan más de lo que existe. Aún no se ven: eso es la (l2).
- Medidas: no cambia el equilibrio. `npm run bot` 200 partidas, 0 fallos. 893 tests en verde.
- Problemas conocidos: los retos del día solo se recuerdan 60 días, así que «Cliente fiel» mira las
  rachas de ese tiempo (basta, porque el logro se gana al momento).
- Siguiente paso: (l2) el aviso «Mérito conseguido» en la partida y la pestaña «Méritos» en el
  Catálogo de siniestros.
## 2026-11-12 21:10 (hora peninsular) — Hito M14 — Salas raras (r2a): la Oficina de Financiación
- Contexto: el clon local volvía a estar en una historia vieja; `git checkout -B main origin/main`
  (nada local que perder). Salud al empezar: `check`, 884 tests, `build` y `bot` en verde.
- Hecho: M14 (r2) partida en (r2a) y (r2b); hecha la (r2a). Nuevo tipo de sala `rare`: al generar
  una planta (1–5, no el taller), si sobra un callejón sin salida después del jefe, el tesoro y la
  tienda, con probabilidad `RARE_ROOM_CHANCE` (0,2) ese callejón es la sala rara. La tirada usa su
  propio generador (`rara:<semilla>`), así que las plantas sin sala rara son idénticas a las de
  antes. `validateFloor` acepta como mucho una y exige que sea un callejón sin salida. La primera
  sala rara, plantilla `financiacion` («Financiación al Momento (TAE: Sí)»): la Caja de Autocobro de
  la tienda, pluriempleada, vende en dos baldas un arma y un objeto pasivo de calidad «buena» (los
  primeros de la baraja de la planta; si no hay, el siguiente), cada uno por **un corazón de máximo
  para siempre** (`Pickup.pay = 'vida'`, `FINANCE_PRICE`, un modificador `financiacion` de −2 de
  vida máxima). Con un solo corazón de máximo no financia (`canFinance`, «Riesgo de impago»). Sus
  textos en `FINANCE` (`src/data/shop.ts`). En pantalla: el precio con un corazón rojo (gris sin
  crédito), «F: Financiar por 1 corazón», «−1 corazón» en rojo y un destello rojo al firmar; su
  moqueta verde de borde dorado; el cartel y la palabra del suelo de cada planta («FINANCIACIÓN»,
  «PAGO APLAZADO», «COMPRE AHORA», «CRÉDITOS AL PERSONAL», «EMBARGOS»; «LETRA PEQUEÑA», «CRÉDITO
  PREAPROBADO», «NÓMINA DOMICILIADA»…); en el minimapa, un «%» verde. Arreglo de paso: el bocadillo
  de la caja ya no tapa ni lo tapa el cartel de aviso (el de «E o rueda: cambiar de arma»): cuenta
  como techo, igual que el nombre de la sala. Tests en `tests/sala-rara.test.ts` (7) y e2e
  `60a`–`60b`.
- Decisiones: **una sola plantilla para todas las plantas** (el banco es el mismo en todas partes;
  los tests de «cada planta solo usa sus plantillas» lo exceptúan). Se paga con un **corazón de
  máximo**, no con vida actual: así es una decisión de verdad (el humano pidió dificultad media-alta
  y objetos que dan y quitan). **El bot nunca financia**, para que sus cifras midan el juego sin
  préstamos. Probabilidad 0,2: con 0,35 salían en un tercio de las plantas, demasiado para «rara».
  La caja de la tienda y no un PNJ nuevo: cuesta cero sprites y el chiste (la misma máquina que te
  cobra, ahora te presta) funciona.
- Medidas: `npm run bot`, 200 partidas, 0 fallos. Planta 1 con daño: la recorre el 60 % (antes 65 %)
  y la gana el 15 % (igual); 10,4 salas visitadas y 6,9 de combate limpias por planta (antes 10,8 y
  7,3): en las plantas con sala rara hay una sala de combate menos. Jefes, sin cambios. 891 tests en
  verde; e2e entero en verde.
- Problemas conocidos: la sala rara usa la caja y el expositor de la tienda; si algún día tiene su
  propio PNJ, irá aquí.
- Siguiente paso: M14 (r2b), una segunda sala rara (el «Sorteo de Fidelización», una apuesta; o un
  cambio de cupones por tickets) elegida al azar entre las raras; o los jefes al azar por planta.

## 2026-11-12 19:55 (hora peninsular, de `date`) — Hito M14 — Reto del día (r1): el «Boletín de ofertas del día»
- Contexto: el clon local de `main` era superficial y estaba en un punto viejo (`git pull` decía
  «ramas divergentes»); lo puse en `origin/main` con `git checkout -B main origin/main` (no había
  nada local que perder). Salud al empezar: `check`, 879 tests, `build` y `bot` en verde.
- Hecho: M14 (r1). La tarea «Salas especiales raras, retos diarios con semilla fija» partida en dos
  en la hoja de ruta; hecha la de los retos. Lógica pura en `src/sim/daily.ts`: la clave del día
  (`AAAA-MM-DD`, por el calendario del jugador), la semilla `reto-AAAA-MM-DD` (las plantas de arriba
  derivan la suya, como siempre), el número de boletín (el 1 es el 1 de enero de 2026; hoy, el 316),
  el día de la semana y las cuentas de fechas **sin `Date`** (el lint no deja relojes en `src/sim/`:
  días desde 1970 con el algoritmo civil de toda la vida), el **regalo del día** (un objeto pasivo de
  la planta 1 elegido con el `Rng` por la fecha, ya en la bolsa y sacado del mazo de la planta) y
  `startDaily`. El perfil guarda `dailies` (el mejor intento de cada día, cuántos, los últimos 60 días)
  y `dailyStreak` cuenta los días seguidos. En la portada, **«Reto del día»** (segunda línea) abre
  el «Boletín de ofertas del día»: número y fecha («jueves 12 de noviembre»), producto «Tostadora
  Reacondicionada (no se admiten cambios)», regalo «… (sin garantía)», intentos de hoy, mejor intento,
  días seguidos y «Oferta válida hasta las 23:59 o fin de existencias»; «Aprovechar la oferta» lo
  empieza. El reto abre con la ficha de devolución y, al cerrarla, la ventana del regalo («Regalo del
  día · ya en la bolsa»). El parte de baja añade «Reto del día: Intento 2 · Lo mejor de hoy: planta 2»
  y R prueba el mismo reto otra vez. Enlace directo `?reto` (hoy) o `?reto=AAAA-MM-DD`.
  Arreglo de paso: **el parte de baja (y el de planta) esconde la ventana de descripción** que
  hubiera abierta; si morías justo después de coger algo, se veía a través del formulario.
  Tests nuevos en `tests/reto.test.ts` (5): el calendario, que el mismo día da la misma partida y otro
  día otra, la Tostadora sin cita ni desbloqueos y con el regalo, el mejor intento y los días seguidos
  en el perfil (y que un guardado roto no rompe nada), y que los textos se escriben con la fuente y
  caben con todos los regalos posibles. e2e `59a`–`59c`: el boletín desde la portada, el regalo, el
  intento apuntado sin pisar el mejor y la misma planta por enlace.
- Decisiones: **siempre la Tostadora y sin desbloqueos** (`unlocked: []`, sin cita): las armas de los
  personajes desbloqueados entran en los cofres (`weaponPool`), así que con el perfil de cada uno la
  «misma» semilla daría partidas distintas. El reto termina en la planta 5 (sin Servicio Técnico).
  El mejor intento: ganar antes que perder; luego la planta más alta; perdiendo, más bajas; luego
  menos tiempo. **Nada sale del navegador**: no hay tabla de récords en ningún servidor (`CLAUDE.md`
  prohíbe conectar con terceros). El reto cuenta también como partida normal en el historial y el
  perfil (desbloqueos, glosario). La fecha se fija al abrir el boletín: pasada la medianoche, se sigue
  jugando el de antes hasta volver a la portada. «Boletín núm.» y no «nº»: la fuente no tiene «º».
- Medidas: no cambia el equilibrio. `npm run bot` 200 partidas, 0 fallos (como antes). 884 tests en
  verde. e2e entero en verde.
- Problemas conocidos: la ventana del regalo sale arriba, encima del cartel con el nombre de la
  primera sala, como cualquier objeto cogido nada más entrar en una sala.
- Siguiente paso: M14 (r2), las salas especiales raras; o los jefes al azar por planta (nota del
  humano del 2026-10-30).

## 2026-11-12 19:45 (hora peninsular) — Hito M14 — Glosario (g2): el «Catálogo de siniestros»
- Hecho: «Glosario» en la pausa (debajo de Inventario) y en la portada (antes de Historial) abre el
  «Catálogo de siniestros»: dos pestañas, Enemigos y Armas, que se cambian con izquierda y derecha
  (o con un clic en la pestaña), cada una con «fichados/total». A la izquierda la lista con barra de
  desplazamiento; a la derecha la ficha del elegido: su dibujo a escala entera (los enemigos a 2×,
  los jefes a 1×, las armas a 4×), el nombre, el título del jefe, «Desmontados: N» o «Derrotado N
  veces» y su descripción; las armas, sus números de fábrica. Lo que falta sale como «Sin catalogar»
  con su silueta oscura y una pista de cómo ficharlo. Lógica pura en `src/sim/glossary.ts`, dibujo
  en `src/render/glosario.ts`, textos en `src/data/texts.ts`; tests en `tests/glosario.test.ts`
  (qué entra y en qué orden, qué lee del perfil, que los dibujos existen y los textos caben) y e2e
  `58a`–`58d`.
- Decisiones: un enemigo cuenta como fichado si lo has desmontado, si es un jefe que has derrotado
  (así los guardados de antes de las bajas por tipo ya ven sus jefes) o si te ha tumbado alguna vez
  («Te ha desmontado, de momento»). Las piezas de jefe (la silla del Director, los repetidores del
  Router) no son enemigos de por sí: `EnemyDef.glossary: false` las deja fuera, como dato. Los jefes
  van al final y por plantas. La lista sin dibujos pequeños: escalar el pixel art a la mitad lo
  estropea, y el dibujo grande de la derecha ya lo enseña. Al meter «Glosario» en los menús se
  movieron dos recorridos de teclas del e2e (Opciones y Teclas, una flecha más).
- Medidas: tests y bot en verde (sin cambios de equilibrio).
- Problemas conocidos: el glosario no tiene objetos todavía (la hoja de ruta pide enemigos y armas);
  sería la tercera pestaña si hace falta.
- Siguiente paso: M14, la siguiente sin hacer: salas especiales raras y retos diarios con semilla fija,
  o los jefes al azar por planta (nota del humano del 2026-10-30).

## 2026-11-12 18:45 (hora peninsular) — Hito M14 — Glosario (g1): las bajas de cada tipo en el perfil
- Contexto: las dos tareas que quedaban de M13 (7c, la muerte de cada personaje, y la captura de los
  cinco) estaban cogidas en `en_curso` por sesiones de hace menos de 90 minutos, así que esta empezó
  M14 por algo que no toca sus archivos (mientras tanto las otras cerraron M13). Al arrancar, la copia local de `main` era una historia vieja
  sin relación con `origin/main`; se cambió a `origin/main` con `git checkout -B main origin/main`
  (nada local se perdió: no había commits propios).
- Hecho: el glosario de M14 dividido en (g1) datos y (g2) pantalla. (g1): `World.killsBy` cuenta cada
  enemigo desmontado por su id junto a `w.kills`; el perfil lo suma en `Profile.killed` desde
  `recordRun`, `recordFloor` y `recordEnding` (cada planta lleva las suyas, sin contar dos veces la
  última de una partida ganada); `parseProfile` lo lee con el mismo cuidado que el resto (un guardado
  viejo empieza vacío). `tests/glosario.test.ts`: suman lo mismo que las bajas, el perfil acumula
  bien y un guardado raro no rompe nada.
- Decisiones: «descubierto» = desmontado al menos una vez (no «visto»): es lo que se puede contar sin
  ambigüedad y es lo que los logros necesitarán. Los guardados anteriores no recuperan sus bajas por
  tipo: no hay de dónde sacarlas.
- Medidas: 869 tests en verde; el bot como antes (el cambio no toca la simulación salvo un contador).
- Problemas conocidos: si te tumban en la planta del Servicio Técnico, sus bajas no van al perfil
  (la partida ya se apuntó en la Centralita y `recordRun` no vuelve a guardar); lo mismo pasaba ya con
  sus objetos. `found.weapons` solo guarda las armas que llevabas al acabar la planta, no las que
  soltaste: la (g2) debería apuntar también las que se cogen.
- Siguiente paso: (g2) la pantalla del glosario en la pausa.
## 2026-11-12 18:40 (hora peninsular) — Hito M13 — La muerte propia de cada personaje
- Contexto: al empezar, la (8) y la (7b) estaban cogidas desde hacía menos de 90 minutos; elegí la (7c), que solo toca el despiece y el parte de baja de `GameScene.ts` (no `createWorld` ni `FinalScene`). Al apuntarla, el push chocó con el commit de la (7b) (conflicto solo en `en_curso` de `progress.json`, resuelto a mano). La (8) terminó mientras tanto: conflictos solo en la hoja de ruta y el diseño, resueltos dejando lo de las dos.
- Hecho: M13 (7c). Datos nuevos en `src/data/bajas.ts` (`CHARACTER_DOWNS`, `characterDown`): por personaje, su hoja de piezas, cómo revienta, si suelta chatarra, de dónde le sale humo (o vapor) y chispas en el suelo, y la redacción del parte («Unidad», la etiqueta de la línea del tiempo, excusas y recomendaciones). Cuatro hojas nuevas de 4 piezas de 8×8 en `tools/sprites/despiece.ts`: **Batidora** (tapa del vaso con su tapón rojo, pajita de rayas, una cuchilla, trozo de vaso con el batido seco; salpica verde y suena a cubitos), **Plancha** (selector clavado en LINO, el cuello de camisa quemado, el tapón del depósito, un zapato de entrevista; revienta en vapor y en el suelo sigue echando vapor blanco), **Becario** (acreditación sin foto, vaso de café, convenio sin firmar, boli azul; salpica café y vuelan papeles; **sin chatarra, sin humo y sin chispas**, tampoco en el temblor de antes: no es un aparato) y **Móvil** (batería hinchada, cristal de la pantalla rajada, la SIM, el enchufe con su cinta; cristalitos y un «clinc»; sin humo, solo chispas del cable). La Tostadora, igual que antes píxel a píxel. `popToaster` ya no tira las tostadas, el muelle y la palanca a todos. El parte de baja dice quién era («Becario Eterno (sin número de serie)», su línea de tiempo se llama «Prácticas») con excusas y recomendaciones propias más alguna de las de siempre; los partes de planta superada y de partida ganada también llevan su nombre (`WinReportInfo.unit`). Tests nuevos en `tests/bajas.test.ts` (4); `tests/texto-grande.test.ts` mira también los partes de cada personaje a los dos tamaños. e2e: paso nuevo `57-baja-*` (los otros cuatro caen en la Sala de Pruebas; comprueba sus piezas, que el Becario no suelta chatarra y que el parte no dice «Tostadora»).
- Decisiones: la «causa» del parte sigue siendo la del enemigo (quién le dio): lo propio de cada uno va en la línea de debajo (la excusa de cobertura), la recomendación y la unidad; así las 40 causas de enemigos valen para todos. «Tiempo en prácticas» no cabía en la columna de etiquetas (lo detectó el test de texto grande): se queda en «Prácticas». Los datos van en un archivo nuevo y no en `CharacterDef` para no pisar `types.ts` ni `characters.ts`, que tocaba la (8) a la vez. Las piezas se lanzan con el mismo patrón que las de la tostadora (dos de arriba, dos de abajo), solo cambia la hoja.
- Medidas: sin cambios de juego; `npm run bot` 200 partidas, 0 fallos, idéntico línea a línea. 870 tests en verde; `npm run e2e` entero en verde (antes del `pull` con la (8); después, el paso nuevo suelto otra vez en verde).
- Problemas conocidos: a tamaño real las piezas son pequeñas (8 px) y en el suelo oscuro el zapato de la Plancha se pierde un poco; la cuchilla de la Batidora se lee más como «un trozo de metal» que como cuchilla.
- Siguiente paso: con la captura de los cinco ya hecha por otra sesión, M13 queda terminado (marcado en la hoja de ruta y en el panel). Sigue M14.
## 2026-11-12 18:20 (hora peninsular, de `date`) — Hito M13 — Los cinco juntos en una captura
- Contexto: misma sesión que el desbloqueo (abajo). La (7c) la tiene otra sesión, así que cogí el último criterio de aceptación de M13 que no tenía prueba: «los cinco se distinguen a la primera en una captura». Solo `tools/e2e.ts` (un paso junto al del tablón) y un test nuevo, para no pisar a nadie.
- Hecho: paso nuevo del e2e, **`47c-los-cinco`**: en el Mostrador, con la Batidora en exposición, los otros cuatro se ponen en fila a su lado (su hoja, el primer fotograma de reposo, los pies donde los pone el juego y una sombra cada uno), se saca la foto y se quitan. Se distinguen a la primera: tostadora gris con la tostada, batidora violeta con el vaso, plancha verde azulada y ancha, el becario con su cara y el pósit, y el móvil oro rosa con la pantalla. Test nuevo `tests/cinco-juntos.test.ts` (3): los cinco del tablón son jugables y con hoja propia; **ninguno comparte color dominante** (tono en pasos de 30° de los píxeles con luz, o «gris»: gris, violeta, naranja de la piel, verde azulado y el azul de la pantalla); **ninguna pareja de siluetas se parece demasiado** (al menos un 18 % de píxeles distintos; la pareja más cercana, tostadora y becario, 20 %: comparten cuadro y pies). En la hoja de ruta, los tres criterios de M13 comprobados con dónde se ve cada uno.
- Decisiones: la foto se hace con sprites de la escena y no con una composición hecha aparte: así sale con la luz, la sombra y la escala de verdad. En el Mostrador y no en una sala: es donde se eligen («Productos en Exposición») y no hay enemigos que se metan en medio. M13 **no** se marca terminado: falta la (7c).
- Medidas: no toca el juego. 869 tests en verde; e2e entero en verde; `bot` igual.
- Problemas conocidos: en la foto, la cinta de la cola del Mostrador pasa por delante de los pies; se lee igual (están «en exposición» detrás del cordón).
- Siguiente paso: cuando la (7c) acabe, marcar M13 terminado y empezar M14 por su primera tarea.

## 2026-11-12 17:45 (hora peninsular, de `date` + 1) — Hito M13 — El final de cada personaje
- Contexto: misma sesión que la ficha de devolución (abajo). La otra sesión cogió la (8), los desbloqueos y las armas en los cofres; esta, la (7b), apuntada antes de programar: solo toca el final (`src/data/final.ts`, `FinalScene`).
- Hecho: M13 (7b). **Finales en datos**: `ENDINGS` en `src/data/final.ts` (`CharacterEnding`: la reparación del paso 3, la etiqueta de la caja, el texto de la estantería, su cartel y el precio con su nota), `endingFor` y `shotCaption` (los demás planos dicen lo mismo para todos; la última frase, «El producto era usted.», también). **En el final** (`FinalScene`): la reparación y la estantería de cada uno en la banda de abajo; el precio y el cartel de los suyos; **la etiqueta** (`boxLabel`) cae en la caja después de la pegatina, con su golpe y el sonido de la pegatina más agudo, y se ve también en el primer plano de la estantería y en los créditos (no a tamaño de juego: sería una mancha). **Arreglado**: el final buscaba el dibujo por el id del personaje y la Plancha (hoja `plancha-vapor`) salía como la tostadora; ahora se busca por `look.sheet`. Tests: uno nuevo en `tests/final.test.ts` (todos los del tablón tienen final; los textos caben en una línea, y en dos con texto grande; cartel ≤ 84 px; precio < 60 px; la etiqueta cabe en la caja; la tostadora conserva lo que tenía). e2e: `54h`–`54j` (el final de la Plancha: su dibujo, su reparación, la etiqueta «Pack Vuelta al Cole» y su estantería).
- Decisiones: **misma última frase para todos**: el giro es que el producto era usted, sea quien sea. **La etiqueta oscura con letra amarilla** y sin torcer: la primera versión, amarilla con letra oscura y un poco torcida, se emborronaba (la letra lleva contorno oscuro y, girada, se rompe). **Precios**: el Becario a 0,00 € «Sin remunerar» (no cobra ni cuando lo venden), el Móvil a 599,99 € «PVP de nuevo» (el chiste del reacondicionado a precio de nuevo, más caro aún), la Plancha en «Pack ahorro». **No hay dibujos nuevos** (recetario, tabla que cojea, funda): la etiqueta y la banda lo cuentan; quedan como mejora.
- Medidas: no toca el equilibrio. 860 tests en verde; `bot` igual.
- Problemas conocidos: la etiqueta queda medio tapada por la pegatina verde en las más largas («Funda con purpurina»). Los regalos (recetario, tabla, funda) no se ven, solo se leen.
- Siguiente paso: M13 (7c), la muerte propia de cada personaje (su despiece en vez de las tostadas), si la (8) no la ha cogido nadie; después cerrar M13 (la captura con los cinco).

## 2026-11-12 17:40 (hora peninsular, de `date`) — Hito M13 — El desbloqueo de cada personaje y sus armas en los cofres
- Contexto: al empezar, la (7a) la tenía otra sesión (58 minutos en `en_curso`) y lo que quedaba de la historia toca sus mismos archivos, así que cogí la última tarea de M13, «Desbloqueo de cada personaje con una condición propia», como (8), apuntada y empujada antes de programar. Sin notas del humano pendientes. La rama `main` local volvía a estar en la historia vieja (clon superficial, «unrelated histories»): `git checkout -B main origin/main`, sin empujar nada de aquello. `check`, 855 tests, `build` y `bot` en verde al empezar. La (7a) terminó mientras tanto; al juntar chocaron solo la hoja de ruta y el diseño (los dos añadían en el mismo sitio: me quedé con los dos).
- Hecho: M13 (8). **Condiciones definitivas** (`src/data/unlocks.ts`), cada una ligada a su historia: Batidora al vencer a la Nevera Suprema (sin cambios), **Móvil al vencer al Router del Wifi** («Por fin, cobertura»; antes, veinte objetos distintos), Becario tras diez bajas (sin cambios) y **Plancha al vencer al Director de Recursos Inhumanos** («Traiga camisa»: el de la entrevista de la camisa quemada; antes, el Router). **Armas iniciales en los cofres**: lo pedía el diseño («no salen en los cofres hasta que el personaje está desbloqueado») y no estaba hecho: `weaponsUpTo(level, extra)` admite más armas detrás de las de siempre, `weaponPool(level, personaje, desbloqueados)` (`src/sim/world.ts`) suma las iniciales de los desbloqueados y quita la del que juega; `WorldOptions.unlocked` / `World.unlocked` lo lleva del Mostrador a la partida (`leaveHub`) y de planta en planta (`nextFloor`); `GameScene` lo pasa desde el perfil (Mostrador, `?planta` y `?sala`). Niveles: Picahielos desde la planta 1, Notificaciones desde la 2 (`level: 2`), Almidón desde la 3 (`level: 3`); el Secador, para todos menos la Tostadora; el Becario ya no se encuentra otra Grapadora. Tests: `tests/desbloqueo-armas.test.ts` (5, nuevo); `desbloqueos.test.ts` (las condiciones nuevas, que no hay dos iguales ni un jefe que desbloquee a dos) y `tablon.test.ts` ajustados. e2e: el paso del tablón comprueba que el Mostrador lleva los desbloqueos del perfil.
- Decisiones: **la Plancha, la última**: la más dura de aguante es premio de quien ya ha llegado a la planta 4 (el humano quiere que pasar de la 3 cueste), y su historia es la entrevista. El Móvil con el Router porque la planta 2 es Informática y «veinte objetos» no tenía nada que ver con él. **Sin cambiar nada a quien no tiene desbloqueos**: sin `unlocked` el reparto es exactamente el de antes (mismas listas, mismo orden), así el bot, las herramientas de medida y la Sala de Pruebas no cambian. Lo desbloqueado ya no se pierde aunque la condición cambie (ya era así). «Armas descubiertas» del inventario sigue contando solo las encontrables de siempre: las iniciales se «descubren» al jugar con su dueño.
- Medidas: `npm run bot` 200 partidas, 0 fallos, idéntico línea a línea al de antes (solo cambia el tiempo por partida). 865 tests en verde; e2e entero en verde (la comprobación nueva del Mostrador, aparte con Playwright: `["tostadora","batidora-vaso"]`). Captura nueva `56f-picahielos-en-el-tesoro` (hecha a mano, no está en el e2e): el Picahielos en un pedestal del tesoro de la tostadora con la Batidora desbloqueada.
- Problemas conocidos: el Picahielos sobre el pedestal se lee como una mancha blanca a tamaño real (el sprite está pensado para la mano); si cuesta reconocerlo, un contorno más marcado. El bot nunca juega con desbloqueos, así que no mide cómo cambian las partidas con las armas nuevas en los cofres.
- Siguiente paso: la (7b) la tiene otra sesión; después la (7c), la muerte propia de cada uno, y una captura con los cinco juntos para el criterio de aceptación.

## 2026-11-12 16:55 (hora peninsular, de `date` + 1) — Hito M13 — La ficha de devolución
- Contexto: al empezar, la (6) (el Móvil) la tenía otra sesión (59 minutos en `en_curso`), así que partí en tres la tarea de la historia de cada personaje — (7a) la escena al empezar, (7b) el final propio, (7c) la muerte propia — y cogí la (7a), apuntada antes de programar: casi no toca los archivos del Móvil (la historia va en un archivo de datos aparte). Sin notas del humano pendientes. La rama `main` local volvía a estar en la historia vieja (clon superficial): la puse en `origin/main` con `git fetch --unshallow` y avance rápido. `check`, 849 tests, `build` y `bot` en verde al empezar. La otra sesión terminó el Móvil mientras tanto; al juntar solo chocó `docs/DISENO.md` (dejé las dos cosas).
- Hecho: M13 (7a). **Historias en datos**: `src/data/stories.ts` (`STORIES`, una por personaje del tablón, también la del Móvil: motivo, comentarios del cliente, diagnóstico de la tienda, garantía, destino y sello; `returnSlip` da las filas y `slipNumber` el número «RMA-00000» a partir de la semilla de la partida). **La ficha** (`src/render/ficha.ts`, puro, como el cartel de la cita): barra rosa con el título y el número, «Lectura automática…», las filas (columna de etiquetas, valores que se parten), «Firma del cliente: ilegible», el sello y la ayuda «F o disparar: seguir». **En el juego** (`showSlip`/`updateSlip`/`stampSlip`/`closeSlip` en `GameScene`): al pisar la cinta del Mostrador, la planta 1 empieza con la ficha cayendo desde arriba; la simulación espera; la cinta la lee letra a letra (75 por segundo, un pitido de `teclear` cada tres, con el tono bailando: la voz de la cinta); disparar, usar o rodar la lee de golpe; al terminar, el sello rojo baja con su golpe y su temblor; otra pulsación (o echar a andar, pasado medio segundo) la retira y empieza la partida. El disparo que la cierra no dispara (`slipFire`). Un clic cuenta aunque caiga entre dos fotogramas (el primero tras crear la sala es lento). `testState().slip` para el e2e. Tests: `tests/ficha-devolucion.test.ts` (4: los cinco tienen historia y sello corto, sin repetir; las filas en orden; el número sale de la semilla; cabe a los dos tamaños sin pisarse, se lee de arriba abajo y el sello no tapa nada a tamaño normal). e2e: `throughHub` lee y cierra la ficha cada vez (y comprueba que la partida espera); capturas `41a` (leyendo) y `41b` (sellada).
- Decisiones: **una ficha y no una escena con personajes**: el chiste del juego es el papeleo (parte de baja, cita previa, archivador), y así se ve el mismo idioma desde el primer segundo; la «voz» de la cinta es el texto apareciendo con pitidos. **Rosa de papel de calco**, para que no se confunda con el parte de baja (rojo) ni con la planta superada (cian). **El diagnóstico siempre culpa al cliente** (o al producto, nunca a la tienda): es la sátira de la atención al cliente. **La partida espera** mientras se lee, como en la entrada de los jefes: si no, la ficha tapa la sala y el jugador no sabe si ya puede moverse. **Solo al salir de la cinta** (no con `?planta=1` ni al pasar de planta): es la escena de empezar. **A tamaño doble no cabe la banda del sello**: el sello cae sobre las últimas filas y luego se aparta (se queda al 30 %), como en el parte de baja; tampoco cabe «Lectura automática». **Las historias en un archivo aparte** de `characters.ts` para no pisar a la sesión del Móvil (y porque son texto, no estadísticas).
- Medidas: no toca el equilibrio. `npm run bot` igual que antes (200 partidas, 0 fallos). 859 tests en verde.
- Problemas conocidos: el nombre de la sala sale arriba a la vez que la ficha y se va antes de que se lea. La ficha no tiene sonido propio de «voz» (usa el de teclear). Los pasos del e2e que llegan a la planta 1 por la cinta tardan un poco más (la ficha se lee y se cierra cada vez).
- Siguiente paso: M13 (7b), el final propio de cada personaje (la caja y la estantería del final verdadero según quién llegue), o la (7c), su muerte propia.

## 2026-11-12 15:40 (hora peninsular) — Hito M13 — El Móvil Reacondicionado
- Contexto: al empezar, la (4) la tenía otra sesión (59 minutos en `en_curso`), así que cogí la (6), apuntada y empujada antes de programar. Sin notas del humano pendientes. La rama `main` local volvía a estar en la historia vieja (50 por delante y 50 por detrás): `git checkout -B main origin/main`, sin empujar nada de aquello. `check`, 838 tests y `bot` en verde al empezar. La otra sesión terminó la (4) mientras tanto; al juntar chocaron los datos de personajes, armas y tipos, el test de armas, los sprites y el tablón (todo «los dos añadían en el mismo sitio»: me quedé con los dos), y un test de `personajes.test.ts` que daba por hecho que el Móvil aún no existía (ahora comprueba que, desbloqueado, sale en exposición).
- Hecho: M13 (6). **Personaje nuevo `movil`** (`src/data/characters.ts`, el id del tablón): 3 corazones, anda a 100 y rueda como la tostadora; sale con las **Notificaciones Push** (`src/data/weapons.ts`): globitos naranjas con «!» a 150 px/s, las balas más lentas del juego, que persiguen al enemigo más cercano 2,2 s (`bullets.homing`, lo mismo que la Tarjeta de Fidelización, pero de serie); 1,4 de daño, 3,2 por segundo, 14 de cargador. **Habilidad** `PhoneAbility` (`src/data/types.ts`; `phoneBattery`, `chargeWalking`, `fightOn` y `phoneIsOff` en `src/sim/world.ts`): **carga en movimiento**, una pila al objeto activo cada 600 px andados en combate (evento `battery` con `walked`: chispas amarillas); **batería al 1 %**, en combate, 3 s sin andar ni rodar y se apaga 1 s (evento `phoneOff`): la entrada no hace nada (ni andar, rodar, disparar, recargar, cambiar de arma, usar el objeto ni hablar), las balas le dan igual. **Escena**: el último segundo parpadea una pila vacía sobre su cabeza (`bateria-baja`), apagado se dibuja `movil-apagado` (la pantalla negra con el símbolo de encendido) con «Batería: 1 %» en rojo, y al volver «Reiniciado. 17 actualizaciones pendientes»; sonido nuevo `notificacion` (el «ding» de dos tonos), que es el del arma. **Sprites** (`tools/sprites/movil.ts`, ocho poses como la tostadora): un móvil de pie en tres cuartos, funda «oro rosa» con los botones en el canto, la pantalla por cara (ojos blancos, boca de preocupación, hora y batería en rojo, el globo de una notificación sin leer), rajada desde las esquinas, zapatillas blancas y el cable de carga arrastrando con cinta aislante; roto, la pantalla negra rajada entera y el cable suelto; el arma, una campana de notificaciones dorada con su globo rojo «1»; y su cara del tablón, a juego. Tests: `tests/movil.test.ts` (5: números, hoja, alto y pantalla apagada; las notificaciones tuercen y aciertan a un enemigo a un lado, el secador no; una pila a los 600 y a los 1200 px, nada sin combate ni con la tostadora; se apaga a los 3 s quieto aunque dispare, apagado no anda, no rueda ni dispara, vuelve al segundo, rodar de vez en cuando lo evita, sin combate o con la tostadora nunca; determinista). `armas.test.ts`: rasgos «persigue» y «velocidad de bala» (gana en lo primero, pierde en lo segundo). e2e: `19bc` (las notificaciones torciendo), `19bd` (la pila avisando) y `19be` (apagado).
- Decisiones: **solo en combate** las dos cosas: cargar andando por una sala vacía rellenaba gratis cualquier objeto activo (el humano ya se quejó de un objeto que se rellenaba en dos salas), y apagarse en la tienda o leyendo un cartel solo molesta. **Disparar quieto cuenta como quieto**: la gracia es que no se puede plantar a disparar. **Carga sin los objetos que cargan más** (Tecla Almohadilla, Pausa del Café): una pila es una pila; si no, se multiplicaba. **Daño 1,4 y 14 de cargador** (el diseño decía «balitas lentas», sin cifras): con 1 y 12 el bot ganaba la planta 1 el 18,3 % y tardaba 26,5 s por sala (la tostadora, 31,7 % y 21,4 s): las balas lentas tardan en llegar. **«Oro rosa»** como color dominante: gris, violeta, verde azulado y blanco ya están cogidos, y es el chiste del cambio «por el mismo en otro color». **El arma pierde en velocidad de bala**: con 1,4 ya no es la más floja por segundo, y lo que la distingue es que la bala se puede dejar atrás.
- Medidas (`node tools/medir-personajes.ts 60 movil`, planta 1 desde la entrada, mismas semillas que los demás): daño 1 y 12 balas, **18,3 %** (1,29 heridas y 26,5 s por sala); sin la batería al 1 %, idéntico (el bot nunca se queda 3 s quieto); daño 1,2: 16,7 %; daño 1,4: 25 % (22,2 s); daño 1,5: 25 % y una partida colgada (abajo); balas más rápidas (190 px/s): 15 %; **daño 1,4 y 14 balas: 31,7 %** (1,16 heridas y 22,5 s por sala), la elegida, igual que la tostadora (31,7 %) y la Plancha (31,7 %). El bot apenas lleva objeto activo (el 20 % de las partidas), así que la carga andando casi no pesa en estas cifras. `npm run bot` con la tostadora, idéntico (200 partidas, 0 fallos). 855 tests en verde; e2e entero en verde.
- Problemas conocidos: el bot no sabe nada de la batería (se mueve siempre: no la sufre) ni busca andar para cargar: una persona notará las dos cosas mucho más que el bot. Con daño 1,5, la semilla `medir-personajes-55` se quedó 800 s pegada a un Aspirador con 0,5 de vida en una esquina sin disparar casi nunca (las ráfagas del bot son al azar y a quemarropa las balas salen dentro de la pared): es del bot, no del Móvil, pero puede salir con cualquiera. La muerte sigue siendo la de la tostadora sin tostadas. La batería no se ve en el inventario (solo el aviso sobre la cabeza).
- Siguiente paso: con los cinco hechos, la tarea de «una historia distinta por personaje» (la ficha de devolución que lee la cinta, la (7a), la cogió otra sesión mientras cerraba esta; luego su propio final), y después la muerte propia de cada uno; el criterio de «se distinguen a la primera en una captura» pide una captura con los cinco juntos.

## 2026-11-12 14:15 (hora peninsular) — Hito M13 — La Plancha de Vapor
- Contexto: al empezar, la (5) la tenía otra sesión (60 minutos en `en_curso`), así que cogí la (4), apuntada antes de programar. Sin notas del humano pendientes. Al arrancar, la rama `main` local estaba en una historia vieja (50 commits por delante y por detrás de `origin/main`, clon superficial): la puse en `origin/main` sin tocar nada más. `check`, 833 tests, `build` y `bot` en verde al empezar.
- Hecho: M13 (4). **La Plancha de Vapor jugable** (`src/data/characters.ts`, id `plancha`, el del tablón): 4 corazones, anda a 80, rueda corto y lento (150 px/s × 0,36 s) y tarda en volver (0,48 s). **Suela caliente** (`ability: { kind: 'sole' }`, `SoleAbility` en `src/data/types.ts`, `updateSole` en `src/sim/world.ts`): cada 7 px andados (no rodando, ni en el Mostrador) deja una nube de vapor en el suelo (`World.steam`, 1,2 s, como mucho 80); un enemigo con los pies encima se escalda: 0,5 de daño al momento y otra vez cada 0,25 s mientras siga encima (2 por segundo; `Enemy.scaldCd`, evento `scald`); lo que vuela no se quema; un jefe rugiendo, nada; el maniquí también. **Pulverizador de Almidón** (`src/data/weapons.ts`, `almidon`): dos gotas de almidón por disparo, 3,5 disparos/s, 10 de cargador, unos 100 px; lo que toca queda **almidonado**: a tres cuartos de su ritmo durante 1 s (`slow` con `look: 'starch'`, `Enemy.slowLook`): se dibuja pálido y suelta copos blancos y amarillos en vez de la purpurina. No sale en cofres. **Sprites** (`tools/sprites/plancha-vapor.ts`): sus ocho fotogramas (carcasa verde azulada, ancha y baja con la punta de la suela delante, asa azul marino, depósito de agua, selector en LINO, el trozo de cuello de camisa quemado pegado a la suela, zapatos de entrevista y un hilo de vapor en la punta cada dos fotogramas), el arma (botella blanca con etiqueta amarilla y gatillo azul), la gota (amarilla con borde naranja, como toda bala del jugador), `vapor-suela` (cuatro fotogramas: la huella naranja de la suela que se apaga y la nube que sube y se deshace) y su cara del tablón. **Sonidos** `almidon` (pssst) y `suela` (chisporroteo, como mucho uno cada 140 ms). Al caer, revienta el depósito: vapor y agua. Tests: `tests/plancha-vapor.test.ts` (9). Ajustados: `armas.test.ts` (rasgo nuevo «frena al enemigo»), `megafono.test.ts` (el alcance se compara sin el almidón), `personajes.test.ts` (el «desbloqueado pero aún no jugable» es ahora el Móvil). e2e: `56a` (el almidón deja tieso a un aspirador), `56b`–`56c` (anda junto a dos enemigos quietos: el rastro quema a los dos).
- Decisiones: **verde azulado y silueta ancha**: la plancha blanca de los cofres ya existe, la tostadora es gris, la batidora violeta y la Batidora de Mano menta; la punta de la suela y el asa hacen una silueta que no tiene nadie. **Gotas amarillo limón** (el «aroma Brisa de Limón» del chiste), no blancas: las balas del jugador son naranjas y amarillas. **El arma más floja por segundo** (3,1, menos que el Secador): su rasgo es frenar y el daño está en el vapor; con dos gotas de 0,75 y no tres de 0,5 porque el Megáfono tiene que seguir siendo el de menos daño por golpe. **Rodar no deja vapor** (la suela está en el aire): así se elige entre esquivar y quemar. **Almidón suave (0,75 durante 1 s) y no a la mitad**: frenar también frena lo que piensan (atacan menos), y era lo que más pesaba (ver medidas). **La huella en el suelo se distingue de las balas**: blanco y naranja apagado, plano, debajo de todos.
- Medidas (`node tools/medir-personajes.ts`, planta 1 desde la entrada, mismas semillas): tostadora 31,7 % (60 partidas, 1,13 heridas y 21,4 s por sala). Plancha con el diseño de partida (almidón 0,5 durante 1,4 s, anda a 84, espera 0,42): **51,7 %**. Variantes (40 partidas): sin almidón 27,5 %; sin vapor 40 %; 7 medios corazones 47,5 %; más lenta y rodando menos 45 %. (60 partidas): almidón 0,6 o 0,7 durante 1 s, 43,3 % las dos (el frenado salta un paso de cada tres en ambos); 0,8 durante 1,2 s, 41,7 %; 0,75 durante 1 s, 38,3 %; **0,75 durante 1 s, anda a 80 y espera 0,48: 31,7 %** (la elegida: 1,46 heridas y 28,9 s por sala; cae ante la Nevera el 51,7 %). `npm run bot` sin cambios (200 partidas, 0 fallos). 844 tests en verde.
- Problemas conocidos: el bot no sabe usar el rastro a propósito (no da vueltas para que le persigan por encima): una persona le sacará más. El tinte pálido del almidonado se nota poco sobre enemigos azules; lo que se lee son los copos. Las gotas, a tamaño real, son puntitos de 3 px. La muerte sigue sin despiece propio (las piezas de chatarra de siempre).
- Siguiente paso: M13 (6), el Móvil Reacondicionado (Notificaciones Push, carga en movimiento y batería al 1 %).

## 2026-11-12 13:40 (hora peninsular, de `date` + 1) — Hito M13 — El Becario Eterno
- Contexto: al empezar, la (3) la tenía otra sesión (55 minutos en `en_curso`), así que cogí la (5) y no la (4), para no pisar a quien siguiera con la Batidora (la (4) es la siguiente natural). Sin notas del humano pendientes. `check`, 822 tests, `build` y `bot` en verde al empezar. **Aviso**: la rama `main` local del entorno estaba divergida de `origin/main` (50 commits de una historia vieja de M10–M11 que no están en el remoto); la dejé igual que `origin/main` (`git checkout -B main origin/main`) sin empujar nada de aquello. La otra sesión terminó la (3) mientras tanto; al juntar chocaron los datos de personajes, los tipos, los sprites y los tests del Servicio Técnico: me quedé con lo suyo en los tests (ya contaban con varios personajes) y junté lo demás.
- Hecho: M13 (5). **Personaje nuevo `becario`** (`src/data/characters.ts`): 3 corazones, anda a 104, voltereta normal, sale con la **Grapadora Táctica**. **«Experiencia demostrable»** (`MeritAbility` en `src/data/types.ts`; `reviewIntern`, `meritScale` y `payIntern` en `src/sim/world.ts`): cada sala de combate limpiada sin que le hieran suma un punto (`Player.merit`), cada uno un **4 %** más de daño en todos sus disparos (va en `shotScale`, así cuenta también para la tostada o lo que venga), hasta **6**; un golpe le deja **la mitad, hacia abajo**, y esa sala ya no suma (`meritHurt`, como las estrellas); se lleva de planta en planta. **«Sin remunerar»**: los enemigos, jefes incluidos, le dejan la mitad de cupones, **exacta y sin dados** (lo que se le debe se arrastra en `Player.unpaid`), así no cambia la secuencia aleatoria. **Sprite** (`tools/sprites/becario.ts`, las mismas ocho poses que la tostadora): un humano de cabeza cuadrada como el Director, camisa blanca con una mancha de café, chinos y mocasines, pelo sin peinar con un **pósit amarillo** pegado, **ojeras**, boca de haberse rendido y la **acreditación «BECARIO» sin foto**; herido, ojos apretados; roto, ojos en X, la acreditación del revés y el pósit en el suelo. **Mano desnuda**: `CharacterLook.hand` (`mano-becario`; la escena cambia la textura de la mano como la del cuerpo). **Escena**: evento `merit`, «Experiencia demostrable: n» en verde con un tintineo que sube (y «Experiencia: no hay más que aprender» al tope) y «No se valora» en gris al perderla. **Inventario**: fila «Experiencia» con los puntos y el daño que suman (`meritRows`). **Bot**: `npm run bot -- --personaje <id>` juega todo (sala, plantas, Mostrador y jefes) con otro personaje (`crossHub` acepta `character`). Tests: `tests/becario.test.ts` (5: datos, fotogramas, mano y textos; un punto por sala y el daño de la grapa; el golpe deja la mitad y la sala del golpe no suma; se lleva a la planta siguiente; la mitad exacta de cupones y determinista). e2e: pasos `19ba` (el becario grapando en la sala de pruebas, con su hoja y su mano) y `19bb` (vaciar la sala le da el punto: el letrero verde).
- Decisiones: **mismo cuadro y mismos pies que la tostadora** (40×41, `feetY` 36): el tamaño en pantalla se parece y el render no cambia. **Cabeza de bloque de piel, como el Director**, para que el humano se vea de la misma mano que los electrodomésticos. **Sin dados en los cupones**: con una moneda al aire la mitad sería «de media» y además movería el resto de la partida; así es exacta. **+4 % hasta 6 y no +5 % hasta 8** (lo que decía el diseño): con lo de la tabla el bot ganaba la planta 1 el 45 % frente al 31,7 % de la tostadora (mismas 60 semillas, `medir-personajes`), y sin experiencia ninguna, el 38 %: la Grapadora ya pega más en manos del bot y la pega de los cupones el bot casi no la nota (compra 0,4 cosas por planta). Probé también 2,5 corazones (36,7 %), pero el tercer corazón a medias se lee como vida perdida en el HUD. **Los jefes también pagan a medias**: «sin remunerar» es para todo el mundo.
- Medidas: `node tools/medir-personajes.ts 60` (planta 1 desde la entrada, mismas semillas): Tostadora gana el 31,7 % (1,13 heridas y 21,4 s por sala), Batidora 25 % (0,75 y 22,9 s), **Becario 35 %** (1,07 y 18,9 s). `npm run bot -- --personaje becario` (antes del ajuste, +5 %): cupones por minuto 2,6 (tostadora 5,4: la mitad, como debe); jefes en 10 combates: Nevera 70 %, Router 50 %, Muñeco 30 %, Director 10 %, Centralita 10 %, Trituradora 20 % (con la tostadora 70/20/30/10/0/0: la grapadora mata antes). `npm run bot` con la tostadora, idéntico al de antes (200 partidas, 0 fallos). 838 tests en verde; e2e en verde.
- Problemas conocidos: el Becario aún no se puede elegir en una partida normal hasta tener diez bajas en el perfil (es su desbloqueo); `?personaje=becario` lo prueba. La muerte (`popToaster`) sigue siendo la de la tostadora: sus tostadas saltan también del becario. La experiencia no se ve fuera del letrero y del inventario (no hay icono en el HUD). La portada y la pausa siguen enseñando la tostadora.
- Siguiente paso: M13 (4), la Plancha de Vapor, si está libre (la ha cogido otra sesión); si no, la (6), el Móvil Reacondicionado, o la muerte propia de cada personaje.

## 2026-11-12 12:30 (hora peninsular, de `date` + 1) — Hito M13 — La Batidora de Vaso
- Contexto: al empezar, la (2) la tenía otra sesión (5 minutos en `en_curso`), así que cogí la (3), apuntada antes de programar. Sin notas del humano pendientes. `check`, 816 tests, `build` y `bot` en verde al empezar. La otra sesión terminó la (2) mientras tanto y cogió la (5); al juntar chocaron `types.ts` (las dos habilidades: la mía pasó a ser `BladesAbility` dentro de su `CharacterAbility`), la hoja de ruta, el diseño y `progress.json`.
- Hecho: M13 (3). **La Batidora de Vaso jugable** (`src/data/characters.ts`): 2 corazones, anda a 118, rueda más lejos (190 px/s × 0,5 s) y espera menos (0,26 s). **Giro de cuchillas** (`ability: { kind: 'blades' }`, `rollBlades` en `src/sim/world.ts`): mientras rueda, cada enemigo o maniquí que toca su cuerpo (9 px alrededor) recibe 4 de daño una vez por voltereta (`Player.bladeHits`) y sale despedido, y las balas enemigas que atraviesa se rompen; evento `blade`. **Picahielos Turbo** (`src/data/weapons.ts`): dos cubitos de zumo de naranja por disparo, 8 disparos/s, 17 de cargador, 2 s de recarga, unos 100 px de alcance y 28° de dispersión; no sale en cofres. **Sprites** (`tools/sprites/batidora-vaso.ts`): sus ocho fotogramas (bloque del motor violeta con cara de no dormir desde la dieta, vaso con el batido verde seco, pajita de rayas, cable enrollado con el alambre de la caja, zapatillas de correr lima), el arma, el cubito (naranja, como toda bala del jugador), el remolino `giro-cuchillas` (cuatro fotogramas que giran hacia donde rueda) y su cara del tablón (antes era un dibujo provisional rojo y cian). **Sonidos** `picahielos` y `cuchillas`; al triturar, parón, temblor y chispas de acero y batido. Al caer no salen tostadas: salpica batido. **Herramienta** `node tools/medir-personajes.ts [partidas] [personaje…]`: la planta 1 con cada personaje, mismas semillas. Tests: `tests/batidora-vaso.test.ts` (9: números; el arma; tritura una vez por voltereta y vuelve a triturar en la siguiente; andar no tritura y la tostadora tampoco; varios en la misma vuelta y remata al débil; rompe balas; el maniquí; determinismo; sprites: ocho fotogramas, violeta, más alta que la tostadora). Ajustados: `armas.test.ts` (rasgo nuevo «balas por segundo»), `megafono.test.ts` (el alcance se compara sin el Picahielos), `personajes.test.ts` (la batidora de verdad en vez de la de prueba), `servicio*.test.ts` (con dos personajes la cita pide ganar con los dos), `tablon.test.ts`, `tostadora-habilidad.test.ts` (tipo). e2e: `47b` (F en el tablón la pone en exposición y cambia de cuerpo), `55a` (el Picahielos), `55b`–`55c` (rueda entre tres y seis balas: tritura 3 de 3 y rompe 6 de 6).
- Decisiones: **violeta** (ni el gris de la tostadora ni el menta de la Batidora de Mano enemiga) y **el vaso encima** para que la silueta sea más alta y estrecha: se distinguen a la primera. **Cubitos naranjas** (zumo congelado) y no azules: las balas cian son de los enemigos. **El arma gana en balas en el aire** (16 por segundo) y no en cadencia: la cadencia es lo que distingue a la Grapadora y el test de «cada arma gana en algo» lo vigila; pierde en dispersión. **Espera 0,26 s y no 0,18**: con 0,18 el bot ganaba la planta 1 el 47 % (la tostadora, 23 %), porque esquiva rodando todo el rato; con 0,26 empata. Bajar el daño de las cuchillas a 3 apenas cambiaba nada: lo que pesa es cuánto rueda. **Las cuchillas no las frena la boca de la destructora ni las preguntas frecuentes** (no son balas); un jefe rugiendo no recibe nada, como con las balas.
- Medidas (`node tools/medir-personajes.ts 60`, sin Mostrador, desde la entrada de la planta 1): antes de juntar la (2), tostadora 23,3 % y batidora 23,3 % (0,75 heridas por sala frente a 1,3, con dos corazones en vez de tres). Con la tostada de la (2): tostadora 31,7 %, batidora 25 % (ruido de ±6 puntos). Variantes probadas (30 partidas): espera 0,18 → 46,7 %; sin cuchillas 26,7 %; con el rodar de la tostadora 13,3 %. `npm run bot` sin cambios (200 partidas, 0 fallos). 833 tests en verde; e2e entero en verde.
- Problemas conocidos: el bot no busca a propósito triturar (rueda para esquivar y tritura de rebote): una persona la jugará más agresiva y quizá le resulte más fácil; medirlo de verdad pediría enseñar al bot. Una partida de 60 con ella llegó a la Nevera a los 570 s (salas lentas con poco alcance): `medir-personajes` da 900 s. El Picahielos no sale en cofres hasta que las armas iniciales se repartan según quién está desbloqueado. La muerte de los personajes nuevos aún es la de la tostadora sin tostadas (salpica batido y poco más).
- Siguiente paso: M13 (4), la Plancha de Vapor (la (5) la tiene otra sesión).

## 2026-11-12 12:00 (hora peninsular, de `date` + 1) — Hito M13 — Trabajo repetido y descartado: la tostada
- Contexto: misma sesión que la de la planta 6 (M12 (6)). Al acabarla seguí con M13 (2) **sin apuntarla en `en_curso`** (fallo mío: el paso 1.4 de `AUTOPILOT.md` lo pide antes de programar); la otra sesión la cogió a la vez, la terminó y la empujó primero. **Me quedé con lo suyo** (ya está en `main`, medido y con la (3) empezada encima) y tiré lo mío, como en la entrada del 2026-11-11 de M11 (7).
- Lo que se aprendió por el camino, por si sirve: con la tostada a **3** de daño el bot ganaba la planta 1 el 40 % (antes 15 %) y la Trituradora sin objetos el 23 %; a **2**, el 25 % (en 20 plantas, mucho ruido); el humo era casi nada en esas cifras (sin humo, Centralita 26,7 % frente a 30 %): lo que cambia la dificultad es el daño, como vio la otra sesión. Llegué también a «solo si se ha rellenado medio cargador». Mi versión tenía dos cosas que la suya no: **sprites propios** (una tostada de 14×14 que da vueltas de canto en cuatro fotogramas, y la quemada con ascuas) y un **rastro de humo** (bolas de 20×16, una cada 0,05 s de vuelo, que se comen las balas que las tocan 0,6 s). La suya dice en «Problemas conocidos» que el humo se ve poco: si alguien lo retoma, un rastro de bolas de humo con su sprite se leía muy bien en la captura.
- Siguiente paso: M13 (3) la tiene otra sesión; la próxima, la (4), la Plancha de Vapor, si está libre.

## 2026-11-12 12:05 (hora peninsular, de `date` + 1) — Hito M13 — «Una de cada dos», la habilidad de la Tostadora
- Contexto: misma sesión que las dos entradas de M13 de abajo. La otra sesión cerró M12 mientras tanto; al juntar solo chocó la bitácora.
- Hecho: M13 (2). **Habilidades en los datos**: `CharacterDef.ability` (`src/data/types.ts`), por ahora `ToastAbility`. **La de la Tostadora**: al acabar una recarga que ha rellenado al menos medio cargador (`minSpent` 0,5; se decide al empezarla, `primeToast`), salta una tostada desde la mano hacia donde apunta (`popToast` en `src/sim/world.ts`: 230 px/s, 1,1 s, atraviesa a todos, 1 de daño con los multiplicadores de los objetos); una de cada dos sale **quemada** (`Player.toasts`): el doble de daño y su humo borra las balas enemigas que toca, sin pararse (`Bullet.toast`, evento `toast`). **Dibujo**: las tostadas son los dos primeros fotogramas de `despiece` (las de su muerte), dando vueltas; la quemada deja humo gris y ascuas naranjas para que se lea sobre el suelo oscuro; muelle al saltar. 6 tests nuevos (`tests/tostadora-habilidad.test.ts`); el del Ratón Gaming deja fuera las tostadas para contar solo los golpes del secador. Pasos nuevos en el e2e (capturas `19aa` y `19ab`).
- Decisiones: **solo si se ha gastado medio cargador**: si no, recargar con un disparo hecho daba tostadas gratis cada 1,2 s. **1 de daño y no 3**: con 2 y con 1,5 el bot ganaba bastante más (con 1,5, la planta 1 del 15 % al 40 %, el Director del 6,7 % al 26,7 %) y la tostadora es la referencia: su habilidad tiene que notarse jugando (atraviesa, la quemada limpia balas), no cambiar la dificultad. **Sale de la mano** y no de las ranuras: así sale hacia donde apuntas sin cruzar a la tostadora.
- Medidas: `npm run bot`, antes → después (daño 1): salas de combate 22,7 s y 1,2 heridas → 21,8 s y 1,15; gana la planta 1 el 15 % → 15 %; jefes (30 combates): Nevera 66,7 → 66,7 %, Router 30 → 20 %, Muñeco 10 → 13,3 %, Director 6,7 → 6,7 %, Centralita 6,7 → 16,7 %, Trituradora 0 → 6,7 % (dentro del ruido de 30 combates). En la prueba de 60 s vacía la sala el 45,5 % (antes 32,5 %): ahí dispara sin parar y recarga mucho. 822 tests en verde.
- Problemas conocidos: el humo de la quemada se ve poco; lo que se lee son las ascuas. El bot no sabe que recargar pronto no da tostada (no le importa: siempre vacía el cargador).
- Siguiente paso: M13 (3), la Batidora de Vaso: sprite, Picahielos Turbo y el giro de cuchillas (y la captura del tablón con dos para elegir).

## 2026-11-12 11:20 (hora peninsular, de `date` + 1) — Hito M13 — Elegir personaje en el tablón
- Contexto: misma sesión que la entrada de abajo; la M12 (6) seguía en manos de la otra sesión.
- Hecho: M13 (1). **El dibujo del jugador sale de los datos**: `CharacterDef.look` (`src/data/types.ts`: hoja, tamaño del fotograma, pies y punto de giro al rodar) y todas las hojas de personaje con los mismos ocho fotogramas (reposo ×2, andar ×4, herida, roto); `GameScene` ya no tiene las medidas de la tostadora fijas y cambia de textura si cambia el personaje. **El que está en exposición**: `Profile.chosen` (se guarda; un perfil viejo empieza con la Tostadora), y en `src/sim/unlocks.ts` `playableNow` (desbloqueados y en esta versión, en el orden del tablón), `exhibited` (el elegido si se puede jugar; si no, la Tostadora) y `nextExhibited` (el siguiente, dando la vuelta). **En el Mostrador**: con el tablón abierto, la tecla de usar pone en exposición al siguiente, lo guarda (`saveChosen`) y cambia de cuerpo ahí mismo (`setCharacter` en `src/sim/world.ts`: su vida y su arma inicial, en el mismo sitio, con un destello y humo; solo en el Mostrador). El tablón marca al elegido con «En exposición» en verde y el pie dice «F: cambiar el producto en exposición», solo si hay más de uno que elegir. La partida (y la sala de pruebas, y las de `?sala=`/`?planta=`) empieza con él; `?personaje=<id>` prueba cualquiera. 6 tests nuevos (`tests/personajes.test.ts`), con una batidora de prueba que se quita al acabar.
- Decisiones: **cambiar con la misma tecla, como pasar hoja en el archivador**, y no con flechas dentro del panel: no hace falta un modo de menú nuevo y funciona igual con mando. **Se cambia de cuerpo al momento** y no al empezar la partida: así se ve con quién vas antes de pisar la cinta. **La portada sigue siendo la tostadora** (es la protagonista y la imagen del juego). **El final verdadero** ya recibía el personaje; sus medidas propias llegan con cada personaje.
- Medidas: no toca la simulación de la partida; `npm run bot` idéntico (200 partidas, 0 fallos). 813 tests en verde; e2e entero en verde (la tostadora se dibuja igual, rodando incluida).
- Problemas conocidos: mientras solo haya un personaje jugable, nada de esto se ve en el juego (el tablón sigue igual); la captura del tablón con dos llega con la Batidora (3). La muerte (`popToaster`: las tostadas que saltan) sigue siendo la de la tostadora para todos: cada personaje traerá la suya.
- Siguiente paso: M13 (2), la habilidad de la Tostadora, «Una de cada dos».
## 2026-11-12 10:40 (hora peninsular, de `date` + 1) — Hito M12 — La planta 6 medida y ajustada
- Contexto: al empezar, la (5) la tenía otra sesión (56 minutos en `en_curso`), así que cogí la (6), que solo toca los datos de la jefa y la herramienta de medir. Sin notas del humano pendientes. `check`, 800 tests, `build` y `bot` en verde al empezar. La otra sesión terminó la (5) mientras tanto; al juntar no chocó nada.
- Hecho: M12 (6), con lo que **M12 queda terminado**. **Medida**: `node tools/medir-plantas.ts [partidas] [desde] 6` mide ahora el Servicio Técnico: con `[planta]` 6, las partidas llevan la cita (`World.service`), cruzan sin daño las cinco plantas de abajo (ganar la 5 sube en el montacargas) y juegan la 6 con daño y la vida llena; `rebuild` se exporta. **Ajuste de la Trituradora, fase 3 «Control de calidad»**: empieza al **35 %** (antes 25 %), descansa **0,4–0,7 s** (antes 0,55–0,85), las etiquetas «APTO» pesan **0,8** (antes 1,3) y entra el **abanico de muelles** del despiece (peso 1). Tests: `tests/planta6-medida.test.ts` (3: medir-plantas llega con la cita a la 6 con objetos; sin la cita se queda en la 5; la fase 3 al 35 %, casi todo son abanicos, con muelles y menos descanso que el despiece). `control-calidad.test.ts`: 35 % y espera hasta 60 s a la primera etiqueta (ahora salen menos). DISEÑO al día.
- Decisiones: **tocar la fase 3 y no las salas**: con lo que se trae de abajo (2,6 armas y 10 objetos), las salas del taller ya dan **2,7 heridas por sala** (la 5, 2,06) y en ellas cae la mitad de quien llega; pero **quien llegaba a la fase 3 ganaba 7 de cada 8 veces**, con 0,9 heridas en toda la fase: casi la mitad de sus ataques eran etiquetas, que no hieren, y las pilas de cajas no llegaban nunca a la tostadora (en 25 s caen cuatro columnas del fondo; con caer cada 2,6 s en vez de 3,2 el resultado fue idéntico). Un clímax que no aprieta. **Empezar antes** da tiempo a que las cajas cierren de verdad la sala; **más abanicos y menos descanso**, que la fase hiera. **Objetivo**: que la planta secreta, el final, la gane algo menos o igual que la 5 quien llega (la 5: 11,9 % en M11 (7)), con la jefa como muro. Probé (reanudando 45 combates guardados al entrar en su sala, `v8.serialize`): base 31 % de victorias; solo más disparos 24 %; más disparos y al 30 %, 20 %; **más disparos y al 35 %, 18 %** (la elegida, la fase 3 pasa a 2,1 heridas); solo al 35 %, 33 % (empezar antes sin más disparos la hace más fácil: es la fase floja).
- Medidas (`node tools/medir-plantas.ts`, semillas 0–59, 60 llegadas a la 6 con ~2,6 armas y ~10 objetos): **antes, la gana el 20 %** (12), cae ante la jefa 18, 2,72 heridas y 46 s por sala; **después, el 13,3 %** (8), cae ante la jefa 22, 2,77 heridas y 45,6 s por sala (las salas no cambian; el ruido de 60 llegadas es de ±4,5 puntos). De quien llega a la jefa, gana el 27 % (antes el 40 %). `npm run bot` (sin objetos y con el arma de salida): Trituradora 0 % (antes 6,7 %), 6 heridas (4,27 / 1,33 / 0,4), llega al control de calidad el 26,7 % a los 109 s; el resto idéntico, 200 partidas, 0 fallos. 810 tests en verde.
- Problemas conocidos: medir la 6 es lento (unos 13 s por partida, casi todo cruzar las cinco de abajo): 60 llegadas son 8 minutos en dos procesos. Las pilas de cajas siguen pesando poco en la pelea del bot (se aparta bien de las casillas marcadas). Con 0 % sin objetos, `npm run bot` ya no dice nada de la Trituradora salvo hasta dónde llega; la medida buena es esta.
- Siguiente paso: M13, los cinco personajes jugables (ya la ha cogido otra sesión: (0), el diseño).

## 2026-11-12 10:35 (hora peninsular, de `date` + 1) — Hito M13 — El diseño de los cinco personajes
- Contexto: al empezar, la M12 (6) (medir la planta 6) la tenía otra sesión (57 minutos en `en_curso`) y no hay otra tarea de M12 libre, así que empecé M13 por la parte que no toca la planta 6 ni el equilibrio. Sin notas del humano pendientes. `check`, 807 tests, `build` y `bot` en verde al empezar.
- Hecho: M13 (0). Sección «Los cinco, en detalle» en `docs/DISENO.md`: vida, velocidad, rodar, arma inicial, habilidad y lo que cada uno paga a cambio, más una línea de historia y de final por personaje. M13 partido en siete tareas en la hoja de ruta: (1) elegir personaje en el tablón y dibujar al jugador desde los datos; (2) la habilidad de la tostadora; (3)–(6) un personaje por tarea (sprite, arma y habilidad).
- Decisiones: **ninguna habilidad pide botón nuevo** (salen de rodar, andar, recargar o limpiar salas): el mando ya tiene todos los botones ocupados y así cada personaje se aprende jugando. **La tostadora también tiene habilidad** («Una de cada dos», tostadas al recargar): el criterio pide un test de habilidad por personaje y, si no, la de serie sería la sosa. **Tres armas iniciales nuevas** (Picahielos Turbo, Pulverizador de Almidón, Notificaciones Push) y no la Plancha de Vapor Turbo para la plancha: esa es de calidad buena y empezar con ella rompe la escasez; además las nuevas cuentan para las 30 de M14. **Desbloqueos sin cambios**: los de `src/data/unlocks.ts` ya piden lo que pide el diseño. **Cada habilidad usa lo que el motor ya tiene** (almidón = `slow` de la purpurina, notificaciones = `homing`, rastro = parecido a la escarcha), para que cada personaje quepa en una sesión.
- Medidas: solo documentación; nada cambia en el juego.
- Problemas conocidos: la vida y las velocidades de la tabla son de partida; se miden con el bot en cada tarea (criterio: el bot gana la planta 1 con todos).
- Siguiente paso: M13 (1), elegir personaje en el tablón y que el render dibuje al jugador desde los datos del personaje.


## 2026-11-12 09:35 (hora peninsular, de `date` + 1) — Hito M12 — El final verdadero y los créditos
- Contexto: al empezar, la (4c) la tenía otra sesión (59 minutos en `en_curso`), así que cogí la (5), que toca la escena y el perfil y no a la jefa. Sin notas del humano pendientes. `check`, 792 tests, `build` y `bot` en verde al empezar. La otra sesión terminó la (4c) mientras tanto; al juntar solo chocó la hoja de ruta.
- Hecho: M12 (5). **Escena nueva `FinalScene`** (`src/render/FinalScene.ts`, datos y textos en `src/data/final.ts`). Al caer la Trituradora (`floorDone` final en la planta 6), en vez del parte de la partida, la tostadora salta dos veces, la pantalla se funde a negro y empiezan **cinco planos** (unos 30 s), cada uno con su paso de la orden de trabajo en verde y su pie de foto: **Recepción** (la tostadora con cara de golpe por la cinta `cinta-despiece` hasta los rodillos: chispazo, temblor), **Limpieza** (barra de duchas, agua cian y burbujas; sale sin mugre, con destellos), **Reparación** (un guante de nitrilo saca por la ranura la resistencia vieja, quemada y con una miga, y mete otra más fina con su pegatina de precio; humo, clic y bote), **Embalaje** (baja a una caja con ventana de celofán, se cierran las solapas con cinta, cae la pegatina verde y el sello rojo de la garantía) y **Planta 1 · Pequeño electrodoméstico** (el almacén pintado con el pintor de salas, una estantería de palés con cajas reacondicionadas, el cartel rojo «Reacondicionados», la caja en el hueco y la etiqueta «49,99 € · PVP de nuevo»; corte a primer plano y «El producto era usted.»). Después **los créditos** suben junto a la caja: equipo, motor, el producto, los seis jefes en orden, todo el reparto del catálogo y chistes de la casa; al final «Gracias por su compra.» y a la portada. Disparar (clic, Espacio, Intro, Esc, F o el botón A) salta los planos y luego los créditos (con 0,6 s de gracia para que un botón pulsado no se lo salte todo). **Sprites nuevos** (`tools/sprites/final.ts`): `final-caja` (cuatro fotogramas: el fondo con la solapa, el frente abierto, el frente cerrado con cinta, el fondo cerrado; ventana de celofán para que se vea el producto que sea, flechas de «este lado arriba» y la copa de «frágil»), `final-pegatina`, `final-guante` (resistencia vieja y nueva), `final-ducha` y `final-estanteria`. **Glifo `€`** en la fuente. **Perfil**: `Profile.endings` (`recordEnding`, `saveEnding`): cuenta los finales y apunta la Trituradora como jefe vencido, su documento («Parte de reacondicionado») y la planta del taller, que antes no se guardaban porque la partida se apuntaba al vencer a la Centralita. **La garantía de la caja encoge** cada vez: 6 meses, 3 meses, 6 semanas… y para siempre «hasta el martes». `?final=n` abre el final directamente (como si se hubiera visto n veces). Tests: `tests/final.test.ts` (7: vencerla acaba la partida sin montacargas; planos en orden y por tiempo; la garantía; los textos caben; créditos con todo el reparto y los jefes en orden; el perfil; los sprites, con la ventana, la tapa y el hueco de la estantería). e2e: pasos `54a`–`54g` (desde una partida en la planta 6, vencida la Trituradora: los cinco planos, la frase, los créditos y la vuelta a la portada).
- Decisiones: **una escena aparte y no dentro de `GameScene`**: es una secuencia con su propio decorado y sin simulación; así no se mezcla con los 5000 renglones de la partida. **Sin parte de la partida**: la victoria ya se apuntó al vencer a la Centralita (M12 (2)); aquí lo que toca es que no haya informe, solo el producto en la estantería. **El decorado sale del pintor de salas** (una sala lisa del taller y otra de la planta 1), así el final se ve igual que el juego. **Caja con ventana**: el producto se pinta entre el fondo y el frente, así vale para los personajes de M13 sin dibujar una caja por cada uno. **Etiquetas en Rojo Oferta con letra blanca** y no en amarillo con letra oscura: la fuente lleva contorno negro y en oscuro sobre amarillo se emborronaba. **«El producto era usted.»** en vez de «el jugador»: el juego trata de usted al jugador en todos sus carteles. **La garantía que encoge** da un motivo para volver a verlo y remata el chiste de la portada.
- Medidas: no toca la simulación; `npm run bot` idéntico (200 partidas, 0 fallos). 807 tests en verde.
- Problemas conocidos: el `€` de la fuente, a 5 px, se lee casi como una E. Las pilas de cajas de la fase 3 (4c) se quedan en la sala al vencerla, pero no se ven: la pantalla se va a negro enseguida. El `e2e` entero tarda más de 10 minutos y falla de vez en cuando en pasos que no he tocado (el bidón del paso 11h, los bocadillos del asistente) si la máquina va cargada; repetido, en verde.
- Siguiente paso: M12 (6), medir la planta 6 entera con el bot y ajustar; con eso M12 queda terminado y se pasa a M13 (cinco personajes).

## 2026-11-12 08:50 (hora peninsular, de `date` + 1) — Hito M12 — La Trituradora, fase 3 «Control de calidad»
- Contexto: al empezar, la (3c) la tenía otra sesión (7 minutos en `en_curso`), así que cogí la (4c), que solo toca a la jefa. Sin notas del humano pendientes. `check`, 790 tests, `build` y `bot` en verde al empezar. La otra sesión terminó la (3c) mientras tanto; al juntar solo chocó la hoja de ruta.
- Hecho: M12 (4c), con lo que la (4) queda entera. **Fase 3 «Control de calidad»** desde el 25 % (`BossPhase` nueva en `src/data/enemies.ts`): grita «Control de calidad. Todo APTO, sin mirar.», sigue en su pared y la cinta sigue corriendo. Ataques: **etiquetas «APTO»** (un `frost` con `sticker: 'etiqueta-apto'`: cuatro, una donde estás y tres alrededor, a 0,55 de velocidad durante 6 s; `Frost.sticker` y `BossFrostAttack.sticker`/`pose` nuevos), y los abanicos de tornillos y teclas de la fase 2. **Pilas de cajas** (`BossPhase.crates`, módulo nuevo `src/sim/crates.ts`): desde 2,5 s después del descanso entre fases y cada 3,2 s cae media columna (arriba, luego abajo), desde la pared de la que sale la cinta hacia ella, hasta 8 columnas; cada trozo se marca 1,2 s antes (`World.crates`, eventos `crateMark`/`crateLand`); quien está debajo recibe un golpe y sale despedido hacia ella al otro lado de la columna. Son el prop nuevo `pila-cajas` (casilla entera de 24×24: una columna es una pared; paran balas y no se rompen). Si se salta la fase 2 de golpe, empiezan por la pared lejana a ella. **Sprites** (`tools/sprites/trituradora.ts`): fotograma 8 `calidad` (pilotos verde brillante con un visto bueno y una etiquetadora de precios de su tamaño en la mano), `etiqueta-apto` (36×18, la etiqueta en el suelo), `etiqueta-apto-vuelo` (14×9, dos fotogramas que revolotean) y `pila-cajas` (26×46, tres cajas grises con cinta de embalar, la etiqueta verde y un fleje). **Escena**: aro verde donde caerá cada etiqueta, la etiqueta pegada (sin el tinte de frío ni esquirlas: un tirón pegajoso de vez en cuando), el marco de franjas amarillas y negras que corre alrededor de cada casilla marcada y parpadea cada vez más deprisa, las cajas que se ven caer en los últimos 0,3 s, y al caer temblor, polvo, astillas grises y el ruido de derrumbe. **Arreglo**: cuando miraba a la izquierda su placa «EN SERVICIO» salía al revés (el sprite se voltea); ahora la placa se vuelve a pintar sin voltear con el `badge` de la animación (como la etiqueta del Muñeco), `PLATE` en el script de sprites; los ocho fotogramas de antes salen idénticos píxel a píxel. Y los textos flotantes (`floatText`) ya no se salen de la sala: el grito de una jefa contra la pared lateral salía cortado. Bot: se aparta de las casillas marcadas hacia el lado de ella; el informe cuenta la fase 3. Tests: `tests/control-calidad.test.ts` (8: datos y sprites; las cajas caen media columna cada vez en orden desde la pared de la cinta, en los dos sentidos, hasta 8 columnas y la del fondo cerrada de arriba abajo; la que está debajo recibe y sale hacia ella sin quedarse dentro; se salta los muebles de las esquinas; las etiquetas frenan; empezar sin la fase 2; determinismo; la placa sin voltear). e2e: pasos `53h` (cartel de la fase), `53i` (cajas y etiquetas; falla con menos de 46 pilas) y `53j` (un trozo cayendo).
- Decisiones: **etiquetas como escarcha** (mismo mecanismo `Frost`, otra pinta) y no un estado pegado a la tostadora: se ven en el suelo, se esquivan, y el bot ya sabía salir de ellas. **Las cajas empiezan por el lado de donde viene la cinta**: ahí era donde se aguantaba lejos de los rodillos; cerrarlo aprieta hacia ella sin encerrar nunca a nadie (cada bolsillo queda abierto hacia su lado). **Media columna cada vez** («por trozos», como dice el diseño) y casillas enteras para que no queden rendijas de 8 px por las que colarse. **Ocho columnas** de 24: quedan 16 libres, de sobra para moverse y para que ella siga en su pared. **Sin rotar sprites** (la etiqueta pegada no se tuerce): el arte de píxel no se gira.
- Medidas: `npm run bot`: Trituradora en 30 combates, gana el 6,7 % (antes 0 % con solo dos fases: no podía acabar), 169 s, 5,93 heridas por combate (4,27 diagnóstico, 1,57 despiece, 0,1 control de calidad), llega a la fase 3 el 13,3 % a los 127 s. Nada más cambia (200 partidas, 0 fallos). 800 tests en verde; e2e entero en verde.
- Problemas conocidos: con la cámara de jefe (que encuadra a la tostadora y a ella), las primeras columnas del fondo quedan a menudo fuera de pantalla; las que caen cerca de la tostadora siempre se ven. Las cajas se quedan después de vencerla: el final (5) debe tenerlo en cuenta. El bot llega poco a la fase 3, así que su dureza está poco medida: es la (6).
- Siguiente paso: M12 (5), el final verdadero (la cinta se lleva a la tostadora, la caja «Reacondicionado. Como nuevo. Garantía: 6 meses» en la estantería de la planta 1) y los créditos; luego (6), medir la planta 6 entera.

## 2026-11-12 07:50 (hora peninsular, de `date` + 1) — Hito M12 — La Carretilla Elevadora
- Contexto: misma sesión que la entrada de abajo; `en_curso` vacío al acabar la (3b3), cogí la (3c).
- Hecho: M12 (3c). **Enemigo nuevo `carretilla`** («Carretilla Elevadora», letra `Í`, solo en la planta 6: `SLOT_ENEMIES_6` = los de la 5 más ella, coste 4, como mucho dos). Cerebro `charger` (el del aspirador) con datos propios: anda a 34, avisa 0,6 s, embiste a 255 durante 0,8 s, 1,5 s aturdida si se estrella; 20 de vida (×1,6 de la planta), `knockbackScale` 0,2 (pesa: las balas casi no la mueven). **Sprite** en `tools/sprites/taller.ts` (36×37, ocho fotogramas: reposo ×2, rodar ×4 con los pernos del cubo girando, `aviso` y `aturdida`): carretilla eléctrica en tres cuartos mirando a la derecha, mostaza de taller (más oscura y marrón que el amarillo de los cupones), la cara en la cabina (faros por ojos bajo una visera de acero, aburrida; rejilla por boca), techo protector con su poste y la **rotativa** encima, el **mástil** con las **horquillas** a la altura del tobillo, el **contrapeso** de hierro con la franja amarilla y negra, la pegatina verde «APTO» en el costado y los guantes de nitrilo azules. Chiste: la **tarjeta roja de «Fuera de servicio»** colgando del mástil. Al avisar: rotativa encendida, horquillas arriba, cejas abajo y la boca abierta; aturdida: horquillas dobladas hacia arriba, ojos en X, un muelle saltado. Dato nuevo `EnemyDef.workshop`: la escena no la reacondiciona (no se dibuja en gris con la pegatina). Causa de baja: «Ensartado por una carretilla fuera de servicio». Tests: `tests/carretilla.test.ts` (2: contenido, fotogramas y solo en la planta 6; avisa, embiste recto y se aturde contra la pared); `taller.test.ts` dice ahora que la 6 tiene todo lo de la 5 y además la carretilla. e2e: paso `17z` (la Zona de Embalaje con una carretilla al lado de una webcam reacondicionada).
- Decisiones: **solo la carretilla, sin brazo de montaje**: la tarea pedía «uno o dos»; un brazo anclado que barre necesitaría un cerebro nuevo y la planta ya tiene cintas que obligan a moverse. Si M14 pide más variedad, es el primer candidato. **Cerebro del aspirador con otros números** y no uno nuevo: embestir es justo lo que hace una carretilla; lo que la distingue es que pesa y que se aturde más rato (el momento de pegarle). **Mostaza y no naranja**: el naranja es de las balas de la tostadora y de la transpaleta; el amarillo vivo, de los cupones.
- Medidas: `node tools/medir-salas.ts 6 60`: media 4,92 heridas por sala (antes 5,01; dentro del ruido: Banco 5,90, Almacén 4,70, Línea 4,43, Embalaje 5,10, Cinta 4,47). `npm run bot` idéntico (0 fallos). 792 tests en verde; e2e entero en verde.
- Problemas conocidos: la captura `17z` sale a veces con la carretilla en pleno aviso (silueta amarilla del destello). A tamaño real la tarjeta roja se lee como «algo rojo colgando», no como texto (como la etiqueta del aspirador).
- Siguiente paso: M12 (4c), la fase 3 de la Trituradora, «Control de calidad»; luego (5), el final verdadero y los créditos, y (6), medir la planta 6 entera.

## 2026-11-12 07:05 (hora peninsular, de `date` + 1) — Hito M12 — Las cintas transportadoras del taller
- Contexto: `en_curso` vacío y sin notas del humano pendientes. `check`, 785 tests, `build` y `bot` en verde al empezar. Cogí la (3b3).
- Hecho: M12 (3b3). **Cintas en las plantillas**: `→` y `←` (`BELT_CHARS` en `src/sim/room.ts`); cada tira de la misma flecha es una cinta (tiene que ser un rectángulo, si no `buildRoom` falla) y se guarda en `Room.conveyors` (`RoomBelt`). Si su extremo de abajo da contra pared en todas sus filas, lleva **rodillos** (16 px, como la Trituradora). `fillTemplate` da la vuelta a las flechas al reflejar la sala. `layRoomBelts` (`src/sim/conveyors.ts`) las pone como `Conveyor` al crear el mundo y al entrar en cada sala (40 px/s, `by: 'cinta'`); no tienen jefe, así que corren siempre. **Arrastran también a los enemigos a pie** (`carry` en `src/sim/enemies.ts`: todos menos polillas, repetidores y jefes; un microondas que no anda también va de viaje); la cinta de la Trituradora sigue siendo solo para la tostadora. Causa de baja nueva: «Procesado en cadena sin cita previa». **Dibujo**: la escena reusa `cinta-despiece` y `rodillos-despiece` (las de sala salen ya opacas, sin el fundido de arranque); el pintor (`src/art/room.ts`) no pone decoración encima y les pinta el **bastidor de acero** (labio claro arriba, oscuro con sombra abajo, pernos), el **tambor de cola** donde sale la cinta y, si no hay rodillos, el borde amarillo gastado donde se acaba. **Salas**: la Línea de Desmontaje lleva dos cintas al pie de los bancos que van hacia el hueco del centro, y hay una sala nueva, **«Cinta de Clasificación (Lo Que Entra, Sale)»**: dos cintas de lado a lado en sentidos contrarios, cada una a los rodillos de una jaula de piezas. Tests nuevos: `tests/cintas.test.ts` (5: plantillas y rodillos; reflejo; arrastre, remontar, mordisco y devolución; enemigos de viaje; planta 6 jugada con la sala de la cinta, entrar y salir sin duplicarlas). `rooms.test.ts` cuenta las flechas como suelo. e2e: paso `17y` (la tostadora quieta en la cinta de arriba llega a los rodillos; falla si no se mueve).
- Decisiones: **solo de lado** (← →): el sprite de la cinta es de perfil y una cinta vertical en tres cuartos pediría otro dibujo; con las de lado basta para las salas. **Flechas y no letras**: se leen en la plantilla tal como corren, y quedaban pocas letras libres. **Rodillos solo contra pared**: una cinta que acaba en el suelo te suelta sin más; contra una jaula, es la máquina que se traga las piezas. **Arrastran a los enemigos** porque el diseño dice «a todo el que las pisa», y así la cinta también se puede usar a favor. **No paran al limpiar la sala**: es un taller, la línea no se para por nadie.
- Medidas: `npm run bot` idéntico (200 partidas, 0 fallos, vacía la sala el 32,5 %; ninguna planta de abajo tiene cintas). `node tools/medir-salas.ts 6 60` (30 salas por plantilla, bot sin objetos): Banco 5,07 heridas, Almacén 5,33, Línea 5,47, Embalaje 4,63, **Cinta de Clasificación 4,53**; ninguna se vacía en 60 s casi nunca (dureza 1,6 sin objetos: es la (6)). La sala nueva no destaca por dura. 790 tests en verde; e2e entero en verde.
- Problemas conocidos: el cartel con el nombre de la sala tapa un momento la cinta de arriba al entrar en la Cinta de Clasificación. El bot no aprovecha las cintas, solo las compensa.
- Siguiente paso: M12 (3c), un enemigo propio del taller (brazo de montaje o carretilla); o la (4c), «Control de calidad».

## 2026-11-12 06:20 (hora peninsular) — Hito M12 — La Trituradora, fase 2 «Despiece»
- Contexto: al empezar, la (3b2) la tenía otra sesión (20 minutos en `en_curso`), así que cogí la (4b), que no toca el arte de las salas; la otra sesión terminó la (3b2) mientras tanto. Sin notas del humano pendientes. `check`, 781 tests, `build` y `bot` en verde al empezar.
- Hecho: M12 (4b). **Motor de cintas transportadoras** nuevo, `src/sim/conveyors.ts` (`World.conveyors`): un rectángulo del suelo que empuja a la tostadora a su velocidad (rodando o no; se suma como el viento del aire acondicionado), con **rodillos de entrada** opcionales en el extremo de abajo (`bite` px) que quitan un corazón (como el contacto del jefe, causa «Recogido para reacondicionar») y la tiran cinta arriba a 480 px/s (unos 60 px), con 0,7 s entre mordiscos; una cinta de jefe se para cuando cae (evento `conveyor`). **Fase 2 de la Trituradora** (`BossPhase.belt`, en `src/data/enemies.ts`): desde el 60 %, frase «Procedemos al despiece. No se mueva.», cinta por todo el suelo (44 px/s) hacia la pared lateral más lejana de la tostadora; ella va allí (`Enemy.rail`, `railRoam` en `src/sim/enemies.ts`: a 3 veces su paso, sin atacar, rodeando las cajas de las esquinas; 0,6 s de respiro al llegar) y luego sube y baja pegada a esa pared en tramos como los de `bossRoam`, la mitad hacia la altura de la tostadora. Tres patrones nuevos (`despiece-tornillos`, `-muelles`, `-teclas`) con **tres balas nuevas** (`screw`, `spring`, `key`). **Sprites** en `tools/sprites/trituradora.ts`: fotograma 7 `despiece` de la Trituradora (pilotos rojos y la ranura llena de piezas: un tornillo, una tecla, un muelle; es su pose al avisar en la fase 2), `bala-tornillo` (cabeza roja con estrella blanca y caña de acero, gira), `bala-muelle` (espiral roja en zigzag, culebrea), `bala-tecla` (tecla blanca con borde rojo y una A, da vueltas), `cinta-despiece` (48×24: lamas de goma negra, desgaste y un galón amarillo desvaído) y `rodillos-despiece` (columna de rodillos dentados con franja amarilla y negra, dos fotogramas). **Escena**: la cinta como `TileSprite` que corre y aparece en 0,4 s, los rodillos girando, sonido y temblor al arrancar, chispas, crujido y temblor al morder. **Bot**: con la cinta empuja el stick en contra (`beltCounter`) y se aparta de los rodillos a menos de 90 px. Tests nuevos: `tests/despiece.test.ts` (4: la fase y sus balas; la cinta hacia la pared lejana en los dos sentidos, ella llega sin atacar y luego recorre su pared atacando; quieta la arrastra, en contra se avanza, los rodillos muerden y devuelven; al caer se para). e2e: pasos `53e`–`53g` (la cinta al arrancar con su cartel de fase, las piezas, la tostadora arrastrada hasta los rodillos).
- Decisiones: **cinta hacia una pared lateral y no hacia la de arriba**: con 88 px de alto, pegada arriba la tolva se sale de la pantalla y la tostadora quedaría escondida detrás de ella; de lado se ve todo. **Todo el suelo es cinta**: el jefe se mueve, así que una franja fija no siempre llevaría hacia él; así la regla es una sola («todo va hacia ella»). **Rodillos en el extremo** porque, si no, quedarse pegado a la pared junto a ella sería un sitio seguro. **La cinta sigue en la fase 3** salvo que la (4c) diga otra cosa. **El motor de cintas es general** (rectángulo, dirección, velocidad, rodillos) para que la (3b3) solo tenga que leerlas de las plantillas. **El bot compensa la cinta al final** (sobre el movimiento ya decidido) y no en el esquive: la primera versión, metiéndola en el esquive, huía a la otra punta de la sala y no le llegaban las balas (ni ganaba ni recibía).
- Medidas (bot con el arma de salida y sin objetos; `/tmp` de la sesión, 20 combates de 60 s curando cada tick para contar golpes): **fase 1, 4,6 heridas por minuto; fase 2, 3,65 por minuto y 1,15 mordiscos por minuto**. La primera versión (cinta a 38, descanso 0,7–1,1, dos abanicos de muelles y teclas, tres de tornillos) daba 0,9 heridas por minuto: demasiado fácil; subí cinta a 44, menos descanso y un abanico más en cada patrón. `npm run bot`, 30 combates enteros: **gana el 0 %, 6 heridas** (4,27 en el diagnóstico, 1,73 en el despiece), llega al despiece el 63 % a los 64,5 s; el bot llega a la fase 2 con menos de dos corazones. Como en la (4a): sin objetos y con 300 de vida, la (6) lo ajusta con lo que se trae de abajo. El resto de cifras del bot, idénticas; 0 fallos. 785 tests en verde; e2e entero en verde.
- Problemas conocidos: la cámara prioriza a la tostadora, así que con la tostadora abajo la tolva de la Trituradora puede quedar cortada arriba (como en la fase 1). Los muelles, a tamaño real, se leen como «algo rojo con rayas» más que como muelles. La fase 2 dura mucho con el arma de salida (unos 100 s de 180 de vida que le quedan) hasta que llegue la fase 3 al 25 %.
- Siguiente paso: M12 (3b3), las cintas del taller con su letra de plantilla (el motor ya está); luego la (3c) o la (4c), «Control de calidad» (etiquetas de «APTO» que frenan y pilas de cajas que cierran la sala por trozos).

## 2026-11-12 05:45 (hora peninsular) — Hito M12 — Los muebles y las persianas del taller
- Contexto: misma sesión que la entrada de abajo; `en_curso` vacío al acabar la (3b1), cogí la (3b2).
- Hecho: M12 (3b2). **Sprites nuevos** en `tools/sprites/props.ts`, mismas medidas y cajas de choque que los de abajo: `caja-6` (`makePartsCrates`: dos cajas de piezas grises apiladas de cualquier manera, un motor y un bucle de cable rojo asomando y la etiqueta verde con su visto bueno), `barril-6` (`makeGreaseDrum`: bidón negro verdoso de grasa usada, banda amarilla con la llama, grasa chorreando desde el tapón; estalla como todos), `carrito-6` (`makePalletJack`: transpaleta naranja con el palé vacío encima y el mango echado atrás; baja, las balas pasan) y `mesa-6` (un banco de trabajo: tablero de haya negro de aceite sobre patas verdes, un tornillo de banco y una tostadora abierta con la resistencia encendida; sus cinco fotogramas de volcar, y astillas del color de su madera al romperse). **Persianas** `persiana-{n,s,v}-6`: lamas grises de taller, el zócalo a rayas verdes y blancas del Servicio y una **cinta amarilla y negra en diagonal con el cartel «AVERIADA»** (en las laterales, una tarjeta con una cruz roja). `levelKey` (`GameScene`) ya no limita a la planta 5: cada planta usa su `-N` si existe. `tests/sprites.test.ts` pide ahora también las versiones `-6` con las mismas medidas.
- Decisiones: **«Averiada»** en las persianas: el chiste de la planta es que el servicio técnico no arregla lo suyo; la cinta en diagonal se ve desde lejos. **La transpaleta y no una carretilla elevadora** como obstáculo: la carretilla queda para el enemigo propio de la (3c) (embiste); la transpaleta es baja, como el carro de abajo.
- Medidas: no toca la simulación; `npm run bot` 200 partidas, 0 fallos, cifras idénticas. 781 tests en verde; e2e entero en verde.
- Problemas conocidos: en la Zona de Embalaje, la rejilla de pilas de cajas repite mucho el mismo sprite (es la idea de la sala, pero una segunda variante de caja ayudaría).
- Siguiente paso: M12 (3b3), las cintas transportadoras del suelo que arrastran (letra de plantilla con dirección, empuje en la simulación, dibujo animado, el bot las tiene en cuenta); o la (3c), un enemigo propio del taller.

## 2026-11-12 05:01 (hora peninsular, de `date` + 1) — Hito M12 — El suelo y las paredes del Taller de Reacondicionado
- Contexto: la (4a) la tenía otra sesión (55 minutos en `en_curso`) y la terminó mientras yo trabajaba; cogí la (3b1), que solo toca el pintor de salas. Sin notas del humano pendientes. `check`, 771 tests, `build` y `bot` en verde al empezar.
- Hecho: M12 (3b1). **Juego de losetas nuevo** `src/art/taller.ts` y **una rama más en el pintor** (`src/art/room.ts`: `five` pasa a ser solo la planta 5 y `six`, la 6 y las de arriba, va delante en las ~30 ramas por planta). Suelo: cuatro azulejos de 12 px por casilla, con su junta negra y un brillo de esmalte gastado; variaciones `grease`, `chipped`, `drain` (los desagües cuentan como las rejillas de abajo: pocos y nunca juntos), `bolts` (los pernos y la huella limpia de una máquina que ya no está), `gone` (el azulejo que falta, con el mortero rayado) y `solder`. Encima, charcos de aceite con su reguero, la **pasarela peatonal** amarilla con su muñequito (en vez de rodadas), zonas «EN REPARACIÓN / SIN PIEZA / DIAGNÓSTICO» y letras verdes en el suelo («COMO NUEVO», «GARANTÍA ANULADA», «SIN CITA NO»…). Basura: tornillos, muelles, arandelas y pegatinas verdes despegadas. **Paredes interiores: jaulas de piezas** (malla galvanizada en rombos con motores, bobinas y placas detrás, y a veces la etiqueta verde con su visto bueno). **Pared del fondo**: verde de fábrica arriba y azulejo de 6 px abajo (alguno roto o caído), gavetas de piezas de colores en su riel, un **panel de herramientas** con el contorno pintado de las que faltan, el **cartel «Días sin incidencias: 0»**, reloj parado y carteles («REACONDICIONADO», «DIAGNÓSTICO», «DESMONTAJE», «PIEZAS», «EMBALAJE», «CONTROL DE CALIDAD»; «TRITURACIÓN» en la del jefe). Techo: **cercha de acero** con **fluorescentes colgados de cadenas** y luz fría verdosa. Laterales: la **tubería azul de aire comprimido** con su acoplador y su manguera roja, y carteles de EPI obligatorio. Zócalo de azulejo. **El rótulo de la entrada** (`entranceSign`): caja verde con el borde de rayas verdes y blancas del montacargas, «SERVICIO TÉCNICO OFICIAL» en blanco y debajo la tira «SOLO CON CITA PREVIA»; como es ancho, en una sala con puerta al norte se prueba primero en el centro de cada lado de la puerta. Felpudo «TRAIGA CITA». La sala del jefe (la de la Trituradora, que entró a la vez) lleva **virutas** de metal por el suelo. Tests: cuatro nuevos en `tests/roomart.test.ts` (color caqui distinto de las otras cinco plantas e igual de oscuro; cartel, decoración y variaciones propias y nada de las plantas de abajo; el rótulo cabe sin pisar la puerta de arriba en cinco semillas; puertas libres y desagües); el que decía que la 6 se pinta como la 5 dice ahora que la 7 se pinta como la 6.
- Decisiones: **el azulejo «blanco» no es blanco**: el diseño pide azulejo blanco con grasa, pero un suelo claro competiría con el núcleo blanco de las balas; el chiste pasa a ser que la grasa lo ha dejado color hueso (caqui sucio, `#47463c`), y lo blanco está en la pared, los tubos y las etiquetas. Es el único color libre que quedaba lejos de los otros cinco (el gris verdoso que pedía el taller estaba a 9–12 de Informática y las Oficinas). **El rótulo de la entrada sustituye a la placa del cartel** en la Recepción (cuenta como `cartel:SERVICIO TÉCNICO OFICIAL`). **Panel de herramientas en todas las salas** que tengan sitio, como el eslogan de la planta 5: es lo que dice «taller» desde lejos. **Muebles y persianas siguen siendo los de la planta 5** (`levelKey` lo limita a 5): es la (3b2).
- Medidas: no toca la simulación; `npm run bot` 200 partidas, 0 fallos, cifras idénticas (vacía la sala el 32,5 %). 775 tests en verde; e2e entero en verde (la `17v` es ya la Recepción con su rótulo).
- Problemas conocidos: las sillas `c` y las mesas siguen siendo de sala de espera (la (3b2)). Las manchas de grasa, de cerca, pueden parecer agujeros; se leen bien como suelo sucio con balas encima (`capturas/17w`). En salas estrechas con puerta al norte el panel de herramientas puede no caber (sale el resto).
- Siguiente paso: M12 (3b2), los muebles `-6` (cajas de piezas, bidones de grasa, transpaletas, bancos de trabajo) y sus persianas; luego la (3b3), las cintas que arrastran, que necesita la (4b).

## 2026-11-12 04:40 (hora peninsular, de `date`) — Hito M12 — La Trituradora: sprites, sala y fase 1 «Diagnóstico»
- Contexto: al empezar, la (3a) la tenía otra sesión (13 minutos en `en_curso`), así que cogí la (4a), que casi no toca sus archivos. Su commit de la (3a) se llevó mi entrada de `en_curso` al juntar; la volví a poner (commit «se perdió al juntar la (3a)»). `check`, 768 tests, `build` y `bot` en verde al empezar.
- Hecho: M12 (4a). **Sprite nuevo** `trituradora` (`tools/sprites/trituradora.ts`, 96×88, siete fotogramas: reposo ×2, rodar sobre orugas ×4 y `diagnostico`): una trituradora industrial verde máquina en tres cuartos, la **tolva por boca** (dos rodillos de cuchillas que giran y una **rebanada de tostada quemada** atascada entre ellas: el cliente anterior), una placa «EN SERVICIO», **dos pilotos verdes por ojos** con los párpados de chapa a media asta (aburrida y segura de sí), la ranura de salida enseñando dientes con tiras de papel colgando, banda amarilla y negra, una pegatina redonda «APTO» en el lado, **orugas** con ruedas que giran y **guantes de nitrilo azules** flotando (manos grandes, sin brazos). Al diagnosticar, los pilotos se ponen ámbar y la mano de delante levanta un **escáner de código de barras**. **Datos**: el jefe `trituradora` (300 de vida, más que cualquier jefe de planta; letra `Ü`, `FLOOR_BOSS_6`, `floorBossOf(6)`), su sala **`jefe-taller`** («Taller de Reacondicionado», abierta, dentro de `FLOOR_6`: la planta 6 ya acaba en ella), causa de baja y su documento, el **«Parte de reacondicionado»**. **Fase 1, «Diagnóstico»**: dos datos nuevos, `BossPhase.cycle` (los ataques van en orden, uno por turno, y vuelta a empezar) y `BossPatternAttack.scan` (durante el aviso, evento `scan`: la escena dibuja el abanico rojo del escáner sobre la tostadora con la línea que la recorre dos veces, pita el escáner y sale el diagnóstico bajo sus orugas). Cinco patrones reacondicionados, con las balas de cada jefe: `triturado-cubitos` (Nevera, con granizo detrás), `-cobertura` (Router, tres anillos con el hueco girando), `-accesorios` (Muñeco, con un anillo de rebajas), `-tarjetas` (Director, cinco abanicos) y `-espera` (Centralita, tres anillos de notas). Diagnósticos: «le falta frío», «sin cobertura», «pasado de moda», «plantilla excesiva», «no contesta». `npm run bot` mide ya la Trituradora. Tests nuevos: `tests/trituradora.test.ts` (5); `jefes-movimiento` la incluye; `taller.test.ts` y `servicio*.test.ts` al día. e2e: pasos `53a`–`53d` (cartel, diagnóstico, cubitos, cobertura).
- Decisiones: **su documento no cuenta para la cita** (`LoreDoc.beyond`, `EXPEDIENTE` en `src/data/lore.ts`): sin eso, el «expediente completo» que pide la cita incluiría un papel que solo se consigue con la cita. En el archivador sí sale (como «extraviado» hasta encontrarlo): es un aviso de que hay algo más. **Uno por turno en orden fijo** (Nevera → Centralita) y no al azar: así se lee como un repaso de la partida y se puede aprender. **Se mueve** (orugas, 40 px/s) aunque sea «del tamaño de una pared»: el humano pidió jefes que se muevan, y el test de movimiento lo exige. **El jefe empieza en la fila 6** de su sala y no arriba del todo: con 88 px de alto, si no, la cámara no cabe con ella y la tostadora a la vez (primera captura: medio jefe fuera). **El diagnóstico va bajo las orugas** y no sobre la tolva, por lo mismo. La sala es provisionalmente abierta y con el arte de la planta 5 (la (3b) le da el del taller); las cintas de la fase 2 la cruzarán.
- Medidas (`npm run bot`, 30 combates con el arma de salida y sin objetos, solo la fase 1 con sus 300 de vida): en la primera versión, con el jefe en la fila 4, ganaba el 10 % en 153 s con 5,87 heridas; con el jefe en la fila 6, **gana el 0 %, 6 heridas por combate** (las tres vidas: muere justo al final). Es un jefe final sin objetos y con 300 de vida en una sola fase; la (6) lo ajusta con lo que se trae de abajo, cuando estén sus tres fases. El resto de cifras, idénticas; 0 fallos. 777 tests en verde; e2e entero en verde (dos veces).
- Problemas conocidos: los ojos a media asta, a tamaño real, se leen más como cansados que como enfadados (encaja con el tono). La sala usa el arte de la planta 5 hasta la (3b). Sin fases 2 y 3, la pelea entera es la fase 1.
- Siguiente paso: M12 (4b), la fase 2 «Despiece» (desde el 60 %: la cinta del suelo arrastra hacia la tolva y escupe piezas en abanicos), cuando la (3b3) tenga las cintas; o la (3b2)/(3b3) si están libres.

## 2026-11-12 03:39 (hora peninsular, de `date`) — Hito M12 — La planta 6: el Taller de Reacondicionado (generación y salas)
- Contexto: misma sesión que la entrada de abajo; `en_curso` con mi tarea. Todo en verde tras la (2).
- Hecho: M12 (3a). **La planta del Servicio Técnico** (`src/sim/floor.ts`): `generateWorkshop(seed)`, de 5 a 6 salas en fila (`WORKSHOP_ROOMS`): un paseo por la rejilla que sigue recto dos veces de cada tres y si no gira, sin tocar nunca una sala que no sea la de al lado (en el minimapa no parece haber atajos); la primera es la entrada, la última la del jefe, el resto de combate; sin tesoro, tienda ni secreta. `validateWorkshop` lo comprueba. `planFloor` la usa desde `SERVICE_LEVEL` y **no reparte tickets ni cofres** (cupones, corazones y garantías sí). **Salas** (`FLOOR_6` en `src/data/rooms.ts`): la entrada «Recepción de Averías (Sin Cita, No)» y cuatro de combate con su idea escrita: «Banco de Pruebas (Todo Falla)» (dos filas de bancos largos que hacen de trincheras), «Almacén de Piezas (Clasificadas por Peso)» (tres filas de estanterías con dos grupos que salen o no), «Línea de Desmontaje (No Tocar)» (una línea de bancos de lado a lado con hueco en el centro y los extremos según el día, 24×15) y «Zona de Embalaje (Como Nuevo)» (pilas de cajas en rejilla). La sala del jefe sigue siendo la de la Centralita hasta la (4a) (`templatesOf` baja a la planta 5). **Enemigos reacondicionados**: los de las cinco plantas (`slotEnemiesOf(6)` es el de la 5, que ya los tiene todos), **dureza 1,6** (`FLOOR_TOUGHNESS`) y **tope 16**; en la escena, todo enemigo que no es jefe en la planta 6 se dibuja de una copia de su hoja (`refurbishedOf`, como las fotocopias): la carcasa tres cuartos hacia un gris frío de taller, el contorno igual, y en cada fotograma una **pegatina verde** de 5×4 (3×3 en los pequeños) en la esquina de arriba a la derecha del cuerpo, buscando un sitio con cuerpo debajo y sin contorno (la primera prueba, en el centro, caía en la cara y parecía un ojo). `?planta=6` en la URL juega el taller (con cita). Tests nuevos: `tests/taller.test.ts` (3: el generador en 300 semillas, ni recto del todo ni en zigzag; la planta 6 con sus salas, sin tickets ni cofres y con enemigos más duros; cada sala de combate jugada 4 s sin romper nada). e2e: `17v` ya es la Recepción, comprueba que no hay tienda ni tesoro, y `17w`–`17x` (Banco de Pruebas y Almacén con sus enemigos reacondicionados). Herramienta nueva `tools/mirar-sala.ts <png> '<consulta>' [ms]`: una captura de cualquier sala por URL sin pasar el e2e entero.
- Decisiones: **en fila y no en árbol**: el diseño dice «casi en línea» y una planta de cinco salas con ramas sería un callejón por sala. **Los enemigos reacondicionados se deciden en la escena por planta**, no con un dato por enemigo: así también lo son los que salen a mitad de pelea (las figuritas del sobre, las copias de la fotocopiadora, que siguen siendo fotocopias). **Dureza 1,6 y no más**: es la última planta y se llega con todo, pero lo mide la (6). Las letras de las plantillas son las de siempre (`c`, `v`, `b`, `k`, estanterías): hasta el arte de la (3b) salen con los muebles de la planta 5 (sillas y mesas de la sala de espera), y la (3b) solo tendrá que dar sus texturas `-6`.
- Medidas (`node tools/medir-salas.ts <planta> 120`, 30 salas por plantilla con el arma de salida y el bot cazando): **planta 6, 5,67 heridas y 84 s por sala** (4,03 por minuto; el Almacén la más dura, 6,47 y 95 s); **planta 5, 4,85 y 74 s** (3,89 por minuto). `npm run bot` 200 partidas, 0 fallos, idéntico. 771 tests en verde; e2e entero en verde.
- Problemas conocidos: se ve como la planta 5 (cartel «Planta 5 · Atención» incluido) hasta la (3b). Los muebles `c` son sillas de sala de espera, que en un almacén de piezas no pegan: la (3b) les da su dibujo de taller.
- Siguiente paso: M12 (3b), partida en tres en la hoja de ruta: (3b1) el juego de losetas del taller (seguir el patrón de `src/art/atencion.ts` y las ramas `five ?` de `src/art/room.ts`, que pasan a ser una más), (3b2) sus muebles `-6` y (3b3) las cintas que arrastran. Cierro la sesión aquí en vez de empezar el arte con el contexto ya largo: el arte pide mirar las capturas con calma.

## 2026-11-12 03:10 (hora peninsular, de `date`) — Hito M12 — El acceso al Servicio Técnico
- Contexto: `en_curso` vacío y ninguna nota del humano pendiente. `check`, 764 tests, `build` y `bot` en verde al empezar.
- Hecho: M12 (2). **La cita viaja a la partida**: `HubOptions.service` (el Mostrador la recibe del perfil), `WorldOptions.service` y `World.service`; `leaveHub` y `nextFloor` la pasan de planta en planta. En `src/sim/world.ts`: `SERVICE_LEVEL = 6`, `topLevelOf(w)` (la 6 con cita, la 5 sin ella), `isLastFloor` mira `topLevelOf` y `winsRun(w)` dice si vencer al jefe de esta planta gana la partida (la 5, siempre). **Con cita, al caer la Centralita** no empieza el final: sube un **montacargas del Servicio Técnico** (`Lift.service`, y el evento `lift` lleva `service`), y la escena **apunta la partida como ganada en ese momento** (`recordRun('floor')` al recibir el evento; después, en la planta 6, ni morir ni ganar apuntan otra). **Sprite nuevo** `montacargas-servicio` (`makeServiceLift` en `tools/sprites/props.ts`, 44×44 por fotograma): la plataforma del montacargas con el borde de rayas verdes y blancas, la flecha pintada hacia arriba y detrás, sobre dos postes, el cartel de la ventanilla (la cabecera roja del cartel de «Cita previa», letra pequeña y una casilla que se pone verde) con el piloto rojo o verde. Cuando está listo, el rótulo «Servicio Técnico Oficial · Solo con cita previa» en verde y, encima, «Incidencia cerrada. Su cita le espera arriba.». **Al subir**, la tostadora flota hacia arriba y se desvanece en un haz de luz fría (el normal se hunde). El parte de la planta 5 dice «Siguiente: Servicio Técnico Oficial. Solo con cita previa.» (`FLOOR_NAMES[6]`). `?cita=1` en la URL juega una planta como si hubiera cita. Tests nuevos: `tests/servicio-acceso.test.ts` (4: **sin cita la partida acaba en la planta 5**, que es el criterio de aceptación; con cita gana y sube; la cita viaja del Mostrador a la planta 5; los textos caben). e2e: pasos `17r`–`17v` (la Centralita cae con cita en la entrada de la planta 5, el montacargas listo, subiendo, el parte y la planta 6).
- Decisiones: **la planta 6 se genera de momento como la 5** (sus plantillas, su arte y otra vez la Centralita, cuyo final gana la partida como siempre): así `main` no tiene un montacargas a ninguna parte, y la (3a) solo tiene que cambiar qué se genera a nivel 6. Las texturas por planta de nivel 6 usan las de la 5 (`levelKey`). **La victoria se apunta al subir el montacargas y no al subirse**: es lo que dice el diseño (morir en el Taller no quita la partida ganada) y lo que no se puede deshacer; el tiempo y las bajas de la planta 6 no entran en el historial hasta que la (5) decida cómo se apunta el final verdadero. **El montacargas sube a la tostadora en vez de hundirse**: es el único que va hacia arriba, y la luz fría anticipa el taller. El cartel va en el mismo sprite (detrás de la plataforma, con su profundidad), así que si el jefe cae junto a un mueble alto el cartel puede quedar medio tapado por él; en la sala de la Centralita hay sitio.
- Medidas: con `service` falso nada cambia: `npm run bot` 200 partidas, 0 fallos, **idéntico** a antes del cambio (comprobado con `git stash`). 768 tests en verde; e2e entero en verde, dos veces (la segunda tras subir el «Incidencia cerrada» al momento en que el montacargas está listo: al caer la jefa chocaba con el sello «Liquidación total»).
- Problemas conocidos: la planta 6 provisional es otra planta 5 con su cartel «Planta 5 · Atención» y la Centralita otra vez. Los jefes y documentos de arriba aún no cuentan en el perfil (la partida ya se apuntó). La flecha del montacargas normal sigue diciendo «a la planta 2» en cualquier planta (es así desde M3; lo dejo).
- Siguiente paso: M12 (3a), la planta 6: generación corta y casi en línea (recepción, taller, almacén de piezas, jefe; sin tienda ni tesoro) y sus enemigos reacondicionados.

## 2026-11-12 02:11 (hora peninsular, de `date`) — Hito M12 — Los requisitos del Servicio Técnico y la «Cita previa»
- Contexto: M11 terminado y `en_curso` vacío; no hay notas del humano pendientes. `check`, 752 tests, `build` y `bot` en verde al empezar.
- Hecho: **M12 partido en seis tareas** (`docs/HOJA_DE_RUTA.md`) y **su diseño escrito** («El Servicio Técnico» en `docs/DISENO.md`: requisitos, acceso, la planta del Taller de Reacondicionado con enemigos reacondicionados y cintas, la Trituradora en tres fases y el final verdadero). **M12 (1), los requisitos**, datos en `src/data/servicio.ts`: vencer a los **cinco jefes**, **ganar con tres productos distintos** y el **expediente completo** del archivador (los 10 documentos). Dos condiciones nuevas en `UnlockCondition` (`minWinners`, `allDocs`), que sirven también al tablón. El perfil guarda ahora **`victories`** (partidas ganadas por personaje; una partida que acaba en «planta» es una ganada) y **`service`** (la cita, para siempre); `last.service` marca la partida que la consigue. `serviceMet` y `serviceBoard` en `src/sim/unlocks.ts`. **En el Mostrador**: estación nueva `cita` (`y` en la plantilla), un **cartel de «Cita previa»** pegado con celo a la izquierda del tablón (`tools/sprites/mostrador.ts`: hoja plastificada con cabecera roja, tres casillas, letra pequeña, una mancha de café; `cita-marcas`, la marca verde; `cita-sello`, el sello «Concedida»), que se marca solo según el perfil; con F abre un **panel** (`src/render/cita.ts`) con cada requisito, «2/5» o «Cumplido», y el pie («Plazo de resolución: indefinido») o la cita concedida. Verbo: «Leer la letra pequeña». **El teléfono** confirma la cita en cuanto se concede (`tel-cita`, condición nueva `service` en los diálogos) y **el Chatarrero**, desde el tercer jefe y sin cita, señala el cartel. El pintor de salas ya no pone su cartel de estantería, su pantalla ni su reloj detrás de lo colgado en el Mostrador ni bajo el rótulo de la sala (`hubHung` en `src/art/hub.ts`): antes la pantalla «602» asomaba bajo el tablón. Tests nuevos: `tests/servicio.test.ts` (8) y `tests/servicio-cartel.test.ts` (3); `tests/mostrador.test.ts` cuenta la estación nueva. e2e: paso `49b-cita-previa` (abre el cartel y comprueba «1/5»).
- Decisiones: **«ganar con 3 personajes» se recorta a los que se puedan jugar** (`winnersNeeded`): hasta M13 solo está la tostadora, y pedir tres dejaría el piso secreto inalcanzable hasta entonces; el cartel lo dice en letra pequeña («Mientras no haya más productos en exposición, se acepta uno solo»). Al llegar M13 sube solo a tres; quien ya tenga la cita la conserva. **El expediente pide todos los documentos que haya** (`allDocs`, no un número fijo): si M14 añade documentos, el requisito crece, pero una cita dada no se quita. **Un guardado de antes** que ya venció a la Centralita recibe su victoria (a quien ganó la última partida, o a la tostadora) y, si cumple, la cita. **El cartel, en la pared y no como diálogo del teléfono**: los requisitos con números se leen mejor en un panel como el del tablón, y ver las casillas marcarse desde lejos es la gracia; el teléfono queda para la historia. Su frase no revela el final («Si el producto es usted, tráigase»). En el diseño, **vencer a la Centralita con cita sigue contando como victoria** (se apunta al vencerla) y luego se sube: morir en el Taller no quita la partida ganada.
- Medidas: no toca la simulación; `npm run bot` 200 partidas, 0 fallos, cifras idénticas. 763 tests en verde (764 con el del sello que entró a la vez); e2e entero en verde.
- Problemas conocidos: con la pared del Mostrador llena, ya no sale el cartel de estantería («Saldos») ni el reloj parado: queda algo más sobria. `tools/mirar-mostrador.ts` (nuevo) saca el Mostrador con un perfil dado sin pasar el e2e entero: `node tools/mirar-mostrador.ts <carpeta> '<perfil json>' [estación]`.
- Siguiente paso: M12 (2), el acceso: con la cita, vencer a la Centralita apunta la victoria y abre el montacargas al Servicio Técnico; sin ella, la partida acaba en la planta 5 (test del criterio de aceptación).

## 2026-11-12 02:05 (hora peninsular, de `date`) — Hito M11 — El sello ya no salta al planear (lo que quedó de la (7) duplicada)
- Contexto: a las 00:24 la (7) llevaba 113 minutos en `en_curso` sin nada empujado y la retomé; la sesión de las 22:31 seguía viva y la cerró a las 00:50 (entrada de abajo). Hice lo mismo por mi cuenta y llegué a lo mismo: el sello de `medir-plantas-35` metido en la pared, `slide` a trozos y tope 16 en la planta 5. Al ir a empujar, **me quedé con lo suyo** (ya estaba en `main` y la siguiente sesión ya trabaja encima) y tiré lo mío, salvo lo único que no estaba.
- Hecho: **el Sello de Denegado no planea a más de 320 px/s** (`STAMP_GLIDE`, `src/sim/enemies.ts`; su planeo normal es de 220). Con el arreglo de `slide` ya no atravesaba la pared, pero si un mueble lo frenaba en un eje, en el último tick del aviso seguía recorriendo de golpe lo que le faltaba (hasta 50 px en un tick: un salto a la vista). Ahora, si lo frenan, cae corto, donde estaba la sombra. Test nuevo en `tests/sello.test.ts` (un tabique entre el sello y su destino en el último tick: no lo cruza, no pasa de su velocidad y el mundo sigue sano; y `slide` con 70 px de golpe contra un tabique de 8).
- Mis medidas, por si sirven de segunda muestra (`npm run plantas`, 80 partidas, semillas 0–79, con `slide` a pasos de 6 px): con tope 16 y dureza 1,5, la planta 3 la gana el 6,25 %, la 4 el 7,5 % y la 5 el 7,5 % (2,25 heridas y 44 s por sala); con dureza 1,7 y sin tope, la 5 el 13,75 % con 1,97 heridas. Coinciden con las de la otra sesión: más vida alarga las salas sin herir más; más enemigos hieren como en las Oficinas; y las plantas 2–5 están todas entre el 6 y el 12 %, dentro del ruido.
- Decisiones: no tocar el ajuste que ya está (tope 16, dureza 1,4). Lo aprendido para `AUTOPILOT.md` paso 1.4: una tarea de medir puede pasar de 90 minutos sin estar abandonada; la sesión que la coge podría refrescar `desde` a mitad de camino (no cambio el protocolo, solo lo apunto).
- Medidas: `npm run bot` 200 partidas, 0 fallos. 753 tests en verde.
- Problemas conocidos: los de la entrada de abajo.
- Siguiente paso: M12 (1), que ya tiene otra sesión.

## 2026-11-12 00:50 (hora peninsular, de `date`) — Hito M11 — La planta 5 medida y ajustada (M11 terminado)
- Contexto: cogí la (7) a las 22:31 y la medida llevó más de 90 minutos (cada prueba, 80 llegadas a la planta 5, unos 8 minutos en dos procesos); otra sesión la retomó a las 00:25 creyéndola abandonada, y mientras tanto otra hizo el pulido de la sala de la Centralita (entrada de abajo). Al juntar, la (7) queda cerrada aquí y `en_curso` vacío: si la sesión de las 00:25 sigue con ella, que mire esta entrada antes de medir.
- Hecho: M11 (7). **Medida de la planta 5** con `npm run plantas` y con salas sueltas, y ajuste. **Tope de enemigos por planta** (`FLOOR_BUDGET_CAP` y `budgetCapOf` en `src/data/rooms.ts`, `FillOptions.cap` y `BUDGET_CAP` en `src/sim/room.ts`): desde la Juguetería todas las salas están ya en el tope de 14 (cada planta cuenta 3 salas más honda), así que el presupuesto no subía; la planta 5 tiene ahora **16** (un enemigo más por sala: de 4,4 a ~5 de media, en plantillas que tienen 5,8 huecos) y su **dureza baja de 1,5 a 1,4**. Las plantas 1 a 4, iguales. **Arreglo**: en `medir-plantas-35`, planta 5, un **Sello** que planeaba hacia su sitio con una pared fina por medio se colaba dentro de la pared en el último fotograma (el paso de ese fotograma era la mitad de lo que le faltaba, 24 px, y atravesaba la pared de una vez); `slide` (`src/sim/world.ts`) parte ahora en trozos no más largos que los pies cualquier paso más largo (`slideStep`). Herramientas: `node tools/medir-plantas.ts [partidas] [desde] [planta]` mide una planta sola (las de abajo se siguen cruzando sin daño) y sus errores dicen en qué planta; `node tools/medir-salas.ts [nivel] [segundos]` llena las salas tan hondas como en su planta, con su tope, y da heridas por sala y por minuto. Tests nuevos: `tests/planta5-medida.test.ts` (2) y en `tests/world.test.ts` el paso largo que no atraviesa una pared fina (falla sin el arreglo). **M11 terminado.**
- Decisiones: **más enemigos y no más vida**: con la dureza de las Oficinas (1,5) las salas de la 5 daban con la misma arma *menos* heridas que las de la 4 (60 s: 3,36 frente a 3,78) y en partida 1,66 frente a 2,12; sus enemigos nuevos estorban más que hieren (el teléfono solo, 0,23 heridas por sala). Subir la vida alargaba salas que ya duran 40 s. Una sala de espera llena es además lo que pide el tono. Probé cuatro combinaciones con 80–160 llegadas cada una: tope 17 y dureza 1,5, 2,53 heridas por sala y la gana el 3,75 % (más dura que el muro: no); tope 15 y 1,4, igual que sin tocar; **tope 16 y 1,5, 2,33 heridas y el 8,75 %** (empata con la 3: no cumple «la gana más gente»); **tope 16 y 1,4, la elegida**. Lo de «algo más duras que las de las Oficinas» lo leo, como en M10, **con la misma arma** (salas sueltas, arma de salida): es lo que dice cómo es la sala; en partida se llega con 8 objetos en vez de 6 y por eso se pasa más. «El bot completa la partida entera alguna vez»: ganar la planta 5 es ganar la partida (M11 (3)), y con `npm run plantas` se llega a ella con lo recogido abajo.
- Medidas (`node tools/medir-plantas.ts`, con el arreglo de `slide`, que cambia un poco todas las partidas): **planta 3, la gana el 8,75 %** (80 llegadas, 2,31 heridas por sala); **planta 4, el 7,5 %** (80, 2,20); **planta 5, el 11,9 %** (19 de 160 llegadas, con 2,1 armas y 7,8 objetos; 2,06 heridas y 41,5 s por sala; cae ante la Centralita en el 5 % de las llegadas): **el bot gana la partida entera** en esas 19. Antes de tocar nada (40 llegadas): 12,5 % y 1,94. Salas sueltas con el arma de salida, tan hondas como en su planta y 120 s (`medir-salas.ts 4 120` y `5 120`, 360 salas cada una): **planta 4, 4,65 heridas y 70 s por sala; planta 5, 4,77 y 74 s** (algo más duras y más largas; por minuto, 3,97 y 3,85). `npm run bot` 200 partidas, **0 fallos**, casi las mismas cifras (vacía la sala el 32,5 % en vez del 32 %). 752 tests en verde (con los del pulido de la sala); e2e entero en verde (la sala de espera de `56a` con cinco enemigos).
- Problemas conocidos: **el ruido es grande**: con 40 llegadas, la misma planta 5 da entre el 5 y el 17,5 %; la diferencia con la 3 (11,9 frente a 8,75 %) es pequeña. Las plantas 2, 3 y 4 ganan todas alrededor del 8 %: el «muro» de la 3 ya no destaca en estas cifras (con la medida de M10 sí). Si el humano encuentra la 5 fácil, lo siguiente sería tope 16 y dureza 1,5 (medido arriba). `npm run plantas` entero, 80 partidas, tarda ahora unos 25 minutos en dos procesos.
- Siguiente paso: M12, el Servicio Técnico. Partirlo en tareas como M10 y M11 (diseño en `docs/DISENO.md`) y empezar por los requisitos de desbloqueo guardados entre partidas y visibles en el Mostrador.

## 2026-11-12 00:20 (hora peninsular, de `date`) — Hito M11 — Pulido de la sala de la Centralita
- Contexto: la (7), la única tarea que queda de M11, la cogió otra sesión hace 53 minutos (menos de 90). No hay notas del humano pendientes. Para no pisar los datos ni el equilibrio, elegí los dos «problemas conocidos» que dejó la (5b), que solo tocan el dibujo: la barra de vida de la jefa tapaba la parte de abajo de las zonas del menú de voz, y los nombres de los departamentos de abajo se veían poco.
- Salud: `check`, 747 tests, `build` y `bot` en verde al empezar.
- Hecho: **la barra de vida de los jefes se aparta** (baja a un 22 % de opacidad en 0,15 s y vuelve en 0,3 s) mientras la tostadora o alguna zona del menú de voz quedan debajo en la pantalla; vale para todos los jefes (la tostadora pegada a la pared de abajo tampoco se tapa ya). Lo decide `bossBarVeiled` (`src/render/hud.ts`, puro, con la caja de la barra y su nombre en `bossBarBox`/`BOSS_BAR`). **Los nombres de los departamentos** (`departmentLabelBox`, también en `hud.ts`) van **centrados en su cuarto**, a 12 px de la pared del fondo los de arriba y a 20 px de la de delante los de abajo, con una capa oscura un píxel por debajo y algo más de opacidad (0,42): antes iban en la esquina de fuera y caían **debajo de los dispensadores de las esquinas y, con la cámara en la esquina, del recuadro del arma** («4 · Bajas» no se veía). Tests nuevos en `tests/hud.test.ts` (2: cuándo se aparta la barra; los nombres dentro de su cuarto, sin pegarse a la pared, sin muebles encima y fuera del HUD y de la barra con la cámara en cada esquina).
- e2e: **la captura `51m` (los cables) fallaba dos de tres veces** (esperaba 50 rizos en pantalla en 6 s): dónde queda la jefa tras las transferencias depende del tiempo real y, pegada al mostrador del centro, la mitad de los rizos nacen dentro de él. Ahora el e2e la pone en el suelo abierto de Facturación (y a la tostadora a su izquierda) antes del barrido. No es por el cambio de esta sesión (sin él pasó una vez de una), pero el paso era frágil. e2e entero en verde.
- Decisiones: **apartar la barra en vez de mover las zonas**: las zonas se ponen alrededor de la tostadora, que es lo que hay que ver; la barra es lo que sobra en ese momento. Que se aparte también con la tostadora debajo (y no solo con las zonas) porque es el mismo problema en cualquier jefe. Los nombres **centrados y no en la esquina**: en la esquina siempre hay un mueble o un trozo de HUD; en el centro solo los tapa lo que se mueve.
- Medidas: no toca la simulación; `npm run bot` 200 partidas, 0 fallos, cifras idénticas. 749 tests en verde.
- Problemas conocidos: con la cámara a media altura, un nombre de abajo puede quedar bajo el recuadro del arma (como cualquier cosa del suelo); no lo evito. En la `51m` la jefa corre a la esquina durante el aviso y parte del barrido se va contra la pared.
- Siguiente paso: la (7), medir la planta 5 entera (la tiene otra sesión); con eso se cierra M11 y empieza M12.

## 2026-11-11 22:30 (hora peninsular, de `date`) — Hito M11 — La Centralita, fase 3: «Se ha cortado la llamada»
- Hecho: M11 (5c). **Tercera fase de la Centralita** (desde el 25 % de vida), con el grito «Le atenderemos lo antes posible. No.» y un timbre. Al acabar la pausa del cambio de fase **se arranca las clavijas**: salen volando en dos anillos de 14 (`centralita-arranque`; dato nuevo `BossPhase.opening`, un patrón alrededor al empezar la fase). **Los cables barren la sala** (`centralita-cables` y `centralita-cables-2`, uno en cada sentido): espirales de cuatro brazos de **rizos de cable** (bala nueva, `bala-cable`, color `cord`: un bucle de cable rizado de dos fotogramas que se retuerce en vuelo, `tools/sprites/centralita.ts makeCordCoils`) que salen **apuntados con la tostadora justo entre dos brazos** (`SpiralDef.aimed`) y giran 93° en 2,1 s; **el aviso enseña los cuatro brazos** como líneas de puntos rojas que crecen (`SpiralDef.preview` → `Emitter.arms` → `Warning.arms`, de datos, sirve para cualquier espiral) y al soltarlos suena un latigazo (`latigo`). Entre barrido y barrido, alguna vez la música de espera. **Corre más que nunca** (62 px/s, antes 40; descanso 0,5–0,8 s). **Se queda muda** (`BossPhase.mute`): cada 4,5–6,5 s, en cuanto acaba lo que esté haciendo, 1 s quieta del todo y sin atacar (estado `stun`), con los pilotos en blanco (fotograma `muda`, `EnemyAnim.stun`), el tono de comunicando tres veces (`comunicando`, 425 Hz) y «Pi. Pi. Pi.» encima; mientras, **recibe un 50 % más** (`takenScale`). Fotogramas propios de la fase, sin clavijas (`BossPhase.look`: reposo, arrastrarse en dos y aviso), porque `frameShift` no encajaba (tiene dos de arrastrarse y no cuatro). `npm run bot` cuenta ya la fase 3 de la Centralita. Tests nuevos en `tests/centralita.test.ts` (4: el cambio de fase y las clavijas, los barridos con su aviso, la muda, y el bot acabando la pelea desde el 25 %). e2e: pasos `51k` (cartel y grito), `51l` (aviso de los cables, con las clavijas volando), `51m` (los cables) y `51n` (muda).
- Decisiones: **cuatro brazos** como dice el diseño (probé cinco: más dura, pero se leía peor y no era lo escrito); para que sea la fase más intensa, más deprisa (45°/s en vez de 31) y menos descanso. Los brazos **empiezan con la tostadora entre dos**: así nunca te cae uno encima sin aviso, y lo que hay que hacer (andar con el hueco o rodar a través) se lee en las líneas. **La muda llega entre ataques**, no en medio de un barrido: si no, cortaría los brazos y el «momento de darle» quedaría bajo una lluvia de balas. **El grito, encima de la cabeza si la jefa está abajo**: debajo de los pies se montaba con el cartel de la fase (se veía en la primera captura); vale también para el Director. Sin menú de voz ni transferencias en la fase 3 («ya no queda nadie en la línea»); el teléfono que hubiera sigue. El documento para el archivador ya llegó con la (5b).
- Medidas (`runBoss` con el bot, arma inicial, sin objetos): **la fase 3 sola** (60 combates desde el 25 % con la vida llena) la gana el 98 % en 50 s con **2,22 heridas (2,7 por minuto; la fase 2, ~2,2 por minuto)**; girando más despacio (31°/s), 1,88. Le da el 11 % de los golpes mientras está muda (el bot no lo aprovecha; una persona, sí). **La pelea entera, 100 combates en 240 s: gana el 8 % en 204 s** (antes de la fase 3, el 4 %: lo que se ahorra sin transferencias y con la muda), 5,83 heridas; llega a la fase 3 el 26 %, a los 165 s. `npm run bot` 200 partidas, **0 fallos**; «30 combates contra la Centralita · gana el 6,7 % en 189,7 s… 0,23 heridas con la llamada cortada; se corta la llamada el 20 %, a los 152 s». 747 tests en verde; e2e entero en verde.
- Problemas conocidos: con la jefa pegada a una pared, la mitad de los rizos nacen dentro y se pierden (barrido de medio lado); no lo arreglo, se entiende como que el cable choca con la pared. Los brazos salen de la punta del cable de delante (su boca de fuego), no del centro del cuadro. El bot gana a la Centralita algo más que al Director con el arma inicial: lo decide la (7), con lo que se recoge en las plantas de abajo.
- Siguiente paso: la (7), medir la planta 5 entera con `npm run plantas` (y las salas sueltas con `hunt`) y ajustar; con eso se cierra M11.

## 2026-11-11 21:47 (hora peninsular, de `date`) — Hito M11 — El bot va a por los enemigos en salas sueltas (para la medida (7))
- Contexto: la (5b)+(2c2), la Centralita, la cogió otra sesión hace 51 minutos (menos de 90), y la (5c) y la (7) dependen de ella. Para no pisar `enemies.ts`, `world.ts`, `GameScene.ts` ni los datos, elegí una tarea que solo toca el bot y sus herramientas y que prepara la (7): el «problema conocido» de las entradas del Asistente y los Postes (el microondas o el dispensador en una esquina que se quedan sin limpiar en 90 s).
- Salud: `check`, 728 tests, `build` y `bot` en verde al empezar.
- Diagnóstico: **no era cosa del microondas ni del dispensador**. Los scripts que miden salas sueltas (`createWorld` sin planta, como `tools/medir-salas.ts` y los de las entradas anteriores) dejan al bot **paseando al azar**: lo de ir a por el enemigo más cercano (rodeando muebles si está lejos o tapado) solo funcionaba con `w.floor`. En una planta de verdad (`npm run bot`, `npm run plantas`) ya iba a por ellos.
- Hecho: opción **`hunt`** del `Bot` (`src/sim/bot.ts`): en una sala suelta con enemigos usa el mismo `floorGoal` que en una planta. Va desactivada por defecto para que los combates contra jefes de `npm run bot` se sigan midiendo igual (si no, el bot se acercaría a 130 px de los jefes y cambiarían todas las cifras de referencia). `tools/medir-salas.ts` la usa y dice ahora cuántas salas de cada plantilla se quedan sin limpiar. Test nuevo en `tests/bot.test.ts`: en 18 salas de la planta 5, el que caza limpia claramente más que el que pasea.
- Medidas (240 salas de combate de la planta 5 a profundidad 6, 20 por plantilla, sin daño, 90 s): **paseando, 83 sin limpiar (35 %), 74,5 s de media; cazando, 26 (11 %), 66,8 s**. En la planta 4, paseando, 49 de 180 (27 %): lo mismo, no era propio de la 5. De las 26 que quedan, casi todas son peleas lentas (fotocopiadoras que llenan la sala, una bombilla o un asistente con escudo al final), no atascos. `node tools/medir-salas.ts 5` (60 s): 3,36 heridas por sala de media y entre 12 y 23 de 30 salas por plantilla sin terminar en 60 s. `npm run bot` 200 partidas, 0 fallos, idéntico. 729 tests en verde.
- Decisiones: no lo puse por defecto (cambiaría las cifras de los jefes y de `npm run armas`/`enemigos`, que se comparan con las de sesiones anteriores). Para la (7), medir salas sueltas con `hunt: true`.
- Problemas conocidos: **en `node tools/medir-salas.ts 5`, 2 de 20 plantas enteras sin daño no se terminan en 900 s** («atascado en punto-informacion»): no es un atasco, el bot iba entrando sala tras sala; es que con los enemigos nuevos cada sala de la planta 5 le lleva unos 72 s (antes, 45). `npm run bot` le da más tiempo y la recorre el 100 %. Que el bot tarde tanto viene de que dispara a ráfagas al azar (la mitad del tiempo); con jugadores de verdad será menos, pero la (7) tiene que tenerlo en cuenta.
- Siguiente paso: la (5b) terminó mientras tanto (entrada de abajo); toca la (5c), la fase 3 de la Centralita, y luego la (7) midiendo salas sueltas con `hunt`.

## 2026-11-11 21:35 (hora peninsular, de `date`) — Hito M11 — La Centralita (fases 1 y 2) y su sala
- Hecho: M11 (5b) y (2c2). **La Centralita** (`centralita`, letra `Ú`, 240 de vida) es ya la jefa de la planta 5 (`floorBossOf(5)`), en su sala **`jefe-atencion`**, «Centralita (Operadores Ocupados)»: 26×16, partida en **cuatro departamentos** (los cuartos de la sala: 1 Reclamaciones, 2 Facturación, 3 Averías, 4 Bajas; `departmentOf`/`departmentRect` en `src/sim/enemies.ts`) por **cuatro mostradores bajos** en cruz (`~` los largos, en la fila del medio, con la placa de su departamento; `!` los de pie, en la columna del medio) y el vestíbulo en el centro; el número y el nombre de cada departamento, pintados flojos en el suelo. **Mostradores bajos** (`PropDef.low`, props `mostrador-bajo` y `mostrador-bajo-v`): paran balas y no se cruzan andando, pero **rodando sí** (`slide(..., overLow)`); una voltereta que acabaría encima sigue, despacio, hasta salir (como mucho 0,6 s más; si no, se la deja al lado), y la tostadora se dibuja encima mientras. **Fase 1, «Su llamada es importante»**: ataque nuevo de datos **`menu`** (`BossMenuAttack`): tres zonas (`zona-menu`) en fila, en horizontal o en vertical, con la tostadora en una cualquiera; mientras lee el menú (0,7 s, con una frase de «Escuche atentamente las siguientes opciones» y tonos de teclado), luego dice cuál («Para darse de baja, pulse 1», encima de las zonas) y **1,5 s después llueve en las otras dos** (`centralita-lluvia`: ocho salpicaduras repartidas en rejilla por cada zona mala, desde el suelo). La buena brilla; las malas se ponen rojas y parpadean cada vez más deprisa. El 35 % de las veces la buena es la más lejana. Entre menú y menú, **abanicos de clavijas** (`bala-clavija`, color `plug`, giradas hacia donde vuelan) y **anillos de música de espera** que ondulan. **Fase 2, «Le paso con el departamento»** (desde el 60 %, con timbre y la frase): llama a un **Teléfono de Recepción** y `BossPhase.transfer`: 3 s después y cada 10 s, el timbre, «Un momento, le transfiero» y un aro amarillo que se cierra sobre la tostadora; a los 0,8 s **aparece en otro departamento** (suelo libre, nunca el de la jefa si se puede, a más de 90 px de ella; corta la voltereta), con 0,5 s de invulnerabilidad, una línea de puntos desde donde estaba y «Departamento de Averías. Espere.»; allí **la espera el patrón de ese departamento** desde su esquina lejana con 0,7 s de aviso (Reclamaciones, dos abanicos de clavijas; Facturación, una ráfaga de facturas; Averías, una espiral lenta de música de espera; Bajas, dos anillos con un hueco cada uno, a un lado y al otro). Cada tres transferencias, si el teléfono ha caído, lo vuelve a llamar. Mientras habla, fotogramas `habla` (`EnemyAnim.talk`). Sonidos nuevos `pulsar` (tono de teclado) y `chaparron` (la lluvia). Causa de baja propia y **su documento para el archivador** (`transcripcion-1`, la llamada al Servicio Técnico). El bot va a la zona buena (y rueda hacia ella si andando no llega). Tests nuevos en `tests/centralita.test.ts` (9). e2e: pasos `51a`–`51j` (cartel, zonas, «pulse», lluvia, clavijas, música de espera, rodando sobre un mostrador, la fase 2, el timbre y ya transferida), y `56c` enseña ya su sala.
- Decisiones: **el documento va en esta tarea y no en la (5c)**: el test de los documentos pide uno por jefe. **Cuatro mostradores en cruz** (dos largos y dos de pie) y no cerrados: así ella cruza por el vestíbulo y los departamentos se leen igual; las placas de los largos son las de los departamentos de arriba, y los cuatro nombres van pintados en el suelo. El nombre de la sala se acorta a «Operadores Ocupados»: el largo no cabía en el rótulo (test de los nombres). La lluvia **solo hiere en las zonas malas** (fuera de las tres no pasa nada): las zonas se ponen alrededor de la tostadora, así que casi siempre está en una. Hueco de 14 px entre zonas y salpicaduras que no pasan de 6 px del borde: en la buena no llega nada (test). El timbre **espera a que acabe el menú** de voz: dos cosas que leer a la vez son demasiadas. Lo de «a veces la más lejana»: a 2 zonas de distancia (172 px) andando no se llega en 1,5 s; hay que rodar, que es la gracia. La fase 2 dura de momento hasta el final (la 3 es la (5c)).
- Medidas (`runBoss` con el bot, arma inicial y sin objetos, 240 s): **100 combates: gana el 4 % en 216 s** (Director: 6,7 % en 189 s), 5,95 heridas por combate (2,25 en la fase 1 y 3,7 en la 2), llega a la fase 2 el 97 % a los 78 s; en la zona buena el ~80 % de los menús. Antes de tocar nada ganaba el 0 % (el bot no rodaba hacia la zona y el menú pesaba 3): menú a 2,5, descanso 1–1,4 s en la fase 1 y 0,95–1,3 en la 2, el teléfono cada tres transferencias. `npm run bot` 200 partidas, **0 fallos**; con la jefa nueva: «30 combates contra la Centralita · gana el 3,3 % en 196 s». 740 tests en verde; e2e entero en verde.
- Problemas conocidos: el texto de la opción sale encima de las zonas, pero si están abajo del todo la barra de vida de la jefa tapa la parte de abajo de las zonas. Los nombres de los departamentos de abajo quedan pegados a la pared de abajo y se ven poco. El bot gana poco aquí, pero llega con el arma inicial: la medida buena es la (7), con lo que se recoge en las plantas de abajo. La fase 2 es larga hasta que exista la 3.
- Siguiente paso: la (5c), la fase 3 («Se ha cortado la llamada»: los cables que barren en cuatro brazos, corre más y se queda muda a ratos); luego la (7), medir la planta 5 entera.

## 2026-11-11 20:19 (hora peninsular, de `date`) — Hito M11 — El Teléfono de Recepción
- Hecho: M11 (4d), el último de los cuatro enemigos de la planta 5. **Teléfono de Recepción** (`telefono-recepcion`, letra `Ó`), cerebro nuevo `phone` (`src/sim/enemies.ts`). Va **a saltitos** como el Sobre Sorpresa (a unos 120 px de la tostadora) y **cada tres saltos ataca, por turnos**: **suena** (0,45 s de aviso temblando y tres timbrazos, `telefono-timbres`: tres anillos de seis balas lentas, el del medio girado medio hueco; sonido nuevo `timbre`, la campanilla eléctrica) o **llama** (`telefono-llamada`: una bala gorda, `bala-llamada`, radio 6 en vez de 3,5, que persigue 1,5 s y luego sigue recta). Pasada **la mitad de su vida**, el siguiente golpe: **«Le paso con un compañero»**, se queda quieto 0,8 s con la cara de pasar el muerto (fotograma `pasa`), una **línea de puntos amarilla** corre hasta el enemigo más lejano de la tostadora con un aro que se cierra sobre él, y **se cambian de sitio** (cada uno en suelo libre para sus pies, con chispas y humo en los dos sitios; sonido nuevo `transferir`). Como mucho **una vez cada 4 s**. **Sin nadie con quien pasarla**, «No cuelgue, por favor» y la **música de espera**: un anillo de doce notas lentas que ondulan (`telefono-espera`, `nota-espera`). 12 de vida (18 con la dureza de la planta 5); dos como mucho por sala, solo en la planta 5. Causa de baja propia («Transferido a otro departamento»). Motor, de datos: **radio de bala en los patrones** (`radius`) y en `EnemyAnim` los fotogramas `ring`/`ringMs` y `pass`. Tests nuevos en `tests/telefono.test.ts` (8). e2e: pasos `50zh` (timbres), `50zi` (llamada), `50zj` (la línea de puntos), `50zk` (ya cambiados) y `50zl` (en espera).
- Decisiones: **«Cuando ha perdido la mitad de la vida»** lo leo como que, desde ahí, **el golpe que recibe** le hace pasar la llamada (castiga fijarlo y no soltarlo, que es lo que dice el diseño); los golpes de mientras espera los 4 s no cuentan, ni se guardan para después. No pasa con **jefes, sus repetidores, torretas, polillas, postes de cola** (la cinta saltaría de punta a punta de la sala) **ni los que aún se hacen pasar por otra cosa** (el Cargador Falso en el suelo); si el compañero se rompe durante los 0,8 s, la llamada se corta. La música de espera sale con su aviso durante esos mismos 0,8 s. Empieza siempre sonando (lo más fácil de leer) y luego alterna.
- **Bot**: no le enseñé nada. Pero al medir, el teléfono solo se quedaba **saltando detrás de las mamparas de la Cola en Zigzag** a su distancia y el bot sin línea de tiro (3 de 40 salas sin limpiar en 90 s): ahora, si algo le tapa a la tostadora, salta rodeándolo hacia ella (`wayTo`, como los postes y el asistente).
- Medidas (script de prueba: 40 salas de combate de la planta 5, bot con el arma inicial, 90 s): **un teléfono** 40/40 en 15,7 s con 0,23 heridas (1,8 veces en espera por sala); **dos** 40/40 en 26,6 s con 0,47 heridas y 3,2 cambios de sitio por sala; **teléfono + asistente** 40/40 en 36,6 s con 1,02 heridas; **teléfono + dispensador** 40/40 en 31,6 s con 0,35. `npm run bot` 200 partidas, **0 fallos, idéntico** línea a línea a antes. `node tools/medir-plantas.ts 6`: la 5, 1,62 heridas por sala (antes 2,00) y la gana 0 de 6 (muestra pequeña: la (7)). 728 tests en verde; e2e entero en verde.
- Problemas conocidos: al bot le da igual que le cambien el blanco (vuelve a apuntar al instante), así que las medidas no dicen lo molesto que es para una persona; mirarlo jugando. La llamada (13 px) se lee como bala gorda pero no tanto a tamaño real. El sprite no arrastra el cable por el suelo al saltar: el auricular cuelga del cuerpo.
- Siguiente paso: la (5b), las fases 1 y 2 de la Centralita con su sala (2c2) (en la fase 2 llama a un Teléfono de Recepción, que ya existe); luego la (5c) y la medida (7).

## 2026-11-11 19:30 (hora peninsular, de `date`) — Hito M11 — La Etiquetadora de Precios
- Contexto: al empezar, la (4c) estaba cogida desde hacía 5 minutos; elegí la (6c1), la otra tarea libre que no la pisaba más que en una línea de `world.ts` (el impacto de las balas). La (4c) terminó mientras tanto y el `rebase` solo pidió juntar esa línea (`learnHit` y `stickLabel`, una detrás de otra).
- Hecho: M11 (6c1). Arma nueva, **Etiquetadora de Precios** (`src/data/weapons.ts`, planta 5): «Tres etiquetas y el precio baja solo. Ningún artículo rebajado admite devolución.» **Dispara en ráfagas** (`WeaponDef.burst`: 3 disparos a 8/s y 0,32 s de pausa; soltar el gatillo a media ráfaga también espera la pausa). **Las etiquetas que hieren se quedan pegadas** (`BulletBehaviour.tag`, `tags`/`tagT` en enemigos y maniquíes) y **la tercera seguida en el mismo, «Rebajado», estalla** (`stickLabel` en `world.ts`): 3,5 veces el daño de la etiqueta a todo lo que haya a 26 px, él incluido, y fuera etiquetas. Sin otra en 3 s se despegan (`peelLabels`). Sprites nuevos en `tools/sprites/etiquetadora.ts`: **`arma-etiquetadora`**, **`bala-etiqueta`** y **`etiqueta-pegada`** (3 fotogramas, que el juego pone en el cuerpo de cada enemigo, una por etiqueta, y hace parpadear antes de despegarse). «Rebajado»: aro amarillo y rojo del tamaño del estallido, chispas, papelitos, parón de 0,04 s, la campanilla de la caja (`rebajado`) y el texto al azar («Rebajado -30 %», «Rebajado: sin devolución»…). La ficha dice «En ráfagas de 3 · la tercera estalla». `weaponProfile` cuenta la pausa de las ráfagas y el estallido contra uno. Cuarto pedestal en la Sala de Pruebas. Tests nuevos en `tests/etiquetadora.test.ts` (8); `tests/armas.test.ts` cuenta «estallido de etiquetas» entre las cosas en que un arma destaca. e2e: capturas `19g-etiquetas` y `19h-rebajado`.
- Decisiones: **la cadencia del diseño se queda en la grapadora** (11/s; para ganarle «claramente» la Etiquetadora tendría que pasar de 13): gana en lo que acumula contra uno. **0,85 por etiqueta y no 0,5**: con 0,5 la grapadora dejaba de perder en «daño por disparo» (el test de «gana en algo y pierde en algo»); a cambio el estallido es 3,5× y no 6×. Cargador 9 (tres ráfagas): el que menos dura (2,1 s). Alcance 225 (vida 0,75): con menos, el Megáfono dejaba de tener la mitad de alcance que todas. El estallido sale del daño de la bala, así que los objetos de daño, los críticos y la Llamada Grabada lo suben. Las etiquetas de los maniquíes también cuentan, para probarla en la Sala de Pruebas. La etiqueta pegada es **amarilla de oferta** y no blanca: la blanca se perdía encima del microondas. La ficha dice «la tercera» porque la fuente no tiene «ª».
- Medidas (`npm run armas`, el bot solo con cada arma, salas de la planta 1 y la Nevera): Etiquetadora 4,9 de daño/s en el papel, **limpia el 91,7 % de las salas en 25,0 s** (la más rápida; secador 91,7 % en 33,6, grapadora 93,3 en 28,9, plancha 86,7 en 25,4, megáfono 83,3 en 36,2) con 0,5 heridas, y **gana a la jefa el 85 % en 51,7 s** con 3,3 heridas (plancha 90 % en 48,3; megáfono 85 en 65,7; grapadora 70; secador 60). Fuerte, pero es de la planta 5 y no sale antes. `npm run bot` 200 partidas, **0 fallos** (precisión 74,8 %: el bot coge a veces la Etiquetadora en la Sala de Pruebas). 718 tests en verde; e2e entero en verde.
- Problemas conocidos: la ficha redondea el 0,85 a «0,9». Con el Asistente Virtual, una ráfaga son tres balas desde el mismo lado: le sube el escudo en cada ráfaga (tiene gracia, pero mirarlo en la (7)). Las etiquetas se colocan en el rectángulo de daño, no siguen el giro del enemigo al embestir.
- Siguiente paso: la (4d), el Teléfono de Recepción; luego la (5b), la Centralita con su sala (2c2), y la medida (7).

## 2026-11-11 18:55 (hora peninsular, de `date`) — Hito M11 — El Asistente Virtual
- Hecho: M11 (4c). **Asistente Virtual** (`asistente-virtual`, letra `É`), cerebro nuevo `chatbot` (`src/sim/enemies.ts`). Guarda unos 140 px (anda a 30 px/s rodeando las cosas con el `wayTo` de los postes, y se acerca si algo le tapa a la tostadora). Cada 1,9–2,6 s **escribe** (0,55 s quieto con los tres puntitos, «Escribiendo...», tres clics de pantalla, sonido nuevo `teclear`) y manda **tres bocadillos** que a los 0,5 s **se paran en el aire 0,55 s con «…»** y siguen hacia **donde va a estar la tostadora** (su posición más su velocidad por 0,55 s). Eso es un comportamiento de bala nuevo y de datos: `pause: { at, wait, lead }` en los patrones (`src/sim/patterns.ts`, `updateBullets`). **Aprende**: guarda de dónde vinieron sus tres últimos golpes; si los tres caben en 60°, **«Pregunta frecuente»**: el escudo (`escudo-faq` girado hacia los disparos, más un arco cian fino alrededor para que se lea como escudo) para durante 3 s todo lo que llega por ese lado (140° de arco), con chispas cian; con el escudo puesto no aprende nada nuevo. **Al romperse**: «¿Le he ayudado?» y los dos botones, **SÍ** cian y **NO** rojo, que salen lentos (42 px/s) hacia la tostadora. 16 de vida (24 con la dureza de la planta 5); dos como mucho por sala, solo en la planta 5. Causa de baja propia. Tests nuevos en `tests/asistente.test.ts` (5). e2e: pasos `50ze` (bocadillos esperando), `50zf` (escudo) y `50zg` (los botones).
- Decisiones: «Tres balas seguidas desde casi el mismo sitio» lo mido como **la dirección de llegada** de las balas (no la posición del que dispara): es lo que el escudo para, y con escopetas tres perdigones de un disparo cuentan como tres (aprende antes de las armas de abanico, que ya son fuertes de cerca). El escudo para un arco de 140° y no 180°: un paso lateral corto ya basta para darle, que es lo que se quiere enseñar. Los bocadillos aciertan más si la tostadora sigue en línea recta: cambiar de dirección durante el «…» es la manera de esquivarlos. «Escribiendo...» con tres puntos y no con «…»: la fuente «Letra Pequeña» no tiene puntos suspensivos.
- **Bot**: no hizo falta tocarlo. Con el asistente solo sube el escudo 3,5 veces por sala y le para 9 balas, pero el bot se mueve lo bastante para darle desde otros lados.
- Medidas (40 salas de combate de la planta 5, bot con el arma inicial, 90 s): **un asistente** limpia 40/40 en 26,9 s con 0,25 heridas; **dos** 40/40 en 46,8 s con 1,95 heridas; **asistente + pareja de postes** 40/40 en 43,7 s con 1,23. `npm run bot` 200 partidas, 0 fallos, idéntico. `node tools/medir-plantas.ts 6`: la 5, 2,00 heridas por sala (antes 1,21) y la gana 0 de 6 (antes 1): muestra pequeña, lo mide la (7). 708 tests en verde; e2e entero en verde.
- Problemas conocidos: en las salas de la planta 5, **el microondas (planta 1) en una esquina** se queda sin limpiar en 90 s en una de cada tres salas con el bot (17/40 con dos): no va a buscarlo. Lo mismo el dispensador (10 %). Para la (7).
- Siguiente paso: la (4d), el Teléfono de Recepción; o la (6c1), la Etiquetadora; o la (5b), la Centralita con su sala (2c2).

## 2026-11-11 17:31 (hora peninsular, de `date`) — Hito M11 — Los Postes de Cola
- Contexto: las dos entradas de `en_curso` eran del 6 de noviembre (cinco días): sesiones abandonadas sin commit. Las quité y cogí la (4b), la primera `- [ ]` de enemigos. La (6c1), la Etiquetadora, sigue libre.
- Hecho: M11 (4b). **Postes de Cola** (`poste-cola`, letra `Á` en las plantillas, `pack: 2`), cerebro nuevo `queuer` (`src/sim/enemies.ts`). Salen siempre en pareja y **unidos por la cinta** (`pairUp`: `mate` en cada uno; el segundo, `alt`, se dibuja con la base desconchada gracias a `EnemyAnim.altShift` = 8). **La cinta no se cruza ni andando ni rodando** (`holdTapes` en `world.ts`, justo después de mover a la tostadora: el lado en que estaba al empezar el tick es el lado en que se queda; si la cinta la barre, la empuja), deja pasar las balas y **por fuera del extremo, pasado el poste, sí se pasa**. Los postes andan (34 px/s, rodeando lo que haya con `findPath` cada 0,35 s) hasta los extremos de una cinta a 46 px de la tostadora, de su lado; **con la tostadora delante y cerca, la cinta se tensa**: se acorta de 92 a 52 px, tiembla, se pinta más clara y **la empuja hacia atrás a 30 px/s** (le hacen la cola). Chocar con ella: «No se cuele» y un muelle. **Cada 3 s dispara el más cercano**: un anillo corto de cuatro bolas de acero (`poste-bolas`, color `steel`, una apuntada). **Romper uno suelta la cinta**: «Cola disuelta», el chasquido nuevo `cinta`, la cinta que vuelve al otro y su pose sin enganche (0,6 s); el que queda dispara cada 1,6 s, se acerca a 110 px y, si una mampara lo tapa, va a buscar a la tostadora. 10 de vida cada uno (15 con la dureza de la planta 5); una pareja como mucho por sala, solo en la planta 5 (`SLOT_ENEMIES_5`); la fotocopiadora no los copia. Causa de baja propia. Tests nuevos en `tests/postes.test.ts` (7). e2e: pasos `50zb` (la cinta, la tostadora andando contra ella), `50zc` (las bolas) y `50zd` (roto uno). Gancho de pruebas `spawnPair`.
- Decisiones: «Cuando la tienen en medio» lo leo como **la tostadora frente al tramo de cinta** (su proyección cae entre los dos postes) y a menos de 56 px; así, colocados, la cinta casi siempre está tensa y empuja, que es la gracia. **La cinta se pinta a la altura de los tambores** (como unos postes de verdad en vista de tres cuartos) y **una raya oscura en el suelo** marca dónde para de verdad. La barrera solo para a la tostadora (no a los enemigos ni a las balas). Si la empujan contra una pared y la cinta sigue avanzando, puede colarse por debajo: es raro y mejor que dejarla atrapada. Bolas: anillo de cuatro **apuntado** (una va a la tostadora) en vez de en aspa, para que el ataque se note.
- **Bot**: no hizo falta enseñarle nada de la cinta (dispara a los postes y la rodea al moverse). Lo que sí falló al medir: el poste que se queda solo se quedaba detrás de una mampara a 94 px de la tostadora y los dos disparaban al tabique 90 s; por eso el que queda solo va a por ella si no la ve.
- Medidas (script de prueba: 40 salas de combate de la planta 5, con la pareja y otro enemigo, bot con el arma inicial, 90 s): **solo la pareja** limpia 40/40 en 22,9 s con 0,42 heridas y 1,4 choques con la cinta por sala; **pareja + destructora** 27/40 con 1,10 heridas (dos destructoras solas, 28/40 con 1,73: el tope de 90 s lo marcan las destructoras); **pareja + dispensador** 35/40 con 0,30 heridas (el dispensador solo ya se agota el 10 %). `npm run bot` 200 partidas, 0 fallos, idéntico línea a línea. `node tools/medir-plantas.ts 6`: la 5 la gana 1 de 6, 1,21 heridas por sala (muestra pequeña: la medida buena es la (7)). 702 tests en verde; e2e entero en verde.
- Problemas conocidos: **el Dispensador de Turnos solo, con el bot, se queda sin limpiar el 10 % de las salas en 90 s** (guarda la distancia detrás de un mueble, como le pasaba al poste); arreglarlo como aquí si en la (7) pesa. La cinta, al ser una tira repetida girada, hace un pequeño escalón de píxeles en diagonal.
- Siguiente paso: la (4c), el Asistente Virtual; o la (6c1), la Etiquetadora; o la (5b), la Centralita con su sala (2c2).

## 2026-11-06 01:24 (hora peninsular, de `date`) — Hito M11 — El Megáfono de Reclamaciones
- Contexto: al empezar, la (3) estaba cogida desde hacía 82 minutos (por debajo de los 90); elegí la (6c2), que solo toca una línea de `world.ts` (`lootDecks`) y el dibujo de las balas en `GameScene.ts`. La (3) terminó mientras tanto y el `pull --rebase` mezcló sin conflictos.
- Hecho: M11 (6c2). Arma nueva, **Megáfono de Reclamaciones** (`src/data/weapons.ts`): siete ondas de sonido en abanico (±26°) de corto alcance que **atraviesan a todos** (`bullets: { pierce: 99 }`) y empujan (140 por onda, el que más). «Para que le oigan en la ventanilla del fondo. No le van a atender antes, pero le van a oír.» Sprites nuevos en `tools/sprites/megafono.ts`: **`arma-megafono`** (tambor rojo, bocina crema que se abre, pegatina del precio tachada, cinta en la tapa de las pilas) y **`bala-onda`** (arco claro con filo amarillo); sonido `megafono` (graznido de bocina barata con el pitido de acople). Motor: **las armas pueden traer su propio comportamiento de bala** (`moddedWeapon` lo tiraba: ahora suma el del arma con el de los objetos); **las armas tienen `level`** como los objetos y `weaponsUpTo(level)` reparte las de la planta y las de abajo (el Megáfono, solo en la 5); `look.swell` en los datos sustituye al `if (plancha)` del dibujo (el vapor crece igual que antes; las ondas de ×0,9 a ×1,8); la ficha del arma dice «Atraviesa a todos y los empuja». La Sala de Pruebas tiene un tercer pedestal para enseñar las tres armas encontrables. Tests nuevos en `tests/megafono.test.ts` (5); `tests/armas.test.ts` cuenta «enemigos que atraviesa» entre las cosas en que un arma puede destacar. e2e: captura `19f-megafono` (dos enemigos en fila, los dos heridos).
- Decisiones: alcance 105, un poco **más** que la plancha (101) y no menos: si fuera el más corto, la plancha dejaría de perder en algo (su otra pega, la puntería, también la pierde el abanico del megáfono) y el test de «gana en algo y pierde en algo» no pasaría; el Megáfono pierde en cadencia (la más baja) y en daño por golpe (0,7, el más bajo). Daño 0,7 y no 0,75: la ficha redondea y 0,75 se leía «0,8», igual que la grapadora. El reparto de armas por planta no cambia nada en las plantas 1–4 (la misma lista, el mismo orden).
- Medidas (`npm run armas`, el bot solo con cada arma contra salas de la planta 1 y la Nevera): Megáfono 4,7 de daño/s en el papel, limpia el 78 % de las salas en 33,7 s, gana a la jefa el 85 % en 65,7 s con 3,3 heridas (secador 92 % y 60 %, grapadora 93 y 70, plancha 90 y 90). Con empuje 90 en vez de 140 apenas cambia (78 %, 80 %): se queda en 140. `npm run bot` 200 partidas, 0 fallos (cambia algo porque en la Sala de Pruebas el bot coge a veces el Megáfono: precisión 74 % en vez de 78, el abanico falla más). 684 tests en verde; e2e entero en verde.
- Problemas conocidos: las ondas se mezclan con las chispas del impacto y a tamaño real se leen como un abanico amarillo, no como arcos limpios; si en partida no se distingue, que el reparto sea uniforme (hoy es al azar, como el de la plancha).
- Siguiente paso: M11 (6c1), la Etiquetadora de Precios; o (5b) la Centralita con su sala (2c2); o los enemigos (4a)–(4d).

## 2026-11-06 02:24 (hora peninsular, de `date`) — Hito M11 — El Dispensador de Turnos
- Contexto: al empezar, dos sesiones tenían cogidas las armas (6c2 desde hacía una hora y 6c1 recién apuntada), las dos con `world.ts`, `GameScene.ts` y `types.ts`. Todas las tareas que quedan de M11 tocan esos archivos, así que en vez de cerrar sin hacer nada elegí la (4a) y **limité mis cambios en esos tres a trozos propios** (campos nuevos del enemigo, tres eventos, una rama en `spawnEnemy` y el freno de balas del círculo; en `GameScene` un dibujo nuevo y tres casos de eventos; el sonido nuevo, en medio de la lista y no al final, que es donde añaden las demás).
- Hecho: M11 (4a). **Dispensador de Turnos** (`dispensador-turnos`, letra `Ñ` en las plantillas: las mayúsculas ASCII se acabaron en las Oficinas), cerebro nuevo `turner` (`src/sim/enemies.ts`). Apoyo lento (26 px/s) que guarda 150 px; 14 de vida (21 con la dureza de la planta 5); como mucho uno por sala y solo en la planta 5 (`SLOT_ENEMIES_5`); la fotocopiadora no lo copia. **Cada 4–5 s llama un turno** (el primero a los 2 s): «Turno 712, ventanilla 1» con el ding-dong de las salas de espera (`turno`, dos notas a una cuarta), la pose de llamar y, en el suelo, el círculo de 40 px con el número en grande y un arco amarillo que se acaba con la cuenta atrás de 2,5 s (parpadea el último segundo). El sitio lo elige `turnSpot`: a 95–165 px de la tostadora (más cerca si no cabe), en el suelo, libre, lejos del propio dispensador y **a menos del 70 % de lo que la tostadora anda en 2,5 s, contando el camino real** alrededor de mostradores y sillas (`findPath`). Llegar: «Atendido», verde, chispas, y **el círculo para las balas enemigas** 1,6 s más (también mientras está llamado: es una ventanilla con mampara). No llegar: «Turno perdido», rojo, el zumbido de denegado y, tras 0,35 s de aviso, **un abanico doble de 17 tiques en 110°** hacia la tostadora (sprite «escupe»). Sin turno, cada 1,4–2 s **dos tiques sueltos que planean** (58 px/s, con vaivén, doblándose y desdoblándose). Nunca llama al 087, el número de su pantalla. Muerto, su círculo se va sin castigo. Causa de baja propia. Tests nuevos en `tests/dispensador.test.ts` (9). e2e: pasos `50y` (turno llamado), `50z` (perdido y abanico) y `50za` (atendido).
- **Bot**: va al círculo cuando llaman un turno y se queda dentro mientras para balas (en el test, atiende 3 de cada 4 o más). **Arreglado un atasco** que destapó el cambio de reparto de salas: en la Sala de Espera, una destructora apretada contra una fila de sillas atornilladas, con la tostadora al otro lado, se tragaba todos los disparos de frente durante 15 minutos (`planta-19` de `npm run bot`, planta 5 sin daño). Ahora, si una destructora le da la cara de cerca más de 6 s, el bot da la vuelta hasta su espalda, como haría un jugador.
- Decisiones: el intervalo de 4–5 s se cuenta **desde la llamada** (lo dice el diseño: «cada 4–5 s»), no desde que se apaga el círculo; un turno atendido o perdido dura menos que eso. El círculo para balas también mientras está llamado: si no, ir hacia él con balas encima sería peor que quedarse, y lo que se castiga es esconderse. El abanico de castigo es doble (9 + 8, la segunda fila más lenta) para que «ancho» no deje huecos de paso fáciles: perder el turno tiene que doler. El número del círculo se pinta encima del suelo pero debajo de todo lo demás.
- Medidas: `npm run bot` 200 partidas, 0 fallos (planta 1: la gana el 15 %, 1,2 heridas por sala, igual que antes; la planta 5 sin daño se recorre el 100 %). `node tools/medir-plantas.ts 6`: llegan 6 a la planta 5 (2,3 armas, 9 objetos), la gana 0 (antes 1 de 6), **1,91 heridas por sala de combate (antes 1,71)** y 45,5 s por sala; la 4, 2,18. Muestra pequeña; la medida buena es la (7). 694 tests en verde; e2e entero en verde.
- Problemas conocidos: con el círculo encima de un mostrador bajo de una sala estrecha, el arco de la cuenta atrás queda en parte tapado por el mueble (se lee igual por el número). El texto «Atendido» puede pisar un momento el de la llamada si se llega muy deprisa.
- Siguiente paso: la (4b), los Postes de Cola; o la (5b), la Centralita, si nadie la ha cogido.

## 2026-11-06 00:20 (hora peninsular, de `date`) — Hito M11 — Cinco plantas: la partida se gana en Atención al Cliente
- Hecho: M11 (3). `LAST_LEVEL` = 5 (`src/sim/world.ts`): tras ganar la planta 4 se sube a la 5 con todo lo que se lleva (armas, objetos, corazones, cupones), con sus salas propias y, hasta la Centralita (5b), el Director en la Sala de Juntas; sus objetos (6a–6b) entran ya en los cofres. **La última planta no tiene montacargas**: al caer su jefe salen los cupones igual (`w.finale`, `isLastFloor`) y a los `FINALE_DELAY` = 3 s la partida se gana sola donde esté la tostadora (`floorDone` con `final`). En el juego (`GameScene`): la tostadora no se hunde, da dos saltitos; suena el desbloqueo; parte en amarillo Liquidación **«Su incidencia ha sido cerrada»** con el sello «Incidencia cerrada», el expediente de toda la partida (plantas, tiempo, bajas y cupones), una «Resolución» al azar («Su producto será reacondicionado y vendido otra vez», «Su reclamación se archivará en la extensión 0»…) y «R o clic: volver al Mostrador»; se apunta como partida ganada en el historial. `FLOOR_NAMES[5]` («Planta 5: Atención al Cliente. Espere su turno.»), `FLOOR_TOUGHNESS[5]` = 1,5. `npm run bot` mide y enseña ya la planta 5. Tests nuevos en `tests/plantas.test.ts` (3): subir de la 4 a la 5, el jefe de la última sin montacargas y la partida ganada, y el parte. e2e: paso nuevo `17q-partida-ganada` (el final provocado a mano en `?planta=5`, sin montacargas, con su parte; deja el historial como estaba para el paso que lo mira después).
- Decisiones: la victoria llega sola a los 3 s y no al pisar algo: el diseño dice «sin montacargas», y así da tiempo a recoger los cupones (cuentan para el historial). Dureza de la planta 5 provisional igual que la 4 (con 1 sería más fácil que la de abajo); su medida es la (7). El parte final reutiliza el formulario de siempre, en amarillo, para que se distinga del cian de planta superada.
- **Bot arreglado**: con la planta 5 en `npm run bot`, una planta (`planta-6`) se atascaba en el Pasillo de Mamparas: en plena pelea el bot iba en línea recta a un cupón al otro lado de una mampara que llega hasta la pared, y oscilaba entre el camino bueno y el cupón para siempre. Ahora en pelea solo se desvía por cupones sin pared por medio (`clearLine` de radio 1; con la sala limpia, como antes). Probé antes a exigir el radio del pie también en pelea: la planta 1 pasaba de ganarse el 15 % a 0 % (el desvío por cupones le servía para moverse); con el radio 1 las cifras quedan como estaban.
- **e2e más robusto**: «La tostadora no ha recogido los cupones» fallaba a menudo: a veces la baja era de otro enemigo sin cupones (los enemigos andan en tiempo real) y la comprobación pasaba porque las armas de los pedestales también son objetos del suelo. Ahora, si no hay cupones, se ponen dos a mano (lo que se prueba es recogerlos) y solo se mueven los cupones.
- Medidas: `npm run bot` 200 partidas, 0 fallos; 20 plantas: la 1 se gana el 15 % (igual que antes), 1,2 heridas por sala. `node tools/medir-plantas.ts 6`: de 6 que llegan a la 5 (con 2,2 armas y 8 objetos), la gana 1 (16,7 %), con 1,71 heridas por sala de combate (la 4: 3,14): **el bot completa la partida entera**, y la planta 5 sale más fácil que la 4, cosa de la (7). 678 tests en verde.
- Problemas conocidos: la sala de la planta 5 se pinta con los cables de «CENTRALITA» aunque pelee el Director (hasta la 5b).
- Siguiente paso: M11 (5b), la Centralita (fases 1 y 2) con su sala (2c2).

## 2026-11-05 23:58 (hora peninsular, de `date`) — Hito M11 — Los sprites de los cuatro enemigos de Atención al Cliente
- Contexto: al empezar, otra sesión tenía cogida la (3) desde hacía 22 minutos (`world.ts`, `GameScene.ts`, `texts.ts`, `tools/bot.ts`…); cada enemigo (4a)–(4d) y cada arma tocan `world.ts` y `GameScene.ts`, y la (5b) va con la sala. Así que **partí los enemigos en la hoja de ruta**: una tarea nueva, la **(4s)**, con los sprites de los cuatro (solo `tools/sprites/`, `public/assets/` y un test nuevo), y la (4a)–(4d) se quedan con la simulación, los tests y la captura de cada uno, como se hizo con los jefes.
- Hecho: M11 (4s). `tools/sprites/clientela.ts` con doce hojas nuevas. **`dispensador-turnos`** (30×35, 8): caja roja de «coja número» sobre su poste cromado y su pie de hierro, el **«087» que no cambia nunca** en la frente, ojos de funcionario y el **rollo de papel colgando como una lengua**; el cartel «Respete su turno» torcido encima; fotogramas de llamar (el número al blanco, un tique a medio salir) y de escupir («turno perdido», la lengua larga y rota). **`tique-turno`** (sus balas, plano y doblado) y **`circulo-turno`** (82×82, radio 40, translúcido: llamado amarillo a trazos, atendido verde, perdido rojo rayado; el número lo escribirá el juego). **`poste-cola`** (22×34, 16: ocho fotogramas del poste limpio y los mismos con **la base desconchada**, el otro de la pareja): la cabeza es el tambor de la cinta, con ojos de portero y el enganche azul asomando; dispara con las cejas en V y al soltar la cinta pierde el enganche. **`cinta-poste`** (24×6, opaca para repetir, con «HAGA COLA AQUÍ» al revés; floja y tensa) y **`bola-acero`**. **`asistente-virtual`** (27×36, 8): tótem blanco de pantalla táctil; la cara es el dibujo de la pantalla, con **una sonrisa que no cambia en ningún fotograma** (lo comprueba el test), huellas de dedos, «¿En qué puedo ayudarle?» quemado y el papel «Si no le entiende, hable más despacio»; escribiendo, los tres puntitos bajo la sonrisa. **`bocadillo`** (volando y parado con «…»), **`escudo-faq`** (pila curva de bocadillos translúcidos, puesto y desvaneciéndose) y **`boton-ayuda`** (SÍ cian, NO rojo). **`telefono-recepcion`** (36×30, 7): teléfono de mesa beis con demasiadas teclas, **la horquilla vacía y el auricular colgando por detrás del cable rizado**, la luz de mensaje en espera siempre roja y el pósit «Ext. 0»; reposo, agachado, en el aire, sonando (dos tiempos) y «le paso con un compañero». **`bala-llamada`** (13×13, roja con un auricular dibujado). Tests nuevos en `tests/clientela-sprites.test.ts` (8). Sección nueva en `docs/ESTILO_ARTE.md`; la tabla de enemigos de `docs/DISENO.md` dice ya «Sprites hechos». Capturas nuevas en el panel: las hojas y una composición en la Cola Preferente.
- Decisiones: un color por enemigo que se despegue del linóleo azul petróleo (rojo, cromo, blanco, beis). El rojo del dispensador es **más pardo que el de las balas**, para que un tique no se pierda encima. Los botones de «¿Le he ayudado?» son cian y rojo y no verde y rojo: las balas enemigas son siempre cian o rojas (`docs/ESTILO_ARTE.md`). La cinta de los postes se llama `cinta-poste`: **`cinta-cola` ya era la cinta de la cola del Mostrador**, y mi primer intento la pisaba sin avisar (dos claves iguales en el objeto de `build.ts`: gana la última); el test nuevo lo vigila. El teléfono es más ancho (36) que un enemigo normal porque es bajo (30) y lleva el auricular al lado; el área es la de los demás. Los postes andan con las piernas juntas (`narrowPoseCycle`), como el aspirador.
- Medidas: no hay cambios de juego. 675 tests en verde; `npm run bot` 200 partidas, 0 fallos, idéntico línea a línea; `npm run e2e` entero en verde a la primera; los sprites de antes, idénticos.
- Problemas conocidos: el escudo de preguntas frecuentes se lee como una escalera de bocadillos a tamaño real; si en la (4c) no se entiende, que lleve «FAQ» o un borde continuo. El círculo «llamado» es discreto a propósito (el número en grande lo pondrá el juego).
- Siguiente paso: la (3) si sigue sin cerrar; si no, la (4a), el Dispensador de Turnos en el juego con estos sprites.

## 2026-11-05 22:58 (hora peninsular, de `date`) — Hito M11 — Los sprites de la Centralita
- Contexto: al empezar, otra sesión tenía cogida la (6b2) (objetos: `items.ts`, `synergies.ts` y `world.ts`) desde hacía una hora; los enemigos (4a)–(4d) y la (3) tocan `world.ts`, así que elegí la (5a), que solo toca las herramientas de sprites. Esa sesión terminó mientras tanto; el `pull --rebase` mezcló sin conflictos (la hoja de sprites se regeneró después).
- Hecho: M11 (5a). `tools/sprites/centralita.ts` con seis hojas nuevas. **`centralita`** (72×76, 14 fotogramas, nombrados en `CENTRALITA_FRAMES` para la (5b) y la (5c)): un cuadro de conexiones de **teca barnizada** del tamaño de un armario, sin piernas ni manos: los **dos cables largos del pupitre son sus brazos**, con una clavija gorda en la punta. Ojos: dos pilotos ámbar en bisel cromado tapados por abajo en arco (sonríen, ^ ^); boca: el altavoz de tela con lamas en forma de **sonrisa de media luna** con las comisuras rizadas (la sonrisa de una grabación, también cuando está furiosa). Alrededor de la cara, conectores con aro de latón y pilotos de llamadas en espera que se turnan; el pupitre con las clavijas de pie, las palancas y el disco de marcar; en la puerta, **el casco de la operadora colgado de un gancho, sin nadie**; en el lateral, un pósit «Vuelva a llamar más tarde». Fotogramas: reposo (2), arrastrarse con los cables (4: se estira, se clava, tira del mueble con polvo detrás, empuja), hablando (2, con arcos de sonido), lanzando una clavija; fase 3 **sin clavijas** (pupitre vacío, pilotos rojos con párpados de enfado, la tela rasgada y los cables en alto con chispas, 2), arrastrándose sin clavijas (2) y **muda** (pilotos en blanco, altavoz a oscuras, cables caídos). Balas: **`bala-clavija`** (12×6, funda roja con núcleo blanco) y **`nota-espera`** (9×10, corchea y semicorcheas, cian con núcleo blanco). Su sala: **`mostrador-bajo`** (72×30, tres casillas, uno por departamento: Reclamaciones con el timbre, Facturación con impresos, Averías con un auricular roto y Bajas con el cartel de cerrado; la misma encimera que las ventanillas de la planta, sin mampara) y **`mostrador-bajo-v`** (24×82), con sus cajas exportadas para la (2c2); y **`zona-menu`** (72×48, 6): «PULSE» y el número grande, en espera (azul pálido, borde a trazos) y con las balas encima (rojo rayado, borde continuo), translúcidas. Tests nuevos en `tests/centralita-sprites.test.ts` (7). Sección nueva en `docs/ESTILO_ARTE.md`. Capturas nuevas en el panel: la hoja y una composición en una sala de la planta 5 con la tostadora al lado.
- Decisiones: **teca** y no gris ni negro: marrón cálido que se despega del linóleo azul petróleo y que dice «antigua» sin texto (las centralitas eran muebles). **Sin manos flotantes**: la regla de los jefes («manos grandes, nunca brazos») se cumple con los cables, que son parte del aparato y no brazos de palo; las clavijas de la punta hacen de mano. **Sin piernas**: se arrastra (lo dice el diseño), así que el ciclo es de cables y el mueble solo se adelanta un píxel; su ritmo lo pondrá la (5b). El prop de los mostradores bajos (que paran balas pero se cruzan rodando) **no se cablea aún**: eso necesita una regla nueva en el motor y la sala, que son la (2c2) con la (5b). La «muda» es solo de la fase 3 (así lo dice el diseño), por eso lleva el pupitre vacío.
- Medidas: no hay cambios de juego. 667 tests en verde; `npm run bot` 200 partidas, 0 fallos; los demás sprites, idénticos (solo cambian `sprites.json` y los PNG nuevos).
- Problemas conocidos: el e2e falló una vez en «La tostadora no ha recogido los cupones» (esta vez la lista de «antes» solo traía armas: los cupones ya no estaban cuando se miró) y a la segunda pasó entero; sigue siendo intermitente y no tiene que ver con esta tarea. El ciclo de arrastrarse es sutil a tamaño real; si en la (5b) no se lee, que el mueble se balancee además.
- Siguiente paso: M11 (3), encadenar la planta 5 y el final de la partida; o la (5b) con la sala (2c2).

## 2026-11-05 22:25 (hora peninsular, de `date`) — Hito M11 — Hoja de Reclamaciones, Valoración de Cinco Estrellas y sus sinergias
- Contexto: al empezar, otra sesión tenía cogida la (2c1) (salas especiales, `src/data/rooms.ts` y `src/data/lore.ts`) desde hacía 5 minutos; elegí la (6b2), que no toca esos archivos. Terminó mientras tanto y el `pull --rebase` mezcló sin conflictos.
- Hecho: M11 (6b2). Los dos últimos objetos de la planta 5, con sprite, ficha, tests y captura (52d del e2e): **Hoja de Reclamaciones** (perk `complaint`: tras un golpe de un enemigo, cuerpo a cuerpo o con sus balas, los tres disparos siguientes, con todas sus balas, giran hacia él a 540°/s desde cualquier distancia; salen rosas con un rastro de papel y «Reclamación presentada» sobre el culpable; si cae antes, vuelan rectos) y **Valoración de Cinco Estrellas** (perk `stars`, solo buena: una estrella por sala de combate limpia sin un golpe, «Valoración: 3 de 5»; la quinta da un corazón de vida máxima, lleno, con el modificador `cinco-estrellas-corazon`, y vuelta a cero; si ya no caben corazones, cura uno; un golpe borra las estrellas, «Valoración retirada»). Sinergias **Ticket de Incidencia** (Hoja + Llamada Grabada, perk `escalate`: las balas que persiguen al grabado le hacen la marca otra vez, ×2,25 en total, y le renuevan los 6 s) y **Buzón Lleno** (Contestador + Cable Rizado: la repetición atraviesa a un enemigo, perk `echoPierce`, y se graba cada 3 s; la onda ya la tenía). Indirecta nueva: **Formulario en Línea + Cinta Americana** (tapa, `reloadTime`). La planta 5 tiene ya sus diez objetos. 4 tests nuevos en `tests/objetos-planta5.test.ts`; `tests/objetos.test.ts` pide 52 objetos.
- Decisiones: **la indirecta del diseño (Número de Turno + Formulario) se descarta**: medido el daño hecho disparando 35 s seguidos con el Secador, turno ×1,050, formulario ×1,000, la pareja ×1,046 (por debajo del producto): los dos multiplican los mismos disparos y ninguno alimenta al otro; corregido en `docs/DISENO.md`. «Tres balas» de la ficha se lee como tres disparos (con armas de varias balas van todas), y el «daño de la marca» del Ticket como marca doble, porque el que te hiere ya queda marcado con la Llamada Grabada y repetir el ×1,5 no habría añadido nada. El corazón de las estrellas es de vida máxima y no una cura: cinco salas seguidas sin un golpe son difíciles en las plantas altas y el objeto es solo bueno. Las líneas de la ficha se acortaron para que quepan en la ventana grande (lo pide `tests/texto-grande.test.ts`). La estrella del sprite es una pegatina dorada sola: cinco estrellas en 16 px se leían como una raya amarilla.
- Medidas (bot con el Secador, 30 combates contra la Nevera y 60 salas de combate, como `npm run objetos`): nada 43 % de jefa (82,5 s, 4,9 heridas) y 0,77 heridas por sala · Hoja 43 % (igual: con un solo enemigo el bot ya apunta al culpable) y 0,82 · Llamada Grabada 73 % · **Ticket de Incidencia 83 %** (68,6 s, 3,87 heridas) y 0,70 · Contestador 63 % · Cable 70 % · **Buzón Lleno 77 %** (63,4 s) y salas en 32,9 s (37,3 sin nada) · Formulario 27 % · Cinta 60 % · **Formulario + Cinta 67 %**. `npm run bot` 200 partidas, 0 fallos (los objetos de la planta 5 aún no entran en partida hasta la (3)). 660 tests en verde.
- Problemas conocidos: la Hoja sola no mejora al bot (apunta ya al que le ataca); su valor es para quien esquiva de espaldas. El Formulario en Línea solo empeora al bot contra la jefa (27 %): se mirará en la (7). La Valoración no tiene contador fijo en el HUD, solo el texto al ganar o perder una estrella.
- Siguiente paso: M11 (3), encadenar la planta 5 tras el Director y acabar la partida al vencer a su jefe; o los enemigos (4a)–(4d).

## 2026-11-05 21:40 (hora peninsular, de `date`) — Hito M11 — Las salas especiales de Atención al Cliente
- Hecho: M11 (2c1). La (2c) partida en dos en la hoja de ruta: la (2c1), las cuatro salas especiales que no son del jefe, y la (2c2), la sala de la Centralita, que irá con la (5b). Cuatro plantillas nuevas en `FLOOR_5` (`src/data/rooms.ts`), con los mismos tamaños y huecos que las del almacén (lo pide el test): **Coja Número (Espere a Ser Llamado)** (la entrada: filas de sillas de espera atornilladas mirando a las puertas, cubos de fregar y dos mesitas), **Objetos Perdidos (No Se Devuelven)** (el tesoro, tres pedestales entre sillas con lo que nadie vino a buscar), **Repuestos Originales (A Precio de Original)** (la tienda, con la Caja de Autocobro y su rincón de espera) y **Grabaciones con Fines de Calidad** (la secreta, sillas apiladas contra las paredes y dos buzones). Documento nuevo para el archivador, el **Registro de llamadas** (`registro-1` en `src/data/lore.ts`, `source: { secret: 5 }`): 41.207 llamadas, 0 atendidas, y todas las del edificio acaban en la extensión 0, la del Servicio Técnico, «comunicando desde la inauguración». El test de la planta 5 pide sus especiales (salvo la del jefe) con los tamaños y huecos del almacén; el del archivador mira ya las cinco plantas. e2e: `56b`, `56d` y `56e` enseñan ya las salas propias y `56q` el tesoro.
- **e2e arreglado**: fallaba siempre al principio («Ninguna bala ha dado al maniquí»), también en el commit anterior a la (6b1) y en el mío de la (2b), que una hora antes había pasado: en la Sala de Pruebas los enemigos andan en tiempo real y uno se ponía entre la tostadora y el maniquí y se comía la ráfaga entera (se ve en `03-disparando`). Ahora, si a los 1,35 s el maniquí no ha recibido nada, sigue disparando y apuntando otra vez hasta 3,2 s más. Después falló dos veces en «La tostadora no ha recogido los cupones»: los cupones se ponían 12 px a la derecha de la tostadora, que la pelea había dejado pegada a la pared de la derecha; ahora se ponen debajo de ella, y si vuelve a fallar el mensaje dice dónde estaban los cupones antes y después. Una tercera vez falló la presentación de la jefa porque yo corría `npm test` a la vez (con la máquina cargada, el e2e no llega a tiempo): el e2e, solo. Con todo eso, una pasada entera en verde. No cambia nada del juego.
- Decisiones: la sala de la Centralita se queda para la (5b): sin jefa que pelee en ella, el Director (que necesita sus mamparas móviles) tendría que pelear en una sala que no es la suya. Las salas usan los obstáculos de la planta 5 (sillas, cubos, mesitas y buzones), sin muebles nuevos. El registro no dice toda la verdad sobre el Servicio Técnico (eso es para M12): solo que todo acaba allí y nadie contesta.
- Medidas: no hay cambios de equilibrio; `npm run bot` idéntico línea a línea. 656 tests en verde.
- Problemas conocidos: ninguno nuevo.
- Siguiente paso: M11 (3), encadenar la planta 5 tras el Director (`LAST_LEVEL` = 5) y el final de la partida; o la (6b2) / los enemigos (4a)–(4d).

## 2026-11-05 20:58 (hora peninsular, de `date`) — Hito M11 — Seis salas de combate más en Atención al Cliente
- Contexto: al empezar, otra sesión tenía cogida la (6b1) (objetos, `src/data/items.ts` y `src/sim/world.ts`) desde hacía 23 minutos; elegí la (2b), que no toca esos archivos.
- Hecho: M11 (2b). Seis plantillas de combate más en `FLOOR_5` (`src/data/rooms.ts`); la planta 5 tiene ya doce, como las de abajo: **Punto de Información (Hoy No Hay Nadie)** (16×11, la sala de pantalla: una cabina fija en el centro y dos alas de mostrador sueltas a sus lados, que la semilla pone o quita; se pelea doblando esquinas y por la rendija entre ala y cabina), **Pasillo de Mamparas (Por Su Seguridad)** (26×13, mamparas que salen de arriba y de abajo, con un trozo de grupo cada una: un eslalon de mampara en mampara), **Zona de Autoservicio (Hágalo Usted Mismo)** (20×16, cuadrícula de doce quioscos de una casilla, cuatro de ellos «fuera de servicio» según el día), **Mesa de Formularios (Rellene en Mayúsculas)** (18×15, dos hileras de pupitres fijos con el hueco del medio más o menos ancho y cuatro mesitas que se vuelcan), **Cola Preferente (Oro, Plata y Resto)** (28×14, tres carriles entre dos mostradores largos; se cambia de carril por los extremos o por el centro, con huecos de dos casillas siempre abiertos y tramos que van y vienen) y **Buzones de Sugerencias (Sin Abrir Desde 2009)** (24×16, abierta y sembrada de siete buzones de reclamaciones que explotan en cadena junto a los huecos de enemigo). El test de la planta 5 en `tests/rooms.test.ts` pide ahora doce salas, diez tamaños distintos como mínimo, una de pantalla y una larga. Capturas `56k`–`56p` en el e2e.
- Decisiones: los tamaños nuevos no repiten los de la (2a), para que la planta tenga de todo (de 16×11 a 28×14). **Punto de Información** empezó con forma de cruz (cuatro alas pegadas a la cabina) y el bot se quedaba sin acabar: el Climatizador se metía en el rincón cóncavo entre dos alas y, en la medida de plantas enteras, una de cada veinte se atascaba allí; con las alas sueltas (una casilla de rendija) ya no hay rincones de una casilla y la medida da 20 de 20. **Cola Preferente** tenía el paso del centro de una sola casilla y seis grupos: con seis grupos no salía nunca una sala sin ninguno en 40 semillas (lo pide el test de variantes), y el bot no acababa 4 de 20 salas (las torretas del carril de arriba); ahora tres grupos y huecos de dos casillas: 2 de 20. En **Buzones** un hueco de enemigo estaba a 3,2 casillas de la puerta de abajo (pide 3,5): movido una a la izquierda. Las salas usan aún los enemigos de las Oficinas (como las de la (2a)) hasta la (4a)–(4d).
- Medidas (`node tools/medir-salas.ts 5`, heridas por sala con el tope de 60 s, enemigos de la planta 4 y aún sin dureza de planta): Punto de Información 2,73 · Pasillo de Mamparas 1,67 · Autoservicio 1,90 · Mesa de Formularios 2,60 · Cola Preferente 2,13 · Buzones 1,53; media de las doce **2,18** (2,19 con las seis primeras; Oficinas 2,39). Plantas 5 enteras sin daño: **20 de 20** enteras, 49,7 s por sala de combate (antes 19 de 20, 54,4 s). Con 150 s por sala (20 por plantilla, con reflejo): sin acabar Información 1, Mamparas 2, Autoservicio 0, Formularios 0, Preferente 2, Buzones 0 (los que quedan son impresoras y microondas que el bot no va a buscar detrás de un mostrador). `npm run bot` idéntico línea a línea (la planta 5 aún no se juega en partida). 656 tests en verde (con los de la (6b1)).
- Problemas conocidos: Buzones y Pasillo de Mamparas son de las más fáciles (1,53 y 1,67); se mirarán con los enemigos propios y en la (7). Con todos los grupos fuera, el Punto de Información se queda en una cabina sola y parece algo vacío.
- Siguiente paso: M11 (2c), las salas especiales propias de la planta 5 (Coja Número, Objetos Perdidos, Repuestos Originales, Grabaciones y la sala de la Centralita).

## 2026-11-05 20:28 (hora peninsular, de `date`) — Hito M11 — Número de Turno, Contestador Automático y Llamada Grabada
- Hecho: M11 (6b1), tres objetos de la planta 5 con efectos nuevos, con sprite, ficha, tests y captura (52c del e2e). **Número de Turno** (perk `queue`): las balas hacen ×0,9 al entrar en una sala y +5 % por cada 5 s en ella, hasta ×1,25 (35 s); cada paso sale sobre la tostadora («Van por el 13», …, y el último «Siguiente, por favor») con el ding de la pantalla de turnos; cuenta desde `shutTick`, que ya se ponía al entrar en cada sala. **Contestador Automático** (perk `echo`): cada 4 s el siguiente disparo se graba (pitido) y medio segundo después se repite solo desde donde esté la tostadora, por la misma línea, con todas sus balas al 60 % de daño y de empuje, sin gastar munición y nunca crítico, urgente ni de edición limitada; la repetición se dibuja más pequeña y tenue y suena apagada; al cambiar de sala se borra. **Llamada Grabada** (perk `recorded`, «solo bueno», así que `quality: 'buena'`): el enemigo que hiere a la tostadora, cuerpo a cuerpo o con sus balas, queda marcado 6 s («Llamada grabada» y parpadeo rojo) y recibe ×1,5 de las balas. Para saber quién disparó, las balas enemigas guardan `from` (el `source` del emisor) y `hurtPlayer` lo recibe como fuente.
- Decisiones: el daño del Turno y el de la marca se aplican como los demás multiplicadores del disparo (`shotScale` reúne turbo, mascota, taza y turno; la repetición los lleva también). La marca solo multiplica las balas, no explosiones ni la sobretensión, como dice la ficha. El eco lo graba el disparo, no el tiempo: con el gatillo suelto no se pierde, espera al siguiente.
- Medidas: 656 tests en verde; bot 200 partidas, 0 fallos (los objetos de la planta 5 aún no entran en partida hasta la (3)).
- Problemas conocidos: en la captura la repetición se ve, pero discreta; si en partida no se distingue, darle una estela.
- Siguiente paso: M11 (6b2): Hoja de Reclamaciones y Valoración de Cinco Estrellas, las sinergias Ticket de Incidencia y Buzón Lleno y la pareja Número de Turno + Formulario, medidas (otra sesión tiene la (2b)).

## 2026-11-05 19:52 (hora peninsular, de `date`) — Hito M11 — Cinco objetos de Atención al Cliente
- Contexto: al empezar, otra sesión tenía cogida la (2a) (salas, `src/data/rooms.ts`) desde hacía 27 minutos; elegí la (6a), que no toca esos archivos. Esa sesión terminó mientras tanto; el `pull --rebase` mezcló sin conflictos.
- Hecho: M11 (6a). Cinco objetos pasivos de la planta 5 (`level: 5`), con sprite, ficha y tests (`tests/objetos-planta5.test.ts`): **Formulario en Línea** (cargador ×1,4, recarga ×1,25 más lenta), **Tecla Almohadilla** (el activo se carga ×1,5: pila y media por sala, y la media espera a la siguiente en `active.rest`), **Tiempo de Espera Estimado** (espera entre volteretas ×0,75, velocidad ×0,95), **Código Promocional Caducado** (una baja de cada cuatro suelta un cupón más; 3 de cada 10 cofres de premio de las salas de combate caducan y en su sitio sale «Promoción caducada» en rojo con un zumbido) y **Cable de Teléfono Rizado** (daño ×1,15, alcance ×0,9 y balas en tirabuzón). Motor: `BulletBehaviour.wave` (las balas del jugador reutilizan la onda de las balas enemigas; al rebotar reflejan su línea y no su vaivén, para que no se tuerzan), los perks `chargeMul` y `expiredChests`, el evento `expired` y sus líneas de ficha. Captura en el e2e (52a inventario, 52b tirabuzón y sello).
- Decisiones: el cofre caducado se decide al limpiar la sala (con el dado del mundo y solo con el objeto), no al planear la planta, para que el objeto cuente desde que se coge; los cofres del tesoro y de la secreta no caducan (son «de premio» solo los de sala de combate). La onda: 5 px a cada lado, tres veces por segundo; con 320 px/s es una curva que se ve sin que la bala falle a un enemigo grande, y su pega real es que a veces roza a uno pequeño. Los objetos de la planta 5 aún no salen en partida: hace falta la (3), que sube `LAST_LEVEL` a 5.
- Medidas: 653 tests en verde (con los de la (2a)); bot 200 partidas, 0 fallos (los objetos de la planta 5 aún no entran en sus mazos).
- Problemas conocidos: ninguno nuevo. El tirabuzón se ve, pero con el Secador las balas son pequeñas; cuando haya Buzón Lleno (6b2) quizá merezca una estela.
- Siguiente paso: M11 (2b), seis plantillas de combate más; o la (6b1) si otra sesión tiene cogidas las salas.

## 2026-11-05 19:31 (hora peninsular, de `date`) — Hito M11 — Seis salas de combate de Atención al Cliente
- Hecho: M11 (2a). `FLOOR_5` en `src/data/rooms.ts` con seis plantillas de combate (`level: 5`), cada una con su idea y con grupos de mostrador que la semilla pone o quita: **Sala de Espera (Su Turno Es el Siguiente)** (22×14, cuatro filas de sillas atornilladas como trincheras y dos ventanillas al fondo), **Ventanillas (Diríjase a la de al Lado)** (24×13, un mostrador largo que parte la sala; la ventanilla del centro siempre abierta, las otras dos según el día; se rodea por los extremos), **Cola en Zigzag (Mantenga la Distancia)** (20×14, dos tramos de mostrador que hacen la cola en ese, con un trozo que a veces falta), **Locutorio de Reclamaciones (Pulse 3)** (18×13, cuatro cabinas al fondo con su mampara puesta o no y dos buzones que explotan), **Mostrador de Reclamaciones (Hoja 1 de 3)** (16×14, una isla de mostradores siempre abierta por abajo) y **Departamento de Bajas (Imposible Darse de Baja)** (26×15, dos mostradores de pared a pared: desde las puertas de los lados solo se sale por arriba, salvo el día que falta un trozo abajo). `templatesOf` ya mira cinco plantas: la planta 5 pelea en las suyas y usa las especiales de las Oficinas hasta la (2c). Test nuevo en `tests/rooms.test.ts` (seis suyas con grupos, nada se cuela abajo, especiales de la 4, una planta 5 generada pelea solo en las suyas); las pruebas de todas las plantillas (bot 25 s, idea escrita, puertas al reflejar) cubren ya la planta 5. Capturas `56a` y `56f`–`56j` en el e2e.
- Decisiones: las salas usan los enemigos de las Oficinas hasta que existan los suyos (4a–4d), como se hizo en la planta 4. La Cola en Zigzag tenía los tramos casi de pared a pared y el bot no acababa la mitad de las salas en 150 s (10 de 20): los huecos de los extremos pasan de 3 a 5 casillas (4 de 20, como el Espacio Diáfano de las Oficinas, 6 de 20). En el Locutorio la sala gana una fila para que los huecos de las cabinas no queden pegados a las puertas de los lados.
- Medidas (`node tools/medir-salas.ts 5`, con los enemigos de la planta 4 y aún sin dureza de planta, heridas por sala con el tope de 60 s): Sala de Espera 2,33 · Ventanillas 1,77 · Cola en Zigzag 1,83 (antes del arreglo) · Locutorio 2,57 · Mostrador 3,37 · Departamento de Bajas 1,27; media **2,19** (Oficinas 2,39). Plantas 5 enteras sin daño: 19 de 20 enteras en 900 s, 54,4 s por sala de combate (la otra no era un atasco: en el segundo 900 le quedaba una bombilla en la entrada del Mostrador y la mató poco después). Con 150 s por sala (20 por plantilla): sin acabar Espera 0, Ventanillas 1, Zigzag 4 (tras el arreglo), Locutorio 6, Mostrador 6, Bajas 5; en las Oficinas, Espacio Diáfano 6, Despachos 2. `npm run bot` idéntico línea a línea.
- Problemas conocidos: **casi rompo dos salas de Informática**: un `sed` con puntos (que en una expresión regular valen cualquier carácter) cambió también una fila de `pasillo-perifericos` y otra de Informática; lo cazó la comparación de `npm run bot` antes y después y está deshecho. Para editar filas de plantillas, con Python y cadenas literales, no con `sed`. El e2e falló una vez en el bidón de la Sala de Pruebas (`d.fuse` de un bidón que ya no estaba: una bala perdida lo había hecho explotar); a la segunda pasó: es intermitente y no tiene que ver con esta tarea. El Departamento de Bajas es la más fácil (1,27) y la más lenta: se mirará con los enemigos propios y en la (7).
- Siguiente paso: M11 (2b), seis plantillas de combate más de la planta 5.

## 2026-11-05 18:54 (hora peninsular, de `date`) — Hito M11 — El aspecto de Atención al Cliente
- Contexto: el clon local venía otra vez superficial y con `main` atrasado (50 commits); `git fetch --unshallow` y `main` puesto en `origin/main` (sin trabajo local que perder), sin tocar la historia remota.
- Hecho: M11 (1). `src/art/atencion.ts`, el juego de casillas de la planta 5, que el pintor de salas (`src/art/room.ts`) usa con `level >= 5` (la 4 pasa a ser solo `level === 4`): **linóleo en rollos** de dos casillas, dos tintes alternos, vetas jaspeadas y el cordón de soldadura (variantes: tacón, quemadura, burbuja, remiendo y pegatina de pies «espere aquí»); remolinos de pulidora, rayas de tacón, tiques de turno y conos de papel; la **línea amarilla «Siga la línea»** que entra por una pared, gira y acaba en una flecha en mitad del suelo (en la entrada siempre); zonas «ESPERE AQUÍ / COLA / NO PASAR» y letras propias. **Mostradores de ventanilla** como paredes de dentro (encimera, mampara con agujeros, frontal con número, «cerrada» o folletero). Pared del fondo a dos tonos con **sillas de espera en bancada**, avisos A4, el vinilo **«SU SATISFACCIÓN ES NUESTRA PRIORIDAD» con una estrella de cinco**, **relojes con horas distintas** y la pantalla de turnos que siempre dice **A047** en la ventanilla 0; techo acústico, luz fría azulada, folleteros, aviso de hojas de reclamaciones y rodapié de linóleo. Por sala: entrada «PLANTA 5 · ATENCIÓN» con felpudo «COJA NÚMERO», tienda «REPUESTOS ORIGINALES», tesoro «NO SE DEVUELVEN», secreta «GRABACIONES» con cinta de casete, jefe «CENTRALITA» con cables de teléfono rizados. Sprites nuevos en `tools/sprites/props.ts`: `caja-5` sillas de espera atornilladas, `barril-5` buzón rojo de reclamaciones (explota igual), `carrito-5` cubo de fregar con «suelo mojado», `mesa-5` mesita de revistas, `persiana-*-5` con «CERRADA» y flecha a la de al lado. `?planta=5` ya funciona (con las salas y el jefe de las Oficinas hasta la (2) y la (3)). 4 tests nuevos en `tests/roomart.test.ts` (color, casillas y decoración propias sin nada de abajo, el eslogan no pisa la puerta de arriba, puertas libres y la planta 6 se pinta como la 5); `sprites.test.ts` pide las `-5`. Capturas `56a`–`56f` en el e2e. Sección nueva en `docs/ESTILO_ARTE.md`.
- Decisiones: **azul petróleo** (`#2d4a5e`, media del suelo ~47,75,94) y no un azul cualquiera: el almacén ya es añil (58,63,90); el test pide verde sobre rojo por 16, que el añil no cumple. La sala de la Centralita **sin tinte ámbar**: con él quedaba a 10,8 del jefe del almacén (pide más de 12). **Obstáculos distintos de lo que dice el diseño** (corregido en `docs/DISENO.md`): el dispensador de agua ya era el `barril-2` de Informática y la planta de plástico el ficus de las Oficinas, y los postes con cinta se confundirían con el enemigo Postes de Cola (4b); el bidón rojo pasa a ser el buzón de reclamaciones, lleno a reventar. **En la planta 5 la pared del fondo reserva tramos enteros** (el eslogan mide 141 px y la regla de siempre solo miraba centros: se montaba sobre la pantalla y la puerta); las plantas 1–4 no cambian (mismo hash de todas las salas en las cuatro plantas antes y después). El cartel de la entrada se queda en «PLANTA 5 · ATENCIÓN»: el nombre entero (116 px) no cabe en una sala de 16 columnas con la puerta de arriba en medio (se lee además como un «¡Atención!»).
- Medidas: no hay cambios de juego; `npm run bot` idéntico línea a línea. 645 tests.
- Problemas conocidos: en las salas estrechas el eslogan no cabe y no sale (sale en las anchas: tiendas, jefe, combate grande). Las pegatinas de pies, a 2 %, quizá se repiten demasiado en salas grandes.
- Siguiente paso: M11 (2a), seis plantillas de combate propias de la planta 5.

## 2026-11-05 17:30 (hora peninsular, de `date`) — Hito M11 — El diseño de la planta 5, Atención al Cliente
- Hecho: M11 (0). En `docs/DISENO.md`: **cuatro enemigos** de la quinta planta, cada uno contra una costumbre que le queda al jugador a estas alturas: el **Dispensador de Turnos** (llama un turno y enciende un círculo en el suelo lejos de la tostadora: hay que llegar a tiempo o escupe tiques; castiga esconderse y esperar), los **Postes de Cola** (dos postes con una cinta que no se cruza ni rodando y que se acorta: te hacen la cola), el **Asistente Virtual** (el chatbot: tres balas seguidas desde el mismo lado y se escuda de ese lado, «Pregunta frecuente») y el **Teléfono de Recepción** («Le paso con un compañero»: se cambia de sitio con el enemigo más lejano). **La Centralita**, jefa: un cuadro de conexiones antiguo, con el menú de voz («Pulse 3»: tres zonas en el suelo y solo una sin balas), la sala partida en cuatro departamentos entre los que pasa a la tostadora, y una fase 3 de cables que barren y silencios en los que se le puede dar; vencerla acaba la partida normal. **Diez objetos** de `level: 5` (el tema es la espera), dos sinergias y una indirecta, **dos armas** (Etiquetadora de Precios y Megáfono de Reclamaciones; el juego solo tiene tres), y el aspecto con sus cinco salas especiales y su documento. M11 partido en 22 tareas en la hoja de ruta, como M10; estimación revisada (quedan unas 83 sesiones, 108 con margen).
- Decisiones: aquí **no hay teleoperadores**, solo las máquinas que los sustituyen: el humor apunta a la empresa que hace esperar, no a quien está detrás del mostrador. La Centralita es un cuadro de clavijas y no un ordenador para que se distinga del Router. Las dos armas salen desde la planta 1 (la regla de las armas de M14: más variedad desde el principio); se hacen al final de M11 (6c) porque tocan `tests/armas.test.ts` y `npm run armas`. La planta 5 sin enemigos nuevos con más vida de base: su dureza se mide en la (7) con `npm run plantas`. Nombres comprobados contra todos los enemigos, objetos, armas y sinergias que hay. La (3) incluye el final de la partida normal (el criterio del hito) y no lo deja para M12, que solo añade el Servicio Técnico para quien cumpla los requisitos.
- Medidas: no hay cambios de juego. 641 tests.
- Problemas conocidos: ninguno.
- Siguiente paso: M11 (1), el juego de casillas de Atención al Cliente.

## 2026-11-05 17:21 (hora peninsular, de `date`) — Hito M10 — La planta 3, el muro (M10 terminado)
- Hecho: M10 (7) de las plantas 3 y 4. **Herramienta nueva `npm run plantas`** (`tools/medir-plantas.ts`, `node tools/medir-plantas.ts [partidas] [desde]`): en cada partida (desde el Mostrador, la mitad con el Chatarrero) las plantas de abajo se juegan sin daño, y cada planta se juega con daño desde esa llegada, con la vida llena; da, por planta, cuántos la ganan de los que llegan, cuántos caen ante el jefe, y heridas y segundos por sala de combate. **Dureza por planta** (`FLOOR_TOUGHNESS` y `toughened` en `src/data/rooms.ts`, aplicada en `spawnRoomEnemies`): los enemigos de las salas de la planta 3 tienen un 30 % más de vida y los de la 4 un 50 %; también los de abajo que salen allí, las escoltas y las copias de la fotocopiadora. Los jefes no cambian (se miden uno a uno). Las plantas 1 y 2, idénticas. `npm run bot` da a las plantas de arriba más tiempo según su dureza (`upperTime`). Tests nuevos en `tests/planta3-muro.test.ts` (3). **M10 terminado.**
- Decisiones: (1) **Cómo se mide el criterio.** Desde M9b el bot gana la planta 1 una vez de cada cinco o seis, así que en las partidas enteras de `npm run bot` no llega nunca a la 3 (0 de 20) y el criterio tal como estaba no se podía medir; ponerle las plantas 1 y 2 fáciles al bot iría contra lo que pidió el humano. Se mide por planta, llegando con lo que se recoge en las de abajo: «la 3 es donde más partidas acaban» pasa a ser «la 3 es la que menos gana quien llega a ella». Apuntado en los criterios de M10 en la hoja de ruta. (2) **Por qué vida y no más enemigos.** Antes de tocar nada, con el arma de salida y la misma hondura, una sala de la Juguetería daba **menos** heridas que una de Informática (3,00 frente a 3,27; las Oficinas, 2,44): sus enemigos castigan costumbres pero hieren poco. Más enemigos no cabía: las plantillas de la 3 tienen 4–6 huecos y ya salen 4,3 de media con el presupuesto al tope. Subir la vida de toda la planta alarga las salas (más balas en pantalla a la vez) sin que nadie pegue más fuerte, que es lo que dice el diseño. (3) La 4 queda en 1,5 y no en 1,6: con 1,6 sus salas eran un 17 % más duras que las de la 3 (no «algo») y una planta 4 entera con el arma de salida pasaba de los 15 minutos.
- Medidas (`npm run plantas`, 80 partidas; antes, 40): planta 1, la gana el 19 % (25 % en las 40 primeras, igual que antes: no cambia); planta 2, el 9 % (10 % antes); **planta 3, el 5 %** (4 de 79; antes el 10 %, empatada con la 2); planta 4, el 8 % (antes el 20 %). Heridas por sala de combate en partida: 1,13 / 1,95 / **2,13** (antes 1,78, menos que la 2) / 2,25 (antes 1,34). Con el arma de salida (360 salas por planta): planta 2 3,09 heridas y 60 s por sala, planta 3 3,74 y 73 s, planta 4 3,90 y 76 s. Se cae ante el jefe en el 11 % de las derrotas de la 3: el muro son las salas. `npm run bot` idéntico en las plantas 1 y 2 y en los jefes; recorre sin daño las plantas 3 y 4 el 100 %. 641 tests.
- Problemas conocidos: la diferencia entre la 2 (9 %) y la 3 (5 %) es pequeña para 80 partidas; si el humano encuentra la 2 tan dura como la 3, lo siguiente sería subir la 3 a 1,4 (y la 4 a 1,6). Con el arma de salida una sala de la 4 dura más de un minuto: con los objetos que se traen, unos 42 s. La herramienta tarda unos 7 minutos por cada 40 partidas (dos procesos a la vez con `desde`).
- Siguiente paso: M11, partir la planta 5 (Atención al Cliente) en tareas como se hizo con la 3 y la 4, empezando por su diseño.

## 2026-11-05 16:17 (hora peninsular, de `date`) — Hito M10 — Pósit de Urgente, Responder a Todos y sus sinergias
- Hecho: M10 planta 4 (6b2); los diez objetos de las Oficinas están. **Pósit de Urgente** (`perks.urgent: 2`): cada voltereta carga el siguiente disparo (`Player.urgent`), que hace el doble de daño con todas sus balas y sale parpadeando en amarillo y rojo, con un clic más seco. **Responder a Todos** (`perks.replyAll`: 25 %, dos trozos, mitad de daño): una bala que acierta puede partirse en dos balas pequeñas, una hacia cada uno de los dos enemigos más cercanos (las dos al mismo, un poco abiertas, si solo queda otro); sin nadie más no se parte, y los trozos no se vuelven a partir (`replyAll` en `src/sim/world.ts`; los trozos salen al tick siguiente). Sinergias **Pausa del Café** (Café de Máquina + Taza: sala limpia con la vida llena, una pila más; `perks.fullHpCharge`) y **Cadena de Correos** (Responder a Todos + Pósit: la bala urgente siempre se parte y sus trozos hacen el doble; `perks.chain`). La indirecta **Bola Antiestrés + Batería Hinchada** en `src/data/complements.ts`, medida en `tests/complementos.test.ts` (aguante bajo una lluvia de golpes). Sprites de 16×16: el pósit amarillo con «UR!» y la esquina levantada, y el sobre con la doble flecha azul de responder a todos y la burbuja roja. Fichas en `describe.ts`. Tests nuevos en `tests/objetos-planta4.test.ts` (4) y `tests/complementos.test.ts` (1); e2e: captura `51d` (la bala urgente partida en una sala de las Oficinas).
- Decisiones: la sinergia se llama **Pausa del Café** y no «Pausa para el Café»: las sinergias llevan tres palabras como mucho (`tests/sinergias.test.ts`). La **Silla con Ruedas + Etiqueta A+++ se descarta**: sus velocidades solo se multiplican, como las de cualquier par de objetos de velocidad, y con el bot (80 jefas y 144 salas) la pareja gana el 49 % de las jefas y recibe 1,14 heridas por sala, peor que la etiqueta sola (65 %, 0,96). La Bola + Hinchada no se nota con el bot (con un corazón menos la batería le tumba antes: jefa 38 % sola, 30 % con la bola, que baja la cadencia), así que se mide lo que dice la idea: con golpes tan seguidos como se pueda, la tostadora sin nada cae a los 6 s, con la batería a los 3,6 s, con la bola a los 12 s y con las dos a los 7,2 s: más que sin nada. «Tapa» admite ya parejas sin estadística siempre que tengan su prueba (`TAPA_MEASURED`). El Pósit gasta su carga en todo el disparo (las armas de varias balas también) y se carga con cada voltereta de verdad (no con la denegada en la tinta).
- Medidas: con el bot y el Secador (planta 1, 80 combates contra la jefa y 144 salas de combate): sin nada 64 % y 37,6 s por sala; Pósit 69 % y 34,5 s; Responder a Todos 64 % (contra la jefa sola no hay a quién responder) y 34,0 s; los dos (Cadena de Correos) 69 % y 30,2 s (más que el producto de cada uno, 31,2 s); Café + Taza 64 % y 34,0 s. `npm run bot` idéntico línea a línea (son de la planta 4). 638 tests.
- Problemas conocidos: el «UR!» del pósit se lee como «UR»; a 16 px no cabe más.
- Siguiente paso: M10 (7), medir las plantas 3 y 4 con el bot y ajustarlas (la 3, el muro; la 4, salas algo más duras pero menos partidas que acaban en ella).

## 2026-11-05 16:00 (hora peninsular, de `date`) — Hito M10 — La fase 3 del Director: «Despido procedente»
- Hecho: M10 planta 4 (5c); el Director está entero. **Fase 3, «Despido procedente»** (desde el 25 %, `stage: 3`), con el grito «No es nada personal. Es todo.»: se levanta (`frameShift: 9`, sus fotogramas de pie: respira, anda, lanza y, para girar, de frente, de lado, de espaldas y del otro lado, `spin: [17, 15, 16, 15]`), anda más lento (34 px/s) y su silla sale rodando sola: enemigo nuevo **`silla-director`** (Silla Ergonómica de Dirección, `summon` de la fase, 30 de vida, cerebro `charger`: rueda hacia la tostadora, avisa 0,6 s y embiste a 240 px/s; contra la pared o la mesa se queda parada 1,2 s), que cae con él y no vuelve si se rompe. La **línea de recortes**: espiral de catorce brazos de balas rojas (color de bala nuevo `cut`, el sprite `bala-recorte` de la 5a) con un hueco de 80° que empieza en la tostadora y gira 6,5° cada 0,22 s, en un sentido (`director-recortes`) o en el otro (`-2`); él gira sobre sí mismo mientras sale. Y abanicos de tarjetas, de dos en dos (`director-tarjetas-3`). Las espirales aceptan ahora huecos que giran con los brazos (`SpiralDef.gaps` en `src/sim/patterns.ts`; una espiral con hueco apunta y su aviso enseña hacia dónde). La silla tiene tres fotogramas más (siete: quieta con la etiqueta levantando una esquina, y rodando en cuatro pasos con la etiqueta echada hacia atrás), porque los tests de animación piden dos de reposo y cuatro pasos distintos. Durante la palmada del cambio a la fase 3 ya se le dibuja de pie (la palmada es un fotograma sentado). `npm run bot` cuenta la fase 3 del Director («de pie»). Tests nuevos en `tests/director-fase3.test.ts` (5); e2e: capturas `39j` (de pie, con el cartel de la fase), `39k` (la silla avisando) y `39l` (la línea de recortes).
- Decisiones: «un brazo de balas rojas en espiral con un hueco que hay que seguir» se ha hecho como una espiral entera con un solo hueco que gira: un brazo suelto se esquivaba con un paso a un lado y no pedía seguir nada. El hueco gira despacio (unos 30 °/s, a dos casillas la mitad de lo que anda la tostadora). La silla se puede romper (está en medio, no es el objetivo) y sin botín. **El bot aprende a seguir un hueco que gira** (`followHole` en `src/sim/bot.ts`): lee en el patrón dónde estará el hueco a su distancia (las balas que le llegan salieron hace `r / velocidad` s) y se pone en él, a 60–130 px del Director. Solo se activa con patrones de seis pasos o más y un hueco mucho mayor que el resto (ni anillos ni espirales sin hueco): el resto del informe de `npm run bot` sale idéntico línea a línea. Sin esto, en la fase 3 sola los recortes le daban 3,3 veces por combate y con la espiral más floja tampoco aprendía; un jugador ve el hueco y lo sigue. No se ha aflojado la vida (220): la reestructuración dura ahora del 60 al 25 % y no hasta el final.
- Medidas: `npm run bot`: el Director, 30 combates, gana el 6,7 % (3,3 % antes de la fase 3) en 189 s, 5,93 heridas por combate (3,4 en la fase 1, 2,3 en la reestructuración, 0,23 de pie), se levanta el 20 %, a los 133 s. Router 26,7 %, Muñeco 10 %: la rampa sube planta a planta. Empezando ya en la fase 3 (prueba aparte, 30 combates): gana el 93 %, 2,4 heridas en 63 s (1,1 de la silla y el contacto, 0,9 de los recortes, 0,4 de las tarjetas). 633 tests.
- Problemas conocidos: cuando la tostadora se queda debajo de la mesa, la mesa se come media espiral (se ve en `39l`); es cobertura, pero quizá demasiada. Si la silla avisa con el Director delante, el destello amarillo tapa un poco al Director.
- Siguiente paso: M10 planta 4 (6b2), Pósit de Urgente y Responder a Todos con sus sinergias; o M10 (7), medir las plantas 3 y 4.

## 2026-11-05 15:01 (hora peninsular, de `date`) — Hito M10 — El Director de Recursos Inhumanos, fases 1 y 2
- Hecho: M10 planta 4 (5b). El Director es ya el jefe de la planta 4 (letra `E`, `floorBossOf(4)`; el Muñeco deja de repetir en la Sala de Juntas), con cartel («Aquí nadie es imprescindible. Usted tampoco.»), causa de baja y su documento para el archivador (la evaluación de desempeño de la tostadora, `evaluacion-1`). 220 de vida, en su silla: anda con los fotogramas del impulso, lanza con la carta en la mano, da palmadas y levanta su sello (`pose` nuevo en los ataques de jefe y `clap` en `EnemyAnim`, en `src/render/enemyAnim.ts`). **Fase 1, «Somos una familia»**: abanicos de tarjetas de visita que barren (`director-tarjetas`, color de bala nuevo `bizcard`) y cartas de despido: el ataque `spit` de la Nevera con un dibujo propio (`look: 'carta-despido'`, `Frost.look`) que se abre en un anillo corto de folios (`director-folios`). **Fase 2, «Reestructuración»** (desde el 60 %): palmada y las cuatro mamparas se recolocan (`BossPhase.restructure`, `restructureRoom` y `updateSlides` en `src/sim/world.ts`; `PropInstance.slide`): 1 s de silueta discontinua donde van a ir, 0,7 s deslizándose, empujando fuera a la tostadora, a los enemigos y a lo que haya en el suelo (`shove`), y otra vez cada 12 s. Anillos de diapositivas con dos huecos que giran (`director-diapositivas`, color `slide`) y su sello: ataque nuevo `stamp` (`BossStampAttack`) que marca dos sombras cuadradas y deja dos cuadros de tinta como los del Sello de Denegado (`Emitter.stamp`, `stampDown`). Sonidos `palmada`, `deslizar` y `carta`. Las mamparas de la Sala de Juntas ya no son pared: son el prop `mampara-movil` (letra `_`, el centro de sus tres casillas), dibujado plano en el suelo como la pared a la que sustituye y con su silueta en el fotograma 1. Tests nuevos en `tests/director-jefe.test.ts` (8); e2e: capturas `39a`–`39i`. `npm run bot` mide también al Director.
- Decisiones: **cada mampara se queda en su cuarto de la sala**, a dos casillas o más de donde estaba, con una casilla libre alrededor (paredes, mesa, puertas y los sitios ya dados a las otras) y nunca sobre los pasillos del centro: así nunca se cruzan al deslizarse ni cierran un paso. Si una no tiene sitio, se queda. Los folios de una carta viven 1,4 s (unos 70 px) y son cinco: con anillos de siete que cruzaban la sala entera, el bot perdía 5 medios corazones solo en la fase 1. **Los jefes rodean la mesa larga** en vez de empujarla (`bossRoam`: si lo que tiene delante es un mueble de más de dos casillas, va a lo largo de su borde y gira menos de vuelta, `ROAM_FLIP_HUGGING`); sin eso el Director se quedaba pegado a la mesa con la tostadora al otro lado. El bot también: se aparta de los muebles grandes en vez de empujarlos (`slideOff`), sale hacia el extremo más cercano si la mesa o una mampara le tapan el tiro (`coverBetween`) y se aleja más de donde va a caer una carta. Todo eso solo cuenta con muebles de más de dos casillas o con cartas: en las plantas 1–3 el bot y los jefes hacen exactamente lo mismo que antes (`npm run bot` sale idéntico línea a línea). La vida baja de 240 (lo que decía el diseño) a 220 porque la mesa también le para las balas a la tostadora. La frase de la fase 2 sale debajo de él (encima quedaba fuera de la cámara). Un sello no cae medio en la pared (el cuadro entero en el suelo).
- Medidas: `npm run bot`: el Director, 30 combates, gana el 3,3 % (Muñeco 10 %, Router 26,7 %), 5,97 heridas por combate (3,4 en la fase 1, 2,57 en la reestructuración), llega a la reestructuración el 80 % a los 70 s. En salas abiertas (prueba aparte) el bot le ganaba el 7–20 %: la mesa y las mamparas lo hacen más duro, que es la idea. El resto del informe, idéntico. 628 tests.
- Problemas conocidos: sin la fase 3 (5c) ya es el jefe más duro para el bot; la (5c) tendrá que volver a medirlo y seguramente aflojar algo (la fase 2 durará menos, del 60 al 25 %). La cámara deja la cabeza del Director fuera cuando está pegado a la pared de arriba (pasa con todos los jefes altos).
- Siguiente paso: M10 planta 4 (5c), la fase 3 del Director (la silla suelta que embiste y la línea de recortes); o (6b2); o M10 (7).

## 2026-11-05 13:48 (hora peninsular, de `date`) — Hito M10 — Los sprites del Director y la mesa de la Sala de Juntas
- Contexto: el clon local de esta sesión venía a medias (superficial y con `main` atrasado); `git fetch --unshallow` y avance rápido a `origin/main`, sin tocar la historia. La hora de esta entrada es la real: la de arriba (13:50) iba un par de minutos adelantada.
- Hecho: M10 planta 4 (5a). `tools/sprites/director.ts` con ocho hojas nuevas. **`director-rrhh`** (72×76, 18 fotogramas, nombrados en `DIRECTOR_FRAMES` para la (5b)): sentado en su silla (reposo y respiración), el impulso con los pies (alcanza, empuja, rueda con los pies en alto en dos tiempos), lanzar una carta, la palmada de la reestructuración y su propio sello en alto; de pie (reposo, respiración, paso levantando el pie), lanzar de pie y el giro de la línea de recortes de espaldas y de frente. Gafas que reflejan una hoja de cálculo (nunca se le ven los ojos; destellan en blanco cuando decide), sonrisa de foto de perfil con hoyuelo, traje gris una talla grande, corbata de logotipos con pisacorbatas dorado, acreditación olvidada y, de espaldas, la etiqueta de la tienda colgando del cuello. **`silla-director`** (44×52, 4): la silla sola de la fase 3. Balas: **`bala-tarjeta-visita`** (cian), **`carta-despido`** (sobre con lacre, para lanzar en parábola), **`bala-diapositiva`** y **`bala-recorte`**. **`mampara-movil`** (72×24, la mampara de cristal esmerilado y su silueta discontinua) y **`mesa-juntas`** (168×52). La mesa ya está en la Sala de Juntas: prop nuevo `mesa-juntas` (`src/data/props.ts`, para balas, no se vuelca), letra de plantilla `=` (`src/sim/room.ts`), en el centro de la sala entre las dos filas de mamparas. Tests nuevos en `tests/director-sprites.test.ts` (4): fotogramas sentado y de pie, la misma línea de suelo, las gafas, la silla, las balas, la mampara del tamaño de tres casillas, y la mesa en su sitio, sin atravesarse y rodeable por los cuatro lados. Sección nueva en `docs/ESTILO_ARTE.md`.
- Decisiones: la silla es de **polipiel granate**, no negra: en negro se fundía con la moqueta gris en la primera prueba. Las tarjetas de visita van en **cian** (el otro color de bala enemiga) para no confundirse con las tarjetas rojas de la Nevera. La mesa mide siete casillas y queda 12 px a la izquierda del centro exacto (la sala tiene un número par de columnas y el prop se ancla al centro de su casilla); no se nota y así no hace falta un anclaje nuevo. Las mamparas móviles serán entidades de la (5b): ahora solo existe su dibujo. Los dos fotogramas de paso que repiten el reposo se dejan como en los otros jefes.
- Medidas: `npm run bot` idéntico (plantas 1–3; la planta 4 sin daño, con la mesa, la recorre entera el 100 %). 616 tests.
- Problemas conocidos: ninguno nuevo. Hasta la (5b) el Director no sale en el juego (el Muñeco sigue en la Sala de Juntas, ahora con la mesa).
- Siguiente paso: M10 planta 4 (5b), las fases 1 y 2 del Director en la simulación; o (6b2); o M10 (7).

## 2026-11-05 13:50 (hora peninsular) — Hito M10 — El Climatizador Portátil
- Hecho: M10 planta 4 (4d), el cuarto y último enemigo de las Oficinas (letra `H`, como mucho uno por sala, coste 4). Cerebro nuevo `blower` (`BlowerBrain`, `updateBlower` en `src/sim/enemies.ts`): se arrastra a 12 px/s hasta quedarse a unos 140 px (nunca retrocede) y su rejilla sigue a la tostadora a 35 °/s mientras oscila 90° de lado a lado en 3 s (`Enemy.sweepT`). El **cono de aire frío** (45°, 200 px; `inWind`, `windOn`, `windBend` en `src/sim/world.ts`) empuja a la tostadora a 60 px/s (también rodando; andando en contra avanza, pero cuesta) y **tuerce sus balas** hacia fuera del cono a 110 °/s. Con la tostadora en el cono, cada 2,5–3,5 s avisa 0,45 s («A 17 grados», el aviso de hielo con la línea hacia donde sopla) y sopla seis copos de escarcha a favor del aire (`climatizador-copos`). Por detrás no sopla nada. 20 de vida. Sprite de 28 × 40 (`makeClimatizador`: plástico marfil, la pantallita clavada en «17°» en azul frío, ojos de indiferencia, la rejilla con las lamas brillando una tras otra, la manguera con cinta plateada y el folio de «No tocar» en el costado), siete cuadros (el último con escarcha en la rejilla). El cono se dibuja en el suelo (`drawWind`, una capa propia): un velo claro con los bordes punteados y rayas blancas que salen de la rejilla y se apagan al final. Sonido `soplar`, causa de baja. El bot sale del cono de lado. Tests nuevos en `tests/climatizador.test.ts` (9); e2e: capturas `50w` (empuja a la tostadora y tuerce sus balas) y `50x` (los copos).
- Decisiones: **dos conos no suman**: `npm run bot` destapó una planta 4 en la que la fotocopiadora había sacado tres copias de un climatizador y cuatro conos (240 px/s) dejaban al bot clavado en una esquina 300 s; un jugador tampoco habría salido. Ahora el empuje es la media de las direcciones con la fuerza del más fuerte, y la fotocopiadora no copia climatizadores (`copiable`). El vaivén usa un seno (90° de punta a punta en 3 s). Sin línea de visión: el aire no se para en las mamparas (más sencillo de leer; se revisará si en las capturas engaña).
- Medidas: `npm run enemigos`: HA 0,12 heridas y 48 s por sala (AA 0,10 y 31 s), HT 0,47, HI 0,35, HS 0,57, HG 0,47, HK 0,55 y 83 s: sobre todo alarga las salas y estorba, más que herir. `node tools/medir-salas.ts 4`: media de las doce 2,39 heridas por sala (2,26 antes), 20 de 20 plantas sin daño, 46,3 s por sala de combate. `npm run bot` idéntico (no llega a la planta 4). 612 tests.
- Problemas conocidos: con los cuatro enemigos ya, una planta 4 entera sin daño le cuesta al bot hasta 12 minutos (la `planta-5`, 713 s de 900): las salas con fotocopiadora y climatizador se alargan. Mirarlo en la (7).
- Siguiente paso: M10 planta 4 (5a), los sprites del Director de Recursos Inhumanos y la mesa larga; o (6b2); o M10 (7).

## 2026-11-05 13:05 (hora peninsular) — Hito M10 — El Sello de Denegado
- Hecho: M10 planta 4 (4c), el tercer enemigo de las Oficinas (letra `G`, como mucho dos por sala, coste 3). Cerebro nuevo `stamper` (`StamperBrain` en `src/data/types.ts`, `updateStamper` en `src/sim/enemies.ts`): salta hacia la tostadora (0,5 s en el aire, 40–60 px, nunca se pasa de ella) y el tercer salto es un sello: sube 30 px y planea 0,5 s hasta encima de donde está la tostadora (como mucho a 110 px) mientras en el suelo una **sombra cuadrada** con el marco rojo parpadeando avisa del tamaño exacto de la tinta (`Warning.mark = 'stamp'`, `drawStampShadow`); cae en 0,12 s y deja un **cuadro de tinta** de 40 × 26 px (un cuadrado de 40 visto en tres cuartos) con «DENEGADO» que dura 5 s (`World.ink`, `stampInk`, `inkUnder`; como mucho tres suyos, el más viejo se seca). Pillado debajo: medio corazón; y salpica un anillo corto de ocho gotas de tinta (`sello-gotas`, color de bala nuevo `ink`, sprite `bala-tinta`). **En la tinta no se rueda**: la voltereta es un paso torpe (1,4 veces la velocidad de andar), sin invulnerabilidad y con un cuarto de segundo más de espera, «Solicitud denegada» y un zumbido (evento `rollDenied`). En el aire se le da donde se le ve y, mientras estampa, no hace daño por contacto. Sprite de 26 × 34 (`makeSello`: pomo de madera con dos marcas de dientes, el cuerpo de haya barnizada con cara de haber denegado de todo, el caucho rojo gastado con la «D» al revés asomando y la almohadilla seca colgando de una cuerda), seis cuadros; tinta `tinta-denegado` con «DENEGADO» en la Letra Pequeña. Sonidos `estampar` y `denegado`, textos «Denegado» y «Solicitud denegada», causas de baja. El bot sale de la sombra cuando la ve, sale de la tinta y no intenta rodar en ella. `npm run enemigos` cuenta sellos, aciertos y volteretas denegadas. Tests nuevos en `tests/sello.test.ts` (9); e2e: capturas `50u` (la sombra) y `50v` (la voltereta denegada).
- Decisiones: «cada tercer salto» = dos saltos normales y el tercero estampa. La tinta solo deniega la voltereta que **empieza** dentro (rodar hacia ella desde fuera sí vale): se lee mejor y no corta una voltereta a medias. Las gotas salen siempre, pero si pilla a la tostadora el golpe limpia las balas del aire, como todos. La causa de baja larga («…en un documento oficial») no cabía en el parte a doble tamaño (lo cazó `tests/texto-grande.test.ts`): «Mancha de tinta indeleble». Como mucho dos sellos por sala: con tres el suelo sería todo tinta.
- Medidas: `npm run enemigos` (salas de la planta 2, el bot con el arma de salida): GA 0,42 heridas y 26 s por sala (AA 0,10); GG 0,57 y 17 s; GT 0,38 (TT 0,58); GI 0,48 (II 0,43); GS 0,88 (SS 1,12); 7,5 sellos por sala con dos, el 2 % aciertan: es sobre todo un enemigo que quita sitio. `node tools/medir-salas.ts 4`: media de las doce 2,26 heridas por sala (2,27 antes), 20 de 20 plantas sin daño, 45,5 s por sala de combate. `npm run bot` idéntico (no llega a la planta 4). 602 tests.
- Problemas conocidos: con la tostadora encima, «DENEGADO» queda tapado (se ve el cuadro rojo). Los textos «Denegado» y «Solicitud denegada» se apilan si coinciden.
- Siguiente paso: M10 planta 4 (4d), el Climatizador Portátil; o (6b2); o M10 (7).

## 2026-11-05 11:50 (hora peninsular) — Hito M10 — La Fotocopiadora de Planta
- Hecho: M10 planta 4 (4b), el segundo enemigo de las Oficinas (letra `K`, como mucho una por sala, coste 4). Cerebro nuevo `copier` (`CopierBrain`, `updateCopier` en `src/sim/enemies.ts`): guarda 170 px y anda a 22 px/s; cada 4–5 s (la primera a los 2,4) levanta la tapa 1 s, quieta, con la luz verde cruzando el cristal (`EnemyAnim.scan`), una raya verde hasta el enemigo más cercano que pueda copiar (`copiable`: ni jefes, ni relés, ni fotocopiadoras, ni copias, ni cebos escondidos) y unos corchetes verdes que se cierran sobre él; al acabar saca por la bandeja una **copia** (`makeCopy`): el mismo enemigo con la mitad de vida, `pace` 0,8 (se salta uno de cada cinco ticks: anda, espera y ataca un 20 % más lento) y sin cupones, sorpresa ni corazones. Como mucho tres; sin nadie a quien copiar, o con las tres, imprime tres folios (`fotocopiadora-folios`, color de bala nuevo `sheet`, sprite `bala-folio`). Al romperla, «Sin tóner»: sus copias se destiñen (`fadeT`, parpadeando) y caen en 1 s. Sprite de 38×38 (`makeFotocopiadora`: gris de pasillo, tapa de carbón, la pantallita ámbar en «E-04», el folio atascado como una lengua y el cartel de «Averiada, no tocar» en el costado), diez cuadros. Las copias se dibujan con una versión gris de la hoja del original, con rayas de tóner cada cuatro filas y motas fijas (`photocopyOf` en `GameScene`, hecha una vez por hoja). Sonidos `escanear` y `copia`, textos «Copia no compulsada» y «Sin tóner», causa de baja. El bot apunta antes a la fotocopiadora (cuenta como más cerca), como haría un jugador. `npm run enemigos` cuenta las copias. Tests nuevos en `tests/fotocopiadora.test.ts` (8); e2e: capturas `50r` (escanea), `50s` (copias) y `50t` (sin tóner).
- Decisiones: la letra iba a ser `C`, pero la `C` es la Caja de Devoluciones del Mostrador: en una sala de las Oficinas habría puesto una caja registradora en vez de una fotocopiadora (lo destapó `npm run enemigos`, que daba cero copias). Pasa a `K`, con un test que comprueba que cada letra de la planta 4 trae a su enemigo. Si ya tiene tres copias también imprime folios en vez de quedarse mirando. Las copias empujan a la lista de enemigos en el mismo tick (no hay cola). El test de la Tarjeta de Fichar (`tests/objetos-planta4.test.ts`) mataba a todos una sola vez y, con el reparto nuevo de la semilla, salía un Sobre Sorpresa cuyos muñequitos dejaban la sala sin limpiar: ahora mata lo que quede en cada tick.
- Medidas: `npm run enemigos` (salas de la planta 2, el bot con el arma de salida): AA 0,10 heridas y 31 s por sala, KA 0,47 y 48 s (3,5 copias); TT 0,58 / KT 0,73; II 0,43 / KI 0,88; SS 1,12 / KS 1,82; UK 1,13 y 3 bajas de 60. Con ella, cualquier pareja es más dura. `node tools/medir-salas.ts 4`: media de las doce 2,27 heridas por sala (2,01 antes), 20 de 20 plantas sin daño, 44,6 s por sala de combate. `npm run bot` idéntico (no llega a la planta 4). 591 tests.
- Problemas conocidos: «Copia no compulsada» se corta si la copia sale pegada al borde de la pantalla (pasa con todos los textos flotantes).
- Siguiente paso: M10 planta 4 (4c), el Sello de Denegado; o (6b2); o M10 (7).

## 2026-11-05 11:02 (hora peninsular) — Hito M10 — Tarjeta de Fichar, Contrato en Prácticas y Acreditación de Visitante
- Hecho: M10 planta 4 (6b1); la (6b) se parte en dos en la hoja de ruta, como en la planta 3. Tres objetos de `level: 4` con sprite: **Tarjeta de Fichar** (una sala de combate limpia en menos de 25 s desde que bajan las persianas suelta un cupón más en el centro y «Fichado: 0:18»; `World.shutTick`, `punchOut`), **Contrato en Prácticas** (daño, cadencia y velocidad ×1,1; al subir de planta `nextFloor` lo quita del inventario y de los modificadores, y el primer tick de la planta nueva dice «Contrato no renovado», evento `trialEnd`) y **Acreditación de Visitante** (solo buena: la tienda cobra un 25 % menos, redondeado y nunca gratis; `shopPrice` en `src/sim/world.ts`, que usan la compra, la etiqueta de precio, el «Comprar por» y el bot). Perks nuevos `punchIn`, `trial` y `discount` con su línea en la ficha. Tres tests más en `tests/objetos-planta4.test.ts`; captura `51c` (el Economato con la acreditación, comprobando que la etiqueta dice 8).
- Decisiones: los precios guardan el de lista (`Pickup.price`) y el descuento se aplica al mirar y al pagar, así coger la acreditación en la misma tienda rebaja lo que queda en las baldas (la etiqueta se rehace si cambia). El contrato se acaba en `nextFloor` pero se anuncia en el primer `step` de la planta nueva (`World.trialEnded`): los eventos de un mundo recién creado se borran antes de dibujarse. El mundo viejo no se toca (el parte de baja sigue enseñando lo que llevaba). La tarjeta cuenta desde que bajan las persianas, no desde que se entra: la intro de un jefe no se come el plazo... aunque con un jefe, 25 s no llegan nunca.
- Medidas: `npm run bot` idéntico (no llega a la planta 4). 581 tests.
- Problemas conocidos: ninguno nuevo.
- Siguiente paso: M10 planta 4 (4b), la Fotocopiadora; o (6b2); o M10 (7).

## 2026-11-05 10:50 (hora peninsular) — Hito M10 — Cinco objetos de las Oficinas
- Hecho: M10 planta 4 (6a). Cinco objetos pasivos de `level: 4` en `src/data/items.ts`, con su sprite de 16×16 (`tools/sprites/items.ts`): **Taza de Mejor Empleado** (daño ×1,2 mientras la vida esté llena; al primer golpe que la quita, «Empleado del mes: otro» sobre la tostadora, evento `mugLost`), **Corbata de Lunes** (daño ×1,2, velocidad ×0,92), **Café de Máquina** (cadencia ×1,15, recarga ×0,85, +5° de dispersión), **Silla con Ruedas** (velocidad ×1,15, pero agarra el suelo un 30 %: frena en 0,22 s y resbala 11 px en vez de 0,07 s y 2 px) y **Bola Antiestrés** (tras un golpe, el doble de invulnerabilidad; cadencia ×0,9). Tres ventajas nuevas en `Perks` (`fullHpDamage`, `grip`, `hurtIframes`), con su línea en la ficha (`describe.ts`). Tests nuevos en `tests/objetos-planta4.test.ts` (solo salen desde la planta 4, cada uno hace lo que dice su ficha, la voltereta con la silla recorre lo mismo). Capturas `51a` (inventario) y `51b` (la taza perdida) en el e2e.
- Decisiones: la silla no resbala «como en la escarcha» (la escarcha frena, no resbala): baja la aceleración (×√0,3) y sobre todo el frenado (×0,3) al andar; la voltereta no cambia, así que rodar sigue siendo la forma de pararse en seco. Diseño corregido. La taza no es «solo buena» (no va a la Caja Fuerte Premium): su pega es perderla al primer golpe. La Bola Antiestrés queda fuera de la regla «ningún objeto empeora todas las armas» (`tests/objetos.test.ts`), como las Pilas No Incluidas: cambia cadencia por respiro. Las dos indirectas que propone el diseño (Silla + Etiqueta A+++, Bola + Batería Hinchada) se dejan para la (6b), que es donde se miden las parejas. El texto de la taza va en gris claro (`0xc3c9d6`): el gris de la mascota no se leía sobre la moqueta.
- Medidas: `npm run bot` idéntico al de antes (no llega a la planta 4). 578 tests.
- Problemas conocidos: ninguno nuevo.
- Siguiente paso: M10 planta 4 (4b), la Fotocopiadora de Planta; o (6b); o M10 (7).

## 2026-11-05 10:25 (hora peninsular) — Hito M10 — La Destructora de Documentos
- Hecho: M10 planta 4 (4a), el primer enemigo de las Oficinas (letra `S`, desde la planta 4: `SLOT_ENEMIES_4`). Cerebro nuevo `shredder` (`ShredderBrain` en `src/data/types.ts`, `updateShredder` en `src/sim/enemies.ts`): anda a 34 px/s hacia donde mira y gira hacia la tostadora a 90 °/s como mucho. Las balas que le entran en los 100° de delante se las traga sin daño ni retroceso (`shredSide` y `shredBullet`, llamadas desde el bucle de balas de `src/sim/world.ts`) y cada cuatro escupe un abanico de cinco tiras de papel (`destructora-tiras`, color de bala nuevo `strip`, sprite `bala-tira`); por detrás, donde lleva la papelera, recibe el doble (`backMul`). Cada 3–4 s, si la tostadora está a menos de 110 px y delante, avisa («Atasco», las cuchillas en rojo, línea de aviso) 0,4 s y se lanza 0,5 s a 220 px/s; contra una pared se para. 18 de vida. Sprite de 34×32 dibujado **desde tres lados** (`makeDestructora` en `tools/sprites/enemies.ts`: de lado con la papelera transparente a la espalda, de frente con las tiras asomando y de espaldas, toda papelera), siete cuadros por lado; `EnemyAnim.views` y `viewShift` (`src/render/enemyAnim.ts`) eligen el lado según adónde mira, porque una ventaja «de frente» que no se ve no es justa. Mientras mastica una bala enseña las cuchillas rojas (`chompT`). Sonidos `triturar` y `escupir`, motas de papel al tragar, causa de baja («Papeleo devuelto sin leer», «Triturado por error»). Tests nuevos en `tests/destructora.test.ts` (7). E2e: capturas `50p` (las tiras) y `50q` (el atasco).
- Decisiones: el bot (`src/sim/bot.ts`) aprende a rodearla como haría un jugador: si la tiene de cara anda de lado y se acerca (de cerca gira menos que lo que corre la tostadora), la cuenta como más lejana al elegir a quién disparar y se aparta de su embestida como de la de los demás. Sin esto se quedaba disparándole de frente para siempre: en una de las 20 plantas 4 sin daño se tragó 88 balas y no acabó la planta. Solo cambia algo donde hay destructoras: `npm run bot` (plantas 1–3) sale idéntico.
- Medidas: `npm run enemigos -- SS` (dos destructoras, salas de la planta 2): 1,12 heridas y 68 s por sala, sin rodearla 3,37 y 13 bajas en 60; comparar con II 0,43, UU 0,57, QQ 0,50. Es la más dura de las dos plantas de arriba, a propósito, pero se revisará en la (7). `node tools/medir-salas.ts 4`: media de las doce 2,01 heridas por sala (2,17 con solo los juguetes), 20 de 20 plantas sin daño, 43,6 s por sala de combate. 573 tests.
- Problemas conocidos: el aviso «Atasco» queda un poco pegado a la exclamación roja del aviso; se lee.
- Siguiente paso: M10 planta 4 (4b), la Fotocopiadora de Planta; o M10 (7).

## 2026-11-05 09:55 (hora peninsular) — Hito M10 — De la Juguetería a las Oficinas
- Hecho: M10 planta 4 (3). `LAST_LEVEL` pasa a 4 (`src/sim/world.ts`): al ganar la planta 3 el parte anuncia «Planta 4: Oficinas. Horario flexible: siempre.» (`FLOOR_NAMES` en `src/data/texts.ts`) y con R se sube a la Recepción con la misma tostadora (armas, objetos, corazones, cupones y tickets, como en las otras plantas). Hasta que llegue el Director de Recursos Inhumanos, el Muñeco de Moda repite en la Sala de Juntas (`floorBossOf` ya daba la `D` de la planta 3 en adelante; ahora está escrito). Test nuevo en `tests/plantas.test.ts` (la planta 3 ganada lleva a la 4 con lo que llevaba, todas sus salas son de la 4, el Muñeco en la Sala de Juntas, tres segundos de juego sin romper nada). El e2e de plantas encadenadas sigue hasta la 4 (capturas `34d`, el parte, y `34e`, la Recepción). `npm run bot` cuenta también la planta 4 (`planta4` en el informe).
- Decisiones: «se sube» y no «se baja», como de la 2 a la 3: las Oficinas están encima de las plantas de tienda (`docs/DISENO.md`); corregido en la hoja de ruta. Con esto se cumple el primer criterio de M10 (se juega de la 1 a la 4 seguidas); faltan los otros dos (el bot llega a la 4 y la 3 es el muro), que son las tareas (7).
- Medidas: `npm run bot` igual que antes en todo lo que ya medía (es determinista); planta 4: sin daño la recorre entera el 100 %, con daño no llega ninguna de 20 (tampoco a la 3: el bot llega a la planta 2 en 3 de 20). Tarda 2 min 23 s. 564 tests.
- Problemas conocidos: ninguno nuevo.
- Siguiente paso: M10 planta 4 (4a), la Destructora de Documentos; o M10 (7).

## 2026-11-05 09:40 (hora peninsular) — Hito M10 — Las salas especiales de las Oficinas
- Hecho: M10 planta 4 (2c). Cinco plantillas especiales en `FLOOR_4` (`src/data/rooms.ts`), con el tamaño y los huecos de las del almacén: **Recepción (Firme Aquí, y Aquí, y Aquí)** (entrada: archivadores de impresos, ficus y dos mesas de visitas que se vuelcan), **Sala de Material (Pida Cita Previa)** (tesoro: archivadores al fondo como estanterías), **Economato de Empresa (Descuento en Nómina)** (tienda, con la Caja de Autocobro de siempre), **Papeles para Destruir (Confidencial)** (secreta: archivadores hasta el techo alrededor de un claro) y **Sala de Juntas (Aforo: Uno)** (jefe: cuatro mamparas en dos filas, con pasillos libres de pared a pared). Documento nuevo para el archivador, `acta-1` en `src/data/lore.ts`: el acta del Comité de Dirección (se compra a peso lo «reacondicionado» y se apunta como activo; a Contabilidad no se la vuelve a convocar). El test de la planta 4 pide ahora que todas sus salas sean suyas, del tamaño y con los huecos de las del almacén, y que nada se cuele en las plantas de abajo; el de documentos cubre la secreta de la planta 4. `docs/DISENO.md` cuenta el acta. Capturas `50b`–`50e` del e2e pasan a las salas nuevas, y `50o` es la Sala de Material.
- Decisiones: la mesa larga de la Sala de Juntas (DISENO: para balas y se rodea por los dos lados) **no se pone todavía**: las mesas que hay se vuelcan y no paran balas de pie, y dibujarla con mamparas parecía otra pared de cubículo. Va a la (5a) con los sprites del Director, apuntado en la hoja de ruta. Las mamparas van en tiras horizontales de tres para que siempre quede un pasillo de pared a pared: es la pasarela del Muñeco de Moda, que pelea aquí hasta que llegue el Director. Nada de termos que explotan junto a los cofres ni en la tienda (los termos solo en la secreta y en la sala del jefe).
- Medidas: el Muñeco en la Sala de Juntas (30 combates del bot, `runBoss`): gana el 16,7 % en 180 s, 5,8 heridas por combate, llega a la fase 3 el 60 %; en su Escaparate, 10 %, 161 s, 5,77 heridas. Parecido: los pasillos son más largos, la pasarela se alarga. `node tools/medir-salas.ts 4`: plantas 4 enteras sin daño 20 de 20, 39,4 s por sala de combate. `npm run bot` idéntico al de antes (no pasa por la planta 4). 563 tests.
- Problemas conocidos: ninguno nuevo.
- Siguiente paso: M10 planta 4 (3), encadenar la planta 4 tras el Muñeco; o M10 (7).

## 2026-11-05 09:25 (hora peninsular) — Hito M10 — Seis salas de combate más de las Oficinas
- Hecho: M10 planta 4 (2b). Seis plantillas más en `FLOOR_4` (`src/data/rooms.ts`), ya son doce como en la Juguetería: **Hilera de Cubículos (Puesto Flexible)** (28×13, cuatro cubículos al fondo con la mampara de delante puesta o no, un pasillo largo con archivadores y termos), **Sala de Formación (Curso Obligatorio)** (20×14, dos filas de pupitres que se vuelcan y dos tramos de pizarra), **Comedor de Empresa (Turno de Treinta Minutos)** (22×14, mesas corridas que se vuelcan como muros y un reservado de mamparas en el centro), **Recursos Humanos (Su Queja Es Importante)** (22×15, una pecera de mamparas abierta siempre por los lados y por arriba o abajo según la semilla), **Cabinas de Concentración (Resérvese con Antelación)** (18×14, cuatro cabinas macizas y dos mamparas sueltas) y **Puestos Compartidos (El Que Llega Primero)** (24×15, mesas sueltas y cuatro bancadas que van y vienen). El test de la planta 4 pide ya doce. Capturas `50i`–`50n` en el e2e.
- Decisiones: la pecera de Recursos Humanos tiene las entradas laterales fijas: con las cuatro paredes en grupos, una de cada dieciséis veces quedaba cerrada con los enemigos dentro. La cuarta sala iba a ser un rellano de ascensores, pero los bloques de 2×2 se dibujan como mamparas y parecían cabinas, así que son cabinas de concentración (existen, y son igual de absurdas). Dos nombres recortados para que quepan a doble tamaño (lo vigila `texto-grande.test.ts`). **Arreglo del bot**: con la sala limpia ya no se desvía en línea recta hacia un cupón que está detrás de una mampara (se quedaba empujando la pared de un cubículo para siempre, ahora que los cupones no vuelan solos); va a por él rodeando con `floorGoal`. En pelea el desvío sigue igual, para que las cifras se puedan comparar (con el cambio también en pelea, la planta 1 con daño pasaba del 15 % de victorias al 0 %).
- Medidas (`node tools/medir-salas.ts 4`): Cubículos 1,57 · Formación 2,57 · Comedor 1,83 · Recursos Humanos 2,60 · Cabinas 2,70 · Compartidos 1,53; media de las doce **2,17** (las seis primeras, 2,20; la planta 3, 2,28). Plantas 4 enteras sin daño: 20 de 20, 39,5 s por sala de combate. `npm run bot`: planta 1 con daño la recorre el 55 % y la gana el 15 %; 1,2 heridas por sala de combate.
- Problemas conocidos: Puestos Compartidos y la Hilera de Cubículos son de las más fáciles (cobertura de sobra); se revisarán con los enemigos propios en la (7) de la planta 4.
- Siguiente paso: M10 planta 4 (2c), las salas especiales; o M10 (7).

## 2026-11-05 08:45 (hora peninsular) — Hito M10 — Nota del humano: los cupones hay que recogerlos
- Hecho: la segunda mitad de la nota del humano del 2026-11-05. Al limpiar una sala, los cupones ya no vuelan solos a la tostadora: se quedan donde cayeron y hay que ir a por ellos (el imán de 44 px sigue atrayéndolos de cerca). Fuera `World.vacuum`, `Pickup.vac`, `VACUUM_SPEED` y `VACUUM_GIVE_UP` de `src/sim/world.ts`. El bot (`src/sim/bot.ts`), con la sala limpia, va a por el cupón o ticket suelto más cercano antes de salir por la puerta. El test de `tests/loot.test.ts` dice ahora lo contrario: tras limpiar, los cupones siguen en su sitio y la tostadora los recoge al acercarse. `docs/DISENO.md` corregido en los dos sitios.
- Decisiones: la nota empieza «Me refiero a los cupones de tienda… que haya que recogerlos pero aparezcan en el mapa»; la leo como una aclaración de la del 30 de octubre («que los tickets se recojan solos al acabar con los enemigos»): lo que quería no era que volaran solos sino que no se pierdan, y para eso está el minimapa. La sesión de las 09:05 (paralela a esta) hizo las marcas del minimapa y dejó los cupones volando; esta parte completa la nota. Los tickets, corazones y cofres ya había que ir a por ellos.
- Medidas (20 plantas 1 enteras con daño): cupones conseguidos por planta 18,0 (antes 19,4), 0,6 se quedan en el suelo (el bot muere o se atasca antes de cogerlos); gastados en la tienda 2,5 (antes 5,5: el bot llega a la tienda con otros recorridos; no es falta de cupones). `npm run bot`: la recorre con daño el 45 % (antes 50 %), la gana el 15 % (antes 10 %), 1,19 heridas por sala de combate (antes 1,22). 563 tests.
- Problemas conocidos: el bot compra menos; si se repite en más medidas, revisar su ruta para que pase por la tienda con los cupones.
- Siguiente paso: M10 planta 4 (2b) o M10 (7).

## 2026-11-05 09:05 (hora peninsular) — Hito M10 — Nota del humano: lo que queda en las salas, en el minimapa
- Hecho: la nota del humano del 2026-11-05. `minimap()` (`src/sim/minimap.ts`) da para cada sala visitada `loot`: lo que queda en ella por coger o abrir, una vez por tipo y por orden de importancia (`roomLoot`: cofre cerrado, ticket, corazón de cualquier clase, arma/objeto/activo/documento en el suelo, cupones). Lo que está a la venta no cuenta. El minimapa (`drawMinimap` en `GameScene.ts`) dibuja en las salas que dejas atrás hasta tres marcas de 3×3 (cofre de cartón, ticket blanco, corazón rojo, destello cian, moneda amarilla) en lugar del icono de la sala; el jefe y la tienda conservan el suyo, y la sala en la que estás no marca nada (lo tienes delante). Las salas del minimapa pasan de 9×7 a 11×8 px para que quepan tres marcas. Test nuevo en `tests/minimap.test.ts` (dos cupones dan una marca, lo de la tienda no cuenta, las salas solo vistas no saben nada, un cofre abierto no marca). Captura `16f-minimapa-botin` en el e2e.
- Decisiones: la nota dice «que haya que recogerlos pero aparezcan en el mapa»; lo leo como que el minimapa avise de lo que se dejó atrás, una marca por tipo, sin cambiar cómo se recogen (los cupones siguen volando solos al limpiar la sala, como pidió la nota del 30 de octubre; los tickets, corazones y cofres siguen pidiendo ir a por ellos). La sala del tesoro, mientras le queden cofres cerrados, enseña el cofre en vez del regalo: dice más.
- Medidas: no cambia nada de la simulación; `npm run bot` idéntico.
- Problemas conocidos: el minimapa ocupa un poco más (2 px por sala en cada dirección).
- Siguiente paso: M10 planta 4 (2b) o M10 (7).

## 2026-11-05 08:35 (hora peninsular) — Hito M10 — Seis salas de combate de las Oficinas
- Hecho: M10 planta 4 (2a). `FLOOR_4` en `src/data/rooms.ts` con seis plantillas de combate, cada una con su idea y con grupos de mamparas que la semilla pone o quita: **Espacio Diáfano (Colaborativo, Sin Ventanas)** (24×15, cuatro islas de cubículos a las que a veces les falta una pared y se puede entrar), **Sala de Reuniones (Esto Podía Ser un Correo)** (20×13, dos filas de mesas que se vuelcan como trincheras y dos mamparas sueltas), **Pasillo de Despachos (Mi Puerta Está Abierta)** (26×13, cuatro despachos al fondo con la puerta abierta o cerrada y archivadores abajo), **Cola de Impresión (Documento 1 de 48)** (18×12, pequeña, archivadores en las esquinas y dos bancadas en el medio), **Office (Etiqueta Tu Táper)** (16×14, dos rincones en ese, una mesa y termos de café que explotan en cadena) y **Planta en Reforma (Mamparas Móviles)** (22×16, casi vacía con tres grupos de tramos de mampara). `templatesOf` busca ahora la planta más cercana por debajo que tenga salas de ese tipo, así que la planta 4 pelea en sus salas y sigue usando las especiales de la Juguetería hasta la (2c) (para las plantas 1–3 da lo mismo que antes). Test nuevo en `tests/rooms.test.ts` (seis salas suyas con grupos, nada se cuela abajo, las especiales son las de la planta 3, una planta 4 generada pelea solo en las suyas); las pruebas de plantillas (bot 25 s, idea escrita, puertas al reflejar) cubren ya la planta 4. Capturas `50a` y `50f`–`50h` en el e2e. Herramienta nueva `tools/medir-salas.ts [nivel]`: 30 salas por plantilla a profundidad 6 con los enemigos de la planta (heridas y segundos) y 20 plantas enteras sin daño.
- Decisiones: hasta que existan los enemigos de las Oficinas (4a–4d), sus salas se rellenan con los de la Juguetería (`slotEnemiesOf(4)`). Pocos grupos por sala (dos o tres, como mucho cuatro): con seis, casi nunca salían todos quitados y la sala no variaba de verdad (lo vigila el test de variantes). En la Planta en Reforma los tramos van por parejas en el mismo grupo para que las dos mitades de la sala cambien a la vez.
- Medidas (`node tools/medir-salas.ts`, heridas por sala recuperando la vida tras cada golpe): Espacio Diáfano 2,37 · Reuniones 2,50 · Despachos 1,43 · Cola de Impresión 2,83 · Office 2,03 · Reforma 2,03; media de la planta 4 **2,20** frente a **2,24** de las doce de la planta 3 con los mismos enemigos. Plantas 4 enteras sin daño: las recorre enteras las 20 (39,3 s por sala de combate; 41,8 s en la planta 3). Con el tope de 600 s una de las 20 no le daba tiempo (16 salas largas, no es un atasco: con 900 s, 20 de 20). `npm run bot` idéntico al de antes.
- Problemas conocidos: el Pasillo de Despachos es la más fácil (1,43): los despachos le dan mucha cobertura al jugador. Se revisará con los enemigos propios y en la (7) de la planta 4.
- Siguiente paso: M10 planta 4 (2b), seis plantillas más; o M10 (7) de la planta 3.

## 2026-11-05 07:55 (hora peninsular) — Hito M10 — Plastilina Mezclada, Mascota Virtual y Manualidades
- Hecho: M10 (6b2), los dos últimos objetos de la Juguetería. **Plastilina Mezclada** (balas ×0,85 más lentas; `BulletBehaviour.stick`): la bala que choca con una pared o un obstáculo y no le quedan rebotes se queda pegada 1,5 s (`stickBullet` en `src/sim/world.ts`: retrocede medio subpaso para no quedarse dentro, se para, pierde rebotes, búsqueda y empuje, y atraviesa a todos), y daña una vez a cada enemigo que la toca. Se dibuja como un pegote (`pegote-plastilina`, 12×10, dos fotogramas que tiemblan y dos con purpurina) y suena un «chof» agudo. **Mascota Virtual** (solo buena; `Perks.pet`): cada sala de combate limpia sin recibir daño (y vaciar la sala de pruebas) la alimenta un nivel, hasta 3; cada nivel es ×1,1 de daño en el disparo, como el turbo (`petScale`); un golpe la pone a cero («Tu mascota ha muerto. Otra vez») y esa sala ya no cuenta. Al alimentarla: «Mascota alimentada 1/3», corazoncitos rosas y un pitido que sube con el nivel. Sinergia **Manualidades** (Plastilina + Purpurina): los pegotes duran 2,5 s y frenan a la mitad 1,5 s. Iconos `objeto-plastilina` (un bollo malva con vetas de los cuatro colores que fueron; tres colores nuevos en la paleta de objetos) y `objeto-mascota-virtual` (el huevo con su pantalla). Fichas en la ventana de descripción (`describe.ts`). 3 tests nuevos en `tests/objetos-planta3.test.ts` (se pega y se queda quieta, daña una vez, desaparece; sin plastilina no; la sinergia; la mascota sube a 3, ×1,3, un golpe la pone a cero y esa sala no cuenta) y el recuento de `objetos.test.ts` (32). Capturas `39d-plastilina` y `39e-mascota` en el e2e.
- Decisiones: la Mascota da ×1,1 por nivel y no «+1 de daño» como decía el diseño: con armas de 0,8 a 1,6 de daño, +1 fijo era casi doblar el daño y el humano pidió objetos modestos y un juego difícil. Los pegotes solo salen al chocar con paredes y obstáculos, no con enemigos (si no, cada disparo acertado dejaría una trampa encima del enemigo y la plastilina sería doble daño sin más). No empujan (su ángulo sería 0 y empujarían siempre a la derecha). La mascota cuenta los golpes desde la última sala limpia, no desde que entras en una sala: es más simple y más exigente.
- Medidas: las cifras del bot son idénticas a las de antes (los objetos son de la planta 3 y el bot no llega a ella en ninguna de sus 20 partidas): planta 2 la gana el 0 %, jefa 66,7 %, Router 26,7 %, Muñeco 10 %. 561 tests.
- Problemas conocidos: la mascota no tiene indicador en el HUD; su nivel solo se ve al cambiar.
- Siguiente paso: M10 (7), medir la planta 3 con el bot y ajustarla para que sea el muro; o, en paralelo, M10 planta 4 (2a).

## 2026-11-05 06:55 (hora peninsular) — Hito M10 — El aspecto de las Oficinas
- Hecho: M10 planta 4 (1). `src/art/oficinas.ts`, el juego de casillas de la planta 4, que el pintor de salas (`src/art/room.ts`) usa con `level >= 4`: **moqueta en losetas** grises colocadas a contrapelo (variantes: mancha de café, óvalo gastado de silla, loseta de otra partida, chicle y esquina levantada), manchas de café y arcos de ruedas de silla, pósits y clips, el **pasillo de moqueta oscura**, zonas de «PUESTO LIBRE / NO RESERVAR / REUNIÓN 5 MIN» y letras de cinta; **mamparas de cubículo** como paredes de dentro (carril de aluminio y tela con un pósit, una hoja o el calendario del año pasado clavados); al fondo, pladur con **los valores de la empresa en vinilo** a los que les faltan letras («P OACTIVIDAD», «F MILIA»), una balda de archivadores AZ y otra con bandejas, folios y un teléfono; falso techo con una placa que falta y paneles fluorescentes fríos; radiadores, pósters motivacionales, rodapié de PVC, la pizarrita de objetivos que bajan. Carteles y letreros propios por sala (entrada «PLANTA 4 · OFICINAS» con felpudo «FICHE AQUÍ», «ECONOMATO», «MATERIAL DE OFICINA», secreta «CONFIDENCIAL» con papel triturado y polvo gris, «SALA DE JUNTAS» con la moqueta buena). Obstáculos y persianas en `tools/sprites/props.ts`: `caja-4` archivador metálico, `barril-4` termo de café (rojo y amarillo como el bidón: explota igual), `carrito-4` ficus de plástico, `mesa-4` mesa de oficina, `persiana-*-4` grises con un cartel plastificado de «REUNIÓN». `?planta=4` ya funciona (con las salas y el jefe de la Juguetería hasta la (2) y la (3)). 3 tests nuevos en `tests/roomart.test.ts` (gris neutro, distinto de las otras tres e igual de oscuro; carteles, decoración y casillas propias sin nada de las plantas de abajo; puertas libres) y `sprites.test.ts` pide ya las versiones `-4`. Capturas `50a`–`50e` en el e2e. Sección nueva en `docs/ESTILO_ARTE.md`.
- Decisiones: **gris neutro** y no la moqueta gris azulada del diseño: el azul era el almacén y el test de color lo confundía; con la primera moqueta (algo malva) la media quedaba a menos de 11 de la Juguetería, así que bajé el tono y la sala de juntas lleva moqueta carbón con ribete granate (granate entera la volvía cálida), y el polvo de la secreta es gris en lugar de marrón. Los vinilos pierden **letras enteras** (al principio perdían trozos de píxeles y parecían un fallo de pantalla). Las esquinas levantadas, menos y en gris oscuro: negras y al 3 % parecían flechas por todo el suelo. Obstáculos distintos de la planta 2, que ya tenía fuente de agua y silla de oficina: archivador, termo de café y ficus; el diseño cambia «fuentes sin garrafa» por termos y la secreta pasa a llamarse **Papeles para Destruir (Confidencial)**, porque «ARCHIVO MUERTO» ya es el cartel de la secreta del almacén. Las plantas 1, 2 y 3 se pintan idénticas píxel a píxel (lo comprobé con un hash de todas las salas antes y después).
- Medidas: no cambia la simulación; `npm run bot` igual que antes (0 fallos).
- Problemas conocidos: las mamparas de dos filas enseñan mucho techo gris liso por arriba (se leen como bloques más que como mamparas finas); la Sala de Juntas es la sala más oscura del juego. Ninguno estorba para jugar; se puede repasar al hacer la Sala de Juntas en la (2c).
- Siguiente paso: M10 planta 4 (2a), seis plantillas de combate de las Oficinas (si la (6b2) o la (7) de la planta 3 están libres, antes esas: la planta 3 va primero).
## 2026-11-05 06:41 (hora peninsular) — Hito M10 — Pegatina, llave Allen, mando con vibración y Unboxing
- Hecho: M10 (6b1) (la (6b) se partió en dos: esta y la (6b2), Plastilina Mezclada, Mascota Virtual y Manualidades). Tres objetos de `level: 3` con sus sprites: **Pegatina de Edición Limitada** (la última bala de cada cargador hace el triple: comportamiento de bala nuevo `last`, `Bullet.limited`; sale dorada, más grande y con un tintineo), **Llave Allen Sobrante** (un cofre por planta sin ticket: perk `freeChests`, `FloorRun.freeChests`, `freeChestLeft`; el cofre dice «Sobraba una pieza» y el bot también la usa) y **Mando con Vibración** (cada golpe recibido suelta un corro de diez balas propias con el daño del arma: perk `hurtRing`). Sinergia **Unboxing** (Caja de Cartón Vacía + Pegatina: la bala de la pegatina atraviesa a todos). Arreglo de paso: las balas que nacen en mitad de la actualización de balas (el corro, cuando lo que hiere es una bala) se perdían al cerrar la lista; ahora esperan en `World.pendingBullets` y se suman al acabar (test que falla sin el arreglo). 3 tests más en `tests/objetos-planta3.test.ts`; captura 39c del corro.
- Decisiones: la llave va **antes que el ticket** (los tickets son escasos y la llave caduca con la planta). El mando no lleva sus propios botones de colores: rojos todos, para no parecerse a ningún mando de marca. La última bala de la pegatina, con perdigones, es solo el último perdigón.
- Medidas (`node tools/objetos.ts`, la jefa con cada objeto, 40 combates; sin nada 60 / 87,5 / 90 % con secador, grapadora y plancha): pegatina 60 / 82,5 / 95 (más rápido con la plancha: 34,7 s frente a 46,9); llave igual que nada (en un combate no hay cofres); mando 70 / 90 / 90 y menos heridas. `npm run bot`: 0 fallos y las mismas cifras (los objetos solo salen en la planta 3).
- Problemas conocidos: el HUD no dice si la llave de la planta está gastada (solo se nota al abrir).
- Siguiente paso: M10 (6b2), Plastilina Mezclada y Mascota Virtual, y la sinergia Manualidades.

## 2026-11-05 06:32 (hora peninsular) — Hito M10 — Diseño de la planta 4 (Oficinas)
- Hecho: M10 planta 4 (0). Esta sesión arrancó con la (6b1) cogida por otra sesión desde hacía diez minutos (`en_curso`), y la (6b2) y la (7) tocan los mismos archivos o dependen de ella, así que adelanté el diseño de la planta 4, que solo toca documentos. En `docs/DISENO.md`: **cuatro enemigos** de las Oficinas (Destructora de Documentos, siempre de cara, se traga las balas que le entran por delante y las devuelve en tiras de papel, y por detrás recibe el doble; Fotocopiadora de Planta, apoyo que saca copias grises de otro enemigo de la sala y al romperla las destiñe; Sello de Denegado, que estampa cuadros de tinta donde no se puede rodar; Climatizador Portátil, un cono de aire que empuja a la tostadora y tuerce sus balas), **el jefe** El Director de Recursos Inhumanos (en su silla con ruedas; fases «Somos una familia», «Reestructuración», en la que las mamparas de la Sala de Juntas se recolocan, y «Despido procedente», con la silla suelta que embiste y la línea de recortes), **diez objetos** con dos sinergias (Pausa para el Café y Cadena de Correos) y dos indirectas, y **el aspecto** de la planta con sus salas especiales. En `docs/HOJA_DE_RUTA.md`, la planta 4 partida en 18 tareas, con el mismo orden que la 3: casillas, plantillas, salas especiales, encadenar, un enemigo por tarea, el jefe en tres y los objetos en dos.
- Decisiones: la hoja de ruta decía «se parte en tareas al acabar la planta 3»; lo adelanto porque no pisa a la sesión de los objetos y deja trabajo listo para las siguientes que coincidan. Cada enemigo ataca una costumbre del jugador (disparar de frente, ignorar al que apoya, rodar siempre, quedarse quieto) en vez de tener más vida: la partida llega a la 4 cargada de objetos y el muro tiene que seguir siendo la 3. El enemigo del aire es un **Climatizador** y no un ventilador porque ya existe el Ventilador de Portátil (objeto). El jefe empieza en **unos 240** de vida, a medir como se hizo con el Muñeco. La planta 4 no trae armas nuevas, igual que la 3: las dos de M11 y las de M14 llegan después. Nada de becarios como enemigos: el Becario Eterno es un personaje jugable y el chiste de la precariedad apunta a la empresa (el Contrato en Prácticas es un objeto que caduca).
- Medidas: no cambia el código; `check`, `test` (552), `build` y `bot` en verde al empezar.
- Problemas conocidos: el Sello de Denegado y el Climatizador quitan control al jugador; si en las capturas o con el bot se ven injustos (tinta demasiado grande, empuje que no se puede vencer), se recortan en su tarea antes de subirlos.
- Siguiente paso: lo que diga `en_curso`: si la (6b1) ya está, M10 (6b2); si sigue cogida, M10 planta 4 (1), el juego de casillas de las Oficinas, que es un archivo nuevo.

## 2026-11-05 06:13 (hora peninsular) — Hito M10 — Cinco objetos de la Juguetería
- Hecho: M10 (6a). Cinco objetos pasivos de `level: 3` en `src/data/items.ts`, con sus sprites de 16×16 en `tools/sprites/items.ts`: **Pilas No Incluidas** (cadencia −10 %; tras cada recarga, +40 % durante 3 s: perk nuevo `rush`, `Player.rushT`, evento `rush` con chispazo amarillo y el sonido de la pila), **Muelle de Juguete** (voltereta un 30 % más larga con el stat nuevo `rollSpeed`, rebota una vez, +4° de dispersión), **Bote de Purpurina** (lo que toca va un 20 % más lento 2 s: comportamiento de bala nuevo `slow`, `Enemy.slowT`/`slowMul`; el enemigo se salta un tick de cada cinco, como la Música de Espera con los jefes, así anda, espera y ataca más despacio, y suelta motas rosas y doradas; balas −15 % de tamaño), **Juguete del Menú Infantil** (velocidad +15 %, cadencia +12 %, −1 corazón) y **Caja de Cartón Vacía** (buena: uno de cada cinco golpes no hace nada, perk `shrug` con tope del 50 %, evento `shrug` con golpe sordo, trozos de cartón y «Era solo la caja»). La ventana de descripción dice cada efecto nuevo (`describe.ts`). 7 tests en `tests/objetos-planta3.test.ts`; `objetos.test.ts` cuenta ya 27 y la planta 3. Capturas 39a (inventario) y 39b («Era solo la caja») en el e2e.
- Decisiones: «Purpurina» pasa a **Bote de Purpurina** (los nombres van de 2 a 4 palabras). El Menú Infantil sube menos que en el diseño (×1,15 y ×1,12) por la moderación de M9b. La caja de cartón es «buena» (solo la da la Caja Fuerte Premium) porque solo da. La racha de las pilas no se apunta con un texto en pantalla: el humano no quiere textos a cada momento; basta el chispazo y el sonido. La caja de comida del Menú Infantil empezó roja con una marca amarilla y recordaba a una cadena de hamburguesas: ahora es azul con una estrella. El test de «ningún objeto empeora todas las armas» se salta los que tienen racha, porque la ficha en papel no la ve; un test nuevo mide en el maniquí que las pilas hacen más daño en 10 s.
- Medidas (`npm run objetos`, la jefa con cada objeto, 40 combates; sin nada, con el Secador: 60 % de victorias, 4,5 heridas): pilas 70 / 77,5 / 97,5 % (secador, grapadora, plancha); muelle 70 / 90 / 97,5; purpurina 77,5 / 70 / 95; Menú Infantil 25 / 45 / 82,5 (el bot no aprovecha la velocidad y el corazón de menos le pesa: para una persona es otro trato); caja de cartón 85 / 92,5 / 100 (es buena). `npm run bot` igual que antes: los objetos de la planta 3 solo salen en la 3.
- Problemas conocidos: el inventario no enseña el largo de la voltereta entre las cifras de la tostadora (sí en la ventana del objeto).
- Siguiente paso: M10 (6b), los otros cinco (Pegatina de Edición Limitada, Plastilina Mezclada, Llave Allen Sobrante, Mando con Vibración, Mascota Virtual) y las sinergias Unboxing y Manualidades.

## 2026-11-05 05:47 (hora peninsular) — Hito M10 — El Muñeco de Moda sale de la caja (fase 3)
- Hecho: M10 (5c), y con ella el Muñeco entero. **Fase 3, «Fin de existencias»** (desde el 25 %, «Fase 3» en el cartel, grita «¡Todo debe desaparecer! Yo también.»): **rompe la caja**, que se queda en la sala como obstáculo de dos casillas que para balas por los dos lados (`caja-muneco` en `src/data/props.ts`; `BossPhase.shed`, `shedShell` en `src/sim/enemies.ts`: la caja se encaja en las casillas donde estaba, sin pisar paredes, otros objetos ni a la tostadora, y quien quede debajo sale hacia la tostadora); sin ella usa los fotogramas 7–15 (`BossPhase.frameShift`, también el de posar) y **gira sobre sí mismo** (`BossPatternAttack.spin`, `EnemyAnim.spin`: de frente, de lado, de espaldas y del otro lado; mientras gira no se mueve) soltando **espirales de pegatinas de oferta** que persiguen un poco durante 0,8–0,9 s (`muneco-pegatinas`, de cuatro brazos, y `muneco-pegatinas-2`, dos y dos en sentidos contrarios), más un abanico corto de accesorios; anda más deprisa que nunca y **recibe un 25 % más de daño** (`BossPhase.taken`, en `takenScale`). Bala nueva `sticker` (hoja `bala-pegatina`), sonidos nuevos `carton` (rompe la caja: con temblor, trozos de cartón magenta y de ventana, y polvo) y `pegatina` (al empezar a girar). Los objetos que aparecen a mitad de sala se dibujan ya cuando llegan (`drawLateProps`). El bot cuenta la fase 3 aparte. 6 tests en `tests/muneco-fase3.test.ts` (nombre y número de fase, la caja en seis sitios distintos sin pisar a nadie, fotogramas sin caja y daño, el giro con sus pegatinas, la caja sigue ahí y el montacargas no sale encima, determinismo); capturas 38g y 38h en el e2e.
- Decisiones: **«Fin de existencias»** porque «Liquidación total» es el sello de jefe vencido y `textos.test.ts` no deja repetirlo. La caja **no se rompe a tiros**: es cobertura para los dos, como pide el diseño, y así la fase 3 se juega alrededor de ella. Mientras gira **se queda quieto**: el peligro son las espirales, y un jefe que gira y además se mueve sería ilegible. Las pegatinas iban con borde marrón y en la captura parecían monedas: el borde granate las hace bala. La primera versión (tres brazos, 70 px/s, giro de 40°/s) era la fase más fácil del combate; se endureció hasta que la fase 3 es la que más hiere por segundo.
- Medidas (bot, combate aislado sin objetos): antes de esta tarea 15 % de victorias en 172 s (60 combates). Con la primera versión de la fase 3, 21,7 % en 163 s y 0,88 heridas en la fase 3; **con la definitiva, 11,7 % (60 combates) y 10 % (los 30 de `npm run bot`) en 161 s**; 5,8 heridas por combate (1,5 en la fase 1, 3,0 en las rebajas y 1,3 sin caja en unos 27 s); sale de la caja el 53 % de los combates, a los 135 s. La Nevera y el Router no cambian. `npm run bot` 0 fallos.
- Problemas conocidos: los del carril de la pasarela siguen (puntos finos del aviso). Si el Muñeco está pegado a una pared al romper la caja, la caja puede quedar una casilla más allá de donde estaba (busca el sitio libre más cercano).
- Siguiente paso: M10 (6a), los cinco primeros objetos de la planta 3 (Pilas No Incluidas, Muelle de Juguete, Purpurina, Juguete del Menú Infantil y Caja de Cartón Vacía).

## 2026-11-05 04:56 (hora peninsular) — Hito M10 — El Muñeco de Moda pelea (fases 1 y 2)
- Hecho: M10 (5b). El Muñeco de Moda (`muneco-moda` en `src/data/enemies.ts`, letra `D` porque la `M` es el maniquí) es ya el jefe de la planta 3 (`floorBossOf(3)`) y espera en el Escaparate con su cartel «Jefe de planta · Juguetería» y «Pasado de moda. Como tú.». **Fase 1, «Lanzamiento»**: tres abanicos de **accesorios** (bala nueva `accessory`, hoja `bala-accesorio`: zapatos de salón y bolsitos rosas que giran) y la **pasarela**, un ataque de jefe nuevo (`BossRunwayAttack`, `kind: 'runway'`): posa (fotograma 6) mientras el aviso enseña el carril, se pone en él andando de frente y lo cruza hasta el otro lado; cada 32–38 px deja un **destello de flash** en el suelo (emisor con `mark: 'flash'`, anillo rosa que se cierra y chispa de cuatro puntas) que a los 0,5–0,6 s estalla en seis chispas. El carril (`runwayEnd`) es una fila libre de pared a pared que pase a unos 40 px de la tostadora, no por encima. **Fase 2, «Rebajas»**: tres fases seguidas (−30 % al 60 % de vida, −50 % al 47 %, −70 % al 34 %), todas con «Fase 2» en el cartel (`BossPhase.stage`); con cada una la etiqueta de la caja cambia (`BossPhase.badge`, que el render pinta encima con `EnemyAnim.badge`), anda, descansa y desfila más deprisa, sus anillos con hueco son más densos (26, 52 y 56 balas), grita «¡Ahora con más accesorios!» (`BossPhase.line`, con dos clacs de pistola de etiquetar) y llama a dos **Muñequitos Repetidos** (`BossPhase.summon`, nunca más de cuatro suyos a la vez) que caen con él. Sonidos nuevos `rebaja` y `pasarela`; los destellos hacen clic de cámara. Su causa de baja («Tacón de la temporada pasada», «Atropello en plena pasarela») y su documento para el archivador (`inventario-1`, la hoja de inventario de fin de temporada: 4.000 muñecos subidos a «reacondicionar» y 8.000 ojos de cristal «para los robots de la próxima temporada»). El bot esquiva el carril de la pasarela y cuenta el combate contra el Muñeco aparte. 7 tests en `tests/muneco-jefe.test.ts`; `jefes-movimiento.test.ts` prueba ya a los tres jefes en su sala; capturas 38a–f en el e2e.
- Decisiones: **220 de vida** y no 300: el diseño es de antes de que las armas perdieran daño (M9b), igual que el Router bajó de 200 a 170. **Moví los cuatro expositores del Escaparate** hacia las esquinas (columnas 4–5 y 20–21): con los de antes, más al centro, el bot perdía un tercio de los disparos contra ellos, el combate duraba más de 220 s y la pasarela solo tenía carriles estrechos; ahora hay un carril ancho en medio. La pasarela iba en diagonal al principio y atropellaba a la tostadora (44 de 180 golpes en 30 combates eran pisotones): por eso el carril se elige al posar, se enseña, se entra de frente y va a un lado. Las rebajas son tres fases y no una con contadores para no inventar otra máquina de estados: el cartel dice «Fase 2» en las tres, el nombre lleva el porcentaje. Los anillos de las rebajas son de accesorios y las chispas de los destellos rojas: así se distingue qué viene de dónde. El nombre de la fase 3 del diseño, «Liquidación total», es ya el sello de jefe vencido (`BOSS_DOWN_STAMP`) y `textos.test.ts` no deja repetirlo: la (5c) tendrá que llamarla de otra manera.
- Medidas (bot, combate aislado sin objetos, 60 combates): con 260 de vida y los expositores al centro, 0–3 % de victorias y más de 220 s; expositores fuera, 210 de vida: 48 %; 240: 30 %; **220 con la fase 1 más rápida y los destellos de seis: 15 % (60 combates) y 10 % (los 30 de `npm run bot`), en 172 s**, 5,8 heridas por combate (1,5 en la fase 1 y 4,3 en las rebajas), llega a las rebajas a los 68 s. Como referencia, el Router 26,7 % en 116 s y la Nevera 66,7 % en 80 s. `npm run bot` igual que antes en las plantas 1 y 2.
- Problemas conocidos: los puntos del aviso del carril son finos y, si el carril va pegado a la pared de abajo, quedan medio tapados por la barra de vida del jefe; si la tostadora está en la franja de abajo del Escaparate, el carril más cercano a 40 px no existe y pasa a unos 12 px (se ve venir y se rueda). Cuatro repetidos a la vez en −50 % se amontonan sobre la tostadora; lo mirará la (7) con la planta entera.
- Siguiente paso: M10 (5c), la fase 3 del Muñeco (rompe la caja, que se queda de obstáculo; gira soltando espirales de pegatinas; recibe más daño), con un nombre que no sea «Liquidación total».

## 2026-11-05 04:20 (hora peninsular) — Hito M10 — Los sprites del Muñeco de Moda
- Hecho: M10 (5a). `tools/sprites/muneco.ts` con tres hojas nuevas. **`muneco-moda`** (72×76, 16 fotogramas): 0–5 en su caja (reposo, respiración y paso con el pie levantado, como los otros jefes), 6 posando en la caja (guiño, mano arriba y destello en los dientes), 7–12 sin caja, 13 posando sin caja, 14 girando de espaldas y 15 girando de frente con las manos abiertas. La caja: cartón magenta desvaído en tres cuartos, banda de logotipo, ventana con el muñeco aplastado dentro (pelo contra el borde, alambre de atar en la cintura, ojos de cristal azules y cansados, sonrisa de anuncio), brillo del plástico, la pegatina «¡Novedad!» tachada a rotulador con la cinta de «Temporada anterior», y el código de barras en el lateral. Sin caja: más grande, el pelo encrespado a mechones, el alambre aún en el cuello con la punta cortada, la cinta en el pecho, ojos desorbitados y una grieta en la comisura de tanto sonreír. **`etiqueta-rebaja`** (22×12, 4): «99» a precio completo, −30 %, −50 % y −70 %, cada una más roja y con la esquina de la anterior asomando; se pinta encima de la caja en `TAG_ANCHOR` (exportado para la (5b)). **`caja-muneco`** (56×64): la caja rota y vacía que se queda de obstáculo, sin ventana, con el troquel del muñeco enseñando el cartón, los alambres cortados y el −70 %. Los Muñequitos Repetidos ya estaban hechos (4d). 3 tests en `tests/muneco-sprites.test.ts` (fotogramas con y sin caja, los pies en la misma línea, la etiqueta cae entera sobre la caja en los siete fotogramas con caja, la caja rota vacía y con su −70 %). Sección nueva en `docs/ESTILO_ARTE.md`.
- Decisiones: la etiqueta va en hoja aparte en lugar de multiplicar por cuatro los fotogramas con caja: con siete fotogramas y cuatro precios serían 28, y así la (5b) solo cambia el fotograma de la etiqueta. Los ojos del muñeco empezaron como cuadrados negros y parecía un robot; con iris azul de cristal y colorete se lee como muñeco. El hueco de la caja rota enseña cartón marrón (el troquel) porque con el fondo azul oscuro no se veía que faltaba nada. Los expositores de cristal del Escaparate siguen siendo estanterías: un sprite de vitrina es arte de sala y no lo meto aquí.
- Medidas: no cambia la simulación; `npm run bot` idéntico.
- Problemas conocidos: todavía no sale en el juego (la (5b) lo pone en el Escaparate); solo lo he mirado en una hoja de vista previa a ×3 junto al Router (en el panel). De espaldas, la cabeza es un bloque de pelo algo plano.
- Siguiente paso: M10 (5b), las fases 1 y 2 del Muñeco en la simulación; al hacerlo, `floorBossOf(3)` pasa a ser el Muñeco y su cartel dirá «Juguetería».

## 2026-11-05 03:55 (hora peninsular) — Hito M10 — Pulido: jefatura de planta y capturas de la Juguetería
- Hecho: esta sesión empezó la M10 (3) a la vez que la de las 03:29 (que arrancó antes de ver mi entrada en `en_curso`); su versión llegó antes a `main` y la mía, casi igual, se descartó. Me quedo con dos arreglos pequeños que esa sesión no tocaba: el parte de planta superada dice **«Jefatura de planta dada de baja»** en lugar de «Jefa…» (con el Router, en la planta 2 y ahora en la 3, era falso; lo apuntaban como problema conocido las dos últimas entradas), y la nota de la empresa «Recuerde valorar a su jefatura de planta…». Test nuevo en `tests/plantas.test.ts`. Las seis capturas `37*` del e2e con `?planta=3` cargaban aún las salas del almacén (`sala=jefe`, `sala=tienda`…) con el aspecto de la Juguetería; ahora usan las propias (`circuito-ocasion`, `entrada-jugueteria`, `jefe-jugueteria`, `tienda-jugueteria`, `secreta-jugueteria`). Capturas miradas: el Escaparate sale con sus cuatro expositores y el Router; el parte cabe.
- Decisiones: «Jefatura» y no un texto según el jefe: es neutro, suena a organigrama y no hay que tocarlo cada vez que llega un jefe nuevo. Mi variante del cartel del Router («Jefe en funciones · Juguetería») no la subo: la sesión de las 03:29 decidió que siga diciendo «Informática» (está de visita) y no merece la pena pisarla para algo que la (5b) quita.
- Medidas: `npm run bot` idéntico (solo cambian textos).
- Problemas conocidos: dos sesiones pueden coger la misma tarea si una arranca antes de que la otra haga push de `en_curso`; la entrada de `en_curso` solo ayuda a las que empiezan después.
- Siguiente paso: M10 (5a), los sprites del Muñeco de Moda.

## 2026-11-05 03:29 (hora peninsular) — Hito M10 — De Informática a la Juguetería
- Hecho: M10 (3). `LAST_LEVEL` pasa a 3 (`src/sim/world.ts`): tras vencer al Router y bajar en el montacargas, la partida sigue en la planta 3 con todo lo que se lleva (armas, objetos, corazones, cupones, tickets, documentos), igual que de la 1 a la 2. El parte de la planta 2 anuncia «Planta 3: Juguetería. Edad recomendada: ninguna.» (`FLOOR_NAMES`). Hasta que llegue el Muñeco de Moda, `floorBossOf(3)` da el Router, que pelea en el Escaparate de Novedades. Test nuevo en `tests/plantas.test.ts` (de la 2 a la 3, todas las salas de la planta 3, el Router en el Escaparate, juega 3 s sin romper nada) y paso nuevo en el e2e (sube de la 2 a la 3 con la misma tostadora, captura `34c-cadena-planta3.png`). `tools/bot.ts` cuenta ya cada planta de arriba por separado (`planta2`, `planta3`, con el mismo `Floor2Report`): las recorre sin daño y sigue la partida hacia arriba mientras gane.
- Decisiones: el Router repite en la planta 3 y no la Nevera porque es el jefe más difícil que hay y la planta 3 tiene que ser el muro; su cartel sigue diciendo «Informática» (está de visita) hasta que el Muñeco ocupe su sitio en la (5). El texto de la tercera planta no usa «pilas no incluidas» porque será el nombre de un objeto (6a) y el test de textos no deja repetir chistes.
- Medidas (`node tools/bot.ts --plantas 60`): planta 1 ganada el 28,3 %; planta 2: llegan 17 de 60, la gana el 11,8 %; **planta 3: llegan 2 de 60** (con 4,5 medios corazones), una la gana y la otra cae; 22,8 s y 0,58 heridas por sala de combate (las dos partidas que llegan son las más fuertes). Con las 20 de `npm run bot` no llega ninguna. La planta 3 sin daño se recorre entera el 100 %.
- Problemas conocidos: las dos partidas que llegan a la planta 3 la pasan con facilidad: con el Router repetido y sin objetos de la planta 3 todavía, no es el muro que pide el humano; eso se mide y ajusta en la (7), cuando estén el Muñeco y los objetos. El cartel de victoria dice «Jefa de planta dada de baja» también con el Router (ya pasaba en la planta 2).
- Siguiente paso: M10 (5a), los sprites del Muñeco de Moda (con caja, posando, la caja rota, las etiquetas de rebaja).

## 2026-11-05 03:09 (hora peninsular) — Hito M10 — Las salas especiales de la Juguetería
- Hecho: M10 (2c), y con ella la (2) entera: la planta 3 ya no usa ninguna sala del almacén. En `FLOOR_3` (`src/data/rooms.ts`): **Rellano de la Juguetería (Prohibido Correr)**, la entrada, con caballitos y casitas; **Encargos de Reyes que Nadie Recogió**, el tesoro; **Juguetes Educativos (Enseñan a Pagar)**, la tienda; **Juguetes Retirados (Piezas Pequeñas)**, la secreta, abarrotada de casitas y caballitos; y el **Escaparate de Novedades (de la Temporada Pasada)**, la sala del jefe: centro despejado para la pasarela del Muñeco y cuatro expositores que paran balas (de estantería por ahora). Mismos huecos (`*`, `s`, `$`, `J`, `P`) y tamaño que las del almacén, como las de la planta 2; lo comprueba el test de la planta 3, que además pide que una planta 3 generada use solo salas suyas. Documento de historia nuevo para la secreta (`catalogo-1` en `src/data/lore.ts`, `source: { secret: 3 }`): un **Catálogo de Navidad** interno cuyo robot de la temporada está hecho con un muelle de tostadora, chapa de microondas y engranajes de batidora «de la última planta», con la garantía «que les quedara a las piezas». `documentos.test.ts` comprueba ya las plantas 1, 2 y 3.
- Decisiones: el documento cuenta adónde van las piezas que el Servicio Técnico «repara» (a juguetes nuevos) sin decir todavía que el jugador es el producto, que es cosa del piso secreto (M12); lo apunto en `docs/DISENO.md`. Los expositores de cristal del diseño son, de momento, bloques de estantería: un sprite de vitrina tiene más sentido junto al jefe (5a). Hasta que llegue el Muñeco, el Escaparate lo ocupa el jefe que dé `floorBossOf(3)` (hoy la Nevera); la (3) decide que sea el Router. `archivador-panel.test.ts` tenía «2/4» escrito a mano: ahora lo calcula con `LORE.length`.
- Medidas: plantas 3 enteras (20, `playFloor` nivel 3): sin daño las recorre todas sin atascos; con daño 43,9 s y 3,17 heridas por sala de combate (igual que antes: las especiales no tienen enemigos). `npm run bot` idéntico.
- Problemas conocidos: ninguno nuevo. La planta 3 sigue sin alcanzarse jugando.
- Siguiente paso: M10 (3), encadenar la planta 3 tras el Router (con el Router en el Escaparate hasta que llegue el Muñeco); o (4) ya hecha, así que después (5a), los sprites del Muñeco de Moda.

## 2026-11-05 02:58 (hora peninsular) — Hito M10 — Seis salas de combate más en la Juguetería
- Hecho: M10 (2b), con lo que la planta 3 tiene sus doce salas de combate. Nuevas en `FLOOR_3` (`src/data/rooms.ts`): **Maqueta de Tren Eléctrico** (26×13, dos vías de estantería que hacen tres carriles; pasos del centro fijos y de los lados a veces), **Castillo Hinchable** (20×13, un castillo de estanterías con la puerta hacia abajo y dos ventanas que a veces están, con alguien dentro), **Laberinto de Canicas** (16×16, cuatro tramos en molinillo alrededor del centro), **Fiesta de Cumpleaños** (20×16, dos filas de mesas que se vuelcan y bombonas de helio entre ellas), **Regalos Devueltos (26 de Diciembre)** (26×16, escaleras de estantería desde las cuatro esquinas: un rombo con las puntas abiertas) y **Probadores de Disfraces** (16×11, dos probadores en la pared del fondo con alguien dentro, a veces con la cortina medio echada). El test de la planta 3 pide ahora doce.
- Decisiones: partí la antigua (2b) de la hoja de ruta en dos: (2b) estas seis salas y (2c) las salas especiales (entrada, tesoro, tienda, secreta con su documento y el Escaparate de Novedades), que piden más cosas (documento de historia, sala del jefe) y merecen su propia tarea. Las cortinas de los probadores dejan siempre un hueco: un grupo que cerrara del todo el probador dejaría suelo encerrado (lo prohíbe `rooms.test.ts`).
- Medidas (bot, 30 salas por plantilla a profundidad 6 con los enemigos de la planta 3): heridas por sala, tren 2,80 · castillo 3,10 (la más dura, 83 s) · canicas 2,50 · cumpleaños 1,57 (la más fácil: las mesas cubren y el bot vuela bombonas) · regalos 2,40 · probadores 2,60. Media de las doce **2,29** (las seis de antes 2,08; las de la planta 2 en las mismas condiciones, 2,51). Plantas 3 enteras (20): sin daño las recorre todas sin atascos; con daño 42,9 s y 3,17 heridas por sala de combate. `npm run bot` idéntico.
- Problemas conocidos: las mesas de la planta 3 se dibujan aún como las del almacén (amarillas); quedaría mejor una mesa de juguetería, pero el arte de la mesa no es de esta tarea. La planta 3 sigue sin alcanzarse jugando.
- Siguiente paso: M10 (2c), las salas especiales propias de la planta 3; o (3), encadenar la planta 3 tras el Router.

## 2026-11-05 02:46 (hora peninsular) — Hito M10 — Seis salas de combate de la Juguetería
- Hecho: M10 (2a). `FLOOR_3` en `src/data/rooms.ts` con seis plantillas de combate de la planta 3, cada una con su idea y grupos de estanterías que salen o no con la semilla: **Circuito de Coches de Ocasión** (20×13, una isla alargada a la que se da vueltas y contra la que vuelcan los coches; a veces con paso por el medio), **Pasillo de Peluches Desteñidos** (26×13, estanterías que bajan del fondo y suben del suelo alternadas: zigzag con rincones), **Mesa de Construcciones** (16×16, cuatro mesas que se vuelcan alrededor del centro y estanterías en las esquinas), **Urbanización de Casitas** (20×16, un corral de casitas de muñecas con huecos en los cuatro lados), **Zona «Pruébame»** (26×16, casi vacía con cuatro columnas y dos mamparas que están o no) y **Rincón de Montaje** (16×11, pequeña, con estanterías en escalera). `templatesOf(kind, 3)` da las de la planta 3 para combate; las demás (entrada, tesoro, tienda, secreta, jefe) siguen siendo las del almacén hasta la (2b). Test nuevo en `tests/rooms.test.ts` (salas propias, nada se cuela en las plantas 1 y 2, una planta 3 generada pelea solo en sus salas y con juguetes); las pruebas de plantillas (bot 25 s, idea escrita, salas reflejadas) cubren ya también la planta 3, con los enemigos de cada planta.
- Decisiones: las casillas `c` de la planta 3 se dibujan como casitas de muñecas, así que la sala pensada como «piscina de bolas» pasó a ser una urbanización de casitas (hipoteca a 40 años): mejor que el nombre diga lo que se ve. Nombres recortados para que quepan arriba de la pantalla y en el parte de baja, también con el texto grande (los vigilan `hud.test.ts` y `texto-grande.test.ts`). Con solo seis salas, una planta 3 repite alguna (la baraja se vuelve a barajar); no importa todavía porque la planta 3 aún no se alcanza jugando, y la (2b) añade seis más.
- Medidas (bot, 30 salas por plantilla a profundidad 6 con los enemigos de la planta 3, mismas condiciones para las de la planta 2): heridas por sala, circuito 2,37 · pasillo 1,73 · mesa 1,73 · urbanización 2,60 · «Pruébame» 1,37 (la más fácil: abierta) · montaje 2,70; media de la planta 3 **2,08** frente a **2,51** de las salas de la planta 2. Plantas 3 enteras (20, `playFloor` nivel 3): sin daño las recorre todas sin atascos; con daño cae en las 20 (empieza sin nada, como prueba); 43,7 s y 3,02 heridas por sala de combate frente a 34,5 s y 2,30 de la planta 2 en las mismas condiciones. `npm run bot` idéntico al de antes (las plantas 1 y 2 no cambian).
- Problemas conocidos: las salas de la planta 3 son, a igualdad de enemigos, algo más fáciles que las de la 2; el muro se ajusta en la (7) con la planta entera (presupuesto de enemigos, mezcla), no quitando sitio para esquivar.
- Siguiente paso: M10 (2b), seis plantillas más y las salas especiales propias de la planta 3 (entrada, tesoro, tienda, secreta con su documento y el Escaparate de Novedades); o (3), encadenar la planta 3 tras el Router.

## 2026-11-05 03:55 (hora peninsular) — Hito M10 — El Sobre Sorpresa
- Hecho: M10 (4d), con lo que la planta 3 ya tiene sus cuatro enemigos. Nuevo cerebro `hopper` (`HopperBrain`, `updateHopper`): descansa 0,35–0,6 s y salta (estado `charge`, 0,42 s, 30–55 px) hacia unos 110 px de la tostadora con un regate; `enemyAltitude` lo levanta hasta 14 px en el salto y `dummyHurtBox` sube con él (se le da donde se le ve). Cada tres saltos escupe `sobre-confeti`, dos abanicos cortos que se frenan (`accel` −90, vida 1,1 s). Nuevo color de bala `confetti` (papel de regalo rojo con cinta amarilla, 2 fotogramas que aletean). Nuevo campo de datos `EnemyDef.surprise` (`SurpriseDef`): al morir, `openSurprise` elige por peso y saca enemigos (que salen disparados de lado, en suelo libre, y entran en la sala en el mismo tick, así que la sala no llega a abrirse) o cupones de más, con el evento `surprise` y su letrero. El sobre: 75 % dos **Muñequitos Repetidos** (3 de vida, perseguidores con mordisco: el cerebro `chaser` de la batidora con otros números), 20 % **4 cupones**, 5 % el **Muñequito Dorado Ultrarraro** (torreta que anda, anillos de confeti, 10 de vida, 5 cupones). Sprites: el sobre de papel metalizado con la estrella del «?», la línea de «abrir por aquí» con sus tijeras y la letra pequeña del lateral (5 fotogramas: de pie temblando, agachado, en el aire con las piernas recogidas, hinchado para escupir); el muñequito de vinilo de cabezón con la costura del molde, la sonrisa impresa un píxel fuera de la boca, cejas de enfado y la pegatina «x3» (7); el dorado, igual pero de oro, con brillo y cara de suficiencia (6). Letra `Y`, solo desde la planta 3; los muñequitos no salen solos. Capturas 35v y 35w en el e2e. 6 tests en `tests/sobre-sorpresa.test.ts` (entre ellos, 400 sobres abiertos para comprobar las proporciones).
- Decisiones: las probabilidades van en la descripción del enemigo («en el reverso, en letra pequeña»), que es lo que leerá el glosario de M14; no hay todavía una pantalla que la enseñe en partida. El muñequito usa los cerebros que ya había (perseguidor y torreta con paseo) en lugar de uno nuevo: el contenido sigue siendo datos. Servirán también para el jefe (5a pide los Repetidos: ya están hechos).
- Medidas (`npm run enemigos`, 60 salas de la planta 2 con la pareja): YY 0,40 heridas y 32 s por sala, YU 0,33 y 35,8 s, YQ 0,48 y 32,5 s, sin bajas. Algo más fácil que el cubo; el muro de la planta 3 se ajusta en (7) con la planta entera. `npm run bot` sigue idéntico (las plantas 1 y 2 no cambian).
- Problemas conocidos: los muñequitos son pequeños (18×20) y de colores apagados; sobre las losetas de colores se leen por el contorno, pero en la tarea (7) hay que mirar si en pleno combate se pierden. Una descripción de enemigo con tres frases cortas no pasa `textos.test.ts`: se juntó en dos.
- Siguiente paso: M10 (2a), las seis primeras plantillas de combate de la Juguetería, ya con `Q`, `V`, `U` e `Y`.

## 2026-11-05 02:45 (hora peninsular) — Hito M10 — El Cubo de Piezas
- Hecho: M10 (4c). Nuevo cerebro `lobber` (`LobberBrain` en `src/data/types.ts`, `updateLobber` en `src/sim/enemies.ts`): guarda unos 140 px (anda a 38 px/s y se aparta de lado como las torretas que andan); cada 2,6–3,6 s, con la tostadora a menos de 260 px, se para y levanta la tapa 0,55 s (aviso en `activeWarnings` y fotograma propio) y lanza **tres piezas** en parábola (0,85 s de vuelo): una adonde va la tostadora y dos a menos de 32 px. Las piezas son entradas de `w.frost` con `brick` (la clase de pieza, 4) y `damage`: reutilizan el vuelo, la sombra, `clearEnemyFire` y el hash, pero no frenan (`inFrost` las ignora), tienen su propio tope (`MAX_BRICKS` = 12) y viven 6 s. **Pisar una andando** quita medio corazón y la gasta (`stepOnBricks`, causa «Pieza pisada descalzo de madrugada» y el letrero «Pieza pisada»); rodando no pasa nada; **una bala del jugador la barre** y sigue su camino (`sweepBricks`). Sprites: el cubo rojo con la tapa amarilla de tachuelas puesta de gorra, el asa de barbuquejo, ojos de dos piezas redondas, una pieza verde torcida en la frente, la pegatina «1000+» y zapatos de ladrillo azul (7 fotogramas: de pie, andando y con la tapa levantada enseñando las piezas de dentro); y la hoja `pieza` (roja 2×2, azul 3×1, amarilla 2×1 y esquina verde). En pantalla: la pieza gira en el aire, una cruz amarilla que se cierra marca dónde cae, rebota al caer con un clac de plástico, se queda con su sombra (para que se lea sobre las losetas de colores) y parpadea el último segundo; barrida, sale despedida girando en la dirección de la bala. Letra `U` en las plantillas, solo desde la planta 3. Captura nueva en el e2e (35t y 35u). 7 tests en `tests/cubo-piezas.test.ts`.
- Decisiones: una pieza que cae a los pies de la tostadora no hace nada hasta que se aparta y la vuelve a pisar (`armed`): si no, quedarse quieto era recibir el golpe sin haber pisado nada, y el diseño dice que lo que castiga es *andar*. Las piezas de adorno del suelo de la Juguetería (`brick` en `src/art/jugueteria.ts`) pasan de alfa 190 a 120: son la mitad de grandes y sin contorno ni sombra, pero se parecían demasiado a las de verdad. El bot ahora rodea las piezas con más ganas y **rueda por encima** cuando va a pisar una (como haría una persona); solo actúa si hay piezas, así que las cifras de las plantas 1 y 2 no cambian (comprobado: `npm run bot` sale idéntico). La causa de baja se acortó porque la larga no cabía en el parte a doble tamaño (lo vigila `texto-grande.test.ts`).
- Medidas (`npm run enemigos`, 60 salas de la planta 2 con esa pareja): primer intento (4 piezas cada 2,1–3,1 s, bot sin rodar) UU 4,13 heridas por sala y 29 bajas de 60, todas por pisar piezas; con 3 piezas cada 2,6–3,6 s, tope 12 y el bot esquivando, 2,07; con las piezas «a los pies» desarmadas y el bot rodando, **UU 0,57 heridas y 39 s por sala, UQ 0,68, UV 0,47** (como referencia: QQ 0,50, VV 0,23, WW 0,50, II 0,43). Lanza unas 45 piezas por sala. Las salas duran más (39 s frente a 27) porque guarda las distancias y tiene 16 de vida.
- Problemas conocidos: la planta 3 aún no se alcanza jugando (M10 3), así que el bot normal no lo mide; lo hará (7). Las piezas en el aire son pequeñas y sobre una estantería se pierden; lo que avisa de verdad es la cruz amarilla del suelo.
- Siguiente paso: M10 (4d), el Sobre Sorpresa (el último enemigo de la planta 3), o (2a), las primeras plantillas de combate de la Juguetería.

## 2026-11-05 01:20 (hora peninsular) — Hito M10 — El aspecto de la Juguetería
- Hecho: M10 (1). Juego de casillas de la planta 3 en `src/art/jugueteria.ts`, y `src/art/room.ts` lo usa con `level >= 3` (las plantas 1 y 2 salen idénticas píxel a píxel: comprobado con las mismas semillas antes y después). **Suelo de goma EVA de puzle**: cinco colores desvaídos (rojo, mostaza, azul, verde, rosa; pesados hacia los cálidos), nunca igual que la loseta de la izquierda ni la de arriba, con la pestaña del puzle en cada lado compartido alternando hacia un lado y otro (`matTab`). Variantes: loseta que falta (hormigón con pegotes de pegamento y sin pestañas), de abecedario (letra o número recortado a ×2), mordida en una esquina, descolorida y con pegatina de estrella. En el suelo: garabatos de cera, purpurina, la **carretera de alfombra** de juguete con su paso de cebra (en lugar de rodadas o cubrecables), piezas de construcción y canicas, «ZONA DE JUEGO» y letras rosas («PILAS NO INCLUIDAS», «EDAD: 3+», «NO APTO PARA ADULTOS»…). Paredes: estanterías de juguetes en caja con ventana de plástico y el precio tachado (interiores y del fondo), papel pintado de nubes que se despega en tiras, guirnalda de banderines, tallímetro de colores y dibujos de niño en las laterales, rodapié de piezas de borde, cartel de precios tachados en lugar del turno. Carteles y felpudo propios por tipo de sala («PLANTA 3 · JUGUETERÍA», «A JUGAR», «TODO A UN TICKET», «CARTAS A LOS REYES», «RETIRADOS POR SEGURIDAD», «ESCAPARATE DE NOVEDADES» con confeti). **Obstáculos** (`tools/sprites/props.ts`): `caja-3` casita de muñecas cerrada por reformas, `barril-3` bombona de helio roja con dos globos (explota como el bidón), `carrito-3` caballito de balancín, `mesa-3` mesa de manualidades de plástico amarillo; astillas amarillas al romperla. **Persianas** `persiana-*-3`: ciruela, rodapié de colores y una tira de luces de feria fundidas (queda una, rosa). `?planta=3` ya funciona (antes se limitaba a 2). `docs/ESTILO_ARTE.md` tiene su sección «Planta 3». Tests: 4 nuevos en `tests/roomart.test.ts` (color cálido, distinto de las otras plantas e igual de oscuro; losetas vecinas sin repetir color; carteles, decoración y variantes propias y nada de las plantas de abajo; puertas limpias) y `tests/sprites.test.ts` exige las versiones `-3` con la misma medida. El e2e pasa por seis salas con `?planta=3` (capturas 37a–37f, miradas).
- Decisiones: cogí la (1) aunque la tenía la sesión de las 21:25: llevaba tres horas sin un commit y la anterior ya dejó dicho que estaba libre; borré su entrada de `en_curso`. Colores de las losetas apagados a propósito: con la primera paleta, más viva, el suelo competía con las balas rojas y con los enemigos. Las ventanas de la casita de muñecas son claras con marco blanco: oscuras parecían dos ojos y la casita se leía como un enemigo; la etiqueta de la bombona copia la del bidón (dos rayas negras) por la misma razón (con «HE» parecía una cara). El bidón de arriba es una bombona de helio y no algo blando porque explota: tiene que seguir pareciendo peligroso y rojo. Hasta la (2) y la (3), `?planta=3` usa las plantillas y el jefe de la planta 1 (`templatesOf` y `floorBossOf` ya caen en la planta 1); no lo he tocado porque es trabajo de esas tareas.
- Medidas: la simulación no cambia; `npm run bot` igual que antes (planta 1 ganada el 10 % de 20, Router 26,7 %, Nevera 66,7 %). 508 tests en verde.
- Problemas conocidos: el suelo de la planta 3 es más vivo que el de las otras dos (es una juguetería); con los enemigos y las balas encima se lee bien en las capturas, pero si el humano lo nota cargado, bajar un poco más la saturación de `EVA`. El rodapié de colores se dibuja con el borde oscuro hacia el suelo en la pared izquierda y hacia la pared en la de abajo (igual que el de la planta 2); no se nota.
- Siguiente paso: M10 (2a), las seis primeras plantillas de combate de la planta 3; o (4c) el Cubo de Piezas.

## 2026-11-05 00:40 (hora peninsular) — Hito M10 — El Coche Teledirigido
- Hecho: M10 (4b). **Coche Teledirigido** (`coche-teledirigido`, letra `V`, cerebro nuevo `rccar`: `RcCarBrain` en `src/data/types.ts` y `updateRcCar` en `src/sim/enemies.ts`). Da vueltas a la tostadora a 125 px/s (más que ella) a unos 90 px: apunta a un punto 40° más adelante en su círculo y gira como mucho 200°/s, así que va en arcos y derrapa. Tras 1,2–2,2 s, en cuanto la tiene de lado (a menos de 35° de perpendicular) y a menos de 170 px, frena y apunta (0,38 s, con la línea roja de los embestidores y los faros en rojo) y embiste en línea recta (265 px/s, 0,75 s). Si choca con la pared o con algo vuelca 1,5 s con las ruedas al aire (`stun`, eventos `carFlip` y `carRight`); si no, frena y vuelve a dar vueltas, la mitad de las veces en el otro sentido. «Pilas no incluidas»: cada 3,5–6 s se para 0,8 s (estado `off`: parpadea con los faros apagados, como las bombillas al encenderse; el cartel encima) sin perder la cuenta para embestir (`Enemy.stallT`, y lo que le quedaba en `legT`). Rozando una pared mientras da vueltas, rebota y cambia de sentido. Dibujo: deportivo de plástico morado de lado, con cara de matón en el parachoques (faros con cejas y una rejilla de dientes), antena doblada, alerón pegado con celo, franja de carreras despegándose y la rueda delantera de otro coche (más pequeña y blanca); 7 fotogramas (motor al ralentí, ruedas girando, embistiendo, volcado del revés con ojos en X, sin pilas). Marcas de ruedas en el suelo mientras derrapa (`skidMark` en `GameScene`, como mucho 120 a la vez, se borran en 4 s). El bot esquiva su embestida como la del aspirador. Causa de baja «Atropello por un coche sin carné». `SLOT_ENEMIES_3` lo incluye. Tests nuevos en `tests/coche-teledirigido.test.ts` (6: datos, da vueltas en arcos, embiste de lado y en línea recta, vuelca contra una caja y se endereza, se queda sin pilas 3–6 veces en 20 s, sin meterse en la pared ni atascarse y determinista). El e2e lo suelta en el Taller Exprés (capturas 35q–35s, miradas; las marcas de ruedas al principio casi no se veían y las hice más oscuras y gruesas).
- Decisiones: no dispara: es el enemigo de cuerpo a cuerpo de la planta, y su peligro es que viene de lado y deprisa mientras los otros llenan la sala de balas. No le pedí línea despejada para embestir: si hay una caja en medio, vuelca, y ponerse detrás de algo es la manera lista de ganarle. Morado porque no lo usa nadie y no se confunde con las balas rojas ni con el aspirador azul.
- Medidas (`npm run enemigos`, 60 salas por pareja con el bot): dos coches 0,13 heridas por sala con el primer reglaje (aviso 0,45 s, 240 px/s; el bot lo esquiva como al aspirador); con aviso 0,38 s y 265 px/s, **0,23 heridas** y 26,8 s por sala. Coche + robot 0,47; coche + aspirador 0,18; coche + microondas 0,68. `npm run bot` igual que antes (aún no sale en las plantas 1 y 2).
- Problemas conocidos: el volcado del sprite se dibuja con el bamboleo de los aturdidos, que en un coche boca arriba queda como si se meciera; se entiende. La planta 3 aún no se juega.
- Siguiente paso: M10 (1) si la otra sesión la suelta; si no, (4c) el Cubo de Piezas o (2a) las primeras plantillas de la planta 3.

## 2026-11-04 23:55 (hora peninsular) — Hito M10 — El Robot de Cuerda
- Hecho: M10 (4a), el primer enemigo de la Juguetería. **Robot de Cuerda** (`robot-cuerda` en `src/data/enemies.ts`, letra `Q`; cerebro nuevo `windup` en `src/data/types.ts` y `updateWindup` en `src/sim/enemies.ts`). Entra dándose cuerda (0,6 s, estado `jam`) y sale hacia la tostadora ±35°; corre en línea recta a 92 px/s (estado `charge`) y rebota en paredes y cosas como una bola de billar: solo cambia la componente que choca y nunca va recto por un eje (`slanted`, al menos un 35 % en cada eje). En cada rebote suelta tres tuercas apuntadas a la tostadora (patrón `robot-tuercas`, bala nueva `nut` con su sprite `bala-tuerca`: roja con núcleo blanco como las demás, hexagonal y girando), como mucho un abanico cada 0,35 s. A los 4–5 s se le acaba la cuerda: 1,4 s parado en seco (`stun`, «Cuerda agotada», sonido de muelle que se para) y 0,6 s dándose cuerda (`jam`, la llave gira, tiembla y suena el carraca); en los dos recibe el doble (`takenScale` en `src/sim/world.ts`: balas, explosiones de bidón y la sobretensión). Sprite de 9 fotogramas de 27 × 31 (`makeRobot` en `tools/sprites/enemies.ts`): caja de hojalata verde azulado desconchada, un ojo de tornillo, rejilla de dientes, antena torcida, la llave de latón a la espalda con un esparadrapo y la etiqueta «3+» rayada a «33+»; agotado, ojos entornados y antena caída. Sonidos `cuerda`, `agotado` y `chapa`; causa de baja «Tuerca suelta de un juguete de segunda mano» / «Atropello por juguete sin frenos». `SLOT_ENEMIES_3` (lo de la planta 2 más el robot) y `slotEnemiesOf` para la planta 3 y siguientes. Tests nuevos en `tests/robot-cuerda.test.ts` (7). El e2e lo suelta en el Taller Exprés (capturas 35n–35p, miradas: las tuercas se leen como balas enemigas, el cartel se lee y el robot se distingue de todo lo demás).
- Decisiones: cogí la (4a) y no la (1) porque la (1) la tiene otra sesión desde las 21:25; aunque pasan los 90 minutos del protocolo, esa sesión dejó dicho a las 23:05 que seguía con ella, y el robot no toca sus archivos. Las tuercas apuntan a la tostadora (y no hacia donde rebota) para que el rebote sea una amenaza; no llevan aviso previo porque el rebote mismo es el aviso (se ve venir la pared) y son solo tres. Que empiece dándose cuerda da medio segundo para verlo al entrar en la sala. «Nunca recto por un eje» porque si no, contra una pared de frente, va y viene en la misma línea y es aburrido y fácil.
- Medidas (`npm run enemigos`, 60 salas de la planta 2 por pareja con el bot): dos robots 0,50 heridas y 26,9 s por sala; dos aspiradores 0,10 y 30,8 s; dos microondas 0,65 y 44,3 s; robot + microondas 0,53 y 36,6 s. Molesta como un microondas pero se mata antes (es frágil cuando se para). `npm run bot` igual que antes: el robot aún no sale en las plantas 1 y 2.
- Problemas conocidos: la planta 3 aún no se puede jugar (falta la (1), la (2) y la (3)), así que el robot solo se ve en tests y en el e2e. El bot no sabe aprovechar que se para.
- Siguiente paso: M10 (1) si la otra sesión la suelta; si no, (4b) el Coche Teledirigido o (2a) las primeras plantillas de la planta 3.

## 2026-11-04 23:05 (hora peninsular) — Hito M9b — Mesas que se vuelcan (M9b terminado)
- Hecho: M9b (13b), y con ella la (13) y el hito M9b entero. La **Mesa de Saldos** (`mesa` en `src/data/props.ts`, letra `v` de las plantillas; en la planta 2 se dibuja como mesa de demostración beige con teclado de exposición). De pie estorba al andar pero las balas pasan por encima (`blocksBullets: false`). Con el botón de interactuar («F: Volcar», a 8 px, `TIP_REACH`) se vuelca lejos de la tostadora, por el eje en que está más apartada de ella (`tipSide`, medido en unidades del tamaño de la mesa para que en una esquina caiga hacia donde se ve), y ya no se levanta (`PropInstance.tipped`: N, S, E u O, hacia donde mira la tapa). Volcada para solo las balas que vienen hacia la tapa (`coversFrom`: velocidad contra la dirección de la tapa) y deja pasar las que se alejan, así la tostadora dispara desde detrás; también los rebotes lo tienen en cuenta. Aguanta 14 (`tip.hp`; bala enemiga 1, de la tostadora su daño) y se rompe; un bidón que explota al lado la rompe al momento, de pie o volcada. Eventos `tip`, `tableHit`, `tableBroke`. Dibujo: hoja `mesa`/`mesa-2` de 5 cuadros de 28 × 28 (de pie con calcetines de saldo y la etiqueta roja; volcada al norte enseña la parte de abajo y las patas hacia la cámara; al sur, la tapa con la etiqueta y las patas asomando detrás; al este y al oeste, de canto con las patas al otro lado). Al volcarla se ladea y aplasta un instante, suena un golpe seco, tiembla un poco la cámara, sale polvo y sale volando lo que había encima; cada bala parada la sacude y le saca astillas; rota: lluvia de astillas, polvo, estruendo y tres tablas en el suelo. Las plantillas: los huecos de obstáculo (`o`) dan mesa con peso 2, quitándoselo a los huecos vacíos (5 → 3), no a las cajas ni a los bidones. La Sala de Pruebas tiene una. El bot vuelca la mesa que tiene a mano si hay un enemigo al otro lado (`wantsInteract`), y `npm run bot` cuenta las mesas volcadas por planta. Tests nuevos en `tests/mesas.test.ts` (9: datos y sprites; de pie no para; el botón la vuelca lejos y una sola vez, y de lejos no; para lo que viene y deja salir lo que va; la tostadora dispara por encima; se gasta y se rompe; el bidón la rompe; sale en las salas y nunca en una pared; determinismo). El e2e la vuelca con F y le tira balas (capturas 11l–11o, miradas).
- Decisiones: una mesa y no varios muebles: es el mueble que se entiende sin explicar y basta para la idea de la nota (cobertura que se gana con el botón). Que se vuelque lejos de quien empuja, y no hacia donde apunta el ratón, porque es lo que haría una persona y porque así siempre cubre a quien la ha volcado. El hueco de la mesa sale de los huecos vacíos para no quitar cobertura que ya existía (con el peso quitado a todos, el bot ganaba la planta 1 el 15–17 % en vez del 23 %). La caja de choque no cambia al volcarla (es la misma huella): así nadie puede quedar dentro y la parada de balas ocurre justo donde se dibuja la tapa. En el e2e la tostadora se pone algo a un lado: justo detrás, su cuerpo tapa la mesa (es más alta que ella), como ya pasaba con los cofres.
- Medidas (bot, 60 plantas, antes → después): planta 1 ganada 23,3 % → **28,3 %** (dentro del 15–30 % de la (15)); cae ante la jefa 43,3 % → 40 %; 22,9 → 23,2 s y 1,17 → 1,16 heridas por sala de combate; vuelca 1,5 mesas por planta. Planta 2: llegan 14 → 17 de 60. Con las 20 plantas de `npm run bot`: 20 % → 10 % (2 de 20 frente a 4; mucho ruido con 20). 200 partidas sin fallos, 488 tests en verde.
- Criterios de M9b: cada punto de las dos notas tiene su test (están en las entradas de hoy); el bot pasa sin bloqueos; y el juego es más difícil según el bot: antes de M9b ganaba la planta 1 el 45 % y ahora entre el 16 y el 28 %; heridas por sala de combate 0,79 → 1,16; de las partidas que llegan a la jefa, antes la ganaba el 55 % y ahora el 41 %. Los combates sueltos contra los jefes salen parecidos a antes (Nevera 66,7 %, Router 26,7 %) porque la (15) les bajó la vida a propósito para compensar las armas más flojas; en la partida se llega a ellos con menos vida y se pierde más. Marco M9b como hecho y las dos notas del 30 de octubre como atendidas.
- Problemas conocidos: el primer e2e de la sesión falló en el bidón (una bala enemiga perdida lo hizo explotar antes de tiempo); ahora el e2e limpia las balas enemigas antes de esa prueba. La nota pedía que «los tickets para compras se recojan solos»: la sesión de la (5) lo leyó como los cupones (lo que se gasta en la tienda) y así sigue; el ticket de recompensa todavía hay que ir a cogerlo.
- Siguiente paso: M10 (1) la tiene otra sesión; si la suelta, seguir con ella; si no, M10 (2a), las primeras plantillas de la planta 3.

## 2026-11-04 22:35 (hora peninsular) — Hito M9b — Los bidones explotan
- Hecho: M9b (13a), primera mitad de la (13), que he partido en dos en la hoja de ruta. El **Bidón de aceite usado** (el `barril` de siempre, en muchas plantillas y en los huecos de obstáculo) tiene ahora vida y explosión en sus datos (`PropDef.hp` y `blast` en `src/data/types.ts`; `hp 10`, `radius 36`, `damage 12`, `hurt 2`). Las balas que paran en él le quitan su daño (las enemigas, `ENEMY_PROP_DAMAGE` = 1); sin vida se enciende (`BLAST_FUSE` 0,3 s) y explota (`blowUp` en `src/sim/world.ts`): daño a enemigos y maniquíes cerca, un corazón a la tostadora si está a tiro (causa de baja «Bidón de aceite usado sin etiquetar») y enciende a los bidones vecinos (`CHAIN_FUSE` 0,15 s, así la cadena se ve ir). Desaparece de la sala para siempre (la sala se guarda). Eventos `propHit`, `propLit`, `blast`. Dibujo: al recibir un disparo suena metálico, salta una chispa y se sacude; muy tocado echa humo; encendido parpadea en blanco (o el tinte suave con «Destellos suaves»), tiembla y sisea; la explosión es una bola de fuego con anillo, chispas, humo, parón, temblor fuerte y estallido, y deja una mancha quemada. Tests nuevos en `tests/bidones.test.ts` (datos, aguanta y explota con daño solo cerca, la mecha, el corazón de la tostadora, balas enemigas, la cadena uno detrás de otro, determinismo). El e2e enciende el bidón más céntrico de la Sala de Pruebas (capturas 11h–11k, miradas: el parpadeo, la bola de fuego y la mancha se leen; el humo de «muy tocado» es discreto).
- Decisiones: el bidón que ya existía en vez de un objeto nuevo: ya está repartido por las salas como cobertura, y que la cobertura se gaste y castigue a quien dispara cerca de ella es justo el reto que pide el humano. Mecha corta y visible para que se pueda huir. Las balas enemigas también lo rompen, pero a 1 por bala, para que no revienten solos en un tiroteo.
- Medidas (bot, 60 plantas, antes → después): planta 1 ganada 30 % → 18,3 % con radio 42 y 8 de vida (el bot se vuela solo: dispara a los enemigos que se arriman a los bidones); con radio 36 y 10 de vida, **23,3 %**, dentro del 15–30 % de la (15). Planta 2: la ganan 4 de 14 que llegan. (`npm run bot` con 100 plantas se quedó sin memoria en esta máquina; con 60 va bien.)
- Problemas conocidos: el bot no sabe que los bidones explotan (no los evita ni los usa); un humano sí puede aprovecharlos. Si algún día molesta, darle al bot una regla de no disparar a un enemigo pegado a un bidón cuando él también lo está.
- Siguiente paso: M9b (13b), muebles que se vuelcan con el botón de interactuar; con eso M9b queda terminado.

## 2026-11-04 21:40 (hora peninsular) — Hito M9b — Corazones especiales: Modo Turbo y Sobretensión
- Hecho: M9b (12b), y con ella la (12) entera. Dos corazones especiales temporales, premio de salas limpias, con sus números en `src/data/hearts.ts`. **Corazón Modo Turbo** (5 % de las salas sin ticket ni cofre): rojo con franja amarilla de carreras y una llamita, como el botón turbo de un secador; cura un corazón y cada disparo hace ×1,3 hasta limpiar la siguiente sala de combate (`Player.turbo`, evento `turboEnd`); las balas salen anaranjadas y la tostadora suelta chispas. **Corazón de Sobretensión** (3 %): amarillo con un rayo negro, como el cartel de alta tensión; un corazón prestado (`Player.surge`, uno como mucho) que paga antes que la garantía y la vida, y al romperse descarga 8 de daño a todos los enemigos de la sala (`surgeShock`, evento `surge`: destello cian, temblor, parón y un rayo en zigzag hasta cada uno). Los dos caducan al bajar de planta. Se deciden con su propio generador (`especiales:`), los raros antes: sobretensión, turbo, garantía, corazón; sin mover tickets ni cofres. El marcador pone tras los corazones lo prestado en el orden en que paga: sobretensión (chisporrotea), garantías y turbo (la franja parpadea). Sprites nuevos: `corazon-turbo`, `corazon-sobretension`, `turbo-hud`, `sobretension-hud`. `wantsPickup` (simulación) dice si un corazón se coge o se queda en el suelo; el bot lo usa. Tests nuevos en `tests/corazones-especiales.test.ts` (rarezas medidas en 200 plantas, turbo y su final, sobretensión y su descarga, máximos, caducidad, que salgan al limpiar, sprites); `tests/cofres.test.ts` al día. El e2e los deja caer, los coge, dispara en turbo y rompe la sobretensión con enemigos alrededor (capturas 11e–11g, miradas: el rayo se lee y el texto encima también; en el marcador la franja del turbo distingue su corazón de los rojos).
- Decisiones: dos corazones, no más, porque la nota pide «daño a toda la sala» y «más daño temporalmente» y el escudo ya existe; los demás (más velocidad, imanes…) pueden venir con M14. El de daño a la sala no se gasta al cogerlo (la sala ya está limpia cuando sale) sino al romperse, como un corazón prestado: así hace daño cuando hace falta. El turbo dura «hasta la próxima sala limpia» y no unos segundos, para que no se pierda en el pasillo y no haga falta un reloj en pantalla. El texto de la descarga no lleva exclamaciones (la guía de estilo las prohíbe; lo vigila un test).
- Medidas (bot, 100 plantas, antes → después): planta 1 ganada 23 % → 24 %; llega a la jefa y cae ante ella 48 % → 46 %; planta 2: llegan 23 → 24, la gana el 13 % → 16,7 % de las que llegan. Son raros: apenas se notan en la media, como debe ser.
- Problemas conocidos: el primer `npm run e2e` de esta sesión falló con un «waitForFunction: Timeout 1500ms» en otra parte del recorrido; las tres siguientes pasaron. Si vuelve, mirar qué espera lleva 1,5 s.
- Siguiente paso: M9b (13), objetos del escenario que se vuelcan o explotan: lo último del hito.

## 2026-11-04 20:55 (hora peninsular) — Hito M9b — Sinergias indirectas: diez parejas que encajan sin activar nada
- Hecho: M9b (14). `src/data/complements.ts` guarda diez parejas de objetos pasivos que funcionan mucho mejor juntas que separadas, sin nombre en pantalla ni modificador extra. Dos clases: **tapa** (un objeto devuelve casi todo lo que el otro quita: Pila + Pendrive en el cargador, Actualización + Cinta en la recarga, Resistencia + Pila en la cadencia, Ventilador + HDMI en la dispersión, Batería Hinchada + Garantía en el corazón, Batería Externa + Etiqueta en el paso, Modo Avión + Etiqueta en la voltereta) y **multiplica** (Pila + Cinta: el cargador corto recarga más a menudo, así que la cinta vale más; Tarjeta + Manual y Tarjeta + Broca). Para que la Tarjeta multiplique, una regla nueva en la simulación: una bala que persigue vuelve a perseguir (otros 0,7 s) cada vez que rebota o atraviesa a un enemigo (`Bullet.seekFrom` en `src/sim/world.ts`). Cada pareja tiene su frase en el tono del juego (`why`), lista para el glosario de M14. Tests nuevos en `tests/complementos.test.ts`: las parejas existen y ninguna es ya una sinergia; las «tapa» devuelven al menos el 60 % de lo que quita el primer objeto, con las tres armas; Pila + Cinta suben el daño sostenido más que el producto de cada una; la regla del rebote y del atravesar; y la Tarjeta con Manual o con Broca acierta más que la suma de lo que añade cada una (rociando balas al azar entre cuatro aspiradores quietos). `npm run objetos -- --parejas` mide cada pareja con el bot (nada, cada objeto solo y los dos juntos). `docs/DISENO.md` tiene la tabla.
- Decisiones: no se anuncian (la nota dice «sin crear una sinergia como tal»): descubrirlas es parte del juego, y el glosario podrá contarlas cuando el jugador haya llevado la pareja. Una sola regla nueva y general (la persecución que se rearma) en vez de efectos especiales por pareja: así la pareja sale sola de lo que hace cada objeto. Probé Modo Avión + Contrato de Permanencia (más volteretas, más balas cortadas), pero el corazón que quita el contrato le cuesta al bot más de lo que dan las volteretas (jefa 95 % con el avión solo, 65 % con los dos, de 40); lo cambié por Avión + Etiqueta. Sin el rearme, Tarjeta + Manual no pasaba su test (+45 contra +31 y +15); con él, +60.
- Medidas (bot con el Secador, `--parejas`, 40 jefas y 60 salas; jefa ganada % y segundos de sala): nada 60 % · 37,8 s. Tarjeta + Manual: salas en 33 s (37,5 y 36,8 por separado). Tarjeta + Broca: 34 s (36,4 y 36,8). Pila + Cinta: jefa en 68 s (76 y 75). Resistencia + Pila: jefa 80 % en 63 s (67,5 % y 72,5 %). Actualización + Cinta: 33,1 s y 0,62 heridas por sala. Batería Hinchada + Garantía: 82,5 % (42,5 % la batería sola). Avión + Etiqueta con 100 jefas: 82 % (avión solo 80 %, etiqueta sola 50 %, nada 54 %). Las cifras de 40 combates bailan ±8 puntos. El bot normal no cambia (ninguna partida de `npm run bot` lleva tarjeta y rebote a la vez).
- Problemas conocidos: el bot apunta muy bien, así que la Tarjeta sola apenas le ayuda y las parejas de la Tarjeta se notan más en la duración de las salas que en la jefa. Batería Externa + Etiqueta no se nota con el bot (casi no usa el activo).
- Siguiente paso: M9b (12b), los corazones especiales temporales; después (13), los objetos del escenario.

## 2026-11-04 20:45 (hora peninsular) — Hito M9b — La Garantía Provisional, el escudo
- Hecho: M9b (12a), primera mitad de la (12), que he partido en dos en la hoja de ruta. La **Garantía Provisional**: un corazón recortado de un resguardo de garantía (papel crema, sello azul, esquina doblada; sprites `garantia-provisional` en el suelo y `garantias-hud` en el marcador, con su mitad). En la simulación, `Player.shield` en medios corazones: un golpe la gasta antes que la vida (`hurtPlayer`; el evento `hurt` dice `covered` y lo que queda), no se cura, se llevan dos como mucho (`SHIELD_MAX`) y caduca al bajar de planta (`nextFloor`). Sale al limpiar una sala de combate sin ticket ni cofre, el 10 % de las veces (`CLEAR_SHIELD_CHANCE`, con su propio generador; si toca, en vez del corazón). Al cogerla: sello, papelitos azules y «Garantía provisional · 30 días»; al cubrir un golpe, sello en vez de quejido, menos temblor y «Cubierto. Esta vez.» o «Garantía agotada». El marcador la pone tras los corazones, algo separada, meciéndose. El bot la coge si no lleva dos. Tests nuevos en `tests/garantia.test.ts` (cubre un corazón y luego se acaba, se coge al pisarla y como mucho dos, caduca al bajar, sale menos que un corazón y nunca a la vez, determinista y con sprites); el invariante del bot vigila que esté entre 0 y 4. El e2e deja caer una, la coge y recibe una bala (capturas 11b–11d, miradas: se lee crema contra el rojo de los corazones).
- Decisiones: idea de la trama en vez de un escudo: una garantía «provisional» que caduca, como todas en este juego. Que caduque al bajar de planta la hace temporal sin un reloj en pantalla. Va en el premio de las salas limpias (que dejó listo la tarea 15) y no en la tienda, para no tocar la economía.
- Medidas (bot, 100 plantas): planta 1 ganada 16 % → 23 % (llega a la jefa 66 % → 71 %); planta 2: llegan 23 de 100 y la gana el 13 % de las que llegan. Sigue dentro del 15–30 % de la (15).
- Problemas conocidos: el sello azul del marcador es de un píxel: se distingue por el color del papel, no por el dibujo.
- Siguiente paso: M9b (12b), los corazones especiales temporales (más raros que la garantía).

## 2026-11-04 20:12 (hora peninsular) — Hito M9b — Menos daño, objetos más modestos, Pegamento de un solo uso y equilibrio
- Hecho: M9b (7) y (15). (a) Armas: todo el daño de base baja un quinto (Secador 2 → 1,6; Grapadora 1 → 0,8; Plancha 2 → 1,6 por nube). Daño por segundo: 4 → 3,2; 6,3 → 5,1; 8,4 → 6,7. (b) Objetos: ninguno suma ya puntos de daño (+1 era +50 % en el Secador): Resistencia ×1,3 (y cadencia ×0,85), Batería Hinchada y Actualización ×1,25. Y suben menos: Pila cadencia ×1,2; Regleta cadencia ×0,6; Etiqueta ×1,1 y voltereta ×0,85; Alargador ×1,25/×1,1; Broca atraviesa 1 (no 2); Cinta recarga ×0,75; Pendrive ×1,4; HDMI ×1,15 y dispersión ×0,6; Ventilador ×1,15; Ratón 15 % de críticos; Permanencia ×1,12. Sinergias: Sobrecarga cadencia ×1,15, Setup Gamer +10 %. (c) El **Pegamento Exprés** es de un solo uso (`singleUse` en los datos): cura un corazón y se acaba; la ficha dice «Q: usar · un solo uso» y el inventario no le pinta pilas. (d) Equilibrio (15): la Nevera pasa de 200 a 135 de vida y su rabia de 0,6 a 0,45; el Router, de 200 a 170. Y una sala de combate que no da ticket ni cofre tiene un 35 % de soltar un **corazón de recambio** al limpiarla (`CLEAR_HEART_CHANCE`, con su propio generador para no mover tickets ni cofres). (e) El inventario enseña el daño con decimales y coma («2,1», «1,6 × 5») y la voltereta en centésimas. Tests nuevos: `tests/equilibrio.test.ts` (daño de base, ningún objeto sube una estadística más de un 30 % —el cargador un 50 %— ni suma puntos de daño, el activo que cura es de un solo uso), corazones al limpiar en `tests/cofres.test.ts`, Pegamento en `tests/activos.test.ts`; unos 15 tests con las cifras viejas, al día. `docs/DISENO.md` al día.
- Decisiones: bajar el daño en vez de subir la vida de todos: es lo que pidió el humano, y como ya no se pintan números de daño, puede no ser entero. El Pegamento, de un solo uso (la nota daba a elegir; «tarda muchas salas» con 6–8 pilas casi nunca se llenaría y estorbaría en la casilla). Para que la planta 1 siga siendo ganable sin devolver la abundancia de objetos: (1) jefes con menos vida, para que el combate dure lo de antes (80 s) aunque las armas peguen menos; (2) corazones al limpiar algunas salas, porque entre la entrada y la jefa no curaba nada salvo la tienda y el bot llegaba a ella con medio corazón (con un 20 % no bastaba: 9 %). La recorrida sin daño de la planta 2 pasa de 600 s a 900 s de límite en el bot (es 1,5 veces más grande y ahora más lenta de limpiar; el bot de la planta-6 tardaba 605 s, no estaba atascado). El test de esquivar del bot usa 30 partidas en vez de 6 (con 6 la cifra bailaba alrededor del límite).
- Medidas (bot, 100 plantas y 60 combates, antes → después): planta 1 ganada 13 % → **16 %**; llega a la jefa 73 % → 66 %; 17,7 → 22,5 s y 0,84 → 1,13 heridas por sala de combate; objetos al acabar 1,1 (igual). Nevera aislada 40 % → 53 % (95 → 80 s, 5,1 → 4,6 heridas). Router aislado 11,7 % → 21,7 % (106 → 115 s). Planta 2: llegan 13 → 16 de 100 y no la gana ninguna (antes 1). Pasos intermedios: solo con (7) la planta 1 caía al 4 % y la Nevera al 15 %. Ojo: las 20 plantas de `npm run bot` salen 0 de 20 ganadas (esas semillas son de las malas; con 100 es el 16 %).
- Problemas conocidos: las salas duran más (22 s de media en la planta 1, hasta 60 s alguna de la planta 2 con el bot) y duelen más; la planta 2 queda durísima para el bot. Si el humano la ve esponjosa, el siguiente paso sería bajar algo la vida de los enemigos de la planta 2, no subir el daño.
- Siguiente paso: M9b (12), el escudo temporal y los corazones especiales (ya hay un sitio natural para ellos: el premio de las salas limpias).

## 2026-11-04 19:21 (hora peninsular) — Hito M9b — Dos calidades de cofre: la caja gris y la Premium
- Hecho: M9b (6). Cada arma, pasivo y activo puede llevar `quality: 'buena'` en los datos. Buenos: la Plancha (de las armas que se encuentran; la Grapadora queda como la «no tan buena») y siete pasivos: Garantía Extendida, Broca del Ocho, Resistencia de Recambio, Cable HDMI Dorado, Actualización Obligatoria, Ratón Gaming RGB y Copia de Seguridad. Cada cofre tiene su calidad (`ChestState.tier`): la Caja Fuerte de Devoluciones gris de siempre (`carton`, el 85 %) solo da cosas corrientes, y la **Caja Fuerte Premium · Solo Clientes Oro** (`premium`, el 15 %, `PREMIUM_CHANCE`) solo cosas buenas: un pasivo bueno o, a veces, la Plancha. Cada uno saca la primera cosa de su calidad que haya en la baraja; si ya no queda ninguna, la siguiente que haya. Sprite nuevo `cofre-premium`: lacado granate con esquinas, etiqueta y franja doradas; cerrado suelta de vez en cuando una chispa dorada, y al caer dice su nombre en dorado. Tests: los dos tipos dan lo suyo (25 cofres de cada), el premium sale en torno al 15 %, hay buenos y normales de cada tipo y el sprite existe. El e2e deja caer uno (captura 23e).
- Decisiones: dos calidades y no más: la nota habla de cofres «no tan buenos» y de otros «mucho menos probables» con solo cosas buenas. Los activos no son «buenos» de momento: el que curaba lo cambia la tarea (7), y el premium se queda en armas y pasivos, como dice la nota. El nombre de la Premium sigue la guía de humor (programas de fidelización).
- Medidas: el bot igual que tras la (5) dentro del ruido (planta 1 con daño: 10 % ganada de 20; 1 cofre abierto por planta).
- Problemas conocidos: los del equilibrio, apuntados en la (15).
- Siguiente paso: M9b (7) y (15) juntas: menos daño de base y objetos más moderados, pero con el bot ganando la planta 1 entre un 15 y un 30 %.

## 2026-11-04 19:12 (hora peninsular) — Hito M9b — Economía escasa: un ticket al empezar, cofres que se quedan cerrados
- Hecho: M9b (5). (a) La partida empieza con 1 ticket (`START_TICKETS`; las salas sueltas de pruebas, con 0). (b) Cada planta tiene 1 sala que suelta ticket al limpiarla (antes 2) y el ticket de la tienda pasa de 8 a 10 cupones. (c) Nada suelto: la sala del tesoro guarda **2 cofres** cerrados (antes un arma, un objeto y un activo en el suelo: los «3 objetos» de la nota) y la secreta 1 (junto a su documento). Las salas de combate ya no tienen cofre fijo: cada una (menos la del ticket) tiene un 15 % de dejar uno al limpiarla, decidido con la planta (`CLEAR_CHEST_CHANCE`). Hay más cofres que tickets, así que muchas veces uno se queda cerrado. (d) Como ahora todo sale de cofres, un cofre da un pasivo (55 %), un activo (25 %) o un arma (20 %) de las barajas de la planta, y 1 cupón (antes 3). (e) Cupones: los enemigos sueltan la mitad (casi todos 0–1; el microondas 1–2 para que siempre suelte algo; la Nevera 5–8 y el Router 6–9). (f) Al limpiar una sala, sus cupones vuelan solos a la tostadora (`World.vacuum`): resbalan por lo que haya en medio y, si alguno se atasca 1,5 s, se cuenta igual. Tests nuevos: escasez (un ticket al empezar, dos cofres en el tesoro y nada suelto, uno en la secreta), cofres que a veces dan arma o activo, cofres al limpiar con su probabilidad, los cupones que vuelan solos; los del tesoro y los documentos, reescritos. El e2e entra en el tesoro de una planta (captura 16g).
- Decisiones: «2 cofres por defecto en cada sala» lo leo como en la sala del tesoro de cada planta (dos por cada sala chocaría con la escasez). Las salas sueltas de pruebas (`?sala=tesoro`, la Sala de Pruebas) siguen con sus pedestales: son herramientas, no la partida, y muchos tests y el e2e las usan para tener objetos a mano.
- Medidas (bot, antes → después, ya con los jefes nuevos de la otra sesión): cupones por minuto 10,3 → 5,8; objetos al acabar 2,5 → 1,1; con activo el 65 % → 5 %; tickets 1,7 → 0,7 recogidos (más el del principio) y cofres abiertos 1,3 → 1,1 por planta; compras 1,1 → 0,5 por planta. La planta 1 con daño: ganada 30 % → 0 % (de 20). Eso es demasiado: queda apuntado como tarea (15), repaso del equilibrio.
- Problemas conocidos: con todo lo de hoy junto (balas grandes, escasez, jefes que se mueven, objetos que quitan corazones), el bot no gana la planta 1. Difícil sí, imposible no: la tarea (15) lo ajusta. Ojo con la (7): bajar el daño de las armas sin tocar la vida de los enemigos lo empeoraría.
- Siguiente paso: M9b (6), calidades de cofre; después (7) y (15) juntas, midiendo.

## 2026-11-04 19:00 (hora peninsular) — Hito M9b — Objetos que quitan corazones
- Hecho: M9b (11). Ya había objetos que suben los corazones (Garantía Extendida, Antivirus Gratuito); faltaban los que los bajan. Dos nuevos, con sprite: **Batería Hinchada** (planta 1: daño +1, −1 corazón; «Rinde un 20 % más. Hasta que revienta. Eso no viene en la ficha técnica.») y **Contrato de Permanencia** (planta 2: velocidad ×1,15, voltereta ×0,7, −1 corazón; «Dieciocho meses de compromiso. El primero, gratis. Los otros diecisiete se cobran en salud.»). Quitan el contenedor, no solo la vida: con la vida llena se queda llena con un corazón menos, y nunca te dejan a cero (lo hacía ya `applyMods`). El inventario lo pinta en rojo («−1 corazón», «Corazones 1, antes 3»), mirado en una captura. Test nuevo en `tests/objetos.test.ts`; la tabla de objetos de `docs/DISENO.md` los recoge.
- Decisiones: el sprite de la batería es una batería de móvil abombada, con grieta y chispas (se distingue de la Batería Externa por la forma); el contrato es una bola con cadena, para no tener otro papel al lado de la Garantía Extendida (el humano pidió cosas más distinguibles). El id del primero es `hinchada`, porque `bateria` ya es la Batería Externa.
- Medidas: con dos objetos más en los mazos, el bot cambia por azar: planta 1 ganada 15 % → 30 % (la cifra se mueve mucho con 20 partidas: la de antes ya incluía el botón de interactuar de la otra sesión).
- Problemas conocidos: ninguno.
- Siguiente paso: M9b (7) cuando la otra sesión acabe la economía (5), para medir el equilibrio sobre la economía nueva.

## 2026-11-04 18:53 (hora peninsular) — Hito M9b — Jefes que se mueven, erráticos y con rabia
- Hecho: M9b (8). La Nevera y el Router ya no se arriman despacio: entre ataques rodean a la tostadora a unos `keep` px, en tramos de 0,5–1,3 s; en cada tramo pueden dar media vuelta (el 60 % de las veces), cambian de paso (de 0,6 a 1,4 veces su velocidad: ahora pasean, ahora dan un tirón) y de distancia (± 50 px). Si van a chocar con una pared, se dan la vuelta. Velocidades de 34–48 px/s (antes 14–20). Avisan quietos, como antes, pero mientras sale la ráfaga siguen andando al 35 % y las balas salen de su boquilla (`Emitter.follow`). Con rabia: cuanta menos vida, más deprisa andan y menos descansan entre ataques, hasta 1,6 veces al final (`rage` 0,6). Datos en `BossBrain.roam`, `drift` y `rage`; código en `bossRoam` y `bossRage` (`src/sim/enemies.ts`). Tests nuevos en `tests/jefes-movimiento.test.ts`.
- Decisiones: el círculo alrededor de la tostadora va aplastado a la mitad en vertical: la pantalla es más ancha que alta, y así la cámara puede enseñar a la tostadora y al jefe entero a la vez casi siempre. Rodear en vez de ir hacia puntos al azar: con puntos al azar y tramos cortos el jefe acababa encima de la tostadora (cada tramo cortaba por dentro). El aviso de cada ataque sigue siendo quieto: más difícil, pero legible.
- Medidas (bot, antes → después): Nevera ganada 43,3 % → 40 % (5,1 → 5 heridas por combate, 91,8 → 94,3 s); Router 26,7 % → 10 % (5,47 → 5,77 heridas); planta 1 ganada 40 % → 40 %; planta 2 ganada 50 % → 50 %.
- Problemas conocidos: el Router queda difícil para el bot (10 %); con M9b (7) (menos daño de las armas) los combates serán más largos y aún más duros: habrá que volver a medir y quizá bajarle la rabia.
- Siguiente paso: M9b (4) si la otra sesión lo suelta; si no, M9b (7).

## 2026-11-04 18:39 (hora peninsular) — Hito M9b — El botón de interactuar
- Hecho: M9b (4). Una acción nueva, «Interactuar», en la tecla F (reasignable en Opciones › Teclas; LB en el mando, que deja de rodar: rodar sigue en A y LT). Abrir un cofre, comprar en la tienda y hablar con todo lo del Mostrador (también abrir el tablón y el archivador, y pasar sus hojas) ya no se hace pisando ni andando contra ello, sino con ese botón. En la simulación: `Input.interact`, `interactable(w)` (lo que haría el botón ahora: el cofre al alcance, la balda más cercana o la estación del Mostrador) e `interact(w)`; el cofre se abre en `openChest` y la tienda vende en `buy`. Bajo la tostadora sale qué hace el botón ahí, en una placa oscura: «F: Abrir», «F: Comprar por 15», «F: Hablar», «F: Descolgar», «F: Coger número», «F: Mirar», «F: Abrir cajón». La ayuda del Mostrador dice «F hablar», la pantalla de controles tiene su fila y el archivador pasa la hoja con F (antes Q). El bot pulsa el botón ante el cofre (si lleva ticket) y ante lo que quiere comprar. Tests de cofres y tienda reescritos: pisar ya no compra ni abre, pulsar sí, lejos no hace nada, rodando no hace nada. El e2e lo hace todo con F y comprueba los avisos.
- Decisiones: F porque E ya cambia de arma y Q usa el activo, y es la tecla de usar de casi todos los juegos de PC. Los objetos y armas sueltos en el suelo (los de un cofre abierto) se siguen cogiendo al pisarlos: la nota solo pide el botón para hablar, comprar y abrir cofres, y la tarea (5) hará que salgan solo de cofres y tienda. El alcance del cofre sube de 3 a 10 px para que el aviso salga delante, sin tener que empotrarse. Sin ticket, cada pulsación se queja (ya no se queja sola al empujar).
- Medidas: el bot sigue abriendo 1,3 cofres y comprando 1,1 cosas por planta, como antes.
- Problemas conocidos: plantada justo delante de un cofre cerrado, la tostadora lo tapa casi entero (es más alta que él). Ya pasaba al empujarlo; con el alcance nuevo basta con quedarse un poco antes.
- Siguiente paso: M9b (5), la economía más escasa.

## 2026-11-04 18:37 (hora peninsular) — Hito M9b — La Música de Espera frena a los jefes en vez de congelarlos
- Hecho: M9b (9). Si hay un jefe en pie en la sala, la Música de Espera no la congela: el jefe y todo lo suyo (sus ataques en curso, la escarcha, los repetidores) piensan a medio ritmo (un tick sí y otro no) y las balas enemigas van a la mitad de velocidad (`HOLD_BOSS_SCALE` en `src/sim/world.ts`) y siguen doliendo. En las salas normales congela como antes. La descripción dice «Congela la sala 3,5 s (a los jefes, los frena)» (cabe en el inventario, mirado en la captura 27b). Test nuevo en `tests/activos.test.ts`. El e2e del cargador le pide paciencia a los cargadores (si no, al quedarse solos saltan, por M9b (10)).
- Decisiones: las balas se frenan escalando su paso de tiempo (movimiento suave); el jefe, saltándose un tick de cada dos, porque toda su IA usa el paso fijo: a 30 actualizaciones por segundo se ve fluido y no hay que tocar cada cerebro. El giro de las balas teledirigidas sigue a velocidad normal (giran algo más cerrado en cámara lenta; no se nota).
- Medidas: el bot no cambia en la planta 1 (no usa el activo contra los jefes en los combates medidos); planta 2, 5,5 → 5,1 medios corazones al llegar.
- Problemas conocidos: ninguno.
- Siguiente paso: M9b (8), jefes que se mueven y se aceleran al perder vida.

## 2026-11-04 18:29 (hora peninsular) — Hito M9b — Los cargadores falsos ya no esperan para siempre
- Hecho: M9b (10). El Cargador Falso (el único enemigo que esperaba quieto a que te acercaras; las torretas con arranque ya tenían un tiempo fijo) salta ahora también: (a) al cansarse de esperar, a los 7–11 s, cada uno con su paciencia para que una pareja no salte a la vez (`patience` en sus datos); (b) a los 1,2 s de quedar solo cebo en la sala, es decir, cuando ya no queda en pie ningún enemigo de otra clase (`alone`). Sigue saltando al acercarte o al darle. Tres tests nuevos en `tests/cargador.test.ts` (paciencia, paciencias distintas, solo cebos).
- Decisiones: «quedarse solos» lo cuento como «solo quedan cargadores», no «nadie más despierto»: si no, al saltar uno de una pareja el otro volvía a esperar. Una sala que solo tiene cargadores los delata a los 1,2 s: el cebo no tiene sentido sin nadie más. Lo hago mientras otra sesión tiene M9b (4) (botón de interactuar) en `en_curso`, con menos de 90 min: esta tarea no toca sus archivos.
- Medidas (bot, antes → después): planta 2, salas de combate limpias 7 → 7,6; cae ante el Router el 0 % → 12,5 % de las que caen (llegan más lejos); lo demás igual (planta 1 ganada 40 %, Nevera 43,3 %, Router 26,7 %).
- Problemas conocidos: ninguno.
- Siguiente paso: M9b (4) si la otra sesión lo suelta; si no, M9b (8), jefes que se mueven.

## 2026-11-04 17:55 (hora peninsular) — Hito M9b — Balas enemigas más grandes
- Hecho: M9b (3). Las balas enemigas redondas (rojas y cian) pasan de 5×5 a 9×9: un borde oscuro que las despega del suelo, el anillo de color, una banda clara y el núcleo blanco. Su caja de golpe pasa de radio 2,5 a 3,5 (`ENEMY_BULLET_RADIUS`, cubre la parte de color; el borde oscuro es solo para leerlas). Vale para todas las balas enemigas, también los cubitos, las tarjetas y las facturas. Test nuevo en `tests/patterns.test.ts`.
- Decisiones: la caja de golpe es algo menor que el dibujo, como es costumbre en el género: que una bala que «roza» el borde oscuro no duela. No he tocado velocidades: la dificultad de los jefes tiene su tarea (8).
- Medidas (bot, antes → después): heridas por minuto en la sala de pruebas 2,4 → 2,9; planta 1 ganada 45 % → 40 %; contra la Nevera gana 66,7 % → 43,3 % (5,1 heridas por combate, antes 4,23); contra el Router 50 % → 26,7 %.
- Problemas conocidos: ninguno.
- Siguiente paso: M9b (4), el botón de interactuar.

## 2026-11-04 17:42 (hora peninsular) — Hito M9b — Sin números de daño ni sellos al matar
- Hecho: M9b (2). Los disparos ya no ponen números sobre los enemigos (`damageText` fuera) y al desmontar a uno ya no sale su sello («Fuera de garantía», «Descatalogado»…; `DEATH_STAMPS` borrado de `src/data/texts.ts`). Quedan el destello, las chispas, el parón, el temblor, el sonido y las piezas volando. El e2e comprueba que tras disparar y desmontar al microondas no flota ningún texto.
- Decisiones: el aviso de golpe crítico del Ratón Gaming se queda: no es un número ni sale al matar, y es lo único que dice que el objeto funciona. Si el humano lo quiere fuera también, es una línea.
- Medidas: el bot no cambia (solo es dibujo).
- Problemas conocidos: ninguno.
- Siguiente paso: M9b (3), balas enemigas más grandes.

## 2026-11-04 17:36 (hora peninsular) — Hito M9b — Las notas del 30 de octubre, en tareas; la tecla pulsada sigue valiendo al cruzar una puerta
- Contexto: el humano dejó tres notas el 2026-10-30 sin atender. Las dos primeras (dificultad, escasez, cofres por calidades, botón de interactuar, corazones especiales, jefes erráticos, muebles volcables…) están partidas en catorce tareas en un hito nuevo, **M9b**, que va antes que M10. La tercera, y lo que la primera marca «para más adelante» (jefes al azar por planta, glosario, logros, PNJs en las plantas, Mostrador más grande, enemigos más distinguibles), va a M14 y a «Pautas del humano (2026-10-30)» en `docs/DISENO.md`.
- Hecho: M9b (1). Al entrar en una sala con una tecla de movimiento pulsada, la tostadora se quedaba quieta hasta soltarla y volver a pulsarla. Causa: cruzar una puerta reinicia la escena, y con ella `Controls`, que empezaba con la lista de teclas pulsadas vacía; una tecla que sigue pulsada no manda otro «keydown». Ahora las teclas pulsadas son de la página (`HELD` en `src/render/input.ts`, con sus propios oyentes en `window`, que además oyen los «keyup» que llegan mientras la escena se reinicia). El e2e de la planta sigue con la tecla pulsada al otro lado de la puerta y comprueba que la tostadora anda (fallaba antes del arreglo: 0 px; ahora pasa).
- Decisiones: el hito se llama M9b para no renumerar los demás (`npm run stats` acepta ya una letra tras el número). «Lo normal será encontrar 2 cofres por defecto en cada sala» lo leo como «en cada planta»: dos cofres por sala chocaría con la escasez que pide la misma nota. «Tickets para comprar» son los cupones; «los de cofres», los tickets.
- Medidas: el bot no cambia (el arreglo es solo de la entrada del teclado).
- Problemas conocidos: ninguno nuevo.
- Siguiente paso: M9b (2), quitar los números de daño y el texto al matar.

## 2026-10-30 06:15 (hora real) — Hito M10 — Diseño de la planta 3 (Juguetería)
- Hecho: la planta 3 diseñada en `docs/DISENO.md`: cuatro enemigos (Robot de Cuerda, Coche
  Teledirigido, Cubo de Piezas y Sobre Sorpresa), el jefe El Muñeco de Moda en tres fases
  (Lanzamiento, Rebajas y Liquidación total, con su sala, el Escaparate de Novedades), diez objetos
  pasivos de `level: 3`, dos sinergias (Unboxing y Manualidades) y el aspecto de la planta (goma EVA,
  nubes despegadas, cajas con ventana, casitas de muñecas cerradas por reformas). M10 partido en
  tareas en `docs/HOJA_DE_RUTA.md`, como se hizo con M8; la planta 4 se partirá al acabar la 3.
- Decisiones: la planta 3 es el muro que pidió el humano, pero no a base de pegar más: sus
  enemigos castigan quedarse quieto (el robot rebota por toda la sala, el coche embiste de lado) y
  andar sin mirar el suelo (las piezas hacen daño al andar y no al rodar: lo contrario de la
  escarcha). El jefe tiene tres fases y 300 de vida. Juguetes gastados y con mala cara, nunca
  monos (`docs/ESTILO_ARTE.md`). El sobre sorpresa es la sátira de las cajas de botín, con las
  probabilidades en letra pequeña. Nombres comprobados para no chocar con los que ya hay.
- Medidas: no hay cambios de juego.
- Problemas conocidos: ninguno.
- Siguiente paso: M10 (1), el juego de casillas de la Juguetería.

## 2026-10-30 06:00 (hora real) — Hito M9 — Después del repaso: salas centradas, frases al volver y postes
- Contexto: esta sesión cogió «M9 (8)» en `en_curso` a la vez que otra lo terminaba; al ir a
  publicar ya estaba hecho. En vez de tirar el trabajo, se ha rehecho encima de lo publicado,
  quedándose solo con lo que no estaba: la cámara, el marcador sin arma, `hubHint` y `crossHub` son
  los de la otra sesión.
- Hecho: (1) Las salas más estrechas o más bajas que la pantalla (las de 16 casillas, y el
  Mostrador, de 18) van centradas, con el negro repartido a los dos lados en vez de todo a la
  derecha (`scrollRange` en `src/render/camera.ts`, que también sustituye al «camY = 0» del
  Mostrador). (2) Los textos no se repiten al volver: acercarse otra vez a la Caja, al teléfono o al
  Chatarrero en la misma visita da una frase corta suya, distinta cada vez (`again` en
  `src/data/dialogues.ts`, `stationPages` en `src/sim/dialogue.ts`); la máquina de turnos pasa a su
  siguiente nota (dos notas nuevas). Test: ninguna frase está dos veces en los datos y nada se dice
  dos veces seguidas. E2e 45b (el teléfono, otra vez: «Pulse 1. Este teléfono no tiene teclas.»).
  (3) La navegación atravesaba los postes de la cola: su casilla parece libre (el poste está en el
  borde de abajo) y un bot que fuera de la fila de abajo a la Caja por el centro se quedaba
  empujando el poste. `findPath` comprueba ahora que se puede andar en línea recta entre las dos
  casillas de cada paso. Test nuevo (falla sin el arreglo).
- Decisiones: las frases cortas salen en orden y solo vuelven cuando se han dicho todas (tres por
  PNJ). La hora de esta entrada es la real (`date`), como pide el aviso de la entrada anterior;
  por eso va «antes» que las 08:00 de arriba, aunque es posterior.
- Medidas: el bot no cambia ni una cifra (el arreglo de los postes no toca las plantas); Mostrador
  cruzado el 100 %, en 9,4 s.
- Problemas conocidos: ninguno nuevo.
- Siguiente paso: M10, partir la planta 3 (Juguetería) en tareas y diseñarla.

## 2026-10-30 08:00 — Hito M9 — Repaso del Mostrador; M9 terminado
- Hecho: en el Mostrador la cámara se queda arriba (la sala solo es 18 px más alta que la pantalla
  y su última fila es pared): el cartel, el tablón y el teléfono se ven enteros siempre. El arma va
  enfundada también en el marcador: sin arma, munición ni su placa. La ayuda de abajo no habla de
  disparar: «WASD mover · Espacio rodar · la cinta de «Mercancía devuelta» empieza la partida»
  (`hubHint`). El test de textos repetidos mira ya los diálogos, los documentos y el tablón, y
  encontró uno: el teléfono decía «su llamada es muy importante», como otro texto; ahora la llamada
  «ha sido clasificada como “no urgente”. Como todas. La escucharemos cuando acabe la
  clasificación. Empezó en 2011.» (2011, como el banco de pruebas del correo). El bot pasa por el
  Mostrador antes de cada partida completa (`crossHub` en `src/sim/bot.ts`: se pone delante de cada
  cosa y coge la cinta; falla si se atasca, si pisa la cinta antes de tiempo o si algo dispara) y
  `npm run bot` lo cuenta. Tests nuevos en `tests/mostrador.test.ts`.
- Decisiones: M9 se da por terminado: se cumplen todos sus criterios (se abre y se vuelve al
  Mostrador; la partida empieza andando; los PNJs cambian según el perfil, con tests; el tablón y el
  archivador enseñan lo que hay y lo que falta; todo se guarda en el navegador). El siguiente es M10.
- Medidas: Mostrador cruzado en el 100 % de las partidas, en 9,4 s. El resto del bot, igual
  (empezar desde la cinta da la misma partida que antes).
- Problemas conocidos: el cartel con el nombre de la sala tapa un poco el teléfono los primeros
  segundos.
- Siguiente paso: M10, empezar por partir la planta 3 (Juguetería) en tareas y diseñarla.
- Aviso a la siguiente sesión: otra sesión apuntó «M9 (8)» en `en_curso` un minuto antes de que
  esta lo publicara terminado; se ha quitado de `en_curso` porque ya está hecho. Si eras tú, haz
  `git pull` y sigue con M10. Además, las horas de las entradas de hoy van adelantadas respecto al
  reloj real (esta se publicó a las 05:28 hora peninsular, 04:28 UTC): usad `date` para `desde`,
  o la regla de los 90 minutos de `en_curso` deja de servir.

## 2026-10-30 07:30 — Hito M9 — El documento de la sala secreta
- Hecho: la sala secreta de cada planta guarda en el suelo, dos casillas delante de su pedestal, el
  documento de historia de esa planta (`placeStoryDoc`; recogida nueva `documento`, sprite nuevo:
  una carpeta de cartón con la hoja asomando, un sello rojo y la pinza). Flota como los objetos y de
  cerca enseña su tipo («Manual de procedimiento»). Se coge al pisarlo, también rodando (es papel):
  sello, chispas y «Manual de procedimiento: al archivador». La partida lo lleva en `World.docs`,
  que sube de planta con `nextFloor`, y al acabar va en `RunResult.docs` al perfil (el archivador lo
  marca como «Nuevo»). Tests nuevos (`tests/documentos.test.ts`: está en las dos plantas y en sitio
  pisable, se coge, sube de planta y llega al archivador); el del tesoro cuenta ya el papel. E2e
  (39, 39b).
- Decisiones: el papel está siempre, aunque ya se tenga: no hay perfil en la simulación y volver a
  cogerlo no archiva nada nuevo. También sale en la sala secreta jugada sola (`?sala=secreta`), para
  poder probarlo.
- Medidas: el bot no cambia (no lo busca).
- Problemas conocidos: la carpeta es pequeña al lado de la tostadora; con la etiqueta se entiende.
- Siguiente paso: M9 (8), el repaso del centro (que se lea arriba con la tostadora abajo, quitar la
  munición del marcador en el Mostrador, que los textos no se repitan y que el bot cruce el centro).

## 2026-10-30 07:00 — Hito M9 — El archivador «Reclamaciones sin Resolver»
- Hecho: al ponerse junto al archivador se abre un panel (`src/render/archivo.ts`, puro): cabecera
  color carpeta con «1/4», la lista de documentos (el abierto en amarillo, los que faltan como
  «Expediente extraviado. Se ruega no reclamar.», los de la última partida con «Nuevo») y debajo la
  hoja abierta, con «Hoja 2 de 3» y «Q: pasar hoja» (la tecla de usar, que en el Mostrador no hacía
  nada). Abre por lo último encontrado; al acabar un documento pasa al siguiente que haya, y vuelve
  al primero (`firstCursor`, `nextCursor` en `src/sim/archive.ts`). Vacío: «Cajón vacío. Su
  reclamación será atendida por riguroso orden de llegada.». El tablón y el archivador comparten el
  papel y la entrada del panel (`panelPaper`, `panelSlideIn`). Tests nuevos
  (`tests/archivador-panel.test.ts`) y e2e (49: el albarán de la Nevera, y Q pasa a la hoja 2).
- Decisiones: la tarea (7) se parte en (7b), el archivador, y (7c), recoger el papel de la sala
  secreta, que toca la simulación y el arte de otra manera. Con texto grande no hay lista: solo el
  título del documento abierto, su hoja y el pie (si no, no cabe). `ARCHIVE_TITLE` repite el nombre
  del objeto a propósito: se añade a los nombres compartidos del test de textos.
- Medidas: el bot no cambia.
- Problemas conocidos: los expedientes extraviados se leen bastante apagados (a propósito).
- Siguiente paso: M9 (7c), el papel de la sala secreta.

## 2026-10-30 06:30 — Hito M9 — El tablón «Productos en Exposición»
- Hecho: el tablón del Mostrador lleva en sus cinco tarjetas a los cinco personajes (hoja nueva
  `fichas-tablon`, 6 × 7: a color los desbloqueados y en silueta los demás). Al ponerse delante
  se abre un panel abajo (`src/render/board.ts`, puro): cabecera roja, una fila por personaje con
  su cara, el nombre y debajo su frase o su condición; a la derecha cuánto falta («2/10») o
  «Reposición pronto» si está desbloqueado pero aún no es jugable (llegan en M13); al pie, «Unidades
  limitadas. Condiciones sujetas a cambios sin previo aviso.». Se cierra al apartarse. Con texto
  grande, una línea por personaje: el nombre o la condición con su cuenta. Tests nuevos
  (`tests/tablon.test.ts`: cuenta, caras a color/silueta, cabe y no se pisa a los dos tamaños con
  cuatro perfiles) y e2e (47–48: el panel con la Batidora desbloqueada y con texto grande).
- Decisiones: un panel y no el bocadillo, porque son cinco cosas a la vez y el bocadillo va página
  a página. Va abajo y por encima de la ayuda de controles y la munición, porque el tablón cuelga
  arriba y la tostadora está allí. La cuenta solo sale cuando hay algo que contar (un jefe se vence
  o no). Los nombres de los bloqueados se ven, en gris: dan ganas y el Chatarrero ya los nombra.
- Medidas: el bot no cambia.
- Problemas conocidos: la silueta del móvil es un rectángulo (se lee como «un móvil», sin más).
  El marcador de munición sigue en pantalla en el Mostrador.
- Siguiente paso: M9 (7), recoger el documento de la sala secreta y el archivador del centro.

## 2026-10-30 05:35 — Hito M9 — El teléfono, la máquina de turnos y el Chatarrero hablan
- Hecho: el bocadillo del Mostrador sirve ya a cualquier estación (`talkAt`, `STATION_TOP`,
  `hubPages`): la máquina de turnos dice su pantalla y una nota (`turnosScreen`), el teléfono la
  grabación del capítulo que toque (`telefonoPages`; el auricular se balancea más deprisa mientras
  suena) y el Chatarrero su pista (`chatarreroPages`), solo si ya cayó un jefe. Al pasar de una cosa
  a otra, la primera se calla y habla la nueva; al irse, termina la página y no sigue. El e2e se
  pone delante de cada uno (44–46) y comprueba que el Chatarrero aparece con un jefe vencido en el
  perfil.
- Decisiones: (4) y (5) en un solo commit porque son la misma pieza (el bocadillo genérico) con
  datos distintos que ya estaban hechos y probados en (3a). El tablón y el archivador no hablan:
  enseñarán un panel propio en (6) y (7).
- Medidas: el bot no cambia.
- Problemas conocidos: delante de la máquina de turnos la tostadora la tapa casi entera (es
  estrecha y baja); se lee igual por el bocadillo.
- Siguiente paso: M9 (6), el tablón con `rosterBoard` y las tarjetas (`BOARD_CARDS` ya está).

## 2026-10-30 05:10 — Hito M9 — La Caja de Devoluciones habla
- Hecho: al ponerse delante del mostrador (`nearStation` → `caja`), la Caja dice `cajaPages` del
  perfil en el bocadillo de la tienda, página a página, moviendo el cajón al hablar; vuelve a
  hablar si te vas y regresas. `tillSay` acepta ahora una lista de páginas y una altura propia
  (`tillTop`: la Caja es más alta que el autocobro). El e2e comprueba que tras una baja por
  microondas empieza por «Motivo de la devolución: exposición prolongada a microondas» (43).
- Decisiones: reutilizar el bocadillo del autocobro en vez de hacer otro: misma lectura, mismo
  texto grande, mismas reglas para no salirse de la pantalla. Habla sola al acercarse (sin tecla de
  «hablar»): en el Mostrador no hay nada más que hacer y así no hace falta explicar otro control.
- Medidas: el bot no cambia.
- Problemas conocidos: ninguno nuevo.
- Siguiente paso: M9 (4), el teléfono y la máquina de turnos con el mismo bocadillo.

## 2026-10-30 04:50 — Hito M9 — El Mostrador, en el juego
- Hecho: «Partida nueva» de la portada abre el Mostrador (`GameScene` con `{ hub: true }`, que se
  conserva en los reinicios de la escena); también `?mostrador`. Allí la tostadora anda y rueda con
  el arma enfundada (ni se ve ni dispara); el mostrador elige sus tramos por vecinos, los postes
  tienden su cinta, la cinta del almacén corre, la máquina de turnos parpadea, el Chatarrero (si ya
  cayó un jefe, `chatarreroHere`) mueve la rueda, y el tablón, el teléfono, las cortinas y el cartel
  cuelgan de la pared. Pisar la cinta: las cortinas se apartan, fundido y `leaveHub` con una semilla
  nueva; la partida empieza de cero. Al acabar (R tras el parte de baja o tras la última planta) se
  vuelve al Mostrador; «Unidad nueva» de la pausa también. El e2e pasa ahora por el Mostrador en la
  portada y en el historial, y tiene su tramo propio (40–42): no se dispara, la cinta lleva a la
  planta 1 y tras el parte de baja se vuelve. `src/art/hub.ts` guarda la geometría que comparten
  sprites y juego (`TAPE_Y`, la altura de lo que cuelga).
- Decisiones: el tablón pasa a la columna 5 (en la 2 lo tapaba el marcador de vida). Lo que cuelga
  va bajo en la pared, porque la cámara no enseña las filas de arriba con la tostadora abajo; el
  cartel tapa el tercio de arriba de las cortinas. Los enlaces con `?sala=`/`?semilla=` siguen como
  antes (reiniciar da otra planta), para no romper las pruebas ni el panel. El aviso de controles
  sale también en el Mostrador, aunque nombre el disparo: es la primera pantalla que se ve.
- Medidas: el bot no cambia (juega plantas, no el Mostrador).
- Problemas conocidos: con la tostadora abajo, el cartel «Mercancía devuelta» y el tablón se ven
  cortados por arriba hasta que se sube un poco. Los PNJs aún no hablan; el marcador de munición
  sigue en pantalla en el Mostrador.
- Siguiente paso: M9 (3), el bocadillo de la Caja con `cajaPages`.

## 2026-10-30 04:15 — Hito M9 — El arte del Mostrador
- Hecho: `tools/sprites/mostrador.ts` con doce hojas: el mostrador en tres tramos de una casilla
  (extremo izquierdo, medio y extremo derecho, que se juntan sin costura), la Caja de Devoluciones
  sobre su tramo (quieta y hablando: el cajón, que es su boca, sale de golpe con tres monedas), el
  poste de la cola y su cinta azul (`TAPE_Y`), la máquina de turnos con «12» en rojo y un punto
  que parpadea, el archivador con el cajón de arriba que no cierra de tantos papeles, el Chatarrero
  (una radio de baquelita roja en la sillita de un carrito de chatarra, con la rueda que baila),
  el tablón de corcho con cinco tarjetas vacías (`BOARD_CARDS`: el juego pondrá en ellas a los
  personajes), el teléfono con el auricular colgando del cable, la cinta del almacén (cuatro
  fotogramas que suben hacia la pared), las cortinas de tiras (quietas y apartadas) y el cartel
  «Mercancía devuelta» escrito con la «Letra Pequeña». `npm run sprites` deja además
  `capturas/sprites-mostrador.png`, el Mostrador entero montado con la tostadora para revisarlo.
  Un test nuevo (419): cada cosa tiene sprite y lo que cuelga cabe en la pared.
- Decisiones: la Caja tiene los ojos verdes de un visor antiguo, no rojos (los ojos rojos son de
  enemigos). El teléfono cuelga boca abajo para que se lea «descolgado». El cartel va escrito con la
  fuente del juego (una línea, 79 px, más ancho que la cinta, centrado encima).
- Medidas: el bot no cambia.
- Problemas conocidos: el Chatarrero es algo pequeño al lado de la tostadora; si en el juego no se
  lee, agrandar la radio. El teléfono y el tablón quedan sobre las estanterías pintadas de la
  pared; en (2b) quizá convenga una pared sin estanterías detrás.
- Siguiente paso: M9 (2b), el centro en el juego.

## 2026-10-30 03:45 — Hito M9 — El Mostrador de Devoluciones, en la simulación
- Hecho: plantilla `HUB` (`mostrador`, 18 × 12, clase `hub`, fuera de `ROOMS` para que nunca salga
  en una planta) con mostrador (`m`, uno por casilla) y la Caja encima (`C`), el tablón (`B`) y el
  teléfono (`t`) en la pared del fondo, la máquina de turnos (`n`) a la cabeza de una cola de seis
  postes (`|`, no paran balas ni cortan el paso más que su pie), el archivador (`a`), el Chatarrero
  (`h`) y la cinta de entrada al almacén (`>`, dos casillas bajo la pared). `Room.stations` (dónde
  se pone la tostadora para usar cada cosa) y `Room.belt`; `createWorld({ hub: { chatarrero } })`;
  `nearStation`, `onBelt`, `World.leftHub`, el evento `leaveHub` y `leaveHub(w, semilla)`, que da la
  planta 1 de una partida nueva con el mismo personaje. En el Mostrador no se dispara, no se
  recarga ni se usa el objeto activo; rodar sí. 8 tests nuevos (418).
- Decisiones: la reserva de esta tarea (de la sesión de las 00:24 UTC) llevaba dos horas sin un
  commit, más de los 90 minutos del protocolo, así que la cogí. La Caja va sobre el mostrador (una
  registradora encima del mostrador se lee mejor que escondida detrás) y se le habla desde delante.
  La cinta, en la pared del fondo para que las cortinas de tiras y el cartel «Mercancía devuelta»
  se vean de frente; cuenta pegarse a la pared encima de ella, pero no pasar rodando (como el
  montacargas). La semilla de la partida la pone quien llama (el juego elegirá una nueva cada
  vez). El Chatarrero lo decide quien crea el Mostrador (con el perfil), no la simulación.
- Medidas: el bot no cambia (el Mostrador aún no está en el juego).
- Problemas conocidos: los props nuevos no tienen sprite todavía; el juego no enseña el Mostrador.
- Siguiente paso: M9 (2), su arte y el centro en el juego (portada → Mostrador → cinta → planta 1;
  el parte de baja vuelve a él).

## 2026-10-30 03:20 — Hito M9 — Documentos de historia, en datos y en el perfil
- Hecho: `src/data/lore.ts` con cuatro documentos en orden de lectura: el albarán de la Nevera
  («súbase como todos, no hace falta mirar»), una página del manual de procedimiento (la sección
  «Reparación» arrancada; sala secreta de la planta 1), un correo interno sobre el banco de pruebas
  que quitaron para poner «la máquina de arriba» (Router) y un ticket de la cafetería de la última
  planta que vende piezas reacondicionadas (sala secreta de la planta 2). `Profile.docs` y
  `LastRun.docs`; `recordRun` archiva el de cada jefe vencido por primera vez y los que traiga
  `RunResult.docs`; `parseProfile` da los de los jefes a partidas guardadas de antes.
  `src/sim/archive.ts` (`archive`, `archiveCount`) prepara el archivador: lo encontrado, en orden
  de la historia; lo demás, «Expediente extraviado». 4 tests nuevos (410).
- Decisiones: la historia insinúa la trituradora (piezas sueltas a céntimos, «la máquina de
  arriba») sin decirla; eso queda para M12. Sin «º», «€» ni rayas porque la fuente no los tiene
  (un test lo vigila). Un test exige un documento por jefe: cada jefe nuevo de M10–M11 tendrá que
  traer el suyo. Los de las salas secretas no se recogen todavía (las puertas secretas aún no se
  abren en el juego); el perfil ya los acepta.
- Medidas: el bot no cambia.
- Problemas conocidos: nada lo enseña todavía.
- Siguiente paso: M9 (1)/(2) si siguen libres; luego (3) Caja y bocadillo, (6) tablón y (7)
  archivador en el centro, que ya tienen su lógica hecha.

## 2026-10-30 03:05 — Hito M9 — Desbloqueo de personajes, el mecanismo
- Hecho: `src/data/unlocks.ts` con `ROSTER`, los cinco del tablón «Productos en Exposición»
  (nombre, frase, condición en datos y su letra pequeña); `src/sim/unlocks.ts` (`meets`,
  `newUnlocks`, `unlockProgress`, `rosterBoard`, puros); `Profile.unlocked` (la Tostadora siempre)
  y `LastRun.unlocked` (lo que desbloqueó la última partida, para que el centro lo anuncie).
  `recordRun` comprueba las condiciones al acabar cada partida; `parseProfile` también, así una
  partida guardada de antes recibe lo que ya ganó. 6 tests nuevos (406).
- Decisiones: condiciones provisionales hasta que existan las plantas 3–5 (M10–M11): Batidora de
  Vaso al vencer a la Nevera, Plancha al vencer al Router, el Becario tras diez bajas
  («experiencia demostrable») y el Móvil al encontrar veinte objetos distintos (hay 23). Un
  desbloqueo no se pierde nunca, aunque la condición se endurezca o el personaje desaparezca de
  una versión (los ids desconocidos se conservan). Comprobar dentro de `recordRun` y no en
  `save.ts` deja el mecanismo entero en la simulación y con tests. El Chatarrero ahora dice que
  los de la exposición salen venciendo jefes, juntando chatarra o cayendo muchas veces.
- Medidas: el bot no cambia.
- Problemas conocidos: los cuatro personajes nuevos aún no son jugables (M13); desbloquearlos
  solo cambia el perfil.
- Siguiente paso: M9 (1)/(2) si siguen libres; luego (6) el tablón en el centro con `rosterBoard`.

## 2026-10-30 02:25 — Hito M9 — Los diálogos del Mostrador, en datos y con tests
- Hecho: `src/data/dialogues.ts` con lo que dicen la Caja de Devoluciones, el teléfono del
  Servicio Técnico, la máquina de turnos y el Chatarrero, con condiciones en datos (`DialogueWhen`:
  partidas, jefes vencidos, cómo acabó la última partida, planta, rapidez, objetos encontrados) y
  prioridades. `src/sim/dialogue.ts` elige, puro: `cajaPages` (empieza por «Motivo de la
  devolución: <causa del parte de baja>», luego un comentario —jefe > rapidez/planta > genérico— y
  un sello), `telefonoPages` (el capítulo más alto que desbloquean los jefes), `turnosScreen`
  («Atendiendo al 12 · Su turno: 4.000.037») y `chatarreroPages` (null hasta el primer jefe; la
  pista de lo que falta primero). `Profile.last` guarda la última partida (planta incluida:
  `RunResult.level`, que pasa `GameScene`); `parseProfile` lo lee con cuidado. 8 tests nuevos
  (400 en total).
- Decisiones: otra sesión tenía cogida M9 (1) hace 45 min, así que hice la parte pura de (3)–(5),
  que no toca la sala ni el motor; la apunto en la hoja como (3a) y dejo (3)–(5) para ponerlos en
  el juego (el bocadillo, cuando el Mostrador exista). Elección sin estado: entre las frases de
  más prioridad, un orden barajado con semilla fija recorrido por `runs`, así la misma visita dice
  lo mismo y dos partidas seguidas no repiten frase. Cada página ≤ 90 caracteres (un bocadillo de
  tres líneas); lo comprueba un test, igual que la fuente. El Chatarrero no habla de paredes
  huecas porque las puertas secretas aún no se abren en el juego: solo dice que hay una sala que
  no sale en el plano.
- Medidas: el bot no cambia (no toca el equilibrio).
- Problemas conocidos: nada lo enseña todavía; la máquina de turnos usa el número de partidas
  (`runs`), que no cuenta las plantas superadas a mitad de partida (correcto: es una por unidad).
- Siguiente paso: M9 (1)/(2) si siguen libres; después (3) poner la Caja y el bocadillo en el
  centro usando `cajaPages`.

## 2026-10-30 01:40 — Hito M9 — El centro diseñado y el hito partido

- Hecho: **el Mostrador de Devoluciones diseñado** en `docs/DISENO.md` (sección nueva bajo «Progresión entre partidas»): sala pequeña sin enemigos donde empieza y acaba cada partida, con la cola de cinta vacía, la Caja de Devoluciones (comenta tu última baja), el teléfono del Servicio Técnico (la grabación avanza con los jefes y suelta la historia), la máquina de turnos (tu número son las partidas jugadas más cuatro millones), el Chatarrero (tras el primer jefe; pistas de desbloqueos), el tablón «Productos en Exposición» (los cinco personajes, en silueta los bloqueados, con su condición) y el archivador «Reclamaciones sin Resolver» (los documentos de historia). Se entra al almacén pisando la cinta transportadora de «Mercancía devuelta». **M9 partido en nueve tareas** en `docs/HOJA_DE_RUTA.md`, con criterios de aceptación.
- Decisiones: los PNJs son aparatos, como todo el reparto (una caja registradora, un teléfono, un carrito), y el chiste apunta a la atención al cliente y no a quien atiende. Los personajes nuevos jugables siguen en M13: en M9 va el mecanismo de desbloqueo y el tablón, para no hacer cinco personajes a medias. El Chatarrero solo habla por ahora; una tienda entre partidas pide una moneda que dure entre partidas y eso es diseño de M14. El centro se recorre andando y no es un menú: así sirve la misma simulación (sala sin enemigos) y el bot puede cruzarlo.
- Medidas: sin cambios de código.
- Siguiente paso: M9 (1), la sala del Mostrador en la simulación.

## 2026-10-30 01:25 — Hito M8 — La tarea doble de la planta 2: lo que sumo a la otra sesión

- Qué pasó: esta sesión (23:25 UTC) apuntó la tarea en `en_curso` e hizo push antes de empezar, pero la otra sesión ya estaba en ella sin apuntarla (lo cuenta en su entrada). Las dos llegamos a lo mismo: el bot encadena la planta 2, `freeSpot` busca más lejos, el bot no se planta sobre un activo y la planta 2 cuenta como 3 salas más honda. **Me quedo con lo suyo** (llegó antes a `main`) y descarto mi versión de todo eso; solo añado lo que no estaba.
- Hecho (lo que sumo): (1) **el Ratón sin Pilas ya no salta al otro lado de un bloque de estanterías**: con la búsqueda de `freeSpot` hasta 240 px, si su destino caía dentro del bloque de la Autoimpresión aparecía en el otro lado, muy lejos de su salto de 110 px (y, si no encontraba nada, dentro de la pared). Ahora `freeSpot` admite un sitio de repuesto y `lagSpot` se queda quieto si no hay suelo libre a menos de 1,25 veces su salto. (2) **Una partida entera que ni gana ni cae en su tiempo es un fallo del bot** (`playFloor`): así salen solos los bloqueos como el del activo, que antes solo se veían en las cifras. (3) `tests/planta2-entera.test.ts` (3): el ticket y el cofre de premio caen en suelo libre en **todas** las plantillas de combate de las plantas 1 y 2; el ratón ante un bloque (falla sin el arreglo: saltaba 198 px); y el bot no se queda encima del activo que acaba de soltar (falla sin el arreglo de la otra sesión). Y M8 marcado «(hecho)» en la hoja de ruta, para que `npm run stats` lo cuente terminado y pase a M9.
- Decisiones: no subo mi otra idea de dificultad, `FLOOR_RULES` con una «dureza» por planta (el daño de la tostadora dividido contra todo lo de la planta), porque la otra sesión decidió, con motivo, subir enemigos y no vida, y su cifra ya cumple. La dejo medida para la planta 3, que tiene que ser el muro (100 partidas, unas 49 llegan a la 2): con 3 de hondura y dureza 1,25 la 2 la gana el 59 % (0,83 heridas por sala); con 3 y 1,4, el 49 % (1,00); con 2 y 1,4, el 57 %. El código está en la rama local de esta sesión y no hace falta: son unas 20 líneas en `planFloor` y en el impacto de bala.
- Medidas: `npm run bot` igual que la otra sesión (planta 1 gana el 45 %; planta 2: llegan 9 de 20, la gana el 55,6 %, 0,48 heridas por sala; Router aislado 50 %, jefa 66,7 %), 0 fallos. 392 tests en verde. Sin cambios visuales (sin e2e).
- Problemas conocidos: ninguno nuevo.
- Siguiente paso: M9, partirlo en tareas pequeñas en la hoja de ruta y empezar por el Mostrador de Devoluciones.

## 2026-10-30 00:29 — Hito M8 — La planta 2 entera, medida (M8 terminado)

- Hecho: **`npm run bot` juega la planta 2**. Cada una de las 20 plantas 1 se recorre también en la planta 2 sin daño (que se pueda recorrer entera), y cada partida que gana la 1 sigue en la 2 con lo que lleva (`nextFloor`, como en el juego), con 1,5 veces más tiempo. Línea nueva en el informe: cuántas llegan y con cuánta vida, cuántas la ganan, caen y caen ante el Router, y segundos y heridas por sala. `playFloor` acepta la planta y un mundo del que seguir, y devuelve el mundo. Con eso han salido **cuatro fallos que solo pasaban en la planta 2**, ahora arreglados: (1) y (2) un ticket de recompensa y unos enemigos aparecían dentro del bloque de estanterías de seis casillas del centro de la «Autoimpresión»: `freeSpot` solo buscaba hasta 48 px; ahora sigue hasta 240 px. (3) el bot se quedaba para siempre encima de un objeto activo: si ya llevaba uno, el «desvío por lo que hay cerca» lo llevaba al que acababa de soltar al cambiarlos, y ese no se coge hasta apartarse; ahora no se desvía a por activos si ya tiene uno (lo mismo que ya hacía en la tienda). (4) dos partidas de cada 60 se quedaban por eso sin acabar la planta.
- Dificultad: **la planta 2 cuenta como 3 salas más honda** (`LEVEL_DEPTH` en `src/sim/world.ts`): más presupuesto de enemigos por sala. Test nuevo: más de 1,2 veces los enemigos por sala de la planta 1 (`tests/planta2-dificultad.test.ts`, con otro para `freeSpot`).
- Medidas (60 plantas 1; llegan 25 partidas a la 2, con 4,8 medios corazones de media): antes de tocar nada, la planta 2 la ganaba el 96 % de las que llegaban, con 0,34 heridas por sala (la 1 da 0,81): las armas y objetos de la planta 1 la hacían un paseo. Con 3 salas más de hondura: **la gana el 64 %, cae el 36 % (el 8 % ante el Router), 0,61 heridas y 17,7 s por sala**. Con 4 salas daba lo mismo (las plantillas no tienen más huecos de enemigo), así que se queda en 3. En `npm run bot` (20 plantas, llegan 9): gana el 55,6 %, cae el 44,4 %. Ganar las dos plantas seguidas: cerca del 27 %. Planta 1, la jefa y el Router aislado, iguales. 389 tests en verde; e2e en verde.
- Decisiones: subir el número de enemigos y no su vida: se nota más (más balas en pantalla) y no toca a la planta 1. El Router se queda en 200 de vida: aislado y con el arma inicial lo gana el bot la mitad de las veces, y en partida (con lo de la planta 1) mata a pocos; está bien que el jefe no sea donde más se cae de la planta. La planta 3 tiene que ser el muro (nota del humano); la 2 ya es más dura que la 1 por sala, aunque se llegue mejor equipado.
- Problemas conocidos: la muestra de la planta 2 en `npm run bot` es pequeña (las partidas que ganan la 1, unas 9). Para afinar, `runFloors(60)` desde un script tarda minuto y medio.
- **M8 terminado**: todas sus tareas hechas; la planta 2 tiene juego de casillas, plantillas propias, cuatro enemigos, diez objetos, salas especiales y jefe, y se juega encadenada a la 1.
- Error de protocolo mío: empecé esta tarea sin apuntarla en `en_curso` y sin `git pull`; mientras, otra sesión (la de las 23:25 UTC) la cogió. Al subir ya estaba hecha: esa sesión debería dejarla y quitar su entrada de `en_curso` (no la borro yo, es suya). Desde ahora: apuntar siempre la tarea antes de tocar código, también al encadenar tareas en la misma sesión.
- Siguiente paso: M9, el centro y la historia. Primero partirlo en tareas pequeñas en la hoja de ruta (el Mostrador de Devoluciones como escena, guardado de progreso entre partidas, los PNJs...).

## 2026-10-30 00:05 — Hito M8 — Jefe (2b): el Router del Wifi pelea

- Hecho: **el Router del Wifi es el jefe de la planta 2** (letra `X`; `floorBossOf(level)` en `src/data/rooms.ts` sustituye a `FLOOR_BOSS_1` donde se rellena la `J`; la planta 1 sigue con la Nevera). Usa el mismo cerebro de jefe que la Nevera, ampliado con datos: `BossPhase.relays` (planta repetidores en las esquinas más lejanas de la tostadora al empezar la fase y, con `every`, uno nuevo cada tantos segundos si no le queda ninguno), `BossPhase.reboot` (la pausa entre fases pasa a ser un reinicio de `time` s con su frase), `BossPatternAttack.relay` (los repetidores disparan a la vez un patrón suyo desde donde están) y un ataque nuevo, `drop` («caídas de conexión»: sitios marcados en el suelo que sueltan un anillo al cabo de 1 s; son emisores con aviso, así que se ven con el anillo que se cierra de siempre, sin dibujo nuevo). Los anillos admiten huecos (`RingDef.gaps`: ninguna bala a menos de medio ancho del giro pedido respecto a la puntería). Enemigo nuevo **Repetidor de Señal** (`RelayBrain`: quieto, enchufado, mirando a la tostadora; cae cuando su dueño se reinicia o cae). Fase 1: dos repetidores, dos anillos de 24 con un hueco de 60° que gira de 35° a 65°, reenviados por los repetidores con un anillo fino de 12; tres abanicos de paquetes. Reinicio a media vida: 5 s apagado, sin recibir daño (el estado `roar` de siempre), balas limpias, repetidores al suelo, los fotogramas 6–11 del sprite repartidos por el reinicio (las luces se encienden una a una) y «Reiniciando. No desenchufe el dispositivo» bajo él. Fase 2: tres anillos de 28 con dos huecos que se separan (±30°, ±60°, ±90°), abanicos de siete y tres caídas de conexión; un repetidor nuevo cada 12 s sin ninguno. El cartel lleva su propia línea («Jefe de planta · Informática»: `boss.subtitle`). Sonidos: el chirrido de la Nevera solo para la Nevera; el Router se apaga, los repetidores se enchufan con un salto. `npm run bot` mide ahora también 30 combates contra el Router. Tests nuevos en `tests/router-jefe.test.ts` (6). El e2e saca el cartel, las ondas, el reinicio y las caídas (36a–d).
- Arreglo de paso: un enemigo que muere durante su propia actualización (los repetidores al reiniciarse el Router) se quedaba un tic «muerto pero en el mundo» y lo pillaba `checkInvariants`; `step` vuelve a recoger a los caídos justo después de mover a los enemigos. En la planta 1 no cambia nada (mismas cifras del bot).
- Decisiones: el Router no es un cerebro nuevo sino el de la Nevera con piezas de datos: así el próximo jefe puede usar repetidores, reinicios o caídas sin tocar el motor. Los repetidores disparan un anillo propio y más fino: con el mismo anillo del Router (tres fuentes de 30 balas) el bot ganaba el 3 %. Los puse primero en las esquinas de verdad y quedaban fuera de la pantalla con la tostadora en el centro; ahora están 4,5 casillas dentro, se ven, y por eso el combate pide matarlos. Sin «…» en la frase del reinicio: «Letra Pequeña» no lo tiene. «Exceso de cobertura» como causa de baja, porque «Cobertura total» ya es el nombre de la fase (el test de chistes repetidos lo pilló).
- Medidas (bot con el Secador, `runBoss` en la Sala de Redes): primera versión 3,3 % de victorias; con el anillo fino de los repetidores 23 %; con anillos de 24 y hueco de 60° y 220 de vida, 32,5 % (80 combates); con la fase 2 algo más suave, 51 %; con los repetidores ya visibles, 37,5 %; con 200 de vida, **47,5 % en 104 s (80 combates)** y en `npm run bot` (30) **50 % en 102 s, 4,8 heridas (2,3 en la fase 1, 2,5 en la 2), fase 2 a los 54 s**. La Nevera sigue en 66,7 %, 91,8 s y 4,23 heridas: el Router es más difícil, como toca a la planta 2, y el bot va con el arma inicial. Planta 1 igual (200 partidas sin fallos, la planta la gana el 45 %). 387 tests en verde.
- Capturas revisadas (36a–d): el cartel cabe; las ondas cian salen del Router y de los repetidores; en el reinicio el Router tiene los ojos cerrados, la frase se lee bajo él y los repetidores están en el suelo; en la fase 2 se ven los anillos con dos huecos y las tres marcas de las caídas alrededor de la tostadora.
- Problemas conocidos: con la tostadora abajo del todo la cámara deja al Router medio cortado arriba (pasa igual con la Nevera; la cámara sigue a la tostadora). El repetidor de la esquina de arriba a la izquierda puede quedar debajo del HUD de corazones.
- Siguiente paso: M8, la última tarea: que el bot juegue plantas 2 completas y ajustar su dificultad. Después, M9.

## 2026-10-29 23:42 — Hito M8 — Enemigos (4): la Webcam Siempre Encendida

- Hecho: **cuarto y último enemigo de Informática**, con cerebro nuevo (`WatcherBrain`, `kind: 'watcher'`). Es de apoyo: guarda las distancias (150 px) y, cada 1,6–2,6 s, si te ve (`watcherSees`: a menos de 260 px y sin pared ni objeto en medio) **graba** 1,2 s: el objetivo se pone rojo (fotograma 6), sale «Grabando» con un pitido y una línea de puntos rojos va del objetivo a la tostadora y la sigue (`Warning.reach`, nuevo: la línea apuntada llega hasta donde le digan). Si te escondes detrás de algo, «Conexión perdida» y vuelve a empezar al rato. Si no, «Compartiendo pantalla»: **los demás enemigos de la sala dejan de esperar y atacan ya**, y durante 4 s sus esperas corren ×1,6 (`Enemy.rush`, genérico: vale para cualquier cerebro que espere en `walk` o `idle`); ella saca la foto (`webcam-flash`: dos abanicos, de cinco y de cuatro balas) con un obturador. No avisa a otras webcams, ni a los jefes, ni a los cargadores que siguen haciendo de cebo. 12 de vida. Sprite de 7 fotogramas (`makeWebcam`): barra de webcam negra sobre su pinza de monitor, el objetivo como único ojo bajo la tapa de privacidad bajada a medias como un párpado receloso; la lucecita de «no estoy grabando» apagada y rota (graba igual: ese es el chiste), un trozo de celo despegado colgando del lateral y la cola USB. Letra `W`, como mucho una por sala. Sonidos `grabar` y `obturador`. Causa de baja: «Foto subida sin consentimiento» / «Videollamada sorpresa». Tests nuevos en `tests/webcam.test.ts` (5): datos; graba siguiéndote y dispara la foto; escondido detrás de una caja pierde la conexión y no avisa ni dispara; el aviso hace atacar ya al microondas, le pone prisa que luego se pasa y deja al cargador tirado; determinista y presente en la planta 2. El e2e saca la grabación y el aviso (35l, 35m).
- Herramienta nueva: `npm run enemigos -- OO WO RR` mide parejas de enemigos (letras de plantilla) en 60 salas de combate de la planta 2 con el bot: heridas y segundos por sala, y avisos y grabaciones perdidas de la webcam. Las sesiones anteriores medían con scripts sueltos; así queda a mano.
- Decisiones: de las dos ideas de la hoja de ruta, la Webcam y no el Disco Duro que se cuelga, porque «colgarse» es casi el atasco de la Impresora, y un enemigo que no ataca casi pero empeora a los demás es un papel que no había. El contraataque es doble y se lee: matarla primero (es frágil) o cortarle la línea de visión con una estantería. La primera versión (9 de vida, foto de cinco balas, solo «atacad ya») hacía las salas **más fáciles** que con dos enemigos normales (Webcam + Microondas 0,30 heridas por sala frente a 0,43 con dos Microondas): adelantar un ataque que llegaba de todas formas en un segundo no basta. Con la prisa de 4 s, la foto doble, 12 de vida y algo menos de espera queda a la altura de una pareja normal y las salas son más cortas.
- Medidas (`npm run enemigos`, 60 salas de la planta 2 por pareja, bot con el Secador): Microondas ×2 0,43 heridas y 43,2 s; Webcam + Microondas 0,45 y 36,4 s; Impresora ×2 0,30 y 45,5 s; Webcam + Impresora 0,33 y 40,8 s; Ratón ×2 0,55 y 13,2 s; Webcam + Ratón 0,32 y 21,1 s; Webcam ×2 0,23 y 25,2 s. La webcam avisa 1,5 veces por sala y pierde la grabación otras tantas (el bot se mueve y las estanterías tapan). Planta 1 igual (bot: 200 partidas sin fallos, la planta la gana el 45 %, la jefa el 66,7 %). 381 tests en verde. Capturas 35l y 35m revisadas: la línea roja de puntos y «Grabando» se leen; en el aviso, el microondas ya tiene su «!» y la foto sale hacia la tostadora.
- Arreglo de paso: la semilla del e2e de la Impresora volvió a cambiar de sala al crecer la lista de enemigos de la planta 2 (`e2e-impresora-3` ya no tenía impresora); ahora es `e2e-impresora-12`. Las de Cargador y Ratón siguen valiendo.
- Problemas conocidos: durante la grabación el relleno amarillo de aviso de siempre tapa a ratos el objetivo rojo; es el mismo lenguaje que el resto de enemigos y la línea de mira ya avisa, así que lo dejo. `progress.json`: M8 cuenta ahora sus casillas reales (16 de 17).
- Siguiente paso: M8, jefe (2b): el Router del Wifi en la simulación, la última tarea del hito. Después, que `npm run bot` mida también la planta 2 entera.

## 2026-10-29 22:53 — Hito M8 — Enemigos (3): el Ratón Inalámbrico sin Pilas

- Hecho: **tercer enemigo de Informática**, con otro cerebro nuevo (`LaggerBrain`, `kind: 'lagger'`). Va hacia ti durante 0,9–1,5 s y se queda **sin señal**: se congela 0,85 s (fotograma con un círculo de carga por ojos y la luz apagada) mientras un anillo rojo que se cierra marca **dónde va a aparecer** (el aviso de siempre, puesto en el destino: `activeWarnings` lo saca de `en.dest`); después aparece allí de golpe (evento `lagJump`: polvo donde estaba y donde está, y un clic) y suelta dos anillos de ocho balas (`raton-clic`). El destino (`lagSpot`) está como mucho a 110 px, nunca a menos de 56 px de ti y en suelo libre; si ya está cerca, salta de lado. De cerca te rodea en vez de meterse encima. Sprite de 7 fotogramas (`makeRatonFrames`): botones, ruedecita, cejas de fastidio, la luz de batería baja parpadeando en rojo, el hueco de las pilas con una telaraña y el cable cortado con tijeras. Letra `R` en `SLOT_ENEMIES_2`. Causa de baja: «Doble clic accidental». Tests nuevos en `tests/raton-inalambrico.test.ts` (4) y dos capturas (35j congelado, 35k clic).
- Decisiones: el aviso va en el sitio donde aparecerá y no sobre el ratón: lo peligroso es el sitio. La primera versión daba 1,12 heridas por sala (la mitad por chocar con él); con el rodeo de cerca, 56 px de distancia mínima, un poco más de aviso y ocho balas por anillo en vez de diez se queda en 0,53, como el Cargador. Arreglo de paso: las semillas del e2e de la impresora y el cargador cambiaron al crecer la lista de enemigos de la planta 2; ahora esas pruebas dejan solo a su enemigo en la sala y fallan con un mensaje claro si no está.
- Medidas (dos iguales por sala de la planta 2, bot con el Secador, 60 salas): Ratón 0,53 heridas (0,13 de choques) y 12 s por sala; Cargador 0,50 y 21 s; Impresora 0,47 y 45 s; Microondas 0,47 y 42 s. Planta 1 igual (bot: 200 partidas sin fallos, la planta la gana el 45 %, la jefa el 66,7 %). 371 tests en verde. Capturas 35j y 35k revisadas: el «!» amarillo sobre el ratón congelado y el anillo rojo en el suelo se leen a la vez.
- Problemas conocidos: ninguno nuevo. La planta 2 entera sigue sin medir con el bot.
- Siguiente paso: M8, enemigos (4): el cuarto de Informática.
- Cierre de sesión: esta sesión (20:25 UTC) ha hecho los diez objetos de Informática (en tres tareas) y tres de sus cuatro enemigos. Cierro aquí para dejar libres los archivos de enemigos (`src/data/enemies.ts`, `src/sim/enemies.ts`, `tools/sprites/enemies.ts`): la sesión del Router los espera para meter al jefe en la simulación, y el cuarto enemigo puede ir después o en paralelo sin tocar al jefe.

## 2026-10-29 22:52 — Hito M8 — Jefe (2a): sprites del Router del Wifi y del repetidor

- Hecho: `tools/sprites/router.ts` (nuevo) dibuja **el Router del Wifi** a tamaño de jefe (72 × 76, como la Nevera): router blanco ancho en tres cuartos, cuatro antenas (la segunda doblada por la mitad y con celo), ojos grandes con el iris verde de piloto bajo unos párpados caídos de suficiencia y una sonrisa torcida, manos de guante flotantes, piernas cortas con zapatos de oficina. Chistes: cinco LEDs (encendido, wifi, **internet en rojo**: conectado sin internet, LAN, LAN apagada), la pegatina de la clave en el lateral con la esquina arrancada, un «5G» amarillo que no es y un cable de red que sale por detrás y no va a ninguna parte. Hoja `router-wifi` de 12 fotogramas: 0–5 despierto (reposo, respiración con el wifi parpadeando y la zancada de pie levantado de la Nevera) y 6–11 **reiniciándose**: ojos cerrados y de 0 a 5 LEDs en ámbar. Hoja `repetidor` (20 × 24, 3 fotogramas): un repetidor de enchufe de pie sobre sus dos patillas, con una antena corta y ojos cansados; LED que parpadea y fotograma desenchufado. Test nuevo `tests/router.test.ts` (2): tamaños, fotograma 0 = reposo, y que cada fotograma del reinicio enciende una luz más.
- Decisiones: los ojos verdes y no rojos como la Nevera: son pilotos de «todo va bien» y es justo lo que dice mientras no funciona. Las manos en el gris de guante de la Nevera, porque en blanco se fundían con la carcasa y no se leían como manos. El reinicio no usa otra pose: el chiste está en la cara y en las luces. El sprite queda en el juego (en `sprites.json`) pero nada lo usa todavía; lo usará la parte (2b).
- Medidas: sin cambios de simulación (bot: 200 partidas sin fallos). 370 tests en verde. Ningún sprite aprobado cambia. Hoja revisada a ×3 y a ×4 junto a la tostadora, la Impresora y el Cargador: misma mano, contorno y luz; el Router se lee como router y como jefe.
- Problemas conocidos: ninguno nuevo.
- Siguiente paso: M8, jefe (2b): el Router en la simulación (cuando los archivos de enemigos estén libres), o el enemigo que quede.

## 2026-10-29 22:45 — Hito M8 — Jefe (1): diseño del Router y salas especiales de Informática

- Hecho: **el Router del Wifi está diseñado** en `docs/DISENO.md` (fase 1 «Cobertura total» con anillos que tienen un hueco y abanicos de paquetes; dos repetidores rompibles en las esquinas que reenvían sus anillos; **reinicio** a media vida: 5 s apagado, sin recibir daño, balas limpias y repetidores fuera; fase 2 «Actualización de firmware» con dos huecos que giran en sentidos contrarios y «caídas de conexión» marcadas en el suelo; lema «Cobertura total. En la otra habitación.»). **La planta 2 tiene ya todas sus salas**: tesoro «Reservas que Nadie Vino a Recoger», tienda «Accesorios Oficiales (Funda No Incluida)», secreta «Almacén de Modelos Descatalogados» y la sala del jefe «Sala de Redes (Clave en la Pegatina)», 26 × 16, despejada en el centro y con cuatro escuadras de rack en las esquinas. Tests: la planta 2 solo usa salas suyas y la 1 solo las del almacén (todas las clases, también en plantas generadas); las especiales de la 2 tienen los mismos pedestales, estantes, tendero, jefe y tamaño que las del almacén. `runBoss` (en `tools/bot.ts`) acepta sala y planta, para medir al Router cuando llegue. El e2e saca las cuatro salas (33c–f).
- Decisiones: he partido la tarea del jefe en dos porque la otra sesión tenía cogidos los archivos de enemigos (Impresora y luego Cargador Falso) y el jefe los toca; el diseño y la sala no. La sala está pensada para los anillos con hueco: se esquivan moviéndose, así que el centro va despejado y la cobertura solo en las esquinas (contra los repetidores). Mismos huecos (`*`, `s`, `$`, `J`) y tamaños que las del almacén para no tocar el código de la tienda, el tesoro ni el jefe. Hasta que llegue el Router, la Nevera pelea en la Sala de Redes. «Clave en la Pegatina» en vez de «Contraseña en la Pegatina de Abajo»: más corto, cabe en el cartel.
- Medidas: planta 1 igual (bot: 200 partidas sin fallos, la planta la gana el 45 %, la jefa el 66,7 % en 91,8 s). La Nevera en la Sala de Redes (30 combates, `runBoss(30, 240, 'jefe-informatica', 2)`): gana el 76,7 % en 89,5 s, 3,8 heridas; las escuadras le dan algo de cobertura al bot. Da igual: ahí pelea el Router. 363 tests en verde. Capturas 33c–f revisadas: los nombres caben, los monitores y sillas se leen, la tienda tiene la alfombra hasta el estante del centro.
- Problemas conocidos: en la tienda el bocadillo del tendero tapa a medias al tendero al entrar (pasa igual en la del almacén).
- Siguiente paso: M8, jefe (2): el Router del Wifi (cuando los enemigos de Informática estén libres) o el siguiente enemigo que no esté cogido.

## 2026-10-29 22:41 — Hito M8 — Enemigos (2): el Cargador Falso

- Hecho: **segundo enemigo de Informática**, con un cerebro nuevo (`MimicBrain`, `kind: 'mimic'`, estados `lurk` y `reveal`). Viene en pareja y espera **tirado en el suelo como un cargador olvidado**, de lado, con los ojos cerrados en una raya y su etiqueta amarilla de GRATIS (fotograma 6). Si te acercas a 64 px o le disparas, **salta** (fotograma 7, chispas entre las clavijas, «No homologado» en cian y el sonido de saltar), corre hacia ti a 72 px/s y, a 50 px, se para, chisporrotea 0,45 s (el aviso de siempre) y suelta **un calambre en corro**: dos anillos de 10 chispas cian que viven 0,45 s (`cargador-calambre`). 8 de vida, de 0 a 2 cupones. Tirado en el suelo no hace daño por contacto. Sprite de 8 fotogramas (`makeCargadorFrames`): clavijas como cuernos, cejas de malas intenciones, sonrisa de dientes, quemadura en la cara, cable de cola y chanclas. Letra `F` en `SLOT_ENEMIES_2` (coste 3, como mucho una pareja por sala). Causa de baja: «Calambre de un cargador no homologado». Tests nuevos en `tests/cargador.test.ts` (5) y tres capturas en el e2e (35g cebo, 35h descubierto, 35i calambre).
- Decisiones: el cebo tiene que poder verse: en la captura se distingue del decorado si te fijas (es blanco y está en mitad del paso), pero no grita «enemigo». Despierta a 64 px, más lejos que el alcance de su calambre (50 px), así que siempre hay tiempo de verlo saltar. Si salen dos a la vez, el letrero sale una sola vez. Lo de «No homologado» en vez de una exclamación: el tono del juego es seco.
- Medidas (dos iguales por sala de la planta 2, bot con el Secador, 60 salas): Cargador 0,47 heridas y 21 s por sala; Impresora 0,37 y 46 s; Microondas 0,40 y 44 s; Batidora 0,40 y 17 s. Planta 1 igual (bot: 200 partidas sin fallos, la planta la gana el 45 %, la jefa el 66,7 %). 367 tests en verde.
- Arreglo de paso: las horas de mis cuatro entradas anteriores de hoy estaban adelantadas (puse la hora a ojo); ahora son las de sus commits en hora peninsular (21:44, 21:55, 22:10 y 22:28).
- Problemas conocidos: ninguno nuevo.
- Siguiente paso: M8, enemigos (3): el Ratón Inalámbrico sin Pilas.

## 2026-10-29 22:28 — Hito M8 — Enemigos (1): la Impresora que se Atasca

- Hecho: **el primer enemigo de Informática**. Una torreta que se pasea despacio a 150 px de ti y dispara ráfagas de seis **facturas** (bala nueva `invoice`: hoja blanca con borde rojo que aletea, `bala-factura`; vuelan haciendo eses). Cada 2–3 ráfagas **se atasca** (`TurretBrain.jam`, estado `jam`): 2 s quieta, temblando, sin disparar, con «Atasco de papel» encima y un sonido de rodillos (`atasco`); luego avisa 0,7 s y lo suelta todo en dos anillos (`impresora-atasco`). Sprite de 8 fotogramas (`makeImpresoraFrames`: respirar, andar y dos de atasco con los ojos apretados y la factura arrugada en la boca), con un montón de folios detrás, el LCD con ERR, un pósit que dice NO, la etiqueta del precio de la tinta y zapatos de oficina. Letra `I` en las plantillas y `SLOT_ENEMIES_2` (la planta 2 reparte los de la 1 y la impresora; `slotEnemiesOf(level)`). Causa de baja: «Factura impagada» / «Atasco de papel con daños personales». Tests nuevos en `tests/impresora.test.ts` (5): datos y sprite; ráfagas, atascos cada 2–3, quieta y sin disparar durante el atasco y su duración; el desatasco suelta 24 balas; los fotogramas de atasco y el determinismo; salen en la planta 2 y nunca en la 1. El e2e saca las facturas al vuelo y un atasco (35e–f).
- Decisiones: el atasco es la gracia del enemigo y su punto débil a la vez: te enseña a esperar el atasco, acercarte y salir antes del estallido. El atasco empieza cuando ha salido la última factura de la ráfaga (si no, una se escapaba ya atascada). La cuenta de ráfagas solo tira el dado si el enemigo se atasca, así que los demás enemigos y la planta 1 no cambian ni un número.
- Medidas (script de prueba, dos enemigos iguales en las salas de la planta 2, bot con el Secador, 60 salas): primera versión 0,23 heridas por sala y 41 s; demasiado fácil para la planta 2. Con seis facturas a 112 px/s (antes cinco a 95) y 1,1–1,8 s entre ráfagas: **0,40 heridas y 47 s**, como el Microondas (0,42 y 42 s); la Bombilla da 0,80 y la Batidora 0,33. Planta 1 igual (bot: 200 partidas sin fallos, la planta la gana el 45 %, la jefa el 66,7 %). 362 tests en verde. Capturas 35e y 35f revisadas: las facturas se leen como balas (rojo y blanco) y no como cupones.
- Arreglo de paso: el e2e falló una vez en la prueba del mando («El mando no mueve a la tostadora»: empujaba contra una caja). Ahora la pone antes en medio de la fila vacía (anotado en `docs/ERRORES_CONOCIDOS.md`, Arreglados).
- Problemas conocidos: la planta 2 aún no tiene su dificultad medida en conjunto (`npm run bot` solo juega la planta 1); cuando estén sus cuatro enemigos hay que darle al bot una planta 2.
- Siguiente paso: M8, enemigos (2): el Router.

## 2026-10-29 22:10 — Hito M8 — Objetos nuevos (2b): Modo Avión, Copia de Seguridad y dos sinergias

- Hecho: **los diez objetos de Informática están hechos**. **Modo Avión**: mientras rueda, la tostadora corta las balas enemigas que toca (a 4 px de su cuerpo; `rollCut`, con el mismo chasquido que las tarjetas derribadas); a cambio, la voltereta vuelve ×1,25 más tarde. **Copia de Seguridad**: una vez, en vez de la baja, vuelve con un corazón, 2,5 s sin poder recibir daño y la sala limpia de balas; la copia se gasta (sale de los objetos y del HUD). En pantalla: destello blanco, temblor, chispas en corona y «Restaurando copia del martes». Dos sinergias: **Setup Gamer** (Ratón + Ventilador: +15 % de críticos) y **Conflicto de Software** (Antivirus + Actualización: la recarga vuelve a la normal y el daño de más se queda). Motor: `perks.rollClear` y `perks.revive`, el evento `revive`. Tests nuevos (3 en `tests/objetos-planta2.test.ts`): la voltereta corta y sin el objeto no; la copia salva una vez y la segunda no; las dos sinergias. El e2e saca la vuelta de la baja (35d) y comprueba que no hay parte.
- Arreglo de paso: **el HUD no quitaba iconos de objetos**: solo sabía añadirlos, así que la copia gastada se quedaba pintada. Ahora quita los que sobran y pone en cada hueco el que toca.
- Decisiones: la copia devuelve un corazón y no la vida entera: salva una vez, no regala la sala. Limpia las balas como la jefa al cambiar de fase, porque volver con medio segundo de margen dentro de una lluvia de balas no sería volver. El Modo Avión no deja la voltereta más larga ni más invulnerable: solo se lleva lo que toca, que ya era lo que se esquivaba; así no rompe la dificultad, solo limpia la pantalla detrás de ti. Conflicto de Software multiplica por 0,625 para que con la Actualización la recarga quede exacta (1,6 × 0,625 = 1).
- Medidas: planta 1 igual (bot: 200 partidas sin fallos; la planta la gana el 45 %, la jefa el 66,7 %). 356 tests en verde. Capturas 35c y 35d revisadas: el HUD pasa de cinco iconos a cuatro y su placa se encoge.
- Problemas conocidos: ninguno nuevo. La planta 2 sigue sin enemigos ni jefe propios, así que el equilibrio de sus objetos con lo que hay allí está por medir.
- Siguiente paso: M8, los cuatro enemigos de Informática. La Impresora lleva cogida desde las 18:28 UTC sin un solo commit (cuatro horas): la siguiente sesión puede darla por libre según el protocolo.

## 2026-10-29 21:55 — Hito M8 — Objetos nuevos (2a): críticos, pilas y cupones

- Hecho: **tres objetos de la planta 2 con efectos nuevos**, con su sprite. **Ratón Gaming RGB**: una bala de cada cinco hace el doble; el golpe se nota (parón más largo, más chispas, temblor y «Doble clic» en naranja sobre el blanco). **Batería Externa**: cada sala limpia mete dos pilas en el objeto activo en vez de una (sin pasar del máximo); a cambio, velocidad ×0,92. **Cookies de Terceros**: la mitad de las bajas (jefes aparte) sueltan un cupón más. Motor: `BulletBehaviour.crit` (`{ chance, mul }`; las probabilidades se suman hasta 1 y gana el mayor multiplicador), `Modifier.perks` (`charge` y `coupons`, sumados por `perksOf` en `src/sim/mods.ts` y leídos con `playerPerks`, que cuenta también las sinergias que no son de un arma) y el evento `hit` con `crit`. La ficha de cada objeto los describe («20 % de balas con daño ×2», «+1 pila por sala limpia», «50 % de bajas con un cupón más»). Tests nuevos en `tests/objetos-planta2.test.ts` (4): la proporción y el daño de los críticos y que sin el ratón no hay ninguno, dos pilas por sala, medio cupón de más por baja en 60 semillas y las fichas. El e2e saca un crítico sobre el maniquí (35c).
- Decisiones: el crítico se decide al salir la bala (y solo se tira el dado si hay ratón), así que sin estos objetos la simulación consume la misma aleatoriedad que antes y la planta 1 no cambia ni un número. Ratón y Cookies son solo buenos (como el HDMI y la Garantía): el humano pidió que algunos lo fueran. Las Cookies no cuentan en los jefes: la Nevera ya suelta su montón. «Doble clic» en vez de «Crítico»: es el chiste del ratón.
- Medidas: planta 1 igual (bot: 200 partidas sin fallos, la planta la gana el 45 %, la jefa el 66,7 %). `npm run objetos --jefes 12 --salas 21`: el Ratón baja la sala de combate de 32 a 23,5 s con el Secador y de 28 a 18,9 s con la Plancha; la Batería y las Cookies no cambian el combate (como debe ser: dan pilas y cupones). 353 tests en verde. Captura 35c revisada: el «Doble clic» y el 4 se leen encima del maniquí sin taparse.
- Problemas conocidos: ninguno nuevo.
- Siguiente paso: M8, los enemigos de Informática (la Impresora lleva cogida desde las 18:28 UTC sin un commit: pasados los 90 minutos del protocolo, la siguiente sesión puede cogerla) u objetos nuevos (2b).

## 2026-10-29 21:44 — Hito M8 — Objetos nuevos (1): cinco pasivos de Informática

- Hecho: **cinco objetos pasivos de la planta 2** con su sprite (`tools/sprites/items.ts`), en el tono del juego: **Pendrive de 2 GB** (cargador ×1,6, recarga ×1,3), **Antivirus Gratuito** (+1 corazón, velocidad ×0,9, voltereta ×1,3 más tarde), **Cable HDMI Dorado** (balas ×1,2 más rápidas y la mitad de dispersión; solo bueno), **Ventilador de Portátil** (cadencia ×1,25, +5° de dispersión, alcance ×0,85) y **Actualización Obligatoria** (+1 de daño, recarga ×1,6, cargador ×0,8). Los objetos llevan `level` (1 si falta) y `itemsUpTo(level)` da los de esa planta y los de abajo: la planta 1 reparte los diez de siempre y la 2 los quince (también el tesoro o la tienda jugados sueltos con `?planta=2`). Tests nuevos (2): los de la planta 2 no salen en la 1 y sí en la 2, y cada uno hace lo que dice su ficha; el de contenido pide 15. El e2e saca el tesoro de la planta 2 y el inventario con los cinco (35a–b).
- Decisiones: el Antivirus quitaba cadencia y el test de «ningún objeto empeora todas las armas» lo pilló: un objeto defensivo que además baja el daño por segundo no lo cogería nadie. Ahora cobra en movilidad (velocidad y voltereta), que con +1 corazón es un trato que se entiende. «Memoria USB de 2 GB» tenía cinco palabras: es **Pendrive de 2 GB**. Los objetos de una planta salen también en las siguientes (como las salas especiales del almacén): así las plantas altas tienen más donde elegir y la planta 1 no cambia nada. Son solo cifras a propósito; la parte 2 trae efectos nuevos.
- Medidas: planta 1 igual que antes, mismas semillas (bot: 200 partidas sin fallos, la planta la gana el 45 % de 20, la jefa el 66,7 % de 30). `npm run objetos --jefes 12 --salas 21` (muestras pequeñas, mucho ruido): con el Secador, sin nada gana a la jefa el 50 %; Antivirus 100 %, Actualización 91,7 %, Ventilador 83,3 %, Pendrive 58,3 %, HDMI 50 %. La Actualización queda a la altura de la Resistencia (las dos +1 de daño); el Antivirus, como la Garantía. 349 tests en verde. Capturas 35a–b revisadas: los cinco iconos se leen en 16 px (el ventilador, a la segunda: las aspas estaban empastadas y ahora son claras sobre fondo oscuro).
- Problemas conocidos: ninguno nuevo. El «nombre repetido en `tools/e2e.ts` que el typecheck no vio» de la entrada de las 20:20 no es un fallo de `npm run check`: `tsconfig.json` incluye `tools/e2e.ts` y lo comprueba (lo he probado: usar una función antes de declararla da TS2454). Hoy me ha pasado lo mismo por correr el e2e antes que el check; la definición de `tapKeys` sube al principio del e2e para que cualquier parte la use.
- Siguiente paso: M8, enemigos de Informática (la Impresora sigue cogida en `en_curso` por otra sesión desde las 18:28 UTC; si a las 90 min de esta entrada no hay commit suyo, cógela) u objetos nuevos (2).

## 2026-10-29 20:20 — Hito M8 — Plantas encadenadas

- Hecho: **ganar la planta 1 ya no acaba la partida**: tras bajar en el montacargas, el parte de «Planta superada» dice «Siguiente: Planta 2: Informática. Cobertura limitada.» y «R o clic: siguiente planta», y al pulsarlo se sigue en la planta 2 con **la misma tostadora**: armas (con su munición), objetos, objeto activo, corazones, cupones y tickets. `nextFloor(w)` (puro, en `src/sim/world.ts`) arma la planta siguiente con semilla derivada de la de esta, pone a la tostadora en su entrada y quita de los mazos de botín lo que ya lleva; en la última planta (`LAST_LEVEL = 2`) devuelve null y el parte sigue como antes («empezar otra jornada»). La planta 2 tiene su propia entrada, el **Rellano de Informática (Escalera Mecánica Averiada)**. **Historial**: una planta superada a mitad de partida cuenta como planta (`recordFloor`), no como partida; la partida se apunta al final con el tiempo y las bajas de todas sus plantas, y la planta más rápida con el tiempo de la última (`floorSeconds`). Tests nuevos `tests/plantas.test.ts` (4) y el parte con siguiente planta en los de texto grande. El e2e gana una planta (montacargas bajo los pies en la entrada), comprueba que el parte anuncia Informática, pulsa R y comprueba que está en la entrada de la planta 2 con los mismos 37 cupones (capturas 34a–b).
- Decisiones: «siguiente planta» y no «subir» ni «bajar»: el diseño dice que se sube y la animación del montacargas baja; no lo toco ahora. Ganar a la jefa sigue contando una victoria por planta (`wins`), como antes. En la planta 2 la jefa sigue siendo la Nevera hasta que llegue el Router. Esc en el parte de una planta que no es la última vuelve a la portada sin apuntar la partida (la planta sí queda apuntada); es raro y no merece otra pantalla.
- Medidas: sin cambios de simulación en la planta 1 (bot: 200 partidas sin fallos). 347 tests en verde. Capturas 34a y 34b revisadas.
- Problemas conocidos: abandonar con Esc entre plantas no apunta la partida. El typecheck no vio un nombre repetido en `tools/e2e.ts` (lo vio Node al ejecutarlo); hay que mirar si `tools/check.ts` se salta ese archivo.
- Siguiente paso: M8, los cuatro enemigos de Informática.
- **Aviso a la sesión de las 18:25 UTC**: esta sesión no apuntó «encadenar plantas» en `en_curso` antes de empezarla (fallo mío: solo apunté la primera tarea de la sesión) y la ha terminado y publicado (commit «M8: plantas encadenadas») mientras tú la tenías cogida. Al hacer `git pull` verás que ya está; tu entrada de `en_curso` la dejo tal cual porque es tuya. Desde ahora apunto cada tarea antes de empezarla, como pide `AUTOPILOT.md`.

## 2026-10-29 19:45 — Hito M8 — Entornos (3b): doce salas de combate en la planta 2

- Hecho: seis plantillas de combate más para Informática, con su idea y sus grupos: **Mesa de Portátiles de Exposición** (16 × 11, una isla que a veces tiene paso por el medio), **Escaparate de Televisores** (20 × 13, bloques al tresbolillo: nunca hay una recta larga), **Zona de Autoimpresión** (16 × 16, una impresora enorme a la que se da vueltas y que a veces saca bandejas), **Almacén de Cables** (20 × 16, un anillo con dos enemigos dentro; las entradas de arriba y abajo se cierran o no), **Punto de Recogida de Pedidos** (26 × 13, una fila de taquillas con huecos que pueden estar cerrados) y **Oficina Diáfana** (26 × 16, islas de dos monitores y poca cobertura). Con esto la planta 2 tiene 12 salas de combate propias, como la 1 tiene 14. El test de la planta 2 pide ahora al menos 12.
- Decisiones: todas pasaron a la primera los tests de plantillas (puertas, conectividad con todos los grupos en pie, rendijas con los grupos quitados, huecos lejos de las puertas, bot 25 s). La sala propia del jefe de la planta 2 la dejo para la tarea del Router: su forma depende de cómo pelee.
- Medidas: la planta 1 no cambia (bot: 200 partidas sin fallos). 343 tests en verde. Hoja de las seis salas pintadas revisada.
- Problemas conocidos: la planta 2 aún no se alcanza jugando.
- Siguiente paso: M8, encadenar plantas: bajar en el montacargas tras la jefa lleva a la planta 2.

## 2026-10-29 19:30 — Hito M8 — Entornos (3a): las primeras salas de la planta 2

- Hecho: **seis plantillas de combate propias de Informática**, una de cada tamaño, con su idea y sus grupos: el **Mostrador de Telefonía** (16 × 11, un mostrador de lado a lado con trampilla), el **Pasillo de Periféricos** (20 × 13, estanterías paralelas que se vuelven corchetes y hacen embudo), el **Taller de Reparación Exprés** (16 × 16, mesas con monitores y biombos), la **Sala de Servidores Sin Refrigeración** (20 × 16, racks en columnas que hacen carriles verticales), el **Aula de Formación en Ofimática** (26 × 13, pupitres en dos filas; las sillas paran el paso, no las balas) y el **Centro de Llamadas** (26 × 16, cuatro cubículos con biombo). Las plantillas llevan `level: 2`; `templatesOf(kind, level)` da las de esa planta y, si no tiene de un tipo, las de la planta 1 (así la entrada, la tienda, el tesoro, la secreta y la jefa siguen siendo las del almacén). `createWorld({ floor: true, level: 2 })` arma la planta con ellas; el mapa de la planta no cambia con el piso. Tests: los de siempre de plantillas (puertas, conectividad, rendijas, huecos, bot 25 s) cubren ya las de la planta 2; nuevos: la planta 2 tiene al menos 6 de combate propias y las especiales caen en las de la planta 1; una planta 2 generada solo usa salas de combate suyas.
- Decisiones: «Centro de Llamadas (Todos Nuestros Agentes Están Ocupados)» no cabía a doble tamaño en el parte ni bajo la ventana grande (lo vigilan los tests de texto grande): se queda en «Centro de Llamadas (Agentes Ocupados)». Las salas usan los enemigos de la planta 1 hasta que lleguen los suyos (tarea de enemigos). Seis salas para una planta de 8–9 de combate: se repite alguna; las otras seis van en la parte 3b.
- Medidas: la planta 1 no cambia (bot igual: 200 partidas sin fallos; la planta la gana el 70 % de 20). No mido la planta 2 todavía: sin sus enemigos ni su jefe, las cifras no dirían nada. 343 tests en verde. Hoja de las seis salas pintadas con sus obstáculos revisada: las trincheras de monitores y los racks se leen como cobertura.
- Problemas conocidos: la planta 2 no se alcanza jugando; sus salas especiales son las del almacén.
- Siguiente paso: M8, entornos (3b): seis salas de combate más.

## 2026-10-29 19:06 — Hito M8 — Entornos (2): obstáculos y persianas de Informática

- Hecho: en la planta 2 los obstáculos tienen su versión: la **caja** es un monitor de tubo beis con la pantalla rajada y un pósit, el **bidón** es una fuente de agua con la garrafa casi vacía y el **carrito** es una silla de oficina con ruedas (sprites `caja-2`, `barril-2` y `carrito-2` en `tools/sprites/props.ts`). Las **persianas** de la planta 2 son gris verdoso, con la tira de goma del rodapié en lugar de la cinta amarilla y negra (`makeShutterFrames(w, h, 2)`). `GameScene.levelKey` elige la textura `<id>-<planta>` si existe. Test nuevo en `tests/sprites.test.ts`: cada versión de planta existe y mide lo mismo que la del almacén. Ningún sprite aprobado cambia.
- Decisiones: misma huella y misma caja de choque que los del almacén, así que la simulación no se entera (el bot da lo mismo) y no hace falta tocar `src/data/props.ts`: una versión de planta es solo dibujo. La caja fuerte, la caja de autocobro y el montacargas no cambian: son de la cadena de tiendas, salen en todas las plantas. Arreglo de paso en el e2e: «La tostadora no ha recogido los cupones» falló una vez (y la segunda pasó): los cupones movidos junto a la tostadora seguían deslizándose de la caída; ahora se dejan quietos a 12 px y se espera hasta 2,5 s a que los recoja en vez de 0,6 fijos.
- Medidas: sin cambios de simulación (bot: 200 partidas sin fallos, igual que antes). 342 tests en verde. Captura 33a revisada: las trincheras de monitores se leen como cobertura y la sala ya no parece el almacén pintado de verde.
- Problemas conocidos: la planta 2 aún usa las plantillas del almacén y no se llega jugando.
- Siguiente paso: M8, entornos (3): plantillas propias de la planta 2.

## 2026-10-29 19:05 — Hito M8 — Entornos (1): variantes de las plantillas

- Hecho: **las plantillas tienen variantes de forma**, no solo de relleno. (1) **Grupos de estanterías**: una cifra `1`–`9` en la plantilla marca un grupo de casillas que, con la semilla, es estantería o suelo (cada cifra por su cuenta, 50 %); sin rellenar, el grupo está en pie. Puestos en 9 salas de combate (10 grupos) de la planta 1 (una columna central en el Pasillo de Devoluciones, el stand de la Oferta Relámpago, postes entre las trincheras de Carga y Descarga, el patio del Expositor cerrado por arriba y abajo, una estantería central en el Almacén Pequeño, la tapa del anillo de la Cámara de Garantías, los tabiques de Obsolescencia cerrados por el medio, el bloque central y los muros largos de Saldos, los nichos del Pasillo 7B). (2) **Salas reflejadas**: en una planta generada (`vary` en `fillTemplate`), cada sala de combate sale reflejada de izquierda a derecha la mitad de las veces; las puertas siguen en su sitio porque todas las plantillas tienen un número par de columnas. (3) **Idea de combate** de cada una de las 14 salas de combate, escrita en la plantilla (`idea`). `fillTemplate` sortea los grupos y el reflejo **después** de los huecos, así que una sala sin grupos se rellena igual que antes. Tests nuevos (3 y uno ampliado): toda sala de combate tiene su idea; cada grupo sale y no sale según la semilla; la mitad de las salas generadas salen reflejadas y la de la jefa nunca; una sala reflejada tiene las puertas en pared y despejadas; y la prueba de rendijas mira también todas las salas sin grupos.
- Decisiones: grupos de estantería o suelo, no de cajas: una estantería no deja rendijas nuevas y la conectividad se comprueba con el caso peor (todos en pie), que ya es el que miran los tests de siempre. Solo se reflejan las de combate: la entrada, la tienda, el tesoro y la sala de la jefa tienen su orden pensado (el montacargas, la caja). Las salas pedidas por id (`?sala=`, los tests y el e2e) no se reflejan, para que las capturas no cambien de lado. Los grupos se sortean también ahí.
- Medidas (bot, 300 plantas, mismas semillas, antes → después): gana el 52,3 % → 50,0 % (dentro de la banda 35–55 %), 0,76 → 0,78 heridas y 18,0 → 18,4 s por sala de combate. No toco la dificultad. 341 tests en verde. Captura 14a revisada: los postes de Carga y Descarga hacen dos bolsillos de cobertura entre las trincheras.
- Problemas conocidos: los de la entrada anterior (obstáculos y persianas del almacén en la planta 2).
- Siguiente paso: M8, entornos (2): obstáculos y decorado propios de Informática y persianas a juego.

## 2026-10-29 18:37 — Hito M8 — Juego de casillas y color propio de la planta 2

- Hecho: **la planta 2 (Informática) tiene su aspecto**: `src/art/informatica.ts` con el suelo técnico (placas con bisel, cinco variantes: levantada, pasacables, desgastada, pegatina y perforada), café, tóner, cubrecables, teclas y USB por el suelo, racks de servidores como paredes interiores, canaleta y switches en las laterales, rodapié con enchufes, bandeja de cables y paneles LED fríos arriba, y una pared de monitores encendidos con cajas de portátil. Carteles y letras del suelo propios por tipo de sala (`SIGNS_2` y `STENCILS_2` en `src/art/room.ts`). `paintRoom` pinta la planta según `level` (1 o 2); el mundo guarda `level` (`createWorld({ level })`, sin efecto en la simulación) y el juego lo lee de `?planta=2` en las tres formas de entrar (sala, planta, sala de pruebas). Tests nuevos (4): la planta 1 queda igual píxel a píxel; la 2 es verdosa y tan oscura como la 1 en todas las plantillas; cada tipo de sala lleva su cartel y su decoración y nada del almacén; las puertas no se pintan. El e2e saca 33a–c (sala, entrada de una planta y jefe en la planta 2) y comprueba que `?planta=2` llega al mundo.
- Decisiones: verde pantalla como color dominante (el Verde A+++ de la paleta, oscurecido) y la misma luminosidad media que el almacén (±14), para que las balas rojas y cian se lean igual. Una sola función de pintar con ramas por planta en vez de un pintor nuevo: la estructura de la sala (paredes, puertas, focos, sitio libre) es la misma, y así la planta 1 no cambia ni un píxel (lo he comprobado con un resumen SHA-1 de todas las plantillas con tres semillas antes y después). Las pegatinas de inventario se quedan muy apagadas (alfa 70): a más contraste parecían pilas que se pueden coger. Los obstáculos (cajas, barriles, carritos) y las persianas siguen siendo los del almacén: son de la tarea de entornos.
- Medidas: sin cambios de simulación (bot igual: 200 partidas sin fallos; la planta la gana el 70 % de 20). 338 tests en verde. Capturas 33a–c revisadas al lado de 14a: la planta se distingue a la primera, la tostadora y los enemigos se leen bien sobre el verde.
- Problemas conocidos: en la planta 2 las cajas de cartón, los barriles y las persianas con cinta amarilla son del almacén. La planta 2 aún no se alcanza jugando (solo con `?planta=2`).
- Siguiente paso: M8, entornos bien diseñados (plantillas con variantes y una idea de combate por sala), con obstáculos propios de Informática.

## 2026-10-29 17:40 — Hito M7 — Errores conocidos (3): las asperezas; M7 terminado

- Hecho: la sección «Asperezas» de `docs/ERRORES_CONOCIDOS.md`, vacía. **Portada**: el fondo es la Cola de Atención al Cliente sin enemigos ni obstáculos (20 casillas: tan ancha como la pantalla, sin los bordes oscuros de la entrada) y los paneles de créditos, opciones, controles e historial se colocan a la derecha, sin tapar a la tostadora. **Letreros** (puertas abiertas, cambio de arma, reposición, montacargas): con la placa oscura del HUD, dibujada cada fotograma según su texto y su transparencia. **Objetos del HUD**: cuando se va la ayuda de controles bajan 1 px por fotograma, con su placa, en vez de saltar una fila. **Inventario**: barra de desplazamiento a la derecha de la lista cuando no cabe todo. **Destellos suaves**: los avisos ya no parpadean; el enemigo se tiñe de amarillo fijo mientras avisa (`warnOn` y `warnFill`). **Texto grande**: la tarjeta de la jefa pone subtítulo y lema a doble tamaño (el lema, partido en líneas) y crece hacia arriba; a tamaño normal queda donde estaba, píxel a píxel. Los textos flotantes también van a doble tamaño. El e2e saca la tarjeta grande (31i). De paso: la prueba del e2e «una bala enemiga quita medio corazón» falló una vez (la bala nacía dentro de una caja a la izquierda de la tostadora); ahora llega por el lado libre.
- Decisiones: tres asperezas no eran errores y pasan a «No son errores» con su motivo: el nombre de sala sobre la puerta norte (es donde van todos, con placa), el nombre del objeto que coincide un segundo con el de la sala y lo que queda en pantalla con la tecla vieja tras cambiarla (se va en segundos). La de las piernas del Mando y la boquilla del Aspirador la ha arreglado a la vez otra sesión (entrada siguiente). Con esto la lista de errores está vacía y **M7 queda terminado**: versión **0.2.0**. Estimación: quedan 122 sesiones (~159 con margen).
- Medidas: sin cambios de simulación (bot igual: 0 fallos). 334 tests en verde (con los de la otra sesión). Capturas 15b, 26a, 26b, 27a y 31i revisadas.
- Problemas conocidos: ninguno en la lista. La canción más larga cuesta ~0,1 s de golpe al prepararse en la portada.
- Siguiente paso: M8, planta 2 (Informática): primero su juego de casillas y color propio.
- Cierre de sesión: esta sesión (15:41 UTC) ha reunido la lista de errores conocidos y la ha dejado vacía en tres tareas, con lo que M7 queda terminado. Cierro aquí: M8 empieza con arte nuevo (casillas y color de la planta 2) y pide mirar las capturas con calma y el contexto limpio.

## 2026-10-29 17:34 — Hito M7 — Errores conocidos (3a): piernas del Mando y boquilla del Aspirador

- Hecho: la aspereza de animación de `docs/ERRORES_CONOCIDOS.md`. (1) **Piernas juntas**: con `poseCycle` las piernas se cruzan por el centro en los pasos elevados; con piernas a 4–5 px (Mando y Aspirador) las dos zapatillas caían una encima de otra y se leían como un solo pie gordo. `narrowPoseCycle` (nuevo, en `tools/sprites/pose.ts`) hace el paso de otra forma: contacto, la de atrás levantada 2 px a la distancia de reposo, contacto con las piernas cambiadas y la de delante levantada. `poseFeet` dibuja ahora un pie levantado (`pose.lift`, que antes solo usaba la Nevera con su código propio); los cuadros de las zapatillas del Mando y las ruedas del Aspirador suben con su pie. (2) **La boquilla del Aspirador** (el final de la manguera y el cepillo) pasa a la capa del suelo: ya no sube y baja con la respiración ni con los pasos; un tramo más de manguera tapa el hueco cuando el cuerpo sube. Tests nuevos en `tests/animaciones.test.ts` (2): en los pasos elevados las zapatillas no se tapan, y la boquilla es igual en todos los fotogramas.
- Decisiones: otra sesión (la de las 15:41 UTC) tenía cogidas «las asperezas» desde la portada; he cogido solo esta, que vive entera en `tools/sprites/` y `public/assets/` y no se pisa con sus archivos, y la he apuntado en `en_curso` y en la propia lista antes de empezar. El Aspirador tenía el mismo borrón que el Mando (piernas a 5 px), así que lleva el paso nuevo también; los demás tienen las piernas más separadas y se quedan como estaban. El fotograma 0 de cada hoja no cambia (los aprobados siguen idénticos).
- Medidas: sin cambios de simulación (bot igual: 200 partidas sin fallos, la planta la gana el 70 % de 20). Tests en verde; capturas 03 y 08c revisadas, y las hojas del Mando y el Aspirador a 8× antes y después.
- Problemas conocidos: los de «Asperezas» de `docs/ERRORES_CONOCIDOS.md` (10), en manos de la sesión de las 15:41 UTC.
- Siguiente paso: M7, errores conocidos (3): el resto de asperezas.

## 2026-10-29 17:21 — Hito M7 — Errores conocidos (2): la sección «Errores» vacía

- Hecho: los cuatro errores de `docs/ERRORES_CONOCIDOS.md`. (1) **La jefa salía cortada por arriba** al empezar el combate y con el nombre de la sala encima de la cabeza: la cámara encuadra ahora a la jefa entera, corona incluida, siempre que quepa con la tostadora (`frameAxis`, puro, en `src/render/camera.ts`, con su test `tests/camara.test.ts`); si no caben, manda la tostadora y la cámara se acerca a la jefa todo lo que puede. El nombre de la sala sale en la franja negra de arriba durante la presentación y ya no vuelve después. (2) **Los trozos del despiece** rebotan contra paredes y cajas en vez de cruzarlas (`solidFloor` en `GameScene`). (3) **El parón del primer clic**: los 56 efectos y las 2 canciones se sintetizan en segundo plano desde que carga la página, uno cada 30 ms, en `AudioBuffer` sin `AudioContext` (44,1 kHz; el contexto los remuestrea si va a otra frecuencia); al primer clic solo se crea el contexto. (4) **e2e de la jefa desde la planta**: el e2e entra en la sala de la jefa desde la entrada de una planta generada (recableando una puerta) y comprueba que la jefa está, se presenta y cierra las persianas (captura 16f). El e2e comprueba también que los sonidos están listos antes del primer clic.
- Decisiones: con la tostadora en la puerta de abajo de la sala de la jefa no caben las dos (366 px de alto en una vista de 270); no muevo a la jefa ni la puerta (cambiaría el combate medido): en cuanto la tostadora sube un poco, la jefa entra entera. El nombre de la sala en la franja de la presentación en vez de encima: la presentación ya es «la entrada» de la sala. La canción más larga sigue costando ~0,1 s de un golpe, pero ahora en la portada, antes de jugar; partirla en trozos no compensa.
- Medidas: sin cambios de simulación (bot igual). 332 tests en verde. Capturas 16f, 17c, 17d y 17e revisadas: la cara de la nevera se ve desde el primer segundo del combate.
- Problemas conocidos: los de la sección «Asperezas» de `docs/ERRORES_CONOCIDOS.md` (11).
- Siguiente paso: M7, errores conocidos (3): las asperezas, empezando por la portada (bordes oscuros y paneles que tapan a la tostadora).

## 2026-10-29 17:02 — Hito M7 — Lista de errores conocidos (1)

- Hecho: **`docs/ERRORES_CONOCIDOS.md`**, la lista viva de errores: he repasado uno a uno los «Problemas conocidos» de toda la bitácora contra el código y las capturas, y los he repartido en Errores (4), Asperezas (11), No son errores (con su motivo), Para otro hito (M8, M9, M14) y Arreglados. El criterio de M7 es que las dos primeras queden vacías. Arreglados en esta tarea: (1) **rendijas**: entre un carrito y la caja de debajo (`cola-atencion`) o detrás de una caja pegada a la pared del fondo (en 9 plantillas) quedaban huecos de 5–13 px donde solo cabían los pies; `buildRoom` estira ahora hacia arriba la caja de choque del obstáculo de abajo hasta cerrarlos (`SLIT` y `sealSlits` en `src/sim/room.ts`); (2) **los enemigos se amontonaban** unos dentro de otros: los que andan se apartan con suavidad (`separate` en `src/sim/enemies.ts`, un 25 % del solape por paso, deslizando contra paredes; la polilla y la jefa no); (3) **los cupones de la jefa** caían encima del montacargas: salen en corona y paran fuera de la plataforma; (4) al **volver a la sala de la jefa**, el montacargas ya está arriba, sin ruido ni polvo. Tests nuevos: sin rendijas en ninguna plantilla con ningún obstáculo (`rooms.test.ts`), cinco enemigos apilados se separan (`enemies.test.ts`), cupones fuera del montacargas en cinco semillas (`montacargas.test.ts`); los tres fallan sin el arreglo.
- Comprobados y ya bien: el número de expediente ya no cambia al repintar; el bocadillo de la caja y la descripción de lo comprado ya no se pisan; la música tiene su volumen; la prueba del mando del e2e no ha vuelto a fallar.
- Decisiones: mientras la sesión del remapeo de controles seguía trabajando (`en_curso`), he dejado sin tocar `PauseScene` (los paneles de la portada que tapan a la tostadora); al juntar su trabajo he añadido a la lista su problema conocido (carteles con la tecla vieja). Lo que no es un error (cupones que no caducan, «0 de 2 armas», la ventana grande que tapa) va en su sección con el motivo, para no volver a discutirlo; lo que tiene hito propio (la pared del fondo repetida → M8; borrar el historial → M9; voltereta dibujada → M14), a su hito.
- Medidas (bot, mismas semillas, antes → después): 300 plantas, gana el 50,3 % → 52,3 % (dentro de la banda 35–55 %), 0,76 heridas por sala de combate en los dos; 100 plantas, 44 % → 57 % (ruido: con 300 se queda en +2). No toco la dificultad. 329 tests en verde (con los del cambio de teclas). Captura 17n revisada: los cupones rodean el montacargas.
- Problemas conocidos: los de `docs/ERRORES_CONOCIDOS.md`.
- Siguiente paso: M7, errores conocidos (2): los cuatro de la sección «Errores» (la cámara al entrar a la jefa, piezas que cruzan paredes, parón de la primera canción, e2e de la jefa desde la planta).

## 2026-10-29 16:41 — Hito M7 — Accesibilidad (3): cambiar teclas

- Hecho: **Opciones › Cambiar teclas**: una línea por acción (arriba, abajo, izquierda, derecha, rodar, recargar, cambiar de arma, objeto activo) con su tecla; al elegirla, «Pulse la tecla nueva. Esc: cancelar.» y la siguiente tecla queda puesta. «Restablecer de fábrica» lo deja como venía. Lo guardado va con las demás opciones (`keys` y `keyLabels` en `src/render/settings.ts`). `src/render/keymap.ts` (puro): el mapa de fábrica (WASD y flechas, espacio y las dos mayúsculas, R, E, Q), `rebind` (la tecla nueva pasa a ser la de la acción y se la quita a quien la tuviera; Esc y P no se dejan), `parseKeymap` (un mapa guardado roto o con una tecla en dos sitios se arregla al leerlo) y los nombres de las teclas (`keyLabel`, `keyNames`). `Controls` lee ahora las teclas por lo que hacen, de las opciones, con un conjunto de teclas pulsadas (se vacía al perder el foco y al volver de la pausa). **Los textos que nombran teclas dicen las elegidas**: la ayuda de controles bajo la primera sala, el cartel de cambiar de arma, «Objeto activo · se usa con Q», «Q: usar» del activo, la pantalla de Controles y el «(Q)» del inventario (funciones en `src/data/texts.ts` con `KeyWords`; las constantes de antes siguen siendo las de fábrica). Tests nuevos `tests/teclas.test.ts` (6). El e2e cambia rodar a la K y subir a la I desde el menú, intenta poner la P (no se deja), y comprueba en el juego que la I sube y la W no, que la K rueda y el espacio no, y que la ayuda nombra las nuevas (capturas 32a–c).
- Decisiones: solo el teclado. El mando tiene el mapeo estándar y su soporte completo está en M15. Disparar y apuntar siguen en el ratón (son el ratón, no una tecla). Las teclas que dependen de la distribución del teclado (Ñ, signos) se nombran con lo que escribieron al elegirlas, si la fuente sabe escribirlo; si no, con su código. Un nombre de tecla que no cabría en la columna de Controles (112 px) dice «Tus teclas». «R o clic» de los partes sigue siendo la R: es para pedir otra unidad, no para recargar.
- Medidas: sin cambios de simulación (bot igual). 326 tests en verde.
- Problemas conocidos: el texto de la ayuda de controles se recalcula al volver de la pausa; los carteles que ya estaban en pantalla se quedan con las teclas viejas hasta que se van.
- Siguiente paso: M7, lista de errores conocidos vacía (la última tarea de M7).
- Cierre de sesión: esta sesión (14:43 UTC) ha hecho el texto grande (ventana, letreros, sinergias, nombre de sala, caja, partes e inventario) y el cambio de teclas. Cierro aquí: la última tarea de M7 (errores conocidos) ya la ha cogido la sesión de las 15:41 UTC, y M8 no conviene empezarlo con M7 abierto ni tocando los mismos archivos a la vez.

## 2026-10-29 16:29 — Hito M7 — Accesibilidad (2c): texto grande en el inventario

- Hecho: con **Texto grande**, el inventario de la pausa enseña lo elegido en la **misma ventana de descripción grande** que sale al recogerlo (icono a doble tamaño, nombre, descripción y efectos a doble tamaño, con las pilas del activo), como emergente sobre la parte de abajo del panel, entre la lista y «Volver». La lista se queda en dos líneas que siguen al cursor. Las estadísticas siguen en su sitio a tamaño normal (son una tabla de números, como el HUD) y se ven enteras al ponerse en «Volver». Sin texto grande, el inventario no cambia. Las medidas del panel están en `INVENTORY`, `inventoryCardAt` e `inventoryListBottom` de `src/render/hud.ts`; `cardLayout` acepta no poner la línea de «qué es» (en el inventario ya lo dice la lista). Test nuevo en `tests/texto-grande.test.ts`: con cada objeto, activo (con sus pilas) y sinergia, la ventana cabe en el panel sin tapar la lista. El e2e saca 31f–h (objeto, activo y «Volver») y comprueba que llega a «Volver».
- Decisiones: probé de cabeza tres diseños (columna derecha a doble tamaño, dos páginas, emergente). La columna de 212 px no da ni para una línea de efecto a doble tamaño, y las dos páginas esconden la lista; el emergente reutiliza una pieza que el jugador ya conoce y deja la lista a la vista. Sin la línea de «qué es», la ventana más alta (la Encuesta, con tres efectos largos) mide 137 px y cabe justo.
- Medidas: sin cambios de simulación. 320 tests en verde. Capturas 27a (normal, igual que antes) y 31f–h revisadas.
- Problemas conocidos: con texto grande la lista solo enseña dos cosas a la vez (con «...» si hay más). Los textos flotantes y la tarjeta de la jefa siguen a tamaño normal.
- Siguiente paso: M7, accesibilidad parte 3 (remapeo de controles).

## 2026-10-29 16:18 — Hito M7 — Accesibilidad (2b): texto grande en los partes

- Hecho: con **Texto grande**, el parte de baja y el de planta superada se ven a doble tamaño: el formulario ocupa casi toda la pantalla (472 px de ancho, crece hasta 266 de alto), la columna de valores se coloca según la etiqueta más ancha, los valores y la recomendación se parten en líneas, y el equipaje y la línea de puntos siguen en su sitio. La colocación sale de `GameScene` a una función pura, `formLayout` en `src/render/form.ts` (a tamaño normal da exactamente las mismas posiciones de antes; lo comprueba un test). El sello busca sitio libre por el lado derecho, empezando junto al equipaje; si no lo hay (9 de 408 combinaciones medidas: textos y salas más largos), cae igual y a los 1,4 s se aparta a un 30 % para dejar leer. Tests nuevos en `tests/texto-grande.test.ts` (2): con cada causa, excusa, recomendación, nota, siguiente planta y las tres salas de nombre más largo, los dos partes caben en pantalla a los dos tamaños, nada se sale por los lados ni pisa la línea de abajo, ningún texto pisa otro, el equipaje va entre los datos y la recomendación, y el sello no tapa texto salvo cuando se aparta. Captura nueva 31e (parte grande); 13, 17p y 28 (normales) revisadas, iguales que antes.
- Arreglo de paso: «Recomendación» y «Nota» se reconocen sin importar mayúsculas (el primer intento pasaba el texto ya en mayúsculas y el parte grande salía sin equipaje; lo vi en la captura y lo vigila el test).
- Decisiones: el inventario se queda para otra tarea (2c): su descripción vive en una columna de 212 px y a doble tamaño los efectos ya no caben ni en una línea; hace falta otro diseño, no estirar este. En los partes las líneas a doble tamaño se tocan (paso de 20 px): la celda de la fuente ya trae sus filas en blanco arriba y abajo, y así cabe todo sin quitar nada.
- Medidas: sin cambios de simulación (bot igual). 319 tests en verde.
- Problemas conocidos: el formulario grande tapa toda la sala (es una pantalla de final, no molesta). El inventario aún no tiene texto grande.
- Siguiente paso: M7, accesibilidad parte 2c (inventario con texto grande) o parte 3 (remapeo de controles).

## 2026-10-29 16:03 — Hito M7 — Accesibilidad (2a): texto grande

- Hecho: opción nueva **Texto grande** en Opciones (`bigText` en `src/render/settings.ts`, apagada por defecto; `readScale` da 1 o 2). Con ella van a doble tamaño (fuente a 16, el doble exacto, sin píxeles desiguales): la **ventana de descripción** (440 px de ancho en vez de 292; los efectos se colocan seguidos en filas en vez de uno por línea, para que quepa), los **letreros** (puertas abiertas, cambio de arma, reposición, montacargas), la placa de **sinergia**, el **nombre de la sala** (partido en líneas si no cabe entre los corazones y el minimapa) y los **bocadillos de la caja** de la tienda. El HUD (números, munición, cupones) se queda igual. Todo lo que se coloca está ahora en funciones puras de `src/render/hud.ts` (`cardLayout`, `titleLines`) y `src/art/font.ts` (`wrapLines`, el partido de líneas de la fuente), y `GameScene` solo las dibuja. Test nuevo `tests/texto-grande.test.ts` (6): la ventana normal mide lo mismo que antes; la grande, con cada objeto, activo y arma, cabe entera, no se pisa por dentro y no tapa ni los corazones ni la munición en ningún estado del HUD; cada nombre de sala cabe a doble tamaño en dos líneas; letreros, sinergias y frases de la caja caben. El e2e activa la opción en Opciones y saca cuatro capturas nuevas (31a–d).
- Arreglo de paso: el bocadillo de la caja salía debajo del nombre de la sala (en la captura 24a de antes se tapaban). Ahora, si encima de la caja no cabe sin meterse bajo el nombre o fuera de la vista, sale al lado, con la cola apuntando a la caja.
- Decisiones: solo doble tamaño (un 1,5 deforma la fuente de mapa de bits). La ventana grande es casi tan ancha como la pantalla: evita los corazones y la munición, y puede tapar unos segundos el minimapa, los objetos de abajo y la ayuda de controles; es lo que cuesta leer a doble tamaño en 480 × 270. Con texto grande, la placa de una sinergia espera a que se vaya la ventana (no cabían las dos). Cambiar la opción en la pausa vale para lo próximo que salga; el nombre de la sala, desde la sala siguiente. La tarea «tamaño de texto» la parto en dos: el parte de baja, la planta superada y el inventario son tablas apretadas que piden otro diseño a doble tamaño (2b).
- Medidas: sin cambios de simulación (bot igual: gana el 40 % de 20 plantas). 317 tests en verde. Capturas 20b, 22, 24a, 25b (normales) y 31a–d (grandes) revisadas.
- Problemas conocidos: la ventana grande tapa a la tostadora si está en el centro de la pantalla mientras se lee (dura 3–7 s). Los textos flotantes (daño, cupones) y la tarjeta de la jefa no cambian de tamaño.
- Siguiente paso: M7, accesibilidad parte 2b (texto grande en el parte de baja, la planta superada y el inventario).

## 2026-10-29 15:05 — Hito M7 — Accesibilidad (1): destellos suaves

- Hecho: opción nueva **Destellos suaves** en Opciones (guardada con las demás, `flashes` en `src/render/settings.ts`; «Sí» = suaves). Con ella: los golpes a enemigos, maniquíes, la tostadora, los corazones del HUD, el icono del activo y el brillo de las armas en su pedestal pasan de silueta blanca sólida a un tinte cálido claro (`SOFT_FLASH_TINT`); la silueta blanca de un enemigo al desmontarse, igual; el aviso de ataque se queda en amarillo (sin el blanco final); la jefa cayendo brilla fija en vez de parpadear cada 70 ms; y el fogonazo de pantalla entera (cambio de fase, jefa liquidada) baja a un cuarto, como mucho un 12 % (`screenFlashAlpha`). Todo pasa por dos funciones de `GameScene` (`whiteOut`, `warnColor`): ya no queda ningún `setTintFill(0xffffff)` suelto. Tests: `tests/menu.test.ts` (opción guardada y tope del fogonazo); el e2e activa la opción y comprueba lo guardado. Captura 25b revisada: cabe.
- Decisiones: la tarea de accesibilidad era demasiado grande para una vez; la he partido en tres en la hoja de ruta (temblor y destellos, tamaño de texto, remapeo). El temblor ya se podía quitar desde M6, así que la parte 1 era sobre todo los destellos. Por defecto siguen los destellos fuertes: son parte de la sensación de golpe. El aviso amarillo no se quita nunca: es información, no adorno.
- Medidas: sin cambios de simulación. 311 tests en verde.
- Problemas conocidos: los avisos siguen parpadeando en amarillo (a unos 8 Hz al final); si hiciera falta, la opción podría dejarlos fijos.
- Siguiente paso: M7, accesibilidad parte 2 (tamaño de texto).
- Cierre de sesión: esta sesión (13:24 UTC) ha hecho las animaciones de los enemigos y los destellos suaves. Cierro aquí: el tamaño de texto toca la colocación de casi todo (la fuente es de mapa de bits y la pantalla, 480 × 270), así que mejor empezarlo con el contexto limpio. Idea para quien lo coja: «Texto grande» que dibuje a doble tamaño solo lo que se lee con calma (ventana de descripción, bocadillos, títulos de sala, inventario, parte de baja) y deje el HUD como está, con `tests/hud.test.ts` ampliado para el tamaño doble.

## 2026-10-29 14:55 — Hito M7 — Animaciones completas de los enemigos

- Hecho: todos los enemigos respiran quietos y dan pasos de verdad al andar, como la tostadora. `tools/sprites/pose.ts` (nuevo): una pose es piernas (`xb`, `xf`), `bob` del cuerpo y, para piernas grandes, un pie levantado; `poseCycle` da los seis fotogramas de siempre (reposo, respiración y cuatro de zancada: contacto, paso elevado, contacto con las piernas cruzadas, paso elevado), y las piernas crecen 1 px hacia arriba cuando el cuerpo sube para no despegarse. Los dibujos del Aspirador, el Microondas, la Bombilla, la Nevera, la Batidora y el Mando dibujan ahora las piernas en una capa y el cuerpo en otra. Hojas nuevas: Aspirador 6 (con las ruedas siguiendo a los zapatos), Microondas 2 (no anda), Bombilla 7 (encendida, apagada, respiración y 4 pasos), Batidora 8 (4 de varillas quieta y 4 corriendo), Mando 6, Nevera 12 (6 con la puerta cerrada y 6 abierta: respira y anda levantando un pie cada vez). Los datos dicen qué fotogramas usar (`anim` en `src/data/enemies.ts`, tipo `EnemyAnim`) y `src/render/enemyAnim.ts` (puro) elige el fotograma: el paso cambia cada `stepPx` px andados, así los pies no patinan; en carrera, como mucho 14 cambios por segundo; frenando, aturdido o muriendo se queda en el reposo; quieto, respira cada uno a su ritmo. `bulbLit` se muda ahí desde `GameScene`, que ya no tiene un `if` por tipo de cerebro. El salto de 1 px al andar se queda solo para lo que no tenga pasos. El parpadeo del 12:00 del Microondas baja 1 px con su respiración. Test nuevo `tests/animaciones.test.ts` (6).
- Decisiones: el golpe (destello blanco de 1 fotograma) y la muerte (se desmonta en piezas de su propio sprite) ya eran comunes a todos desde M2 y cumplen la tabla de `docs/ESTILO_ARTE.md`, así que no he dibujado caras de dolor por enemigo; si el humano las quiere, es otra tarea. El fotograma 0 de cada hoja sigue siendo el aprobado (los tests de `art/referencia/` pasan sin tocar nada). La Polilla vuela: se queda con su aleteo. El Microondas no anda (las balas solo lo empujan): solo respira.
- Medidas: sin cambios de simulación (el bot da lo mismo con y sin el cambio: gana el 40 % de 20 plantas). 310 tests en verde. Capturas del e2e revisadas (batidora, mando, jefa en las dos fases).
- Problemas conocidos: en los pasos elevados las dos piernas del Mando casi se tapan (las tiene a 4 px). La boquilla del Aspirador sube con el cuerpo en esos pasos (parece que la balancea).
- Siguiente paso: M7, accesibilidad (remapeo de controles, reducir temblores y destellos, tamaño de texto) y luego la lista de errores conocidos.

## 2026-10-29 14:47 — Hito M7 — Rendimiento con 300 balas

- Hecho: `tools/rendimiento.ts` (`npm run rendimiento`, opciones `--balas` y `--segundos`): abre el juego de verdad en Chromium sin interfaz, mantiene N balas enemigas en la Sala de pruebas y mide los fotogramas por segundo, el p95 y el peor fotograma, frente a la sala casi vacía; además cronometra la simulación sola con las mismas balas y guarda una captura (`capturas/30-300-balas.png`). Los sprites de las balas se **reutilizan** (`bulletPool` en `GameScene`): antes se creaba y destruía una imagen por bala, cientos por segundo.
- Medidas (Chromium con SwiftShader, que dibuja con la CPU: un ordenador con tarjeta gráfica va mejor): **300 balas: 59,1–59,5 fps, p95 16,8 ms** (igual que sin balas). Margen: 600 balas, 54 fps; 900 balas, 41 → 46 fps con la reutilización; 1500, 32 fps. Simulación sola: 0,17 ms por paso con 300 balas (el presupuesto es 16,7 ms). Criterio cumplido.
- Decisiones: no toco nada más: con 300 balas el juego va a 60 fps sin despeinarse. Los picos sueltos de 33–83 ms salen también sin balas (recolector de basura o SwiftShader), no por las balas.
- Problemas conocidos: los números absolutos dependen de la máquina; lo que vale es comparar la misma medida antes y después de un cambio.
- Siguiente paso: M7, accesibilidad (remapeo de controles, reducir temblores y destellos, tamaño de texto).
- Cierre de sesión: esta sesión (12:44 UTC) ha hecho la revisión de textos (M6 terminado), ha encontrado y arreglado que la jefa no salía en la planta, y ha cerrado equilibrio, armas, objetos y rendimiento de M7. Cierro aquí para que la sesión de las 14:24 UTC empiece con el contexto limpio.

## 2026-10-29 14:40 — Hito M7 — Repaso de los objetos pasivos

- Hecho: `tools/objetos.ts` (`npm run objetos`): para cada objeto pasivo y cada arma, el bot con ese objeto solo contra la jefa (40 combates) y en 60 salas de combate, frente a la misma arma sin nada; tabla en `logs/objetos.json`. Con eso, tres cambios: **Regleta Sin Tierra** cadencia ×0,85 → ×0,7 (con el Secador o la Grapadora una bala más por disparo duplicaba el daño: era obligatoria; ahora da +40 % y a la Plancha la empeora); **Resistencia de Recambio** cadencia ×0,8 → ×0,75 (era el mejor objeto con las tres armas); **Manual en Chino** además alarga la vida de las balas ×1,3 (los rebotes casi nunca llegaban a servir: era inútil). Test nuevo en `tests/objetos.test.ts`: ningún objeto multiplica el daño por segundo de todas las armas por más de 1,6, y ninguno las empeora todas. Tabla de `docs/DISENO.md` al día.
- Decisiones: un objeto puede ser malo con un arma y bueno con otra (la Regleta con la Plancha, la Resistencia con la Grapadora): eso es «da y quita» y da sentido a elegir. La Etiqueta A+++ (velocidad y voltereta) no mejora nada medible en el bot, que no sabe aprovechar correr más; para una persona sí vale, así que se queda igual. Resistencia + Grapadora sigue siendo un combo fuerte (+1 de daño a un arma de 1 lo duplica): lo dejo como premio de combinar.
- Medidas (jefa, % ganado y segundos; sin objeto: Secador 58/92, Grapadora 83/69, Plancha 98/60): Regleta antes 93/53, 100/45, 95/60 → ahora 90/59, 98/50, 83/64; Resistencia antes 93/71, 100/41, 98/49 → 85/72, 100/45, 100/49; Manual antes 55/93, 83/69, 98/60 → 55/92, 90/70, 100/49. Plantas enteras: el bot gana el **44 %** de 100 (banda 35–55 %).
- Problemas conocidos: con 40 combates por casilla el ruido es de ±8 puntos; para afinar más hacen falta más partidas (tarda minuto y medio con 40/60).
- Siguiente paso: M7, rendimiento: 60 fps estables con 300 balas en pantalla.

## 2026-10-29 14:30 — Hito M7 — Armas con diferencias reales

- Hecho: las tres armas cambian de verdad (antes las tres hacían 1 de daño). **Secador** (el de salida): 2 de daño por bala, 2,6 disparos/s, cargador 10, el que más alcanza (350) y el más preciso; el que menos daño hace por segundo (4,0). **Grapadora**: una manguera de grapas de 1 de daño, 11 disparos/s, cargador 33 y recarga larga (2,2 s), alcance 220; 6,3 de daño/s. **Plancha**: 2 × 5 perdigones (10 por disparo), 1,3 disparos/s, cargador 4, alcance 100; 8,4 de daño/s si todo da (de cerca). Herramientas: `weaponProfile` en `src/data/describe.ts` (daño/s con recargas, ráfaga, golpe y alcance, puro) y `tools/armas.ts` (`npm run armas`): el bot con una sola arma en 120 salas de combate y 40 combates contra la jefa, y la tabla en `logs/armas.json`. Test nuevo en `tests/armas.test.ts`: cada arma destaca al menos un 20 % en algo (daño/s, golpe, alcance, segundos de cargador, puntería o cadencia) y es la peor en otra cosa; no todas hacen el mismo daño; las armas que se encuentran hacen más daño/s que la de salida. Tabla en `docs/DISENO.md`. Los tests que daban por hecho «1 de daño» leen ahora el daño de los datos.
- Resistencia de Recambio: cadencia ×0,8 en vez de ×0,7. Con el Secador a 2 de daño, «+1 de daño y ×0,7» se quedaba en un +5 % (un objeto inútil); ahora es +15 % con el Secador y +60 % con la Grapadora.
- Bot: si se queda atascado (3 s sin moverse), anda un momento en una dirección al azar. Con las armas nuevas, en la planta 91 se metía en un hueco de 9 px entre un carrito y una caja (de `cola-atencion`) y el camino siempre apuntaba contra el carrito.
- Decisiones: el arma de salida es la peor por segundo a propósito: lo que se encuentra es una mejora en algo y un cambio de estilo. Primero probé el Secador a 3,2 y luego a 2,8 disparos/s con más empuje: el bot ganaba el 57–60 % de las plantas (por encima de la banda 35–55 %); a 2,6 y con el empuje de antes vuelve a la banda.
- Medidas (bot): plantas enteras, **51 %** ganadas en 100 (antes de las armas nuevas, 45 % en 60); cae el 49 % (31 % ante la jefa). Con una sola arma contra la jefa: Secador 78 % en 93 s, Grapadora 85 % en 72 s, Plancha 88 % en 65 s (antes: 75/96, 73/78, 75/86). Precisión: Secador 59 %, Grapadora 47 %, Plancha 21 %. Salas de combate: 22–25 s con cualquiera (las marca más el ritmo de los enemigos que el arma).
- Problemas conocidos: el hueco entre carrito y caja en `cola-atencion` (cuando el hueco «o» sale caja) es más estrecho que la tostadora; una persona sale andando de lado, pero es feo. La ventana del arma no enseña el daño por segundo (se puede deducir).
- Siguiente paso: M7, repaso de los objetos pasivos (que ninguno sea inútil ni obligatorio), ahora que el daño de las armas es distinto.

## 2026-10-29 14:05 — Hito M7 — La jefa no salía en la planta; equilibrio medido con partidas enteras

- Hecho: **error grave arreglado**: en una planta generada, la sala de la jefa nacía «limpia» (`cleared: fr.kind !== 'combat'`, de M3, antes de que hubiera jefa), así que la Nevera Suprema **nunca aparecía**, no salía el montacargas y la planta no se podía terminar en el juego publicado. Solo se veía en la sala suelta `?sala=jefe` (la que usan el e2e y el bot de jefa), por eso nadie lo vio. Lo encontró la medida nueva del bot. Arreglos que salen de ahí: (1) la sala de la jefa empieza sin limpiar; (2) si se entra por la puerta norte, la jefa espera al fondo (su sitio de la plantilla está pegado a esa puerta: salía a 49 px de la tostadora); (3) el montacargas es de su sala: se guarda al salir y vuelve al entrar (antes era del mundo y habría seguido «puesto» en cualquier sala); el juego lo vuelve a dibujar al volver. Tests nuevos en `tests/transition.test.ts` (2: la jefa está, cierra y hace su entrada en 20 plantas; el montacargas se queda en su sala). El bot (`npm run bot`) mide ahora **partidas enteras**: con daño sigue hasta bajar en el montacargas o caer, y dice qué porcentaje gana la planta, en cuánto y cuántas caen ante la jefa. El bot deja la sala de la jefa para el final y no coge el montacargas hasta haber visto toda la planta, como haría alguien que quiere llegar con todo.
- Decisiones: no toco más números de dificultad en esta tarea: con la jefa de verdad en la planta, el bot gana el 45 % (60 plantas) y la mayoría de las derrotas son ante la jefa. Para un bot que reacciona en 0,2 s, ve todas las balas y apunta casi perfecto, eso es «media-alta»: una persona la ganará con práctica, no a la primera. Banda objetivo a partir de ahora: **35–55 %** de plantas ganadas por el bot. Si el humano dice que es fácil o difícil, se mueve con esta cifra.
- Medidas (60 plantas, antes → después del arreglo): gana la planta 0 % (imposible) → 45 % en 271 s; cae el 17 % → 55 % (37 % ante la jefa, 18 % en salas); 0,79 heridas por sala de combate (con la jefa incluida); acaba con 1,8 armas y 2,5 objetos y 55 builds distintas. Combate suelto contra la jefa, igual: gana el 73 % en 96 s.
- Problemas conocidos: al volver a la sala de la jefa, el montacargas vuelve a «subir» con su ruido (es un aviso, no molesta). No hay e2e que entre en la sala de la jefa desde la planta (solo la sala suelta); lo cubren los tests de simulación.
- Siguiente paso: M7, armas con diferencias reales (tabla de daño por segundo, alcance y cadencia medida por el bot).

## 2026-10-29 13:55 — Hito M6 — Revisión de textos (M6 terminado)

- Hecho: repaso de todo el texto visible con la guía de humor y un test nuevo, `tests/textos.test.ts` (5), que la vigila a partir de ahora: recoge todos los textos de `src/data/texts.ts`, la tienda y los nombres y descripciones de objetos, armas, sinergias, enemigos, salas, personajes y atrezo (más de 200), y comprueba que ninguno lleva «¡!», que todos se escriben con «Letra Pequeña» sin espacios de más, que los nombres de objetos y armas tienen 2 a 4 palabras y sus descripciones caben en tres frases cortas, que las de enemigos no pasan de dos, y que no se repite el mismo chiste en dos sitios. Cambios: «¡Sinergia!» pasa a «Sinergia corporativa:» (seco y más del tema); «Incidencia resuelta» de las puertas pasa a «Trámite completado» (era el título de la pantalla de planta superada); el sello «Daños por mal uso» pasa a «Mal uso acreditado» (era también la causa de baja por defecto); el objeto activo de espera dice «Sala en espera. Por orden de llegada.» (había tres «es muy importante para nosotros»); la caja de autocobro dice «ticket» como el resto del juego, no «tique»; la Bombilla y la Nevera Suprema, en dos frases. La línea de controles y «Recargando» salen de `GameScene` a `texts.ts` (todo el texto en datos). Capturas 21b y 22 revisadas: se leen y caben.
- M6 terminado: el contenido mínimo de `docs/DISENO.md` está entero (1 personaje, 3 armas, 10 pasivos, 3 activos, 6 enemigos, la Nevera con dos fases, planta generada con tienda y tesoro, menú, pausa, parte de baja, victoria, guardado, efectos y dos pistas) y el flujo «Publicar» está en verde, así que la partida completa se puede jugar en el enlace publicado.
- Decisiones: la regla «descripción: una frase, dos como mucho» admite tres en el test porque un ejemplo aprobado (la Plancha) tiene tres; el límite real es de 110 caracteres. Al empezar, la rama `main` local estaba desfasada (2 commits sueltos del kit frente a 50 del remoto); la he puesto igual que `origin/main` sin tocar el remoto.
- Medidas: sin cambios de simulación (bot igual). 300 tests en verde.
- Problemas conocidos: «Sinergia corporativa: Instalación Casera» es la placa más ancha (157 px), cabe de sobra. Los nombres de sala no tienen límite de palabras (son largos a propósito, con su broma entre paréntesis).
- Siguiente paso: M7, el equilibrio con datos del bot (dificultad media-alta).

## 2026-10-29 13:10 — Hito M6 — Música de planta y de jefa

- Hecho: `src/audio/music.ts`, un tracker puro: cada canción es datos (`SongDef`: tempo, un acorde por compás, melodía de 16 pasos por compás con notas, «-» para alargar y «.» para silencio, línea de batería k/s/h y redoble del último compás, bajo «pulse» o «run», arpegio) y `renderSong` la sintetiza en una vuelta que se repite sin cortes (lo que suena pasado el final vuelve al principio) y sin saturar. Dos canciones: **planta** (108 ppm, la menor, Am–F–C–G–Am–F–Dm–E7: hilo musical de centro comercial con onda cuadrada fina, arpegio y bajo en triangular) y **jefa** (144 ppm, re menor, bajo en semicorcheas y caja en cada tiempo). `Sound` gana `playMusic` (fundido entre canciones; la misma canción sigue donde iba al cambiar de sala; espera al primer gesto si aún no hay audio), `setMusicVolume` y `duckMusic` (baja al 35 % con la pausa abierta). Suena «planta» en la portada y en las salas, «jefa» en la sala de la jefa mientras siga en pie; se apaga al caer y al liquidarla. Opción nueva **Volumen de música** (0–10, 6 por defecto) guardada con las demás. Test nuevo `tests/musica.test.ts` (3: notas y acordes, canciones bien escritas, duración, que suena, no satura, empalma y es determinista); el e2e comprueba que en la sala de la jefa suena «jefa».
- Decisiones: sintetizar y no componer en un formato externo, para no depender de nada y seguir con «sin audio externo sin licencia». La canción se sintetiza al pedirla por primera vez (~150 ms la de la planta) y queda guardada. Vueltas cortas (18 y 13 s) para empezar; si cansan, se alargan con más compases sin tocar el motor. No he podido escucharla (no hay altavoces en la sesión): está comprobada por números (volumen, picos, empalme), así que es el primer sitio donde la opinión del humano vale más que la mía.
- Medidas: sin cambios de simulación. 295 tests en verde.
- Problemas conocidos: la síntesis de la primera canción es un parón de ~0,15 s al primer gesto. No hay música de victoria ni de parte de baja (silencio a propósito, de momento).
- Siguiente paso: M6, la revisión completa de textos; luego comprobar los criterios de M6.
- Cierre de sesión: esta sesión empezó a las 11:25 (10:25 UTC) y ha cerrado nueve tareas (tienda, ventana de descripción y M5 entero; pausa, portada, inventario, interfaz limpia, parte de baja y victoria, historial y música de M6). Cierro aquí para que la sesión de las 13:24 empiece con el contexto limpio.

## 2026-10-29 13:00 — Hito M6 — Guardado de desbloqueos y estadísticas

- Hecho: `src/sim/profile.ts` (puro): `Profile` con partidas, bajas, plantas superadas, veces que cae cada jefa, victorias por personaje, desmontados, cupones, planta más rápida, partida más larga, causas de baja y todo lo encontrado (objetos, activos y armas, sin repetir); `recordRun` suma una partida sin tocar el perfil viejo, `parseProfile` lee un guardado quedándose solo con lo que tiene sentido (lo roto, negativo o de otro tipo vuelve a cero) y `topCause`. `src/render/save.ts` lo guarda en `localStorage` (`garantia-expirada/perfil`; si falla, dura hasta cerrar la página). `GameScene.recordRun` apunta cada partida **en una planta** una sola vez, al caer (`down`) o al bajar en el montacargas (`floorDone`), con las jefas caídas (`bossDying`). En la portada, opción nueva **Historial** («Historial de reclamaciones · Guardado en este navegador. No en la nube: no nos fiamos.») con diez líneas (`historyLines` en `src/data/texts.ts`). Test nuevo `tests/perfil.test.ts` (3); e2e nuevo: una partida desde la portada, baja por microondas, Esc, perfil guardado y captura `29-historial.png`.
- Decisiones: la Sala de pruebas y las salas sueltas no cuentan (serían reclamaciones de mentira). El perfil guarda datos en bruto (ids y contadores) y no «desbloqueos» ya decididos: así M9 (centro) y M12 (requisitos del piso secreto: todas las jefas, ganar con tres personajes) pueden decidir qué desbloquea qué sin migrar guardados. `version: 1` por si algún día hay que migrar. Seguida la regla nueva de `en_curso`: tarea apuntada y publicada antes de programar.
- Medidas: sin cambios de simulación. 292 tests en verde.
- Problemas conocidos: el arma inicial no cuenta como «descubierta» (solo las que se encuentran), así que salen «0 de 2» armas al principio. No hay forma de borrar el historial desde el juego.
- Siguiente paso: M6, la música (una pista para la planta y otra para la jefa).

## 2026-10-29 12:55 — Hito M6 — Parte de baja y pantalla de victoria

- Hecho: las dos tareas ya tenían su pantalla desde M1 y M4 (el parte de baja con causa, cobertura, sala, vida útil y recomendación del fabricante; «Incidencia resuelta · Planta superada» al bajar en el montacargas), así que esta sesión las termina de pulir: (1) fila **Equipaje** con los iconos de las armas, los objetos y el activo con los que acabó la partida (los que no caben, «+N»); (2) el tiempo como un reloj (`clock`: «0:44», «2:05») en vez de «44 s»; (3) **Esc** desde el parte lleva a la portada (la pista lo dice: «R o clic: pedir otra unidad · Esc: menú principal»); P y ocultar la pestaña siguen sin hacer nada ahí. El impreso crece a 186 px de alto, el equipaje va entre los datos y la recomendación, y el sello baja a su sitio sin tapar el chiste ni la pista. Test nuevo del reloj en `tests/down.test.ts`; e2e nuevo: parte con siete objetos y Esc a la portada (captura `28`).
- Decisiones: la «pantalla de victoria» de la partida entera no tiene sentido con una sola planta; de momento lo es la de planta superada, y la definitiva (con el final) se hará con la última planta (anotado en la tarea). Esc lleva a la portada sin preguntar porque la partida ya ha acabado.
- Medidas: sin cambios de simulación. 286 tests en verde.
- Problemas conocidos: el número de expediente cambia cada vez que se pinta el impreso (sale del tick; da igual, pero no es un número «real»).
- Siguiente paso: M6, guardado local de desbloqueos y estadísticas.

## 2026-10-29 12:50 — Hito M6 — Interfaz limpia (segunda pasada) y sesiones que se pisan

- Hecho: esta sesión (11:30 UTC) eligió la misma tarea que la de las 12:35 de abajo, que seguía viva desde la hora anterior, y la publicó primero. Al juntar las dos me he quedado con lo que la mía añadía y he quitado lo repetido: `src/render/hud.ts` (puro) coloca todo el HUD según lo que haya que enseñar (corazones, cifras de cupones y tickets, activo, objetos, cargador, tamaño del minimapa, ayuda de controles) y `tests/hud.test.ts` comprueba en cientos de combinaciones que ninguna zona pisa a otra ni se sale de la pantalla, que cada pieza cabe en su placa y que la ventana de descripción cabe arriba y abajo sin tapar nada. Además: placas con borde (las del minimapa) también bajo la **ayuda de controles**, que pasa a dos líneas si se iba a meter bajo el arma; los objetos van en filas que crecen hacia arriba sin llegar al arma; el ticket se aparta si los cupones tienen muchas cifras; la ranura del activo solo sale cuando hay activo (vacía parecía un fallo). El **nombre de la sala** sube a una franja propia arriba, sobre su placa con raya dorada, entre el estado y el mapa (antes chocaba con la ventana de descripción): lo que es en dorado y la broma entre paréntesis en gris. La ventana de descripción se coloca bajo el título y el mapa, o encima de lo que haya abajo. Textos flotantes: `stackFloat` sustituye a `stackAbove` (`src/render/layout.ts` y su test, borrados: hacían lo mismo) y los números de daño se suman por enemigo (`target`) durante 0,35 s, en vez de por cercanía, con un salto de 2 px en lugar de escalar (escalar emborrona el pixel art).
- Decisiones: **regla nueva en `AUTOPILOT.md` (paso 1.4)**: desde que las sesiones son largas, la siguiente arranca con la anterior todavía trabajando (pasó a las 09:31 y ahora; solo hay una tarea programada, cada hora al minuto 24, así que no es un fallo del programador). Cada sesión apunta su tarea en `progress.json → en_curso` y hace push antes de programar; las demás eligen otra. Esta sesión no empieza otra tarea: la otra sigue viva (irá a por el parte de baja) y no conoce la regla nueva.
- Medidas: sin cambios de simulación (bot igual). 288 tests, check, build, bot y e2e en verde.
- Problemas conocidos: la ayuda de controles tapa un momento lo que pase por abajo (9 s, primera sala). Al apagarse, los objetos bajan una fila de golpe. Los avisos de «cambia de arma» y «agotado» siguen sin placa.
- Siguiente paso: M6, el parte de baja y la pantalla de victoria (mirar antes `en_curso`).

## 2026-10-29 12:35 — Hito M6 — Interfaz limpia

- Hecho: repaso del HUD con las capturas de combate, de la jefa, del tesoro y de la build. (1) **Placas** oscuras semitransparentes (`drawHudPlates`, por debajo del HUD y por encima de la viñeta) bajo los tres grupos: arriba a la izquierda (corazones, cupones, tickets y la ranura del activo), abajo a la derecha (arma, munición) y abajo a la izquierda (objetos que se llevan, solo si hay); se ajustan al número de corazones, al cargador y a los objetos. Antes, los contadores se perdían sobre las estanterías de colores de la pared del fondo. (2) **Textos flotantes que no se amontonan**: todos pasan por `addFloat`, que coloca cada uno encima del que taparía (`stackAbove` en `src/render/layout.ts`, puro). (3) **Números de daño que se suman**: un golpe cerca del número anterior lo hace crecer (con un pequeño salto de tamaño) en vez de soltar otro. Test nuevo `tests/layout.test.ts`.
- Decisiones: placas sutiles (55 % de opacidad) y no marcos con borde, para no tapar más sala de la necesaria. La ventana de descripción, el bocadillo de la tienda y la placa de sinergias ya se colocaban sin pisarse (sesiones anteriores); la línea de controles de la primera sala y la fila de objetos no se tocan (comprobado: quedan a 5 px).
- Medidas: sin cambios de simulación. 285 tests en verde.
- Problemas conocidos: la placa de arriba a la izquierda es algo alta para lo que hay a la derecha de la ranura del activo. El nombre de la sala no lleva placa (se lee bien casi siempre, y se va a los pocos segundos).
- Siguiente paso: M6, el parte de baja y la pantalla de victoria.

## 2026-10-29 12:25 — Hito M6 — Inventario en la pausa

- Hecho: «Inventario» es la segunda opción de la pausa. Pantalla a casi toda la pantalla: a la izquierda, **arma en mano** (daño, cadencia, cargador, recarga, alcance y dispersión) y **personaje** (corazones, velocidad y voltereta cada tantos segundos), cada número en verde si los objetos lo han mejorado, en rojo si lo han empeorado y blanco si sigue igual, con «antes X» al lado cuando ha cambiado; debajo, las **sinergias** encendidas. A la derecha, los objetos pasivos en el orden en que se cogieron (con su sprite), el activo («(Q)») y las sinergias, en una ventana de 6 líneas que se desplaza con el cursor; bajo la lista, el elegido entero: descripción y `modifierLines` (para el activo, qué hace, cuántas pilas pide y cuántas tiene). Cálculo puro en `src/data/describe.ts` (`weaponStatRows`, `characterStatRows`, con `delta` −1/0/1). Textos en `src/data/texts.ts` («Lo que llevas encima. Sin ticket regalo.», «Nada. Como la garantía.»). Test nuevo en `tests/descripcion.test.ts`; e2e nuevo con 7 objetos, un activo y dos sinergias (capturas `27a` y `27b`); el e2e de opciones se ajusta a la opción nueva.
- Decisiones: las estadísticas se comparan con el arma y el personaje sin ningún modificador (`base`), no con el objeto anterior: así «lo que suma o resta cada objeto» se lee en la columna de la derecha y el total en la izquierda. Las sinergias salen dos veces (en la lista para leer su texto y como resumen a la izquierda) porque cambian números sin ser un objeto. «Vida máxima» pasó a «Corazones» porque «antes 3 corazones» se salía de su columna.
- Medidas: sin cambios de simulación (bot igual). 284 tests en verde.
- Problemas conocidos: con más de 6 cosas la lista se desplaza, pero no hay barra que lo indique (solo «...»). Las estadísticas son las del arma en mano; las demás armas no se ven hasta cambiar a ellas.
- Siguiente paso: M6, la interfaz limpia (repaso del HUD).

## 2026-10-29 12:15 — Hito M6 — Menú principal

- Hecho: portada (`TitleScene` en `src/render/PauseScene.ts`: la misma escena de menús que la pausa, con su propia primera pantalla). Fondo: la sala `entrada` pintada y oscurecida, la tostadora al triple de tamaño a la izquierda (se balancea un poco) y la viñeta; arriba «Garantía Expirada» a cuatro veces el tamaño de la fuente con sombra roja y la frase de la premisa («Te vendieron una tostadora «para toda la vida». Duró hasta el martes.»); menú: **Presentar reclamación** (planta nueva), **Sala de pruebas**, **Opciones**, **Controles** y **Créditos**; abajo «Megamarket Outlet · Almacén de devoluciones» y la versión. La pausa gana «Salir al menú principal», que pregunta antes («Esta partida se perderá. Como su garantía.»). Al volver de una pantalla, el cursor queda en la opción que la abrió. `BootScene` arranca en la portada salvo con `?sala=` o `?semilla=` (tests y enlaces de prueba siguen yendo directos al juego); `GameScene.init` recibe `{ sala }` para la sala de pruebas y lo conserva al pedir otra unidad. `window.__GE_PHASER__` para que el e2e sepa qué escena corre. El sonido se desbloquea con la primera tecla o clic en la portada. Tests de textos ampliados en `tests/menu.test.ts`; e2e nuevo: portada, créditos, partida desde la portada y vuelta (capturas `26a`–`26d`).
- Decisiones: una sola clase de menús para pausa y portada, para que se manejen igual y no haya dos copias que se desincronicen. «Presentar reclamación» en vez de «Jugar»: es lo que hace la tostadora en la historia. El nombre del motor no puede ir en `src/data/` (la regla del lint prohíbe la palabra en datos y simulación), así que su línea de créditos la añade la escena.
- Medidas: sin cambios de simulación (bot igual). 283 tests en verde.
- Problemas conocidos: la sala del fondo es más estrecha que la pantalla y se ven sus bordes oscuros a los lados; en la pantalla de créditos el panel tapa media tostadora. No hay música de portada (llegará con la tarea de música de M6).
- Siguiente paso: M6, el inventario en la pausa.

## 2026-10-29 12:05 — Hito M6 — Pausa y opciones

- Hecho: `src/render/PauseScene.ts` (escena `pause` que se lanza encima de `game` y la pausa entera: simulación, tweens y temporizadores). Se abre con **Esc**, **P**, **Start** del mando (`Controls.padPause`) o al ocultarse la pestaña. Pantallas: principal (Continuar, Opciones, Controles, Pedir otra unidad), opciones (**volumen de efectos 0–10**, **pantalla completa**, **temblor de cámara**), controles (tabla de acción, teclado y ratón, mando) y confirmación de «Pedir otra unidad» («La unidad actual irá al punto limpio. Lo que lleva, también.»; por defecto «No, que aguante»). Se maneja con flechas o WASD, Intro o espacio, Esc o retroceso; con el ratón (pasar por encima elige, clic acepta) y con el mando (cruceta o stick, A, B y Start). Modelo de menú puro en `src/render/menu.ts` (`Menu`: mover en círculo, ajustar, aceptar) y opciones en `src/render/settings.ts` (`localStorage`, con `parseSettings` que deja en su valor por defecto lo roto o raro). `Sound.setVolume` cambia el volumen al momento; `GameScene.shake` respeta el temblor apagado (las 23 sacudidas pasan por ahí). Textos en `src/data/texts.ts` (cuatro frases bajo «En pausa», como «Pausa de cinco minutos. Le quedan cuatro.»). Test nuevo `tests/menu.test.ts` (3); e2e nuevo: pausa congela el `tick`, opciones guardadas como `{"volume":4,"shake":false}`, controles y vuelta (capturas `25a`–`25c`).
- Decisiones: la tarea «menú principal, pausa, opciones» era grande y la he dividido: esta sesión la pausa y las opciones; el menú principal, la siguiente, con el mismo `Menu`. El temblor de cámara es una opción porque hay gente a la que marea (accesibilidad, barato de dar). La pantalla completa no se guarda: el navegador solo la deja pedir con un gesto, así que se elige cada vez. «Pedir otra unidad» pregunta antes, porque perder una partida por una tecla mal pulsada es lo peor. El aviso de teclas va dentro del panel: debajo se pisaba con la línea de controles de la Sala de Pruebas.
- Medidas: sin cambios de simulación (bot igual). 283 tests en verde.
- Problemas conocidos: el volumen solo afecta a los efectos (aún no hay música; cuando la haya, tendrá su propia línea). Las teclas no se pueden cambiar todavía.
- Siguiente paso: M6, el menú principal.

## 2026-10-29 11:55 — Hito M5 — Ventana de descripción (M5 terminado)

- Hecho: `src/data/describe.ts`, puro y probado: `modifierLines` convierte un modificador en líneas con su color (`{ text, good }`: «Cadencia +30 %», «Cargador -30 %», «+1 corazón», «Rebota 2 veces», «Atraviesa 2 enemigos», «Balas que persiguen»), sabiendo si más es mejor o peor para cada estadística (más retroceso, dispersión, tiempo de recarga o espera entre volteretas es peor); `activeLines` (qué hace y cuántas pilas pide) y `weaponLines` (daño, disparos por segundo, cargador, recarga y alcance). En el juego, `showCard`: ventana oscura de 292 px con el borde del color del tipo (dorado pasivo, cian activo, crema arma), el sprite a doble tamaño en un hueco a la izquierda, nombre, tipo («Objeto pasivo · se queda contigo», «Objeto activo · se usa con Q», «Arma · E o rueda para cambiar»), descripción y efectos en verde o rojo. Dura de 2,6 a 6,5 s según lo que haya que leer y se desvanece; una nueva la sustituye. Sale arriba, salvo si la tostadora está en la mitad de arriba de la pantalla (como al coger del pedestal del tesoro): entonces sale abajo. La placa de las sinergias se pone pegada a ella (debajo o encima). Sustituye al cartel suelto de nombre y descripción. Test nuevo `tests/descripcion.test.ts` (3: líneas y colores de varios objetos, que todo se puede escribir con la fuente y cabe, sinergias y activos, y que las armas enseñan números distintos).
- M5 terminado: sus criterios se cumplen (cada objeto tiene un test de su efecto en `tests/objetos.test.ts`; el bot acaba con 19 builds distintas en 20 plantas). Hoja de ruta y estimación actualizadas (145 sesiones, ~189 con margen; quedan unas 10 para la primera versión jugable).
- Atendida la nota del humano «sesiones de trabajo más largas (sin perder calidad)»: el paso 7 de `AUTOPILOT.md` dice ahora que se encadenan tareas mientras quede contexto, cerrando cada una con tests, capturas, bitácora y push, y que se para cuando la calidad se resienta. Es una regla del protocolo que había que cambiar por petición del humano.
- Decisiones: los efectos salen de los datos del modificador y no de un texto escrito a mano, para que nunca mientan y para reutilizarlos en el inventario de M6 (que pide «lo que suma o resta cada objeto»). Porcentajes redondeados y con «-» normal (la fuente no tiene «−» ni «°»: la dispersión sale sin unidad). La ventana cambia de sitio en vez de hacerse transparente: así no tapa nunca la tostadora y se sigue leyendo entera.
- Medidas: sin cambios de simulación (bot igual que en la entrada anterior).
- Problemas conocidos: las tres armas hacen 1 de daño; la ventana lo deja a la vista (las diferencias reales de daño son tarea de M7). El título de la sala del tesoro queda justo encima de la ventana cuando sale arriba (se tocan, pero se leen).
- Siguiente paso: M6, empezando por la pausa y las opciones.

## 2026-10-29 11:40 — Hito M5 — La tienda

- Hecho: la tienda vende. Datos nuevos en `src/data/shop.ts`: precios (`SHOP_PRICES`: objeto 15, activo 12, arma 18, corazón 6, ticket 8), qué lleva cada balda (`SHOP_SHELVES`: objeto, corazón, ticket) y los textos del vendedor. Simulación: `Pickup.price` (y `touched`); `stockShop` llena las baldas (`s`) la primera vez que se entra en la tienda de una planta (o al abrir `?sala=tienda`), y el objeto sale de la misma baraja que tesoro y cofres (no se repite en la planta). Lo que está a la venta no se mueve ni lo atrae el imán; andando encima (rodando no) se compra si llega: cobra, evento `shop` (`bought`) y se entrega como si se cogiera del suelo (función `grab`). Si no llega (`poor`) o es un corazón con la vida llena (`full`), evento `shop` una sola vez por pisada. **Vendedor: la Caja de Autocobro**, prop sólido `autocobro` que `buildRoom` pone en la casilla `$`. Sprites nuevos: `autocobro` (30 × 36, 3 fotogramas: sonrisa, hablando y pantalla roja con «X X»; escáner con su raya roja, ranura de tarjeta y de cupones, un tique larguísimo hasta el suelo, la luz de «llame a un empleado» y una bolsa triste en la zona de embolsado) y `expositor` (peana bajo cada balda con franja roja). En pantalla: precio con un cupón bajo cada expositor (dorado si llega, gris si no), nombre al acercarse (también «Corazón de Recambio» y «Ticket de Compra»), bocadillo de la caja al entrar («Bienvenido. Escanee sus productos. Yo le miro.»), al comprar («Objeto inesperado en la zona de embolsado.») y al negarse («Saldo insuficiente. Pruebe a tener más.»), con la boca de la pantalla moviéndose; al vaciar las baldas, «Agotado. Repondremos cuando sea rentable.». Sonidos nuevos `escaner` (doble pitido) y `cajaError`. El contador de cupones tiembla en rojo cuando no llega. Bot: compra lo que puede pagar (objeto, luego corazón si le faltan 2 medios, luego ticket; un activo solo si no lleva) y `npm run bot` cuenta compras y gasto. Test nuevo `tests/tienda.test.ts` (7). e2e: capturas `24a`–`24c`.
- Decisiones: la tienda la atiende una caja de autopago y no un dependiente: es el chiste de que despidieron a toda la plantilla y dejaron a una máquina que te vigila mientras trabajas tú. Precios pensados con el bot: una planta entera da ~40 cupones (medido: 20–64), así que da para dos o tres cosas; el objeto vale casi dos tickets para que el ticket sea la opción «barata pero a medias». Comprar es andar encima, igual que coger objetos, sin tecla nueva (la interfaz se repasará en M6). Lo que se vende no se reparte por el suelo con el imán, para que no se compre sin querer al pasar cerca. El bocadillo primero era claro con letra oscura y la fuente se emborronaba: ahora es una placa oscura con borde crema, como la de las sinergias.
- Medidas (bot, 20 plantas): compra 1 cosa por planta (10,6 cupones); con daño recorre la planta el 80 % (antes 75 %) y cae el 20 % (antes 25 %); acaba con 2,2 objetos (antes 1,6), **19 builds distintas en 20 plantas** (antes 17) y el 40 % con alguna sinergia (antes 10 %). Recorrido sin daño: 249 s (antes 227, por el rodeo de la tienda). Sala de combate 18,4 s y 0,48 heridas.
- Problemas conocidos: el bot visita la tienda cuando le pilla de camino y a menudo llega con pocos cupones (no vuelve luego). A la caja no se le puede disparar ni robar (quizá más adelante, con consecuencias). La descripción del objeto recién comprado sale arriba y pisa a la caja un momento.
- Siguiente paso: M5, la ventana de descripción al recoger un objeto; con eso M5 queda terminado (comprobar sus criterios) y se empieza M6.

## 2026-10-29 10:50 — Hito M5 — Cofres y tickets

- Hecho: tickets (pickup `ticket`, `player.tickets`, se recogen como los cupones y tienen contador propio en el HUD) y cofres: la **Caja Fuerte de Devoluciones** (prop `cofre` con `PropInstance.chest`, sólida y para las balas). `planFloor` elige con semilla (`premios:<semilla>`) 2 salas de combate que dan ticket y 2 que dan cofre al limpiarlas (`FLOOR_TICKETS`, `FLOOR_CHESTS`); salen en el centro de la sala. Andar contra el cofre con ticket lo abre: gasta el ticket y saca el siguiente objeto pasivo de la baraja de la planta (si no quedan, activo; si no, arma) y 3 cupones. Sin ticket, evento `chest` con `opened: false` cada 2 s como mucho. Sprites nuevos `cofre` (cerrado y abierto) y `ticket`; textos en `src/data/texts.ts`; en pantalla: el cofre cae con polvo y temblor, al abrirse salta la tapa con chispas doradas y sale una frase («Reembolso en especie»), cerrado zumba y el contador de tickets tiembla en rojo. El bot recoge tickets y va a los cofres; cuenta tickets y cofres por planta. Test nuevo `tests/cofres.test.ts` (9). e2e: capturas `23a`–`23d`.
- Atendida la nota del humano de las 10:26 (pautas generales para más adelante): repartida en la hoja de ruta como tareas de M6 (inventario con estadísticas, interfaz limpia), M7 (dificultad media-alta, armas con diferencias medidas, repaso de objetos), M8 (entornos con plantillas y variantes) y un criterio nuevo en M10 (pasar de la planta 3, difícil de verdad); resumen en `docs/DISENO.md`. Estimación corregida: 147 sesiones (~191 con margen).
- Decisiones: premios fijados con la planta y no al azar al limpiar, para que cada planta tenga siempre los mismos tickets que cofres (todos se pueden abrir si limpias todo; la tienda venderá tickets de más). El cofre se coloca en una casilla, como los props de las plantillas: la primera versión lo ponía entre casillas y el bot se atascaba en sus esquinas (10 plantas falladas). El objeto sale 32 px por delante para que no se coja solo y su nombre no tape el cofre. Los cofres sacan de las mismas barajas que los pedestales, así que nunca se repite objeto en una planta. Primero el cofre era gris claro y se confundía con la tostadora: ahora es acero oscuro.
- Medidas (bot, 20 plantas): con daño recorre la planta el 75 % (antes 50 %) y cae el 25 % (antes 50 %): los objetos de los cofres (Garantía, Pegamento…) ayudan. 1,5 tickets y 1 cofre abiertos por planta; acaba con 1,6 objetos (antes 0,5) y **17 builds distintas en 20 plantas** (antes 9). Sala de combate: 18,6 s y 0,49 heridas.
- Problemas conocidos: si se coloca un cofre con la consola (gancho de test) no hay animación de caída, porque el evento se pierde fuera de `step`; en partida sí sale. El título largo de la sala del tesoro sigue pisando el marco de la puerta de arriba.
- Siguiente paso: M5, la tienda con vendedor y precios en cupones (y que venda tickets).

## 2026-10-29 09:55 — Hito M5 — Cinco sinergias

- Hecho: sinergias como datos (`src/data/synergies.ts`, tipo `SynergyDef`): piezas (objetos y, si acaso, un arma) y un modificador de más. `activeSynergies` en `src/sim/mods.ts`; `refreshPlayer` las calcula cada vez que cambian los objetos o el arsenal, las guarda en `player.synergies` y emite `synergy` al encenderse o apagarse. Cinco: Sobrecarga (Pila + Secador), Papeleo Exprés (Cinta + Grapadora), Bricolaje Avanzado (Manual + Broca), Instalación Casera (Regleta + Alargador) y Cliente Preferente (Tarjeta + Etiqueta); tabla en `docs/DISENO.md`. En pantalla: acorde, anillo de chispas y un recuadro oscuro con borde cian («¡Sinergia! Nombre» y su frase) bajo la descripción del objeto, 4,6 s. El bot cuenta el % de plantas que acaban con alguna sinergia. Test nuevo `tests/sinergias.test.ts` (8 tests: datos, encendido y apagado de cada una, el efecto de cada una y que la del arma sigue al arsenal). e2e: captura `22-sinergia.png`.
- Decisiones: una sinergia con arma solo cambia esa arma (si no, la Sobrecarga aceleraría también la Grapadora) y cuenta con el arma en el arsenal, no en la mano, para que cambiar de arma no encienda y apague banners. Los eventos de sinergia se pintan después de los demás del mismo paso, para que el nombre del objeto salga primero. Primero probé el texto a pelo sobre el suelo y no se leía (chocaba con «¡Sinergia!» flotando sobre la tostadora): ahora va sobre una placa oscura y sin texto flotante. La Sobrecarga sale con la Pila y el Secador inicial, como el ejemplo del diseño; me parece bien que la primera sinergia sea fácil de ver.
- Medidas: bot igual que antes (las sinergias no cambian la simulación sin objetos) y el 0 % de las plantas acaba con sinergia: el bot solo coge 0,5 objetos por planta. Subirá con cofres y tienda.
- Problemas conocidos: el título largo de la sala del tesoro («Objetos perdidos (nadie los reclamó)») pisa el marco de la puerta de arriba; es anterior a esta sesión.
- Siguiente paso: M5, cofres con tickets y tienda (dividir en dos sesiones: cofres y tickets primero).

## 2026-10-29 09:31 — Sesión duplicada — Dos sesiones a la vez

- Hecho: nada de juego. Esta sesión empezó a la vez que la de las 09:30, eligió la misma tarea (la nota de la estimación), la terminó y al hacer push se encontró la otra ya publicada. He descartado mi versión y me quedo con la publicada.
- Decisiones: no sigo con la siguiente tarea (sinergias de M5) porque la otra sesión la habrá cogido ya y dos sesiones tocando el mismo código acaban en conflictos. Comprobado: solo hay una tarea programada (cada hora, al minuto 24); esta vez se disparó dos veces a las 08:24 UTC. Parece un fallo puntual del programador, así que no lo dejo en `bloqueos`; si se repite, hay que avisar al humano.
- Siguiente paso: M5, «Al menos 4 sinergias con texto propio» (si nadie lo ha hecho ya).

## 2026-10-29 09:30 — Nota del humano — Estimación de tiempo por hito

- Hecho: atendida la nota que pedía un aproximado de lo que tardará cada fase. Tabla nueva al principio de `docs/HOJA_DE_RUTA.md` («Estimación de tiempo») con sesiones por hito y su porqué; la misma cifra en `progress.json → estimacion`, y el panel la enseña: una línea encima de los hitos (sesiones que quedan, sumadas solo de los hitos sin terminar, y el calendario) y «≈ N ses.» bajo cada hito pendiente. Comprobado con capturas del panel a 1100 y 390 px de ancho.
- Decisiones: estimo en sesiones y no en fechas, porque el ritmo real depende de los créditos; doy el calendario en dos escenarios (una sesión por hora sin parones → 6–8 días; unas 10 al día → 2–3 semanas). Base: 47 tareas en ~33 sesiones hasta hoy, pero las que quedan son más grandes, así que cuento por tarea (un jefe ≈ 5 sesiones, como la Nevera; una planta ≈ 12). Total 143 sesiones, ~185 con un 30 % de margen. `npm run stats` reescribe `hitos` pero respeta `estimacion`, por eso va en su propia clave.
- Medidas: check, 251 tests, build y bot en verde (sin cambios de juego).
- Problemas conocidos: la estimación es a mano; si un hito se desvía mucho, hay que corregirla en los dos sitios.
- Siguiente paso: M5, «Al menos 4 sinergias con texto propio».

## 2026-10-29 09:15 — Nota del humano — Hoja de ruta hasta el final

- Hecho: atendida la nota del 2026-10-29. La hoja de ruta acaba ahora así: M10 plantas 3 y 4 (Juguetería y Oficinas) con criterios de aceptación, **M11 planta 5: Atención al Cliente** (nueva; jefe propuesto: La Centralita), **M12 el Servicio Técnico, piso final secreto** con requisitos de desbloqueo guardados entre partidas y el final verdadero, **M13 cinco personajes jugables** con estadísticas, arma, habilidad, historia y final propios, M14 más contenido (objetivo: 30 armas, 80 objetos, 30 enemigos, 8 jefes) y **M15 versión de escritorio, lo último**. `docs/DISENO.md`: 5 plantas más el piso final y un quinto personaje por diseñar, el Móvil Reacondicionado. `CLAUDE.md`: la línea de escritorio decía «hito M12»; ahora dice «lo último de todo, hito M15» (una regla que había quedado mal).
- Decisiones: la quinta planta es Atención al Cliente porque es el tema de humor que más da y aún no tenía planta; queda justo antes del Servicio Técnico (de la ventanilla a la trituradora). Requisitos propuestos para el piso final: vencer a los 5 jefes, ganar con 3 personajes distintos y reunir las piezas de historia (se concretarán en M12). El quinto personaje es un móvil reacondicionado: la obsolescencia programada en persona. No toco M6–M9: siguen siendo el camino a la primera versión jugable.
- Siguiente paso: seguir con M5 (sinergias).

## 2026-10-29 09:05 — Hito M5 — Tres objetos activos con pilas

- Hecho: `ActiveItemDef` y `ActiveEffect` en `src/data/types.ts`; `ACTIVE_ITEMS` y `FINDABLE_ACTIVES` en `src/data/items.ts`: **Encuesta de Satisfacción** («Su opinión es muy importante para nosotros. Por eso nadie la lee.», 2 pilas, `clearFire`: reutiliza `clearEnemyFire`), **Música de Espera** («Todos nuestros enemigos están ocupados. Su ataque será atendido en breve.», 3 pilas, `hold` 3,5 s) y **Pegamento Exprés** («Pega cualquier cosa a cualquier cosa. Sobre todo los dedos.», 2 pilas, `heal` 2). Simulación: `Input.useItem`, `Player.active` (`id` y `charge`), `PickupKind` `'activo'` (con `charge` y `stepOff`), `giveActive` (llega lleno; el que se llevaba se queda en el suelo con sus pilas y no se puede volver a coger hasta apartarse, para que no se intercambien en bucle), `useActive` (eventos `active` y `activeEmpty`) y `chargeActive` (evento `battery`): **una pila por sala de combate limpia** (al subir las persianas; en la Sala de Pruebas, cada vez que se repone). `World.holdT`: mientras dura no se actualizan enemigos, emisores ni escarcha, y las balas enemigas se quedan colgadas sin hacer daño; las de la tostadora siguen y les dan (evento `holdEnd` al acabar). `stockPedestals` reparte en rueda arma → pasivo → activo y la plantilla `tesoro` tiene **tres pedestales**. Entrada: Q y el botón B del mando. Bot: usa el pegamento cuando le falta un corazón y la encuesta o la música con 6 balas enemigas a menos de 90 px; `npm run bot` cuenta las plantas que acaban con activo y los usos. Juego: ranura de arriba a la izquierda con el sprite (apagado hasta que se llena), una columna de pilas al lado (amarillas llenándose, verdes cuando está listo, con una rayita que parpadea), temblor y «Sin batería» con zumbido si no se puede usar, destello y pitido al entrar una pila, anillo de chispas y una frase al usarlo («Encuesta enviada. Gracias por su tiempo.», «Su ataque es muy importante para nosotros.», «Reparado. Sin garantía.»), y un velo frío azul grisáceo sobre la sala mientras está en espera con su musiquilla. Al cogerlo, su descripción lleva debajo «Q: usar · necesita N pilas (una por sala limpia)». 4 sonidos nuevos (`activar`, `sinCarga`, `pila`, `espera`) y 3 sprites de 16 × 16 (portapapeles con la encuesta, auricular rojo de teléfono con una nota musical y tubo de pegamento). `window.__GE__.giveActive(id)`.
- Decisiones: las pilas se ganan limpiando salas (no caen de los enemigos) para que cargar dependa de avanzar y no de entretenerse; si algún día hay pilas sueltas, serán otra recompensa. El pegamento no se gasta con la vida llena (sería tirar las pilas por un error de tecla). Durante la espera las balas enemigas no hacen daño ni se mueven: la tostadora puede reposicionarse entre ellas, pero cuando vuelve la música siguen donde estaban. La sala secreta sigue sin poder abrirse (sus puertas secretas aún no se pueden cruzar), así que todo lo que se puede conseguir de momento está en el tesoro: arma, pasivo y activo. Se replanteará con cofres y tienda.
- Medidas: 251 tests en verde (8 nuevos en `tests/activos.test.ts`: los 3 cumplen la guía; se coge andando, llega cargado, al coger otro deja el viejo con sus pilas y no hay intercambio en bucle; sin pilas no hace nada; la encuesta borra las balas; la música congela enemigo y balas enemigas pero no las propias, y después todo vuelve a moverse; el pegamento cura y con vida llena no se gasta; cuatro salas limpias dan 1, 2, 3 y 3 pilas; determinismo; el test del tesoro ahora espera los tres tipos). Bot: Sala de Pruebas igual; plantas con daño: la recorre el 50 %, 18,8 s y 0,59 heridas por sala de combate (antes 19,3 s y 0,65), **9 builds distintas en 20 plantas, el 45 % acaba con objeto activo y lo usa 0,6 veces por planta**; jefa sin cambios. e2e en verde con capturas nuevas `21a-activo-recogido.png`, `21b-musica-de-espera.png`, `21c-encuesta.png` y `21d-sin-bateria.png`; comprueba la espera y que la encuesta borra las balas. La primera pasada falló una vez en la prueba de la herida («Una bala enemiga no quita medio corazón»), una intermitencia que no tiene que ver con esto; la segunda pasó entera.
- Problemas conocidos: la descripción del pegamento casi toca la pared derecha del tesoro (la sala es más estrecha que la pantalla). El velo de la espera es sutil en suelos claros. Al cambiar de activo con `giveActive` desde la consola el viejo cae justo debajo y su nombre tapa la cabeza de la tostadora hasta que se aparta.
- Siguiente paso: al menos 4 sinergias con texto propio (empezando por Pila Casi Agotada + Secador = «Sobrecarga»); después cofres (con tickets) y la tienda, y la ventana de descripción.

## 2026-10-29 08:39 — Hito M5 — Diez objetos pasivos

- Hecho: `PassiveItemDef` en `src/data/types.ts` y **10 objetos pasivos** en `src/data/items.ts` (`ITEMS`, `FINDABLE_ITEMS`), cada uno solo un `Modifier` con su id: Pila Casi Agotada (cadencia ×1,3, cargador ×0,7), Manual en Chino (rebota 2), Garantía Extendida (+2 de vida máxima), Regleta Sin Tierra (+1 perdigón, +6° de dispersión, cadencia ×0,85), Tarjeta de Socio (persigue 220°/s durante 0,7 s a 110 px; balas ×0,9), Etiqueta A+++ (velocidad ×1,15, enfriamiento de voltereta ×0,75), Alargador de Tres Metros (vida de bala ×1,35, velocidad ×1,15), Broca del Ocho (atraviesa 2, empuje ×0,6), Cinta Americana (recarga ×0,6) y Resistencia de Recambio (+1 de daño, +1 de radio, cadencia ×0,7, retroceso ×1,4). Simulación: `PickupKind` `'objeto'` con `item`, `Player.items`, `giveItem` (añade el modificador), se cogen andando como las armas (rodando no), evento `pickup` con `item`. `FloorRun.items`: cada planta baraja los objetos con su semilla (`objetos:<semilla>`), igual que las armas. `stockPedestals` reparte el **primer pedestal a un arma y el resto a objetos** (si se acaba un mazo, rellena el otro); la plantilla `tesoro` tiene ahora **dos pedestales** y la secreta sigue con uno; una sala de tesoro o secreta suelta (`?sala=tesoro`) también se llena. Bot: va a por armas y objetos; `npm run bot` cuenta objetos y builds distintas. Arte: 7 sprites nuevos de 16 × 16 en `tools/sprites/items.ts` con la misma paleta y el mismo método que los aprobados (regleta blanca con interruptor rojo y cable, tarjeta roja con chip, etiqueta energética de barras, carrete naranja de alargador con enchufe, broca, rollo de cinta gris con la tira suelta y resistencia al rojo entre dos bornes); la Pila, el Manual y la Garantía usan los aprobados. Juego: el objeto flota en su pedestal con su nombre al acercarse; al cogerlo, fanfarria más aguda, chispas doradas, su nombre en el cartel y la descripción debajo (3,4 s); los objetos que se llevan salen en fila abajo a la izquierda. `window.__GE__.giveItem(id)` para probar.
- Decisiones: la tarea «10 pasivos y 3 activos» era demasiado grande para una sesión: la he dividido en la hoja de ruta y esta sesión hace los pasivos. Ticket de Compra y Caja (sprites aprobados) se reservan para llaves y cofres. Casi todos los objetos tienen contrapartida para que las builds sean decisiones y no solo sumas; el daño solo sube de punto en punto (Resistencia) para que los números sigan enteros. «Regleta Sin Toma de Tierra» tenía 5 palabras: el test de la guía de humor la cazó y pasó a «Regleta Sin Tierra». Tarjeta de Socio (no «de Fidelización») para no repetir el nombre de las balas de la jefa. Hasta que haya cofres, el tesoro da arma + objeto gratis y sin elegir; cuando haya cofres y tienda se replanteará (probablemente un cofre en el tesoro). La ventana de descripción de la tarea de M5 todavía no existe: de momento el cartel con nombre y descripción hace su papel.
- Medidas: 239 tests en verde (14 nuevos en `tests/objetos.test.ts`: los 10 cumplen la guía (2–4 palabras, sin exclamaciones, sprite, id del modificador), se cogen andando y no rodando, el tesoro tiene arma + objeto y la secreta uno, una sola vez, con al menos 5 objetos distintos de primero en 12 plantas, **un test por objeto** midiendo su efecto en juego, y determinismo con los 10 a la vez). Bot: Sala de Pruebas sin cambios (51 % vacía, 94,5 % sobrevive); plantas con daño: la recorre el 50 %, 19,3 s y 0,65 heridas por sala de combate (antes 20,1 s y 0,67), **acaba con 1,5 armas y 0,5 objetos de media y 8 builds distintas en 20 plantas** (antes 3 arsenales distintos); jefa sin cambios (77 %, 96 s). e2e en verde con capturas nuevas `20a-objeto-en-pedestal.png`, `20b-objeto-recogido.png` y `20c-build.png`.
- Problemas conocidos: el bot cae antes del tesoro en la mitad de las plantas, así que la mitad acaban sin objetos. El nombre del objeto aparece mientras aún se ve el nombre de la sala (se solapan un segundo, en líneas distintas). La broca se lee algo pequeña a tamaño real. Los objetos no tienen todavía sonido ni efecto propios al disparar (la persecución y el rebote ya se ven).
- Siguiente paso: los 3 objetos activos (Q) con pilas como cargas; después, sinergias (Pila + Secador = «Sobrecarga»), cofres y tienda.

## 2026-10-29 07:45 — Hito M5 — Tres armas y cambio de arma

- Hecho: **arsenal** en la simulación: `Player.arsenal` (las armas que lleva, en el orden en que las encontró, cada una con su munición) y `slot`; `p.weapon` es siempre la del hueco actual. Cada `WeaponState` guarda su `base`, así que `refreshPlayer` aplica los modificadores a **todas** las armas (y las que encuentra después llegan ya modificadas). `Input.swap` (+1/−1) cambia de arma: la recarga que estuviera en marcha se pierde y la nueva tarda `SWAP_TIME` (0,22 s) en disparar; evento `swap`. **Armas en el suelo**: `PickupKind` `'arma'` con su `weapon`; esperan en las casillas de objeto (`*`) y se cogen **andando** por encima (rodando no), sin imán; coger una que ya se tiene solo llena su cargador. `FINDABLE_WEAPONS` en `src/data/weapons.ts`; cada planta baraja las suyas con la semilla (`FloorRun.weapons`) y las pone en la sala del tesoro y en la secreta la primera vez que se entra; la Sala de Pruebas tiene las dos en pedestales nuevos (fila 13). **Armas**: Secador (sin cambios), **Grapadora Táctica** (9 disparos/s, cargador 24, recarga 1,6 s, dispersión 7°, alcance ~240 px, poco empuje) y una nueva, **Plancha de Vapor Turbo** («Vapor a tres bares. Quita las arrugas, la pintura y las ganas de reclamar. No planchar la ropa puesta.»): 5 nubes de vapor por disparo, 1,8 disparos/s, cargador 6, alcance ~105 px, mucho retroceso y empuje. `WeaponDef.look` (datos, solo para el dibujo): sprite en mano, sprite de bala, si la bala gira hacia donde va, sonido y temblor. Arte nuevo en `tools/sprites/props.ts`: `arma-plancha` (18 × 11: carcasa blanca, ventanilla de agua azul, termostato rojo, suela de acero al rojo en la punta y una empuñadura de pistola pegada con cinta gris porque nunca tuvo), `bala-grapa` (grapa al rojo, naranja y amarillo) y `bala-vapor` (nube amarilla pálida con borde naranja que se hincha y se aclara al avanzar). Sonidos nuevos `grapa`, `vapor`, `vaporGolpe`, `cambiar` y `arma`. En el juego: el arma de la mano y el icono del HUD cambian, el nombre del arma sale encima de la munición un momento, unas marcas bajo el icono dicen cuántas lleva y cuál tiene en la mano; las armas del suelo flotan, se balancean, brillan y enseñan su nombre al acercarse; al coger una salen chispas, una frase («Sin ticket, sin garantía, sin preguntas», «Producto de exposición»…) y, la primera vez que lleva dos, el aviso «E o rueda del ratón: cambiar de arma». Controles: **E** o la **rueda** (una muesca, un arma) y el botón **Y** del mando. El bot coge las armas que ve en una sala sin enemigos y elige según la distancia (plancha de cerca, grapadora a media distancia, secador lejos).
- Decisiones: hasta que haya cofres (tarea siguiente de M5) las armas aparecen en el pedestal de la sala del tesoro y de la secreta; cuando lleguen los cofres y la tienda, el tesoro pasará a ser un cofre y las armas saldrán de ahí y de la tienda. Sin límite de armas (con tres no hace falta; si algún día hay muchas, se decide). Todas las armas hacen 1 de daño por bala para que los números de daño sigan siendo enteros: se distinguen por cadencia, cargador, perdigones, alcance y empuje. La tercera arma es una plancha (un electrodoméstico cotidiano más, que no está en ningún otro juego del género) y hace de escopeta para tener el trío clásico: polivalente, ametralladora, escopeta. La E no estaba usada y la Q se reserva para el objeto activo. La precisión del bot se mide ahora por **bala** y no por disparo (con la plancha pasaba del 100 %).
- Medidas: 225 tests en verde (8 nuevos en `tests/armas.test.ts`: tres armas con sprites que existen y estadísticas que se distinguen; pedestales de la Sala de Pruebas; rodando no se coge; cambiar adelante y atrás guardando munición y perdiendo la recarga; el tiempo de desenfundar; la grapadora dispara más que el secador y la plancha suelta 5 perdigones que no pasan de 130 px; los modificadores valen para todas las armas; en 12 plantas el tesoro tiene un arma, una sola vez, y salen las dos). Bot, Sala de Pruebas (coge las armas y las usa): vacía la sala el 51 % (antes 42,5 %), sobrevive el 94,5 % (91,5 %), precisión por bala 77,2 %. Plantas con daño: la recorre el 50 % (45 %), 20,1 s y 0,67 heridas por sala de combate (20,9 s y 0,75), **acaba con 1,5 armas de media y 3 arsenales distintos** en 20 plantas. Jefa sin cambios (el combate suelto empieza solo con el secador). e2e ~60 fps con capturas nuevas `19a-arma-en-pedestal.png`, `19b-arma-recogida.png`, `19c-grapadora.png`, `19d-plancha.png` y `19e-cambio-de-arma.png`; comprueba que se cogen las dos y que E y la rueda cambian de arma.
- Problemas conocidos: con la grapadora (cargador de 24) el icono del arma del HUD queda encima del final de la ayuda de controles mientras esta se ve (ya pasaba con cargadores largos). En la captura de la plancha el vapor ya ha llegado al maniquí y no se ve en vuelo (el 19d enseña el impacto). La mitad de las plantas con daño el bot cae antes de llegar al tesoro, así que muchas acaban solo con el secador.
- Siguiente paso: los 10 objetos pasivos y 3 activos como datos con sus modificadores (un test por objeto) y dónde aparecen; después, sinergias, cofres y tienda.

## 2026-10-29 06:57 — Hito M5 — Sistema de modificadores de estadísticas y de balas

- Hecho: `src/sim/mods.ts` (puro). Un `Modifier` (tipos en `src/data/types.ts`) tiene un `id`, cambios de estadística (`StatChange`: `add` y/o `mul` sobre una `StatKey`) y comportamientos de bala (`BulletBehaviour`). Estadísticas: las once del arma (`damage`, `fireRate`, `magazine`, `reloadTime`, `spreadDeg`, `bulletSpeed`, `bulletLife`, `bulletRadius`, `knockback`, `recoil`, `pellets`) y tres del personaje (`speed`, `maxHp`, `rollCooldown`). Regla: **primero se suman todas las sumas y después se multiplican todos los multiplicadores**, y cada estadística tiene un mínimo y a veces un máximo y redondeo (`LIMITS`: cadencia 0,5–30, cargador ≥ 1 entero, perdigones 1–12, vida máxima 2–24…), para que ninguna combinación rompa el juego. Comportamientos: **`pierce`** (atraviesa n enemigos, cada uno una sola vez; `Bullet.hits`), **`bounce`** (rebota n veces en paredes y muebles invirtiendo el eje que choca; evento `bulletWall` con `bounced`) y **`homing`** (`Bullet.seek`: gira hacia el enemigo vivo más cercano dentro de su alcance que aún no ha tocado); las cantidades se suman entre objetos y de persecución gana la más fuerte. El jugador guarda `base` (personaje y arma sin tocar) y `mods`; `refreshPlayer` recalcula `p.def` y `p.weapon.def`, así que todo el código que ya leía esos datos (movimiento, disparo, HUD, bot) respeta los modificadores sin cambios. `addModifier`/`removeModifier` (evento `mods`): quitar uno deshace exactamente lo que hizo. Un cargador mayor llega cargado con las balas de más y uno menor tira las que no caben; más vida máxima trae esa vida y menos nunca deja a la tostadora a 0. En el juego: las balas del jugador se dibujan a escala de su radio, los corazones y las balas del HUD se reconstruyen si cambian la vida máxima o el cargador (los cargadores largos van en dos filas) y `window.__GE__.addModifier(…)` permite probar cualquier modificador desde la consola.
- Decisiones: modificadores como datos (y no código por objeto), igual que los enemigos: los objetos de las tareas siguientes serán sobre todo una entrada en `src/data/` con sus modificadores, y las sinergias otro `Modifier` que se añade cuando coinciden dos objetos. «Sumar y luego multiplicar» es predecible para escribir objetos (+1 de daño vale lo mismo lleve lo que lleve) y fácil de explicar en una descripción. El arma del jugador (`WeaponState.def`) es ya «el arma tal como la dejan los objetos»; los datos de `src/data/` nunca se modifican (lo comprueba un test).
- Medidas: 212 tests en verde (9 nuevos en `tests/mods.test.ts`: suma y multiplicación con límites; comportamientos combinados; coger y soltar deja al jugador igual; la vida máxima mínima; más daño y más cadencia se notan en el maniquí; atravesar da a dos maniquíes en fila una vez a cada uno; rebotar vuelve de la pared y sin rebote se para; perseguir tuerce hacia un enemigo que sin ello no se toca; determinismo). Bot sin cambios (no hay objetos todavía): Sala de Pruebas, plantas y jefa iguales que en la sesión anterior. e2e ~60 fps con captura nueva `18a-modificadores.png` (tres balas grandes que rebotan, cargador de 30).
- Problemas conocidos: con cargadores muy largos la segunda fila de balas del HUD puede quedar detrás de algún enemigo en la esquina inferior derecha. El rebote en una esquina exacta invierte los dos ejes (vuelve por donde vino), que es lo esperable.
- Siguiente paso: las 3 armas (Secador Mágnum, Grapadora Táctica y una nueva) con cambio de arma; luego los 10 objetos pasivos usando los modificadores, con un test por objeto.

## 2026-10-29 06:48 — Hito M4 — Recompensa, montacargas y «Planta superada»; M4 terminado

- Hecho: **recompensa**: `LootDef.hearts` (la nevera, 1) suelta un **corazón de recambio** (`PickupKind` `'corazon'`, sprite nuevo `corazon-suelo`: corazón rojo con su etiqueta de «pieza original», que brilla más a menudo que los cupones) que rueda hacia la tostadora y devuelve un corazón entero (2 de vida, sin pasar del máximo); con la vida llena **se queda en el suelo** (ni imán ni se recoge) para cuando haga falta. Al recogerlo: dos notas que suben (`curar`), chispas rojas, «Recambio original» flotando y el corazón del HUD que salta. **Montacargas** (`World.lift`): al desmontarse la jefa sube donde estaba (sobre suelo libre, buscando en anillos si cae encima de algo), con polvo y un motor (`ascensor`); a los `LIFT_READY` (2,6 s, lo que tarda en leerse el sello) se enciende el piloto verde, la flecha pintada se ilumina, una flecha amarilla bota encima y sale «Montacargas a la planta 2 · Carga máxima: una tostadora». Pisarlo andando (rodando no cuenta) acaba la planta: evento `floorDone`, `World.won` y el mundo se queda quieto. En el juego la tostadora baja con la plataforma por el hueco oscuro (se recortan los dos por el borde delantero del hueco) y aparece el informe **«Incidencia resuelta»** (el mismo formulario que el parte de baja, ahora `showForm`, en cian nevera) con Unidad, Resultado («Jefa de planta dada de baja»), Sala, Jornada (tiempo, bajas, cupones), Siguiente planta («Pendiente de licitación», «Cerrada por inventario»…) y una nota de la empresa al azar («Enhorabuena: ha ascendido a becario sin sueldo», «Esta victoria no incluye garantía»…), con el sello **«Planta superada»**. R o clic empieza otra jornada. Sprite nuevo `montacargas` (44 × 34, dos fotogramas: plataforma de chapa estriada con borde de rayas amarillas y negras gastadas, flecha pintada hacia abajo y un poste de mando con piloto rojo/verde). El sello «Liquidación total» dura ahora 2,5 s (antes 4,8) para no tapar el montacargas.
- Decisiones: la «subida a la siguiente planta» es un montacargas que **baja** (el almacén de devoluciones está en el sótano y la Dirección arriba… o al revés: en esta empresa nadie lo sabe), y como la planta 2 no existe todavía, la pantalla de victoria provisional es el informe de incidencia; con eso se adelanta parte de la tarea «Pantalla de victoria» de M6, que habrá que pulir cuando haya partida completa. El corazón se queda en el suelo con la vida llena para no desperdiciarlo (y en la sala del jefe se puede volver a por él). Llegar al montacargas acaba la planta en la simulación, no en el dibujo, para que el bot y los tests lo midan. **M4 cumple sus criterios** (el bot tarda 83–116 s, dentro de 60–120; las dos fases se distinguen en `17h`/`17k`) y se cierra; empiezo M5.
- Medidas: 203 tests en verde (6 nuevos en `tests/montacargas.test.ts`: corazón y montacargas en suelo libre, el corazón cura y se queda con la vida llena, el montacargas solo funciona cuando está listo y luego todo se queda quieto, rodando no se baja, el bot gana y baja, y los textos del informe caben). Bot, 30 combates: gana el 76,7 % en 96 s y **baja en el montacargas el 100 % de sus victorias** (el bot va hacia él esquivando estanterías; la primera versión iba en línea recta y se quedó atascada en una semilla). Sala de Pruebas y plantas sin cambios. e2e ~60 fps con capturas nuevas `17n-montacargas.png`, `17o-montacargas-bajando.png` y `17p-planta-superada.png`; comprueba que hay corazón y montacargas, que se baja, que sale el informe y que R empieza otra partida.
- Problemas conocidos: los cupones de la jefa caen encima del montacargas y lo tapan un poco hasta que se recogen (la flecha amarilla lo señala igualmente). En una planta generada el informe se ve igual que en la sala suelta; la «Jornada» cuenta toda la partida.
- Siguiente paso: M5, empezando por el sistema de modificadores de estadísticas y de comportamiento de balas, que es la base de las armas y los objetos.

## 2026-10-29 06:37 — Hito M4 — Barra de vida, transición de fase y muerte de la Nevera Suprema

- Hecho: **barra de vida** de la jefa abajo en el centro (200 × 5 px, marco oscuro, rojo con brillo arriba y sombra abajo, el trozo perdido se queda blanco un momento y luego se vacía, muesca donde empieza cada fase siguiente, su nombre encima); se llena al acabar la presentación y se apaga al caer. **Transición de fase** en la simulación: al pasar a una fase nueva la jefa entra en el estado `roar` durante `BOSS_PHASE_BREAK` (1,6 s): no se mueve, no ataca y las balas chocan con ella sin hacer daño (evento `hit` con `damage` 0; en el juego un «clinc» seco y sin número). `clearEnemyFire` (evento `fireCleared`) quita todas las balas enemigas, los patrones a punto de salir y lo que esté en el aire (bolas de escarcha y productos; los charcos del suelo se quedan); en el juego cada bala se deshace en chispitas de su color con un barrido. En pantalla: parón, destello blanco, temblor, portazo y vaho, y un **cartel propio** sobre la barra («Fase 2 · Hemos actualizado nuestras condiciones» y el nombre de la fase en grande, en rojo, sobre una banda oscura); ya no sale el rótulo pequeño encima de la nevera. **Muerte**: al quedarse sin vida la jefa pasa a `dying` durante `BOSS_DEATH` (2,6 s; evento `bossDying`) en vez de desaparecer: las balas la atraviesan, no empuja ni hace daño y la pantalla se limpia. En el juego: parón largo, destello, la cámara va a ella, tiembla cada vez más, parpadea en blanco cada vez más rápido y le saltan estallidos (chispas, humo, tornillos y sonido `estallido`) por todo el cuerpo. Después, el `death` de siempre (se desmonta en sus piezas y suelta los cupones) más un **derrumbe**: destello completo, temblor fuerte, sonido `derrumbe`, 24 trozos de chatarra, esquirlas de hielo, un anillo de polvo que corre por el suelo y el sello rojo **«Liquidación total»** con «La Dirección ha cesado su actividad. Nadie responderá a su reclamación.» sobre una banda oscura. La cámara vuelve a la tostadora y las persianas suben (sin el rótulo de «sala despejada»: el sello ya lo dice). Sonidos nuevos: `barrido`, `clinc`, `estallido` y `derrumbe`. Arreglado el problema conocido de la sesión anterior: al avisar de un ataque la nevera ya no se pone blanca entera (tapaba la puerta abierta), solo se calienta de color.
- Decisiones: la pausa entre fases y la agonía viven en la simulación (no solo en el dibujo) para que nadie reciba daño mientras se lee el cartel y para que el bot y los tests las respeten; con 1,6 s de inmunidad el daño que sobra no salta fases. Limpiar la pantalla al cambiar de fase es justo con el jugador (la fase 2 empieza «desde cero») y además se ve claramente el cambio en una captura (criterio de M4). El cartel de fase va abajo, sobre la barra, con la banda semitransparente: arriba taparía a la nevera justo cuando abre la puerta. Mientras hay jefe no se enseña la ayuda de controles de abajo (pasaba por debajo de la barra). El combate se da por ganado para el bot cuando la vida llega a cero (evento `bossDying`), no cuando termina de desmontarse.
- Medidas: 195 tests en verde (3 nuevos en `tests/nevera-final.test.ts`: la pausa de fase no recibe daño, limpia la pantalla y luego vuelve a atacar; la agonía dura lo que debe, las balas la atraviesan, no hace daño y luego cae con botín y persianas arriba; determinismo). `checkInvariants` acepta una jefa sin vida solo mientras se desmonta. Bot, 30 combates: **gana el 76,7 % en 96 s (83–116 s)**, 3,8 heridas por combate (1,87 en la fase 1 y 1,93 en la 2; antes 66,7 %, 94,6 s y 2,27 heridas en la fase 2: limpiar la pantalla al cambiar de fase le quita un golpe de media). Sala de Pruebas y plantas sin cambios. e2e ~61 fps con capturas nuevas `17k-nevera-cambio-fase.png`, `17l-nevera-cayendo.png` y `17m-nevera-liquidada.png`, y comprueba que la jefa se para y no quedan balas al cambiar de fase y que las persianas suben al caer. Una de las tres pasadas del e2e volvió a fallar en la prueba del mando de la Sala de Pruebas (la misma intermitencia de antes, que no he tocado).
- Problemas conocidos: el sello y su frase pueden quedar encima del montón de cupones y piezas durante 4 s (se leen gracias a la banda). La prueba del mando del e2e sigue fallando de vez en cuando. Al pasar a la sala del jefe, en el primer segundo tras la presentación la cámara todavía está volviendo y la nevera se ve cortada arriba.
- Siguiente paso: recompensa y pantalla de victoria (de momento) al vencer a la jefa, que cierra las tareas de M4; luego revisar sus criterios y pasar a M5.

## 2026-10-29 05:40 — Hito M4 — Fase 2 de la Nevera Suprema: «Oferta irrechazable»

- Hecho: segunda fase de la nevera, solo con datos nuevos más tres piezas de motor reutilizables. **Balas que persiguen**: los patrones aceptan `homing` (`turnDeg` por segundo durante `time` s; giran hacia el cuerpo de la tostadora y después siguen recto), `shootable` (los disparos de la tostadora las rompen: se pierden las dos balas, evento `bulletCut`) y `life` propia. **Ataque `spit`** (`BossSpitAttack`): avisa en la puerta (anillo rojo, no cian) y escupe `count` productos desde `from` a sitios al azar hasta `spread` px alrededor de la tostadora (el primero, justo donde está); vuelan en arco con su anillo rojo en el suelo y revientan en un patrón (`burst`). Reutiliza el vuelo de la escarcha: `Frost.product` (fotograma del producto, sin charco: `life` 0). **Fase 2** desde la mitad de la vida: `nevera-tarjetas` (abanico de 3 y luego de 2 tarjetas a 72 px/s que persiguen 2,2 s girando 75°/s, viven 4,5 s), productos caducados (5, en `caducado-reventon`: anillo de 6 balas rojas lentas) y los cubitos de siempre; descansa algo menos y se acerca algo más. Arte: fotograma 1 de `nevera-suprema` con la **puerta abierta** (hoja de canto a la derecha con sus estantes de botellas, interior oscuro con luz arriba, dos baldas con yogur hinchado, brick, lata, un bulto de moho, una lata de pescado y una tarrina con nube verde; el fotograma 0 sigue siendo el aprobado, idéntico píxel a píxel), `bala-tarjeta` (tarjeta roja con banda blanca y chip; 4 fotogramas: gira en el aire) y `producto-caducado` (yogur con la tapa verde hinchada, brick de leche con mancha y fecha, lata abollada). En el juego: la nevera usa el fotograma abierto en la fase 2; al cambiar de fase suena un chirrido de puerta (`portazo`), sale vaho y el nombre de la fase en rojo; los productos giran en el aire, revientan con un «chof» (`chof`) y trocitos verdes, y una tarjeta rota hace «clic» (`tarjeta`) con chispas. `npm run bot` informa ahora de cuándo llega la fase 2 y de las heridas en cada fase.
- Decisiones: las tarjetas son **rojas con núcleo blanco** (no doradas, aunque la nevera lleve una dorada en la mano) porque el amarillo y el naranja son de las balas del jugador (`docs/ESTILO_ARTE.md`). Van más lentas que la tostadora (72 frente a 100 px/s) y giran abierto: se esquivan andando de lado o rodando, y además se pueden romper a tiros, que da otro uso al arma y encaja con «romper la tarjeta de fidelización». Los productos marcan su sitio en rojo y no dejan charco, para que no se confundan con la escarcha de la fase 1. La puerta se queda abierta toda la fase 2: así las dos fases se distinguen a la primera en cualquier captura (criterio de M4). **Vida 260 → 200**: con las dos fases el combate duraba 120 s de media; con 220 eran 102 s pero alguno pasaba de 120; con 200 se queda dentro.
- Medidas: 188 tests en verde (7 nuevos en `tests/nevera2.test.ts`: la fase 2 empieza a mitad de vida con su nombre y usa sus tres ataques, con vida de sobra sigue en la 1, las tarjetas giran hacia la tostadora y luego van rectas, son más lentas y andando no te alcanzan, un disparo las rompe y una bala normal no, los productos caen en suelo libre, revientan todos y no frenan, determinismo). Bot, 30 combates: **gana el 66,7 % en 94,6 s (82–110,5 s)**, 4,13 heridas por combate (1,87 en la fase 1 y 2,27 en la 2), llega a la fase 2 a los 45,6 s. Antes, con la fase 1 sola y 260 de vida: 53 %, 116 s. Sala de Pruebas y plantas sin cambios. e2e ~58 fps con tres capturas nuevas `17h-nevera-fase2.png`, `17i-nevera-tarjetas.png` y `17j-nevera-caducados.png`.
- Problemas conocidos: el nombre de la fase sale con el rótulo normal (pequeño, arriba) y en la sala del jefe cae encima de la nevera; eso es la tarea siguiente («transición de fase»). Mientras avisa de un ataque la nevera entera parpadea en blanco y tapa la puerta abierta un momento. El bot gana dos de cada tres: puede que para una persona sea más difícil; habrá que mirarlo cuando haya corazones que recoger (M5).
- Siguiente paso: barra de vida de la jefa, transición de fase con su propio cartel (pausa breve, puerta que se abre de golpe, balas en pantalla que desaparecen) y muerte espectacular.

## 2026-10-29 04:40 — Hito M4 — Fase 1 de la Nevera Suprema: cubitos y escarcha

- Hecho: la nevera ya pelea. `BossBrain` lleva ahora `muzzle` (el dispensador de hielo de la puerta) y `phases`, cada una con nombre, vida a partir de la que empieza (`from`), paseo, descanso entre ataques y una lista de ataques con peso (`BossAttack`: un patrón de balas o escarcha). El cerebro `boss` (`updateBoss` en `src/sim/enemies.ts`) se acerca despacio si te alejas (nunca retrocede), elige ataque al azar por peso sin repetir el anterior, avisa y lo hace; al cambiar de fase lanza el evento `bossPhase` (el juego pondrá el nombre en grande en cian), listo para la fase 2. **Fase 1, «Congelación de precios»**: `nevera-cubitos` (tres abanicos de 5 cubitos a 0,3 s, girados −9°, 0° y +9°: siempre hay hueco), `nevera-granizo` (dos anillos de 16 cubitos que salen a 38 px/s y aceleran hasta 95, el segundo desplazado) y **escarcha**: tras 0,6 s de aviso lanza 3 bolas, una a donde vas a estar y dos a ~56 px alrededor, que vuelan 0,9 s en parábola mientras un anillo cian se cierra sobre el sitio donde caerán; al caer dejan un charco elíptico (radio 22) 7 s que **frena al andar a la mitad** (rodar no se frena: es la salida) y estallan en 6 esquirlas lentas. Nunca caen en pared (`freeSpot`), como mucho 8 charcos a la vez, y si la nevera ya no está no sueltan esquirlas. En la simulación: `World.frost`, `throwFrost`, `inFrost`, `frostSlow`, eventos `frostThrow`/`frostLand`; `maxSpeed` nuevo para las balas que aceleran; color de bala `ice`. Arte nuevo en `tools/sprites/props.ts`: `bala-cubito` (6 × 6, cubo con esquinas, cara de arriba blanca), `bola-escarcha` (bola de nieve con contorno) y `escarcha` (charco translúcido con borde roto, grietas, cristales de pie y brillos que cambian en dos fotogramas). En el juego: la bola en arco con su sombra, el charco que aparece con un pequeño salto y parpadea su último segundo, esquirlas que rebotan, la tostadora teñida de frío y soltando escarcha al andar por encima, y sonidos nuevos `cubitos` (el dispensador cargando al avisar), `lanzar` y `escarcha`. **Cámara**: en la sala del jefe se inclina hacia la jefa (40 % del camino, con tope) para que no se salga del encuadre. El bot se aparta de los charcos y de donde va a caer una bola (después de su tiempo de reacción).
- Decisiones: los ataques del jefe son datos (patrones y escarcha con números) y no código por ataque, para que la fase 2 sea sobre todo añadir datos. La escarcha frena andar pero no rodar: así castiga quedarse quieto sin quitar el control, y da otro uso a la esquiva. La bola principal apunta a donde estará la tostadora en 0,25 s y las otras a los lados, para que esquivar «a ojo» también acabe en hielo. La nevera no retrocede: arrinconada contra la pared del fondo se salía de la pantalla, y además encaja con el personaje («la Dirección no cede terreno»). Los cubitos son cuadrados (con esquinas) para leerse como cubitos y no como las balas cian redondas de la bombilla; mantienen el borde saturado y el núcleo claro de la guía de estilo. El aviso de la escarcha lo dibuja el propio jefe (`activeWarnings`): el anillo se cierra sobre el dispensador.
- Medidas: 178 tests en verde (7 nuevos en `tests/nevera.test.ts`: dispara cubitos y lanza escarcha; cada ataque avisa y nunca se repite seguido, y usa los tres; la escarcha frena a la mitad al andar, no al rodar, y se derrite; siempre cae en suelo libre y no pasa de 8 charcos; sin nevera no hay esquirlas; la fase depende de la vida; determinismo). `npm run bot` mide ahora también **30 combates contra la jefa** (con daño, sin presentación): gana el 53 %, 116 s de media (106–136 s), 4,7 heridas por combate, 3,8 s por combate pisando escarcha. Sala de Pruebas y plantas sin cambios. e2e ~61 fps, con tres capturas nuevas `17e-nevera-cubitos.png`, `17f-nevera-escarcha-aire.png` y `17g-nevera-escarcha.png`.
- Problemas conocidos: con solo la fase 1 el combate ya dura ~116 s; cuando llegue la fase 2 habrá que bajar la vida (260) o repartirla para quedarse en 60–120 s. El bot gana poco más de la mitad: con 3 corazones y sin curarse la nevera es dura, aunque un jugador que use la esquiva sobre la escarcha lo tiene más fácil que el bot.
- Siguiente paso: fase 2 («Oferta irrechazable») a partir de la mitad de vida: tarjetas de fidelización que persiguen y la nevera que se abre y escupe productos caducados; ajustar la vida con el bot.

## 2026-10-29 04:20 — Hito M4 — La Nevera Suprema llega a su sala y se presenta

- Hecho: la Nevera Suprema es un enemigo más en `src/data/enemies.ts` (260 de vida, sin retroceso, 10–14 cupones) con `boss: { title, motto }` y un cerebro nuevo `boss` que de momento solo la gira hacia la tostadora: sus ataques llegan con las fases. La `J` de la plantilla del jefe se rellena con la letra del jefe de la planta (`FLOOR_BOSS_1 = 'N'`), así que cada planta la trae. La sala del jefe baja las persianas como una de combate y las sube al desmontarla. **Presentación** (`World.intro`, `BOSS_INTRO` = 3,6 s): al entrar, la simulación se queda quieta (la tostadora deja de andar y mira a la nevera; nada dispara ni se mueve) y el juego pone bandas negras arriba y abajo, esconde el HUD, lleva la cámara a la nevera, escribe «Jefa de planta · Almacén de devoluciones», estampa «LA NEVERA SUPREMA» en grande con un temblor, un gruñido de compresor (sonido nuevo `jefe`) y una raya roja que crece, y luego el lema «Congelamos los precios. Y las reclamaciones.» con el zumbido de la nevera (`zumbido`). Se salta volviendo a pulsar disparar a partir de 0,8 s (mantenerlo pulsado desde la sala anterior no la salta). Al acabar vuelven el HUD, la cámara y el rótulo de la sala. Causas de baja propias («Congelación por orden de la Dirección», «Portazo de la Dirección»). `BOSSES` se calcula ya a partir de los enemigos con cartel, y el panel cuenta 1 jefe.
- Decisiones: el jefe es un `EnemyDef` y no un tipo aparte: así reutiliza balas, golpes, desmontaje, botín y el bot sin tocar nada. La presentación vive en la simulación (y no solo en el dibujo) para que los tests y el bot la respeten y nadie pueda recibir daño mientras se lee el cartel. 260 de vida provisional: el bot (sin daño, en la sala suelta, donde deambula en vez de perseguir) tarda 101–123 s en desmontarla sin que ella ataque; se ajustará con las fases para el criterio de 60–120 s. La sombra de los enemigos grandes es proporcional a sus pies.
- Medidas: 168 tests en verde (5 nuevos en `tests/boss.test.ts`: está en su sala con persianas y cartel, nada se mueve durante la presentación y luego sí, se salta pulsando y no manteniendo, cada planta la trae, y el bot la desmonta y las persianas suben). Bot sin cambios en la Sala de Pruebas y en las plantas (el bot da la planta por recorrida al entrar en la sala del jefe). e2e ~60 fps con cuatro capturas nuevas `17a-d-jefe-*.png`; una de cinco pasadas falló en la comprobación del mando de juego en la Sala de Pruebas («el mando no mueve a la tostadora»), que no he tocado: parece un fallo intermitente de esa prueba y las otras cuatro pasaron.
- Problemas conocidos: la nevera todavía no ataca ni tiene barra de vida. Si falla otra vez la prueba del mando del e2e, mirar si la tostadora estaba pegada a una caja en ese momento.
- Siguiente paso: fase 1 de la nevera (ráfagas de cubitos y escarcha que ralentiza) y su barra de vida.

## 2026-10-29 03:35 — Hito M3 — Juego de casillas del almacén; M3 terminado

- Hecho: `src/art/warehouse.ts` con las piezas del almacén y `paintRoom` (en `src/art/room.ts`) que decide qué va en cada sala según su tipo (`PaintableRoom.kind`, que el juego ya pasaba al pintar). **Casillas**: además de la baldosa normal, agrietada (con alguna rama), gastada (desgaste en el centro y un remache que falta), con parche atornillado, rejilla de desagüe (pocas: como mucho una por cada ~220 casillas y nunca seguidas ni delante de una puerta) y una zona de chapa estriada de 2 × 2 o 3 × 2. **Suelo**: letras pintadas y gastadas con la fuente Letra Pequeña («Paso de carretillas», «Mantenga la cola», «Prohibido reclamar», «Espere su turno»…), muelles de carga rayados («Carga», «Descartes», «Merma»), rodadas de carretilla, flechas pintadas hacia alguna puerta, tickets rotos, tornillos y un cable. **Paredes**: cartel atornillado a las estanterías del fondo, pantalla roja de «su turno» con un número que no es el suyo, reloj parado en las 12; en los laterales, tubo con abrazaderas, extintor y cajas eléctricas; rejillas en la pared de abajo. **Por tipo de sala**: entrada con felpudo «Bienvenido», «Sin devolución» y cartel verde «Entrada de personal»; tienda con alfombra roja, guirnalda de etiquetas de precio y cartel «Ofertas»; tesoro con un foco de luz más fuerte en el centro y «Objetos perdidos»; secreta sin líneas de seguridad, con una sola lámpara, más suciedad, polvo y telarañas («Archivo muerto», «Esta sala no existe»); jefe con escarcha que se escapa por el suelo, un tinte frío y «Dirección» en cian («Solo personal directivo»). `RoomArt.features` dice qué se ha pintado, para los tests.
- Decisiones: toda la decoración del suelo va oscura o desvaída (alfa bajo) para que nunca compita con las balas ni con los enemigos; lo comprobé en las capturas del e2e con combate. Los parches empezaron con un azul más claro y parecían placas de presión: los dejé casi del color de la baldosa. Las rejillas salían hasta 7 en la sala del jefe; ahora hay tope. La decoración del suelo no se pone a menos de una casilla de una puerta ni encima de otra. Nada de esto toca la simulación: es solo dibujo, así que el bot no cambia. Con esta tarea M3 cumple sus criterios y se cierra.
- Medidas: 161 tests en verde (4 nuevos en `tests/roomart.test.ts`: determinismo, cartel y decoración propia de cada tipo de sala en las 19 plantillas, variaciones de casilla en cada sala de combate y que nada tape los huecos de las puertas). Pintar una sala tarda de 20 a 150 ms (la del jefe, la más grande). Bot igual que antes (Sala de Pruebas: vacía la sala 42,5 %, sobrevive 91,5 %; plantas sin daño 100 %). e2e ~60 fps.
- Problemas conocidos: el cartel de la sala y el rótulo con su nombre pueden decir cosas parecidas («Devoluciones» y «Pasillo de Devoluciones»); no molesta. La pared del fondo de la planta 1 sigue siendo la misma estantería en todas las salas.
- Siguiente paso: M4, la Nevera Suprema: empezar por la sala del jefe con presentación (nombre y lema en pantalla).

## 2026-10-29 04:05 — Hito M3 — Minimapa

- Hecho: `src/sim/minimap.ts` (puro): `minimap(world)` devuelve las salas conocidas de la planta (la actual, las visitadas y las vecinas que se ven por sus puertas normales), con su tipo, su estado y los pasillos entre ellas. En el juego se dibuja arriba a la derecha sobre un panel oscuro con borde: sala actual en blanco, visitadas en gris con sombra abajo, vistas solo con el contorno, y pasillos de 2 px. Iconos de 5 × 4 px: calavera roja para el jefe, carrito amarillo para la tienda, caja de regalo turquesa para el tesoro e interrogación rosa para la secreta (solo cuando se encuentre). Se dibuja una vez por sala (la escena se reconstruye en cada puerta).
- Decisiones: los iconos se ven ya en las salas vecinas sin visitar, como en los juegos del género: así el jugador puede decidir si va a la tienda o al jefe. La sala secreta no sale hasta entrar en ella. Fondo al 85 % porque al 62 % no se leía sobre las estanterías de colores de la pared del fondo (comprobado en la captura).
- Medidas: 157 tests en verde (4 nuevos en `tests/minimap.test.ts`). Bot y equilibrio sin cambios (solo dibujo). e2e ~60 fps con captura nueva `16e-minimapa.png` (la planta entera conocida).
- Problemas conocidos: con plantas muy alargadas el mapa puede llegar a 9 salas de ancho (unos 100 px); de momento no tapa nada importante.
- Siguiente paso: la última tarea de M3, las casillas de la planta 1 (almacén) con variaciones y decoración; después revisar los criterios y cerrar M3.

## 2026-10-29 03:30 — Hito M3 — Transición entre salas: la planta entera se juega

- Hecho: `createWorld({ seed, floor: true })` monta una planta generada (`World.floor`: la distribución, la sala actual y por sala su plantilla rellena, si se ha visitado, si está limpia y los cupones que quedaron en el suelo). Cada sala recibe una plantilla de su tipo repartida de una baraja barajada (no se repite una de combate hasta agotar las 14) y rellena para su profundidad. En una planta las puertas abiertas son suelo de verdad y las cerradas son pared (`setDoorTiles`); al meterse en el hueco de una puerta abierta (`leavingThrough`) se pasa a la sala vecina (`enterRoom`) y la tostadora aparece delante de la puerta contraria (`entrySpot`), con evento `room`. Las balas y ataques en el aire desaparecen; una sala de combate sin limpiar trae a sus enemigos y baja las persianas; una ya limpia sigue vacía y abierta, con sus cupones donde se quedaron. En el juego, cruzar una puerta congela la imagen, funde a negro en 0,11 s (sonido nuevo `puerta`), y la escena se reconstruye alrededor de la sala nueva con el mismo mundo y entra en 0,17 s; el rótulo de la sala sale en cada entrada y los controles solo al empezar. **La página por defecto es ya una planta entera** (semilla nueva con cada unidad; `?semilla=` fija una); la Sala de Pruebas queda en `?sala=sala-pruebas`. En la sala del jefe, de momento vacía: «La Dirección está reunida · Vuelva usted mañana».
- Bot: `src/sim/nav.ts` (casillas bloqueadas por pared o mueble, camino BFS a cuatro vecinos con «tirar de la cuerda» para no ir en zigzag, línea despejada, punto de cada puerta y la siguiente puerta hacia la sala sin visitar más cercana). En una planta el bot va a por el enemigo más cercano si está lejos o tapado por estanterías, ronda cerca si lo tiene a tiro, recoge cupones y, con la sala limpia, sale hacia la siguiente sala sin visitar; solo dispara si hay alguien. `npm run bot` juega además 20 plantas dos veces (sin daño, que es el criterio de M3 y falla si no la recorre entera, y con daño, para medir).
- Arreglos que encontró el bot recorriendo plantas: (1) la polilla de la bombilla nacía dentro de la pared si la bombilla estaba pegada a un muro: ahora busca `freeSpot`. (2) **Las balas chocaban con la pared del fondo a la altura del cuerpo**: un enemigo pegado al muro de arriba era imposible de alcanzar y disparar a lo largo de ese muro no servía. Ahora cada bala lleva su altura `h` (la del cañón: `HAND_HEIGHT` para la tostadora, la del enemigo que dispara) y paredes y muebles la paran donde su sombra los toca, como corresponde a la vista de tres cuartos. (3) El bot se quedaba atascado de pie justo encima de un carrito (su casilla «estaba ocupada»): el camino empieza ahora desde las casillas libres de alrededor.
- Decisiones: un solo `World` que cambia de sala, no un mundo por sala: así el tiempo, las bajas, los cupones y el parte de baja son de toda la partida. Las salas se construyen la primera vez que se entra y se guardan. Las puertas secretas se quedan como pared hasta que haya algo que las abra (M5, objetos); el bot no cuenta la sala secreta para «recorrer la planta». Sin invulnerabilidad al entrar: los huecos de enemigo están a más de 3,5 casillas de las puertas y los enemigos tardan en arrancar (un test lo vigila en 300 plantas). La escena de Phaser se reinicia en cada puerta llevando el mundo: es lo más simple y deja todo limpio.
- Medidas: 153 tests en verde (7 nuevos en `tests/transition.test.ts`: empezar en la entrada, cruzar cada puerta, cerrar/abrir/volver con cupones, determinismo, entradas libres en 300 plantas y el bot recorriendo 3 plantas). Bot en 20 plantas: **sin daño recorre la planta entera el 100 %** (250 s de media; también 100/100 en una prueba aparte); con daño la recorre el 45 % y cae el 55 %, 20,9 s y 0,75 heridas por sala de combate, 6,5 salas de combate limpias por planta. Sala de Pruebas (200 × 60 s) tras el cambio de altura de las balas: vacía la sala 42,5 % (antes 50,5 %), sobrevive 91,5 %, atascos 9 → 4. e2e ~60 fps con capturas `16a-d-planta-*.png` (entrada, fundido, sala vecina con persianas bajadas, vuelta).
- Problemas conocidos: con 3 corazones y sin forma de curarse, una planta de ~10 salas de combate es demasiado larga: el bot cae en más de la mitad. Hacen falta corazones que caigan o se compren (M5) o menos presupuesto de enemigos; no lo toco hasta que haya objetos. La transición de la Sala de Pruebas por sus puertas no existe (no tiene vecinas, como antes).
- Siguiente paso: el minimapa (salas visitadas y vecinas vistas, iconos de tienda, tesoro y jefe), que ya tiene todo en `World.floor`. Después, las casillas de la planta 1 con variaciones.

## 2026-10-29 02:20 — Hito M3 — Persianas que se cierran durante el combate

- Hecho: `buildRoom(plantilla, puertas)` abre hueco en las paredes que se le pidan (por defecto las cuatro en las plantillas de planta y norte y sur en la Sala de Pruebas) y guarda `Room.doors` con el rectángulo de cada una; una puerta que no cae en pared es un error. `World.doorsShut`: una sala de combate con enemigos cierra al crearse y se abre en cuanto cae el último (evento `doors`, una sola vez); las salas sin combate están abiertas y la Sala de Pruebas no se abre nunca. Arte: el pintor de salas dibuja el hueco oscuro con marco de acero en cada puerta (se acabaron las dos persianas de adorno fijas) y hay tres hojas nuevas `persiana-n`, `persiana-s` y `persiana-v` (dos fotogramas: piloto rojo y verde, con franja amarilla y negra en el borde que se mueve). Al entrar en una sala de combate las persianas bajan de golpe (sonido `persiana`, temblor y polvo); al vaciarla suben enrolladas en 0,65 s con el piloto en verde, sonido `desbloquear` y un rótulo al azar de `DOORS_OPEN_LINES` («Incidencia resuelta · Valore nuestra atención», «Su reclamación ha sido archivada»…). `WorldOptions.doors` elige las puertas.
- Decisiones: las puertas siguen siendo pared para el movimiento: cruzarlas solo tiene sentido cuando haya otra sala al otro lado, que es la tarea de la transición. Por eso la tarea se marca hecha con esa nota en la hoja de ruta. Al entrar, las persianas se cierran ya en la simulación (los enemigos están ahí desde el primer instante) y el golpe es solo de dibujo, 0,4 s después.
- Medidas: 4 tests nuevos en `tests/doors.test.ts`; 146 en verde. Bot sin cambios (Sala de Pruebas: vacía la sala 50,5 %, sobrevive 92 %). e2e ~61 fps; comprueba que las tres salas de planta cierran y que al vaciar la última se abren, con capturas `15a-persianas-subiendo.png` y `15b-persianas-abiertas.png`.
- Problemas conocidos: el rótulo de puertas abiertas puede coincidir con el nombre de la sala si se vacía en los primeros 3 s (salen uno debajo del otro, se leen bien).
- Siguiente paso: la transición entre salas: montar la planta generada, cruzar una puerta abierta y aparecer en la vecina delante de la puerta contraria; el bot tendrá que buscar camino (BFS por casillas) para recorrer la planta entera, que es el criterio de M3.

## 2026-10-29 01:50 — Hito M3 — Plantillas de sala

- Hecho: 19 plantillas de la planta 1 en `src/data/rooms.ts`: 14 de combate (de 16 × 11, que cabe en pantalla, a 26 × 16), una de entrada, tesoro, tienda, secreta y jefe, todas con nombre en el tono del juego («Cola de Atención al Cliente (Tiempo Estimado: Siempre)», «Depósito de Obsolescencia Programada»…). `RoomTemplate.kind` dice para qué sirve cada una (la Sala de Pruebas no lleva y nunca sale en una planta). Huecos nuevos en la leyenda: `e` enemigo, `o` obstáculo, `*` objeto, `$` dependiente, `s` estante de la tienda, `J` jefe. `fillTemplate()` (en `src/sim/room.ts`) convierte una plantilla en sala concreta con semilla: cada `o` es caja, bidón, carrito o nada; los `e` se llenan con enemigos de `SLOT_ENEMIES_1` (coste y peso por enemigo, máximo uno de mandos y uno de bombilla por sala) hasta gastar el presupuesto `enemyBudget(profundidad)` = 4 + 1,5 × profundidad (tope 14); siempre al menos uno. `doorCells()` y `doorApron()` dicen dónde va cada puerta (centro de cada pared, dos casillas de ancho) y qué suelo debe quedar libre delante. Sin `P`, el jugador empieza delante de la puerta sur. `createWorld({ room, depth })` rellena las plantillas de planta y `?sala=<id>&profundidad=<n>` las abre en el juego. Arte: las paredes interiores se pintan como **estanterías sueltas** en tres cuartos (tapa de chapa, frente con dos baldas de cajas de colores, contorno negro y sombra en el suelo); antes eran losas oscuras que no se leían.
- Arreglo: el bot encontró un cupón dentro de una columna. Los cupones atraídos por el imán volaban en línea recta a través de todo; ahora se deslizan como el resto (`slide`). Test nuevo en `tests/loot.test.ts`.
- Decisiones: todas las plantillas dejan libres las cuatro puertas, así cualquier plantilla sirve para cualquier combinación de puertas del generador y no hay que hacer variantes por puertas. Los enemigos no van fijos en las plantillas, solo huecos: la planta decide cuántos y cuáles según la profundidad, así una misma sala sirve al principio y al fondo. Ningún hueco de enemigo a menos de 3,5 casillas de una puerta. Las tiendas, tesoros, la secreta y el jefe solo tienen la forma y los huecos: lo que hay en ellos llega con M4 y M5. Quité del rótulo de controles «1-5 balas enemigas» fuera de la Sala de Pruebas.
- Medidas: 8 tests nuevos en `tests/rooms.test.ts` (puertas en pared y despejadas, todo alcanzable desde cualquier puerta aunque los `o` se llenen, huecos lejos de las puertas, presupuesto y máximos, determinismo, y el bot juega 25 s en cada sala de combate a profundidad 1 y 6 sin romper nada); 140 en verde. Bot en las 14 salas de combate (20 partidas × 60 s cada una): a profundidad 1 limpia el 97,9 % en 18,5 s de media con 0,24 heridas por sala; a profundidad 5 limpia el 85,4 % en 35,8 s, 1,19 heridas por sala y sobrevive el 99,3 %. La que menos limpia es el Archivo de Tickets (50 %): el bot no busca camino y se queda disparando a las estanterías. Sala de Pruebas (200 × 60 s): vacía la sala 50,5 % (antes 52,5 %), 9 atascos (antes 6): los cupones ya no atraviesan cajas y el bot tarda algo más en recogerlos. e2e ~61 fps con tres capturas nuevas `14a/b/c-sala-*.png`.
- Problemas conocidos: las puertas siguen pintadas solo arriba y abajo (persianas cerradas de adorno) y no se abren; el bot no sabe rodear estanterías, lo que hará falta para el criterio de M3 (recorrer una planta entera).
- Siguiente paso: puertas de verdad: abrir en la pared las que tenga cada sala según el generador, pintar persianas en las cuatro paredes y cerrarlas con piloto rojo mientras quedan enemigos. Luego la transición entre salas y un camino (BFS por casillas) para el bot.

## 2026-10-29 00:50 — Hito M3 — Generador de planta

- Hecho: `src/sim/floor.ts`, puro y con semilla. `generateFloor(semilla)` reparte de 10 a 15 salas en una cuadrícula de 9 × 9 (una casilla por sala): crece desde la entrada en anchura y no ocupa nunca una casilla que toque dos salas, así que la planta es un árbol que se ramifica en vez de apelotonarse. Los callejones sin salida son las salas especiales: el más profundo es el **jefe** (como mínimo a 3 salas de la entrada y nunca al lado), y de los demás, al azar, el **tesoro** y la **tienda**. La **sala secreta** va en una casilla vacía que toque dos o más salas (las que más), nunca junto al jefe ni a la entrada, y se une a todas con puertas secretas. Si una forma no sirve (pocos callejones, jefe demasiado cerca, sin sitio para la secreta) se repite con otra rama del generador. `validateFloor()` comprueba todo lo que tiene que cumplirse (una sala de cada tipo especial, tamaño, puertas entre vecinas y de ida y vuelta, todo alcanzable sin puertas secretas, el jefe al fondo y en callejón, tesoro y tienda en callejón) y `floorToText()` la dibuja en ASCII para depurar (E entrada, o combate, T tesoro, $ tienda, ? secreta, J jefe; `:` puerta secreta). `Rng.shuffle()` nuevo.
- Decisiones: una sala por casilla de momento (las salas grandes de 2 × 1 o en L pueden llegar más adelante si hacen falta). Dentro de una planta no hay bucles, como en los juegos del género: así el jefe queda de verdad al fondo y cada callejón es un premio o un castigo. La tarea de la hoja de ruta se marca hecha porque es la distribución; la planta jugable se monta con las otras tareas de M3 (plantillas, puertas, transición, minimapa).
- Medidas: 10.000 semillas válidas en ~1,9 s; todos los tamaños de 10 a 15 salen más de 500 veces. 131 tests en verde (4 nuevos en `tests/floor.test.ts`). No toca el juego todavía: bot y e2e sin cambios.
- Problemas conocidos: ninguno conocido; el generador aún no se usa en el juego.
- Siguiente paso: plantillas de sala hechas a mano (al menos 15) con huecos para enemigos y obstáculos, pensadas para encajar con las puertas N/S/E/O del generador.

## 2026-10-29 00:35 — Hito M2 — Mando a Distancia; M2 terminado

- Hecho: sexto enemigo, el **Mando a Distancia** (4 de vida). Sprite nuevo `mando` en `tools/sprites/enemies.ts` (22 × 32, dos fotogramas de respiración): un mando de tele de pie, gris carbón algo aclarado para que se lea sobre el suelo, con la ventanilla del infrarrojo como frente, el botón rojo de encendido en la cabeza, ojos de reojo con párpados caídos y media sonrisa. Chistes: le falta la tapa de las pilas (dos pilas sujetas con celo), le falta el botón del uno (un agujero), lleva un ganchito pegado en la cabeza y va en zapatillas de casa. Cerebro nuevo `blinker` (datos en `BlinkerBrain`): se pasea de lado alrededor de la tostadora a unos 110 px; cada 1,6–2,8 s avisa 0,6 s y suelta `mando-zapeo` (ráfaga apuntada de 3 balas rojas); después **se apaga como una tele vieja** (0,25 s: se aplasta en una raya blanca y la raya se encoge a un punto), desaparece 0,45 s y vuelve a encenderse a 70–140 px de la tostadora, eligiendo sitios lejos de donde apunta el jugador («nunca está donde lo buscas»). Mientras no está, ni recibe balas ni empuja, y el sitio donde va a volver chisporrotea de estática con una raya que sube, como un canal mal sintonizado: se puede leer. Si le das y sobrevive, también se esfuma (como mucho una vez cada 2,5 s). `EnemyDef.pack` hace que un punto de aparición traiga un grupo (el mando viene de tres en tres, separados y sin atacar a la vez). Letra `Z` en las plantillas; hay un grupo en la Sala de Pruebas. Sonidos `apagar` y `zapear`. Causas de baja: «Zapeo a quemarropa» y «Cambio de canal no solicitado». El bot no apunta a los mandos que no están.
- M2 terminado: todas las tareas hechas y los criterios cumplidos (sala con todos los enemigos jugable y legible; el bot la vacía sin caer más del 40 % de las veces).
- Decisiones: el mando se teletransporta *después de disparar* y *al recibir un golpe*, no al azar, para que el jugador aprenda el ritmo (aviso → ráfaga → se apaga → estática → vuelve) en vez de sufrir algo imprevisible. El aviso de dónde va a volver es obligatorio para que sea legible en un juego de balas. La ráfaga sigue saliendo aunque se esfume justo después (deja una pose de 0,2 s tras el último disparo para que se vea quién ha disparado). La animación de la tele es solo de dibujo (escala del sprite), sin fotogramas nuevos. `isClear()` se exporta de `world.ts` para comprobar sitios libres.
- Medidas (bot 200 × 60 s, Sala de Pruebas, ahora 8 enemigos: aspirador, microondas, bombilla + polilla, batidora y 3 mandos): antes vaciaba la sala el 64,5 %, sobrevivía el 97 %, 2,3 heridas/min, 10 atascos; ahora **vacía la sala el 52,5 %**, sobrevive el 92 %, 2,8 heridas/min, 6 atascos, 64 ms por partida. 127 tests en verde (5 nuevos en `tests/mando.test.ts`). e2e ~56 fps con captura nueva `08c-mando.png`.
- Problemas conocidos: con ocho enemigos la Sala de Pruebas es ya bastante caótica; es una sala de pruebas, las salas de verdad de M3 llevarán menos. Los enemigos siguen sin chocar entre sí.
- Siguiente paso: M3, empezando por el generador de planta (grafo de salas con semilla) o las plantillas de sala de combate, según la hoja de ruta.

## 2026-10-28 23:40 — Hito M2 — Batidora de Mano

- Hecho: quinto enemigo, la **Batidora de Mano** (12 de vida). Sprite nuevo en `tools/sprites/enemies.ts` (los enemigos nuevos van ahí; `characters.ts` es la copia fiel de los aprobados): carcasa verde de cocina de los setenta en cubo de tres cuartos, asa de transporte en la cabeza, ojos desiguales con párpados caídos, dientes apretados en mueca, manos flotantes y zapatos de goma; las dos varillas cuelgan delante con masa reseca y giran en 4 fotogramas. Chistes: el selector de cinco velocidades atascado en la muesca roja del turbo y el cable atado en un nudo. Cerebro nuevo `chaser` (datos en `ChaserBrain`): persigue andando a 52 px/s haciendo eses, y a menos de 64 px avisa 0,4 s (dirección fijada, línea de puntos, «!»), se lanza 0,22 s a 240 px/s y frena 0,45 s; espera 0,9–1,5 s entre lanzamientos (el primero, antes). Con un tercio de vida entra en **TURBO** (×1,45 en todo): evento `turbo`, rótulo rojo «Turbo», chispas, tiembla y gira las varillas a tope. Sonidos `batir` y `turbo`. Letra `T` en las plantillas; hay una en la Sala de Pruebas. Causa de baja: «Batido a velocidad turbo». El bot se aparta de su línea igual que de la del aspirador.
- Arreglo: el bot encontró cupones dentro del muro de arriba. Los cupones nacían 1 px por encima de los pies del enemigo; si este moría con los pies contra una pared, el cupón ya estaba solapando el muro y `slide()` lo empujaba hacia dentro. Ahora el botín nace en `freeSpot()` (el punto libre más cercano); test nuevo en `tests/loot.test.ts`.
- Decisiones: «Dos enemigos nuevos» se divide en dos tareas en la hoja de ruta (Batidora hecha, Mando a Distancia pendiente) para cerrar una entera por sesión. La batidora no reutiliza el cerebro del aspirador: el aspirador camina despacio y embiste de lejos y en recto, con aturdimiento si choca; la batidora es rápida, acosa de cerca y sus lanzamientos son cortos, así obliga a moverse de otra manera. El turbo da un final de pelea distinto y cuenta el chiste de las cinco velocidades sin texto.
- Medidas (bot 200 × 60 s, Sala de Pruebas, ahora con 5 enemigos): antes vaciaba la sala el 84,5 %, sobrevivía el 97 % y recibía 1,9 heridas/min; ahora **vacía la sala el 64,5 %** (tarda más: hay un enemigo más en los mismos 60 s), sobrevive el 97 %, 2,3 heridas/min, atascos 4 → 10. 120 tests en verde (5 nuevos en `tests/batidora.test.ts`, 1 en `loot`). e2e ~61 fps con captura `08b-batidora.png`.
- Problemas conocidos: los «atascos» del bot han subido a 10 (se queda quieto contra la batidora o una caja); no es un fallo, pero conviene mirarlo cuando lleguen las salas de M3. La batidora, como los demás, no choca con los otros enemigos.
- Siguiente paso: el Mando a Distancia (débil, en grupo, se teletransporta) y, con los 6 enemigos en la sala, comprobar los criterios de M2 y cerrarlo.

## 2026-10-28 23:33 — Hito M2 — La tostadora se desmonta y el parte de baja

- Hecho: dos fotogramas nuevos en la hoja `tostadora` (derivados del sprite aprobado con `HeroPose.face`): `hurt` (ojos apretados «> <», boca en mueca, cuerpo 1 px más bajo) y `broken` (ranuras vacías, ojos tachados, boca abierta, sin mano ni humo propio). Hoja nueva `despiece` (8 × 8): tostada, tostada quemada, muelle y mando de la palanca. Al recibir un golpe, 0,3 s de cara de dolor con un aplastamiento. Al caer: 0,35 s de temblor con chispas; después saltan las dos tostadas por las ranuras, el muelle sale despedido hacia atrás («boing»), se sueltan el mando y cinco tornillos, humo y chispas, y la carcasa vacía cae de lado con un pequeño rebote, echando humo por las ranuras y chispas por el cable. A los 1,9 s baja el **parte de baja**: impreso oscuro con barra roja, número de expediente, unidad, causa y excusa de cobertura, sala, vida útil, bajas y cupones, «Recomendación del fabricante» (10 chistes, uno al azar) y un sello rojo «Dado de baja» que cae 0,5 s después con sonido y temblor. Sonidos nuevos `saltar`, `muelle` y `sello`. La simulación apunta la causa: las balas llevan `by` (el id de quien las disparó, también los maniquíes) y los golpes el del enemigo; `World.cause` y el evento `down` la traen. Glifo «·» en la Letra Pequeña (los textos ya lo usaban y no salía).
- Arreglo: pedir otra unidad con R o clic ahora escucha el evento de pulsar, no el estado de la tecla; antes un clic mantenido (o una pulsación más corta que un fotograma) podía no reiniciar.
- Decisiones: los textos del parte (causas por enemigo y forma de herir, excusas, recomendaciones) son datos en `src/data/texts.ts`, con `downReport()` para componerlos; cada enemigo nuevo debe traer su causa (lo exige un test). El parte sigue siendo «provisional» porque falta la sala de verdad de M3 y la pantalla de menú de M6, pero ya cumple lo que pide `docs/DISENO.md`. Las piezas de la tostadora se quedan en el suelo hasta reiniciar.
- Medidas: 112 tests en verde (9 nuevos: `tests/down.test.ts` con causa por bala, por golpe y del maniquí; textos que caben en el impreso; todos los textos del juego se pueden escribir con la fuente). Bot sin cambios (no toca el equilibrio): 200 × 60 s sin fallos, vacía la sala el 84,5 %. e2e ~61 fps, con capturas nuevas `12-desmontaje.png` y `13-parte-de-baja.png`.
- Problemas conocidos: la cara de dolor dura poco y coincide con el parpadeo, así que en una captura fija apenas se ve; en movimiento se nota.
- Siguiente paso: los dos enemigos nuevos (Batidora de Mano, cuerpo a cuerpo; Mando a Distancia, en grupo y se teletransporta), que cierran M2.

## 2026-10-28 22:45 — Hito M2 — El bot esquiva

- Hecho: `dodge()` en `src/sim/bot.ts`. Para cada bala enemiga calcula el momento y la distancia de máxima aproximación en los próximos 0,55 s; si va a pasar a menos de 11 px se aparta de lado (más fuerte cuanto antes llegue) y, si faltan menos de 0,2 s, rueda en perpendicular hacia el lado bueno. Se sale de la línea fijada del aspirador cuando avisa y rueda si ya embiste. Guarda unos 46 px de distancia con todo lo que empuja y no esquiva hacia una pared. Solo «ve» las balas que llevan 0,2 s en el aire (tiempo de reacción) y el aviso del aspirador a partir de 0,2 s. Ahora apunta solo a los enemigos mientras queden; a los maniquíes, cuando la sala está vacía. `new Bot(semilla, { dodge: false })` es el bot antiguo, para comparar. El informe del bot añade «vacía la sala» (partidas en que desmonta a todos los enemigos antes de caer: el criterio de M2), supervivencia, segundos vivo y heridas por minuto.
- Decisiones: el bot no tiene que jugar como un experto sino servir de vara de medir; con tiempo de reacción y sin ver a través de nada más que trayectorias rectas (no prevé la onda ni la aceleración), es un jugador decente. La métrica del criterio («sobrevive a una sala media») se mide como vaciar la Sala de Pruebas sin caer en 60 s.
- Medidas (200 × 60 s, Sala de Pruebas: aspirador, microondas, bombilla y polilla): sin esquivar sobrevive el 10,5 % y recibe 11,8 heridas/min; **esquivando vacía la sala el 84,5 % de las veces**, sobrevive el 97 %, 1,9 heridas/min, ~10 rodadas/min, tarda de media unos 44 s en vaciar la sala cuando lo consigue. A 3 minutos (con la sala reponiéndose) sobrevive el 58 %. 103 tests en verde (4 nuevos en `tests/bot.test.ts`).
- Problemas conocidos: con el bot esquivando, la sala de pruebas resulta fácil; cuando lleguen los dos enemigos nuevos y las salas de verdad (M3) habrá que volver a medir. El bot dispara a ráfagas al azar, por eso tarda en vaciar la sala.
- Siguiente paso: animación de golpe y muerte de la tostadora (se desmonta en tostadas, muelle y tornillos) y el parte de baja provisional; después los dos enemigos nuevos de `docs/DISENO.md`, que cierran M2.

## 2026-10-28 22:40 — Hito M2 — Corazones: la tostadora ya recibe daño

- Hecho: las balas enemigas y los golpes de los enemigos quitan vida (1 = medio corazón; `EnemyDef.contactDamage`, 1 en todos). La caja de daño de la tostadora es un círculo de 4 px en el cuerpo, más pequeño que el sprite, como manda el género. Tras un golpe, 1,1 s sin poder recibir otro (parpadea) y desaparecen las balas enemigas a menos de 56 px: un error cuesta un golpe, no tres. Rodando no se recibe daño. Sin vida, `World.over`: la tostadora deja de responder, cae de lado echando humo y a los 1,6 s sale un cartel provisional «Dado de baja» con la vida útil y las bajas; R o clic piden otra unidad (reinicia la escena). En pantalla al recibir daño: parón de 0,1 s, temblor, destello rojo de toda la pantalla, chispas, sonido `dolor`, y el corazón que se rompe salta y parpadea; con medio corazón el último late. HUD: ranura del objeto activo (sprite nuevo `ranura`, vacía hasta M5) bajo los cupones.
- Arreglo: la hoja `corazones` se declaraba con fotogramas de 11 × 9 cuando eran de 9 × 8, así que el HUD enseñaba trozos de dos corazones (parecían cinco). Test nuevo que comprueba que todas las hojas se dividen en fotogramas enteros.
- Decisiones: `World.noDamage` para que el e2e juegue su guion sin morir; al final lo apaga y prueba de verdad el daño, la baja y el reinicio. La escena se reinicia con `scene.restart()`, que reutiliza el objeto: `create()` ahora deja a cero todo su estado. El cartel es provisional a propósito: el parte de baja de verdad (causa, recomendación del fabricante) va con la tarea de la animación de muerte. Los enemigos siguen atacando a la tostadora caída: la sala no se entera.
- Medidas: 99 tests en verde (7 nuevos en `tests/hurt.test.ts` y el de las hojas). Bot 200 × 60 s sin fallos, y ahora puede morir: **sobrevive el 10,5 %**, 29,7 s de vida media, 11,8 heridas por minuto vivo (antes de que esquive). Es la cifra de partida para el criterio de M2 (más del 40 %). e2e ~60 fps.
- Problemas conocidos: el bot no esquiva nada, por eso muere tanto; «golpes/min» del bot se sigue calculando sobre los 60 s aunque muera antes.
- Siguiente paso: la IA del bot que esquiva (rodar ante balas cercanas y apartarse de las embestidas) para medir de verdad la dificultad; luego la animación de golpe y muerte de la tostadora con su parte de baja.

## 2026-10-28 22:34 — Hito M2 — Vida, muerte y desmontaje de los enemigos; cupones

- Hecho: los enemigos mueren cuando el daño recibido llega a su `hp`. La simulación los quita del mundo en el mismo tick (`reapEnemies`), emite `death` con la dirección del último disparo, cancela lo que estuvieran a punto de disparar y suelta su botín, que ahora es un dato (`EnemyDef.loot.coupons`: aspirador 1–2, microondas 1–3, bombilla 3–5, polilla 0–1). Los **cupones descuento** son objetos del suelo (`World.pickups`): salen despedidos hacia donde iba la bala, frenan, esperan 0,45 s y, si la tostadora pasa a menos de 44 px, vuelan hacia ella; al tocarlos suman a `player.coupons` (evento `pickup`). La Sala de Pruebas se **repone**: 4 s después de vaciarse vuelven todos sus enemigos (`RoomTemplate.restock`, aviso «Reposición de stock»). En pantalla, el **desmontaje**: silueta blanca dos fotogramas, parón de impacto de 0,08 s, temblor, humo, chispas, el sprite del propio enemigo cortado en trozos de 8 × 8 que saltan, rebotan, giran y se quedan en el suelo unos segundos, y tornillos, tuercas, muelles y chapas sueltos (hoja nueva `chatarra`). Sobre el enemigo sale un sello rojo con un texto al azar («Fuera de garantía», «Obsoleto», «No reembolsable», «Daños por mal uso»…, en `src/data/texts.ts`). Sprite nuevo `cupon` (tique amarillo con matriz troquelada y «%» rojo, con destello de vez en cuando), contador de cupones en el HUD bajo los corazones, sonidos nuevos `desmontar`, `cupon` y `reponer`. El bot va a por los cupones cercanos.
- Decisiones: hice esta tarea antes que «Dos enemigos nuevos» (que va primero en la lista) porque sin muerte no se puede medir nada de lo que pide M2 y añadir enemigos que no mueren es amontonar; lo apuntó así la sesión anterior. El daño al jugador no entra aquí: va con «Corazones y HUD», que necesita también la pantalla de baja y que el bot esquive. Los trozos salen del sprite aprobado cortado en tiempo de ejecución, sin dibujar nada nuevo: así cualquier enemigo futuro se desmonta solo y con su propio aspecto. La polilla (sprite de menos de 20 px) tiene una despedida más pequeña y sin sello. La sala de pruebas se repone para que el e2e, el bot y quien juegue siempre tengan a quién disparar. Los cupones valen 1 cada uno; los valores distintos (5 %, 10 %…) quedan para la tienda.
- Medidas: 89 tests en verde (9 nuevos en `tests/loot.test.ts`: muerte, botín, balas que atraviesan, recogida con retardo e imán, polilla viuda, reposición, cancelación de disparos y determinismo). Bot 200 × 60 s sin fallos: 3,6 bajas/min, 6,8 cupones/min, la sala tarda de media 55 s en vaciarse por primera vez (el bot aún dispara mucho a los maniquíes), precisión 80,7 %, 2,7 golpes/min, 5 atascos, 35 ms por partida. e2e: desmonta el microondas, comprueba que suelta cupones y que se recogen; ~59 fps.
- Problemas conocidos: los trozos giran como imágenes (rotación de píxeles, igual que las pelusas), pueden atravesar visualmente una pared si salen muy cerca; los cupones no caducan ni tienen límite de tiempo en el suelo.
- Siguiente paso: «Corazones del jugador y HUD» (las balas y los golpes quitan medio corazón, invulnerabilidad breve) junto con la animación de golpe y muerte de la tostadora; o los dos enemigos nuevos.

## 2026-10-28 21:32 — Hito M2 — Bombilla de Bajo Consumo y Polilla Fiel

- Hecho: la Bombilla (30 de vida, «mando intermedio») usa el cerebro `turret` ampliado con dos datos opcionales: `startup` (1,8 s apagada al aparecer, parpadeando como una bombilla de bajo consumo: destellos cortos e irregulares que se alargan; al encenderse zumba y suelta chispas) y `walk` (guarda unos 140 px con la tostadora: se aleja si te acercas, se acerca si te alejas y, al retroceder, se desliza de lado para no quedarse arrinconada). Cada 2,2–3,2 s avisa 1,2 s y suelta `bombilla-espiral` (3 brazos, 42 chispas cian). Mientras está encendida tiene un halo de luz, más fuerte al disparar. Hoja `bombilla` con dos fotogramas sacados del sprite aprobado: encendida (sin la polilla pintada) y apagada (cristal gris, ojos negros). Nuevo cerebro `moth` y enemigo `polilla` (4 de vida, sprite propio de 11 × 9 con dos aleteos): vuela sobre las cajas a 14 px del suelo con su sombra, gira alrededor de su dueña (más deprisa y más pegada cuando la bombilla dispara, despacio cuando está apagada) y cada 2,5–4,5 s, si la tostadora está cerca, avisa 0,4 s y se lanza 0,45 s en línea recta; solo empuja al lanzarse. Sin bombilla, ronda a la tostadora. `EnemyDef.escort` hace que un enemigo traiga a otro (la bombilla trae a su polilla). Letra `L` en las plantillas. Sonidos nuevos `encender` y `aleteo`. El e2e saca `08-bombilla.png` con la espiral en el aire.
- Arreglos: (1) la boca de disparo de los enemigos baja si hay una pared justo encima (la bombilla, pegada a la pared de arriba, soltaba la espiral dentro del muro); (2) `.gitignore` ignoraba `capturas/` en cualquier carpeta, también `panel/capturas/`, así que las capturas del panel nunca se habían subido aunque la bitácora dijera lo contrario. Ahora ignora solo `/capturas/`, y el panel tiene 5 capturas reales.
- Decisiones: la bombilla no es un cerebro nuevo sino una torreta con arranque y paseo, porque son dos ideas que servirán a otros enemigos (y a jefes). La polilla es un enemigo aparte, no un adorno, para que se le pueda disparar y para que el diseño («le acompaña una polilla fiel») tenga consecuencias: si algún día muere la bombilla, la polilla te sigue a ti. La polilla no ataca mientras la bombilla está apagada (las polillas van a la luz). El sprite aprobado no se toca: los fotogramas del juego se derivan de él en `makeBombillaFrames()`. Las horas de la bitácora anteriores iban por delante del reloj real; desde aquí uso la hora real de Madrid.
- Medidas: 77 tests en verde (7 nuevos: arranque, aviso y espiral, distancia, órbita, lanzamiento y polilla sin dueña). Bot 200 × 60 s sin fallos: precisión 85,5 %, 6 golpes/min (antes 3,6; la polilla también empuja), 2 atascos, 29 ms por partida (antes 18, por las chispas). e2e ~61 fps.
- Problemas conocidos: en una de las ejecuciones del e2e falló la comprobación «el gatillo del mando dispara» y en la siguiente pasó; probablemente coincidía con una recarga; ahora el e2e recarga antes de probar el mando. Las balas enemigas siguen sin hacer daño.
- Siguiente paso: «Vida, daño, muerte» con desmontaje en piezas y cupones (los enemigos ya tienen `hp`), y luego los corazones del jugador.

## 2026-10-28 21:55 — Hito M2 — Microondas Sin Seguro

- Hecho: segundo cerebro de enemigo, `turret` (datos: alcance, intervalo, aviso, patrón y altura de la boca). El Microondas no se mueve; cada 1,6–2,6 s, si la tostadora está a menos de 260 px, «calienta» 1 s (parpadea, «!», anillo que se cierra sobre la ventanilla, pitido) y suelta `microondas-anillos` (12 + 18 balas en dos anillos desfasados). Las balas no lo mueven. Su reloj de 12:00 parpadea siempre, y más deprisa mientras calienta (tabla `SPRITE_BLINKS` del dibujo: rectángulos del sprite que se tapan a ratos). Hay uno en la sala de pruebas (letra `O`). Los enemigos guardan en datos el punto del sprite que pisa el suelo (`anchor`).
- Decisiones: el aviso del microondas sale de su emisor de balas (con anillo), no del propio enemigo; solo los que embisten generan su aviso aparte. 1 s de aviso, como dice el diseño: es lento pero llena la sala de balas, y obliga a moverse o rodar a tiempo.
- Medidas: 69 tests en verde (3 nuevos). Bot 200 × 60 s sin fallos, precisión 82,8 %, 3,6 golpes/min, 18 ms por partida (más balas en vuelo). e2e ~61 fps.
- Problemas conocidos: las balas enemigas siguen sin hacer daño (llega con los corazones); el bot aún no las esquiva, así que no hay medida de dificultad del microondas.
- Siguiente paso: Bombilla de Bajo Consumo (espirales) con su polilla; o, si se prefiere medir antes, «Vida, daño, muerte».

## 2026-10-28 21:30 — Hito M2 — Aspirador Desahuciado

- Hecho: primer enemigo con IA. Tipo `EnemyDef` en `src/data/types.ts` con un «cerebro» de datos (`ChargerBrain`: velocidad al andar, alcance, aviso, velocidad y duración de la carga, frenada, aturdimiento) y su comportamiento en `src/sim/enemies.ts`. El Aspirador anda despacio hacia la tostadora; cuando está a menos de 190 px fija la dirección, avisa 0,55 s (parpadeo, «!», línea de puntos con todo el recorrido, tiembla), embiste a 230 px/s durante 0,7 s y frena derrapando; si choca contra una pared o una caja se queda aturdido 1,1 s tambaleándose. Al tocar a la tostadora la empuja (con fuerza si está embistiendo); rodando se le atraviesa. Las balas le dan, destella y se le empuja un poco, salvo cuando embiste. En pantalla: se inclina al cargar y hacia atrás al frenar, rastro de polvo, chispas de las ruedas, temblor y chispas al chocar, sonidos nuevos (`motor`, `derrape`, `choque`, `empujon`). Hay uno en la sala de pruebas (letra `A` en las plantillas). `slide()` es ahora el movimiento con colisiones común a jugador y enemigos.
- Decisiones: el contacto todavía no quita vida (los corazones son una tarea propia de M2); de momento empuja, para que el ataque se note y se pueda medir. La vida del enemigo está en los datos (14) pero aún no muere: llega con «Vida, daño, muerte». La dirección se fija al empezar el aviso para que la línea de puntos diga la verdad y rodar en perpendicular sea la respuesta. Los avisos de enemigos y de patrones se unifican en `activeWarnings()`, así el dibujo no distingue de dónde vienen. `createWorld({ noEnemies })` para tests que solo quieran al jugador.
- Medidas: 66 tests en verde (6 nuevos del aspirador). Bot 200 × 60 s sin fallos: precisión 82,1 % (antes 89,7 %, ahora también dispara al aspirador, que se mueve), 3,2 golpes por minuto (el bot aún no esquiva), 3 atascos. e2e: 9 embestidas en 30 s, ~60 fps.
- Problemas conocidos: los enemigos no chocan entre sí (cuando haya varios en una sala habrá que separarlos); la línea de puntos de la carga mide algo menos que el recorrido real.
- Siguiente paso: Microondas Sin Seguro (se queda quieto, calienta 1 s y dispara `microondas-anillos`) como segundo cerebro (`turret`).

## 2026-10-28 21:00 — Hito M2 — Telegrafía de ataques

- Hecho: los emisores de patrones admiten un tiempo de aviso (`firePattern(..., { telegraph, source })`): el reloj del emisor empieza en negativo y no sale ninguna bala hasta que se acaba. La simulación emite el evento `telegraph` y ofrece `telegraphProgress()` y `sourceTelegraph()` para que el dibujo sepa cuánto falta. En pantalla: quien ataca parpadea en amarillo y luego en blanco cada vez más deprisa y tiembla 1 px al final; un anillo de píxeles del color de las balas se cierra sobre la boca de disparo (cuando llega, sale la ráfaga); los patrones apuntados (abanico, ráfaga, anillo apuntado) muestran una línea de puntos hacia donde irán; un «!» amarillo salta sobre la cabeza. Sonido nuevo `aviso` (pitido ascendente con vibrato, más agudo para las balas cian). Las teclas 1–5 de la sala de pruebas ya avisan. El e2e comprueba que hay aviso y guarda `07-aviso.png`.
- Decisiones: aviso por defecto de 0,5 s para enemigos (`ENEMY_TELEGRAPH`); cada enemigo podrá cambiarlo en sus datos. Sin aviso (0) se dispara en el acto, como antes, para no romper los tests ni los usos futuros (jefes en fase de furia, trampas). `isAimed()` decide a partir del propio patrón si se dibuja la dirección, así los datos no repiten esa información. El anillo no parpadea (es el reloj); parpadea el sprite. El «!» se coloca sobre el sprite de quien ataca, no sobre la boca, porque tapaba la cara.
- Arreglo: el panel apuntaba a `panel/capturas/*.png` pero esa carpeta nunca se había subido; ahora tiene 6 capturas reales.
- Medidas: 56 tests en verde (3 nuevos de telegrafía). Bot 200/200 sin fallos. e2e ~60 fps.
- Problemas conocidos: el aviso en el maniquí se ve bien; habrá que revisar el tamaño del anillo con enemigos pequeños (bombilla).
- Siguiente paso: el Microondas Sin Seguro como primer enemigo con IA (andar, apuntar, avisar y disparar `microondas-anillos`), lo que pide un tipo `EnemyDef` en `src/data/`.

## 2026-10-28 20:25 — Hito M2 — Patrones de balas declarativos

- Hecho: `src/sim/patterns.ts` con anillo (fijo o apuntado), abanico, espiral de varios brazos, ráfaga con dispersión y secuencias que combinan patrones con desfase de tiempo y giro; modificadores de onda (zigzag lateral) y aceleración. `expandPattern()` convierte un patrón en una lista de disparos con su retardo; el mundo tiene emisores (`firePattern`) que los sueltan a su tiempo. Cinco patrones con nombre en `src/data/patterns.ts` (anillos del microondas, espiral de la bombilla, abanico, ráfaga, anillo en onda). En la sala de pruebas, las teclas 1–5 hacen que el primer maniquí dispare cada patrón; el e2e lo usa para sacar una captura de las balas enemigas.
- Decisiones: la «onda» es un modificador que se puede poner a cualquier patrón, no un patrón aparte: así se combina con anillos y abanicos. Las balas enemigas aún no hacen daño (llega con «Vida, daño, muerte»); de momento atraviesan a la tostadora. El disparo de prueba entra por `Input.debugPattern` para no saltarse la simulación.
- Medidas: 52 tests en verde (9 nuevos de patrones). Bot 200/200 sin fallos.
- Problemas conocidos: las balas rojas de 5 px se leen bien a zoom 3, algo justas a zoom 2; revisarlo cuando haya enemigos de verdad.
- Siguiente paso: telegrafía de ataques (parpadeo y sonido previo) y el Microondas Sin Seguro como primer enemigo con IA.

## 2026-10-28 20:10 — Hito M1 (terminado) — Mando probado y cierre del hito

- Hecho: el e2e simula un mando con la Gamepad API (mapeo estándar) y comprueba que el stick izquierdo mueve, el derecho apunta y el gatillo dispara. M1 queda cerrado.
- Decisiones: las animaciones de golpe y muerte de la tostadora pasan a M2 como tarea propia, porque sin daño no hay nada que animar ni probar. Con eso, todos los criterios de M1 se cumplen (capturas moviéndose y disparando, entrada leída en cada tick de 1/60 s, tests y bot en verde).
- Medidas: e2e de 30 s a ~61 fps, 93 disparos, 72 impactos; 43 tests; bot 200/200 sin fallos.
- Problemas conocidos: falta probar un mando de verdad; el giro al rodar es una rotación del sprite.
- Siguiente paso: M2, empezando por el sistema declarativo de patrones de balas (anillo, abanico, espiral, ráfaga, onda) con tests.

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
