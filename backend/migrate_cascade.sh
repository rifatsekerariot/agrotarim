#!/bin/bash
# Quick migration script for AlertLog cascade fix

echo "🔄 Updating database schema for cascade delete..."

# Generate migration
npx prisma migrate dev --name add_alertlog_cascade --create-only

echo "✅ Migration created. Apply with: npx prisma migrate deploy"
