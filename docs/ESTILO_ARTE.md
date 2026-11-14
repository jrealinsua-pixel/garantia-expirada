# Estilo de arte (aprobado por el humano; en M14c cambia, ver la primera sección)

Los sprites de `art/referencia/` son la referencia. Todo el arte nuevo debe parecer hecho por la
misma mano. Los scripts que los generaron están en `tools/referencia/` (Python, solo como
ejemplo del método; el proyecto usa la versión en TypeScript de `tools/sprites/`).

## M14c · El estilo nuevo (decidido el 2026-11-14, en prueba)

El humano pidió el 13 de noviembre un arte mejor («es todo feísimo»), así que en M14c el estilo
cambia. Lo de abajo de esta sección sigue valiendo **salvo lo que esta sección cambia**, y vale
para todo el arte que se redibuje a partir de ahora ((a4)–(a12)); hasta que se redibuje, cada
hoja vieja se queda como está. La prueba está en `art/prueba/` (`comparativa.png`: antes y
ahora, a tamaño real sobre su suelo y a 3×), la genera `tools/sprites/prueba-a1.ts` y la vigila
`tests/estilo-a1.test.ts`. Si al humano no le gusta, que lo diga en sus notas y se cambia aquí.

- **Paleta por materiales** (`src/art/paleta.ts`): cada material es una rampa de **5 a 7 tonos**
  (de 4 solo los de adorno: óxido, latón), del brillo (0) a la sombra más honda (la última).
  Los tonos los elige uno a mano, no salen de una fórmula. Materiales: `acero`, `tostada`,
  `quemada`, `rojo`, `azul`, `goma`, `rosa`, `amarillo`, `oxido`, `laton` y `suelo`; los nuevos
  se añaden ahí con las mismas reglas (en (a5a) llegó `crema`, el esmalte de los electrodomésticos
  blancos viejos, como el microondas).
- **Sombras de color, nunca negras ni grises**: bajando por la rampa el tono gira hacia el
  azul-violeta y la saturación se mantiene; las luces se calientan hacia el amarillo (el acero
  brilla en blanco cálido `#fbf5e6` y se apaga en violeta `#2a2847`). La sombra en el suelo es
  violeta y transparente, no negra.
- **Luz arriba a la izquierda y algo de frente.** Por convención, en la vista de tres cuartos:
  la cara de arriba es la más clara, la cara frontal (la de la cara) va en tonos medios y la
  lateral izquierda en sombra. Los volúmenes redondos (el aspirador, los guantes, el secador) se
  sombrean con sus normales (`Paint.ellipsoid`, `Paint.cylinderH`), no con un tono plano.
- **El cromo se pinta como un espejo**: cielo claro arriba, un horizonte nítido a media altura,
  la sala más oscura debajo y el rebote del suelo abajo, con dos reflejos verticales de ventana.
- **Tramado (dithering) solo en las costuras**: Bayer 4×4 en una banda estrecha entre dos tonos
  de una superficie curva, o en el pozo de luz del suelo. Nunca a lo ancho de una cara plana: a
  tamaño real se lee como suciedad (se probó y se quitó).
- **Contorno selectivo**: por el lado de la luz (arriba y a la izquierda) el contorno es la
  sombra más honda del material que toca, mezclada al 45 % con la tinta; por el lado de la sombra
  (abajo y a la derecha) es **tinta** `#140f20` (violeta casi negro, en vez del negro `#0e0c16`).
  Las líneas de dentro (ranuras, juntas) son el tono más hondo del material, no negro.
- **Más grandes**: la carcasa de un personaje mide **24–32 px de ancho** (la tostadora, 28; antes
  22) en un lienzo de unos 48 × 50; un enemigo normal, unos 42 × 42; los jefes se deciden en (a7).
  Las cajas de choque no cambian (son de la simulación): el dibujo crece, el núcleo no.
