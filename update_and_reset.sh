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

# 4. Database Reset & Push (Schema Sync)
echo "♻️  Syncing Database Schema (db push)..."
# db push updates the schema to match schema.prisma exactly. 
# --accept-data-loss allows it to delete/recreate tables if needed.
docker-compose exec -T backend npx prisma db push --accept-data-loss

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
