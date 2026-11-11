# Garantía Expirada — documento de diseño

Documento vivo. Claude lo amplía a medida que el juego crece, pero la premisa, el tono y el
estilo aprobados no se cambian sin una nota del humano.

## Premisa

Te vendieron una tostadora «para toda la vida». Duró hasta el martes.

Ahora estás en el vertedero de **Megamarket Outlet**, una cadena de grandes almacenes infinita
donde acaba todo lo que se rompe un día después de que caduque la garantía. La única salida es
subir planta por planta hasta la oficina del **Servicio Técnico Oficial**, que según la
leyenda arregla cualquier cosa. Nadie ha vuelto para confirmarlo.

Por el camino te esperan los demás productos desechados. Ellos tampoco pidieron esto, y
tienen tantos motivos como tú para estar enfadados. Están dispuestos a pagarlo con el primero
que pase.

### El gran chiste de fondo (se revela poco a poco)

El Servicio Técnico no existe. Es un número de teléfono con música de espera. El verdadero
final, que se desbloquea tras varias victorias, es descubrir que el «Servicio Técnico» es una
máquina que tritura lo que le llevan y vende las piezas como «reacondicionadas». El jugador es,
literalmente, el producto.

## Tono y guía de humor

**Sátira, humor negro y crítica social.** El referente de tono es Enter the Gungeon (juegos de
palabras con el tema, objetos absurdos) mezclado con la amargura de The Binding of Isaac, pero
el blanco es el consumismo moderno.

Temas que alimentan los chistes:

- Obsolescencia programada, garantías, letra pequeña, «condiciones aplicables».
- Atención al cliente: esperas, bots, «su llamada es muy importante», encuestas de satisfacción.
- Precariedad: becarios, contratos temporales, ascensos a mando intermedio sin subida.
- Publicidad y ofertas: «-70 %», «solo hoy», programas de fidelización, suscripciones.
- Reciclaje que nadie hace, eficiencia energética de pega, ecopostureo.
- Burocracia corporativa: tickets, devoluciones, formularios, reuniones.

Reglas de escritura:

1. **Corto.** Nombre de objeto: 2 a 4 palabras. Descripción: una frase, dos como mucho.
2. **Seco.** El chiste se cuenta sin explicarlo y sin signos de exclamación.
3. **Concreto.** Mejor «Válido durante 14 días» que «muy gracioso y absurdo».
4. **El blanco son las empresas y los sistemas**, nunca grupos de personas vulnerables.
5. **Variado.** Que no todo sea un juego de palabras. Alterna ironía, absurdo y amargura.

Ejemplos aprobados (sirven de patrón):

| Nombre | Descripción |
| --- | --- |
| Manual en Chino | Nadie sabe por qué funciona. Tampoco el fabricante. |
| Pila Casi Agotada | Dura lo que un contrato temporal. Después, nada. |
| Ticket de Compra | Se puede devolver todo menos el tiempo perdido. Válido durante 14 días. |
| Garantía Extendida | Cubre todo excepto lo que te pase. La letra pequeña no se puede leer: forma parte del servicio. |
| Secador Mágnum 2200 W | Dispara aire caliente a presión. Despeina, quema y no cubre daños por mal uso. |
| Grapadora Táctica | Munición: grapas de la empresa. Ya se descontarán de tu nómina. |
| Plancha de Vapor Turbo | Vapor a tres bares. Quita las arrugas, la pintura y las ganas de reclamar. No planchar la ropa puesta. |

Pantalla de muerte: en vez de «Has muerto», un **parte de baja** del producto con causa
(«Daños por mal uso: no cubiertos»), tiempo de vida útil, sala, y una línea de
«Recomendación del fabricante» con un chiste distinto cada vez.

## Personajes

### Jugables

| Personaje | Estado | Idea |
| --- | --- | --- |
| **Tostadora Reacondicionada** | Aprobada (sprite en `art/referencia/`) | Protagonista inicial. Harta de todo, quema una tostada de cada dos, arrastra el cable deshilachado. Arma inicial: Secador Mágnum. |
| Batidora de Vaso | Por desbloquear | Rápida y frágil. Su esquiva es un giro de cuchillas. |
| Plancha de Vapor | Por desbloquear | Lenta y dura. Deja un rastro que quema. |
| Un humano: el Becario Eterno | Por desbloquear (no es un electrodoméstico) | El único humano atrapado en el vertedero. Lleva seis años en prácticas. Arma inicial: Grapadora Táctica. |
| Móvil Reacondicionado | Por diseñar | Vendido «como nuevo» con la pantalla rajada y la batería al 1 %. Se apaga si se queda quieto demasiado tiempo. Nadie le actualiza el sistema desde hace dos versiones. |

Son **cinco personajes jugables**, cada uno con su historia: por qué acabó en el vertedero, una
escena al empezar la partida y su propio final (hito M13).

### Enemigos de la primera planta (Electrodomésticos)

| Enemigo | Estado | Comportamiento |
| --- | --- | --- |
| **Aspirador Desahuciado** | Aprobado | Patina hacia ti en línea recta, frena y vuelve a cargar. Aún lleva la etiqueta del -70 %. |
| **Microondas Sin Seguro** | Aprobado | Se queda quieto, «calienta» 1 s (parpadea) y dispara anillos de ondas. El reloj parpadea en 12:00 desde hace diez años. |
| **Bombilla de Bajo Consumo** | Aprobada | Mando intermedio. Tarda en encenderse y dispara espirales de chispas. Le acompaña una polilla fiel. |
| Polilla Fiel | Hecha | Acompaña a la Bombilla: le da vueltas y de vez en cuando se lanza contra ti. Las polillas van a la luz: con la bombilla apagada no ataca. Lo llama lealtad; la bombilla, «compromiso con la empresa». |
| Batidora de Mano | Hecha | Persigue y hace daño cuerpo a cuerpo: de cerca se para, gira las varillas y se lanza. Cinco velocidades: la uno y el turbo; con poca vida el selector por fin se mueve y entra en TURBO (todo más deprisa). Varillas con masa de una tarta de hace años y el cable atado en un nudo. |
| Mando a Distancia | Hecho | Enemigo débil (4 de vida) que viene en grupo de tres. Nunca está donde lo buscas: se pasea alrededor de ti, avisa y suelta una ráfaga corta de «infrarrojos» (rojos, para que se vean) y se apaga como una tele vieja (se aplasta en una raya blanca y luego en un punto); mientras no está, el suelo donde va a volver chisporrotea de estática. Reaparece lejos de donde apuntas. Si le das, también se esfuma (como mucho una vez cada 2,5 s). Sin tapa de las pilas (las sujeta un trozo de celo), sin el botón del uno, con un ganchito pegado en la cabeza y en zapatillas de casa: vive en el sofá. |

### Enemigos de la segunda planta (Informática)

Salen solo desde la planta 2 (letra en la plantilla y en `SLOT_ENEMIES_2` de `src/data/rooms.ts`),
mezclados con los de la planta 1.

| Enemigo | Estado | Comportamiento |
| --- | --- | --- |
| Impresora que se Atasca | Hecha | Torreta que se pasea despacio guardando las distancias y te imprime ráfagas de seis facturas (hojas blancas con borde rojo) que vuelan haciendo eses. Cada dos o tres ráfagas se atasca: 2 s quieta, temblando, sin disparar («Atasco de papel»): es el momento de ir a por ella. Al desatascarse avisa y lo suelta todo en dos anillos (bolas de papel rojas y facturas). Beis amarillento, un montón de folios detrás, la ranura de salida como boca con la factura colgando, un pósit que dice NO, la etiqueta del precio de la tinta y zapatos de oficina. |
| Cargador Falso | Hecho | Viene en pareja y espera tirado en el suelo como un cargador olvidado, con su etiqueta de GRATIS. Si te acercas (64 px) o le disparas, salta («No homologado»), corre hacia ti y, de cerca, chisporrotea medio segundo y suelta un calambre en corro: dos anillos de chispas cian que se apagan enseguida (alejarse o rodar basta). 8 de vida. Las clavijas son sus cuernos, el cable es su cola, tiene una quemadura en la cara (se recalienta) y lleva chanclas. |
| Ratón Inalámbrico sin Pilas | Hecho | Va hacia ti (sin meterse encima: de cerca te rodea) y, cada poco más de un segundo, se queda sin señal: se congela 0,85 s con un círculo de carga por ojos mientras un anillo rojo marca dónde va a aparecer (hasta 110 px más cerca, nunca a menos de 56 px de ti; si ya está cerca, salta de lado). Luego aparece allí de golpe y hace clic: dos anillos de ocho balas. 10 de vida. Ruedecita, luz de batería baja parpadeando, el hueco de las pilas vacío con una telaraña y el cable cortado con tijeras para hacerlo «inalámbrico». |
| Webcam Siempre Encendida | Hecha | Enemigo de apoyo, como mucho una por sala. Guarda las distancias (150 px) y, cada 1,6–2,6 s, si te ve (nada en medio, a menos de 260 px), **graba**: 1,2 s con el objetivo en rojo, «Grabando» encima y una línea de puntos rojos que te sigue. Si te escondes detrás de algo, «Conexión perdida» y vuelta a empezar. Si no, «Compartiendo pantalla»: los demás enemigos de la sala dejan de esperar y atacan ya, y durante 4 s sus esperas corren ×1,6; ella saca la foto (dos abanicos, de cinco y de cuatro balas). 12 de vida. Barra de webcam negra sobre su pinza de monitor, el objetivo como único ojo bajo la tapa de privacidad bajada a medias como un párpado receloso; la lucecita de «no estoy grabando», apagada y rota (graba igual); el trozo de celo que alguien le puso, despegado y colgando, y la cola USB. |

