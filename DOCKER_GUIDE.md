# 🐳 Docker Deployment Guide

## Quick Start

### Development

```bash
# 1. Clone repository
git clone <repo>
cd sera-otomasyon

# 2. Create .env file
cp backend/.env.example backend/.env
# Edit backend/.env - MUST set JWT_SECRET!

# 3. Start with Docker
docker compose up -d --build

# 4. Access application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3009
```

### First Time Setup

1. **Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output to backend/.env
```

2. **Edit backend/.env:**
```env
JWT_SECRET=<your_generated_secret_here>
DATABASE_URL="postgresql://sera_user:sera_password@postgres:5432/sera_db?schema=public"
NODE_ENV=production
PORT=3009
```

3. **Start Docker:**
```bash
docker compose up -d --build
```

4. **Check logs:**
```bash
docker compose logs -f
```

Expected output:
```
sera_postgres | database system is ready to accept connections
sera_backend  | ✅ Database connected!
sera_backend  | ✅ Migrations complete!
sera_backend  | Server is running on port 3009
sera_frontend | ready in 1000ms
```

---

## Configuration

### Environment Variables

**Required in `.env`:**
- `JWT_SECRET` - MUST be set (server won't start without it)
- `POSTGRES_USER` - Default: `sera_user`
- `POSTGRES_PASSWORD` - Default: `sera_password`
- `POSTGRES_DB` - Default: `sera_db`

**Optional:**
- `NODE_ENV` - Default: `production`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email notifications
- `SMS_API_KEY`, `SMS_API_URL` - SMS notifications

### Port Configuration

| Service | Internal | External | Purpose |
|---------|----------|----------|---------|
| Backend | 3009 | 3009 | API Server |
| Frontend | 5173 | 5173 | Web UI |
| PostgreSQL | 5432 | 5432 | Database |

---

## Docker Services

### Backend

**Image:** Node.js 18-slim  
**Build:** Production mode  
**Command:** `npm start`  
**Healthcheck:** Database connection  
**Startup:** 
1. Wait for PostgreSQL
2. Run Prisma migrations
3. Start Express server

### Frontend

**Image:** Node.js 18-alpine  
**Build:** `npm run build`  
**Command:** `npm run preview`  
**Mode:** Production preview

### PostgreSQL

**Image:** postgres:15-alpine  
**Volumes:** `postgres_data:/var/lib/postgresql/data`  
**Healthcheck:** `pg_isready`

---

## Commands

### Start Services

```bash
# Start all services
docker compose up -d

# Start with build
docker compose up -d --build

# Start specific service
docker compose up -d backend
```

### Stop Services

```bash
# Stop all
docker compose down

# Stop and remove volumes (⚠️ deletes database!)
docker compose down -v
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific
docker compose restart backend
```

### Database Operations

```bash
# Access PostgreSQL
docker compose exec postgres psql -U sera_user -d sera_db

# Run migrations
docker compose exec backend npx prisma migrate deploy

# Prisma Studio (database GUI)
docker compose exec backend npx prisma studio
# Access: http://localhost:5555
```

---

## Troubleshooting

### "JWT_SECRET is required"

**Error:** Backend container exits immediately

**Solution:**
```bash
# Generate secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to backend/.env
echo "JWT_SECRET=<generated_value>" >> backend/.env

# Restart
docker compose restart backend
```

### "Database not ready"

**Error:** Backend stuck on "Database not ready, retrying..."

**Solution:**
```bash
# Check PostgreSQL logs
docker compose logs postgres

# Check PostgreSQL status
docker compose ps

# Restart PostgreSQL
docker compose restart postgres
```

### "Port already in use"

**Error:** `Bind for 0.0.0.0:3009 failed: port is already allocated`

**Solution:**
```bash
# Find process using port
lsof -i :3009

# Stop process or stop Docker container
docker stop sera_backend
```

### "Migration failed"

**Error:** Prisma migration error

**Solution:**
```bash
# Reset database (⚠️ development only!)
docker compose down -v
docker compose up -d --build

# Or manually run migration
docker compose exec backend npx prisma migrate deploy
```

### Frontend 404 on refresh

**Issue:** Page refreshes result in 404

**Reason:** Vite preview doesn't handle SPA routing

**Solution:** Use Nginx in production (see advanced setup)

---

## Production Deployment

### 1. Prepare Environment

```bash
# Production .env
cp backend/.env.example backend/.env

# Set production values
JWT_SECRET=<strong_64_char_secret>
NODE_ENV=production
POSTGRES_PASSWORD=<strong_password>
```

### 2. Build and Start

```bash
docker compose -f docker-compose.yml up -d --build
```

### 3. Verify Health

```bash
# Check all services running
docker compose ps

# Check logs
docker compose logs -f
```

### 4. Setup Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/sera
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:3009;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Maintenance

### Backup Database

```bash
# Create backup
docker compose exec postgres pg_dump -U sera_user sera_db > backup_$(date +%Y%m%d).sql

# Restore backup
docker compose exec -T postgres psql -U sera_user -d sera_db < backup_20260118.sql
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose down
docker compose up -d --build
```

### Clean Up

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup
docker system prune -a --volumes
```

---

## Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Volumes | ✅ Enabled (hot reload) | ❌ Code in image |
| NODE_ENV | development | production |
| Frontend | `npm run dev` | `npm run preview` |
| Logs | Verbose | Minimal |
| Build | On startup | Pre-built |

---

**Last Updated:** 2026-01-18  
**Docker Version:** 3.8  
**Status:** ✅ Production Ready
