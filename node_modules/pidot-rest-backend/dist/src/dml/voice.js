var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import prisma from "../db/prisma";
const createVoiceExchange = (exchange) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if voiceExchange model exists in Prisma client
    if (!prisma.voiceExchange) {
        throw new Error("VoiceExchange model not found in Prisma client. Please run 'npm run generate' to regenerate the Prisma client.");
    }
    const newExchange = yield prisma.voiceExchange.create({
        data: exchange,
    });
    return newExchange;
});
const getVoiceExchangeById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const exchange = yield prisma.voiceExchange.findFirst({
        where: { id },
        include: {
            conversation: {
                include: {
                    agent: true,
                },
            },
        },
    });
    return exchange;
});
const getVoiceExchangesByConversationId = (conversationId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!prisma.voiceExchange) {
        throw new Error("VoiceExchange model not found in Prisma client. Please run 'npm run generate' to regenerate the Prisma client.");
    }
    const exchanges = yield prisma.voiceExchange.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
    });
    return exchanges;
});
const updateVoiceExchange = (id, exchange) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedExchange = yield prisma.voiceExchange.update({
        where: { id },
        data: exchange,
    });
    return updatedExchange;
});
export const voiceDML = {
    createVoiceExchange,
    getVoiceExchangeById,
    getVoiceExchangesByConversationId,
    updateVoiceExchange,
};
