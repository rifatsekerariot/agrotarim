const { PrismaClient } = require('@prisma/client');
const smsService = require('../services/sms.service');
const { encryptProviderConfig, decryptProviderConfig } = require('../utils/encryption');

const prisma = new PrismaClient();

// Send SMS
const sendSms = async (req, res) => {
    try {
        const { to, message, senderId } = req.body;

        if (!to || !message) {
            return res.status(400).json({ error: 'Phone number and message are required' });
        }

        const result = await smsService.sendSms(to, message, senderId);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to send SMS',
            details: error.message || error.error
        });
    }
};

// Send Bulk SMS
const sendBulkSms = async (req, res) => {
    try {
        const { recipients, message, senderId } = req.body;

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ error: 'Recipients array is required' });
        }

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const result = await smsService.sendBulkSms(recipients, message, senderId);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to send bulk SMS',
            details: error.message
        });
    }
};

// Check Balance
const checkBalance = async (req, res) => {
    try {
        const balance = await smsService.checkBalance();
        res.json({ balance });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to check balance',
            details: error.message
        });
    }
};

// Get SMS Logs
const getLogs = async (req, res) => {
    try {
        const { status, providerId, to, limit } = req.query;

        const logs = await smsService.getLogs({
            status,
            providerId: providerId ? parseInt(providerId) : undefined,
            to,
            limit: limit ? parseInt(limit) : 100
        });

        res.json(logs);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get logs',
            details: error.message
        });
    }
};

// ===== ADMIN ENDPOINTS =====

// List Providers
const getProviders = async (req, res) => {
    try {
        const providers = await prisma.smsProvider.findMany({
            orderBy: { priority: 'desc' }
        });

        // Decrypt and hide credentials
        const safeProviders = providers.map(p => ({
            ...p,
            config: {
                ...p.config,
                credentials: { hidden: true }
            }
        }));

        res.json(safeProviders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get providers', details: error.message });
    }
};

// Add Provider
const createProvider = async (req, res) => {
    try {
        const { name, displayName, isActive, priority, config } = req.body;

        console.log('[SMS API] Create Provider Payload:', JSON.stringify(req.body, null, 2));

        if (!name || !config) {
            console.error('[SMS API] Missing fields:', { name: !!name, config: !!config });
            return res.status(400).json({ error: 'Name and config are required' });
        }

        // Encrypt credentials
        const encryptedConfig = encryptProviderConfig(config);

        const provider = await prisma.smsProvider.create({
            data: {
                name,
                displayName: displayName || name,
                isActive: isActive !== undefined ? isActive : true,
                priority: priority || 0,
                config: encryptedConfig
            }
        });

        // Reload SMS service
        await smsService.reload();

        res.status(201).json({
            message: 'Provider created successfully',
            provider: {
                ...provider,
                config: { hidden: true }
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create provider', details: error.message });
    }
};

// Update Provider
const updateProvider = async (req, res) => {
    try {
        const { id } = req.params;
        const { displayName, isActive, priority, config } = req.body;

        const updateData = {};
        if (displayName !== undefined) updateData.displayName = displayName;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (priority !== undefined) updateData.priority = priority;
        if (config) updateData.config = encryptProviderConfig(config);

        const provider = await prisma.smsProvider.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        // Reload SMS service
        await smsService.reload();

        res.json({
            message: 'Provider updated successfully',
            provider: {
                ...provider,
                config: { hidden: true }
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update provider', details: error.message });
    }
};

// Delete Provider
const deleteProvider = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.smsProvider.delete({
            where: { id: parseInt(id) }
        });

        // Reload SMS service
        await smsService.reload();

        res.json({ message: 'Provider deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete provider', details: error.message });
    }
};

// Test Provider
const testProvider = async (req, res) => {
    try {
        const { id } = req.params;
        const { testPhoneNumber } = req.body;

        if (!testPhoneNumber) {
            return res.status(400).json({ error: 'Test phone number is required' });
        }

        const provider = await prisma.smsProvider.findUnique({
            where: { id: parseInt(id) }
        });

        if (!provider) {
            return res.status(404).json({ error: 'Provider not found' });
        }

        const result = await smsService.sendSms(
            testPhoneNumber,
            'Test SMS from AgroMeta',
            process.env.SMS_DEFAULT_SENDER
        );

        res.json({ message: 'Test SMS sent successfully', result });
    } catch (error) {
        res.status(500).json({
            error: 'Test failed',
            details: error.message || error.error
        });
    }
};

module.exports = {
    sendSms,
    sendBulkSms,
    checkBalance,
    getLogs,
    getProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    testProvider
};
