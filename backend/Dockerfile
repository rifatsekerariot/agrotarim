FROM node:18-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
# Using npm install instead of npm ci for flexibility with lock file
RUN npm install --omit=dev --production

# Copy application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# ✅ FIX 1: Correct port
EXPOSE 3009

# ✅ FIX 3: Use production start
CMD ["npm", "start"]
