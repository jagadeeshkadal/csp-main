import { VercelRequest, VercelResponse } from '@vercel/node';

export default (req: VercelRequest, res: VercelResponse) => {
    res.status(200).json({
        status: 'ok',
        message: 'Backend function is reachable!',
        env: process.env.NODE_ENV,
        time: new Date().toISOString()
    });
};
