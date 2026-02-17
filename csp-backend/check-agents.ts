import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const agents = await prisma.aIAgent.findMany({
        where: { deletedAt: null }
    });
    console.log('--- AGENTS ---');
    agents.forEach(a => {
        console.log(`ID: ${a.id} | Name: ${a.name} | Voice: ${a.voice || 'DEFAULT'}`);
    });
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
