const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

/**
 * Seed SMS Providers
 * Pre-configured templates for popular Turkish SMS providers
 * User only needs to add their credentials
 */

const providers = [
    {
        name: 'netgsm',
        displayName: 'NetGSM',
        isActive: false, // Will be activated when user adds credentials
        priority: 100,
        config: {
            baseUrl: 'https://api.netgsm.com.tr',
            authType: 'basic',
            credentials: {
                username: 'YOUR_NETGSM_USERNAME',
                password: 'YOUR_NETGSM_PASSWORD'
            },
            credentialsInPayload: true,
            sendEndpoint: '/sms/send/get',
            httpMethod: 'GET',
            payloadFormat: 'form',
            fieldMappings: {
                sender: 'header',
                recipient: 'gsmno',
                message: 'message'
            },
            countryCode: '',
            successPattern: '^00',
            errorPattern: '^[0-9]{2}'
        }
    },
    {
        name: 'mutlucell',
        displayName: 'Mutlucell SMS',
        isActive: false,
        priority: 90,
        config: {
            baseUrl: 'https://smsgw.mutlucell.com.tr',
            authType: 'basic',
            credentials: {
                username: 'YOUR_MUTLUCELL_USERNAME',
                password: 'YOUR_MUTLUCELL_PASSWORD'
            },
            credentialsInPayload: false,
            sendEndpoint: '/smsgw/api/sendsms',
            httpMethod: 'POST',
            contentType: 'application/json',
            payloadFormat: 'json',
            fieldMappings: {
                sender: 'originator',
                recipient: 'recipients',
                message: 'body'
            },
            countryCode: '+90'
        }
    },
    {
        name: 'verimor',
        displayName: 'Verimor',
        isActive: false,
        priority: 80,
        config: {
            baseUrl: 'https://sms.verimor.com.tr/v2',
            authType: 'basic',
            credentials: {
                username: 'YOUR_VERIMOR_USERNAME',
                password: 'YOUR_VERIMOR_PASSWORD'
            },
            sendEndpoint: '/send.json',
            httpMethod: 'POST',
            contentType: 'application/json',
            payloadFormat: 'json',
            fieldMappings: {
                sender: 'source_addr',
                recipient: 'messages[0].dest',
                message: 'messages[0].msg'
            },
            countryCode: '90'
        }
    },
    {
        name: 'nac',
        displayName: 'NAC Telekom',
        isActive: false,
        priority: 70,
        config: {
            baseUrl: 'https://api.nac.com.tr',
            authType: 'api_key',
            credentials: {
                username: 'YOUR_NAC_USERNAME',
                password: 'YOUR_NAC_PASSWORD'
            },
            credentialsInPayload: true,
            sendEndpoint: '/sms/send',
            httpMethod: 'POST',
            contentType: 'application/json',
            payloadFormat: 'json',
            fieldMappings: {
                sender: 'originator',
                recipient: 'phone',
                message: 'text'
            },
            countryCode: '90'
        }
    },
    {
        name: 'turkiyesms',
        displayName: 'Türkiye SMS',
        isActive: false,
        priority: 60,
        config: {
            baseUrl: 'https://api.turkiyesms.com.tr',
            authType: 'api_key',
            credentials: {
                username: 'YOUR_TURKIYESMS_USERNAME',
                apiKey: 'YOUR_TURKIYESMS_API_KEY'
            },
            credentialsInPayload: true,
            sendEndpoint: '/api/sms/send',
            httpMethod: 'POST',
            contentType: 'application/json',
            payloadFormat: 'json',
            fieldMappings: {
                sender: 'from',
                recipient: 'to',
                message: 'content'
            },
            countryCode: '90'
        }
    }
];

async function main() {
    console.log('Seeding SMS providers...');

    for (const provider of providers) {
        try {
            const existing = await prisma.smsProvider.findUnique({
                where: { name: provider.name }
            });

            if (existing) {
                console.log(`Provider "${provider.name}" already exists, skipping...`);
                continue;
            }

            await prisma.smsProvider.create({
                data: provider
            });

            console.log(`✅ Created provider: ${provider.displayName}`);
        } catch (error) {
            console.error(`❌ Failed to create provider "${provider.name}":`, error.message);
        }
    }

    console.log('\nSMS provider seeding completed!');
    console.log('\nNext steps:');
    console.log('1. Update provider credentials via admin API or database');
    console.log('2. Set isActive = true for providers you want to use');
    console.log('3. Adjust priority values for failover order');
    console.log('4. Test SMS sending via /api/sms/providers/:id/test endpoint');
}

main()
    .catch((e) => {
        console.error('Error seeding providers:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
