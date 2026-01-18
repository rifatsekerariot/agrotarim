#!/bin/bash

# ============================================
# 🌐 Nginx Setup Script for Sera Otomasyon
# ============================================
# Automated Nginx + SSL configuration
# Connects to Docker containers
# ============================================

set -e

echo "============================================"
echo "🌐 Nginx Reverse Proxy Setup"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (sudo)${NC}"
    exit 1
fi

# ============================================
# 1. Check/Install Nginx
# ============================================

echo "📦 1. Checking Nginx..."

if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d'/' -f2)
    echo -e "${GREEN}✅ Nginx already installed (v$NGINX_VERSION)${NC}"
else
    echo "📥 Installing Nginx..."
    apt-get update -qq
    apt-get install -y nginx
    echo -e "${GREEN}✅ Nginx installed${NC}"
fi

# ============================================
# 2. Check/Install Certbot (for SSL)
# ============================================

echo ""
echo "🔒 2. Checking Certbot (SSL)..."

if command -v certbot &> /dev/null; then
    echo -e "${GREEN}✅ Certbot already installed${NC}"
else
    echo "📥 Installing Certbot..."
    apt-get install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✅ Certbot installed${NC}"
fi

# ============================================
# 3. Get Configuration from User
# ============================================

echo ""
echo "============================================"
echo "📝 3. Configuration"
echo "============================================"
echo ""

