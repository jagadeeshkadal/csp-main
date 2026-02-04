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
        console.log('[signIn] Request received');
        console.time('signIn-controller-body-parse');
        const { token } = req.body;
        console.timeEnd('signIn-controller-body-parse');

        if (!token) {
            console.error('[signIn] No token provided in body');
            return res.status(400).json({ message: "Token is required" });
        }

        console.time('signIn-controller-core-call');
        console.log('[signIn] Calling userCore.signIn...');
        const result = await userCore.signIn({ token });
        console.timeEnd('signIn-controller-core-call');
        console.log('[signIn] userCore.signIn successful');

        console.time('signIn-controller-response');
        res.status(200).json(result);
        console.timeEnd('signIn-controller-response');
    } catch (e) {
        console.time('signIn-controller-error');
        console.error('[signIn] CONTROLLER ERROR:', e);

        const errorMessage = e instanceof Error ? e.message : String(e);
        const errorStack = e instanceof Error ? e.stack : undefined;

        console.error('[signIn] Error Message:', errorMessage);
        console.error('[signIn] Error Stack:', errorStack);

        if (e instanceof BaseError) {
            res.status(e.status).json({ message: e.message });
        } else {
            // Return actual error details for debugging (temporarily)
            res.status(500).json({
                message: "Internal server error during sign-in",
                error: errorMessage,
                details: errorStack
            });
        }
        console.timeEnd('signIn-controller-error');
    }
    console.timeEnd('signIn-controller-total');
};

const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && typeof authHeader === 'string' ? authHeader.split(" ")[1] : undefined;
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
        const authHeader = req.headers.authorization;
        const token = authHeader && typeof authHeader === 'string' ? authHeader.split(" ")[1] : undefined;
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

