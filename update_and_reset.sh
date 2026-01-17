#!/bin/bash
echo "🚀 AgroMeta: Automated Fresh Setup & Update"
echo "⚠️  WARNING: This will DELETE all existing database data!"

# 1. Update Codebase
echo "⬇️  Pulling latest code..."
git pull

# 2. Rebuild Containers
echo "🔨 Rebuilding containers..."
docker-compose down
docker-compose up -d --build

# 3. Wait for DB
echo "⏳ Waiting for Database to be ready..."
sleep 10

# 4. Database Reset & Migrate
echo "♻️  Resetting Database and applying new Schema..."
# --force skips interactive confirmation for data loss
docker-compose exec -T backend npx prisma migrate reset --force

# 5. Apply Migrations (just in case)
docker-compose exec -T backend npx prisma migrate deploy

# 6. Seed Knowledge Base
echo "🌱 Seeding Crop Knowledge Base..."
docker-compose exec -T backend node scripts/seed_crops.js

# 7. Start Simulator (Optional - background)
echo "🤖 Starting Sensor Simulator..."
# Using nohup to keep it running or just let user start it manually. 
# For now, we'll start it in detached mode inside the container if possible, 
# but usually simulators are separate processes. 
# We will just print instructions.
echo "✅ Setup Complete!"
echo "To watch the simulator: docker-compose exec backend node scripts/simulator.js"
