/**
 * ChirpStack MQTT Service
 * Connects to ChirpStack v4 MQTT brokers and handles uplink messages
 */
const mqtt = require('mqtt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { decodePayload } = require('../decoders');

class ChirpStackService {
    constructor() {
        this.clients = new Map(); // serverId -> mqttClient
        this.isInitialized = false;
    }

    /**
     * Initialize connections to all active LoRa servers
     */
    async initialize() {
        if (this.isInitialized) return;

        console.log('[ChirpStack] Initializing MQTT connections...');

        try {
            const servers = await prisma.loRaServer.findMany({
                where: { isActive: true, mqttEnabled: true }
            });

            for (const server of servers) {
                await this.connectToServer(server);
            }

            this.isInitialized = true;
            console.log(`[ChirpStack] Connected to ${this.clients.size} server(s)`);
        } catch (error) {
            console.error('[ChirpStack] Initialization error:', error);
        }
    }

    /**
     * Connect to a single ChirpStack MQTT broker
     */
    async connectToServer(server) {
        if (!server.mqttHost) {
            console.log(`[ChirpStack] Server ${server.name} has no MQTT host configured`);
            return;
        }

        const options = {
            clientId: `agrometa_${server.id}_${Date.now()}`,
            clean: true,
            reconnectPeriod: 5000,
        };

        // Add authentication if provided
        if (server.mqttUsername) {
            options.username = server.mqttUsername;
            options.password = server.mqttPassword || '';
        }

        try {
            const client = mqtt.connect(server.mqttHost, options);

            client.on('connect', () => {
                console.log(`[ChirpStack] Connected to ${server.name} (${server.mqttHost})`);

                // Subscribe to uplink topic pattern
                const topic = server.mqttTopic || 'application/+/device/+/event/up';
                client.subscribe(topic, (err) => {
                    if (err) {
                        console.error(`[ChirpStack] Subscribe error for ${server.name}:`, err);
                    } else {
                        console.log(`[ChirpStack] Subscribed to ${topic}`);
                    }
                });

                // Update lastSync in database
                prisma.loRaServer.update({
                    where: { id: server.id },
                    data: { lastSync: new Date() }
                }).catch(console.error);
            });

            client.on('message', (topic, message) => {
                this.handleMessage(server, topic, message);
            });

            client.on('error', (err) => {
                console.error(`[ChirpStack] Connection error for ${server.name}:`, err.message);
            });

            client.on('close', () => {
                console.log(`[ChirpStack] Disconnected from ${server.name}`);
            });

            this.clients.set(server.id, client);
        } catch (error) {
            console.error(`[ChirpStack] Failed to connect to ${server.name}:`, error);
        }
    }

    /**
     * Handle incoming MQTT message from ChirpStack
     */
    async handleMessage(server, topic, message) {
        try {
            const payload = JSON.parse(message.toString());

            // ChirpStack v4 message structure
            const normalizeId = (id) => id ? id.toString().replace(/[:\-\s]/g, '').toLowerCase() : '';

            const devEui = normalizeId(payload.deviceInfo?.devEui || payload.devEui);
            const deviceName = payload.deviceInfo?.deviceName || 'Unknown';
            const data = payload.data; // Base64 encoded payload
            const fPort = payload.fPort || 1;

            console.log(`[ChirpStack] Received from ${deviceName} (${devEui})`);

            if (!devEui || !data) {
                console.log('[ChirpStack] Missing devEui or data, skipping');
                return;
            }

            // Robust Device Lookup:
            // Fetch ID fields for all devices to perform normalized comparison in memory
            // This handles cases where DB has "AA:BB:CC" and payload has "aabbcc"
            const allDevices = await prisma.device.findMany({
                select: { id: true, devEui: true, serialNumber: true }
            });

            const matchedRef = allDevices.find(d =>
                normalizeId(d.devEui) === devEui ||
                normalizeId(d.serialNumber) === devEui
            );

            if (!matchedRef) {
                console.log(`[ChirpStack] Device ${devEui} not registered (checked ${allDevices.length} candidates), skipping`);
                return;
            }

            // Fetch full device details
            const device = await prisma.device.findUnique({
                where: { id: matchedRef.id },
                include: { deviceModel: true, sensors: true }
            });

            if (!device) {
                console.log(`[ChirpStack] Device ${devEui} not registered, skipping`);
                return;
            }

            // Decode payload
            let decodedData = {};

            // CASE A: Pre-decoded object (from ChirpStack codec)
            if (payload.object && Object.keys(payload.object).length > 0) {
                decodedData = payload.object;
                console.log(`[ChirpStack] Using pre-decoded object from server`);
            }
            // CASE B: Raw Base64 data (needs local decoding)
            else if (data) {
                decodedData = await this.decodePayload(device, data, fPort);
            }

            if (!decodedData || Object.keys(decodedData).length === 0) {
                console.log('[ChirpStack] Decode returned empty data');
                return;
            }

            // Save telemetry for each decoded value
            await this.saveTelemetry(device, decodedData);

            // Update device status
            await prisma.device.update({
                where: { id: device.id },
                data: {
                    status: 'online',
                    lastSeen: new Date(),
                    batteryLevel: decodedData.battery || device.batteryLevel
                }
            });

            // Trigger Automation Rules
            const RuleEngine = require('./automation/rule.engine');
            await RuleEngine.evaluate(device.id, decodedData).catch(err => {
                console.error('[ChirpStack] RuleEngine evaluation failed:', err);
            });

        } catch (error) {
            console.error('[ChirpStack] Message handling error:', error);
        }
    }

    /**
     * Decode payload based on device model
     */
    async decodePayload(device, base64Data, fPort) {
        const buffer = Buffer.from(base64Data, 'base64');

        // Get decoder type from device model
        const decoderType = device.deviceModel?.decoderType || 'generic';
        const modelName = device.deviceModel?.model || '';

        // Try to decode using the appropriate decoder
        const decoded = decodePayload(decoderType, modelName, buffer, fPort);

        console.log(`[ChirpStack] Decoded (${decoderType}/${modelName}):`, decoded);
        return decoded;
    }

    /**
     * Save decoded telemetry to database
     */
    async saveTelemetry(device, decodedData) {
        const timestamp = new Date();

        for (const [key, value] of Object.entries(decodedData)) {
            if (key === 'battery') continue; // Handled separately

            // Find or create sensor
            let sensor = device.sensors.find(s => s.code === key);

            if (!sensor) {
                // Get sensor info from device model template
                const template = device.deviceModel?.sensorTemplate || [];
                const sensorDef = template.find(t => t.code === key);

                sensor = await prisma.sensor.create({
                    data: {
                        deviceId: device.id,
                        code: key,
                        name: sensorDef?.name || key,
                        unit: sensorDef?.unit || '',
                        type: sensorDef?.type || 'generic'
                    }
                });
            }

            // Save telemetry
            await prisma.telemetry.create({
                data: {
                    sensorId: sensor.id,
                    value: parseFloat(value) || 0,
                    timestamp
                }
            });
        }

        console.log(`[ChirpStack] Saved ${Object.keys(decodedData).length} values for ${device.name}`);
    }

    /**
     * Reconnect to a specific server (called when server config changes)
     */
    async reconnectServer(serverId) {
        // Disconnect existing client
        if (this.clients.has(serverId)) {
            this.clients.get(serverId).end();
            this.clients.delete(serverId);
        }

        // Get updated server config
        const server = await prisma.loRaServer.findUnique({
            where: { id: serverId }
        });

        if (server && server.isActive && server.mqttEnabled) {
            await this.connectToServer(server);
        }
    }

    /**
     * Get connection status for all servers
     */
    getStatus() {
        const status = {};
        for (const [serverId, client] of this.clients) {
            status[serverId] = {
                connected: client.connected,
                reconnecting: client.reconnecting
            };
        }
        return status;
    }
}

// Singleton instance
const chirpStackService = new ChirpStackService();

module.exports = chirpStackService;