### Enemigos de la tercera planta (Juguetería)

La planta 3 es el muro de la partida (nota del humano: pasar de ella tiene que ser difícil de
verdad). Sus enemigos no pegan más fuerte: castigan quedarse quieto y no mirar el suelo. Salen
desde la planta 3, mezclados con los de las plantas de abajo. Lo que sí cambia es lo que aguantan:
en la Juguetería todos los enemigos de las salas (también los de abajo) tienen un 30 % más de vida
(«juguetes homologados para resistir a un niño de tres años»; los jefes, aparte, conservan la suya),
y en las Oficinas un 50 % (`FLOOR_TOUGHNESS` en `src/data/rooms.ts`, medido en M10 (7)). Juguetes gastados, nunca monos:
caras de cansancio y de rencor, pintura saltada, pegatinas de oferta a medio despegar (la regla
de `docs/ESTILO_ARTE.md` de nada de estética infantil vale aquí más que en ningún sitio).

| Enemigo | Estado | Comportamiento |
| --- | --- | --- |
| Robot de Cuerda | Hecho | Entra dándose cuerda (0,6 s) y sale hacia la tostadora (±35°). Anda en línea recta y deprisa (92 px/s) mientras le gira la llave, y rebota en las paredes y en las cosas como una bola de billar, nunca recto por un eje (para que no rebote siempre en la misma línea); en cada rebote suelta un abanico de tres tuercas apuntado a la tostadora (como mucho uno cada 0,35 s, para que una esquina no dé dos). Cada 4–5 s se le acaba la cuerda: se para en seco 2 s, con la llave quieta y «Cuerda agotada» encima, y recibe el doble de daño; los últimos 0,6 s se da cuerda él solo (avisa con el ruido de la llave y tiembla). 14 de vida. Letra `Q` de las plantillas; sale desde la planta 3. Hojalata abollada, un ojo de tornillo, la llave a la espalda con un esparadrapo y la etiqueta «Edad: 3+» rayada a «Edad: 33+». |
| Coche Teledirigido | Hecho | Rodea a la tostadora a mucha velocidad (125 px/s, más que ella), a unos 90 px, en arcos (gira como mucho 200° por segundo), derrapando: deja marcas de ruedas que se borran en unos segundos. Tras 1,2–2,2 s, en cuanto la tiene de lado (a menos de 35° de perpendicular) y a menos de 170 px, frena y apunta (0,38 s, con su línea roja y los faros en rojo) y embiste en línea recta (265 px/s, 0,75 s). Si choca con la pared o con una caja vuelca 1,5 s con las ruedas al aire (el momento de darle; ponerse detrás de algo lo provoca). «Pilas no incluidas»: cada 3,5–6 s se para 0,8 s a mitad de un arco, parpadea y sigue. Rozando una pared mientras da vueltas, rebota y cambia de sentido. 10 de vida. Letra `V`; sale desde la planta 3. Un deportivo de plástico con cara de matón en el parachoques, una antena doblada, un alerón pegado con celo y una rueda de otro coche. |
| Cubo de Piezas | Hecho | Torreta lenta que guarda las distancias y lanza en parábola puñados de piezas de construcción: caen donde marca una sombra y se quedan en el suelo 6 s. Pisarlas andando quita medio corazón (como pisar una de verdad descalzo); rodando por encima no pasa nada, y una bala las barre (si una cae a tus pies, no cuenta hasta que te apartas y la vuelves a pisar). Guarda unos 140 px andando a 38 px/s; cada 2,6–3,6 s levanta la tapa 0,55 s (aviso) y lanza tres piezas (0,85 s de vuelo, cruces amarillas donde caerán): una adonde va la tostadora y dos a menos de 32 px. Como mucho 12 piezas en el suelo. Es lo contrario de la escarcha: aquí lo que castiga es andar. 16 de vida. Letra `U`; sale desde la planta 3. Un cubo de plástico con asa, la tapa como gorra, ojos de dos piezas redondas y una pieza que no encaja con nada pegada en la frente. |
| Sobre Sorpresa | Hecho | Un sobre de cromos sellado, de papel metalizado rosa, con una estrella con «?», la línea de «abrir por aquí» y la letra pequeña en el lateral. Da saltitos (0,42 s en el aire, hasta 14 px de alto, 30–55 px por salto) buscando quedarse a unos 110 px, con un regate a un lado; en el aire se le da donde se le ve. Cada tres saltos se hincha y escupe dos abanicos cortos de confeti de papel de regalo (5 y 4 trozos que se frenan y no pasan de unos 130 px). Al romperlo sale algo al azar, con su letrero: dos **Muñequitos Repetidos** (75 %; 3 de vida, salen disparados, persiguen a 66 px/s y muerden), una lluvia de **4 cupones** (20 %) o el **Muñequito Dorado Ultrarraro** (5 %; 10 de vida, guarda las distancias, dispara anillos de confeti y suelta 5 cupones). Las probabilidades están en su descripción, «en el reverso, en letra pequeña». 8 de vida. Letra `Y`; sale desde la planta 3 (los muñequitos solo salen de los sobres, y más adelante del jefe). |

### Enemigos de la cuarta planta (Oficinas)

La planta 4 llega después del muro: aquí la partida ya va cargada de objetos, así que sus
enemigos no tienen más vida de base que los de la Juguetería (la planta entera aguanta un 50 %,
ver arriba), sino que atacan cada uno una costumbre
del jugador: disparar siempre de frente, ignorar al que apoya, rodar a todas horas y quedarse
en un sitio. Salen desde la planta 4, mezclados con los de las plantas de abajo. Aparatos de
oficina con años de servicio y ninguno de reconocimiento: plástico beis amarilleado, pegatinas
de inventario («Activo n.º 00412»), cables con bridas y pósits que nadie quita.

| Enemigo | Estado | Comportamiento |
| --- | --- | --- |
| Destructora de Documentos | Hecho | Anda hacia la tostadora despacio (34 px/s), **siempre de cara**: la boca de cuchillas por delante, y gira despacio (90° por segundo). Las balas que le entran por delante (en 100° de frente) no le hacen nada: se las traga con ruido de trituración y, cada cuatro balas tragadas, escupe hacia la tostadora un abanico de cinco tiras de papel (lo que le das de frente te vuelve). Por los lados recibe daño normal y por detrás, donde lleva la papelera llena, el doble. Cada 3–4 s, si la tostadora está a menos de 110 px y delante, avisa («Atasco», 0,4 s, las cuchillas en rojo) y se lanza 0,5 s hacia ella intentando tragársela (medio corazón). 18 de vida. Castiga disparar de frente sin moverse: hay que rodearla. Beis, con la papelera transparente a rebosar de tiras, la pegatina «No introducir la mano» y un pósit pegado en la boca que dice «Confidencial». |
| Fotocopiadora de Planta | Hecho (letra `K`) | Enemigo de apoyo, como mucho una por sala. Guarda las distancias (170 px) y anda muy despacio. Cada 4–5 s levanta la tapa: una luz verde barre el cristal (1 s de aviso, con una raya de luz verde hasta el enemigo que va a copiar, el más cercano que no sea copia ni jefe) y saca por la bandeja una **copia**: el mismo enemigo, gris y con rayas de tóner, con la mitad de vida, un 20 % más lento, sin cupones. Como mucho tres copias suyas a la vez. Si no hay a quién copiar (o ya tiene tres copias), imprime un abanico de tres folios hacia la tostadora. Tampoco copia cebos escondidos ni cosas desaparecidas. Al salir, sobre la copia: «Copia no compulsada». Al romperla, «Sin tóner»: sus copias se destiñen y caen en un segundo. 14 de vida. Castiga ignorar al que apoya, como la Webcam, pero aquí cada segundo que vive llena la sala. Grande y cuadrada, con la pantallita en «Error E-04», un folio atascado asomando como una lengua y un cartel de «Averiada, no tocar» del que nadie se acuerda. |
| Sello de Denegado | Hecho (letra `G`) | Un tampón de caucho con mango de madera. Avanza a saltos hacia la tostadora (0,5 s en el aire, 40–60 px por salto; en el aire se le da donde se le ve) y cada tercer salto cae de golpe (sombra cuadrada de aviso, 0,5 s) y estampa en el suelo un cuadro de tinta roja de unos 40 × 40 px con «DENEGADO» que dura 5 s. Pillar a la tostadora debajo al estampar quita medio corazón y suelta un anillo corto de ocho gotas de tinta. **Dentro de la tinta no se puede rodar**: la voltereta se queda en un paso torpe, sin invulnerabilidad, y sale «Solicitud denegada»; andar y disparar, sí. Como mucho tres sellos suyos en el suelo. 10 de vida. Castiga fiarlo todo a la voltereta. El caucho gastado de tanto denegar, el mango con marcas de dientes y la almohadilla de tinta seca colgando de una cuerda. Como lo hizo el juego: para estampar sube 30 px y planea hasta encima de donde está la tostadora (como mucho a 110 px) durante el aviso; las gotas salen siempre, pero un golpe limpia las balas del aire, como cualquier otro; la voltereta se deniega si empieza dentro de la tinta (rodar hacia ella desde fuera sí vale); en el aire, mientras estampa, no hace daño por contacto. Como mucho dos por sala. |
| Climatizador Portátil | Hecho (letra `H`) | Torreta pesada que se arrastra muy poco y oscila de lado a lado (90° en 3 s), soplando un cono de aire frío de 45° y 200 px que se ve con rayas blancas: **dentro del cono la tostadora es empujada** (60 px/s: se puede andar contra él, pero cuesta) y sus balas se tuercen hacia fuera del cono. Cada 2,5–3,5 s, si la tostadora está en el cono, sopla seis copos de escarcha en el sentido del aire. Por detrás, la manguera de salida echa aire caliente: quien se pega a su espalda está a salvo del cono, pero no de los demás. 20 de vida. Castiga quedarse quieto: el aire lleva a la tostadora hacia las balas de los demás. La pantallita marca 17 °C («Nadie sabe quién lo ha puesto»), la manguera remendada con cinta y un folio pegado con celo: «NO TOCAR. Firmado: Dirección». Como lo hizo el juego: el centro del vaivén sigue a la tostadora a 35 °/s; las balas se tuercen a 110 °/s hacia fuera del cono, así que de frente y de lejos no se le da (de cerca, o desde un lado, sí); dos conos no suman (nunca empujan más que uno), la fotocopiadora no lo copia y como mucho hay uno por sala. 12 px/s y nunca retrocede (la manguera no llega). |

