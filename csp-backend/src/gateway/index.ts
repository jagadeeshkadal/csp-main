import express, { NextFunction, Request, Response } from "express";
import routes from "./routes";
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
expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: true }));

// Logging middleware (before routes)
expressApp.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Mount routes at root
expressApp.use("/", routes);

// Log all registered routes for debugging
console.log("Routes registered:");
console.log("  GET  /test");
console.log("  POST /sso-signup");
console.log("  POST /sign-in");
console.log("  GET  /getUserData");
console.log("  GET  /agents");
console.log("  GET  /agents/search");
console.log("  GET  /agents/:id");
console.log("  POST /conversations");
console.log("  GET  /conversations");
console.log("  GET  /conversations/:id");
console.log("  POST /conversations/:id/voice");
console.log("  GET  /conversations/:id/voice");



export default expressApp;
