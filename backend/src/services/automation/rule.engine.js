const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simple in-memory cache for spam prevention (Cool-down)
// Key: ruleId, Value: timestamp of last trigger
const triggerCache = new Map();

class RuleEngine {
    constructor() {
        console.log("RuleEngine initialized");
    }

    /**
     * Main entry point: Evaluate incoming telemetry data against valid rules.
     * @param {number|string} deviceId - Internal Database ID or Serial Number
     * @param {object} telemetryData - { "temperature": 25.5, "humidity": 60 }
     */
    async evaluate(deviceId, telemetryData) {
        try {
            // Find device first (to get DB ID)
            const device = await prisma.device.findFirst({
                where: {
                    OR: [
                        { id: typeof deviceId === 'number' ? deviceId : undefined },
                        { serialNumber: deviceId.toString() }
                    ]
                },
                include: {
                    triggerRules: {
                        where: { isActive: true }
                    }
                }
            });

            if (!device || !device.triggerRules || device.triggerRules.length === 0) {
                return; // No rules for this device
            }

            // Iterate over rules
            for (const rule of device.triggerRules) {
                this.checkRule(rule, telemetryData);
            }

        } catch (error) {
            console.error("RuleEngine Error:", error);
        }
    }

    async checkRule(rule, data) {
        const sensorCode = rule.sensorCode;

        // Debug Log
        // console.log(`[RuleEngine] Checking Rule "${rule.name}" (Sensor: ${sensorCode}) against keys: ${Object.keys(data).join(', ')}`);

        if (data[sensorCode] === undefined) {
            console.log(`[RuleEngine] Skip: Rule "${rule.name}" expects "${sensorCode}" but data has [${Object.keys(data)}]`);
            return;
        }

        const value = Number(data[sensorCode]);
        if (isNaN(value)) {
            console.log(`[RuleEngine] Skip: Value for "${sensorCode}" is NaN (${data[sensorCode]})`);
            return;
        }

        let triggered = false;

        // Condition Check
        switch (rule.condition) {
            case 'GREATER_THAN':
                if (value > rule.threshold) triggered = true;
                break;
            case 'LESS_THAN':
                if (value < rule.threshold) triggered = true;
                break;
            case 'EQUALS':
                if (value === rule.threshold) triggered = true;
                break;
            case 'BETWEEN':
                if (rule.threshold2 !== null && value >= rule.threshold && value <= rule.threshold2) triggered = true;
                break;
        }

        if (triggered) {
            await this.processTrigger(rule, value);
        }
    }

    async processTrigger(rule, value) {
        // Spam Check (Cool-down)
        const lastTrigger = triggerCache.get(rule.id);
        const now = Date.now();
        const cooldownMs = rule.coolDownMinutes * 60 * 1000;

        if (lastTrigger && (now - lastTrigger) < cooldownMs) {
            // In cool-down period, ignore
            return;
        }

        // --- ACTION! ---
        console.log(`[ALARM] Rule "${rule.name}" triggered! Value: ${value}`);

        // Update Cache
        triggerCache.set(rule.id, now);

        // 1. Log to DB
        await prisma.alertLog.create({
            data: {
                ruleId: rule.id,
                value: value,
                message: `Alarm: ${rule.name} (Değer: ${value})`
            }
        });

        // 2. Dispatch Actions
        const actions = await prisma.ruleAction.findMany({ where: { ruleId: rule.id } });
        try {
            const ActionDispatcher = require('./action.dispatcher');
            await ActionDispatcher.dispatch(actions, rule.name, value);
        } catch (err) {
            console.error("Failed to dispatch actions:", err);
        }
    }
}

module.exports = new RuleEngine();
