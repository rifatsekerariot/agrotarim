const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3009; // ✅ FIX: Correct default port

// Fix: Handle BigInt serialization for Prisma (Telemetry IDs)
BigInt.prototype.toJSON = function () {
    return this.toString();
}

// Middleware
app.use(helmet());
app.use(cors({
    origin: ['https://www.adanateknotarim.org', 'https://adanateknotarim.org', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
const setupRoutes = require('./routes/setup.routes');
const authRoutes = require('./routes/auth.routes');
const telemetryRoutes = require('./routes/telemetry.routes');
const deviceRoutes = require('./routes/device.routes');
const loraRoutes = require('./routes/lora.routes');
const deviceModelRoutes = require('./routes/device-models.routes');
const userRoutes = require('./routes/user.routes');
const smsRoutes = require('./routes/sms.routes');
const automationRoutes = require('./routes/automation.routes');

// Prefix API routes
app.use('/api/setup', setupRoutes); // No auth required
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/lora', loraRoutes);
app.use('/api/device-models', deviceModelRoutes);
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// ✅ SECURITY FIX #6: Debug endpoint only in development
if (process.env.NODE_ENV !== 'production') {
    app.use('/api/debug', require('./routes/debug.routes'));
    console.log('[Server] Debug endpoint enabled (development mode)');
}

app.use('/api/weather', require('./routes/weather.routes')); // Weather API
app.use('/api/settings', require('./routes/settings.routes'));

app.get('/', (req, res) => {
    res.json({ message: 'AgroMeta API is running', version: '1.0.0' });
});

// ✅ SECURITY FIX #4: Error Handling - Prevent Information Leakage
app.use((err, req, res, next) => {
    // Log full error internally for debugging/monitoring
    console.error({
        timestamp: new Date().toISOString(),
        error: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    // Send generic error to client in production
    if (process.env.NODE_ENV === 'production') {
        res.status(err.status || 500).json({
            error: 'Internal server error'
        });
    } else {
        // Development: include details for debugging
        res.status(err.status || 500).json({
            error: 'Something went wrong!',
            details: err.message,
            stack: err.stack
        });
    }
});

// Initialize MQTT Service (Local broker)
// Initialize MQTT Service (Local broker - DISABLED in favor of ChirpStack Service)
// const mqttService = require('./services/mqtt.service');
// mqttService.connect();

// Initialize ChirpStack MQTT Service (LoRaWAN servers)
const chirpStackService = require('./services/chirpstack.service');
(async () => {
    try {
        await chirpStackService.initialize();
    } catch (err) {
        console.error('[Server] ChirpStack initialization failed, server continues:', err.message);
    }
})();
// console.log('[Server] ChirpStack service temporarily disabled');

// Initialize Rule Checker for Automation
const ruleChecker = require('./services/automation/rule.checker');

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // Start rule checker after server is ready
    ruleChecker.start();
});
