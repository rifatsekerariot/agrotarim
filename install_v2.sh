#!/bin/bash
echo "🚀 AgroMeta V2: Force Re-Install"
echo "This script guarantees the new database logic is applied."

# 1. Force Pull
echo "⬇️  Pulling..."
git fetch --all
git reset --hard origin/main

# 2. Rebuild
echo "🔨 Rebuilding..."
sudo docker compose down
sudo docker compose up -d --build

# 3. Wait
echo "⏳ Waiting for DB..."
sleep 15

# 4. Generate Client & Push DB (The Fix)
echo "♻️  Pushing Schema..."
sudo docker compose exec -T backend npx prisma generate
sudo docker compose exec -T backend npx prisma db push --accept-data-loss

# 5. Seed
console.log("🌱 Seeding Comprehensive Knowledge Base...");
sudo docker compose exec -T backend node scripts/seed_full_data.js

# 6. Auto-Start Simulator (Background)
echo "🤖 Starting Sensor Simulator (Background)..."
# -d runs in detached mode (background)
sudo docker compose exec -d backend node scripts/simulator.js

echo "✅ DONE! Dashboard should now show live data."