### Enemigos de la quinta planta (Atención al Cliente)

La última planta normal (M11, diseño del 2026-11-05). La partida llega con muchos objetos y la
tostadora ya sabe rodar, rodear y no quedarse quieta; los enemigos de aquí atacan lo que queda:
**esconderse y esperar** (el Dispensador te saca de detrás de la mesa), **ir siempre por el
camino corto** (los Postes te hacen la cola), **disparar siempre desde el mismo sitio** (el
Asistente aprende) y **fijar a uno y no soltarlo** (el Teléfono te lo cambia de sitio). El chiste
es la espera: turnos, colas, menús de voz, «le paso con un compañero». El blanco es el sistema y
la empresa, nunca la gente que trabaja detrás del mostrador: aquí no hay teleoperadores, solo
las máquinas que los sustituyen. Salen desde la planta 5, mezclados con los de abajo; la planta
aguanta como las Oficinas o algo más (`FLOOR_TOUGHNESS`, se mide en M11 (7)). Aparatos de
atención al público: plástico azul institucional desteñido, pegatinas de «Fuera de servicio» que
nadie quita, cables con cinta de embalar y números de serie rascados.

| Enemigo | Estado | Comportamiento |
| --- | --- | --- |
| Dispensador de Turnos | Hecho (M11 4s y 4a) | La máquina de «Coja número» sobre su pie. Enemigo de apoyo, como mucho uno por sala, lento y a distancia. Cada 4–5 s **llama un turno**: «Turno 087, ventanilla 3». En el suelo se enciende un círculo con el número (unos 40 px de radio, lejos de donde está la tostadora y siempre alcanzable) y una cuenta atrás de 2,5 s. Si la tostadora llega al círculo a tiempo, «Atendido»: no pasa nada (y el círculo para las balas enemigas que lo cruzan, una ventanilla con mampara). Si no, «Turno perdido» y la máquina escupe un abanico ancho de tiques de papel hacia ella. Sin turno, suelta tiques sueltos que planean despacio. 14 de vida. Castiga esconderse detrás de algo y esperar: el sitio seguro lo elige ella. Carcasa roja con el rollo de papel asomando como una lengua, la pantalla que marca un número que nunca cambia y el cartel «Respete su turno» torcido. |
| Postes de Cola | Hecho (M11 4s y 4b) | Dos postes separadores de acero cromado con su cinta retráctil, que siempre salen juntos (un grupo de dos). Se mueven despacio buscando ponerse a los lados de la tostadora y **tienden la cinta entre ellos**: una barrera que no se cruza ni andando ni rodando («No se cuele») y que deja pasar las balas. Cuando la tienen en medio, la cinta se acorta y empuja hacia dentro: te hacen la cola. Cada 3 s el poste más cercano suelta un anillo corto de cuatro bolas de acero. Romper uno suelta la cinta (vuelve al otro con un chasquido) y el que queda dispara más a menudo. 10 de vida cada uno. Castiga ir siempre por el camino más corto y atravesarlo todo rodando. La cinta azul con «Haga cola aquí» impreso del revés y un poste con la base desconchada. |
| Asistente Virtual | Hecho (M11 4s y 4c) | Un tótem de pantalla táctil con una cara sonriente de dibujos que no cambia nunca (el chatbot). Guarda las distancias y dispara **bocadillos de texto** que se paran un momento a mitad de camino («Escribiendo…», tres puntitos) y siguen hacia donde la tostadora iba a estar. **Aprende**: si recibe tres balas seguidas desde casi el mismo sitio (menos de 60° de diferencia), «Pregunta frecuente»: un escudo de respuestas predefinidas que para todo lo que llega por ese lado 3 s; hay que darle desde otro ángulo. Al romperse, «¿Le he ayudado? Sí / No» y los dos botones caen como balas lentas. 16 de vida. Castiga disparar siempre desde el mismo sitio. La pantalla con huellas de dedos, el «¿En qué puedo ayudarle?» quemado en ella y un cartel de papel «Si no le entiende, hable más despacio». |
| Teléfono de Recepción | Sprites hechos (M11 4s); pendiente (M11 4d) | Un teléfono de mesa beis de los de muchas teclas, que va dando saltitos arrastrando el cable rizado. Suena (tres timbrazos, cada uno un anillo pequeño de seis balas lentas) y lanza **llamadas**: una bala gorda que persigue un poco. Cuando ha perdido la mitad de la vida, **«Le paso con un compañero»**: una línea de puntos lo une 0,8 s con el enemigo más lejano de la tostadora y se cambian de sitio (como mucho una vez cada 4 s). Si no queda nadie, pone a la tostadora en espera: un anillo de notas de música lentas que ondulan. 12 de vida. Castiga fijar a un enemigo de lejos y no soltarlo. El auricular colgando del cable, un pósit con «Ext. 0» y la luz de «mensaje en espera» siempre encendida. |

### Jefes