- **Herramientas** (`src/art/pintor.ts`, M14c (a2)): `Paint` (el lienzo que recuerda el material
  de cada píxel y hace el contorno selectivo), `ellipsoid` y `cylinderH` (sombreado por normales),
  `heightShade` (el sombreador de volumen: cualquier forma es una función de alturas; una
  abolladura, un remache o un corazón acolchado salen de ahí), `aa` (antialias de pixel art: el
  píxel que la forma cubre a medias va un tono más oscuro en vez de quedar el escalón) y el brillo
  especular en `SHINE`. Con la luz plana justo en un tono (`bias`), una cara plana sale de un solo
  tono y solo cambian las pendientes. Demostración en `art/prueba/herramientas.png`.
- **Legibilidad, medida** (`legibility` y `silhouetteOverlap`, en los tests): sobre el tono medio
  del suelo, el borde de la silueta tiene que ser oscuro (≥ 80 % de sus píxeles), con contraste
  medio ≥ 1,6, y no más de un tercio del cuerpo puede fundirse con el suelo (contraste < 1,5);
  dos enemigos de la misma planta no deberían solaparse más de 0,8 en silueta (tostadora y
  aspirador viejos: 0,72; nuevos: 0,51).
- **Sprites hechos fuera** (M14c (a3)): se dejan en `art/entrada/` con su JSON (instrucciones en
  `art/entrada/LEEME.md`); `node tools/sprites/entrada.ts` los pasa a esta paleta y a su tamaño y
  `npm run sprites` los mete en las hojas. Tienen que cumplir esta guía igual que los de código
  (los tests de legibilidad valen para ellos); lo semitransparente (humo, brillos suaves) se pierde
  y se añade después por código.
- **En el juego** (M14c (a4a), la Tostadora primero, en `tools/sprites/tostadora.ts`): el
  personaje se pinta en dos capas, las piernas y el cable (fijos en el suelo) y el cuerpo (que
  respira y bota), y se juntan con `Paint.stamp` antes del contorno, para que la figura tenga un
  solo contorno. El fotograma deja dos filas arriba para el humo y la última fila es el contorno de
  las zapatillas (`feetY`); el cuerpo, centrado en `feetX`. Sin sombra en el suelo ni migas: el
  juego pone la sombra (`CharacterLook.shadowRx`, la mitad del ancho de la carcasa) y el arma con
  el guante. Las pantallas hechas a mano para el marco viejo de 40 × 41 (portada, final) colocan
  el dibujo con `classicOrigin`, con los pies donde iban.
- **La Batidora de Vaso** (M14c (a4c1), `tools/sprites/batidora-vaso.ts`): 40 × 50, más alta que
  la tostadora por el vaso. El motor es un cubo de tres cuartos de plástico violeta (material
  `violeta`) con la cara delante: ojos muy abiertos de no dormir (pupila diminuta, una vena roja y
  ojeras) y una sonrisa con todos los dientes; encima, el collar de goma acanalado y el vaso de
  `vidrio`, un cilindro con el reflejo de la ventana por el lado de la luz, las marcas de medida y
  el batido verde de la dieta seco dentro (su superficie se inclina al andar y se agita al rodar,
  `slosh`). Sus fotogramas son los mismos que los de la tostadora (andar 6, rodar 6, disparar,
  golpe en dos tiempos, dos sacudidas); el golpe hace saltar la tapa en lugar de las tostadas, y
  rota se queda con la tapa torcida, sin pajita y el vaso rajado. Guantes y zapatillas de correr
  lima, con calcetines blancos: compradas para la misma dieta, casi sin usar.
