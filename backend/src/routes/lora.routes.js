const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ========== LoRa Server Management ==========

// GET /api/lora/servers - List all LoRa servers
router.get('/servers', async (req, res) => {
    try {
        const servers = await prisma.loRaServer.findMany({
            include: {
                _count: { select: { devices: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(servers);
    } catch (error) {
        console.error('Error fetching LoRa servers:', error);
        res.status(500).json({ error: 'Sunucular yüklenemedi' });
    }
});

// GET /api/lora/servers/:id - Get single server details
router.get('/servers/:id', async (req, res) => {
    try {
        const server = await prisma.loRaServer.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                devices: {
                    select: { id: true, name: true, devEui: true, status: true }
                }
            }
        });
        if (!server) return res.status(404).json({ error: 'Sunucu bulunamadı' });
        res.json(server);
    } catch (error) {
        console.error('Error fetching LoRa server:', error);
        res.status(500).json({ error: 'Sunucu bilgisi alınamadı' });
    }
});

// POST /api/lora/servers - Create new LoRa server
router.post('/servers', async (req, res) => {
    try {
        const {
            name, serverType, host, port,
            apiKey, tenantId,
            mqttEnabled, mqttHost, mqttUsername, mqttPassword, mqttTopic,
            httpEnabled, httpSecret,
            isActive
        } = req.body;

        const server = await prisma.loRaServer.create({
            data: {
                name,
                serverType: serverType || 'chirpstack_v4',
                host,
                port: port || 8080,
                apiKey,
                tenantId,
                mqttEnabled: mqttEnabled ?? true,
                mqttHost,
                mqttUsername,
                mqttPassword,
                mqttTopic: mqttTopic || 'application/+/device/+/event/up',
                httpEnabled: httpEnabled ?? false,
                httpSecret,
                isActive: isActive ?? true
            }
        });
        res.status(201).json(server);
    } catch (error) {
        console.error('Error creating LoRa server:', error);
        res.status(500).json({ error: 'Sunucu oluşturulamadı' });
    }
});

// PUT /api/lora/servers/:id - Update LoRa server
router.put('/servers/:id', async (req, res) => {
    try {
        const server = await prisma.loRaServer.update({
            where: { id: parseInt(req.params.id) },
            data: req.body
        });
        res.json(server);
    } catch (error) {
        console.error('Error updating LoRa server:', error);
        res.status(500).json({ error: 'Sunucu güncellenemedi' });
    }
});

// DELETE /api/lora/servers/:id - Delete LoRa server
router.delete('/servers/:id', async (req, res) => {
    try {
        await prisma.loRaServer.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ success: true, message: 'Sunucu silindi' });
    } catch (error) {
        console.error('Error deleting LoRa server:', error);
        res.status(500).json({ error: 'Sunucu silinemedi' });
    }
});

// POST /api/lora/servers/:id/test - Test connection to LoRa server
router.post('/servers/:id/test', async (req, res) => {
    try {
        const server = await prisma.loRaServer.findUnique({
            where: { id: parseInt(req.params.id) }
        });

        if (!server) return res.status(404).json({ error: 'Sunucu bulunamadı' });

        // Test based on server type
        if (server.serverType === 'chirpstack_v4') {
            // Try to connect to ChirpStack API
            const axios = require('axios');
            try {
                const response = await axios.get(`http://${server.host}:${server.port}/api/tenants`, {
                    headers: {
                        'Grpc-Metadata-Authorization': `Bearer ${server.apiKey}`
                    },
                    timeout: 5000
                });

                // Update lastSync
                await prisma.loRaServer.update({
                    where: { id: server.id },
                    data: { lastSync: new Date() }
                });

                res.json({
                    success: true,
                    message: 'Bağlantı başarılı!',
                    tenants: response.data?.result?.length || 0
                });
            } catch (apiError) {
                res.status(400).json({
                    success: false,
                    message: `Bağlantı hatası: ${apiError.message}`
                });
            }
        } else {
            res.json({ success: true, message: 'Test modu desteklenmiyor (sadece chirpstack_v4)' });
        }
    } catch (error) {
        console.error('Error testing LoRa server:', error);
        res.status(500).json({ error: 'Test başarısız' });
    }
});

module.exports = router;
