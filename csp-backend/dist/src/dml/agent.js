var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import prisma from "../db/prisma.js";
const createAgent = (agent) => __awaiter(void 0, void 0, void 0, function* () {
    const newAgent = yield prisma.aIAgent.create({
        data: Object.assign(Object.assign({}, agent), { deletedAt: null }),
    });
    return newAgent;
});
const getAgentById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const agent = yield prisma.aIAgent.findFirst({
        where: { id, deletedAt: null },
    });
    return agent;
});
const getAllAgents = () => __awaiter(void 0, void 0, void 0, function* () {
    const agents = yield prisma.aIAgent.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
    });
    return agents;
});
const getActiveAgents = () => __awaiter(void 0, void 0, void 0, function* () {
    const agents = yield prisma.aIAgent.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: { createdAt: 'desc' },
    });
    return agents;
});
const searchAgents = (searchTerm) => __awaiter(void 0, void 0, void 0, function* () {
    // MongoDB doesn't support case-insensitive search with 'mode', so we use regex
    const agents = yield prisma.aIAgent.findMany({
        where: {
            deletedAt: null,
            OR: [
                { name: { contains: searchTerm } },
                { description: { contains: searchTerm } },
            ],
        },
        orderBy: { createdAt: 'desc' },
    });
    // Filter case-insensitively in memory
    const lowerSearchTerm = searchTerm.toLowerCase();
    return agents.filter((agent) => agent.name.toLowerCase().includes(lowerSearchTerm) ||
        (agent.description && agent.description.toLowerCase().includes(lowerSearchTerm)));
});
const updateAgent = (id, agent) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedAgent = yield prisma.aIAgent.update({
        where: { id },
        data: agent,
    });
    return updatedAgent;
});
const deleteAgent = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const deletedAgent = yield prisma.aIAgent.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
    });
    return deletedAgent;
});
export const agentDML = {
    createAgent,
    getAgentById,
    getAllAgents,
    getActiveAgents,
    searchAgents,
    updateAgent,
    deleteAgent,
};
