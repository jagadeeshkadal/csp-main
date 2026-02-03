var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { BadRequestError, NotFoundError } from "../../common/errors.js";
import { agentDML } from "../../dml/agent.js";
import { z } from "zod";
const createAgentSchema = z.object({
    name: z.string().min(1, "Agent name is required"),
    description: z.string().optional().nullable(),
    avatar: z.string().url().optional().nullable(),
    systemPrompt: z.string().optional().nullable(),
    isActive: z.boolean().optional().default(true),
});
export const createAgent = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = createAgentSchema.safeParse(params);
    if (!parsed.success) {
        throw new BadRequestError("Invalid input", parsed.error.message);
    }
    return yield agentDML.createAgent(parsed.data);
});
export const getAgent = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const agent = yield agentDML.getAgentById(id);
    if (!agent) {
        throw new NotFoundError("Agent not found");
    }
    return agent;
});
export const getAllAgents = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield agentDML.getActiveAgents();
});
export const searchAgents = (searchTerm) => __awaiter(void 0, void 0, void 0, function* () {
    if (!searchTerm || searchTerm.trim().length === 0) {
        return yield agentDML.getActiveAgents();
    }
    return yield agentDML.searchAgents(searchTerm.trim());
});
export const updateAgent = (id, params) => __awaiter(void 0, void 0, void 0, function* () {
    const agent = yield agentDML.getAgentById(id);
    if (!agent) {
        throw new NotFoundError("Agent not found");
    }
    const updatedAgent = yield agentDML.updateAgent(id, params);
    if (!updatedAgent) {
        throw new NotFoundError("Failed to update agent");
    }
    return updatedAgent;
});
export const deleteAgent = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const agent = yield agentDML.getAgentById(id);
    if (!agent) {
        throw new NotFoundError("Agent not found");
    }
    yield agentDML.deleteAgent(id);
});
export const agentCore = {
    createAgent,
    getAgent,
    getAllAgents,
    searchAgents,
    updateAgent,
    deleteAgent,
};
