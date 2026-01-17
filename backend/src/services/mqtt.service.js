const mqtt = require('mqtt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const TelemetryService = require('./telemetry.service');

class MqttService {
    constructor() {
        this.client = null;
    }

    connect() {
        const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://mosquitto:1883';
        console.log(`🔌 Connecting to MQTT Broker at ${brokerUrl}...`);

        this.client = mqtt.connect(brokerUrl, {
            clientId: 'agrometa_backend_' + Math.random().toString(16).substr(2, 8),
            reconnectPeriod: 5000
        });

        this.client.on('connect', () => {
            console.log('✅ MQTT Connected');
            this.subscribeToTelemetry();
        });

        this.client.on('error', (err) => {
            console.error('❌ MQTT Error:', err.message);
        });

        this.client.on('message', (topic, message) => {
            this.handleMessage(topic, message);
        });
    }

    subscribeToTelemetry() {
        // Subscribe to all device telemetry topics
        // Format: agrometa/{serialNumber}/telemetry
        const topic = 'agrometa/+/telemetry';
        this.client.subscribe(topic, (err) => {
            if (!err) {
                console.log(`📡 Subscribed to ${topic}`);
            } else {
                console.error('Subscribe Error:', err);
            }
        });
    }

    async handleMessage(topic, message) {
        try {
            const rawPayload = JSON.parse(message.toString());
            const parts = topic.split('/');
            const serialNumber = parts[1]; // agrometa/{SERIAL}/telemetry

            if (!serialNumber) return;

            // 1. Find Device (Cached or DB)
            // For now, DB lookup on every message (can be optimized later)
            const device = await prisma.device.findUnique({
                where: { serialNumber }
            });

            if (!device) {
                console.warn(`⚠️ Unknown Device: ${serialNumber}`);
                return;
            }

            console.log(`📨 MQTT from ${device.name} (${serialNumber}):`, rawPayload);

            // 2. Apply Custom Mappings
            // Mappings format: { "external_key": "internal_code" }
            let processedPayload = {};
            const mappings = device.telemetryMappings || {};

            if (Object.keys(mappings).length > 0) {
                Object.keys(rawPayload).forEach(key => {
                    const mappedKey = mappings[key] || key;
                    processedPayload[mappedKey] = rawPayload[key];
                });
            } else {
                processedPayload = rawPayload;
            }

            // 3. Convert to Ingest Format
            const sensors = Object.entries(processedPayload).map(([key, value]) => ({
                code: key,
                value: Number(value)
            }));

            // 4. Ingest
            await TelemetryService.ingestData(serialNumber, sensors);

        } catch (error) {
            console.error('Error processing MQTT message:', error.message);
        }
    }
}

module.exports = new MqttService();
