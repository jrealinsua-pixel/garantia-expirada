# Prompt inicial para Claude Code

Pega este texto en la primera sesión de Claude Code, abierta en la carpeta del repositorio.

---

Vas a desarrollar tú solo, de forma autónoma y durante mucho tiempo, el videojuego
**Garantía Expirada**: un roguelike de disparos en pixel art al estilo de Enter the Gungeon y
The Binding of Isaac, protagonizado por electrodomésticos desechados, con humor de sátira,
humor negro y crítica social.

Todo lo que necesitas está en el repositorio:

1. Lee `CLAUDE.md` entero. Son tus reglas permanentes.
2. Lee `docs/DISENO.md`, `docs/ESTILO_ARTE.md` y `docs/HOJA_DE_RUTA.md`.
3. Mira las imágenes de `art/referencia/`. Es el estilo de arte aprobado: no lo cambies.
4. Sigue `AUTOPILOT.md` para trabajar.

En esta primera sesión, completa el hito **M0 (Cimientos)** entero, aunque te lleve varias
tareas seguidas. Al final, lo siguiente debe funcionar: `npm run dev`, `build`, `check`,
`test`, `bot`, `e2e`, `sprites` y `stats`. La escena de prueba debe mostrar la Tostadora en
una sala del almacén, y el flujo de GitHub Actions debe publicar el juego y el panel.

Si te queda margen, empieza el hito M1 hasta que se pueda mover la tostadora y disparar: el
humano quiere jugar algo cuanto antes.

Haz commit y push a `main` al terminar cada tarea, actualiza la bitácora y `progress.json`,
y no me hagas preguntas: decide tú y deja tus decisiones escritas en la bitácora.
