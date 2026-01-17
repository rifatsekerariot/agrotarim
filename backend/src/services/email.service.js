const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const prisma = new PrismaClient();

class EmailService {
    constructor() {
        // Placeholder for future SMTP config from DB
        this.transporter = null;
    }

    async initialize() {
        try {
            // Try fetching from DB first
            const settings = await prisma.systemSetting.findMany({
                where: { key: { startsWith: 'SMTP_' } }
            });

            // Convert array to object
            const config = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});

            // Fallback to Env if DB is empty
            const host = config.SMTP_HOST || process.env.SMTP_HOST;

            if (host) {
                this.transporter = nodemailer.createTransport({
                    host: host,
                    port: parseInt(config.SMTP_PORT || process.env.SMTP_PORT || '587'),
                    secure: (config.SMTP_SECURE || process.env.SMTP_SECURE) === 'true',
                    auth: {
                        user: config.SMTP_USER || process.env.SMTP_USER,
                        pass: config.SMTP_PASS || process.env.SMTP_PASS
                    }
                });
                console.log(`[EmailService] Initialized with host: ${host}`);
            } else {
                console.warn('[EmailService] No SMTP config found in DB or Env');
            }
        } catch (e) {
            console.error("Failed to init email service:", e);
        }
    }

    async sendEmail(to, subject, text, html) {
        if (!this.transporter) await this.initialize();

        if (!this.transporter) {
            console.warn('[EmailService] SMTP not configured. Skipping email to', to);
            return { success: false, error: 'SMTP not configured' };
        }

        try {
            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"Kararver Otomasyon" <noreply@kararver.com>',
                to,
                subject,
                text,
                html
            });
            console.log(`[EmailService] Email sent to ${to}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('[EmailService] Failed to send email:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();
