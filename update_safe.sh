#!/bin/bash
echo "🚀 AgroMeta: Hızlı Güncelleme (Veri Kaybı YOK)"
echo "Sadece kod değişikliklerini uygular. Veritabanına dokunmaz."

# 1. Guncel Kodu Cek
echo "⬇️  Kodlar çekiliyor..."
git pull

# 2. Containerları Guncelle (Rebuild)
echo "🔨 Uygulama güncelleniyor..."
sudo docker compose up -d --build

# 3. Prisma Client Guncelle (Garanti olsun) 
echo "🔄 Sistem tazeleniyor..."
sudo docker compose exec -T backend npx prisma generate

echo "✅ GÜNCELLEME TAMAMLANDI! (Verileriniz korundu)"
