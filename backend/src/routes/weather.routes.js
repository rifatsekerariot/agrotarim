const express = require('express');
const router = express.Router();
const weatherService = require('../services/weather.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get current weather for a farm
 */
router.get('/current/:farmId', async (req, res) => {
    try {
        const { farmId } = req.params;

        // Get farm coordinates
        const farm = await prisma.farm.findUnique({
            where: { id: parseInt(farmId) },
            select: { latitude: true, longitude: true, location: true }
        });

        if (!farm) {
            return res.status(404).json({ error: 'Farm not found' });
        }

        // Default coordinates (Adana) if not set
        const lat = farm.latitude || 37.0;
        const lon = farm.longitude || 35.32;

        const weather = await weatherService.getCurrentWeather(lat, lon);
        res.json(weather);
    } catch (error) {
        console.error('Weather Route Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get 7-day forecast for a farm
 */
router.get('/forecast/:farmId', async (req, res) => {
    try {
        const { farmId } = req.params;

        const farm = await prisma.farm.findUnique({
            where: { id: parseInt(farmId) },
            select: { latitude: true, longitude: true }
        });

        if (!farm) {
            return res.status(404).json({ error: 'Farm not found' });
        }

        const lat = farm.latitude || 37.0;
        const lon = farm.longitude || 35.32;

        const forecast = await weatherService.getDailySummary(lat, lon);
        res.json(forecast);
    } catch (error) {
        console.error('Forecast Route Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Check if rain is expected
 */
router.get('/rain-check/:farmId', async (req, res) => {
    try {
        const { farmId } = req.params;
        const hours = parseInt(req.query.hours) || 24;

        const farm = await prisma.farm.findUnique({
            where: { id: parseInt(farmId) },
            select: { latitude: true, longitude: true }
        });

        if (!farm) {
            return res.status(404).json({ error: 'Farm not found' });
        }

        const lat = farm.latitude || 37.0;
        const lon = farm.longitude || 35.32;

        const rainCheck = await weatherService.willRainSoon(lat, lon, hours);
        res.json(rainCheck);
    } catch (error) {
        console.error('Rain Check Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Clear weather cache (for testing)
 */
router.post('/clear-cache', (req, res) => {
    weatherService.clearCache();
    res.json({ message: 'Weather cache cleared' });
});

module.exports = router;
