import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting bulk email update for ALL agents...');

    const allAgents = await prisma.aIAgent.findMany({
        where: { deletedAt: null }
    });

    console.log(`Found ${allAgents.length} agents in the database.`);

    for (const agent of allAgents) {
        if (!agent.email) {
            // Generate email: remove spaces, lowercase, add @gmail.com
            const safeName = agent.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const newEmail = `${safeName}@gmail.com`;

            console.log(`- Updating '${agent.name}' -> ${newEmail}`);

            await prisma.aIAgent.update({
                where: { id: agent.id },
                data: {
                    // @ts-ignore
                    email: newEmail
                }
            });
        } else {
            console.log(`✓ '${agent.name}' already has email: ${agent.email}`);
        }
    }

    console.log('✅ All agents processed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
