import { Request, Response } from "express";
import { userCore } from "../../core/auth/index.js";
import { BaseError } from "../../common/errors.js";

const ssoSignup = async (req: Request, res: Response) => {
    try {
        const { token, phoneNumber } = req.body;
        const result = await userCore.ssoSignup({ token, phoneNumber });
        res.status(200).json(result);
    } catch (e) {
        console.error("Error in auth controller:", e);
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
};

const signIn = async (req: Request, res: Response) => {
    console.time('signIn-controller-total');
    try {
        console.time('signIn-controller-body-parse');
        const { token } = req.body;
        console.timeEnd('signIn-controller-body-parse');

        console.time('signIn-controller-core-call');
        const result = await userCore.signIn({ token });
        console.timeEnd('signIn-controller-core-call');

        console.time('signIn-controller-response');
        res.status(200).json(result);
        console.timeEnd('signIn-controller-response');
    } catch (e) {
        console.time('signIn-controller-error');
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
        console.timeEnd('signIn-controller-error');
    }
    console.timeEnd('signIn-controller-total');
};

const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await userCore.getCurrentUser(token);
        res.status(200).json({ user });
    } catch (e) {
        console.error("Error in auth controller:", e);
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
};

const updateUser = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const result = await userCore.updateUser(token, req.body);
        res.status(200).json(result);
    } catch (e) {
        console.error("Error in auth controller:", e);
        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
};

export default { ssoSignup, signIn, getCurrentUser, updateUser };

