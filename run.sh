#!/bin/bash
# run.sh - script to kill existing servers, build and start new

# Check if Docker is mapping port 80 on the host
DOCKER_PORT_80=$(docker ps --format '{{.ID}}' | xargs -r -n1 docker port 2>/dev/null | grep -E '^80/tcp -> 0.0.0.0:80|^80/tcp -> \[::\]:80' || true)
if [ -n "$DOCKER_PORT_80" ]; then
  echo "[WARN] Docker is mapping port 80 on the host! (docker ps shows a container exposing 80/tcp -> 0.0.0.0:80)"
  echo "       This does NOT affect Lalumo on 8080, but nginx on port 80 would fail."
fi

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

echo "Checking nginx for admin interface..."
# Check if nginx is already running
if pgrep -x "nginx" > /dev/null; then
    echo "nginx is already running"
else
    echo "Starting nginx for admin interface..."
    # Enable nginx service and lalumo site
    sudo systemctl enable nginx
    sudo ln -sf /etc/nginx/sites-available/lalumo /etc/nginx/sites-enabled/lalumo
    # Test nginx configuration
    sudo nginx -t
    # Start nginx service for admin interface on port 8080
    sudo service nginx start
fi

# Alternative: PHP Built-in Server (commented out)
# echo "Starting PHP server for admin interface..."
# cd /var/www/Musici; php -S localhost:8080 -t dist &

echo "Ready!!!! Warte kurz, damit die Server starten können..."
sleep 1

echo "
Lalumo-App ist verfügbar unter: http://localhost:9091"
echo "Homepage ist verfügbar unter: http://localhost:9091/homepage"
echo "Admin-Interface ist verfügbar unter: http://localhost:8080/admin/admin.php"
echo "If the browser doesn't open automatically, please visit the URLs manually."

#echo "Starting mobile app update..."
#./mobile-build.sh update
