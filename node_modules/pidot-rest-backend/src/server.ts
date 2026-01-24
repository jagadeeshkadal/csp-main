import config from "./config/config";
import expressApp from "./gateway";
import "./config/firebase"; // Initialize Firebase Admin

import prisma from "./db/prisma";

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
