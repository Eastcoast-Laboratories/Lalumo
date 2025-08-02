#!/bin/bash
# run.sh - script to kill existing servers, build and start new

echo "Stopping any running servers..."
# Kill processes on port 9091 (current webpack port)
fuser -k 9091/tcp 2>/dev/null || echo "No process running on port 9091"
fuser -k 9092/tcp 2>/dev/null || echo "No process running on port 9092"
# Kill PHP server on port 8080 (admin interface)
fuser -k 8080/tcp 2>/dev/null || echo "No process running on port 8080"

# Also try to kill by process name in case port changed
pkill -f 'webpack.*serve' 2>/dev/null || echo "No webpack process found"
pkill -f 'php.*-S.*8080' 2>/dev/null || echo "No PHP server process found"

# 3. rsync images from public directory to app
echo "Syncing images..."
rsync -a --progress --delete public/images/ app/images/

echo "Starting webpack development server..."
# Starte webpack-Server im Hintergrund
cd /var/www/Musici; npm run build:fast; npm run watch &

echo "Starting PHP server for admin interface..."
# Starte PHP-Server für Admin-Interface im Hintergrund
cd /var/www/Musici; php -S localhost:8080 -t dist &

echo "Ready!!!! Warte kurz, damit die Server starten können..."
sleep 1

echo "
Lalumo-App ist verfügbar unter: http://localhost:9091"
echo "Homepage ist verfügbar unter: http://localhost:9091/homepage"
echo "Admin-Interface ist verfügbar unter: http://localhost:8080/api/admin/admin.php"
echo "If the browser doesn't open automatically, please visit the URLs manually."

#echo "Starting mobile app update..."
#./mobile-build.sh update
