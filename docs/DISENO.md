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

### Jefes

| Jefe | Estado | Idea |
| --- | --- | --- |
| **La Nevera Suprema** | Aprobada | Jefa de la planta 1. Fase 1, «Congelación de precios»: ráfagas de cubitos, anillos de granizo y bolas de escarcha que dejan charcos que frenan al andar (no al rodar). Fase 2, «Oferta irrechazable» (desde la mitad de la vida): abre la puerta y enseña un interior lleno de comida caducada; dispara tarjetas de fidelización que te persiguen un rato (más lentas que tú, giran abierto y se rompen a tiros), escupe yogures hinchados, bricks y latas abolladas que caen donde marca un anillo rojo y revientan en balas, y sigue soltando cubitos. Entra con cartel: «Jefa de planta · Almacén de devoluciones» y el lema «Congelamos los precios. Y las reclamaciones.» |
| El Router del Wifi | Hecho | Jefe de la planta 2 (letra `X`; la Nevera sigue en la 1). 200 de vida. Un router blanco de cuatro antenas (una doblada y con celo), ojos verdes de piloto bajo unos párpados de suficiencia, la luz de «internet» siempre en rojo (conectado, sin internet), la pegatina de la clave medio arrancada y un cable de red que no lleva a ninguna parte. Entra con cartel: «Jefe de planta · Informática» y el lema «Cobertura total. En la otra habitación.». Fase 1, «Cobertura total»: al empezar planta dos **repetidores** (8 de vida) en las esquinas más lejanas de la tostadora; ataca con dos anillos de ondas cian, cada uno con su «zona sin cobertura» (un hueco de 60° a un lado de la tostadora, un poco más girado en el segundo: hay que moverse hasta él), que los repetidores reenvían a la vez desde su sitio con un anillo fino; y con tres abanicos de «paquetes» rojos. **Reinicio** a media vida: «Reiniciando. No desenchufe el dispositivo», 5 s apagado con los ojos cerrados y las luces encendiéndose una a una, sin recibir daño; se limpian las balas y caen los repetidores. Fase 2, «Actualización de firmware»: tres anillos más rápidos con dos huecos que se separan, cada uno hacia su lado; abanicos más anchos; y «caídas de conexión»: tres sitios marcados en el suelo (uno bajo la tostadora) que al cabo de 1 s sueltan un anillo corto. Sin repetidores, planta uno nuevo cada 12 s. Su sala es amplia y despejada en el centro, con cuatro escuadras de rack para cubrirse de los repetidores. |
| El Muñeco de Moda | Por diseñar | Planta 3 (Juguetería). Juguete de la temporada pasada, olvidado y rencoroso. |
| El Director de Recursos Inhumanos | Por diseñar | Jefe humano de la planta de oficinas. |

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
- **Tickets** como llaves: abren cofres y puertas cerradas. Cada planta tiene 2 salas de
  combate que sueltan un ticket al limpiarlas y otras 2 donde cae una **Caja Fuerte de
  Devoluciones** (el cofre). Se abre andando contra ella con un ticket: se lo traga y suelta el
  siguiente objeto pasivo (o activo, o arma) y unos cupones. Sin ticket, se queja («Sin ticket
  no hay devolución»).
- **La tienda** (Tienda del Personal): la atiende la **Caja de Autocobro**, una caja de
  autopago que se quedó sola después de que despidieran a las demás. Tres baldas: el siguiente
  objeto de la baraja de la planta (15 cupones; si no quedan pasivos, un activo por 12 o un arma
  por 18), un corazón de recambio (6) y un ticket (8). Se compra andando sobre lo que se quiere;
  sin cupones suficientes la pantalla se pone roja («Saldo insuficiente. Pruebe a tener más.») y
  con la vida llena no vende corazones («No le vendo nada que no necesite. Aún.»). Una planta
  entera da unos 40 cupones: da para dos o tres cosas, así que comprar es elegir.
- **Pilas** como cargas del objeto activo.

### Armas y objetos

- Las armas tienen cargador, cadencia, dispersión, velocidad de bala, daño y retroceso. Todas
  son objetos cotidianos convertidos en arma.