| Jefe | Estado | Idea |
| --- | --- | --- |
| **La Nevera Suprema** | Aprobada | Jefa de la planta 1, 135 de vida (200 hasta M9b 15: las armas pegan menos) y rabia 0,45. Fase 1, «Congelación de precios»: ráfagas de cubitos, anillos de granizo y bolas de escarcha que dejan charcos que frenan al andar (no al rodar). Fase 2, «Oferta irrechazable» (desde la mitad de la vida): abre la puerta y enseña un interior lleno de comida caducada; dispara tarjetas de fidelización que te persiguen un rato (más lentas que tú, giran abierto y se rompen a tiros), escupe yogures hinchados, bricks y latas abolladas que caen donde marca un anillo rojo y revientan en balas, y sigue soltando cubitos. Entra con cartel: «Jefa de planta · Almacén de devoluciones» y el lema «Congelamos los precios. Y las reclamaciones.» |
| El Router del Wifi | Hecho | Jefe de la planta 2 (letra `X`; la Nevera sigue en la 1). 170 de vida (200 hasta M9b 15). Un router blanco de cuatro antenas (una doblada y con celo), ojos verdes de piloto bajo unos párpados de suficiencia, la luz de «internet» siempre en rojo (conectado, sin internet), la pegatina de la clave medio arrancada y un cable de red que no lleva a ninguna parte. Entra con cartel: «Jefe de planta · Informática» y el lema «Cobertura total. En la otra habitación.». Fase 1, «Cobertura total»: al empezar planta dos **repetidores** (8 de vida) en las esquinas más lejanas de la tostadora; ataca con dos anillos de ondas cian, cada uno con su «zona sin cobertura» (un hueco de 60° a un lado de la tostadora, un poco más girado en el segundo: hay que moverse hasta él), que los repetidores reenvían a la vez desde su sitio con un anillo fino; y con tres abanicos de «paquetes» rojos. **Reinicio** a media vida: «Reiniciando. No desenchufe el dispositivo», 5 s apagado con los ojos cerrados y las luces encendiéndose una a una, sin recibir daño; se limpian las balas y caen los repetidores. Fase 2, «Actualización de firmware»: tres anillos más rápidos con dos huecos que se separan, cada uno hacia su lado; abanicos más anchos; y «caídas de conexión»: tres sitios marcados en el suelo (uno bajo la tostadora) que al cabo de 1 s sueltan un anillo corto. Sin repetidores, planta uno nuevo cada 12 s. Su sala es amplia y despejada en el centro, con cuatro escuadras de rack para cubrirse de los repetidores. |
| El Muñeco de Moda | En el juego, con sus tres fases (M10 5b y 5c) | Jefe de la planta 3 (Juguetería). 220 de vida (se pensó en 300 antes de que las armas perdieran daño en M9b): el más duro hasta ahora. El juguete del año pasado, todavía en su caja de escaparate (la caja va con él: es su armadura), con una sonrisa de anuncio que ya no le llega a los ojos, el pelo de plástico encrespado, la pegatina «¡Novedad!» tachada a rotulador y encima «Temporada anterior». Entra con cartel: «Jefe de planta · Juguetería» y el lema «Pasado de moda. Como tú.». Fase 1, «Lanzamiento»: abanicos de accesorios (zapatitos y bolsos de plástico rosa, que giran) y la **pasarela**: cruza la sala de lado a lado posando, y por donde pasa deja una fila de destellos de flash que estallan en balas a los 0,6 s (antes posa y el aviso enseña el carril: primero se pone en él, de frente, y luego lo recorre; elige uno libre de pared a pared que pase a unos 40 px de la tostadora, no por encima). Fase 2, «Rebajas» (desde el 60 %): la etiqueta de su caja va bajando (−30 %, −50 %, −70 %); con cada rebaja va más deprisa, dispara anillos más densos y llama a dos Muñequitos Repetidos, y suelta «¡Ahora con más accesorios!». Fase 3, «Fin de existencias» (desde el 25 %; se iba a llamar «Liquidación total», pero ese es el sello de jefe vencido), con el grito «¡Todo debe desaparecer! Yo también.»: rompe la caja, que se queda en la sala como un obstáculo que tapa balas, y sin ella gira sobre sí misma soltando espirales de pegatinas de oferta que persiguen un poco, más rápido que nunca y recibiendo un 25 % más de daño (sin caja). Su sala, el Escaparate de Novedades: centro despejado y cuatro expositores de cristal que paran balas, abiertos hacia las esquinas para que quede un carril ancho por el medio. |
| El Director de Recursos Inhumanos | Hecho (M10 planta 4 5a–5c) | Jefe de la planta 4 (Oficinas), el único jefe humano: el que firma las bajas de todo el edificio. 220 de vida (medido con el bot: su mesa larga también le para las balas a la tostadora). Letra de plantilla `E`. Traje gris un número grande, corbata con pisacorbatas de la empresa, sonrisa de foto de perfil profesional y unas gafas que reflejan una hoja de cálculo; siempre en su **silla de oficina con ruedas**, que es como se mueve: a impulsos con los pies, en arcos y derrapando (errático, más deprisa cuanta menos vida). Entra con cartel: «Jefe de planta · Oficinas» y el lema «Aquí nadie es imprescindible. Usted tampoco.». Fase 1, «Somos una familia»: abanicos de **tarjetas de visita** que giran y **cartas de despido**: sobres lanzados en parábola que caen donde marca un anillo rojo y se abren en un anillo corto de cinco folios que caen al suelo a los dos pasos (como los yogures de la Nevera, pero en papel; tres cartas por tanda, cuatro en la fase 2). Fase 2, «Reestructuración» (desde el 60 %): da una palmada («Hemos decidido redistribuir los espacios.») y **las cuatro mamparas de su sala se recolocan**: el sitio nuevo se marca 1 s con una silueta discontinua y la mampara se desliza hasta él en 0,7 s (no aplasta: empuja a quien esté en medio); cada 12 s otra vez, así la cobertura nunca está donde estaba. Cada mampara se queda en su cuarto de la sala, a dos casillas por lo menos de donde estaba y con una casilla libre alrededor: nunca cierra un paso. Además, anillos de «diapositivas» con dos huecos que giran, y estampa con su propio **sello de Denegado** (dos cuadros de tinta, como el enemigo). Fase 3, «Despido procedente» (desde el 25 %), con el grito «No es nada personal. Es todo.»: se levanta de la silla, que sale rodando sola por la sala (la Silla Ergonómica de Dirección, 30 de vida: se puede romper, no vuelve y cae con él) y embiste en línea recta cuando la tostadora le queda delante; contra la pared o la mesa se para en seco. Él, de pie y más lento, gira sobre sí mismo la **línea de recortes**: una espiral de catorce brazos de balas rojas con un hueco que empieza en la tostadora y gira con ella (unos 30° por segundo, hacia un lado o hacia el otro): hay que seguir el hueco alrededor de él. Más abanicos de tarjetas. Las mamparas se quedan donde las dejó la última reestructuración. Su sala, la Sala de Juntas: una mesa larga en el centro que para balas (se puede rodear por los dos lados) y cuatro mamparas de cristal esmerilado. Su documento para el archivador: la evaluación de desempeño de la tostadora («Producto: tostadora. Valoración: amortizada. Destino: última planta, como todos.»). |
| La Centralita | Sprites hechos (M11 5a); pendiente (5b–5c) | Jefa de la planta 5 (Atención al Cliente), la última planta normal: el menú de voz que contesta todas las llamadas del edificio y no resuelve ninguna. Unos 240 de vida (se mide como los demás). Un cuadro de conexiones antiguo, de clavijas y cables, del tamaño de un armario, con un altavoz por boca, dos pilotos por ojos y una voz grabada demasiado amable; los cables le cuelgan como brazos y con ellos se arrastra por la sala. Entra con cartel: «Jefa de planta · Atención al Cliente» y el lema «Todos nuestros operadores están ocupados. Siempre.». Fase 1, «Su llamada es importante»: el **menú de voz**: en el suelo se encienden tres zonas grandes con un número («Pulse 1», «Pulse 2», «Pulse 3»), ella dice la opción («Para reclamaciones, pulse 3») y 1,5 s después llueven balas en las otras dos (la buena cambia cada vez; a veces es la que está más lejos). Entre menú y menú, abanicos de clavijas y anillos de notas de la música de espera que ondulan. Fase 2, «Le paso con el departamento» (desde el 60 %): la sala está partida en cuatro «departamentos» por mostradores bajos (paran balas, se cruzan rodando); cada 10 s suena un timbre, un círculo marca a la tostadora y a los 0,8 s **la pasa a otro departamento** (aparece en él, con medio segundo de invulnerabilidad), donde la espera un patrón distinto; y llama a un Teléfono de Recepción. Fase 3, «Se ha cortado la llamada» (desde el 25 %), con el grito «Le atenderemos lo antes posible. No.»: se arranca las clavijas y gira los cables como **barridos de balas en línea** (cuatro brazos que giran despacio, con aviso), corre por la sala más deprisa que nunca y cada tanto se queda muda (los pilotos en blanco) 1 s: el momento de darle. Su sala, la Centralita (Todos Nuestros Operadores Están Ocupados): grande, con los cuatro mostradores bajos y el cuadro de conexiones al fondo. Vencerla acaba la partida normal: «Su incidencia ha sido cerrada.» (M12 añadirá el Servicio Técnico para quien cumpla los requisitos). Su documento para el archivador: la transcripción de una llamada al Servicio Técnico que, tras cuarenta minutos de música, acaba en «su producto será reacondicionado». |

## Mecánicas

### Control

- Movimiento en 8 direcciones (WASD o stick izquierdo), apuntar con el ratón o el stick derecho.
- Disparo (clic izquierdo o gatillo), recarga automática o manual.
- **Esquiva rodando** (espacio o botón): recorre unas 3 casillas, invulnerable las primeras
  0,4 s, enfriamiento corto. Es la mecánica central: el combate se diseña alrededor de ella.
- Objeto activo (Q o botón) y cambio de arma (rueda o botón).
- **Accesibilidad** (Opciones): quitar el temblor de cámara, **destellos suaves** (sin blancos
  sólidos ni parpadeos), **texto grande** (lo que se lee con calma a doble tamaño; el HUD no
  cambia) y **cambiar teclas** (cada acción del teclado a la tecla que se quiera; Esc y P son
  de la pausa). Los textos que nombran teclas dicen las elegidas.

### Estructura de una partida

- **Plantas** (pisos). Cada planta tiene unas 10–15 salas generadas por procedimiento: entrada,
  combate, tesoro, tienda, una sala secreta opcional y la sala del jefe.
- En las salas de combate las puertas se cierran hasta acabar con los enemigos (persianas
  metálicas con piloto rojo).
- Al vencer al jefe se sube a la siguiente planta. Primera versión: 1 planta. Objetivo a medio
  plazo: **5 plantas** (Electrodomésticos, Informática, Juguetería, Oficinas y Atención al
  Cliente) y un **piso final especial**, el Servicio Técnico, que solo se desbloquea cumpliendo
  unos requisitos (vencer a los 5 jefes, ganar con varios personajes, reunir la historia).
  Mucha variedad de enemigos, jefes, armas y objetos en cada planta.
- **Muerte permanente.** Al morir se pierde la partida. Se conservan los desbloqueos.

### Economía

- **Cupones descuento** como moneda: caen de los enemigos y se gastan en la tienda.
- **Tickets** como llaves: abren cofres y puertas cerradas. Escasos (nota del humano del
  2026-10-30): la partida empieza con **1 ticket**; cada planta tiene 1 sala de combate que suelta
  otro al limpiarla, y la tienda vende uno. Las **Cajas Fuertes de Devoluciones** (los cofres)
  son más que los tickets: **2 en la sala del tesoro**, 1 en la secreta, y cada sala de combate
  limpia tiene un 15 % de dejar otra (y, si no deja ni ticket ni cofre, un 35 % de dejar un
  **corazón de recambio**: M9b 15; sin ellos nada curaba entre la entrada y el jefe salvo la
  tienda). Muchas veces un cofre se queda cerrado. Se abre con el botón
  de interactuar (F) y un ticket: se lo traga y suelta un objeto pasivo (lo normal), un arma o un
  activo, y un cupón. Sin ticket, se queja («Sin ticket no hay devolución»).
- **Dos calidades de cofre.** La Caja Fuerte de Devoluciones normal (gris, la de siempre) solo
  da cosas corrientes: pasivos normales, activos o la Grapadora. La **Caja Fuerte Premium · Solo
  Clientes Oro** (granate y dorada, brilla de vez en cuando; un 15 % de los cofres) solo da cosas
  de calidad «buena»: la Plancha o un pasivo bueno (Garantía Extendida, Broca del Ocho,
  Resistencia de Recambio, Cable HDMI Dorado, Actualización Obligatoria, Ratón Gaming RGB, Copia
  de Seguridad). La calidad está en los datos (`quality: 'buena'`).
