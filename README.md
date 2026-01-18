# 🌱 Sera Otomasyon & IoT Platformu

**Production-ready IoT platform** for greenhouse automation with LoRaWAN support, real-time monitoring, and intelligent automation rules.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/Node-18.x-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

---

## 🚀 Features

### Core Functionality
- ✅ **Real-time Telemetry** - IoT device data collection and visualization
- ✅ **LoRaWAN Integration** - ChirpStack v4 support with manual downlink control
- ✅ **Smart Automation** - IF-THEN-ELSE rules with multiple actions
- ✅ **Multi-Action Support** - Send SMS, Email, and LoRa commands simultaneously
- ✅ **Custom Dashboards** - Drag-and-drop widget configuration
- ✅ **Alarm System** - Auto-resolve, repeat notifications, cooldown management
- ✅ **Device Management** - Multi-farm, multi-device architecture

### Security (Production-Ready)
- ✅ **Rate Limiting** - Brute force protection (5 attempts/15min)
- ✅ **IoT Input Validation** - Range checks, type validation, poisoning prevention
- ✅ **API Authentication** - JWT tokens + device API keys
- ✅ **Ownership Validation** - Farm and device access control
- ✅ **Error Handling** - Production-safe error messages
- ✅ **HTTPS/TLS** - Secure communication
- ✅ **MQTT TLS** - Encrypted IoT data transmission

---

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **PostgreSQL** 14.x or higher
- **Docker** & **Docker Compose** (for containerized deployment)
- **Git**

---

## ⚡ Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/sera-otomasyon.git
cd sera-otomasyon
```

### 2. Run Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Install all dependencies (backend + frontend)
- Generate secure JWT_SECRET
- Create `.env` files
- Run database migrations
- Build frontend

### 3. Start Application

**Development:**
```bash
# Backend
cd backend && npm start

# Frontend (new terminal)
cd frontend && npm run dev
```

**Production (Docker):**
```bash
docker compose up -d --build
```

---

## 🔧 Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Edit JWT_SECRET, DATABASE_URL, etc.

# Run migrations
npx prisma migrate deploy

# Start server
npm start
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (if needed)
cp .env.example .env

# Development
npm run dev

# Production build
npm run build
npm run preview
```

</details>

---

## 🐳 Docker Deployment

### Quick Deploy

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Services

- **Backend API**: `http://localhost:3009`
- **Frontend**: `http://localhost:5173` (dev) or `http://localhost:3008` (prod)
- **PostgreSQL**: `localhost:5432`

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Security (REQUIRED)
JWT_SECRET=<generate-with-setup-script>
NODE_ENV=production

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sera_db"

# Server
PORT=3009

# SMTP (Email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# SMS (Optional)
SMS_API_KEY=your_sms_api_key
SMS_API_URL=https://api.sms-provider.com/send
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Or use the setup script:
```bash
./setup-env.sh
```

---

## 📚 API Documentation

### Authentication

```bash
# Login
POST /api/auth/login
{
  "username": "admin",
  "password": "your_password"
}

# Response
{
  "token": "eyJhbGc...",
  "user": { "id": 1, "username": "admin" }
}
```

### IoT Telemetry

```bash
# Send device data
POST /api/telemetry
Headers:
  X-Device-Key: <device_api_key>
Body:
{
  "serial": "DEVICE123",
  "readings": {
    "temperature": 25.5,
    "humidity": 60.0
  }
}
```

### LoRa Downlink

```bash
# Send command to device
POST /api/lora/devices/{id}/downlink
Headers:
  Authorization: Bearer <token>
Body:
{
  "hexData": "01FF01",
  "command": "Open Valve",
  "port": 1
}
```

[Full API Documentation](./docs/API.md)

---

## 🏗️ Architecture

```
sera-otomasyon/
├── backend/                 # Node.js + Express API
│   ├── prisma/             # Database schema & migrations
│   ├── src/
│   │   ├── auth/           # Authentication & JWT
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, validation, rate limiting
│   │   ├── routes/         # API endpoints
│   │   └── services/       # Business logic
│   │       ├── automation/ # Rule engine & checker
│   │       ├── chirpstack.service.js
│   │       └── lora-command.service.js
│   └── index.js            # Entry point
│
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Application pages
│   │   ├── context/        # Auth context
│   │   └── App.jsx
│   └── vite.config.js
│
├── docker-compose.yml      # Container orchestration
├── setup.sh                # Quick setup script
└── README.md
```

---

## 🔒 Security Features

### Implemented
- ✅ JWT authentication with secure secret
- ✅ Rate limiting (login: 5/15min)
- ✅ Input validation (IoT data ranges)
- ✅ Device API key authentication
- ✅ Farm/Device ownership validation
- ✅ Production error handling (no leaks)
- ✅ MQTT TLS enforcement warnings
- ✅ Helmet.js security headers
- ✅ CORS policy
- ✅ bcrypt password hashing

### Best Practices
- Use HTTPS in production (443 port)
- Rotate device API keys every 90 days
- Regular database backups
- Monitor API rate limits
- Keep dependencies updated

---

## 📖 User Guide

### First Time Setup

1. **Access Application**: `http://your-server:3008`
2. **Initial Setup Page**: Create admin user
3. **Add Farm**: Configure your greenhouse
4. **Add Devices**: Register IoT sensors
5. **Create Rules**: Set up automation (IF temperature > 30°C THEN send SMS)

### Creating Automation Rules

```
IF [Sensor] [Condition] [Value]
THEN:
  - Action 1: Send SMS to +905551234567
  - Action 2: Send Email to admin@example.com
  - Action 3: LoRa Command to Device (Vana Aç)
ELSE (Normal State):
  - Action: LoRa Command (Vana Kapat)
```

**Features:**
- Multiple actions per rule
- Auto-resolve alarms
- Repeat notifications (interval + max duration)
- Cooldown periods

---

## 🛠️ Development

### Running Tests

```bash
cd backend
npm test
```

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only!)
npx prisma migrate reset
```

### Adding New Device Types

1. Create device model in UI
2. Define sensor template (JSON)
3. Configure LoRa server connection
4. Test telemetry ingestion

---

## 🐛 Troubleshooting

<details>
<summary>Common Issues</summary>

### "JWT_SECRET not defined"

**Solution:**
```bash
./setup-env.sh
# Or manually add to backend/.env:
JWT_SECRET=<64-char-random-hex>
```

### "Database connection refused"

**Solution:**
- Check PostgreSQL is running: `sudo service postgresql status`
- Verify DATABASE_URL in `.env`
- Check firewall rules

### "Device not found" (Telemetry)

**Solution:**
- Verify device serial number matches database
- Check device API key (X-Device-Key header)
- Ensure device is active

### "Rate limit exceeded"

**Solution:**
- Wait 15 minutes
- Contact admin to reset limit
- Check if brute force attack

</details>

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 👥 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/sera-otomasyon/issues)
- **Email**: support@example.com

---

## 🙏 Acknowledgments

- ChirpStack LoRaWAN Network Server
- Prisma ORM
- React + Vite
- Bootstrap

---

**Made with ❤️ for Smart Agriculture**
