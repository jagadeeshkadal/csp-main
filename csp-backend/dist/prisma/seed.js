var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Seeding database...');
        // Create sample AI agents
        const agents = [
            {
                name: 'Email Assistant',
                description: 'Helps you write professional emails and manage your inbox efficiently',
                avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=EmailAssistant',
                systemPrompt: 'You are a helpful email assistant that helps users write clear, professional emails. Always maintain a polite and professional tone.',
                isActive: true,
            },
            {
                name: 'Code Helper',
                description: 'Assists with programming questions, debugging, and code reviews',
                avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CodeHelper',
                systemPrompt: 'You are an expert programmer that helps users with coding questions, debugging, and code reviews. Provide clear explanations and best practices.',
                isActive: true,
            },
            {
                name: 'Writing Assistant',
                description: 'Helps improve your writing, grammar, and creative content',
                avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=WritingAssistant',
                systemPrompt: 'You are a writing assistant that helps users improve their writing, grammar, and style. Be encouraging and constructive in your feedback.',
                isActive: true,
            },
            {
                name: 'Customer Support',
                description: 'Handles customer inquiries and provides friendly support',
                avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CustomerSupport',
                systemPrompt: 'You are a friendly customer support agent that helps resolve customer issues efficiently and politely. Always aim to provide solutions.',
                isActive: true,
            },
            {
                name: 'Data Analyst',
                description: 'Analyzes data, creates reports, and provides insights',
                avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DataAnalyst',
                systemPrompt: 'You are a data analyst that helps users understand and analyze their data. Provide clear insights and actionable recommendations.',
                isActive: true,
            },
            {
                name: 'Marketing Expert',
                description: 'Helps with marketing strategies, campaigns, and content ideas',
                avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=MarketingExpert',
                systemPrompt: 'You are a marketing expert that helps users create effective marketing strategies, campaigns, and content. Focus on ROI and engagement.',
                isActive: true,
            },
            {
                name: 'Product Manager',
                description: 'Assists with product planning, roadmaps, and feature ideas',
                avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ProductManager',
                systemPrompt: 'You are a product manager that helps users plan products, create roadmaps, and prioritize features. Focus on user needs and business value.',
                isActive: true,
            },
            {
                name: 'Design Consultant',
                description: 'Provides design feedback and creative suggestions',
                avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DesignConsultant',
                systemPrompt: 'You are a design consultant that helps users improve their designs. Provide constructive feedback on UX, UI, and visual design principles.',
                isActive: true,
            },
        ];
        for (const agent of agents) {
            const existing = yield prisma.aIAgent.findFirst({
                where: {
                    name: agent.name,
                    deletedAt: null
                },
            });
            if (!existing) {
                yield prisma.aIAgent.create({
                    data: Object.assign(Object.assign({}, agent), { deletedAt: null }),
                });
                console.log(`✅ Created agent: ${agent.name}`);
            }
            else {
                // Update existing agent to ensure deletedAt is null
                yield prisma.aIAgent.updateMany({
                    where: {
                        name: agent.name,
                    },
                    data: {
                        deletedAt: null,
                    },
                });
                console.log(`⏭️  Agent already exists: ${agent.name} (ensured deletedAt: null)`);
            }
        }
        // Update all existing agents to ensure deletedAt is null (for agents that might have it set)
        const updateResult = yield prisma.aIAgent.updateMany({
            where: {
                deletedAt: { not: null }, // Only update agents where deletedAt is not null
            },
            data: {
                deletedAt: null,
            },
        });
        if (updateResult.count > 0) {
            console.log(`✅ Updated ${updateResult.count} existing agents to set deletedAt: null`);
        }
        else {
            console.log(`✅ All agents already have deletedAt: null`);
        }
        console.log('Seeding completed!');
    });
}
main()
    .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
