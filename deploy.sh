#!/bin/bash
# ============================================
# AgroMeta IoT Platform - Deploy Script
# ============================================
# Kullanım: ./deploy.sh
# ============================================

set -e  # Hata durumunda dur

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  AgroMeta IoT Platform - Deploy Script    ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# 1. Docker Durdur
echo -e "${YELLOW}[1/3] Docker container'lar durduruluyor...${NC}"
sudo docker compose down

# 2. Docker Build ve Deploy
echo -e "${YELLOW}[2/3] Docker build ve deploy...${NC}"
sudo docker compose up -d --build

# 3. Prisma Migration
echo -e "${YELLOW}[3/3] Prisma migration çalıştırılıyor...${NC}"
sleep 5  # Container'ın başlamasını bekle
sudo docker compose exec -T backend npx prisma migrate deploy 2>/dev/null || echo -e "${YELLOW}Migration gerekli değil veya zaten uygulandı${NC}"

# 4. Varsayılan modelleri yükle
echo -e "${YELLOW}[+] Varsayılan cihaz modelleri kontrol ediliyor...${NC}"
curl -s -X POST http://localhost:3000/api/device-models/seed > /dev/null 2>&1 || true

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✅ Deploy Tamamlandı!                     ${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Frontend: ${BLUE}http://localhost:3008${NC}"
echo -e "Backend:  ${BLUE}http://localhost:3009${NC}"
echo ""
echo -e "Logları görmek için: ${YELLOW}sudo docker compose logs -f${NC}"
