import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Debug: Check env var
console.log("Checking DATABASE_URL...", process.env.DATABASE_URL ? "Exists" : "MISSING");

let prismaInstance: PrismaClient;

try {
    if (!process.env.DATABASE_URL) {
        console.error("❌ CRITICAL ERROR: DATABASE_URL is missing! Proceeding with DUMMY connection to allow server start.");
        // Use a dummy connection string to allow the client to instantiate without crashing immediately.
        // It will still fail if you try to query, which is fine (we'll catch that in controllers).
        prismaInstance = new PrismaClient({
            datasources: {
                db: {
                    url: "postgresql://dummy:dummy@localhost:5432/dummy"
                }
            },
            log: ['query', 'info', 'warn', 'error'],
        });
    } else {
        prismaInstance = globalForPrisma.prisma || new PrismaClient({
            log: ['query', 'info', 'warn', 'error'],
        });
    }
} catch (e) {
    console.error("❌ Failed to initialize PrismaClient:", e);
    // Fallback to dummy
    prismaInstance = new PrismaClient({
        datasources: { db: { url: "postgresql://dummy:dummy@localhost:5432/dummy" } }
    });
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;