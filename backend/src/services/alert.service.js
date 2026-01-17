const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AlertService = {
    /**
     * Evaluate incoming readings against farm rules
     * @param {number} farmId 
     * @param {Object} readings { "t_air": 25.5, ... }
     */
    async checkRules(farmId, readings) {
        try {
            // 1. Fetch Active Rules for this Farm
            const rules = await prisma.alertRule.findMany({
                where: { farmId, isActive: true },
                include: { sensor: true } // to know which code to check if bound to specific sensor
            });

            if (rules.length === 0) return;

            const alerts = [];

            // 2. Evaluate Each Rule
            for (const rule of rules) {
                // Determine which value to check
                // If rule is bound to a specific sensor, check that sensor's code
                // If rule is general metric (e.g. "temperature"), check all matching keys (simplified for now)

                let valueToCheck = null;

                // For MVP, we assume rules uses 'metric' which matches sensor code (e.g. 't_air')
                if (readings[rule.metric] !== undefined) {
                    valueToCheck = parseFloat(readings[rule.metric]);
                }

                if (valueToCheck !== null) {
                    let triggered = false;
                    if (rule.condition === 'greater_than' && valueToCheck > rule.threshold) triggered = true;
                    if (rule.condition === 'less_than' && valueToCheck < rule.threshold) triggered = true;
                    if (rule.condition === 'equals' && valueToCheck === rule.threshold) triggered = true;

                    if (triggered) {
                        const msg = `🚨 ALERT: ${rule.metric} is ${valueToCheck} (Threshold: ${rule.threshold} ${rule.condition})`;
                        console.log(`[AlertService] ${msg} -> Sending to ${rule.contactDest}`);
                        alerts.push(msg);

                        // TODO: Insert into Notification table or send Email/SMS
                    }
                }
            }

            return alerts;

        } catch (error) {
            console.error('[AlertService] Error:', error);
        }
    }
};

module.exports = AlertService;
