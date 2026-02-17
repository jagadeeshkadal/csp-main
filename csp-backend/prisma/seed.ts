import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample AI agents
  const agents: any[] = [];

  // Helper function to escape JSON strings for system prompt if needed, 
  // but we are storing the whole object as a string, so JSON.stringify(value) is correct.

  try {
    // Read the first vendor prompts file
    const vendorPromptsPath = path.join(__dirname, '../agent-configs/All_Remaining_Vendor_System_Prompts.json');
    const vendorPromptsPath2 = path.join(__dirname, '../agent-configs/Agents_0026_to_0100_System_Prompts_UPDATED.json');
    const vendorPromptsPath3 = path.join(__dirname, '../agent-configs/SG_100_Agents_System_Prompts.json');

    // New batches
    const newBatch1 = path.join(__dirname, '../agent-configs/Singapore_B2B_Partnership_Agents.json');
    const newBatch2 = path.join(__dirname, '../agent-configs/Indonesia_Retail_Chains_First_30_CLEAN_DASH.json');
    const newBatch3 = path.join(__dirname, '../agent-configs/Indonesia_Distributors_First_30_PERCENT_FORMAT.json');
    const newBatch4 = path.join(__dirname, '../agent-configs/Malaysia_B2B_Partnership_Agents.json');

    // Strategic Collaboration Batches
    const stratCollab1 = path.join(__dirname, '../agent-configs/Singapore_Strategic_Collaboration_Agents.json');
    const stratCollab2 = path.join(__dirname, '../agent-configs/Malaysia_Strategic_Collaboration_Agents.json');
    const stratCollab3 = path.join(__dirname, '../agent-configs/Indonesia_Strategic_Collaboration_Agents.json');

    // Initialize an empty object to hold all vendor prompts
    let vendorPrompts: any = {};

    // Helper function to read and merge prompts
    const loadPrompts = (filePath: string) => {
      try {
        console.log(`Debug: Checking path: ${filePath}`);
        if (fs.existsSync(filePath)) {
          console.log(`Reading vendor prompts from: ${filePath}`);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(fileContent);
          // Check if data is wrapped in another object or array if needed, but assuming standard format k->v
          vendorPrompts = { ...vendorPrompts, ...data };
        } else {
          console.warn(`Warning: Vendor prompts file not found at ${filePath}`);
        }
      } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
      }
    };

    loadPrompts(vendorPromptsPath);
    loadPrompts(vendorPromptsPath2);
    loadPrompts(vendorPromptsPath3);
    loadPrompts(newBatch1);
    loadPrompts(newBatch2);
    loadPrompts(newBatch3);
    loadPrompts(newBatch4);
    loadPrompts(stratCollab1);
    loadPrompts(stratCollab2);
    loadPrompts(stratCollab3);

    if (Object.keys(vendorPrompts).length > 0) {
      const vendorAgents = Object.entries(vendorPrompts).map(([key, value]: [string, any]) => {
        const context = value.context || {};
        // Handle both schemas: vendor_profile (old) and organization_profile (new)
        const profile = context.vendor_profile || context.organization_profile || {};
        const identity = value.identity || {};

        // Extract fields based on available schema
        const name = profile.vendor_name || profile.organization_name || `Vendor ${key}`;

        // Location logic: explicit manufacturing location (old) OR just country (new)
        let location = "";
        if (profile.manufacturing_location) {
          location = `${profile.manufacturing_location}, ${profile.country || ''}`;
        } else {
          location = profile.country || "Unknown Location";
        }
        location = location.replace(/^, /, '').replace(/, $/, '');

        // Email logic
        const email = profile.contact_email || `${key.toLowerCase()}@example.com`;

        // Inject the formatting instruction to prevent explicit labels
        if (value.output_format) {
          value.output_format.formatting_instruction = "Do NOT explicitly label these sections (e.g., do not write 'Acknowledgement: ...'). Weave them into a cohesive professional email.";
        }

        return {
          name: name,
          description: `${identity.role || 'Sales Manager'} at ${identity.organization || 'Vendor'}`, // Create description from role + org
          location: location,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${(name).replace(/[^a-zA-Z0-9]/g, '')}`,
          systemPrompt: JSON.stringify(value),
          voice: 'bf_emma',
          voiceSpeed: 1,
          email: email,
          isActive: true, // Vendor agents are active
        };
      });
      console.log(`Found ${vendorAgents.length} vendor agents in JSON file.`);
      agents.push(...vendorAgents);
    } else {
      console.warn(`Warning: No vendor prompts found in any files.`);
    }
  } catch (error) {
    console.error('Error reading or processing vendor prompts file:', error);
  }

  // List of agent names that should remain active (the ones we just processed)
  const activeAgentNames = agents.map(a => a.name);

  for (const agent of agents) {
    const existing = await prisma.aIAgent.findFirst({
      where: {
        name: agent.name,
      },
    });

    if (!existing) {
      await prisma.aIAgent.create({
        data: {
          ...agent,
          deletedAt: null, // Explicitly set deletedAt to null
        },
      });
      console.log(`✅ Created agent: ${agent.name}`);
    } else {
      // Update existing agent to ensure deletedAt is null AND update voice fields + location
      const updateResult = await prisma.aIAgent.updateMany({
        where: {
          name: agent.name,
        },
        data: {
          deletedAt: null,
          location: agent.location || null,
          voice: agent.voice,
          voiceSpeed: agent.voiceSpeed,
          // @ts-ignore
          email: agent.email, // Update email
          systemPrompt: agent.systemPrompt, // Also update system prompt to ensure it's current
          isActive: true, // Ensure it's active
        },
      });
      console.log(`⏭️  Agent updated/activated: ${agent.name}`);
    }
  }

  // Deactivate all agents that are NOT in our activeAgentNames list
  console.log('Deactivating agents not in the vendor list...');
  const deactivateResult = await prisma.aIAgent.updateMany({
    where: {
      name: {
        notIn: activeAgentNames,
      },
      deletedAt: null, // Only deactivate those that are currently active/not deleted
    },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });

  if (deactivateResult.count > 0) {
    console.log(`🚫 Deactivated ${deactivateResult.count} old agents (set deletedAt and isActive=false)`);
  } else {
    console.log(`✅ No old agents needed deactivation.`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
