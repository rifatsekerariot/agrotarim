#!/bin/bash

# ============================================
# 🔐 Secure JWT_SECRET Generator & .env Updater
# Docker-based deployment için
# ============================================

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
ENV_FILE="$BACKEND_DIR/.env"

echo "============================================"
echo "🔐 JWT Secret Configuration Tool"
echo "============================================"
echo ""

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Error: Backend directory not found at $BACKEND_DIR"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating new .env file from .env.example..."
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        cp "$BACKEND_DIR/.env.example" "$ENV_FILE"
        echo "✅ Created .env from .env.example"
    else
        echo "⚠️  .env.example not found, creating new .env file"
        touch "$ENV_FILE"
    fi
fi

# Check if JWT_SECRET already exists
if grep -q "^JWT_SECRET=" "$ENV_FILE" 2>/dev/null; then
    CURRENT_SECRET=$(grep "^JWT_SECRET=" "$ENV_FILE" | cut -d '=' -f 2)
    
    # Check if it's a placeholder or weak secret
    if [[ "$CURRENT_SECRET" == "your_super_secret_jwt_key_min_32_characters_long" ]] || \
       [[ "$CURRENT_SECRET" == "supersecretkey" ]] || \
       [[ ${#CURRENT_SECRET} -lt 32 ]]; then
        echo "⚠️  Weak or placeholder JWT_SECRET detected!"
        echo "   Current value: ${CURRENT_SECRET:0:10}..."
        echo ""
        read -p "   Replace with strong secret? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Aborted. Please set JWT_SECRET manually."
            exit 1
        fi
        # Remove old JWT_SECRET line
        sed -i '/^JWT_SECRET=/d' "$ENV_FILE"
    else
        echo "✅ Strong JWT_SECRET already exists"
        echo "   Length: ${#CURRENT_SECRET} characters"
        echo ""
        read -p "   Generate new secret? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "✅ Keeping existing JWT_SECRET"
            exit 0
        fi
        # Backup current secret
        echo "🔄 Backing up current secret..."
        echo "JWT_SECRET_BACKUP_$(date +%Y%m%d_%H%M%S)=$CURRENT_SECRET" >> "$BACKEND_DIR/.env.backup"
        # Remove old JWT_SECRET line
        sed -i '/^JWT_SECRET=/d' "$ENV_FILE"
    fi
fi

# Generate strong JWT secret using Node.js (64 bytes = 128 hex chars)
echo ""
echo "🔐 Generating strong JWT_SECRET (128 characters)..."

# Check if node is available (for Docker, we'll use container)
if command -v node &> /dev/null; then
    NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
elif command -v docker &> /dev/null; then
    echo "📦 Using Docker to generate secret..."
    NEW_SECRET=$(docker run --rm node:18-alpine node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
else
    echo "❌ Error: Neither node nor docker is available!"
    echo "   Please install Node.js or Docker to generate a secure secret."
    exit 1
fi

# Validate generated secret
if [ -z "$NEW_SECRET" ] || [ ${#NEW_SECRET} -lt 32 ]; then
    echo "❌ Error: Failed to generate valid secret"
    exit 1
fi

# Add JWT_SECRET to .env file
echo "" >> "$ENV_FILE"
echo "# Generated JWT Secret - $(date)" >> "$ENV_FILE"
echo "JWT_SECRET=$NEW_SECRET" >> "$ENV_FILE"

echo "✅ JWT_SECRET successfully added to .env"
echo "   Length: ${#NEW_SECRET} characters"
echo "   Location: $ENV_FILE"
echo ""

# Check if DATABASE_URL exists
if ! grep -q "^DATABASE_URL=" "$ENV_FILE" 2>/dev/null; then
    echo "⚠️  DATABASE_URL not found in .env"
    echo "   Adding default PostgreSQL connection string..."
    echo "" >> "$ENV_FILE"
    echo "# Database Connection" >> "$ENV_FILE"
    echo 'DATABASE_URL="postgresql://agro_user:agro_password@postgres:5432/agrometa_db?schema=public"' >> "$ENV_FILE"
    echo "✅ Added DATABASE_URL (please verify the credentials)"
fi

echo "============================================"
echo "✅ Configuration Complete!"
echo "============================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Review your .env file:"
echo "   cat $ENV_FILE"
echo ""
echo "2. If using Docker, rebuild and restart:"
echo "   docker compose down"
echo "   docker compose up -d --build"
echo ""
echo "3. Or restart backend container only:"
echo "   docker compose restart backend"
echo ""
echo "⚠️  IMPORTANT: Keep your .env file secure!"
echo "   - Add .env to .gitignore"
echo "   - Never commit .env to version control"
echo "   - Backup .env securely"
echo ""
