const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load env from .env file in parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');

        const deviceCount = await prisma.device.count();
        const sensorCount = await prisma.sensor.count();
        const telemetryCount = await prisma.telemetry.count();

        const lastTelemetry = await prisma.telemetry.findFirst({
            orderBy: { timestamp: 'desc' },
            include: { sensor: true }
        });

        console.log('\n--- DIAGNOSTIC RESULTS ---');
        console.log(`Total Devices: ${deviceCount}`);
        console.log(`Total Sensors: ${sensorCount}`);
        console.log(`Total Telemetry Records: ${telemetryCount}`);

        if (lastTelemetry) {
            console.log(`Latest Data: ${lastTelemetry.value} (${lastTelemetry.sensor.code}) at ${lastTelemetry.timestamp}`);
        } else {
            console.log('Latest Data: NONE');
        }

        if (deviceCount > 0) {
            const devices = await prisma.device.findMany({ select: { name: true, serialNumber: true, devEui: true } });
            console.log('\n--- DEVICE LIST ---');
            devices.forEach(d => {
                console.log(`- ${d.name} | S/N: ${d.serialNumber} | EUI: ${d.devEui || 'NULL'}`);
            });
        }

    } catch (e) {
        console.error('Diagnostic Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
