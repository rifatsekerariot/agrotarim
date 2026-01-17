const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ========== Device Model Templates ==========
// Note: No decoder needed - ChirpStack sends pre-decoded JSON

// GET /api/device-models - List all device models
router.get('/', async (req, res) => {
    try {
        const models = await prisma.deviceModel.findMany({
            include: {
                _count: { select: { devices: true } }
            },
            orderBy: [{ brand: 'asc' }, { model: 'asc' }]
        });
        res.json(models);
    } catch (error) {
        console.error('Error fetching device models:', error);
        res.status(500).json({ error: 'Modeller yüklenemedi' });
    }
});

// GET /api/device-models/:id - Get single model details
router.get('/:id', async (req, res) => {
    try {
        const model = await prisma.deviceModel.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!model) return res.status(404).json({ error: 'Model bulunamadı' });
        res.json(model);
    } catch (error) {
        console.error('Error fetching device model:', error);
        res.status(500).json({ error: 'Model bilgisi alınamadı' });
    }
});

// POST /api/device-models - Create new device model
router.post('/', async (req, res) => {
    try {
        const { brand, model, category, sensorTemplate, description } = req.body;

        const deviceModel = await prisma.deviceModel.create({
            data: {
                brand,
                model,
                category,
                sensorTemplate: sensorTemplate || [],
                description
            }
        });
        res.status(201).json(deviceModel);
    } catch (error) {
        console.error('Error creating device model:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Bu marka ve model zaten mevcut' });
        } else {
            res.status(500).json({ error: 'Model oluşturulamadı' });
        }
    }
});

// PUT /api/device-models/:id - Update device model
router.put('/:id', async (req, res) => {
    try {
        const model = await prisma.deviceModel.update({
            where: { id: parseInt(req.params.id) },
            data: req.body
        });
        res.json(model);
    } catch (error) {
        console.error('Error updating device model:', error);
        res.status(500).json({ error: 'Model güncellenemedi' });
    }
});

// DELETE /api/device-models/:id - Delete device model
router.delete('/:id', async (req, res) => {
    try {
        await prisma.deviceModel.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ success: true, message: 'Model silindi' });
    } catch (error) {
        console.error('Error deleting device model:', error);
        res.status(500).json({ error: 'Model silinemedi' });
    }
});

// POST /api/device-models/seed - Seed default Milesight models (simplified)
router.post('/seed', async (req, res) => {
    try {
        const defaultModels = [
            {
                brand: 'Milesight',
                model: 'EM300-TH',
                category: 'temperature_humidity',
                description: 'Sıcaklık ve Nem Sensörü',
                sensorTemplate: [
                    { code: 'temperature', name: 'Sıcaklık', unit: '°C' },
                    { code: 'humidity', name: 'Nem', unit: '%' },
                    { code: 'battery', name: 'Batarya', unit: '%' }
                ]
            },
            {
                brand: 'Milesight',
                model: 'EM300-MCS',
                category: 'door_sensor',
                description: 'Kapı/Pencere Kontak Sensörü',
                sensorTemplate: [
                    { code: 'door', name: 'Kapı Durumu', unit: '' },
                    { code: 'battery', name: 'Batarya', unit: '%' }
                ]
            },
            {
                brand: 'Milesight',
                model: 'EM500-SMTC',
                category: 'soil',
                description: 'Toprak Nem, Sıcaklık ve EC Sensörü',
                sensorTemplate: [
                    { code: 'temperature', name: 'Toprak Sıcaklığı', unit: '°C' },
                    { code: 'moisture', name: 'Toprak Nemi', unit: '%' },
                    { code: 'ec', name: 'Elektriksel İletkenlik', unit: 'µS/cm' },
                    { code: 'battery', name: 'Batarya', unit: '%' }
                ]
            },
            {
                brand: 'Milesight',
                model: 'EM500-CO2',
                category: 'air_quality',
                description: 'CO2, Sıcaklık ve Nem Sensörü',
                sensorTemplate: [
                    { code: 'co2', name: 'CO2', unit: 'ppm' },
                    { code: 'temperature', name: 'Sıcaklık', unit: '°C' },
                    { code: 'humidity', name: 'Nem', unit: '%' },
                    { code: 'battery', name: 'Batarya', unit: '%' }
                ]
            },
            {
                brand: 'Milesight',
                model: 'WS523',
                category: 'weather',
                description: 'Hava İstasyonu',
                sensorTemplate: [
                    { code: 'temperature', name: 'Sıcaklık', unit: '°C' },
                    { code: 'humidity', name: 'Nem', unit: '%' },
                    { code: 'pressure', name: 'Basınç', unit: 'hPa' },
                    { code: 'wind_speed', name: 'Rüzgar Hızı', unit: 'm/s' },
                    { code: 'wind_direction', name: 'Rüzgar Yönü', unit: '°' },
                    { code: 'rain', name: 'Yağış', unit: 'mm' },
                    { code: 'uv_index', name: 'UV İndeksi', unit: '' },
                    { code: 'light', name: 'Işık', unit: 'lux' }
                ]
            },
            {
                brand: 'Milesight',
                model: 'WS301',
                category: 'leak_detection',
                description: 'Su Sızıntı Dedektörü',
                sensorTemplate: [
                    { code: 'leak', name: 'Sızıntı Durumu', unit: '' },
                    { code: 'battery', name: 'Batarya', unit: '%' }
                ]
            }
        ];

        let created = 0;
        let skipped = 0;

        for (const modelData of defaultModels) {
            try {
                await prisma.deviceModel.create({ data: modelData });
                created++;
            } catch (e) {
                if (e.code === 'P2002') {
                    skipped++; // Already exists
                } else {
                    throw e;
                }
            }
        }

        res.json({
            success: true,
            message: `${created} model eklendi, ${skipped} model zaten mevcut.`
        });
    } catch (error) {
        console.error('Error seeding device models:', error);
        res.status(500).json({ error: 'Modeller eklenemedi' });
    }
});

module.exports = router;
