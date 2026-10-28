#!/usr/bin/env bash
# Piloto automático local: lanza sesiones de Claude Code una detrás de otra.
#
# Uso (desde la raíz del repositorio):
#   bash scripts/autopilot.sh
#
# - Cada sesión sigue AUTOPILOT.md y hace push a main.
# - Si una sesión falla (por ejemplo, porque se agotó el límite de uso), espera y lo vuelve a
#   intentar más tarde. Así sigue sola en cuanto vuelve a haber créditos.
# - Para pararlo: Ctrl+C, o crea un archivo llamado STOP en la raíz del repositorio.
# - Los registros de cada sesión quedan en logs/ (no se suben a git).
#
# Variables opcionales:
#   PAUSA_OK=120       segundos de descanso entre sesiones que terminan bien
#   PAUSA_ERROR=1800   segundos de espera tras un fallo (30 min)
#   MODO=auto          modo de permisos de Claude Code (auto o acceptEdits)

set -u
cd "$(dirname "$0")/.."

PAUSA_OK="${PAUSA_OK:-120}"
PAUSA_ERROR="${PAUSA_ERROR:-1800}"
MODO="${MODO:-auto}"
mkdir -p logs

if ! command -v claude >/dev/null 2>&1; then
  echo "No encuentro el comando 'claude'. Instala Claude Code e inicia sesión primero."
  exit 1
fi

# Con acceptEdits, Claude puede editar archivos pero necesita permiso explícito para comandos.
PERMISOS=(--permission-mode "$MODO" --permission-prompts none)
if [ "$MODO" = "acceptEdits" ]; then
  PERMISOS+=(--allowedTools "Bash(npm *),Bash(npx *),Bash(node *),Bash(git *),Bash(python3 *),Bash(ls *),Bash(cat *)")
fi

sesion=0
while true; do
  if [ -f STOP ]; then
    echo "Archivo STOP encontrado. Me detengo."
    exit 0
  fi

  sesion=$((sesion + 1))
  ts="$(date +%Y%m%d-%H%M%S)"
  echo "[$ts] Sesión $sesion: empiezo."
  git checkout main >/dev/null 2>&1 || true
  git pull --ff-only >/dev/null 2>&1 || echo "Aviso: no he podido hacer git pull; sigo con lo que hay."

  if claude -p "$(cat AUTOPILOT.md)" "${PERMISOS[@]}" --output-format json \
       >"logs/$ts.json" 2>"logs/$ts.err"; then
    echo "[$(date +%H:%M:%S)] Sesión $sesion terminada. Descanso $PAUSA_OK s."
    sleep "$PAUSA_OK"
  else
    echo "[$(date +%H:%M:%S)] Sesión $sesion falló (¿límite de uso?). Mira logs/$ts.*"
    echo "Vuelvo a intentarlo dentro de $PAUSA_ERROR s."
    sleep "$PAUSA_ERROR"
  fi
done
