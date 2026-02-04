import admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const credentialsPath = path.join(__dirname, "../../credentials/firebase-service-account.json");

    // 1. Try to load from credentials file (Local development)
    if (fs.existsSync(credentialsPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized from local credentials file");
    }
    // 2. Try to load from individual Environment Variables (Vercel / Production Standard)
    else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
      // Vercel/Env variables often have newlines as literal "\n" strings, we must fix them
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log("✅ Firebase Admin initialized from individual environment variables");
    }
    // 3. Fallback to full JSON string in Env Variable (Legacy/Optional)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT json string");
    }
    // 4. Fallback to Google Application Default Credentials (e.g. EC2 Role)
    else {
      admin.initializeApp();
      console.log("⚠️ Firebase Admin initialized with default application credentials (auto-discovery)");
    }
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error);
    // Do not throw here, let the app start, but auth routes will fail if called
  }
}

export default admin;