- **La Plancha de Vapor** (M14c (a4c2), `tools/sprites/plancha-vapor.ts`): 46 × 43, la más ancha y
  la más baja de los tres, de perfil mirando a la derecha con la punta de la suela hacia delante
  (silueta que no tiene nadie más). Carcasa de plástico `turquesa` con el lomo en sombra atrás, el
  canto inclinado de delante brillando y un reflejo largo arriba; el asa azul marino en arco con el
  botón rojo del vapor; el depósito de `cian` con el agua que se balancea al andar; el dial en
  LINO; la franja blanca y la suela de acero con sus agujeros. La cara, párpados planos a media
  altura y una boca recta: ha planchado cosas peores que tú. Los golpes y las sacudidas echan
  vapor por la suela (el vapor y los demás semitransparentes se ponen con `put`, no con `set`, que
  los mezclaría con el píxel vacío y saldrían grises); rota, el asa se suelta del poste de delante
  y la carcasa se raja. Guantes blancos de algodón y los zapatos negros de la entrevista, largos y
  con brillo en la puntera; el trozo del cuello de la camisa quemado sigue pegado bajo la suela.
- **Lo que no cambia**: tres cuartos mirando a la derecha, manos flotantes sin brazos, piernas
  cortas con zapatos propios, cabeza grande con actitud (párpados caídos, cejas hacia dentro),
  2 o 3 detalles con chiste por personaje (la pegatina del −70 %, la tostada quemada que humea),
  el óxido en motas sueltas, y las balas: enemigas saturadas (rojo, cian) con núcleo blanco y
  del jugador en naranja y amarillo. El suelo sigue igual de oscuro (luminancia media entre 0,035
  y 0,075) para que las balas se lean.

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

Cada personaje jugable suelta sus propias cuatro piezas de 8 × 8 (`despiece`, `despiece-batidora`,
`despiece-plancha`, `despiece-becario`, `despiece-movil`), con sus colores, para que el montón diga de
quién era: las dos primeras salen de arriba y las otras dos de abajo. El Becario no es un aparato:
sus piezas son papeles y oficina, y no echa chispas ni humo.

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

### Planta 4: Oficinas (`src/art/oficinas.ts`)

Color dominante: **gris neutro** (ni el azul del almacén, ni el verde de Informática, ni el cálido
de la Juguetería; paredes casi negras `#232227`), igual de oscuro que las demás (`tests/roomart.test.ts`
lo vigila). La planta más apagada a propósito: aquí el color lo ponen los enemigos y las balas.

- **Moqueta en losetas** de 24 × 24 colocadas a contrapelo (el pelo va a lo ancho en una y a lo
  largo en la siguiente, y cada dirección tiene un gris un pelo distinto), con la junta apenas
  marcada. Variantes: mancha de café restregada, óvalo gastado donde vive una silla, loseta de otra
  partida (otro gris y el pelo al revés), chicle aplastado y esquina levantada (poca, que de lejos
  parecía una flecha).
- **Suelo**: manchas de café, los arcos de las ruedas de las sillas, pósits y clips (en lugar de
  tornillos), el **pasillo de moqueta oscura** de lado a lado (en lugar de las rodadas), zonas de
  «PUESTO LIBRE / NO RESERVAR / REUNIÓN 5 MIN» y letras de cinta clara («OBJETIVOS Q3», «FICHE AL
  SALIR», «ESPACIO DIÁFANO»…).
- **Paredes**: las paredes de dentro son **mamparas de cubículo**: carril de aluminio arriba y tela
  gris azulada delante con lo que se clava en ellas (un pósit, una hoja impresa, el calendario del
  año pasado). La del fondo es pladur con los **valores de la empresa en vinilo** («PASIÓN»,
  «RESILIENCIA», «FAMILIA»…) a los que les falta alguna letra, una balda de archivadores AZ y otra
  con bandejas, cajas de folios y un teléfono. Falso techo con una placa que falta (cuelga un
  cable) y paneles fluorescentes de luz fría. Radiadores en las laterales, pósters motivacionales
  en vez de cuadros eléctricos, rodapié de PVC gris con cajas de suelo. El turno es una pizarrita
  con el gráfico de objetivos bajando.
- Salas: entrada con felpudo «FICHE AQUÍ» y cartel «PLANTA 4 · OFICINAS»; tienda «ECONOMATO» con
  alfombra azul; tesoro «MATERIAL DE OFICINA»; secreta «CONFIDENCIAL» con tiras de papel triturado
  y polvo gris; jefe «SALA DE JUNTAS» con la moqueta buena (carbón con ribete granate) y el aire
  acondicionado a 17 grados.
