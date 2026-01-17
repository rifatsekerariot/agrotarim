#!/bin/bash

# Configuration
DOMAIN="www.adanateknotarim.org"
EMAIL="admin@adanateknotarim.org" # Değiştirilmesi önerilir

echo "--- AgroMeta SSL Kurulum Sihirbazı ---"

# 1. Update and Install Dependencies
echo "[1/5] Paket listeleri güncelleniyor ve Nginx/Certbot kuruluyor..."
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

# 2. Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "HATA: Docker çalışmıyor. Lütfen önce 'docker-compose up -d' ile projeyi başlatın."
    exit 1
fi

# 3. Configure Nginx
echo "[2/5] Nginx yapılandırılıyor..."
cat > /etc/nginx/sites-available/$DOMAIN <<EOF
server {
    server_name $DOMAIN adanateknotarim.org;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Link module
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Configuration
echo "Nginx konfigürasyonu test ediliyor..."
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# 4. Obtain SSL Certificate
echo "[3/5] SSL Sertifikası alınıyor (Certbot)..."
sudo certbot --nginx -d $DOMAIN -d adanateknotarim.org --non-interactive --agree-tos -m $EMAIL --redirect

# 5. Final Checks
echo "[4/5] Güvenlik duvarı ayarları (UFW)..."
sudo ufw allow 'Nginx Full'

echo "--- Kurulum Tamamlandı! ---"
echo "Şu adresten erişebilirsiniz: https://$DOMAIN"
