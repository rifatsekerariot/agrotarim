const smsService = require('../sms.service');
const emailService = require('../email.service');

class ActionDispatcher {
    /**
     * Dispatch a list of actions for a triggered rule
     * @param {Array} actions - List of actions from DB
     * @param {string} ruleName - Name of the triggered rule
     * @param {number|string} value - The sensor value that triggered it
     */
    async dispatch(actions, ruleName, value) {
        if (!actions || actions.length === 0) return;

        const message = `ALARM: One of your rules "${ruleName}" was triggered! Current Value: ${value}`;

        for (const action of actions) {
            try {
                console.log(`[ActionDispatcher] Processing action: ${action.type} -> ${action.target}`);

                switch (action.type) {
                    case 'SMS':
                        if (action.target) {
                            await smsService.sendSms(action.target, message, 'KARARVER');
                        }
                        break;

                    case 'EMAIL':
                        if (action.target) {
                            await emailService.sendEmail(action.target, `[Alarm] ${ruleName}`, message);
                        }
                        break;

                    case 'NOTIFICATION':
                        // TODO: Integrate with NotificationService (Push/In-App)
                        // For now we just log, as Frontend polls logs
                        console.log(`[Notification] ${message}`);
                        break;

                    case 'CONTROL_DEVICE':
                        // Future: Send MQTT command to device
                        console.log(`[Device Control] TODO: Send command to ${action.target}`);
                        break;

                    default:
                        console.warn(`Unknown action type: ${action.type}`);
                }
            } catch (error) {
                console.error(`[ActionDispatcher] Error executing action ${action.type}:`, error);
            }
        }
    }
}

module.exports = new ActionDispatcher();
