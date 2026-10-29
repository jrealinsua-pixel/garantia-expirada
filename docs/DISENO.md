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
  plazo: 4 plantas y el final del Servicio Técnico.
- **Muerte permanente.** Al morir se pierde la partida. Se conservan los desbloqueos.

### Economía

- **Cupones descuento** como moneda: caen de los enemigos y se gastan en la tienda.
- **Tickets** como llaves: abren cofres y puertas cerradas.
- **Pilas** como cargas del objeto activo.

### Armas y objetos

- Las armas tienen cargador, cadencia, dispersión, velocidad de bala, daño y retroceso. Todas
  son objetos cotidianos convertidos en arma.
- Objetos pasivos que modifican estadísticas o comportamiento de las balas.
- **Sinergias:** ciertas combinaciones activan un efecto extra y un texto especial (ej.:
  Pila Casi Agotada + Secador = «Sobrecarga: el secador dispara llamas un momento y luego se
  apaga»).

### Balas enemigas

- Grandes, de colores saturados y con borde claro, para que se lean sobre cualquier suelo.
- Los patrones (anillo, abanico, espiral, ráfaga dirigida, onda) se definen como datos y se
  combinan. Cada enemigo telegrafía su ataque (parpadeo, sonido) antes de disparar.

### Progresión entre partidas

- Al ganar o al llegar a ciertos hitos se desbloquean personajes, objetos nuevos en el
  conjunto de botín y salas raras.
- Un pequeño **centro**: el mostrador de Devoluciones del vertedero, con PNJs (el Servicio
  Técnico al teléfono, un vendedor ambulante de piezas) que cambian con el progreso.

## Contenido mínimo de la primera versión jugable (fin del hito M6)

- 1 personaje (Tostadora), 3 armas, 10 objetos pasivos, 3 activos.
- 5 tipos de enemigo y 1 jefe (La Nevera Suprema) con dos fases.
- 1 planta de unas 10 salas generadas, con tienda y tesoro.
- Menú, pausa, muerte con parte de baja, victoria, guardado de desbloqueos.
- Efectos de sonido y una pista de música.
