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
const createUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    // Explicitly set deletedAt to null to ensure it's not undefined
    const newUser = yield prisma.user.create({
        data: Object.assign(Object.assign({}, user), { deletedAt: null }),
    });
    return newUser;
});
const getUserByPhoneNumber = (phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    console.time('db-getUserByPhoneNumber');
    const user = yield prisma.user.findFirst({
        where: { phoneNumber, deletedAt: null },
    });
    console.timeEnd('db-getUserByPhoneNumber');
    return user;
});
const getUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    console.time('db-getUserByEmail');
    const user = yield prisma.user.findFirst({
        where: { email, deletedAt: null },
    });
    console.timeEnd('db-getUserByEmail');
    return user;
});
const getUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[getUserById] Looking up user with ID: ${id} (type: ${typeof id})`);
    // First try to find user with deletedAt: null
    let user = yield prisma.user.findFirst({
        where: { id, deletedAt: null },
    });
    // If not found, try without deletedAt filter (for backwards compatibility with users that don't have deletedAt set)
    if (!user) {
        console.log(`[getUserById] User not found with deletedAt: null, trying without filter`);
        const userWithoutFilter = yield prisma.user.findFirst({
            where: { id },
        });
        // If user exists but has deletedAt set (not null), return null
        if (userWithoutFilter && userWithoutFilter.deletedAt) {
            console.log(`[getUserById] User found but is deleted: ${userWithoutFilter.id}`);
            return null;
        }
        user = userWithoutFilter;
    }
    console.log(`[getUserById] User lookup result: ${user ? `found user ${user.id}` : 'not found'}`);
    return user;
});
const updateUser = (id, user) => __awaiter(void 0, void 0, void 0, function* () {
    console.time('db-updateUser');
    const updatedUser = yield prisma.user.update({
        where: { id },
        data: user,
    });
    console.timeEnd('db-updateUser');
    return updatedUser;
});
const deleteUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const deletedUser = yield prisma.user.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
    });
    return deletedUser;
});
export const userDML = {
    createUser,
    getUserByPhoneNumber,
    getUserByEmail,
    getUserById,
    updateUser,
    deleteUser,
};
