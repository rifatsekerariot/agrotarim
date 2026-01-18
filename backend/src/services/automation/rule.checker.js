const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const actionDispatcher = require('./action.dispatcher');

/**
 * RuleChecker - Real-time automation rule monitoring service
 * Checks all active trigger rules against latest sensor data
 */
class RuleChecker {
    constructor() {
        this.lastChecked = new Map(); // Rule ID -> Last trigger timestamp
        this.checkInterval = 5000; // 5 seconds
        this.isRunning = false;
    }

    /**
     * Start the rule checking loop
     */
    start() {
        if (this.isRunning) {
            console.warn('[RuleChecker] Already running');
            return;
        }

        console.log('[RuleChecker] Starting... Check interval: 5s');
        this.isRunning = true;
        this.checkLoop();
    }

    /**
     * Stop the rule checker
     */
    stop() {
        this.isRunning = false;
        console.log('[RuleChecker] Stopped');
    }

    /**
     * Main checking loop
     */
    async checkLoop() {
        while (this.isRunning) {
            try {
                await this.checkAllRules();
            } catch (error) {
                console.error('[RuleChecker] Error in check loop:', error);
            }

            // Wait before next check
            await this.sleep(this.checkInterval);
        }
    }

    /**
     * Check all active rules
     */
    async checkAllRules() {
        try {
            // Get all active rules with their related data
            const rules = await prisma.triggerRule.findMany({
                where: { isActive: true },
                include: {
                    device: {
                        include: {
                            sensors: {
                                include: {
                                    telemetry: {
                                        orderBy: { timestamp: 'desc' },
                                        take: 1
                                    }
                                }
                            }
                        }
                    },
                    actions: true
                }
            });

            // Check each rule
            for (const rule of rules) {
                await this.checkRule(rule);
            }
        } catch (error) {
            console.error('[RuleChecker] Error fetching rules:', error);
        }
    }

    /**
     * Check a single rule
     */
    async checkRule(rule) {
        try {
            // Find the sensor this rule is watching
            const sensor = rule.device.sensors.find(s => s.code === rule.sensorCode);

            if (!sensor) {
                // Sensor not found - rule misconfigured
                return;
            }

            if (!sensor.telemetry || sensor.telemetry.length === 0) {
                // No telemetry data yet
                return;
            }

            const latestValue = sensor.telemetry[0].value;
            const latestTimestamp = sensor.telemetry[0].timestamp;

            // Evaluate condition
            const triggered = this.evaluateCondition(
                rule.condition,
                latestValue,
                rule.threshold,
                rule.threshold2
            );

            if (triggered) {
                await this.handleTriggeredRule(rule, sensor, latestValue);
            } else {
                // Auto-resolve: Değer normale döndü
                if (rule.autoResolve) {
                    await this.autoResolveAlerts(rule);
                }
            }
        } catch (error) {
            console.error(`[RuleChecker] Error checking rule ${rule.id}:`, error);
        }
    }

    /**
     * Handle triggered rule with repeat logic
     */
    async handleTriggeredRule(rule, sensor, latestValue) {
        const now = Date.now();
        const lastTrigger = this.lastChecked.get(rule.id) || 0;
        const timeSinceLastTrigger = now - lastTrigger;

        // İlk tetiklenme mi?
        const isFirstTrigger = lastTrigger === 0;

        // Repeat interval (dakika -> ms)
        const repeatIntervalMs = rule.repeatIntervalMinutes * 60 * 1000;
        const maxRepeatMs = rule.maxRepeatMinutes * 60 * 1000;

        // Maksimum süre aşıldı mı?
        if (!isFirstTrigger && maxRepeatMs > 0 && timeSinceLastTrigger > maxRepeatMs) {
            console.log(`[RuleChecker] 🔕 Rule "${rule.name}" max repeat duration exceeded (${Math.floor(timeSinceLastTrigger / 60000)}m / ${rule.maxRepeatMinutes}m)`);
            return; // Bildirim gönderme ama alarm aktif
        }

        // Repeat interval kontrolü
        if (!isFirstTrigger && repeatIntervalMs > 0 && timeSinceLastTrigger < repeatIntervalMs) {
            console.log(`[RuleChecker] ⏸️ Rule "${rule.name}" in repeat interval (${Math.floor(timeSinceLastTrigger / 1000)}s / ${rule.repeatIntervalMinutes * 60}s)`);
            return;
        }

        console.log(`[RuleChecker] ✅ TRIGGERED: "${rule.name}" | ${sensor.name} = ${latestValue} ${sensor.unit}`);

        // Tutarlı mesaj formatı oluştur
        const alertMessage = `Alarm: ${rule.name} (${sensor.name} = ${latestValue} ${sensor.unit})`;

        // Create alert log (unresolved)
        await prisma.alertLog.create({
            data: {
                ruleId: rule.id,
                value: latestValue,
                message: alertMessage,
                isResolved: false,
                resolvedAt: null
            }
        });

        // Dispatch actions (SMS, Email, Device Control, etc.)
        await actionDispatcher.dispatch(rule.actions, rule.name, latestValue, rule.id);

        // Update last trigger time
        this.lastChecked.set(rule.id, now);
    }

    /**
     * Auto-resolve alerts when value returns to normal
     */
    async autoResolveAlerts(rule) {
        try {
            // Son 1 saatteki çözülmemiş alarmları bul
            const unresolvedAlerts = await prisma.alertLog.findMany({
                where: {
                    ruleId: rule.id,
                    isResolved: false,
                    createdAt: {
                        gte: new Date(Date.now() - 60 * 60 * 1000) // Son 1 saat
                    }
                }
            });

            if (unresolvedAlerts.length > 0) {
                // Tümünü yeşile çevir
                await prisma.alertLog.updateMany({
                    where: {
                        id: { in: unresolvedAlerts.map(a => a.id) }
                    },
                    data: {
                        isResolved: true,
                        resolvedAt: new Date()
                    }
                });

                console.log(`[RuleChecker] ✅ Auto-resolved ${unresolvedAlerts.length} alerts for rule "${rule.name}"`);
            }
        } catch (error) {
            console.error(`[RuleChecker] Error auto-resolving alerts for rule ${rule.id}:`, error);
        }
    }

    /**
     * Evaluate a condition
     */
    evaluateCondition(condition, value, threshold, threshold2) {
        switch (condition) {
            case 'GREATER_THAN':
                return value > threshold;

            case 'LESS_THAN':
                return value < threshold;

            case 'EQUALS':
                return Math.abs(value - threshold) < 0.01; // Floating point tolerance

            case 'BETWEEN':
                if (threshold2 === null || threshold2 === undefined) {
                    console.warn('[RuleChecker] BETWEEN condition but no threshold2');
                    return false;
                }
                return value >= threshold && value <= threshold2;

            default:
                console.warn(`[RuleChecker] Unknown condition: ${condition}`);
                return false;
        }
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new RuleChecker();
