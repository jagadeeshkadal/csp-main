var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from "jsonwebtoken";
export const createToken = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    console.time('createToken-jwt-sign');
    const token = jwt.sign({ userId }, process.env.JWT_SECRET || "", { expiresIn: "5d" });
    console.timeEnd('createToken-jwt-sign');
    return token;
});
export const verifyToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "");
    return decoded;
});
