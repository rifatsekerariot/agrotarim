const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * System Diagnostic Endpoint
 * Returns health status of entire data pipeline
 */
router.get('/status', async (req, res) => {
    try {
        // Database Counts
        const farmCount = await prisma.farm.count();
        const deviceCount = await prisma.device.count();
        const sensorCount = await prisma.sensor.count();
        const telemetryCount = await prisma.telemetry.count();
        const loraServerCount = await prisma.loRaServer.count();

        // Latest Telemetry
        const latestTelemetry = await prisma.telemetry.findFirst({
            orderBy: { timestamp: 'desc' },
            include: { sensor: { include: { device: true } } }
        });

        // LoRa Servers
        const loraServers = await prisma.loRaServer.findMany({
            select: { id: true, name: true, isActive: true, mqttEnabled: true, mqttHost: true }
        });

        // Devices with sensor counts
        const devices = await prisma.device.findMany({
            select: {
                id: true,
                name: true,
                serialNumber: true,
                devEui: true,
                status: true,
                lastSeen: true,
                _count: { select: { sensors: true } }
            }
        });

        // ChirpStack Service Status
        const chirpStackService = require('../services/chirpstack.service');
        const mqttStatus = chirpStackService.getStatus();

        res.json({
            timestamp: new Date().toISOString(),
            database: {
                farms: farmCount,
                devices: deviceCount,
                sensors: sensorCount,
                telemetry: telemetryCount,
                loraServers: loraServerCount
            },
            latestData: latestTelemetry ? {
                value: latestTelemetry.value,
                sensor: latestTelemetry.sensor.code,
                device: latestTelemetry.sensor.device.name,
                timestamp: latestTelemetry.timestamp
            } : null,
            loraServers,
            devices,
            mqtt: {
                connectedServers: Object.keys(mqttStatus).length,
                status: mqttStatus
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

module.exports = router;
