const smsService = require('../sms.service');
const emailService = require('../email.service');
const loraCommandService = require('../lora-command.service');

class ActionDispatcher {
    /**
     * Dispatch a list of actions for a triggered rule
     * @param {Array} actions - List of actions from DB
     * @param {string} ruleName - Name of the triggered rule
     * @param {number|string} value - The sensor value that triggered it
     * @param {number} ruleId - Rule ID for logging
     */
    async dispatch(actions, ruleName, value, ruleId = null) {
        if (!actions || actions.length === 0) return;

        const message = `ALARM: "${ruleName}" tetiklendi! Değer: ${value}`;

        for (const action of actions) {
            try {
                console.log(`[ActionDispatcher] Processing: ${action.type} -> ${action.target}`);

                switch (action.type) {
                    case 'SMS':
                        if (action.target) {
                            await smsService.sendSms(action.target, message, 'KARARVER');
                        }
                        break;

                    case 'EMAIL':
                        if (action.target) {
                            await emailService.sendEmail(
                                action.target,
                                `[Alarm] ${ruleName}`,
                                message,
                                `<div style="font-family: Arial, sans-serif; padding: 20px;">
                                    <h2 style="color: #dc3545;">⚠️ Alarm Bildirimi</h2>
                                    <p><strong>${ruleName}</strong> kuralı tetiklendi.</p>
                                    <p><strong>Değer:</strong> ${value}</p>
                                    <hr />
                                    <small style="color: #999;">Tarih: ${new Date().toLocaleString('tr-TR')}</small>
                                </div>`
                            );
                        }
                        break;

                    case 'NOTIFICATION':
                        // Platform notification (frontend polls AlertLog)
                        console.log(`[Notification] ${message}`);
                        break;

                    case 'CONTROL_DEVICE':
                        // ✅ LoRa Device Control Implementation
                        if (action.target && action.payload) {
                            const deviceId = parseInt(action.target);
                            const payload = typeof action.payload === 'string'
                                ? JSON.parse(action.payload)
                                : action.payload;

                            const { command, hexData, port } = payload;

                            if (!hexData) {
                                console.error('[ActionDispatcher] CONTROL_DEVICE missing hexData');
                                break;
                            }

                            console.log(`[ActionDispatcher] Sending LoRa command: ${command} (${hexData}) to Device ${deviceId}`);

                            await loraCommandService.sendDownlink(
                                deviceId,
                                hexData,
                                port || 1,
                                command || 'Auto Command',
                                'RULE',
                                ruleId
                            );
                        } else {
                            console.warn('[ActionDispatcher] CONTROL_DEVICE missing target or payload');
                        }
                        break;

                    default:
                        console.warn(`[ActionDispatcher] Unknown action type: ${action.type}`);
                }
            } catch (error) {
                console.error(`[ActionDispatcher] Error executing ${action.type}:`, error);
            }
        }
    }
}

module.exports = new ActionDispatcher();