- **La Garantía Provisional** (M9b 12a, el escudo que pidió el humano): un corazón recortado de un
  resguardo de garantía, papel crema con un sello azul y la esquina doblada. Aguanta un corazón de
  daño antes que la vida («Cubierto. Esta vez.»; al gastarse, «Garantía agotada»); no se cura, se
  pueden llevar dos y **caduca al bajar de planta** (es provisional: 30 días, y en el vertedero
  nadie cuenta los días). Se dibuja tras los corazones, algo separada. Sale al limpiar una sala de
  combate que no da ticket ni cofre: un 10 % de las veces (antes que el corazón de recambio, que es
  el 35 %). Es lo más común de lo especial; los corazones con efecto de M9b (12b) son más raros.
- **Los corazones especiales** (M9b 12b, `src/data/hearts.ts`): también premio de salas limpias,
  más raros que la garantía y cuanto más potentes, más raros. Ninguno dura: caducan al bajar de
  planta, o antes.
  - **Corazón Modo Turbo** (5 %): rojo con una franja amarilla de carreras y una llamita detrás,
    como el botón turbo de un secador. Cura un corazón y, **hasta limpiar la siguiente sala de
    combate**, cada disparo hace un 30 % más (las balas salen anaranjadas y la tostadora suelta
    chispas). «Modo Turbo · hasta la próxima sala»; al acabar, «Fin del modo turbo». En el
    marcador, tras los corazones, con la franja parpadeando.
  - **Corazón de Sobretensión** (3 %): amarillo con un rayo negro, como el cartel de alta tensión.
    Un corazón prestado que paga antes que la garantía y la vida; cuando un golpe lo rompe,
    descarga un rayo a **todos los enemigos de la sala** (8 de daño: se lleva polillas, mandos y
    cargadores, deja a medias a un aspirador y a un jefe apenas le hace cosquillas). «Subida de
    tensión · daños no cubiertos». Uno como mucho.
- **Los objetos nunca están sueltos** por una sala: solo salen de cofres o de la tienda.
- **Los cupones hay que ir a recogerlos** (nota del humano del 2026-11-05, que aclara la del
  30 de octubre): al limpiar la sala se quedan donde cayeron, y el imán solo los atrae de cerca;
  el minimapa marca las salas en las que se quedaron. Los enemigos
  sueltan la mitad que antes (0–1 casi todos; los jefes, 5–9): una planta da unos 20.
- **La tienda** (Tienda del Personal): la atiende la **Caja de Autocobro**, una caja de
  autopago que se quedó sola después de que despidieran a las demás. Tres baldas: el siguiente
  objeto de la baraja de la planta (15 cupones; si no quedan pasivos, un activo por 12 o un arma
  por 18), un corazón de recambio (6) y un ticket (10). Se compra poniéndose delante y pulsando el botón de interactuar (F; «F: Comprar por 15» bajo la tostadora);
  sin cupones suficientes la pantalla se pone roja («Saldo insuficiente. Pruebe a tener más.») y
  con la vida llena no vende corazones («No le vendo nada que no necesite. Aún.»). Una planta
  entera da unos 20 cupones: da para una cosa, así que comprar es elegir.
- **Pilas** como cargas del objeto activo.

### Armas y objetos

- Las armas tienen cargador, cadencia, dispersión, velocidad de bala, daño y retroceso. Todas
  son objetos cotidianos convertidos en arma.
- Objetos pasivos que modifican estadísticas o comportamiento de las balas.
- Cada arma gana claramente en algo y pierde en otra cosa (nota del humano; lo comprueba
  `tests/armas.test.ts` y lo mide `npm run armas`). Armas de la planta 1:

| Arma | Daño | Disparos/s | Cargador | Recarga | Alcance | Daño/s (con recargas) | Gana en | Pierde en |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Secador Mágnum 2200 W | 1,6 | 2,6 | 10 | 1,2 s | 350 | 3,2 | Alcance, puntería, golpe por bala | Daño por segundo |
| Grapadora Táctica | 0,8 | 11 | 33 | 2,2 s | 220 | 5,1 | Cadencia, cargador | Daño por bala, recarga larga |
| Plancha de Vapor Turbo | 1,6 × 5 | 1,3 | 4 | 1,7 s | 100 | 6,7 de cerca | Golpe por disparo (8) | Alcance, cargador, puntería |

Desde M9b (7) (nota del humano del 2026-10-30: «las armas hacen demasiado daño») todo el daño de
base es un quinto menor (2 → 1,6, 1 → 0,8). Como ya no se pintan números de daño, el daño no tiene
que ser entero, y los objetos lo suben en porcentaje (+25–30 %), nunca en puntos.

Objetos pasivos de la planta 1 (`src/data/items.ts`). Casi todos dan algo y quitan algo, y desde
M9b (7) suben menos: ninguno sube una estadística más de un 30 % (el cargador, un 50 %), lo vigila
`tests/equilibrio.test.ts`:

| Objeto | Descripción | Efecto |
| --- | --- | --- |
| Pila Casi Agotada | Dura lo que un contrato temporal. Después, nada. | Cadencia ×1,2, cargador ×0,7 |
| Manual en Chino | Nadie sabe por qué funciona. Tampoco el fabricante. | Las balas rebotan 2 veces y duran ×1,3 |
| Garantía Extendida | Cubre todo excepto lo que te pase. La letra pequeña no se puede leer: forma parte del servicio. | +1 corazón |
| Regleta Sin Tierra | Seis enchufes y un solo contrato de luz. Lo que salte después no está cubierto. | +1 bala por disparo, +6° de dispersión, cadencia ×0,6 |
| Tarjeta de Socio | Te sigue a todas partes. Como los correos de la tienda. | Las balas persiguen un momento; un poco más lentas |
| Etiqueta A+++ | Eficiencia energética certificada por el propio fabricante. | Velocidad ×1,1, voltereta ×0,85 |
| Alargador de Tres Metros | Llega a todas partes. Sobre todo a los tobillos. | Alcance ×1,25, balas ×1,1 más rápidas |
| Broca del Ocho | Para colgar un cuadro. Ya puestos, para todo lo demás. | Las balas atraviesan 1 enemigo; menos empuje |
| Cinta Americana | Lo arregla todo durante una semana. | Recarga ×0,75 |
| Resistencia de Recambio | Pieza no original. Calienta más de lo que pone en la caja. | Daño ×1,3, balas más gordas, cadencia ×0,85, más retroceso |
| Batería Hinchada | Rinde un 20 % más. Hasta que revienta. Eso no viene en la ficha técnica. | Daño ×1,25, −1 corazón (M9b) |

Objetos pasivos de la planta 2 (Informática, `level: 2`). Solo salen desde la planta 2: cada planta
reparte los suyos y los de las plantas de abajo (`itemsUpTo` en `src/data/items.ts`).

| Objeto | Descripción | Efecto |
| --- | --- | --- |
| Pendrive de 2 GB | Cabe todo lo que no necesitas. Copiarlo tarda una tarde. | Cargador ×1,4, recarga ×1,3 |
| Antivirus Gratuito | Te protege de todo menos de sí mismo. Gasta la mitad del procesador. | +1 corazón, velocidad ×0,9, voltereta ×1,3 más tarde |
| Contrato de Permanencia | Dieciocho meses de compromiso. El primero, gratis. Los otros diecisiete se cobran en salud. | Velocidad ×1,12, voltereta ×0,7, −1 corazón (M9b) |
| Cable HDMI Dorado | Mejora la imagen un 0 %. Lo pone en la caja, en letras doradas. | Balas ×1,15 más rápidas, dispersión ×0,6 (solo bueno) |
| Ventilador de Portátil | Suena como un avión y enfría como una vela. | Cadencia ×1,15, +5° de dispersión, alcance ×0,85 |
| Actualización Obligatoria | Reinicie para aplicar los cambios. Sí, ahora. | Daño ×1,25, recarga ×1,6, cargador ×0,8 |
| Ratón Gaming RGB | Dieciséis millones de colores y un clic que a veces cuenta doble. | 15 % de balas con daño ×2 («Doble clic» sobre el blanco) |
| Batería Externa | Carga cualquier cosa menos el móvil. Pesa como un ladrillo. | +1 pila por sala limpia, velocidad ×0,92 |
| Cookies de Terceros | Aceptaste todas. Ahora cada enemigo te deja un regalito, y a ellos tus datos. | El 50 % de las bajas (jefes aparte) suelta un cupón más |
| Modo Avión | Corta todas las conexiones. También las que vienen hacia ti. | La voltereta corta las balas enemigas que toca; voltereta ×1,25 más tarde |
| Copia de Seguridad | Restaura el sistema tal y como estaba el martes. Funciona una vez, como todo. | Una vez, en vez de la baja, vuelve con 1 corazón («Restaurando copia del martes»), limpia las balas y se gasta |

Los tres últimos no son solo cifras: un modificador puede llevar, además de `stats` y `bullets`,
golpes críticos (`bullets.crit`) y `perks` (pilas de más por sala, cupones de más por baja,
voltereta que corta balas y vuelta de la baja).

Objetos pasivos de la planta 3 (Juguetería, `level: 3`). Más raros que los de abajo: muchos
cambian cómo se juega, no solo las cifras. Ocho llegaron primero (M10 6a: Pilas No Incluidas,
Muelle de Juguete, Bote de Purpurina, Juguete del Menú Infantil y Caja de Cartón Vacía; 6b1:
Pegatina de Edición Limitada, Llave Allen Sobrante y Mando con Vibración, con la sinergia Unboxing;
la llave se usa antes que un ticket, porque solo vale en su planta). Los diez están ya en el juego
(6b2: Plastilina Mezclada y Mascota Virtual, con la sinergia Manualidades). Los pegotes de plastilina
se forman donde la bala choca con una pared o un obstáculo (no en los enemigos), dañan una sola vez
a cada enemigo que los toca y no empujan; con Manualidades duran 2,5 s y frenan a la mitad 1,5 s. La
Mascota Virtual no da +1 de daño por nivel sino ×1,1 (hasta ×1,3): un +1 fijo era casi doblar el
daño del Ventilador y, tras moderar los objetos en M9b, un 30 % sostenido ya pide jugar sin un rasguño;
la sala que se limpia tras un golpe no la alimenta;
el Juguete del Menú Infantil sube la velocidad ×1,15 y la cadencia ×1,12 (no ×1,2 y ×1,15: en M9b
los objetos se moderaron), y la voltereta larga del muelle es la velocidad de la voltereta
(misma duración y mismos fotogramas invulnerables, más recorrido).

