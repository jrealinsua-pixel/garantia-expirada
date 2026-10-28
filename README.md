# Garantía Expirada

Roguelike de disparos en pixel art, protagonizado por electrodomésticos desechados.
Lo desarrolla Claude Code solo, en sesiones automáticas. Tú juegas y opinas.

## Puesta en marcha (una sola vez)

### 1. Crea el repositorio en GitHub

Crea un repositorio vacío, por ejemplo `garantia-expirada`, sin README ni licencia.

> Para publicar el juego en GitHub Pages con el plan gratuito de GitHub, el repositorio tiene
> que ser **público**. Si lo quieres privado, necesitas GitHub Pro.

### 2. Sube este kit

Descomprime el kit, entra en la carpeta y ejecuta (cambia `TU_USUARIO`):

```bash
cd garantia-expirada
git init -b main
git add -A
git commit -m "Kit de arranque"
git remote add origin https://github.com/TU_USUARIO/garantia-expirada.git
git push -u origin main
```

### 3. Activa GitHub Pages

En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Al minuto tendrás el panel de progreso en:

- Panel: `https://TU_USUARIO.github.io/garantia-expirada/panel/`
- Juego: `https://TU_USUARIO.github.io/garantia-expirada/`

### 4. Primera sesión, acompañada

Abre Claude Code en la carpeta del repositorio (`claude`) y pega el texto de
`PROMPT_INICIAL.md`. Esta primera vez conviene que estés mirando: montará el proyecto (hito
M0) y verás si algo de tu ordenador da problemas.

### 5. Activa el piloto automático

Elige una de las dos opciones.

**Opción A (recomendada): tarea programada en la nube.** Funciona con el ordenador apagado.

1. Entra en [claude.ai/code/routines](https://claude.ai/code/routines), o escribe `/schedule`
   dentro de Claude Code.
2. Repositorio: el tuyo. Frecuencia: cada hora (en «Custom» puedes poner `7 * * * *`).
3. Prompt:

   ```
   Sigue al pie de la letra AUTOPILOT.md de este repositorio. Haz push directamente a la rama
   main, no a otra rama.
   ```

Cada hora arranca una sesión nueva que lee la bitácora, hace una o varias tareas y publica.
Cuando se agota el límite de uso de tu plan, las ejecuciones se rechazan hasta que se reinicia,
y la siguiente sigue sola donde lo dejó la anterior.

**Opción B: bucle en tu ordenador.** El ordenador tiene que estar encendido.

```bash
bash scripts/autopilot.sh
```

Lanza una sesión detrás de otra. Si una falla porque se agotó el límite, espera 30 minutos y
lo vuelve a intentar. Para pararlo: `Ctrl+C`, o crea un archivo llamado `STOP` en la carpeta.

## Día a día

- **Ver el progreso:** abre el panel. Muestra los hitos, el contenido del juego, el estado de
  los tests, capturas y el diario de sesiones.
- **Jugar:** el botón «Jugar la última versión» del panel.
- **Pedir cambios:** escribe en `docs/NOTAS_DEL_HUMANO.md` (se puede editar desde la web de
  GitHub con el lápiz). Claude atiende esas notas antes que nada.
- **Si algo necesita tu decisión,** aparece en rojo en el panel, en «Necesita tu decisión».

## Ten en cuenta

- El piloto automático **gasta los límites de uso de tu plan de Claude**. Mientras estén
  agotados, tampoco podrás usar Claude para otras cosas.
- Las tareas programadas en la nube requieren un plan Pro, Max, Team o Enterprise, y están en
  fase de vista previa: su funcionamiento puede cambiar.
- Revisa el juego de vez en cuando. Sin tu opinión, el juego avanza, pero solo tú sabes si es
  divertido.

## Qué hay en el repositorio

| Ruta | Contenido |
| --- | --- |
| `CLAUDE.md` | Reglas permanentes para Claude Code |
| `AUTOPILOT.md` | Lo que hace cada sesión automática |
| `PROMPT_INICIAL.md` | El texto para la primera sesión |
| `docs/DISENO.md` | Historia, tono, personajes y mecánicas |
| `docs/ESTILO_ARTE.md` | Reglas del pixel art aprobado |
| `docs/HOJA_DE_RUTA.md` | Hitos y tareas |
| `docs/BITACORA.md` | Diario de cada sesión |
| `docs/NOTAS_DEL_HUMANO.md` | Tus peticiones |
| `progress.json` | Datos del panel |
| `panel/` | El panel de progreso |
| `art/referencia/` | Sprites aprobados |
| `tools/referencia/` | Scripts que generaron esos sprites |
| `scripts/autopilot.sh` | Bucle local (opción B) |
