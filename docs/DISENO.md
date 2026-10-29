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

### Jefes

| Jefe | Estado | Idea |
| --- | --- | --- |
| **La Nevera Suprema** | Aprobada | Jefa de la planta 1. Fase 1, «Congelación de precios»: ráfagas de cubitos, anillos de granizo y bolas de escarcha que dejan charcos que frenan al andar (no al rodar). Fase 2, «Oferta irrechazable» (desde la mitad de la vida): abre la puerta y enseña un interior lleno de comida caducada; dispara tarjetas de fidelización que te persiguen un rato (más lentas que tú, giran abierto y se rompen a tiros), escupe yogures hinchados, bricks y latas abolladas que caen donde marca un anillo rojo y revientan en balas, y sigue soltando cubitos. Entra con cartel: «Jefa de planta · Almacén de devoluciones» y el lema «Congelamos los precios. Y las reclamaciones.» |
| El Router del Wifi | Por diseñar | Planta 2 (Informática). Se reinicia a mitad de combate. |
| El Muñeco de Moda | Por diseñar | Planta 3 (Juguetería). Juguete de la temporada pasada, olvidado y rencoroso. |
| El Director de Recursos Inhumanos | Por diseñar | Jefe humano de la planta de oficinas. |

## Mecánicas

### Control

- Movimiento en 8 direcciones (WASD o stick izquierdo), apuntar con el ratón o el stick derecho.
- Disparo (clic izquierdo o gatillo), recarga automática o manual.
- **Esquiva rodando** (espacio o botón): recorre unas 3 casillas, invulnerable las primeras
  0,4 s, enfriamiento corto. Es la mecánica central: el combate se diseña alrededor de ella.
- Objeto activo (Q o botón) y cambio de arma (rueda o botón).

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

### Balas enemigas

- Grandes, de colores saturados y con borde claro, para que se lean sobre cualquier suelo.
- Los patrones (anillo, abanico, espiral, ráfaga dirigida, onda) se definen como datos y se
  combinan. Cada enemigo telegrafía su ataque (parpadeo, sonido) antes de disparar.

### Progresión entre partidas

- Al ganar o al llegar a ciertos hitos se desbloquean personajes, objetos nuevos en el
  conjunto de botín y salas raras.
- Un pequeño **centro**: el mostrador de Devoluciones del vertedero, con PNJs (el Servicio
  Técnico al teléfono, un vendedor ambulante de piezas) que cambian con el progreso.

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
