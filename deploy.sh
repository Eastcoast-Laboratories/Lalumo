#! /bin/bash

# 27.07.2026: lalumo.eu ist auf die neue vm06 umgezogen (Neuaufbau nach dem
# Einbruch, siehe eclabs-xen/neu-aufbau-vm06.md). Zwei Dinge haben sich dadurch
# geaendert:
#
#   Ziel     nicht mehr vm06.eclabs. Dieser Name zeigte auf die alte VM, und
#            deren Portweiterleitung wurde entfernt, damit Deploy-Skripte nicht
#            versehentlich weiter auf die kompromittierte Maschine schreiben.
#
#   Rechte   PHP laeuft nicht mehr als www-data, sondern in einem eigenen Pool
#            als w-lalumo-eu. Deshalb duerfen die Dateien nicht mehr als
#            root:root ankommen: der Pool-Benutzer koennte sie sonst nicht
#            mehr schreiben, und neue Verzeichnisse verlieren das setgid-Bit.
#            --chown und --chmod ersetzen die alten --no-perms --no-owner
#            --no-group. rsync setzt das direkt, ein Nachlauf auf dem Server
#            ist nicht noetig.
#
# Die Werte stammen aus /etc/nginx/fpm-user-map.txt auf dem Server:
#   lalumo.eu w-lalumo-eu 8.4 ruben

set -euo pipefail

# Load deployment configuration from .env (not committed to git).
# Copy .env.example to .env and fill in the real values.
cd "$(dirname "$0")"
set -a
[ -f .env ] && . ./.env
set +a

# online
SSH_HOST="${SSH_USER:-root}@${SERVER_IP}"
SSH_PORT="${SSHPORT}"
SSH_PATH="${SSH_PATH}"
GIT_PATH="${GIT_PATH}"

# FPM-Pool-Benutzer und Kundengruppe der Site
FPM_USER="${FPM_USERNAME}"
KUNDE="${FPM_GROUP}"

SSH="ssh -p ${SSH_PORT}"

# Aus dem Projektverzeichnis heraus arbeiten, egal von wo aufgerufen - sonst
# scheitert npm mit "Missing script: build".
# (cd already happened above before sourcing .env)

# 1. Build the project with standardized configuration
npm run build || { echo "Build failed - aborting deployment"; exit 1; }

# 2. Sync the entire dist directory to the server with one command
echo "Syncing entire dist/ directory to server..."
rsync -avz --delete \
      --chown="${FPM_USER}:${KUNDE}" \
      --chmod=D2750,F640 \
      -e "$SSH" \
      dist/ "${SSH_HOST}:${SSH_PATH}"

echo "Deployment complete! Homepage files at https://lalumo.eu (EN) and https://lalumo.eu/de/ (DE) and app at https://lalumo.eu/app"

# 3. Git-Spiegel. Liegt ausserhalb des Webroots und wird von keinem Vhost
# ausgeliefert, braucht also den Pool-Benutzer nicht - aber das Verzeichnis
# existiert auf der neuen VM noch nicht.
echo "Uploading git repository..."
$SSH "$SSH_HOST" "mkdir -p '${GIT_PATH}'"
rsync -avz --delete \
      --chown="root:${KUNDE}" \
      --chmod=D2750,F640 \
      -e "$SSH" \
      .git/ "${SSH_HOST}:${GIT_PATH}"

# 4. Nachweisen, dass die Rechte stimmen - nicht behaupten. Wenn hier etwas
# uebrig bleibt, kann PHP seine eigenen Dateien nicht mehr schreiben.
echo "Checking permissions on the server..."
$SSH "$SSH_HOST" "
    wrong=\$(find '${SSH_PATH}' \\( \\! -user ${FPM_USER} -o \\! -group ${KUNDE} \\) | wc -l)
    if [ \"\$wrong\" != 0 ]; then
        echo \"  WARNING: \$wrong files are not ${FPM_USER}:${KUNDE}\"
        exit 1
    fi
    echo '  ok - all files belong to ${FPM_USER}:${KUNDE}'
"

echo "done"