require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const RuleEngine = require('./src/services/automation/rule.engine');

async function testAutomation() {
    console.log("🚀 Starting Automation Logic Test...");

    try {
        // 1. Setup Test Device
        const serial = "TEST_DEV_001";
        let device = await prisma.device.findUnique({ where: { devEui: serial } });

        if (!device) {
            console.log("Creating test device...");
            device = await prisma.device.create({
                data: {
                    name: "Test Device",
                    devEui: serial, // using devEui as unique serial
                    serialNumber: serial,
                    farmId: 1, // Assuming farm 1 exists
                    status: "online",
                    deviceModelId: 1 // Assuming generic model exists or null if optional
                }
            });
        }
        console.log(`✅ Device ID: ${device.id}`);

        // 2. Setup Test Rule
        console.log("Creating/Updating test rule...");
        // Cleanup old rules for this device
        await prisma.triggerRule.deleteMany({ where: { deviceId: device.id } });

        const rule = await prisma.triggerRule.create({
            data: {
                farmId: 1,
                deviceId: device.id,
                name: "Test Temp Rule",
                sensorCode: "temperature",
                condition: "LESS_THAN",
                threshold: 50.0,
                coolDownMinutes: 0, // Disable cooldown for test
                actions: {
                    create: [{ type: "NOTIFICATION", target: "" }]
                }
            }
        });
        console.log(`✅ Rule Created: ID ${rule.id} (Condition: < 50)`);

        // 3. Simulate Telemetry
        console.log("Testing Value: 23 (Should Trigger)");
        await RuleEngine.evaluate(device.id, { temperature: 23 });

        // 4. Verify Log
        const log = await prisma.alertLog.findFirst({
            where: { ruleId: rule.id },
            orderBy: { createdAt: 'desc' }
        });

        if (log) {
            console.log(`🎉 SUCCESS! Alert Log Created: "${log.message}"`);
        } else {
            console.error("❌ FAILURE! No Alert Log found.");
        }

    } catch (error) {
        console.error("💥 Error during test:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testAutomation();