| Objeto | Descripción | Efecto |
| --- | --- | --- |
| Pilas No Incluidas | Funciona de maravilla. Con otras pilas. | Tras cada recarga, cadencia ×1,4 durante 3 s; el resto del tiempo, ×0,9 |
| Pegatina de Edición Limitada | Solo se han fabricado diez millones. | La última bala de cada cargador hace el triple de daño |
| Plastilina Mezclada | Era de cuatro colores. Ahora es de uno, y no tiene nombre. | Las balas que chocan con algo se quedan pegadas 1,5 s y dañan a quien pase; balas ×0,85 más lentas |
| Muelle de Juguete | Salta. No se sabe hacia dónde. | Voltereta ×1,3 más larga y +1 rebote, +4° de dispersión |
| Llave Allen Sobrante | Siempre sobra una pieza. Esta es la tuya. | Una vez por planta, un cofre se abre sin ticket |
| Mando con Vibración | Para notar cada golpe en la muñeca. | Al recibir daño, suelta un anillo de 10 balas |
| Caja de Cartón Vacía | El niño jugó con la caja. El juguete sigue sin abrir. | Un 20 % de los golpes no hacen daño («Era solo la caja») (solo bueno) |
| Bote de Purpurina | Se queda para siempre. En todo. | Los enemigos tocados van ×0,8 más lentos 2 s; balas un poco más pequeñas |
| Juguete del Menú Infantil | Venía con la comida. Duró menos que la comida. | Velocidad ×1,2 y cadencia ×1,15, −1 corazón |
| Mascota Virtual | Había que darle de comer cada cinco minutos. | Cada sala limpia sin recibir daño, daño ×1,1 más (hasta ×1,3); un golpe lo pone a cero (solo bueno) |

Dos sinergias nuevas: **Unboxing** (Caja de Cartón Vacía + Pegatina de Edición Limitada: «Abrirlo
le quita la mitad del valor. Grabarlo se lo devuelve.»; la bala de la pegatina atraviesa a todos) y
**Manualidades** (Plastilina + Bote de Purpurina: «Nadie sabe qué es, pero la nevera de casa lo va a lucir
igual.»; los charcos de plastilina también frenan).

La Juguetería se ve a la primera: suelo de goma EVA de puzle (losetas de colores primarios
desvaídos, alguna que falta y deja ver el hormigón), una carretera de alfombra de juguete en los
pasillos, estanterías altas de cajas con ventana de plástico y precios tachados una y otra vez,
papel pintado de nubes despegándose en la pared de atrás, y obstáculos propios: casitas de muñecas
cerradas por reformas, cajas de pelotas, caballitos de balancín quietos y montones de peluches
desteñidos. Persianas con una tira de luces de feria fundidas.

Objetos pasivos de la planta 4 (Oficinas, `level: 4`). Como los de la Juguetería, la mitad cambian
cómo se juega; aquí el tema es el trabajo: rachas, plazos, castigos y premios que no compensan.
Ninguno sube una estadística más de un 30 % (la regla de M9b, que vigila `tests/equilibrio.test.ts`).

| Objeto | Descripción | Efecto |
| --- | --- | --- |
| Taza de Mejor Empleado | Te la dieron el año que no hubo subida. | Daño ×1,2 mientras la vida esté llena; al primer golpe, «Empleado del mes: otro» |
| Pósit de Urgente | Pone «Urgente». Nadie recuerda de qué. | Tras cada voltereta, la siguiente bala hace el doble de daño |
| Silla con Ruedas | Ergonómica para otra espalda. | Velocidad ×1,15, pero resbala: agarra el suelo un 30 % (tarda en frenar y en girar; la voltereta, igual) |
| Corbata de Lunes | Aprieta lo justo para recordar quién manda. | Daño ×1,2, velocidad ×0,92 |
| Café de Máquina | Sabe a vaso. Pero despierta. | Cadencia ×1,15, recarga ×0,85, +5° de dispersión (tiembla el pulso) |
| Tarjeta de Fichar | Apunta cuándo entras. Cuándo sales, no tanto. | Las salas limpiadas en menos de 25 s sueltan un cupón más |
| Responder a Todos | Una pregunta. Cuarenta respuestas. Ninguna tuya. | Un 25 % de las balas que aciertan se parten en dos balas pequeñas hacia otros enemigos |
| Contrato en Prácticas | Seis meses de prueba. Renovables hasta la jubilación. | Daño, cadencia y velocidad ×1,1; al bajar de planta, se acaba y desaparece del inventario |
| Acreditación de Visitante | Abre todas las puertas menos la que buscas. | La tienda cobra un 25 % menos (solo bueno) |
| Bola Antiestrés | Llevas tres. Ninguna ha funcionado. | Tras un golpe, la invulnerabilidad dura el doble; cadencia ×0,9 |

Dos sinergias nuevas: **Pausa del Café** (Café de Máquina + Taza de Mejor Empleado: «Diez
minutos. Se descuentan de la nómina.»; limpiar una sala con la vida llena da una pila más; el
nombre perdió el «para» porque las sinergias se llaman con tres palabras como mucho) y
**Cadena de Correos** (Responder a Todos + Pósit de Urgente: «Urgente, importante y para todos. Sin
leer.»; la bala doble del pósit siempre se parte, y sus trozos también hacen el doble).
El Pósit carga con cada voltereta y la gasta el siguiente disparo (todas sus balas, si es de
varias), que sale en amarillo y rojo. Responder a Todos parte la bala en dos trozos de la mitad de
daño, uno hacia cada uno de los dos enemigos más cercanos (los dos al mismo si solo queda otro);
sin nadie más en la sala no se parte, y los trozos no se vuelven a partir.
Indirectas (en `src/data/complements.ts`, medidas): la Bola Antiestrés con la Batería Hinchada
(tapa: con un corazón menos, una lluvia de golpes tarda más en tumbar a la pareja que a la
tostadora sin nada). La Silla con Ruedas con la Etiqueta A+++ se descartó: sus velocidades solo se
multiplican, como las de dos objetos de velocidad cualesquiera, y con el bot la pareja salía peor
que la etiqueta sola.

Las Oficinas se ven a la primera (M10 planta 4 (1), detalle en `docs/ESTILO_ARTE.md`): moqueta gris en losetas, con manchas de café y las
rodadas de las sillas; pasillos de moqueta más oscura entre cubículos; pared de atrás de pladur
con vinilos de valores («Pasión», «Resiliencia», «Familia») medio despegados y un fluorescente
que parpadea; mamparas de cubículo como paredes; obstáculos propios: archivadores metálicos con un
cajón que no cierra, termos de café (los que explotan), ficus de plástico con polvo y mesas de
oficina que se vuelcan. Persianas con un cartel colgado:
«Reunión en curso». Sus salas especiales: la **Recepción (Firme Aquí, y Aquí, y Aquí)**, la
entrada; la **Sala de Material (Pida Cita Previa)**, el tesoro; el **Economato de Empresa
(Descuento en Nómina)**, la tienda, que sigue atendiendo la Caja de Autocobro; el **Archivo
**Papeles para Destruir (Confidencial)**, la secreta (el Archivo Muerto ya es el cartel de la secreta
del almacén), con un acta de reunión para el archivador (la planta 4 compra a peso lo que
la última planta «reacondiciona», y lo apunta como activo); y la **Sala de Juntas (Aforo: Uno)**,
la del jefe.

Objetos pasivos de la planta 5 (Atención al Cliente, `level: 5`, M11 6a–6b). El tema es la
espera: turnos, menús, encuestas y promesas de que le llamarán. Como en las Oficinas, la mitad
cambian cómo se juega y ninguno sube una estadística más de un 30 %.

| Objeto | Descripción | Efecto |
| --- | --- | --- |
| Número de Turno | Van por el 12. Tú tienes el 87. | Daño ×0,9 al entrar en una sala; +5 % cada 5 s que sigas en ella (hasta ×1,25) |
| Contestador Automático | Deje su mensaje después de la señal. Nadie lo escuchará. | Cada 4 s, el siguiente disparo se repite solo 0,5 s después (eco más flojo, ×0,6) |
| Cable de Teléfono Rizado | Se enreda solo. Nunca se desenreda. | Las balas avanzan en tirabuzón (ondulan 5 px a cada lado de su línea, tres veces por segundo) y hacen ×1,15 de daño; alcance ×0,9 |
| Llamada Grabada | Esta llamada podrá ser grabada con fines de calidad. | El enemigo que te hiere queda marcado 6 s y recibe ×1,5 de daño (solo bueno) |
| Hoja de Reclamaciones | Por triplicado. La copia rosa no la lee nadie. | Tras recibir un golpe, las tres balas siguientes persiguen al que te ha dado |
| Formulario en Línea | Todos los campos son obligatorios. Otra vez. | Cargador ×1,4, recarga ×1,25 más lenta |
| Tecla Almohadilla | Para volver al menú principal, pulse almohadilla. | El objeto activo se carga ×1,5 más deprisa (pila y media por sala; la media pila espera a la siguiente) |
| Valoración de Cinco Estrellas | Obligatoria para cobrar. | Cada sala limpia sin daño da una estrella; con cinco, +1 corazón y vuelta a cero; un golpe borra las estrellas (solo bueno) |
| Tiempo de Espera Estimado | Menos de un minuto. Desde hace una hora. | Espera entre volteretas ×0,75, velocidad ×0,95 |
| Código Promocional Caducado | Válido hasta ayer, como todos. | Los enemigos sueltan un cupón más una de cada cuatro veces; 3 de cada 10 cofres de premio (los de las salas de combate) han caducado y no salen («Promoción caducada») |

