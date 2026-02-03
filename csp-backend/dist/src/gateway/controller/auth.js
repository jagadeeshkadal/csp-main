var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { userCore } from "../../core/auth/index.js";
import { BaseError } from "../../common/errors.js";
const ssoSignup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, phoneNumber } = req.body;
        const result = yield userCore.ssoSignup({ token, phoneNumber });
        res.status(200).json(result);
    }
    catch (e) {
        console.error("Error in auth controller:", e);
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
const signIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.time('signIn-controller-total');
    try {
        console.time('signIn-controller-body-parse');
        const { token } = req.body;
        console.timeEnd('signIn-controller-body-parse');
        console.time('signIn-controller-core-call');
        const result = yield userCore.signIn({ token });
        console.timeEnd('signIn-controller-core-call');
        console.time('signIn-controller-response');
        res.status(200).json(result);
        console.timeEnd('signIn-controller-response');
    }
    catch (e) {
        console.time('signIn-controller-error');
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
        console.timeEnd('signIn-controller-error');
    }
    console.timeEnd('signIn-controller-total');
});
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = yield userCore.getCurrentUser(token);
        res.status(200).json({ user });
    }
    catch (e) {
        console.error("Error in auth controller:", e);
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = yield userCore.updateUser(token, req.body);
        res.status(200).json(result);
    }
    catch (e) {
        console.error("Error in auth controller:", e);
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
export default { ssoSignup, signIn, getCurrentUser, updateUser };
