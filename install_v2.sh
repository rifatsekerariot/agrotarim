#!/bin/bash
echo "🚀 AgroMeta V2: Force Re-Install"
echo "This script guarantees the new database logic is applied."

# 1. Force Pull
echo "⬇️  Pulling..."
git fetch --all
git reset --hard origin/main

# 2. Rebuild
echo "🔨 Rebuilding..."
docker-compose down
docker-compose up -d --build

# 3. Wait
echo "⏳ Waiting for DB..."
sleep 15

# 4. Generate Client & Push DB (The Fix)
echo "♻️  Pushing Schema..."
docker-compose exec -T backend npx prisma generate
docker-compose exec -T backend npx prisma db push --accept-data-loss

# 5. Seed
echo "🌱 Seeding..."
docker-compose exec -T backend node scripts/seed_crops.js

echo "✅ DONE! Check dashboard now."