- Objetos pasivos que modifican estadísticas o comportamiento de las balas.
- Cada arma gana claramente en algo y pierde en otra cosa (nota del humano; lo comprueba
  `tests/armas.test.ts` y lo mide `npm run armas`). Armas de la planta 1:

| Arma | Daño | Disparos/s | Cargador | Recarga | Alcance | Daño/s (con recargas) | Gana en | Pierde en |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Secador Mágnum 2200 W | 2 | 2,6 | 10 | 1,2 s | 350 | 4,0 | Alcance, puntería, golpe por bala | Daño por segundo |
| Grapadora Táctica | 1 | 11 | 33 | 2,2 s | 220 | 6,3 | Cadencia, cargador | Daño por bala, recarga larga |
| Plancha de Vapor Turbo | 2 × 5 | 1,3 | 4 | 1,7 s | 100 | 8,4 de cerca | Golpe por disparo (10) | Alcance, cargador, puntería |

Objetos pasivos de la planta 1 (`src/data/items.ts`). Casi todos dan algo y quitan algo:

| Objeto | Descripción | Efecto |
| --- | --- | --- |
| Pila Casi Agotada | Dura lo que un contrato temporal. Después, nada. | Cadencia ×1,3, cargador ×0,7 |
| Manual en Chino | Nadie sabe por qué funciona. Tampoco el fabricante. | Las balas rebotan 2 veces y duran ×1,3 |
| Garantía Extendida | Cubre todo excepto lo que te pase. La letra pequeña no se puede leer: forma parte del servicio. | +1 corazón |
| Regleta Sin Tierra | Seis enchufes y un solo contrato de luz. Lo que salte después no está cubierto. | +1 bala por disparo, +6° de dispersión, cadencia ×0,7 |
| Tarjeta de Socio | Te sigue a todas partes. Como los correos de la tienda. | Las balas persiguen un momento; un poco más lentas |
| Etiqueta A+++ | Eficiencia energética certificada por el propio fabricante. | Velocidad ×1,15, voltereta antes |
| Alargador de Tres Metros | Llega a todas partes. Sobre todo a los tobillos. | Alcance ×1,35, balas más rápidas |
| Broca del Ocho | Para colgar un cuadro. Ya puestos, para todo lo demás. | Las balas atraviesan 2 enemigos; menos empuje |
| Cinta Americana | Lo arregla todo durante una semana. | Recarga ×0,6 |
| Resistencia de Recambio | Pieza no original. Calienta más de lo que pone en la caja. | +1 de daño, balas más gordas, cadencia ×0,75, más retroceso |

Objetos pasivos de la planta 2 (Informática, `level: 2`). Solo salen desde la planta 2: cada planta
reparte los suyos y los de las plantas de abajo (`itemsUpTo` en `src/data/items.ts`).

| Objeto | Descripción | Efecto |
| --- | --- | --- |
| Pendrive de 2 GB | Cabe todo lo que no necesitas. Copiarlo tarda una tarde. | Cargador ×1,6, recarga ×1,3 |
| Antivirus Gratuito | Te protege de todo menos de sí mismo. Gasta la mitad del procesador. | +1 corazón, velocidad ×0,9, voltereta ×1,3 más tarde |
| Cable HDMI Dorado | Mejora la imagen un 0 %. Lo pone en la caja, en letras doradas. | Balas ×1,2 más rápidas, la mitad de dispersión (solo bueno) |
| Ventilador de Portátil | Suena como un avión y enfría como una vela. | Cadencia ×1,25, +5° de dispersión, alcance ×0,85 |
| Actualización Obligatoria | Reinicie para aplicar los cambios. Sí, ahora. | +1 de daño, recarga ×1,6, cargador ×0,8 |
| Ratón Gaming RGB | Dieciséis millones de colores y un clic que a veces cuenta doble. | 20 % de balas con daño ×2 («Doble clic» sobre el blanco) |
| Batería Externa | Carga cualquier cosa menos el móvil. Pesa como un ladrillo. | +1 pila por sala limpia, velocidad ×0,92 |
| Cookies de Terceros | Aceptaste todas. Ahora cada enemigo te deja un regalito, y a ellos tus datos. | El 50 % de las bajas (jefes aparte) suelta un cupón más |
| Modo Avión | Corta todas las conexiones. También las que vienen hacia ti. | La voltereta corta las balas enemigas que toca; voltereta ×1,25 más tarde |
| Copia de Seguridad | Restaura el sistema tal y como estaba el martes. Funciona una vez, como todo. | Una vez, en vez de la baja, vuelve con 1 corazón («Restaurando copia del martes»), limpia las balas y se gasta |

