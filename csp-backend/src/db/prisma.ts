import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Debug: Check env var
console.log("Checking DATABASE_URL...", process.env.DATABASE_URL ? "Exists (starts with " + process.env.DATABASE_URL.substring(0, 10) + "...)" : "MISSING");

if (!process.env.DATABASE_URL) {
    console.error("❌ CRITICAL ERROR: DATABASE_URL is missing from environment variables!");
    // Depending on how you want to handle this, you might not want to throw immediately to avoid crashing build,
    // but for runtime it's critical.
}

export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;