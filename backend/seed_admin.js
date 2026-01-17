const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // Load environment variables

const prisma = new PrismaClient();

async function main() {
    const username = 'admin';
    const password = '12345'; // Default requested password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { username: username },
        update: {
            password_hash: hashedPassword,
        },
        create: {
            username: username,
            password_hash: hashedPassword,
        },
    });

    console.log(`User ${user.username} created/updated with ID: ${user.id}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
