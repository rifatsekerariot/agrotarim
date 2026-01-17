const { PrismaClient } = require('@prisma/client');

const configs = [
    "postgresql://postgres:WRONG@localhost:5432/agrometa",
    "postgresql://postgres:postgres@127.0.0.1:5432/agrometa",
    "postgresql://postgres:postgres@localhost:5432/agrometa?sslmode=disable",
    "postgresql://postgres:postgres@127.0.0.1:5432/agrometa?sslmode=disable",
    "postgresql://postgres:postgres@localhost:5432/agrometa?sslmode=require",
];

async function test(url) {
    console.log(`\n--- Testing: ${url} ---`);
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: url
            }
        }
    });

    try {
        await prisma.$connect();
        const farm = await prisma.farm.findFirst();
        console.log("✅ SUCCESS! Connected.");
        await prisma.$disconnect();
        return true;
    } catch (e) {
        console.log("❌ FAILED:", e.message.split('\n').pop()); // Just the last line
        await prisma.$disconnect();
        return false;
    }
}

async function main() {
    for (const url of configs) {
        if (await test(url)) break;
    }
}

main();
