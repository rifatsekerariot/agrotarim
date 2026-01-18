const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authenticateToken = require('../auth/auth.middleware');

// ✅ SECURITY FIX: All LoRa endpoints require authentication
router.use(authenticateToken);

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

        // Live Reload MQTT Service
        const chirpStackService = require('../services/chirpstack.service');
        if (server.mqttEnabled && server.isActive) {
            console.log(`[LoRa API] Triggering MQTT reconnect for server ${server.id}`);
            // Wait slightly to ensure DB commit
            setTimeout(() => chirpStackService.reconnectServer(server.id), 500);
        }

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

            // Helper to build URL
            const buildUrl = (host, port) => {
                const cleanHost = host.trim()
                    .replace(/^https?:\/\//, '')
                    .replace(/\/api\/?$/, '')
                    .replace(/\/$/, '');
                const protocol = host.trim().startsWith('https') ? 'https' : 'http';
                return cleanHost.includes(':') ? `${protocol}://${cleanHost}` : `${protocol}://${cleanHost}:${port}`;
            };

            let baseUrl = buildUrl(server.host, server.port);
            console.log(`[LoRa Test] Testing connection to: ${baseUrl}/api/tenants`);

            const headers = {
                'Grpc-Metadata-Authorization': `Bearer ${server.apiKey}`,
                'Authorization': `Bearer ${server.apiKey}`
            };

            const makeRequest = async (url) => {
                return await axios.get(`${url}/api/tenants`, { headers, timeout: 5000 });
            };

            try {
                let response;
                try {
                    response = await makeRequest(baseUrl);
                } catch (firstErr) {
                    // If 8080 fails with 404 (common for WebUI) or Refused, try 8090
                    if (server.port === 8080 && (firstErr.response?.status === 404 || firstErr.code === 'ECONNREFUSED')) {
                        console.log(`[LoRa Test] Port 8080 failed (${firstErr.response?.status || firstErr.code}). Trying fallback port 8090...`);
                        const altUrl = buildUrl(server.host, 8090);
                        response = await makeRequest(altUrl);
                        // If successful, we could implicitly warn the user
                        response.data.message = 'Bağlantı Başarılı! (Not: Otomatik olarak 8090 portuna yönlendirildi. Lütfen ayarlardan portu 8090 yapın.)';
                    } else {
                        throw firstErr;
                    }
                }

                // Update lastSync
                await prisma.loRaServer.update({
                    where: { id: server.id },
                    data: { lastSync: new Date() }
                });

                res.json({
                    success: true,
                    message: response.data.message || 'Bağlantı başarılı (Global Admin yetkisi doğrulandı).',
                    tenants: response.data?.result?.length || 0
                });
            } catch (apiError) {
                const status = apiError.response?.status;
                const errMsg = apiError.response?.data?.message || apiError.message;

                console.warn(`[LoRa Test] Info: ${status} - ${errMsg}`);

                if (status === 401 || status === 403 || status === 404) {
                    res.json({
                        success: true,
                        message: 'Sunucuya ulaşıldı, ancak API Key kısıtlı. Lütfen Tenant ID\'yi manuel girerek Sync yapın.',
                        restricted: true
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        message: `Bağlantı hatası (${status || 'N/A'}): ${errMsg}. (Rest API portunun 8090 olduğundan emin olun)`
                    });
                }
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

        try {
            let tenantId = server.tenantId?.trim();
            const apiKey = server.apiKey?.trim();

            if (apiKey && apiKey.length < 50) {
                console.warn(`[LoRa Sync] Warning: API Key looks short (${apiKey.length} chars).`);
            }

            // Helper to build URL
            const buildUrl = (host, port) => {
                const cleanHost = host.trim()
                    .replace(/^https?:\/\//, '')
                    .replace(/\/api\/?$/, '')
                    .replace(/\/$/, '');
                const protocol = host.trim().startsWith('https') ? 'https' : 'http';
                return cleanHost.includes(':') ? `${protocol}://${cleanHost}` : `${protocol}://${cleanHost}:${port}`;
            };

            let baseUrl = buildUrl(server.host, server.port);

            const headers = {
                'Grpc-Metadata-Authorization': `Bearer ${apiKey}`,
                'Authorization': `Bearer ${apiKey}`
            };

            console.log(`[LoRa Sync] Starting sync from: ${baseUrl}`);

            // === AUTO PORT FIX ===
            // If configured as 8080, verify if we should switch to 8090
            if (server.port === 8080) {
                try {
                    // Cheap probe: try to fetch versions or tenants on 8080
                    // If it returns HTML (Web UI) or 404, switch to 8090
                    await axios.get(`${baseUrl}/api/tenants?limit=1`, { headers, timeout: 2000 });
                } catch (probeErr) {
                    if (probeErr.response?.status === 404 || probeErr.code === 'ECONNREFUSED' || (typeof probeErr.response?.data === 'string' && probeErr.response.data.includes('<!DOCTYPE html>'))) {
                        console.log(`[LoRa Sync] Probe on 8080 failed/returned HTML. Switching to fallback port 8090.`);
                        baseUrl = buildUrl(server.host, 8090);
                    }
                }
            }
            // =====================

            try {
                // 1. Fetch Tenant ID if not configured
                if (!tenantId) {
                    try {
                        console.log(`[LoRa Sync] Auto-detecting tenant ID from ${baseUrl}/api/tenants`);
                        const tenantsRes = await axios.get(`${baseUrl}/api/tenants?limit=1`, { headers, timeout: 5000 });
                        if (tenantsRes.data?.result?.length > 0) {
                            tenantId = tenantsRes.data.result[0].id;
                            console.log(`[LoRa Sync] Found tenant ID: ${tenantId}`);
                        }
                    } catch (tError) {
                        console.warn(`[LoRa Sync] Could not auto-detect (restricted key?): ${tError.message}`);
                        return res.status(400).json({
                            success: false,
                            message: 'Tenant-seviyesinde API Key kullanıyorsunuz. Lütfen Tenant ID\'yi manuel girin.'
                        });
                    }
                }

                if (!tenantId) return res.status(400).json({ success: false, message: 'Tenant ID gerekli.' });

                // 2. Fetch Applications (Try both camelCase and snake_case)
                console.log(`[LoRa Sync] Fetching applications for tenant: ${tenantId} from ${baseUrl}`);
                let appsRes;
                try {
                    appsRes = await axios.get(`${baseUrl}/api/applications?limit=100&tenantId=${tenantId}`, { headers, timeout: 10000 });
                } catch (firstErr) {
                    if (firstErr.response?.status === 404) {
                        appsRes = await axios.get(`${baseUrl}/api/applications?limit=100&tenant_id=${tenantId}`, { headers, timeout: 10000 });
                    } else {
                        throw firstErr;
                    }
                }

                const applications = appsRes.data?.result || [];

                if (applications.length === 0) {
                    return res.json({ success: true, message: 'Hiç Application bulunamadı.', applications: 0 });
                }

                let synced = 0;
                let skipped = 0;

                // 3. Fetch Devices
                for (const app of applications) {
                    console.log(`[LoRa Sync] Fetching devices for application: ${app.name} (${app.id})`);
                    const devicesRes = await axios.get(`${baseUrl}/api/devices?limit=100&applicationId=${app.id}`, { headers, timeout: 10000 });
                    const devices = devicesRes.data?.result || [];

                    for (const csDevice of devices) {
                        // Calculate status based on lastSeenAt
                        let status = 'offline';
                        let lastSeen = null;

                        if (csDevice.lastSeenAt) {
                            lastSeen = new Date(csDevice.lastSeenAt);
                            // If seen in the last 24 hours, consider online
                            const diffHours = (new Date() - lastSeen) / (1000 * 60 * 60);
                            if (diffHours < 24) {
                                status = 'online';
                            }
                        }

                        // Prepare update data
                        const updateData = {
                            name: csDevice.name,
                            loraServerId: server.id,
                            status: status,
                            lastSeen: lastSeen,
                            batteryLevel: csDevice.deviceStatusBattery,
                            signalQuality: csDevice.deviceStatusMargin
                        };

                        const existing = await prisma.device.findFirst({ where: { devEui: csDevice.devEui } });
                        if (existing) {
                            // Only update if changes found or just to refresh status
                            await prisma.device.update({
                                where: { id: existing.id },
                                data: updateData
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
                                    status: status,
                                    lastSeen: lastSeen,
                                    batteryLevel: csDevice.deviceStatusBattery,
                                    signalQuality: csDevice.deviceStatusMargin
                                }
                            });
                            synced++;
                        }
                    }
                }

                await prisma.loRaServer.update({ where: { id: server.id }, data: { lastSync: new Date() } });
                res.json({ success: true, message: `${synced} yeni cihaz eklendi, ${skipped} cihaz güncellendi.`, applications: applications.length });
            } catch (apiError) {
                const status = apiError.response?.status || 'N/A';
                const data = apiError.response?.data;
                const errMsg = typeof data === 'string' ? data : (data?.message || apiError.message);
                console.error(`[LoRa Sync] API Error at ${apiError.config?.url}: ${status}`, data);

                res.status(400).json({
                    success: false,
                    message: `ChirpStack Hatası (${status}): ${errMsg}. (Kullanılan Port: ${baseUrl.split(':').pop()})`
                });
            }
        } catch (error) {
            console.error('Error syncing:', error);
            res.status(500).json({ error: 'Senkronizasyon başarısız' });
        }
    } catch (error) {
        console.error('Error syncing from ChirpStack:', error);
        res.status(500).json({ error: 'Senkronizasyon başarısız' });
    }
});

// ========== Manual Downlink & Logs ==========
const loraController = require('../controllers/lora.controller');
const { validateDeviceOwnership } = require('../middleware/ownership');

// POST /api/lora/devices/:id/downlink - Manuel downlink gönder
// ✅ SECURITY FIX: Added validateDeviceOwnership middleware
router.post('/devices/:id/downlink', validateDeviceOwnership, loraController.sendManualDownlink);

// GET /api/lora/devices/:id/downlink-logs - Cihaz downlink logları
// ✅ SECURITY FIX: Added validateDeviceOwnership middleware
router.get('/devices/:id/downlink-logs', validateDeviceOwnership, loraController.getDownlinkLogs);

// GET /api/lora/downlink-logs - Tüm downlink logları
router.get('/downlink-logs', loraController.getAllDownlinkLogs);

module.exports = router;