- Obstáculos (`caja-4`, `barril-4`, `carrito-4`, `mesa-4`): un **archivador metálico** con el cajón
  del medio que no cierra, un **termo de café** de acero con la banda roja y la etiqueta amarilla
  (como el bidón: explota igual), un **ficus de plástico** con polvo (bajo: las balas pasan por
  encima) y una **mesa de oficina** gris con una taza y un pósit. Las persianas, grises, con un
  cartel plastificado colgado: «REUNIÓN» (en las laterales, que no caben letras, una tarjeta roja).

### Planta 5: Atención al Cliente (`src/art/atencion.ts`)

Color dominante: **azul petróleo** (`#2d4a5e`), más verde y algo más claro que el añil del almacén
(`tests/roomart.test.ts` pide azul sobre rojo por 30 y verde sobre rojo por 16, distinto de las otras
cuatro e igual de oscuro); paredes azul noche `#1b2531`.

- **Linóleo institucional en rollos** de dos casillas de ancho, dos tintes que se alternan rollo a
  rollo, con vetas jaspeadas a lo largo del rollo y el cordón de soldadura entre rollos. Variantes:
  marcas negras de tacón, quemadura de cigarro de antes de la prohibición (más en la secreta),
  burbuja levantada, remiendo recortado en otro azul y pegatina de pies amarilla «espere aquí» con
  un talón despegado.
- **Suelo**: los remolinos de la pulidora, rayas de tacón, tiques de turno tirados y conos de papel
  del dispensador (en lugar de tornillos), la **línea amarilla «Siga la línea»** que entra desde una
  pared, gira una o dos veces y acaba con una flecha en mitad del suelo (en lugar de las rodadas; en
  la entrada, siempre), zonas de «ESPERE AQUÍ / COLA / NO PASAR» y letras en amarillo gastado
  («HORARIO: NUNCA», «VENTANILLA 0», «GRACIAS POR ESPERAR»…). Las líneas de seguridad, en azul gris.
- **Paredes**: las de dentro son **mostradores de ventanilla**: encimera de laminado con la mampara
  de metacrilato encima (un brillo claro con agujeros para hablar) y, delante, el frontal azul con el
  número de ventanilla, un cartel de «cerrada» o un folletero. La del fondo, pintura a dos tonos con
  zócalo oscuro, una fila de **sillas de espera en bancada** (a una le falta el asiento: quedan los
  tornillos), avisos A4 pegados con celo, el vinilo **«SU SATISFACCIÓN ES NUESTRA PRIORIDAD»** con
  su valoración (una estrella de cinco) cuando cabe, y **relojes que marcan cada uno su hora**.
  El turno es una pantalla que siempre dice «A047» en la ventanilla «0». Techo acústico de placas
  grandes con rejillas y paneles cuadrados de luz fría azulada. Folleteros en las laterales (todos
  vacíos menos uno) y el aviso de «hojas de reclamaciones a su disposición» en vez de pósters;
  rodapié de linóleo subido a la pared con su perfil metálico.
- Salas: entrada con felpudo «COJA NÚMERO» y cartel «PLANTA 5 · ATENCIÓN» (el nombre entero no
  cabe junto a la puerta de arriba); tienda «REPUESTOS ORIGINALES» con alfombra granate; tesoro «NO
  SE DEVUELVEN»; secreta «GRABACIONES» con cinta magnética sacada de los casetes y polvo gris
  azulado; jefe «CENTRALITA» con cables de teléfono rizados que salen de la pared del fondo.
- En la pared del fondo nada se pisa: en la planta 5 los sitios se reservan por tramos enteros
  (cartel, eslogan, pantalla, relojes) y lejos de la puerta de arriba.
