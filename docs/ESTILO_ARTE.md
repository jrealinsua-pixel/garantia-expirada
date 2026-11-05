# Estilo de arte (aprobado por el humano)

Los sprites de `art/referencia/` son la referencia. Todo el arte nuevo debe parecer hecho por la
misma mano. Los scripts que los generaron están en `tools/referencia/` (Python, solo como
ejemplo del método; el proyecto usa la versión en TypeScript de `tools/sprites/`).

## Lo que el humano pidió expresamente

- Pixel art al estilo de Enter the Gungeon y The Binding of Isaac: cabeza grande, cuerpo
  pequeño, mucho carácter.
- **Vista lateral de tres cuartos mirando a la derecha**, no de frente. Para mirar a la
  izquierda se voltea el sprite en horizontal.
- **Sin brazos ni piernas de palo.** Manos flotantes y redondeadas (3×3 px), como en Gungeon.
- **Piernas cortas pero visibles** (unos 4 px), con zancada y zapatos propios de cada personaje.
- **Nada de estética infantil o kawaii.** Caras con actitud: cansancio, rabia, suficiencia.
- **Mucha personalidad en los detalles:** cada personaje lleva 2 o 3 detalles que cuentan un
  chiste (la tostada quemada que humea, la etiqueta del -70 %, el reloj en 12:00, la polilla).
- Los electrodomésticos son humanoides. Algunos personajes jugables y jefes pueden no serlo
  (por ejemplo, el Becario Eterno es humano).

## Proporciones

| Tipo | Lienzo | Notas |
| --- | --- | --- |
| Personaje jugable | unos 40 × 40 px | La cabeza ocupa el 55–60 % de la altura |
| Enemigo normal | unos 32 × 36 px | Igual de proporciones que el jugador |
| Jefe | unos 72 × 76 px | Puede tener manos grandes, nunca brazos |
| Arma en mano | unos 18 × 11 px | Vista de lado, cañón hacia la derecha |
| Objeto recogible | 16 × 16 px | Silueta clara, legible a tamaño real |
| Casilla de suelo | 24 × 24 px | Remaches, juntas, suciedad sutil |

La resolución interna del juego es 480 × 270 (16:9) y se escala con números enteros.

## Técnica

- **Contorno negro de 1 px** (`#0e0c16`) alrededor de toda la silueta.
- **Luz desde arriba a la izquierda.** Cada material usa una rampa de 4 tonos (luz, base,
  sombra, sombra profunda). La cara lateral del objeto va en la rampa más oscura.
- Cabezas de electrodoméstico como **cubos en tres cuartos**: cara superior clara, cara lateral
  izquierda oscura y cara frontal a la derecha, donde van los ojos.
- Ojos: rectángulos negros de 2–3 px con un píxel de brillo blanco; párpados del color de la
  carcasa para dar actitud.
- Desgaste: puntos de óxido (`#b8683a`), abolladuras, pegatinas. Sin pasarse.
- Sombra en el suelo: elipse oscura semitransparente bajo los pies.
- Sin degradados suaves ni antialiasing. Sin filtros de difuminado: el juego se escala con
  `pixelArt: true`.

## Paleta base

| Nombre | Hex | Uso |
| --- | --- | --- |
| Negro Letra Pequeña | `#0e0c16` | Contornos, ojos |
| Blanco Roto | `#f4f1e8` | Brillos, texto |
| Gris Electrodoméstico | `#b7bed0` / `#858ea8` / `#5a627c` | Carcasas metálicas |
| Rojo Oferta | `#e0453b` | Balas enemigas, peligro, corazones |
| Amarillo Liquidación | `#f6c431` | Cupones, coronas, avisos |
| Naranja Tostada | `#ffb347` / `#ff7a1f` | Disparos del jugador, resistencias al rojo |
| Azul Aspirador | `#5f93d4` | Aspirador, plásticos |
| Cian Nevera | `#69dbd8` | Hielo, chispas eléctricas |
| Verde A+++ | `#58b45a` | Etiquetas energéticas, pantallas |
| Rosa Secador | `#e88fa4` | Secador |
| Marrón Cartón | `#a98258` | Cajas, maletines |
| Suelo | `#3a4060` / `#353b58` | Baldosas del almacén |

Las balas enemigas siempre en colores saturados (rojo, cian) con núcleo blanco. Las del
jugador, en naranja y amarillo. Nunca se confunden.

## Animaciones mínimas por personaje

| Animación | Fotogramas | Notas |
| --- | --- | --- |
| Reposo | 2–4 | Respiración: la cabeza sube y baja 1 px |
| Andar | 4–6 | Zancada de las piernas, las manos se balancean |
| Rodar | 4–6 | La cabeza gira sobre sí misma; destello al empezar |
| Golpe | 1–2 | Destello blanco de 1 fotograma |
| Muerte | 4–8 | Se desmonta en piezas (tornillos, muelles, chispas) |

### Animación de los enemigos

