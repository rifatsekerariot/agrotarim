FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

# ✅ FIX: Build for production
RUN npm run build

# ✅ FIX: Verify build completed successfully
RUN test -d dist || (echo "❌ Build failed: dist/ not found" && exit 1)
RUN test -f dist/index.html || (echo "❌ Build failed: index.html not found" && exit 1)
RUN echo "✅ Build verification passed"

# Expose Vite preview port
EXPOSE 5173

# ✅ Use built files with preview server
CMD ["npm", "run", "preview", "--", "--host", "--port", "5173"]