- Obstáculos (`caja-5`, `barril-5`, `carrito-5`, `mesa-5`): dos **sillas de espera** de plástico
  azul atornilladas a su viga (con un chicle), el **buzón rojo de reclamaciones** lleno a reventar
  y con candado (rojo con la etiqueta amarilla: explota igual), el **cubo de fregar con el cartel
  amarillo de «suelo mojado»** (bajo: las balas pasan por encima) y la **mesita baja de la sala de
  espera**, haya clara sobre cromo, con revistas del año pasado. Las persianas, azul acero con el
  rodapié de linóleo y un cartel pegado con celo: «CERRADA» y una flecha a la ventanilla de al lado
  (en las laterales, solo la flecha) (`persiana-*-5`).

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

### El Director de Recursos Inhumanos, jefe de la planta 4 (`tools/sprites/director.ts`)

El único jefe humano. Mismo método que los otros jefes (72 × 76, cabeza de bloque iluminada
arriba a la izquierda, manos grandes de 7 × 7 sin brazos), pero todo gris menos lo que manda.

- **Cabeza**: bloque de piel morena de noviembre con la cara lateral oscura a la izquierda y la
  oreja en ella; pelo gris acero peinado hacia atrás a surcos, con la raya y el tupé fijado con
  producto. **Nunca se le ven los ojos**: gafas rectangulares de montura fina que reflejan una
  hoja de cálculo (cabecera, rejilla y un total en rojo); cuando decide (lanzar, palmada, sello)
  las gafas destellan en blanco. Sonrisa de foto de perfil (dientes cerrados, comisuras
  simétricas, el hoyuelo) y una ceja levantada; de pie (fase 3) la sonrisa se va, las cejas bajan y
  le late una vena en la sien.
- **Traje** gris corporativo una talla grande (las hombreras sobresalen), solapas, camisa, la
  corbata granate de logotipos con el pisacorbatas dorado, el anillo de sello de la empresa, el
  pañuelo en punta y la acreditación azul que se le olvidó quitar. De espaldas, la etiqueta de la
  tienda sigue colgando del cuello de la chaqueta (el lunes lo devuelve).
- **Silla de dirección** de **polipiel granate** (en negro se perdía en la moqueta): respaldo alto
  con pespuntes, asiento, pistón y base de estrella con ruedas cuyo brillo gira al rodar.
- **Hoja `director-rrhh`** (18 fotogramas, nombres en `DIRECTOR_FRAMES`): 0–1 sentado; 2–5 el
  impulso (los pies delante, el empujón, rodando con los pies levantados en dos tiempos); 6
  lanzando una carta, 7 la palmada (con tres rayitas blancas fuera del contorno), 8 con su sello de
  Denegado en alto; 9–14 de pie (reposo, respiración y el paso levantando el pie, sin cruzar);
  15 lanzando de pie; 16–17 girando la línea de recortes, de espaldas y con las manos abiertas.
  Todos pisan la misma línea (las ruedas sentado, los zapatos de pie).
- **La silla sola** (`silla-director`, 44 × 52, 7): quieta, rodando en dos tiempos y a punto de
  embestir (polvo de moqueta detrás de la rueda). Con la marca de él en el asiento y la etiqueta
  de su chaqueta caída encima. En la fase 3 (M10 planta 4 5c) se añadieron tres: quieta con la
  etiqueta levantando una esquina (su respiración) y rodando con la etiqueta echada hacia atrás,
  para que ruede en cuatro pasos distintos (1, 2, 5, 6).
- **Balas**: tarjetas de visita (`bala-tarjeta-visita`, 10 × 8, 4 giros) blancas con el borde
  **cian**, para no confundirlas con las tarjetas rojas de la Nevera; cartas de despido
  (`carta-despido`, 12 × 10, 2: el sobre con el lacre rojo y el dorso con la línea roja de
  «Personal y confidencial»), que vuelan en parábola; diapositivas (`bala-diapositiva`, 9 × 9, 2:
  marco rojo, un gráfico de barras bajando, y de canto); y los recortes (`bala-recorte`, 9 × 9),
  bala roja con núcleo blanco y una flecha hacia abajo.