Las mismas reglas que la tostadora: piernas en una capa y cuerpo en otra; respiración bajando
el cuerpo 1 px; zancada de cuatro fotogramas (contacto, paso elevado 1 px, contacto con las
piernas cruzadas, paso elevado). Las piernas crecen 1 px cuando el cuerpo sube. Los muy grandes
(la Nevera) no cruzan las piernas: levantan un pie 2 px cada vez. El fotograma 0 de cada hoja es
siempre el sprite aprobado. Qué fotogramas se usan lo dicen los datos (`anim` de cada enemigo).

## Escenarios

- La planta 1 es el almacén del vertedero: suelo de baldosas metálicas con remaches, líneas de
  seguridad pintadas, estanterías llenas de cajas en la pared superior, cintas amarillas y
  negras en los bordes, charcos de aceite, rejillas, barriles y carros de la compra.
- Viñeteado suave y focos de luz cálida de los fluorescentes.
- Cada planta nueva necesita su propio juego de casillas y su color dominante.

### Planta 2: Informática (`src/art/informatica.ts`)

Color dominante: **verde pantalla** (suelo `#304541` / `#2c403d`, juntas `#1c2a28`, paredes
`#1b2524`), igual de oscuro que el almacén para que las balas se lean igual en las dos plantas
(lo vigila `tests/roomart.test.ts`).

- **Suelo técnico**: placas de 24 × 24 sobre pilares, con el borde de arriba y de la izquierda
  iluminado, la junta oscura abajo y a la derecha, un cuadradito oscuro donde se juntan cuatro y
  vinilo moteado. Variantes: placa levantada (rendija con cables de colores), pasacables con un
  cable que no va a ninguna parte, desgaste de sillas de oficina, pegatina de inventario medio
  despegada y placa perforada de ventilación (rara).
- **Suelo**: anillos de café, manchas de tóner, cubrecables de goma de lado a lado (en lugar de las
  rodadas de carretilla), teclas sueltas y memorias USB (en lugar de tornillos), zona de
  «DEMO / EXPOSICIÓN / AGOTADO» y letras en verde gastado («REINICIE Y VUELVA», «ACEPTE LAS
  COOKIES»…). Las líneas de seguridad, en verde.
- **Paredes**: racks de servidores con LEDs en lugar de estanterías; canaleta blanca con enchufes y
  switches de red en las laterales; rodapié-canaleta gris con enchufes en lugar de la cinta
  amarilla y negra. Arriba, bandeja de cables con cables colgando y paneles LED fríos (la luz es
  fría, no cálida). En la pared del fondo, monitores encendidos (pantallazo azul, carta de ajuste,
  texto verde, «sin señal», una actualización atascada) y cajas de portátil; el reloj sigue en las
  12 y el turno es una barra de progreso en el 99 %.
- Salas: entrada con felpudo «CONECTANDO» y cartel «PLANTA 2 · INFORMÁTICA»; tienda con alfombra
  azul; tesoro «COPIAS DE SEGURIDAD»; secreta «PAPELERA DE RECICLAJE»; jefe «SALA DE SERVIDORES»
  con interferencias (nieve verde y píxeles muertos) en lugar de escarcha.
- Obstáculos: arriba, la caja es un **monitor de tubo** beis con un pósit, el bidón es una **fuente
  de agua** con la garrafa casi vacía y el carrito es una **silla de oficina** con ruedas (las
  balas pasan por encima, como con el carrito). Miden y chocan igual que los del almacén (sprites
  `caja-2`, `barril-2`, `carrito-2`). Las persianas, gris verdoso con la tira de goma del rodapié
  en vez de la cinta amarilla y negra (`persiana-*-2`). Regla: una versión de planta de un sprite
  se llama `<id>-<planta>` y mide lo mismo que el original.

### Planta 3: Juguetería (`src/art/jugueteria.ts`)

Color dominante: **cálido** (rojos y mostazas desvaídos de las losetas de goma, con azul, verde y
rosa en menor medida; paredes ciruela `#291d2b`), igual de oscuro que las otras dos plantas
(`tests/roomart.test.ts` lo vigila, y también que sea cálido y distinto de las otras).

- **Suelo de goma EVA de puzle**: losetas de 24 × 24 de cinco colores desvaídos (`EVA`), nunca
  del mismo color que la de la izquierda ni la de arriba, con textura de espuma, la junta oscura
  arriba y a la izquierda y la pestaña del puzle en cada lado compartido (sale hacia un lado o al
  otro alternando, con su ranura). Los colores están apagados a propósito: más vivos, el suelo
  competía con las balas. Variantes: loseta que falta (hormigón gris con restos de pegamento; ahí
  no hay pestañas), loseta de abecedario (la letra o el número recortado), mordisco en una esquina,
  descolorida por el sol y pegatina de estrella medio despegada.
