import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding roles...');
    const adminRole = await prisma.role.upsert({
        where: { RoleName: 'admin' },
        update: {},
        create: { RoleName: 'admin' },
    });

    const clerkRole = await prisma.role.upsert({
        where: { RoleName: 'clerk' },
        update: {},
        create: { RoleName: 'clerk' },
    });

    console.log('Seeding users...');
    await prisma.user.upsert({
        where: { Email: 'admin@123.com' },
        update: {},
        create: {
            Email: 'admin@123.com',
            Password: 'admin123',
            RoleID: adminRole.RoleID,
            Name: 'Admin User',
        },
    });

    await prisma.user.upsert({
        where: { Email: 'clerk@123.com' },
        update: {},
        create: {
            Email: 'clerk@123.com',
            Password: 'clerk123',
            RoleID: clerkRole.RoleID,
            Name: 'Clerk User',
        },
    });

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
