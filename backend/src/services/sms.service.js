const { PrismaClient } = require('@prisma/client');
const GenericSmsProvider = require('./sms/generic-provider');
const { decryptProviderConfig } = require('../utils/encryption');

const prisma = new PrismaClient();

class SmsService {
    constructor() {
        this.providers = [];
        this.initialized = false;
    }

    /**
     * Load active providers from database
     */
    async initialize() {
        if (this.initialized) return;

        const dbProviders = await prisma.smsProvider.findMany({
            where: { isActive: true },
            orderBy: { priority: 'desc' } // Higher priority first
        });

        this.providers = dbProviders.map(p => {
            const config = decryptProviderConfig(p.config);
            return {
                id: p.id,
                name: p.name,
                instance: new GenericSmsProvider({ ...config, name: p.displayName })
            };
        });

        this.initialized = true;
        console.log(`[SMS Service] Loaded ${this.providers.length} provider(s)`);
    }

    /**
     * Send SMS with automatic failover
     */
    async sendSms(to, message, senderId) {
        await this.initialize();

        if (this.providers.length === 0) {
            throw new Error('No SMS providers configured');
        }

        let lastError = null;

        // Try each provider in priority order
        for (const provider of this.providers) {
            try {
                console.log(`[SMS Service] Attempting to send SMS via ${provider.name}`);

                const result = await provider.instance.sendSms(to, message, senderId);

                // Log success
                await prisma.smsLog.create({
                    data: {
                        providerId: provider.id,
                        providerMessageId: result.messageId,
                        to,
                        message: process.env.SMS_LOG_MESSAGE_CONTENT === 'true' ? message : null,
                        status: 'sent',
                        sentAt: new Date()
                    }
                });

                console.log(`[SMS Service] SMS sent successfully via ${provider.name}`);
                return {
                    success: true,
                    provider: provider.name,
                    messageId: result.messageId
                };

            } catch (error) {
                lastError = error;
                console.error(`[SMS Service] Failed to send via ${provider.name}:`, error.message);

                // Log failure
                await prisma.smsLog.create({
                    data: {
                        providerId: provider.id,
                        to,
                        message: process.env.SMS_LOG_MESSAGE_CONTENT === 'true' ? message : null,
                        status: 'failed',
                        errorMessage: error.message || error.error,
                        sentAt: new Date()
                    }
                }).catch(err => console.error('Failed to log SMS error:', err));

                // Continue to next provider
            }
        }

        // All providers failed
        throw {
            success: false,
            error: 'All SMS providers failed',
            lastError: lastError?.message || lastError?.error || 'Unknown error'
        };
    }

    /**
     * Send bulk SMS
     */
    async sendBulkSms(recipients, message, senderId) {
        const results = [];

        for (const to of recipients) {
            try {
                const result = await this.sendSms(to, message, senderId);
                results.push({ to, ...result });
            } catch (error) {
                results.push({
                    to,
                    success: false,
                    error: error.message || error.error
                });
            }
        }

        return {
            total: recipients.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }

    /**
     * Check balance (uses first active provider)
     */
    async checkBalance() {
        await this.initialize();

        if (this.providers.length === 0) {
            throw new Error('No SMS providers configured');
        }

        const provider = this.providers[0];
        return await provider.instance.checkBalance();
    }

    /**
     * Check message status
     */
    async checkStatus(messageId, providerName) {
        await this.initialize();

        const provider = this.providers.find(p => p.name === providerName);
        if (!provider) {
            throw new Error(`Provider ${providerName} not found`);
        }

        return await provider.instance.checkStatus(messageId);
    }

    /**
     * Get SMS logs
     */
    async getLogs(filters = {}) {
        const where = {};

        if (filters.status) where.status = filters.status;
        if (filters.providerId) where.providerId = filters.providerId;
        if (filters.to) where.to = { contains: filters.to };

        return await prisma.smsLog.findMany({
            where,
            include: { provider: true },
            orderBy: { createdAt: 'desc' },
            take: filters.limit || 100
        });
    }

    /**
     * Reload providers (call after config changes)
     */
    async reload() {
        this.initialized = false;
        this.providers = [];
        await this.initialize();
    }
}

// Singleton instance
const smsService = new SmsService();

module.exports = smsService;
