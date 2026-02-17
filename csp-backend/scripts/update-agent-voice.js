import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('Usage: node scripts/update-agent-voice.js "Agent Name" "voice_id" [speed]');
        console.log('Example: node scripts/update-agent-voice.js "Polycarbonate" "af_bella" 1.0');
        process.exit(1);
    }

    const agentName = args[0];
    const targetVoice = args[1];
    const targetSpeed = args[2] ? parseFloat(args[2]) : 1.0;

    console.log(`Searching for agent containing: "${agentName}"...`);

    const agents = await prisma.aIAgent.findMany({
        where: {
            name: { contains: agentName, mode: 'insensitive' },
            deletedAt: null
        }
    });

    if (agents.length === 0) {
        console.error(`❌ No agents found matching "${agentName}"!`);
        process.exit(1);
    }

    if (agents.length > 1) {
        console.warn(`⚠️  Found ${agents.length} agents matching "${agentName}". Updating the first one.`);
        agents.forEach(a => console.log(`   - ${a.name} (${a.id})`));
    }

    const agent = agents[0];
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
