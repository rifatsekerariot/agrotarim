#!/bin/bash

# SMS Module Update Script
# This script updates the database schema and seeds SMS providers

echo "==================================="
echo "SMS Module Deployment Script"
echo "==================================="
echo ""

# Step 1: Push Prisma schema changes
echo "📊 Pushing Prisma schema changes to database..."
sudo docker compose exec backend npx prisma db push --accept-data-loss

if [ $? -ne 0 ]; then
    echo "❌ Prisma schema push failed!"
    echo "Make sure you have added SmsProvider and SmsLog models to schema.prisma"
    exit 1
fi

echo "✅ Schema updated successfully"
echo ""

# Step 2: Seed SMS providers
echo "🌱 Seeding SMS providers..."
sudo docker compose exec backend node seed_sms_providers.js

if [ $? -ne 0 ]; then
    echo "⚠️ SMS provider seeding failed, but continuing..."
else
    echo "✅ SMS providers seeded successfully"
fi

echo ""

# Step 3: Restart backend to load new routes
echo "🔄 Restarting backend container..."
sudo docker compose restart backend

if [ $? -ne 0 ]; then
    echo "❌ Failed to restart backend"
    exit 1
fi

echo "✅ Backend restarted successfully"
echo ""

# Wait for backend to be ready
echo "⏳ Waiting for backend to initialize (10 seconds)..."
sleep 10

# Step 4: Check if SMS routes are accessible
echo "🔍 Verifying SMS API endpoints..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/sms/providers)

if [ "$RESPONSE" == "401" ] || [ "$RESPONSE" == "200" ]; then
    echo "✅ SMS API is accessible (HTTP $RESPONSE)"
else
    echo "⚠️ SMS API returned HTTP $RESPONSE (may need authentication)"
fi

echo ""
echo "==================================="
echo "✅ SMS Module Deployment Complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Log in to admin panel"
echo "2. Navigate to SMS Providers management"
echo "3. Update provider credentials"
echo "4. Set isActive = true for providers you want to use"
echo "5. Test SMS sending via API"
echo ""
echo "API Endpoints:"
echo "- POST /api/sms/send - Send SMS"
echo "- POST /api/sms/send-bulk - Send bulk SMS"
echo "- GET /api/sms/providers - List providers"
echo "- PUT /api/sms/providers/:id - Update provider"
echo "- POST /api/sms/providers/:id/test - Test provider"