# Ask for domain
echo -e "${BLUE}Enter your domain name (e.g., sera.example.com):${NC}"
read -p "> " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Domain cannot be empty${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Domain: $DOMAIN${NC}"

# Ask for SSL
echo ""
echo -e "${BLUE}Do you want to install SSL certificate? (Let's Encrypt)${NC}"
echo "  This requires:"
echo "  - Domain pointing to this server's IP"
echo "  - Port 80 accessible from internet"
read -p "Install SSL? (y/N): " -n 1 -r INSTALL_SSL
echo
if [[ ! $INSTALL_SSL =~ ^[Yy]$ ]]; then
    INSTALL_SSL="no"
else
    INSTALL_SSL="yes"
    
    # Ask for email
    echo ""
    echo -e "${BLUE}Enter email for SSL certificate notifications:${NC}"
    read -p "> " SSL_EMAIL
    
    if [ -z "$SSL_EMAIL" ]; then
        echo -e "${RED}❌ Email required for SSL${NC}"
        exit 1
    fi
fi

# ============================================
# 4. Check Docker Services
# ============================================

echo ""
echo "🐳 4. Checking Docker services..."

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Check backend
if docker ps | grep -q "sera_backend"; then
    echo -e "${GREEN}✅ Backend container running${NC}"
    BACKEND_PORT=3009
else
    echo -e "${YELLOW}⚠️  Backend container not found${NC}"
    echo "Using default port: 3009"
    BACKEND_PORT=3009
fi

# Check frontend
if docker ps | grep -q "sera_frontend"; then
    echo -e "${GREEN}✅ Frontend container running${NC}"
    FRONTEND_PORT=5173
else
    echo -e "${YELLOW}⚠️  Frontend container not found${NC}"
    echo "Using default port: 5173"
    FRONTEND_PORT=5173
fi

# ============================================
# 5. Create Nginx Configuration
# ============================================

echo ""
echo "⚙️  5. Creating Nginx configuration..."

# Backup old config if exists
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
if [ -f "$NGINX_CONF" ]; then
    echo "Backing up old config..."
    mv "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Create new config (HTTP only, SSL will be added by certbot)
cat > "$NGINX_CONF" << EOF
# Sera Otomasyon - Nginx Configuration
# Generated: $(date)
# Domain: $DOMAIN

# Redirect www to non-www
server {
    listen 80;
    server_name www.$DOMAIN;
    return 301 http://$DOMAIN\$request_uri;
}

# Main server block
server {
    listen 80;
    server_name $DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logs
    access_log /var/log/nginx/${DOMAIN}_access.log;
    error_log /var/log/nginx/${DOMAIN}_error.log;

    # Client upload size
    client_max_body_size 10M;

    # API Backend (Docker)
    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # WebSocket support (for future use)
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Frontend (Docker - Vite)
    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support (for HMR)
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
EOF

echo -e "${GREEN}✅ Nginx config created: $NGINX_CONF${NC}"

# ============================================
# 6. Enable Site
# ============================================

echo ""
echo "🔗 6. Enabling site..."

# Create symlink
NGINX_ENABLED="/etc/nginx/sites-enabled/$DOMAIN"
if [ -L "$NGINX_ENABLED" ]; then
    rm "$NGINX_ENABLED"
fi

ln -s "$NGINX_CONF" "$NGINX_ENABLED"
echo -e "${GREEN}✅ Site enabled${NC}"

# Remove default if exists
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    echo "Removing default site..."
    rm /etc/nginx/sites-enabled/default
fi

# ============================================
# 7. Test Nginx Configuration
# ============================================

echo ""
echo "🧪 7. Testing Nginx configuration..."

if nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✅ Nginx configuration valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration error${NC}"
    nginx -t
    exit 1
fi

# ============================================
# 8. Restart Nginx
# ============================================

echo ""
echo "♻️  8. Restarting Nginx..."

systemctl restart nginx

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx restarted successfully${NC}"
else
    echo -e "${RED}❌ Nginx failed to start${NC}"
    systemctl status nginx
    exit 1
fi

# ============================================
# 9. Install SSL (Optional)
# ============================================

if [ "$INSTALL_SSL" == "yes" ]; then
    echo ""
    echo "🔒 9. Installing SSL certificate..."
    echo ""
    
    # Check if domain resolves to this server
    echo "Checking DNS..."
    DOMAIN_IP=$(dig +short $DOMAIN | tail -1)
    SERVER_IP=$(curl -s ifconfig.me)
    
    if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
        echo -e "${YELLOW}⚠️  WARNING: Domain IP ($DOMAIN_IP) != Server IP ($SERVER_IP)${NC}"
        echo "SSL installation may fail if domain doesn't point to this server"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Skipping SSL installation"
            INSTALL_SSL="skipped"
        fi
    fi
    
    if [ "$INSTALL_SSL" == "yes" ]; then
        # Run certbot
        certbot --nginx -d $DOMAIN -d www.$DOMAIN \
            --non-interactive \
            --agree-tos \
            --email $SSL_EMAIL \
            --redirect
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ SSL certificate installed${NC}"
            echo "Certificate auto-renewal configured"
        else
            echo -e "${RED}❌ SSL installation failed${NC}"
            echo "You can try manually later: sudo certbot --nginx -d $DOMAIN"
        fi
    fi
else
    echo ""
    echo "⚠️  9. Skipping SSL installation"
fi

# ============================================
# 10. Configure Firewall (UFW)
# ============================================

echo ""
echo "🔥 10. Configuring firewall..."

if command -v ufw &> /dev/null; then
    # Allow Nginx
    ufw allow 'Nginx Full' 2>/dev/null || ufw allow 80/tcp && ufw allow 443/tcp
    
    # Disable direct access to Docker ports (optional)
    echo "Do you want to block direct access to Docker ports (3009, 5173)?"
    echo "This forces all traffic through Nginx"
    read -p "Block direct ports? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ufw deny $BACKEND_PORT/tcp
        ufw deny $FRONTEND_PORT/tcp
        echo -e "${GREEN}✅ Direct Docker access blocked${NC}"
    fi
    
    # Show status
    ufw status numbered
else
    echo -e "${YELLOW}⚠️  UFW not installed, skipping firewall${NC}"
fi

# ============================================
# Final Summary
# ============================================

echo ""
echo "============================================"
echo -e "${GREEN}✅ Nginx Setup Complete!${NC}"
echo "============================================"
echo ""
echo "📋 Configuration Summary:"
echo "   - Domain: $DOMAIN"
echo "   - Backend: http://localhost:$BACKEND_PORT → /api"
echo "   - Frontend: http://localhost:$FRONTEND_PORT → /"
if [ "$INSTALL_SSL" == "yes" ]; then
    echo "   - SSL: ✅ Enabled (HTTPS)"
else
    echo "   - SSL: ❌ Not installed"
fi
echo ""
echo "🌐 Access your site:"
if [ "$INSTALL_SSL" == "yes" ]; then
    echo "   https://$DOMAIN"
else
    echo "   http://$DOMAIN"
fi
echo ""
echo "📝 Nginx files:"
echo "   - Config: $NGINX_CONF"
echo "   - Logs: /var/log/nginx/${DOMAIN}_*.log"
echo ""
echo "🔧 Useful commands:"
echo "   - Test config:  sudo nginx -t"
echo "   - Reload:       sudo systemctl reload nginx"
echo "   - Restart:      sudo systemctl restart nginx"
echo "   - View logs:    sudo tail -f /var/log/nginx/${DOMAIN}_access.log"
if [ "$INSTALL_SSL" == "yes" ]; then
    echo "   - Renew SSL:    sudo certbot renew --dry-run"
fi
echo ""
echo -e "${GREEN}🌱 Your site is now live!${NC}"
echo ""
