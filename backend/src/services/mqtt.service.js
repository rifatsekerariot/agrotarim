const mqtt = require('mqtt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const TelemetryService = require('./telemetry.service');
const RuleEngine = require('./automation/rule.engine');

// Import Decoders
const em300Decoder = require('../decoders/em300.decoder');
const em500Decoder = require('../decoders/em500.decoder');
const wsDecoder = require('../decoders/ws.decoder');
const ttnDecoder = require('../decoders/ttn.decoder'); // Placeholder if needed

class MqttService {
    constructor() {
        this.client = null;
        this.decoders = {
            'em300': em300Decoder,
            'em500': em500Decoder,
            'ws': wsDecoder,
            // Add aliases
            'th': em300Decoder,
            'sld': em300Decoder,
            'mcs': em300Decoder,
            'smtc': em500Decoder
        };
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
            this.subscribeToTopics();
        });

        this.client.on('error', (err) => {
            console.error('❌ MQTT Error:', err.message);
        });

        this.client.on('message', (topic, message) => {
            this.handleMessage(topic, message);
        });
    }

    subscribeToTopics() {
        // ChirpStack v4 standard topic: application/ID/device/EUI/event/up
        const chirpstackTopic = 'application/+/device/+/event/up';

        // Legacy topic (just in case)
        const legacyTopic = 'agrometa/+/telemetry';

        this.client.subscribe([chirpstackTopic, legacyTopic], (err) => {
            if (!err) {
                console.log(`📡 Subscribed to topics: ${chirpstackTopic}, ${legacyTopic}`);
            } else {
                console.error('Subscribe Error:', err);
            }
        });
    }

    async handleMessage(topic, message) {
        try {
            const payloadStr = message.toString();
            // console.log(`📨 Raw MQTT [${topic}]:`, payloadStr.substring(0, 100) + '...'); // logging first 100 chars

            let serialNumber = null;
            let finalSensors = {};

            // 1. Identify Source & Extract Serial/DevEUI
            if (topic.startsWith('application/')) {
                // Topic: application/APP_ID/device/DEV_EUI/event/up
                const parts = topic.split('/');
                if (parts.length >= 4) {
                    serialNumber = parts[3]; // DEV_EUI
                }
            } else if (topic.startsWith('agrometa/')) {
                // Topic: agrometa/SERIAL/telemetry
                serialNumber = topic.split('/')[1];
            }

            if (!serialNumber) {
                console.warn('⚠️ Could not extract Serial/DevEUI from topic:', topic);
                return;
            }

            // 2. Find Device in DB
            const device = await prisma.device.findUnique({
                where: { devEui: serialNumber }, // Try DevEUI first
                include: { deviceModel: true, loraServer: true }
            });

            // Fallback: try querying by old serialNumber field if DevEUI lookup failed
            const targetDevice = device || await prisma.device.findUnique({
                where: { serialNumber: serialNumber },
                include: { deviceModel: true, loraServer: true }
            });

            if (!targetDevice) {
                // console.warn(`⚠️ Unknown Device: ${serialNumber}`);
                return;
            }

            // 3. Parse Payload
            const rawJson = JSON.parse(payloadStr);

            // CASE A: ChirpStack v4 JSON (Pre-decoded object)
            if (rawJson.object && Object.keys(rawJson.object).length > 0) {
                finalSensors = rawJson.object;
                // console.log(`✅ Using ChirpStack decoded object for ${serialNumber}`);
            }
            // CASE B: Raw Base64 Data (Needs local decoding)
            else if (rawJson.data) {
                // console.log(`ℹ️ Decoding raw payload for ${serialNumber}...`);
                const buffer = Buffer.from(rawJson.data, 'base64');
                const fPort = rawJson.fPort || 85;

                // Determine Decoder
                let decoderFunc = null;

                // 1. Try Device Model info
                if (targetDevice.deviceModel) {
                    const modelKey = targetDevice.deviceModel.model.toLowerCase(); // e.g., "em300-th"

                    if (modelKey.includes('em300')) decoderFunc = this.decoders['em300'];
                    else if (modelKey.includes('em500')) decoderFunc = this.decoders['em500'];
                    else if (modelKey.includes('ws')) decoderFunc = this.decoders['ws'];
                }

                // 2. Fallback: Try decoding with all signatures (risky but better than nothing?)
                // Better approach: Default to EM300 if Milesight
                if (!decoderFunc) {
                    // console.warn(`⚠️ No specific decoder found for device ${targetDevice.name}. Trying generic...`);
                    // We could try to guess or just skip. For now, let's skip to avoid garbage data.
                }

                if (decoderFunc) {
                    finalSensors = decoderFunc.decode(buffer, fPort);
                }
            } else {
                // Maybe it's the legacy direct JSON format
                finalSensors = rawJson;
            }

            // 4. Ingest Data
            if (Object.keys(finalSensors).length > 0) {
                const result = await TelemetryService.ingestData(targetDevice.serialNumber, finalSensors);
                console.log(`💾 Saved ${result.processed} metrics for ${targetDevice.name} (${serialNumber})`);

                // Trigger Automation Rules
                await RuleEngine.evaluate(targetDevice.id, finalSensors);
            } else {
                // console.warn(`⚠️ No usable sensor data extracted for ${serialNumber}`);
            }

        } catch (error) {
            console.error('Error processing MQTT message:', error.message);
        }
    }
}

module.exports = new MqttService();
