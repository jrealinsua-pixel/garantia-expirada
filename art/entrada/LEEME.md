# Sprites hechos fuera

Aquí se pueden dejar sprites que no salen del código del juego: hechos por otra IA de imagen
especializada en pixel art, o por ti. El juego los pasa a su paleta y a su tamaño, los mete en
sus hojas y apunta de dónde salen en `CREDITOS.md`.

## Cómo se deja uno

1. El PNG, con fondo transparente, mirando **a la derecha** y en vista de tres cuartos (como los
   del juego). Puede venir ampliado (las IA suelen dar cada píxel como un bloque de 4 × 4 a
   16 × 16): el script encuentra el tamaño del bloque solo. Si es una tira de animación, los
   fotogramas van uno al lado de otro, todos del mismo ancho.
2. Al lado, un JSON **con el mismo nombre** (`tostadora.png` → `tostadora.json`):

   ```json
   {
     "id": "tostadora-ia",
     "que": "La Tostadora, redibujada",
     "autor": "Tu nombre, o la IA y quién la usó",
     "licencia": "IA-uso-comercial",
     "origen": "Herramienta y enlace (o el texto que le pediste)",
     "fotogramas": 1,
     "ancho": 48,
     "alto": 50,
     "contorno": true,
     "reemplaza": false
   }
   ```

   - `id`: el nombre de la hoja en el juego (minúsculas y guiones). Si ya existe una hoja con ese
     nombre dibujada por código, solo la sustituye si pones `"reemplaza": true`.
   - `licencia`: una de `CC0`, `CC-BY`, `CC-BY-SA`, `OFL`, `MIT`, `propia` (lo has hecho tú) o
     `IA-uso-comercial` (una IA cuyas condiciones permiten usar lo que genera en un juego).
     Sin licencia válida, el sprite no entra.
   - `fotogramas`, `ancho`, `alto`, `escala` y `contorno` son opcionales: cuántos fotogramas hay en
     la tira, el tamaño del fotograma ya reducido (el sprite queda de pie en el borde de abajo,
     centrado), cuántos píxeles mide cada píxel de verdad si el script no lo acierta, y si se le
     pone el contorno selectivo del estilo nuevo (para sprites que vienen sin él).
3. `node tools/sprites/entrada.ts`: los procesa, deja una vista previa en `procesados/` y
   apunta los créditos. Después, `npm run sprites` los mete en `public/assets/`.

Los colores se ajustan a la paleta de `src/art/paleta.ts`: si un sprite usa un color que la
paleta no tiene, saldrá con el más parecido. Las reglas del estilo están en `docs/ESTILO_ARTE.md`.
