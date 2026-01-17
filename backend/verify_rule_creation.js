const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("1. Checking Farm...");
        const farm = await prisma.farm.findFirst();
        if (!farm) {
            console.error("❌ No farms found!");
            return;
        }
        console.log(`✅ Farm found: ID ${farm.id}, Name: ${farm.city}`);

        console.log("2. Checking Devices...");
        const device = await prisma.device.findFirst({ where: { farmId: farm.id } });
        if (!device) {
            console.error("❌ No devices found for this farm!");
            return;
        }
        console.log(`✅ Device found: ID ${device.id}, Name: ${device.name}`);

        console.log("3. Attempting Rule Creation...");
        const rule = await prisma.triggerRule.create({
            data: {
                farmId: farm.id,
                name: "Test Rule via Script",
                deviceId: device.id,
                sensorCode: "temperature",
                condition: "GREATER_THAN",
                threshold: 25.5,
                actions: {
                    create: [
                        { type: "NOTIFICATION", target: "admin" }
                    ]
                }
            },
            include: { actions: true }
        });
        console.log("✅ Rule created successfully:", rule.id);

        console.log("4. Cleaning up...");
        await prisma.triggerRule.delete({ where: { id: rule.id } });
        console.log("✅ Cleanup done.");

    } catch (e) {
        console.error("❌ ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