- **Sala de Juntas**: la mampara móvil (`mampara-movil`, 72 × 24, del tamaño de tres casillas de
  pared y con su carril de 7 px como las de cubículo): cristal esmerilado frío con vetas de luz,
  la banda de vinilo y la pegatina roja de alguien que se dio con ella; el fotograma 1 es la
  silueta discontinua de adónde va a ir. La **mesa larga** (`mesa-juntas`, 168 × 52, siete
  casillas) de nogal, con el tablero en tres cuartos y el faldón hasta el suelo: las sillas de
  enfrente vacías asomando, el portátil con el gráfico bajando, la pila de carpetas del «Plan de
  Reestructuración», la jarra con un solo vaso (aforo: uno), el mando del proyector, el
  vade de piel y la placa dorada de su sitio, y el cerco de café de otro.

### La Centralita, jefa de la planta 5 (`tools/sprites/centralita.ts`)

La primera jefa sin piernas ni manos: un cuadro de conexiones antiguo del tamaño de un armario. Mismo
lienzo que los otros jefes (72 × 76, todos los fotogramas sobre la misma línea de suelo) y la misma
luz (tapa clara, cara lateral oscura a la izquierda, frente a la derecha), pero en lugar de manos
lleva **los dos cables largos del pupitre como brazos**, con una clavija gorda en la punta.

- **Mueble** de **teca barnizada** (de cuando una centralita era un mueble; marrón cálido, que se
  despega del linóleo azul petróleo), sobre un zócalo oscuro rayado de arrastrarse. Cornisa con la
  placa de latón ilegible; en el lado oscuro, un pósit amarillo («Vuelva a llamar más tarde»).
- **Cara** en el panel de baquelita negra, rodeada de conectores con aro de latón y sus pilotos de
  llamada (siempre hay alguno encendido: llamadas en espera; se turnan entre fotogramas). **Ojos**:
  dos pilotos de cristal ámbar en bisel cromado, tapados por abajo en arco para que sonrían (^ ^).
  **Boca**: el altavoz de tela con lamas, en forma de sonrisa de media luna con las comisuras
  rizadas hacia arriba: la sonrisa de una voz grabada, la misma para todas las llamadas. Hablando,
  la tela se abre y se aclara en el centro y salen arcos de sonido (dos tiempos).
- **Pupitre** salido sobre las puertas, con la fila de clavijas de pie (rojas y negras, punta de
  latón), las palancas y el disco de marcar. **Puertas** de cuarterones con su bocallave y, colgado
  de un gancho, **el casco de la operadora, sin nadie dentro** (fue lo primero que sustituyó).
- **Fase 3, sin clavijas**: el pupitre vacío (solo los agujeros), los pilotos en **rojo** con
  párpados que bajan hacia el centro, la tela del altavoz rasgada (y sigue sonriendo), los cables en
  alto con chispas cian en la punta. **Muda**: los pilotos en blanco, sin brillo, el altavoz a
  oscuras y los cables caídos en el suelo con las clavijas negras: el momento de darle.
- **Hoja `centralita`** (14 fotogramas, nombres en `CENTRALITA_FRAMES`): 0–1 reposo (pilotos de
  llamada y cable que se mece); 2–5 arrastrarse (el cable de delante se estira, se clava en el
  suelo, tira del mueble un píxel hacia delante con polvo detrás, y el de atrás empuja); 6–7
  hablando; 8 lanzando una clavija con el cable en alto; 9–10 sin clavijas (cables arriba, en dos
  tiempos); 11–12 arrastrándose sin clavijas; 13 muda.
- **Balas**: la clavija (`bala-clavija`, 12 × 6) con funda **roja** de núcleo blanco, virola de
  acero y un trozo de cordón, apuntando a la derecha; las notas de la música de espera
  (`nota-espera`, 9 × 10, 2: corchea y dos semicorcheas unidas) en **cian** con núcleo blanco.