Los tres últimos no son solo cifras: un modificador puede llevar, además de `stats` y `bullets`,
golpes críticos (`bullets.crit`) y `perks` (pilas de más por sala, cupones de más por baja,
voltereta que corta balas y vuelta de la baja).

Objetos activos (tecla Q o botón B del mando). Se lleva uno; al coger otro, el viejo se queda en
el suelo con sus pilas. Cada sala de combate limpia mete una pila; se usa cuando está lleno:

| Objeto | Descripción | Pilas | Efecto |
| --- | --- | --- | --- |
| Encuesta de Satisfacción | Su opinión es muy importante para nosotros. Por eso nadie la lee. | 2 | Borra todas las balas enemigas |
| Música de Espera | Todos nuestros enemigos están ocupados. Su ataque será atendido en breve. | 3 | Enemigos, balas y ataques en espera 3,5 s (siguen recibiendo daño) |
| Pegamento Exprés | Pega cualquier cosa a cualquier cosa. Sobre todo los dedos. | 2 | Devuelve un corazón (con la vida llena no se gasta) |

La sala del tesoro tiene tres pedestales (un arma, un objeto pasivo y uno activo) y la secreta
uno (lo siguiente que quede). Los cofres sacan de las mismas barajas, así que una planta no
repite objeto.
- **Sinergias:** ciertas combinaciones activan un efecto extra y un texto especial, en
  `src/data/synergies.ts`. Las que piden un arma solo cambian esa arma, y cuentan mientras esté
  en el arsenal (no hace falta llevarla en la mano). Al activarse sale «Sinergia corporativa:», su nombre y
  su frase en un recuadro bajo la descripción del objeto.

| Sinergia | Piezas | Frase | Efecto |
| --- | --- | --- | --- |
| Sobrecarga | Pila Casi Agotada + Secador | El secador sopla como nunca hasta que salta el diferencial. | Secador: cadencia ×1,25, balas +1 de radio, recarga ×1,4 |
| Papeleo Exprés | Cinta Americana + Grapadora | Grapa, cinta y archivado. Así se cierran los expedientes sin leerlos. | Grapadora: cargador ×1,5, recarga ×0,8 |
| Bricolaje Avanzado | Manual en Chino + Broca del Ocho | Nadie ha leído las instrucciones, así que las balas improvisan. | +1 rebote y +1 enemigo atravesado |
| Instalación Casera | Regleta Sin Tierra + Alargador | Todo enchufado a todo. El seguro del hogar ha dejado de coger el teléfono. | +1 bala por disparo, 3° menos de dispersión |
| Cliente Preferente | Tarjeta de Socio + Etiqueta A+++ | Puntos dobles en cada disparo. Caducan mañana. | Persecución más fuerte: gira 400°/s durante 1 s, desde 150 px |
| Setup Gamer | Ratón Gaming RGB + Ventilador de Portátil | Luces, ruido y el ventilador al máximo. Los fotogramas no suben, pero se nota. | +15 % de críticos (35 % en total) |
| Conflicto de Software | Antivirus Gratuito + Actualización Obligatoria | El antivirus bloquea la actualización. Por una vez, se agradece. | Recarga ×0,625: anula la recarga lenta de la actualización y deja su daño |

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
  el Servicio Técnico no repara nada.
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

## Contenido mínimo de la primera versión jugable (fin del hito M6)

- 1 personaje (Tostadora), 3 armas, 10 objetos pasivos, 3 activos.
- 5 tipos de enemigo y 1 jefe (La Nevera Suprema) con dos fases.
- 1 planta de unas 10 salas generadas, con tienda y tesoro.
- Menú, pausa, muerte con parte de baja, victoria, guardado de desbloqueos.
- Efectos de sonido y una pista de música.
