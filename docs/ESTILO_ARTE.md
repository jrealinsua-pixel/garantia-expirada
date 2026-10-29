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
- Pendiente para «Entornos» (M8): obstáculos propios (las cajas, barriles y carritos siguen siendo
  los del almacén) y persianas a juego.
