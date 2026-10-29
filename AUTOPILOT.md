# Protocolo de sesión autónoma

Esta es una sesión de trabajo autónoma sobre el juego **Garantía Expirada**. Nadie va a
contestar preguntas: decide tú, deja constancia por escrito y sigue. Antes de nada lee
`CLAUDE.md` entero.

## 1. Ponte al día (5 minutos como mucho)

1. Asegúrate de estar en la rama `main` y actualizada (`git checkout main && git pull`).
2. Lee `progress.json`, las tres últimas entradas de `docs/BITACORA.md` y el hito actual en
   `docs/HOJA_DE_RUTA.md`.
3. Lee `docs/NOTAS_DEL_HUMANO.md`. Las notas sin marcar `[atendida]` tienen prioridad.

## 2. Comprueba la salud del proyecto

Si existe `package.json`, ejecuta `npm ci`, `npm run check`, `npm test`, `npm run build` y
`npm run bot`. Si algo falla, **tu tarea de esta sesión es arreglarlo**. No empieces nada nuevo
con `main` roto.

## 3. Elige una sola tarea

En este orden:

1. Lo que esté roto.
2. Una nota del humano pendiente.
3. La siguiente tarea sin hacer del hito actual (la primera `- [ ]` de la lista).
4. Si el hito actual tiene todas las tareas hechas pero no cumple sus criterios de aceptación,
   la tarea que más le acerque a cumplirlos.
5. Si el hito está terminado, márcalo como hecho y empieza el siguiente.
6. Si la hoja de ruta se acaba, escribe un hito nuevo al final con mejoras que el juego
   necesite de verdad (más contenido, pulido, rendimiento, accesibilidad) y empieza por él.

Elige una tarea que puedas terminar en esta sesión. Si es demasiado grande, divídela en la hoja
de ruta y haz la primera parte.

## 4. Hazla bien

- Escribe o actualiza los tests a la vez que el código.
- Si toca algo visual: `npm run e2e`, abre las capturas de `capturas/`, compáralas con
  `art/referencia/` y corrige hasta que te convenzan.
- Si toca el equilibrio: mide con `npm run bot` antes y después.
- Antes de hacer commit, vuelve a pasar `check`, `test`, `build` y `bot`. Todo en verde.

## 5. Deja constancia

1. Marca la tarea como hecha `- [x]` en `docs/HOJA_DE_RUTA.md`.
2. Añade una entrada **al principio** de `docs/BITACORA.md`:

   ```
   ## AAAA-MM-DD HH:MM — Hito MX — título corto
   - Hecho: …
   - Decisiones: … (y por qué)
   - Medidas: … (si las hay)
   - Problemas conocidos: …
   - Siguiente paso: … (lo que haría la próxima sesión)
   ```

3. Actualiza `progress.json`: fecha, versión, estado de los hitos, métricas
   (`npm run stats` cuando exista), la sesión nueva al principio de `sesiones`, las capturas
   más representativas (cópialas a `panel/capturas/`, como mucho 6, borra las viejas),
   `proximo` y `bloqueos`.
4. Si atendiste una nota del humano, márcala `[atendida]` y explica en una línea qué hiciste.

## 6. Guarda y publica

```
git add -A
git commit -m "MX: resumen de la tarea"
git push origin main
```

Haz el push **directamente a `main`**, no a otra rama: el panel y el juego publicado se
actualizan desde `main`. Si el push falla porque alguien empujó antes, haz
`git pull --rebase` y vuelve a intentarlo. Nunca uses `--force`.

## 7. ¿Te queda tiempo y contexto?

Las sesiones tienen que ser **largas** (nota del humano del 2026-10-29): cuando termines una
tarea y la hayas publicado (paso 6), vuelve al paso 3 con la siguiente, y así mientras te quede
contexto. Cada tarea se cierra igual que la primera: tests, capturas si es visual, `check`,
`test`, `build` y `bot` en verde, su entrada en la bitácora y su commit y push. La calidad no
baja por ir más deprisa: si notas que el contexto se llena, que empiezas a saltarte pasos o que
las capturas ya no las miras con calma, cierra limpio y deja que la próxima sesión empiece fresca.
