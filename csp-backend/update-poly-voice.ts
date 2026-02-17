import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const agentName = 'Polycarbonate Vendor';
    const targetVoice = 'af_bella';
    const targetSpeed = 1.0; // Same as default/Adam

    console.log(`Searching for agent: "${agentName}"...`);

    const agent = await prisma.aIAgent.findFirst({
        where: {
            name: { contains: agentName, mode: 'insensitive' },
            deletedAt: null
        }
    });

    if (!agent) {
        console.error(`❌ Agent "${agentName}" not found!`);
        process.exit(1);
    }

    console.log(`Found agent: ${agent.name} (ID: ${agent.id})`);
    console.log(`Current voice: ${agent.voice || 'None'}`);
    console.log(`Current speed: ${agent.voiceSpeed || 'None'}`);

    const updatedAgent = await prisma.aIAgent.update({
        where: { id: agent.id },
        data: {
            voice: targetVoice,
            voiceSpeed: targetSpeed
        }
    });

    console.log(`\n✅ Successfully updated agent!`);
    console.log(`New voice: ${updatedAgent.voice}`);
    console.log(`New speed: ${updatedAgent.voiceSpeed}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
