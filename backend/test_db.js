const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Testing RAW query...");
        const result = await prisma.$queryRaw`SELECT 1 as result`;
        console.log("Success! Result:", result);
    } catch (e) {
        console.error("ERROR TYPE:", e.name);
        console.error("ERROR CODE:", e.code);
        console.error("ERROR MESSAGE:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
