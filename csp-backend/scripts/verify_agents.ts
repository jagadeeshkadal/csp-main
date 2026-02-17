import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

async function main() {
    // 1. Load Expected IDs from JSON files
    const file1Path = path.join(__dirname, '../agent-configs/All_Remaining_Vendor_System_Prompts.json');
    const file2Path = path.join(__dirname, '../agent-configs/Agents_0026_to_0100_System_Prompts_UPDATED.json');
    const file3Path = path.join(__dirname, '../agent-configs/SG_100_Agents_System_Prompts.json');

    // New batches
    const file4Path = path.join(__dirname, '../agent-configs/Singapore_B2B_Partnership_Agents.json');
    const file5Path = path.join(__dirname, '../agent-configs/Indonesia_Retail_Chains_First_30_CLEAN_DASH.json');
    const file6Path = path.join(__dirname, '../agent-configs/Indonesia_Distributors_First_30_PERCENT_FORMAT.json');
    const file7Path = path.join(__dirname, '../agent-configs/Malaysia_B2B_Partnership_Agents.json');

    // Strategic Collaboration Batches
    const stratCollab1Path = path.join(__dirname, '../agent-configs/Singapore_Strategic_Collaboration_Agents.json');
    const stratCollab2Path = path.join(__dirname, '../agent-configs/Malaysia_Strategic_Collaboration_Agents.json');
    const stratCollab3Path = path.join(__dirname, '../agent-configs/Indonesia_Strategic_Collaboration_Agents.json');

    const loadAgents = (filePath: string) => {
        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                return JSON.parse(content);
            }
            return {};
        } catch (e) {
            console.error(`Error reading ${filePath}:`, e);
            return {};
        }
    };

    const agents1 = loadAgents(file1Path);
    const agents2 = loadAgents(file2Path);
    const agents3 = loadAgents(file3Path);
    const agents4 = loadAgents(file4Path);
    const agents5 = loadAgents(file5Path);
    const agents6 = loadAgents(file6Path);
    const agents7 = loadAgents(file7Path);
    const stratAgents1 = loadAgents(stratCollab1Path);
    const stratAgents2 = loadAgents(stratCollab2Path);
    const stratAgents3 = loadAgents(stratCollab3Path);

    // Merge all expected data
    const allExpectedIds = new Set<string>();

    const extractIds = (data: any) => {
        Object.keys(data).forEach(key => {
            const context = data[key]?.context || {};
            const profile = context.vendor_profile || context.organization_profile || {};
            const id = profile?.vendor_id || key;
            allExpectedIds.add(id);
        });
    };

    extractIds(agents1);
    extractIds(agents2);
    extractIds(agents3);
    extractIds(agents4);
    extractIds(agents5);
    extractIds(agents6);
    extractIds(agents7);
    extractIds(stratAgents1);
    extractIds(stratAgents2);
    extractIds(stratAgents3);

    console.log(`Expected Total Unique IDs from Files: ${allExpectedIds.size}`);

    // 2. Fetch Active Agents from DB
    const activeAgents = await prisma.aIAgent.findMany({
        where: { deletedAt: null },
        select: { name: true, systemPrompt: true }
    });

    const createdIds = new Set<string>();
    const createdNames = new Set<string>();
    const idToNameMap = new Map<string, string>();

    activeAgents.forEach(agent => {
        if (agent.systemPrompt) {
            try {
                const prompt = JSON.parse(agent.systemPrompt);
                const context = prompt.context || {};
                const profile = context.vendor_profile || context.organization_profile || {};
                const vid = profile?.vendor_id || Object.keys(prompt)[0]; // Fallback might be tricky if structure differs, but let's try vendor_id first

                // If vendor_id is not in profile, we might need to rely on the key from the file. 
                // But we don't have the file key here easily unless it was stored.
                // However, for new agents, the key IS the ID (e.g. MYS-RC-001). 
                // In the seed script, we didn't explicitly store the ID if it wasn't in vendor_profile.
                // IMPORTANT: The seed script uses `name` as unique key.
                // We need to match back to ID.

                // Let's try to find if the agent name matches any name in our loaded files to find the ID.
                let matchedId = vid;

                if (!matchedId) {
                    // Try to match by name in our loaded data
                    // This is expensive but necessary for verification
                    // We will do this mapping later if needed, but for now let's collect what we can.
                }

                if (matchedId) {
                    createdIds.add(matchedId);
                    idToNameMap.set(matchedId, agent.name);
                }
            } catch (e) {
                // ignore parse errors
            }
        }
        createdNames.add(agent.name);
    });

    // RE-SCAN for IDs based on Name Matching because systemPrompt might not have the ID in the exact field we expect for new schema
    // and we want to verify against `allExpectedIds`.

    // Build a Name -> ID map from expected data
    const nameToExpectedId = new Map<string, string>();
    const promptToId = (data: any) => {
        Object.keys(data).forEach(key => {
            const context = data[key]?.context || {};
            const profile = context.vendor_profile || context.organization_profile || {};
            const name = profile?.vendor_name || profile?.organization_name;
            const id = profile?.vendor_id || key;
            if (name) nameToExpectedId.set(name, id);
        });
    }
    promptToId(agents1);
    promptToId(agents2);
    promptToId(agents3);
    promptToId(agents4);
    promptToId(agents5);
    promptToId(agents6);
    promptToId(agents7);

    // Now populate createdIds based on activeAgents names
    activeAgents.forEach(agent => {
        const id = nameToExpectedId.get(agent.name);
        if (id) {
            createdIds.add(id);
            idToNameMap.set(id, agent.name);
        }
    });

    console.log(`Total Active Agents in DB: ${activeAgents.length}`);
    console.log(`Total APIs (Vendor IDs) found in DB: ${createdIds.size}`);

    // 3. Compare
    const missingIds = [...allExpectedIds].filter(id => !createdIds.has(id));
    const presentIds = [...createdIds].sort();

    console.log('\n--- MISSING AGENTS (IDs) ---');
    if (missingIds.length === 0) {
        console.log("NONE. All expected agents were created.");
    } else {
        missingIds.forEach(id => console.log(id));
    }

    console.log('\n--- CREATED AGENTS (IDs) ---');
    const grouped: Record<string, string[]> = {};
    presentIds.forEach(id => {
        const prefix = id.split('-')[0];
        if (!grouped[prefix]) grouped[prefix] = [];
        grouped[prefix].push(id);
    });

    Object.keys(grouped).forEach(prefix => {
        console.log(`\nPrefix: ${prefix} (${grouped[prefix].length} agents)`);
        const nums = grouped[prefix].map(id => {
            const parts = id.split('-');
            if (parts.length > 1 && !isNaN(parseInt(parts[1]))) return parseInt(parts[1]);
            // Try last part
            const last = parts[parts.length - 1];
            if (!isNaN(parseInt(last))) return parseInt(last);
            return 0;
        }).sort((a, b) => a - b);

        if (nums.length > 0) {
            // simplified range display
            console.log(`Examples: ${grouped[prefix].slice(0, 3).join(', ')} ...`);
        }
    });

    // 4. Check for overwritten/duplicate names issue
    console.log('\n--- POTENTIAL NAME COLLISIONS ---');
    const nameToIdsMap = new Map<string, string[]>();

    const mapNames = (data: any, source: string) => {
        Object.keys(data).forEach(key => {
            const context = data[key]?.context || {};
            const profile = context.vendor_profile || context.organization_profile || {};
            const name = profile?.vendor_name || profile?.organization_name;
            const id = profile?.vendor_id || key;

            if (name) {
                const existing = nameToIdsMap.get(name) || [];
                existing.push(`${id} (${source})`);
                nameToIdsMap.set(name, existing);
            }
        });
    };

    mapNames(agents1, 'All_Remaining');
    mapNames(agents2, 'Agents_026-100');
    mapNames(agents3, 'SG_100');
    mapNames(agents4, 'SG_B2B');
    mapNames(agents5, 'IDN_Retail');
    mapNames(agents6, 'IDN_Distributors');
    mapNames(agents7, 'MYS_B2B');

    // Check conflicts
    let conflictCount = 0;

    nameToIdsMap.forEach((ids, name) => {
        if (ids.length > 1) {
            // Filter out same ID appearing multiple times (if any)
            const uniqueIds = [...new Set(ids.map(i => i.split(' ')[0]))];
            if (uniqueIds.length > 1) {
                conflictCount++;
                console.log(`Name "${name}" is used by multiple IDs: ${ids.join(', ')}`);
                const winnerId = [...idToNameMap.entries()].find(([k, v]) => v === name)?.[0];
                console.log(`   -> Active in DB as ID: ${winnerId}`);
            }
        }
    });

    // Write full list to a file for easy reading
    const reportPath = path.join(__dirname, 'agent_report_full.txt');
    const fileContent = [
        '--- CREATED AGENTS (IDs) ---',
        ...presentIds,
        '',
        '--- MISSING AGENTS (IDs) ---',
        ...(missingIds.length > 0 ? missingIds : ['NONE']),
        '',
        '--- DUPLICATE/OVERWRITTEN AGENTS ---',
        // Name collisions
        ...Array.from(nameToIdsMap.entries())
            .filter(([name, ids]) => ids.length > 1)
            .map(([name, ids]) => {
                const winnerId = [...idToNameMap.entries()].find(([k, v]) => v === name)?.[0];
                return `Name "${name}" shared by IDs: ${ids.join(', ')} -> Active in DB as ID: ${winnerId}`;
            })
    ].join('\n');

    fs.writeFileSync(reportPath, fileContent);
    console.log(`Full report written to: ${reportPath}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
