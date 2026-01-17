const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const last = await prisma.telemetry.findFirst({
        orderBy: { timestamp: 'desc' }
    });
    console.log('Current Time (Server):', new Date().toISOString());
    console.log('Last Telemetry Timestamp:', last ? last.timestamp.toISOString() : 'None');
    console.log('Diff (ms):', last ? (new Date() - last.timestamp) : 'N/A');
    process.exit(0);
}

check();