- **Su sala**: los **mostradores bajos** (`mostrador-bajo`, 72 × 30, tres casillas, uno por
  departamento: 1 Reclamaciones rojo con el timbre, 2 Facturación azul con la pila de impresos, 3
  Averías amarillo con un auricular roto, 4 Bajas gris con el cartel de cerrado) con la misma
  encimera que las ventanillas de la planta pero a la altura de la cintura y sin mampara, y su placa
  de color con el número en el frente; el vertical (`mostrador-bajo-v`, 24 × 82, tres casillas de
  largo). Sus cajas (`LOW_COUNTER_BOX`, `LOW_COUNTER_V_BOX`) las usará la sala en la (2c2). Las
  **zonas del menú de voz** (`zona-menu`, 72 × 48, 6): rectángulos de esquinas redondeadas
  translúcidos con «PULSE» y el número grande; 0–2 en espera (azul pálido, borde a trazos), 3–5 con
  las balas encima (rojo, rayado en diagonal, borde continuo).

### Los enemigos de la planta 5 (`tools/sprites/clientela.ts`)

Las mismas reglas que los demás enemigos (cabeza de cubo en tres cuartos mirando a la derecha,
manos flotantes del material de la carcasa, piernas cortas con zapato de oficina, contorno de 1 px),
y cada uno con un color que se despega del linóleo azul petróleo: **rojo**, **cromo**, **blanco** y
**beis**. Los nombres de los fotogramas están en `DISP_FRAMES`, `POST_FRAMES`, `AV_FRAMES` y
`PHONE_FRAMES`.

- **Dispensador de Turnos** (`dispensador-turnos`, 30 × 35, 8): una caja roja de «coja número»
  (más oscura y parda que las balas, para que un tique no se pierda encima) sobre un poste cromado y
  un pie de hierro redondo, con sus piernas debajo. En la frente, la pantalla de LED con **«087»**,
  que no cambia nunca; debajo, ojos de funcionario aburrido; la ranura es la boca y el **rollo de
  papel le cuelga como una lengua**. En el lateral, la ventanita con el rollo; encima, el cartel
  «Respete su turno» torcido. 0–1 reposo, 2–5 andar, 6 **llama** (el número al blanco, las cejas
  arriba, las manos arriba, un tique a medio salir), 7 **escupe** («turno perdido»: furioso, la
  lengua larga y rota, tiques volando). Sus balas, los tiques (`tique-turno`, 9 × 7, 2: plano y
  doblado, para los que planean), rojos con núcleo blanco. El **círculo del turno**
  (`circulo-turno`, 82 × 82, radio 40, translúcido, con doce marcas de pegatina por dentro): 0
  llamado (amarillo, borde a trazos; el número lo escribe el juego encima), 1 atendido (verde,
  continuo), 2 perdido (rojo rayado).
- **Postes de Cola** (`poste-cola`, 22 × 34, 16): un poste separador cromado cuya cabeza es el
  tambor de la cinta, con ojos de portero que te ha visto intentar colarte y el enganche azul de la
  cinta asomando por delante. Andan con las piernas juntas (`narrowPoseCycle`). 0–1 reposo, 2–5
  andar, 6 dispara (cejas en V, destellos en la tapa), 7 suelta la cinta (sin enganche, la boca
  abierta); 8–15, los mismos con **la base desconchada** hasta el óxido (el otro de la pareja). La
  **cinta** (`cinta-poste`, 24 × 6, 2, opaca, para repetir a lo largo): azul vivo, más clara que el
  suelo, con «HAGA COLA AQUÍ» al revés en blanco; 1 tensa (más clara, empuja). No confundir con
  `cinta-cola`, la de la cola del Mostrador. Sus balas, las bolas de acero (`bola-acero`, 7 × 7) con
  brillo cian y núcleo blanco.
