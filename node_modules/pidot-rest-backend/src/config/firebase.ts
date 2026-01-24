import * as firebaseAdmin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

// Initialize Firebase Admin if not already initialized
if (!firebaseAdmin.apps.length) {
  const credentialsPath = path.join(__dirname, "../../credentials/firebase-service-account.json");
  
  // Try to load from credentials folder first
  if (fs.existsSync(credentialsPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized from credentials file");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Fallback to environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized from environment variable");
  } else if (process.env.FIREBASE_PROJECT_ID) {
    // Fallback to project ID only
    firebaseAdmin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log("Firebase Admin initialized with project ID");
  } else {
    // Last resort: try default credentials
    try {
      firebaseAdmin.initializeApp();
      console.log("Firebase Admin initialized with default credentials");
    } catch (error) {
      console.error("Firebase Admin initialization failed:", error);
      console.error("Please provide credentials in one of these ways:");
      console.error("1. Place firebase-service-account.json in credentials/ folder");
      console.error("2. Set FIREBASE_SERVICE_ACCOUNT environment variable");
      console.error("3. Set FIREBASE_PROJECT_ID environment variable");
    }
  }
}

export default firebaseAdmin;