Sinergias de la planta 5 (M11 6b2, medidas): **Ticket de Incidencia** (Hoja de Reclamaciones +
Llamada Grabada: «Su caso ha sido escalado. Muy arriba. Sin respuesta.»; las balas que persiguen
al grabado le hacen la marca otra vez, ×1,5 sobre el ×1,5, y cada una le renueva los 6 s de la
marca: el caso no se cierra nunca) y **Buzón Lleno** (Contestador Automático + Cable de Teléfono
Rizado: «No se pueden dejar más mensajes. Se dejan igual.»; el eco ya ondulaba con el cable, y con
la sinergia atraviesa a un enemigo y se graba cada 3 s en vez de cada 4).
La Hoja de Reclamaciones apunta a quien te ha herido (cuerpo a cuerpo o con sus balas): los tres
disparos siguientes, con todas sus balas, giran hacia él (540° por segundo, desde cualquier
distancia) y salen rosas con un rastro de papel; si cae antes, vuelan rectos. La Valoración de
Cinco Estrellas cuenta las salas de combate limpias sin un golpe; la quinta da un corazón de vida
máxima, lleno (si ya no caben más, cura uno), y vuelta a empezar.
Indirecta: el diseño proponía el Número de Turno con el Formulario en Línea, pero medido es solo el
producto de los dos (daño hecho disparando 35 s seguidos con el Secador: turno ×1,050, formulario
×1,000, la pareja ×1,046): los dos multiplican los mismos disparos y ninguno alimenta al otro.
Descartada. En su lugar, el **Formulario en Línea con la Cinta Americana** (tapa: la cinta devuelve
la recarga que el formulario alarga y se queda el cargador grande).

Armas de la planta 5 (M11 6c), las dos primeras desde la planta 1; como las otras, cada una gana
claramente en algo y pierde en otra cosa (`tests/armas.test.ts`, `npm run armas`):

| Arma | Idea | Gana en | Pierde en |
| --- | --- | --- | --- |
| Etiquetadora de Precios | Dispara etiquetas adhesivas a ráfagas; se quedan pegadas al enemigo y la tercera etiqueta en el mismo, «Rebajado», hace una explosión pequeña de daño | Cadencia, daño acumulado contra uno | Daño por bala suelta, cargador corto, contra muchos |
| Megáfono de Reclamaciones | Un arco de ondas de sonido a corta distancia que atraviesa a todos y los empuja hacia atrás | Atravesar, empujar, controlar | Alcance, daño por golpe, cadencia baja |

El **Megáfono** está en el juego (M11 6c2): 0,7 × 7 ondas, 1,25 disparos/s, cargador 6, recarga
1,5 s, alcance 105 (el de la plancha, la mitad que la grapadora), empuje 140 por onda y
`pierce: 99` (atraviesa a todos; es la única arma que lo trae de serie, y los objetos le suman el
suyo). Daño/s con recargas 4,7. Medido con `npm run armas` (bot solo con el arma, salas de la
planta 1 y la Nevera): limpia el 78 % de las salas (secador 92, plancha 90: con el bot, que
pelea de lejos, lo corto pesa) y gana a la jefa el 85 % en 66 s con 3,3 heridas (secador 60 %,
grapadora 70, plancha 90). Las armas llevan ya `level` como los objetos: la planta *n* reparte
las suyas y las de abajo (`weaponsUpTo`), así que el Megáfono solo sale en Atención al Cliente
(y en la Sala de Pruebas, que enseña todas en su tercer pedestal).

Atención al Cliente se ve a la primera (M11 (1)): linóleo azul institucional con una línea
amarilla pintada en el suelo («Siga la línea») que no lleva a ninguna parte, colas de postes con
cinta, filas de sillas de espera atornilladas al suelo como obstáculos, mostradores de ventanilla
con mampara de metacrilato con agujeros, una pantalla de turnos que siempre dice el mismo número,
el buzón rojo de reclamaciones lleno a reventar y el cubo de fregar con su cartel de «suelo mojado»
(los dispensadores de agua y las plantas de plástico se quedaron fuera: ya eran la fuente de
Informática y el ficus de las Oficinas; los postes con cinta, también, para no confundirlos con el
enemigo Postes de Cola). Pared de atrás con el cartel «Su
satisfacción es nuestra prioridad» con una estrella de cinco, y relojes que marcan horas
distintas. Persianas con «Ventanilla cerrada. Diríjase a la ventanilla de al lado». Sus salas
especiales: **Coja Número (Espere a Ser Llamado)**, la entrada; **Objetos Perdidos (No Se
Devuelven)**, el tesoro; **Repuestos Originales (A Precio de Original)**, la tienda, con la Caja
de Autocobro; **Grabaciones con Fines de Calidad**, la secreta, con un documento para el
archivador (el registro de llamadas: todas las del edificio acaban en el mismo número, el del
Servicio Técnico); y **la Centralita (Todos Nuestros Operadores Están Ocupados)**, la de la jefa.

Objetos activos (tecla Q o botón B del mando). Se lleva uno; al coger otro, el viejo se queda en
el suelo con sus pilas. Cada sala de combate limpia mete una pila; se usa cuando está lleno:

| Objeto | Descripción | Pilas | Efecto |
| --- | --- | --- | --- |
| Encuesta de Satisfacción | Su opinión es muy importante para nosotros. Por eso nadie la lee. | 2 | Borra todas las balas enemigas |
| Música de Espera | Todos nuestros enemigos están ocupados. Su ataque será atendido en breve. | 3 | Enemigos, balas y ataques en espera 3,5 s (siguen recibiendo daño) |
| Pegamento Exprés | Pega cualquier cosa a cualquier cosa. Sobre todo los dedos. Un solo tubo: después se seca. | — | Devuelve un corazón y se acaba: **un solo uso** (M9b 7; antes se recargaba en dos salas). Con la vida llena no se gasta |

La sala del tesoro tiene tres pedestales (un arma, un objeto pasivo y uno activo) y la secreta
uno (lo siguiente que quede). Los cofres sacan de las mismas barajas, así que una planta no
repite objeto.
- **Sinergias:** ciertas combinaciones activan un efecto extra y un texto especial, en
  `src/data/synergies.ts`. Las que piden un arma solo cambian esa arma, y cuentan mientras esté
  en el arsenal (no hace falta llevarla en la mano). Al activarse sale «Sinergia corporativa:», su nombre y
  su frase en un recuadro bajo la descripción del objeto.

| Sinergia | Piezas | Frase | Efecto |
| --- | --- | --- | --- |
| Sobrecarga | Pila Casi Agotada + Secador | El secador sopla como nunca hasta que salta el diferencial. | Secador: cadencia ×1,15, balas +1 de radio, recarga ×1,4 |
| Papeleo Exprés | Cinta Americana + Grapadora | Grapa, cinta y archivado. Así se cierran los expedientes sin leerlos. | Grapadora: cargador ×1,5, recarga ×0,8 |
| Bricolaje Avanzado | Manual en Chino + Broca del Ocho | Nadie ha leído las instrucciones, así que las balas improvisan. | +1 rebote y +1 enemigo atravesado |
| Instalación Casera | Regleta Sin Tierra + Alargador | Todo enchufado a todo. El seguro del hogar ha dejado de coger el teléfono. | +1 bala por disparo, 3° menos de dispersión |
| Cliente Preferente | Tarjeta de Socio + Etiqueta A+++ | Puntos dobles en cada disparo. Caducan mañana. | Persecución más fuerte: gira 400°/s durante 1 s, desde 150 px |
| Setup Gamer | Ratón Gaming RGB + Ventilador de Portátil | Luces, ruido y el ventilador al máximo. Los fotogramas no suben, pero se nota. | +10 % de críticos (25 % en total) |
| Conflicto de Software | Antivirus Gratuito + Actualización Obligatoria | El antivirus bloquea la actualización. Por una vez, se agradece. | Recarga ×0,625: anula la recarga lenta de la actualización y deja su daño |

- **Sinergias indirectas** (M9b (14), nota del 2026-10-30): parejas que funcionan mucho mejor
  juntas que separadas sin activar nada: ni nombre en pantalla ni modificador extra. Están en
  `src/data/complements.ts`, cada una medida en `tests/complementos.test.ts` y con el bot en
  `npm run objetos -- --parejas`. Son de dos clases: **tapa** (un objeto devuelve casi todo lo
  que el otro quita, y queda lo bueno de los dos) y **multiplica** (uno hace más grande lo bueno
  del otro). Para que la Tarjeta tenga con quién multiplicar hay una regla general: una bala que
  persigue vuelve a perseguir (otros 0,7 s) cada vez que rebota o atraviesa a un enemigo.

