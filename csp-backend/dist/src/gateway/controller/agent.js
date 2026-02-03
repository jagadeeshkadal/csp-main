var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { agentCore } from "../../core/agent/index.js";
import { BaseError } from "../../common/errors.js";
const getAllAgents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const agents = yield agentCore.getAllAgents();
        res.status(200).json({ agents });
    }
    catch (e) {
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
const searchAgents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchTerm = req.query.q || "";
        const agents = yield agentCore.searchAgents(searchTerm);
        res.status(200).json({ agents });
    }
    catch (e) {
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
const getAgent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const agent = yield agentCore.getAgent(id);
        res.status(200).json({ agent });
    }
    catch (e) {
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
const createAgent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, avatar, systemPrompt, isActive } = req.body;
        const agent = yield agentCore.createAgent({
            name,
            description,
            avatar,
            systemPrompt,
            isActive,
        });
        res.status(201).json({ agent });
    }
    catch (e) {
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
const updateAgent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description, avatar, systemPrompt, isActive } = req.body;
        const agent = yield agentCore.updateAgent(id, {
            name,
            description,
            avatar,
            systemPrompt,
            isActive,
        });
        res.status(200).json({ agent });
    }
    catch (e) {
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
const deleteAgent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield agentCore.deleteAgent(id);
        res.status(200).json({ message: "Agent deleted successfully" });
    }
    catch (e) {
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
export default {
    getAllAgents,
    searchAgents,
    getAgent,
    createAgent,
    updateAgent,
    deleteAgent,
};
