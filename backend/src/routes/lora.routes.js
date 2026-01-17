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
        // Filter only valid fields to prevent Prisma errors
        const {
            name, serverType, host, port,
            apiKey, tenantId,
            mqttEnabled, mqttHost, mqttUsername, mqttPassword, mqttTopic,
            httpEnabled, httpSecret,
            isActive
        } = req.body;

        const server = await prisma.loRaServer.update({
            where: { id: parseInt(req.params.id) },
            data: {
                name, serverType, host, port,
                apiKey, tenantId,
                mqttEnabled, mqttHost, mqttUsername, mqttPassword, mqttTopic,
                httpEnabled, httpSecret,
                isActive
            }
        });
        res.json(server);
    } catch (error) {
        console.error('Error updating LoRa server:', error);
        res.status(500).json({ error: 'Sunucu güncellenemedi', details: error.message });
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
            const axios = require('axios');

            // Sanitize host and build URL
            const cleanHost = server.host.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
            const protocol = server.host.trim().startsWith('https') ? 'https' : 'http';
            const baseUrl = cleanHost.includes(':') ? `${protocol}://${cleanHost}` : `${protocol}://${cleanHost}:${server.port}`;

            console.log(`[LoRa Test] Testing connection to: ${baseUrl}/api/tenants`);

            try {
                const response = await axios.get(`${baseUrl}/api/tenants`, {
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
                const errMsg = apiError.response?.data?.message || apiError.message;
                const status = apiError.response?.status || 'N/A';
                console.error(`[LoRa Test] Failed: ${status} - ${errMsg}`, apiError.config?.url);

                res.status(400).json({
                    success: false,
                    message: `Bağlantı hatası (${status}): ${errMsg}`
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

// POST /api/lora/servers/:id/sync - Sync devices from ChirpStack
router.post('/servers/:id/sync', async (req, res) => {
    try {
        const server = await prisma.loRaServer.findUnique({
            where: { id: parseInt(req.params.id) }
        });

        if (!server) return res.status(404).json({ error: 'Sunucu bulunamadı' });
        if (!server.apiKey) return res.status(400).json({ error: 'API Key gerekli' });

        const axios = require('axios');
        const headers = { 'Grpc-Metadata-Authorization': `Bearer ${server.apiKey}` };

        try {
            let tenantId = server.tenantId;
            // Sanitize host and build URL
            const cleanHost = server.host.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
            const protocol = server.host.trim().startsWith('https') ? 'https' : 'http';
            const baseUrl = cleanHost.includes(':') ? `${protocol}://${cleanHost}` : `${protocol}://${cleanHost}:${server.port}`;

            console.log(`[LoRa Sync] Starting sync from: ${baseUrl}`);

            const headers = { 'Grpc-Metadata-Authorization': `Bearer ${server.apiKey}` };

            // 1. Fetch Tenant ID if not configured
            if (!tenantId) {
                console.log(`[LoRa Sync] Fetching tenant ID from ${baseUrl}/api/tenants`);
                const tenantsRes = await axios.get(`${baseUrl}/api/tenants?limit=1`, { headers, timeout: 10000 });
                if (tenantsRes.data?.result?.length > 0) {
                    tenantId = tenantsRes.data.result[0].id;
                    console.log(`[LoRa Sync] Found tenant ID: ${tenantId}`);
                } else {
                    return res.status(400).json({ success: false, message: 'Tenant bulunamadı. Lütfen Tenant ID girin.' });
                }
            }

            // 2. Fetch Applications
            console.log(`[LoRa Sync] Fetching applications for tenant: ${tenantId}`);
            const appsRes = await axios.get(`${baseUrl}/api/applications?limit=100&tenantId=${tenantId}`, { headers, timeout: 10000 });
            const applications = appsRes.data?.result || [];

            if (applications.length === 0) {
                console.log(`[LoRa Sync] No applications found for tenant ${tenantId}`);
                return res.json({ success: true, message: 'Hiç Application bulunamadı.', applications: 0 });
            }

            console.log(`[LoRa Sync] Found ${applications.length} applications`);
            let synced = 0;
            let skipped = 0;

            // 3. Fetch Devices for each Application
            for (const app of applications) {
                console.log(`[LoRa Sync] Fetching devices for application: ${app.name} (${app.id})`);
                const devicesRes = await axios.get(`${baseUrl}/api/devices?limit=100&applicationId=${app.id}`, { headers, timeout: 10000 });
                const devices = devicesRes.data?.result || [];

                for (const csDevice of devices) {
                    // Check if device already exists
                    const existing = await prisma.device.findFirst({
                        where: { devEui: csDevice.devEui }
                    });

                    if (existing) {
                        await prisma.device.update({
                            where: { id: existing.id },
                            data: { name: csDevice.name, loraServerId: server.id }
                        });
                        skipped++;
                    } else {
                        await prisma.device.create({
                            data: {
                                farmId: 1,
                                name: csDevice.name,
                                serialNumber: csDevice.devEui,
                                devEui: csDevice.devEui,
                                loraServerId: server.id,
                                status: 'offline'
                            }
                        });
                        synced++;
                    }
                }
            }

            await prisma.loRaServer.update({
                where: { id: server.id },
                data: { lastSync: new Date() }
            });

            console.log(`[LoRa Sync] Complete. Synced: ${synced}, Updated: ${skipped}`);
            res.json({
                success: true,
                message: `${synced} cihaz eklendi, ${skipped} cihaz güncellendi.`,
                applications: applications.length
            });
        } catch (apiError) {
            const errMsg = apiError.response?.data?.message || apiError.message;
            const status = apiError.response?.status || 'N/A';
            const url = apiError.config?.url || 'N/A';
            console.error(`[LoRa Sync] Error at ${url}: ${status} - ${errMsg}`);

            res.status(400).json({
                success: false,
                message: `ChirpStack API hatası (${status}): ${errMsg}`
            });
        }
    } catch (error) {
        console.error('Error syncing from ChirpStack:', error);
        res.status(500).json({ error: 'Senkronizasyon başarısız' });
    }
});

module.exports = router;
