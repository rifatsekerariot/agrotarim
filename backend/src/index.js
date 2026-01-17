const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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
const authRoutes = require('./routes/auth.routes');
const mgmRoutes = require('./routes/mgm.routes');
const telemetryRoutes = require('./routes/telemetry.routes');
const expertRoutes = require('./routes/expert.routes');
const deviceRoutes = require('./routes/device.routes');
const loraRoutes = require('./routes/lora.routes');
const deviceModelRoutes = require('./routes/device-models.routes');
const userRoutes = require('./routes/user.routes');
const smsRoutes = require('./routes/sms.routes');
const automationRoutes = require('./routes/automation.routes');

// Prefix API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/mgm', mgmRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/lora', loraRoutes);
app.use('/api/lora', loraRoutes);
app.use('/api/device-models', deviceModelRoutes);
app.use('/api/settings', require('./routes/settings.routes'));

app.get('/', (req, res) => {
    res.json({ message: 'AgroMeta API is running', version: '1.0.0' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