- **Suelo**: garabatos de cera, purpurina, la **carretera de alfombra** de juguete de lado a lado
  (en lugar de las rodadas), piezas de construcción y canicas (en lugar de tornillos), zona de
  «ZONA DE JUEGO / NO TOCAR / AGOTADO» y letras en rosa gastado («PILAS NO INCLUIDAS», «EDAD: 3+»,
  «NO APTO PARA ADULTOS»…). Las líneas de seguridad, en ciruela.
- **Paredes**: estanterías de juguetes en caja (cada caja con su ventana de plástico, el juguete
  dentro y, a veces, el precio tachado) en lugar de estanterías de chapa; tallímetro de colores en
  las laterales y dibujos de niño con chincheta; rodapié de las piezas de borde de las losetas, de
  colores. Arriba, una guirnalda de banderines (le faltan algunos) y lámparas de luz cálida algo
  rosada. La pared del fondo es papel pintado de nubes que se despega en tiras (se ve el yeso y el
  rizo de papel). El turno es un cartel de precios con todos los precios tachados.
- Salas: entrada con felpudo «A JUGAR» y cartel «PLANTA 3 · JUGUETERÍA»; tienda «TODO A UN TICKET»
  con alfombra morada; tesoro «CARTAS A LOS REYES»; secreta «RETIRADOS POR SEGURIDAD»; jefe
  «ESCAPARATE DE NOVEDADES» con confeti de un lanzamiento al que no vino nadie.
- Obstáculos (`caja-3`, `barril-3`, `carrito-3`, `mesa-3`): una **casita de muñecas** rosa
  cerrada por reformas (cinta amarilla y negra en la puerta), una **bombona de helio** roja con dos
  globos atados (roja como el bidón: explota igual), un **caballito de balancín** desteñido (bajo:
  las balas pasan por encima) y una **mesa de manualidades** de plástico amarillo con patas rojas.
  Las persianas, ciruela, con el rodapié de colores y una tira de luces de feria fundidas (solo
  queda una encendida, en rosa) (`persiana-*-3`).

### El Muñeco de Moda, jefe de la planta 3 (`tools/sprites/muneco.ts`)

- **Con caja** (fotogramas 0–6): caja de escaparate magenta desvaído en tres cuartos (cara
  lateral a la izquierda con el código de barras), banda amarilla del logotipo con letras que no
  dicen nada, ventana con el cartón estampado azul noche y estrellas rosas, y el muñeco aplastado
  dentro: el pelo contra el borde de arriba, alambre de atar en la cintura, ojos azules de cristal
  cansados, colorete y la sonrisa de anuncio. Brillo del plástico en diagonal. Pegatina
  «¡Novedad!» tachada con rotulador y cinta con «Temporada anterior» garabateado. Manos grandes
  de vinilo fuera de la caja. Al posar: guiño, mano arriba y destello en los dientes.
- **Etiqueta de rebaja** (hoja aparte, 22×12): precio completo «99» en blanco, −30 % amarillo,
  −50 % naranja y −70 % rojo con letras blancas; cada una asoma una esquina de la anterior. Va en
  `TAG_ANCHOR` (esquina de abajo a la izquierda de la ventana), con el mismo `bob` que el cuerpo.
- **Sin caja** (7–15): el mismo muñeco más grande y desatado: pelo encrespado a mechones, el
  alambre en el cuello con la punta cortada, la cinta pegada en el pecho, cejas de rabia, ojos
  muy abiertos con la pupila pequeña y una grieta en la comisura de tanto sonreír. Al girar: de
  espaldas (la etiqueta «made in» asomando del cuello) y de frente con las manos abiertas.
- **Caja rota** (56×64): vacía, sin ventana (trozos de plástico en el marco), el troquel con la
  silueta del muñeco enseñando el cartón marrón, los alambres cortados colgando y el −70 % puesto.
- **Pegatinas de oferta** (`bala-pegatina`, en `tools/sprites/props.ts`, 9×9, 4 fotogramas): las
  balas de la fase 3. Pegatina redonda amarilla con un «%» rojo y el borde granate (no marrón:
  es una bala y no puede confundirse con un cupón), con brillo arriba a la izquierda; cuatro
  cuartos de vuelta para que giren al volar. Al girar, el Muñeco enseña de frente (15), de lado
  (7), de espaldas (14) y del otro lado (7 en espejo).
- **Accesorios** (`bala-accesorio`, 8 fotogramas de 9×9 en `tools/sprites/props.ts`): sus balas.
  Un zapato de salón de plástico rosa (puntera, hueco oscuro, talón y tacón de aguja) y un bolsito
  con asa y cierre blanco, cada uno en sus cuatro giros de un cuarto de vuelta: en vuelo, la mitad
  son zapatos y la mitad bolsos, y van girando. Contorno ciruela oscuro, como el muñeco.
- **En el juego**: la etiqueta se pinta encima (`EnemyAnim.badge`) en el sitio del fotograma,
  reflejada con el cuerpo pero sin voltearla (el precio se lee siempre), con el mismo tinte. Los
  destellos de la pasarela se marcan en el suelo con un anillo rosa que se cierra y una chispa de
  cuatro puntas que crece y se pone blanca al final.
