const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:3000/api/telemetry';
const DEVICE_SERIAL = 'SIM-001';

async function init() {
    console.log('--- Initializing Simulator ---');
    try {
        // 1. Ensure User and Farm exist (Mocking/Finding existing)
        let user = await prisma.user.findFirst();
        if (!user) {
            console.log("Creating default user...");
            user = await prisma.user.create({
                data: { username: "simadmin", password_hash: "mockhash" }
            });
        }

        let farm = await prisma.farm.findFirst({ where: { user_id: user.id } });
        if (!farm) {
            console.log("Creating default farm...");
            farm = await prisma.farm.create({
                data: {
                    user_id: user.id,
                    name: "Demo Sera",
                    location: "Simulasyon Merkezi"
                }
            });
        }

        // 2. Ensure Device exists
        let device = await prisma.device.findUnique({ where: { serialNumber: DEVICE_SERIAL } });
        if (!device) {
            console.log('Creating simulated device...');
            device = await prisma.device.create({
                data: {
                    farmId: farm.id,
                    name: 'Simulated Node 1',
                    serialNumber: DEVICE_SERIAL,
                    status: 'online',
                    sensors: {
                        create: [
                            { name: 'Air Temp', code: 't_air', type: 'temperature', unit: 'C' },
                            { name: 'Humidity', code: 'h_air', type: 'humidity', unit: '%' },
                            { name: 'Soil Moist', code: 'm_soil', type: 'moisture', unit: '%' }
                        ]
                    }
                }
            });
        }
        console.log('Device ready:', device.id);

    } catch (error) {
        console.error('Initialization failed (DB might be down):', error.message);
        process.exit(1);
    }
}

function generateRandomData() {
    // Simulate diurnal cycle roughly or just random walk
    const time = Date.now();
    const baseTemp = 20 + Math.sin(time / 100000) * 10; // Oscillates 10-30C

    return {
        t_air: (baseTemp + Math.random()).toFixed(1),
        h_air: (50 + Math.sin(time / 200000) * 20).toFixed(1),
        m_soil: (30 - Math.random() * 0.1).toFixed(1) // Drying out slowly
    };
}

async function run() {
    await init();

    console.log('Starting telemetry stream...');
    setInterval(async () => {
        const payload = {
            serial: DEVICE_SERIAL,
            readings: generateRandomData()
        };

        try {
            const res = await axios.post(API_URL, payload);
            console.log(`[${new Date().toISOString()}] Sent:`, payload.readings, `Status: ${res.status}`);
        } catch (error) {
            console.error('Send failed:', error.message);
        }
    }, 5000); // Every 5 seconds
}

run();