- **Asistente Virtual** (`asistente-virtual`, 27 × 36, 8): un tótem blanco de pantalla táctil
  sobre un pie estrecho. La cara es **el dibujo de la pantalla**: dos ojos de punto y una sonrisa
  grande que **no cambia en ningún fotograma** (lo vigila el test). La pantalla, con huellas de
  dedos y «¿En qué puedo ayudarle?» quemado arriba; en el lateral, el papel «Si no le entiende,
  hable más despacio». 0–1 reposo, 2–5 andar, 6–7 escribiendo (los tres puntitos bajo la sonrisa,
  la mano levantada). Balas: **bocadillos** (`bocadillo`, 11 × 9, 2: volando y parado con «…»),
  cian con núcleo blanco. El **escudo de preguntas frecuentes** (`escudo-faq`, 8 × 30, 2: puesto y
  desvaneciéndose): una pila curva de bocadillos translúcidos con una línea de texto cada uno,
  dibujado a la izquierda (el juego lo gira hacia los disparos). Al romperse, «¿Le he ayudado?»:
  los botones (`boton-ayuda`, 13 × 10, 2) **SÍ** en cian y **NO** en rojo, de cara blanca.
- **Teléfono de Recepción** (`telefono-recepcion`, 36 × 30, 7): un teléfono de mesa beis, bajo y
  ancho, con demasiadas teclas. La horquilla de arriba está **vacía**: el auricular le cuelga por
  detrás del cable rizado. Ojos de recepcionista cansada sobre el teclado, la luz roja de **mensaje
  en espera siempre encendida** y un pósit amarillo encima («Ext. 0»). Va a saltos: 0–1 reposo, 2
  agachado, 3 en el aire (piernas recogidas, el auricular sube), 4–5 sonando (tiembla, ojos
  apretados, boca abierta, arcos de timbre en dos colores), 6 «le paso con un compañero» (mira de
  reojo con media sonrisa). Su llamada (`bala-llamada`, 13 × 13, 2: el anillo late), roja con
  núcleo blanco y un auricular dibujado; los anillos de timbre y la espera usan `bala-roja` y
  `nota-espera`.

### Las armas de la planta 5 (`tools/sprites/megafono.ts`)

- **`arma-megafono`** (18×11, la boca a la derecha como todas): el tambor rojo del altavoz detrás,
  con una tira de cinta gris en la tapa de las pilas; la bocina crema que se abre (de 3 a 9 px)
  con un aro rojo a medio camino y el borde rojo de la boca, por dentro oscuro; la pegatina
  amarilla del precio con el precio tachado; empuñadura de pistola gris oscuro con su gatillo.
- **`bala-onda`** (7×13, vuela a la derecha y el juego la gira): un arco claro delante (blanco en
  el centro, amarillo pálido en las puntas), un filo amarillo detrás y un arco naranja más pequeño
  dentro. Las siete ondas de un disparo se solapan en un abanico; cada una crece de ×0,9 a ×1,8 y
  se apaga hasta el 40 % (`look.swell`, el mismo mecanismo que el vapor de la plancha).
- **`arma-etiquetadora`** (18×11, `tools/sprites/etiquetadora.ts`): la pistola de etiquetar de
  cualquier pasillo de súper. Cuerpo de plástico azul en cuña (más alto detrás), el rollo de
  etiquetas blanco arriba atrás con su borde crema y las vueltas marcadas (sin un centro oscuro,
  que parecía un ojo), la ventanita crema con los números rojos del precio, la boquilla gris con
  una etiqueta a medio salir y, debajo, la empuñadura gris con la palanca azul delante.
- **`bala-etiqueta`** (7×5, gira con el vuelo): etiqueta blanca con el borde naranja de todas las
  balas del jugador y el precio en rojo.
- **`etiqueta-pegada`** (7×6, 3 fotogramas, cada una torcida a su manera): etiqueta de oferta
  amarilla pálida con el precio rojo en una franja blanca y contorno negro, para que se lea encima
  de cualquier cuerpo (la blanca se perdía en el microondas y en los blancos). El juego pone una por etiqueta, de
  arriba abajo en el cuerpo, y las hace parpadear el último medio segundo antes de despegarse.
  «Rebajado» es un aro amarillo con otro rojo dentro, del tamaño del estallido, chispas amarillas
  y rojas, trocitos de papel y el texto en amarillo.

