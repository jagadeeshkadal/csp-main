import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { userDML } from "../../dml/user.js";
import { User } from "@prisma/client";

interface AuthenticatedRequest extends Request {
    user: User;
}

export const isAuthenticated = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const secret = process.env.JWT_SECRET || 'default_secret'; // Fallback or strict check
        const decoded = jwt.verify(token, secret) as { id: string };
        const user = await userDML.getUserById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.user = user as User;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}