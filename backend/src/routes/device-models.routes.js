const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ========== Device Model Templates ==========

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
        const {
            brand, model, category,
            decoderType, decoderCode,
            sensorTemplate,
            iconUrl, description, datasheet
        } = req.body;

        const deviceModel = await prisma.deviceModel.create({
            data: {
                brand,
                model,
                category,
                decoderType: decoderType || 'milesight',
                decoderCode,
                sensorTemplate: sensorTemplate || [],
                iconUrl,
                description,
                datasheet
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

// POST /api/device-models/seed - Seed default Milesight models
router.post('/seed', async (req, res) => {
    try {
        const defaultModels = [
            {
                brand: 'Milesight',
                model: 'EM300-TH',
                category: 'temperature_humidity',
                decoderType: 'milesight',
                description: 'Sıcaklık ve Nem Sensörü (Kapalı Alan)',
                sensorTemplate: [
                    { code: 't_air', name: 'Sıcaklık', unit: '°C', type: 'temperature' },
                    { code: 'h_air', name: 'Nem', unit: '%', type: 'humidity' },
                    { code: 'battery', name: 'Batarya', unit: '%', type: 'battery' }
                ]
            },
            {
                brand: 'Milesight',
                model: 'EM300-MCS',
                category: 'door_sensor',
                decoderType: 'milesight',
                description: 'Kapı/Pencere Kontak Sensörü',
                sensorTemplate: [
                    { code: 'door', name: 'Kapı Durumu', unit: '', type: 'binary' },
                    { code: 'battery', name: 'Batarya', unit: '%', type: 'battery' }
                ]
            },
            {
                brand: 'Milesight',
                model: 'EM500-SMTC',
                category: 'soil',
                decoderType: 'milesight',
                description: 'Toprak Nem, Sıcaklık ve EC Sensörü',
                sensorTemplate: [
                    { code: 't_soil', name: 'Toprak Sıcaklığı', unit: '°C', type: 'temperature' },
                    { code: 'm_soil', name: 'Toprak Nemi', unit: '%', type: 'moisture' },
                    { code: 'ec_soil', name: 'Elektriksel İletkenlik', unit: 'µS/cm', type: 'conductivity' },
                    { code: 'battery', name: 'Batarya', unit: '%', type: 'battery' }
                ]
            },
            {
                brand: 'Milesight',
                model: 'EM500-CO2',
                category: 'air_quality',
                decoderType: 'milesight',
                description: 'CO2, Sıcaklık ve Nem Sensörü',
                sensorTemplate: [
                    { code: 'co2', name: 'CO2', unit: 'ppm', type: 'co2' },
                    { code: 't_air', name: 'Sıcaklık', unit: '°C', type: 'temperature' },
                    { code: 'h_air', name: 'Nem', unit: '%', type: 'humidity' },
                    { code: 'battery', name: 'Batarya', unit: '%', type: 'battery' }
                ]
            },
            {
                brand: 'Milesight',
                model: 'WS523',
                category: 'weather',
                decoderType: 'milesight',
                description: 'Hava İstasyonu (Rüzgar, Yağış, Basınç)',
                sensorTemplate: [
                    { code: 't_air', name: 'Sıcaklık', unit: '°C', type: 'temperature' },
                    { code: 'h_air', name: 'Nem', unit: '%', type: 'humidity' },
                    { code: 'pressure', name: 'Basınç', unit: 'hPa', type: 'pressure' },
                    { code: 'wind_speed', name: 'Rüzgar Hızı', unit: 'm/s', type: 'wind' },
                    { code: 'wind_dir', name: 'Rüzgar Yönü', unit: '°', type: 'wind_direction' },
                    { code: 'rain', name: 'Yağış', unit: 'mm', type: 'rain' },
                    { code: 'uv_index', name: 'UV İndeksi', unit: '', type: 'uv' },
                    { code: 'light', name: 'Işık', unit: 'lux', type: 'light' }
                ]
            },
            {
                brand: 'Milesight',
                model: 'WS301',
                category: 'leak_detection',
                decoderType: 'milesight',
                description: 'Su Sızıntı Dedektörü',
                sensorTemplate: [
                    { code: 'leak', name: 'Sızıntı Durumu', unit: '', type: 'binary' },
                    { code: 'battery', name: 'Batarya', unit: '%', type: 'battery' }
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
