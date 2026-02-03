import express, { NextFunction, Request, Response } from "express";
import routes from "./routes.js";
import cors from "cors";

export const expressApp = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : true, // Allow all origins by default if not specified, for easier deployment
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

expressApp.use(cors(corsOptions));
expressApp.use(express.json({ limit: "50mb" }));
expressApp.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Logging middleware (before routes)
expressApp.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Mount routes at root
// Mount routes (handle both root and /api prefix for Vercel)
expressApp.use("/api", routes);
expressApp.use("/", routes);

// Log all registered routes for debugging
console.log("Routes registered:");
console.log("  GET  /test");
console.log("  POST /sso-signup");
console.log("  POST /sign-in");
console.log("  GET  /getUserData");
console.log("  PUT  /users/profile   <-- NEW");
console.log("  GET  /agents");
console.log("  GET  /agents/search");
console.log("  GET  /agents/:id");
console.log("  POST /conversations");
console.log("  GET  /conversations");
console.log("  GET  /conversations/:id");
console.log("  POST /conversations/:id/voice");
console.log("  GET  /conversations/:id/voice");

export default expressApp;
