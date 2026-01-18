FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

# ✅ FIX 6: Build for production
RUN npm run build

# Expose Vite preview port
EXPOSE 5173

# ✅ FIX 6: Use preview for production
CMD ["npm", "run", "preview", "--", "--host", "--port", "5173"]
