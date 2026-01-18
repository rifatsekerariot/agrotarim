const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

/**
 * LoRaCommandService - Sends downlink commands to LoRa devices via ChirpStack
 */
class LoRaCommandService {
    /**
     * Send downlink command to a LoRa device
     * @param {number} deviceId - Device ID from database
     * @param {string} hexData - Hex payload (e.g., "01FF3A")
     * @param {number} port - LoRaWAN FPort (default 1)
     * @param {string} command - Friendly command name
     * @param {string} triggeredBy - "RULE", "MANUAL", "SCHEDULE"
     * @param {number} ruleId - Optional rule ID if triggered by automation
     */
    async sendDownlink(deviceId, hexData, port = 1, command = 'Custom Command', triggeredBy = 'MANUAL', ruleId = null) {
        try {
            // Validate hex data
            if (!hexData || !/^[0-9A-Fa-f]+$/.test(hexData)) {
                throw new Error('Invalid HEX data format');
            }

            // Get device info with LoRa server details
            const device = await prisma.device.findUnique({
                where: { id: deviceId },
                include: { loraServer: true }
            });

            if (!device) {
                throw new Error(`Device with ID ${deviceId} not found`);
            }

            if (!device.devEui) {
                throw new Error(`Device ${device.name} has no DevEUI configured`);
            }

            if (!device.loraServer) {
                throw new Error(`Device ${device.name} has no LoRa server configured`);
            }

            // Create log entry
            const log = await prisma.downlinkLog.create({
                data: {
                    deviceId,
                    command,
                    hexData,
                    port,
                    status: 'pending',
                    triggeredBy,
                    ruleId
                }
            });

            console.log(`[LoRaCommand] Sending to ${device.name} (${device.devEui}): ${hexData}`);

            // Send to ChirpStack
            const result = await this.sendToChirpStack(
                device.loraServer,
                device.devEui,
                hexData,
                port
            );

            // Update log status
            await prisma.downlinkLog.update({
                where: { id: log.id },
                data: {
                    status: result.success ? 'sent' : 'failed',
                    sentAt: result.success ? new Date() : null,
                    errorMessage: result.error || null
                }
            });

            if (result.success) {
                console.log(`[LoRaCommand] ✅ Successfully sent to ${device.name}`);
                return { ...result, logId: log.id };
            } else {
                console.error(`[LoRaCommand] ❌ Failed to send to ${device.name}:`, result.error);
                return { ...result, logId: log.id };
            }

        } catch (error) {
            console.error('[LoRaCommand] Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send downlink to ChirpStack API
     * @private
     */
    async sendToChirpStack(loraServer, devEui, hexData, port) {
        try {
            const url = `http://${loraServer.host}:${loraServer.port}/api/devices/${devEui}/queue`;

            // Convert HEX to Base64 (ChirpStack expects base64)
            const base64Data = Buffer.from(hexData, 'hex').toString('base64');

            const payload = {
                queueItem: {
                    devEUI: devEui,
                    fPort: port,
                    data: base64Data,
                    confirmed: true // Request confirmation from device
                }
            };

            console.log(`[ChirpStack] POST ${url}`, payload);

            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Grpc-Metadata-Authorization': `Bearer ${loraServer.apiKey}`
                },
                timeout: 10000 // 10 second timeout
            });

            return { success: true, data: response.data };

        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            console.error('[ChirpStack] Downlink error:', errorMsg);
            return { success: false, error: errorMsg };
        }
    }

    /**
     * Get command templates for a device
     * In the future, these can be stored in DeviceModel
     */
    getCommandTemplates(deviceModelId) {
        // Generic command templates
        return [
            {
                name: 'Vana Aç',
                hex: '01FF01',
                description: 'Elektrovalf açar (Port 1, Command 0x01)',
                port: 1
            },
            {
                name: 'Vana Kapat',
                hex: '01FF00',
                description: 'Elektrovalf kapatır (Port 1, Command 0x00)',
                port: 1
            },
            {
                name: 'LED Aç',
                hex: '02FF01',
                description: 'LED ışığı yakar',
                port: 1
            },
            {
                name: 'LED Kapat',
                hex: '02FF00',
                description: 'LED ışığı söndürür',
                port: 1
            },
            {
                name: 'Reset Device',
                hex: 'FFFE00',
                description: 'Cihazı resetler',
                port: 1
            }
        ];
    }

    /**
     * Get downlink logs for a device
     */
    async getDeviceLogs(deviceId, limit = 50) {
        try {
            const logs = await prisma.downlinkLog.findMany({
                where: { deviceId: parseInt(deviceId) },
                orderBy: { createdAt: 'desc' },
                take: limit
            });
            return logs;
        } catch (error) {
            console.error('[LoRaCommand] Error fetching logs:', error);
            return [];
        }
    }
}

module.exports = new LoRaCommandService();