| Pareja | Clase | Por qué |
| --- | --- | --- |
| Tarjeta de Socio + Manual en Chino | multiplica | Cada rebote, la bala vuelve a buscar enemigo |
| Tarjeta de Socio + Broca del Ocho | multiplica | Atraviesa a uno y ya va a por el siguiente |
| Pila Casi Agotada + Cinta Americana | multiplica | La pila vacía el cargador antes; con la cinta, recargar más a menudo casi no cuesta |
| Pila Casi Agotada + Pendrive de 2 GB | tapa | El pendrive devuelve el cargador que la pila recorta |
| Actualización Obligatoria + Cinta Americana | tapa | La cinta anula la recarga lenta de la actualización |
| Resistencia de Recambio + Pila Casi Agotada | tapa | La pila devuelve la cadencia que la resistencia quita |
| Ventilador de Portátil + Cable HDMI Dorado | tapa | El cable cierra la dispersión que abre el ventilador |
| Batería Hinchada + Garantía Extendida | tapa | La garantía devuelve el corazón que la batería quita |
| Batería Externa + Etiqueta A+++ | tapa | La etiqueta devuelve el paso que la batería quita |
| Modo Avión + Etiqueta A+++ | tapa | La etiqueta devuelve casi toda la voltereta que el avión alarga |

No se anuncian: descubrirlas es parte del juego. Cuando exista el glosario (M14) podrá contarlas
con la frase de cada una (el campo `why`), una vez que el jugador haya llevado la pareja.

### Objetos del escenario (M9b 13)

- **Bidón de aceite usado** (13a): aguanta 10 de daño (unos siete disparos del Secador; una bala
  enemiga cuenta 1), se enciende (parpadea en blanco, tiembla y sisea; ya muy tocado echa humo) y a
  los 0,3 s explota: 12 de daño a los enemigos a 36 px, **un corazón a la tostadora** si está
  igual de cerca, y enciende a los bidones vecinos, que van saltando uno detrás de otro (0,15 s).
  Deja una mancha quemada y desaparece de la sala para siempre. Cobertura que se gasta y trampa
  para quien la usa mal. Causa de baja: «Bidón de aceite usado sin etiquetar».
- **Mesa de Saldos** (13b; en la planta 2, una mesa de demostración beige con un teclado de
  exposición): un mueble bajo que sale en los huecos de obstáculo (`v` en las plantillas; ahora le
  quita sitio a los huecos vacíos, no a las cajas ni a los bidones). De pie no para nada (las balas
  pasan por encima) y estorba al andar. Con el botón de interactuar («F: Volcar», a 8 px) se
  vuelca **lejos de la tostadora**, por el eje en que está más apartada de ella, y ya no se
  levanta: su tapa queda mirando al otro lado y para las balas que vienen hacia ella, mientras
  deja pasar las que se alejan (la tostadora dispara por encima desde detrás). Aguanta 14 (una
  bala enemiga, 1; las de la tostadora, su daño) y se rompe en astillas; un bidón que explota al
  lado la rompe al momento, esté de pie o volcada. Cobertura de un lado, que se gasta, y que hay
  que pensar dónde poner.

### Balas enemigas

- Grandes, de colores saturados y con borde claro, para que se lean sobre cualquier suelo.
- Los patrones (anillo, abanico, espiral, ráfaga dirigida, onda) se definen como datos y se
  combinan. Cada enemigo telegrafía su ataque (parpadeo, sonido) antes de disparar.

### Progresión entre partidas

- Al ganar o al llegar a ciertos hitos se desbloquean personajes, objetos nuevos en el
  conjunto de botín y salas raras.
- Un pequeño **centro**: el mostrador de Devoluciones del vertedero, con PNJs (el Servicio
  Técnico al teléfono, un vendedor ambulante de piezas) que cambian con el progreso.

### El Mostrador de Devoluciones (el centro, hito M9)

Donde empieza y acaba cada partida: el mostrador de Devoluciones del sótano del Megamarket,
una sala pequeña (unas 18 × 12 casillas) que se recorre andando, sin enemigos ni balas. Al
abrir el juego, «Partida nueva» lleva aquí; tras el parte de baja (o tras ganar la última
planta) se vuelve aquí. El chiste de fondo: es el único sitio del edificio donde de verdad te
atienden, y no sirve para nada.

Con todo lo que hay en él se habla (o se mira) con el botón de interactuar (F, o LB en el mando),
no al acercarse (nota del humano del 2026-10-30).

- **La cola de cinta**: postes con cinta extensible que hacen un zigzag hasta el mostrador.
  Vacía. Se puede (y se debe) cruzar por debajo.
- **La Caja de Devoluciones** (PNJ, tras el mostrador): una caja registradora vieja con el
  cajón abierto como boca y el cartel «Esta caja cierra en 5 minutos» desde hace años. Sella
  el parte de baja y comenta la última partida: de qué caíste, hasta qué planta llegaste, qué
  jefe te tumbó. Seca y burocrática: «Motivo de la devolución: le disparó un microondas. No
  cubierto».
- **El teléfono del Servicio Técnico** (PNJ, en la pared): un teléfono de góndola descolgado
  con música de espera. La grabación «avanza» con los jefes vencidos y va soltando la historia
  (el Servicio Técnico existe, tiene una oficina en lo alto, «su reparación está en curso»…),
  sin revelar el final verdadero (M12).
- **La máquina de turnos**: su pantalla roja enseña «Atendiendo al 12» y tu número, que es el de
  partidas jugadas más cuatro millones. Nunca llega.
- **El Chatarrero** (PNJ, aparece tras vencer al primer jefe): un carrito de supermercado con
  una rueda que chirría, lleno de piezas sueltas, que «compra y vende reacondicionados». En M9
  solo habla: da pistas de cómo se desbloquea lo que falta. Su tienda entre partidas, más
  adelante (M14).
- **El tablón «Productos en Exposición»**: los cinco personajes jugables. Los desbloqueados, a
  color; los otros, en silueta y con su condición en letra pequeña («Disponible al vencer a la
  Nevera Suprema»). Las condiciones son datos y se comprueban al acabar cada partida.
- **El archivador «Reclamaciones sin Resolver»**: los documentos de historia encontrados
  (albaranes, correos internos, manuales de procedimiento del Servicio Técnico), uno por jefe
  vencido por primera vez y alguno en salas secretas. Leídos en orden cuentan, poco a poco, que
  el Servicio Técnico no repara nada. El de la secreta de la Juguetería (un catálogo de Navidad
  interno) deja ver adónde van las piezas: a los juguetes de la temporada siguiente. El de la
  secreta de las Oficinas (un acta del Comité de Dirección) cuenta que la empresa compra a peso lo
  que el Servicio Técnico «reacondiciona» y lo apunta como activo, a precio de nuevo.
- **La cinta de entrada al almacén**: una cinta transportadora con cortinas de tiras de
  plástico en una pared, bajo el cartel «Mercancía devuelta». Pisarla empieza la partida en la
  planta 1 (como un producto más que vuelve al almacén).

## Pautas del humano (2026-10-29)

- Objetos pasivos que dan y quitan (más daño y más cadencia pero menos velocidad, por ejemplo);
  no todos: algunos pueden ser solo buenos.
- Un menú para ver los objetos que llevas y tus estadísticas. Interfaz más o menos limpia.
- Juego equilibrado, con armas que se diferencian de verdad en daño y velocidad.
- Dificultad media-alta: pasar de la planta 3 tiene que ser difícil de verdad.
- Entornos bien diseñados, manteniendo la generación procedural.

Están repartidas como tareas en `docs/HOJA_DE_RUTA.md` (M6, M7, M8 y M10).

## Pautas del humano (2026-10-30)

- Todo más difícil: jefes que se mueven, erráticos y más rápidos cuanto menos vida tienen; balas
  enemigas más grandes; armas con menos daño de base y objetos que suben menos.
- Escasez: se empieza con 1 ticket; cupones y tickets escasos (muchas veces no se podrá abrir un
  cofre); los objetos solo salen de cofres o de la tienda; unos 2 cofres por planta y alguno más
  al limpiar salas. Cofres de calidades: el normal da cosas flojas, el raro solo cosas buenas.
- Un botón de interactuar para hablar, comprar, abrir cofres y volcar muebles como cobertura;
  objetos del escenario que explotan o hacen otras cosas.
- ~~Los cupones se recogen solos al limpiar la sala~~ (corregido el 2026-11-05: hay que recogerlos, y el minimapa avisa de los que quedan). Sin números de daño ni textos al matar.
- (2026-11-05) Lo que se queda en una sala por coger o abrir (cofres, tickets, corazones, armas u
  objetos, cupones) se marca en el minimapa, una sola marca por tipo, como en otros juegos del género.
- Corazones que suben y bajan con objetos; un escudo temporal ligado a la trama; corazones
  especiales temporales con su sprite y su rareza (cuanto más potentes, más raros).
- Sinergias indirectas: objetos que se complementan sin crear nada nuevo (hecho en M9b (14): diez parejas en «Armas y objetos»).
- Los activos que curan no pueden recargarse en dos salas.
- Para más adelante: jefes al azar en cada planta (varios posibles por planta), glosario de
  enemigos y armas, contenido limitado que se desbloquea con logros, PNJs en las plantas que
  piden cosas y acaban en el Mostrador, un Mostrador más grande, y enemigos más distinguibles.

Repartidas en `docs/HOJA_DE_RUTA.md`: M9b (lo inmediato) y M14 (lo de más adelante).

## Contenido mínimo de la primera versión jugable (fin del hito M6)

- 1 personaje (Tostadora), 3 armas, 10 objetos pasivos, 3 activos.
- 5 tipos de enemigo y 1 jefe (La Nevera Suprema) con dos fases.
- 1 planta de unas 10 salas generadas, con tienda y tesoro.
- Menú, pausa, muerte con parte de baja, victoria, guardado de desbloqueos.
- Efectos de sonido y una pista de música.
