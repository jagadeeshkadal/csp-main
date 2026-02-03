import "dotenv/config";
import config from "./config/config.js";
import expressApp from "./gateway/index.js";
import "./config/firebase.js"; // Initialize Firebase Admin

import prisma from "./db/prisma.js";

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Successfully connected to MongoDB");

    expressApp.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

startServer();
