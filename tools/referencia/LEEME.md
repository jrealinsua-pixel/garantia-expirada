# Scripts de referencia

Generaron los sprites aprobados de `art/referencia/`. Son Python sin dependencias externas y
solo sirven de ejemplo del método: dibujar cada sprite por código con rampas de color, contorno
negro automático y detalles a mano. El proyecto debe portarlo a TypeScript en `tools/sprites/`.

| Archivo | Qué contiene |
| --- | --- |
| `build4.py` | **Los personajes aprobados**: tostadora, aspirador, microondas, bombilla, Nevera Suprema y las armas. Empieza por aquí. |
| `build2.py` | Utilidades (rampas, `box`, `outline`, `ellipse`), la sala del almacén con estanterías, balas y HUD, y accesorios (caja, barril, carrito). Sus personajes robot están **descartados**. |
| `build.py` | Lienzo y exportación PNG, y los objetos de 16 × 16 (pila, manual, ticket, garantía, caja). Sus personajes de 16 × 16 están **descartados**. |

Para regenerar: `python3 build4.py` (crea carpetas `assets*` y previsualizaciones junto a los
scripts).
