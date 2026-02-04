export default async (req: any, res: any) => {
    try {
        console.log("[Vercel Entry] 🚀 Starting dynamic import of backend...");

        // Dynamic import to catch initialization errors (like missing dependencies or Prisma crashes)
        await import("../csp-backend/src/config/firebase.js");
        await import("../csp-backend/src/db/prisma.js");
        const appModule = await import('../csp-backend/src/gateway/index.js');
        const app = appModule.default;

        console.log("[Vercel Entry] ✅ Backend imported successfully");

        // Forward request to Express app
        return app(req, res);
    } catch (error: any) {
        console.error("[Vercel Entry] ❌ CRASH DURING STARTUP:", error);

        return res.status(500).json({
            message: "Server Interal Error (Startup Crash)",
            error: error.message || String(error),
            stack: error.stack,
            details: "This error occurred while importing the backend modules."
        });
    }
};
