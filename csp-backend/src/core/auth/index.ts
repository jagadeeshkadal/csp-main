import { BadRequestError, UnauthorizedError } from "../../common/errors.js";
import { userDML } from "../../dml/user.js";
import { IUser } from "../../interfaces/index.js";
import { createToken, verifyToken } from "./hydrator.js";
import { z } from "zod";
import { Request, Response } from "express";
import firebaseAdmin from "../../config/firebase";
interface AuthenticatedRequest extends Request {
  user?: any;
}

export const checkAuth = async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError("Unauthorized");
    }

    // Verify Firebase token
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);

    // Extract phone number from Firebase token (phone_number is in the claims)
    const phoneNumber = decoded.phone_number;
    if (!phoneNumber) {
      throw new UnauthorizedError("Phone number not found in token");
    }

    // Find user by phone number
    let user = await userDML.getUserByPhoneNumber(phoneNumber);

    // If user doesn't exist, create one
    if (!user) {
      user = await userDML.createUser({
        phoneNumber,
        phoneExtension: "+91", // Default, can be extracted from phone number if needed
      });
    }

    // Generate custom JWT
    const customJWT = await createToken(user.id);

    // Store JWT in database
    await userDML.updateUser(user.id, { jwt: customJWT });

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

const ssoSignupSchema = z.object({
  token: z.string().min(1, "Firebase token is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

export const ssoSignup = async (params: { token: string; phoneNumber: string }) => {
  const parsed = ssoSignupSchema.safeParse(params);
  if (!parsed.success) {
    throw new BadRequestError("Invalid input", parsed.error.message);
  }

  const { token, phoneNumber } = parsed.data;

  // Verify Firebase token
  const decoded = await firebaseAdmin.auth().verifyIdToken(token);

  // Check if user already exists by email (for Google sign-in) or phone number
  let user = null;

  // Try to find by email first (for Google users)
  if (decoded.email) {
    user = await userDML.getUserByEmail(decoded.email);
  }

  // Also check by phone number
  if (!user) {
    user = await userDML.getUserByPhoneNumber(phoneNumber);
  }

  // IF USER EXISTS: Instead of throwing error, Just Log them In!
  if (user) {
    console.log(`[ssoSignup] User already exists (ID: ${user.id}). logging in instead of error.`);

    // Generate custom JWT
    const userIdString = String(user.id);
    const customJWT = await createToken(userIdString);

    // Update JWT
    await userDML.updateUser(user.id, { jwt: customJWT });

    return { user, token: customJWT };
  }

  // Create new user
  user = await userDML.createUser({
    phoneNumber,
    phoneExtension: "+91", // Default, can be extracted from phone number if needed
    email: decoded.email || null,
    name: decoded.name || null,
  });

  // Generate custom JWT - ensure userId is a string
  const userIdString = String(user.id);
  console.log(`[ssoSignup] Creating JWT token for userId: ${userIdString} (original type: ${typeof user.id})`);
  const customJWT = await createToken(userIdString);

  // Store JWT in database
  await userDML.updateUser(user.id, { jwt: customJWT });

  console.log(`[ssoSignup] User created successfully with ID: ${user.id}`);
  return { user, token: customJWT };
};

const signInSchema = z.object({
  token: z.string().min(1, "Firebase token is required"),
});

export const signIn = async (params: { token: string }) => {
  console.time('signIn-total');

  console.time('signIn-validation');
  const parsed = signInSchema.safeParse(params);
  if (!parsed.success) {
    console.timeEnd('signIn-validation');
    throw new BadRequestError("Invalid input", parsed.error.message);
  }
  console.timeEnd('signIn-validation');

  const { token } = parsed.data;

  console.time('signIn-firebase-verify');
  // Verify Firebase token
  let decoded;
  try {
    decoded = await firebaseAdmin.auth().verifyIdToken(token); // Removed checkRevoked=true to avoid potential permission/network issues
  } catch (err) {
    console.error("[signIn] Firebase verifyIdToken failed:", err);
    throw new UnauthorizedError("Invalid token");
  }
  console.timeEnd('signIn-firebase-verify');

  const phoneNumber = decoded.phone_number;
  const email = decoded.email;

  console.log(`[signIn] Decoded token - Email: ${email}, Phone: ${phoneNumber}`);

  let user = null;

  console.time('signIn-db-lookup');
  try {
    // Try to find by email first (for Google sign-in users) - most common case
    if (email) {
      console.log(`[signIn] Looking up user by email: ${email}`);
      console.time('signIn-db-email');
      user = await userDML.getUserByEmail(email);
      console.timeEnd('signIn-db-email');
      console.log(`[signIn] User lookup by email result: ${user ? user.id : 'not found'}`);
    } else {
      console.log('[signIn] No email found in token');
    }

    // If not found and we have phone number, try by phone number (for phone auth users)
    if (!user && phoneNumber) {
      console.time('signIn-db-phone');
      user = await userDML.getUserByPhoneNumber(phoneNumber);
      console.timeEnd('signIn-db-phone');
    }
  } catch (err) {
    console.error("[signIn] DB lookup failed:", err);
    throw new Error("Database lookup failed");
  }
  console.timeEnd('signIn-db-lookup');

  if (!user) {
    console.log('[signIn] User not found, throwing 401');
    console.timeEnd('signIn-total');
    throw new UnauthorizedError("User not found. Please sign up first.");
  }

  console.time('signIn-jwt-generation');
  // Generate custom JWT
  const customJWT = await createToken(user.id);
  console.timeEnd('signIn-jwt-generation');

  console.time('signIn-db-update');
  // Store JWT in database
  await userDML.updateUser(user.id, { jwt: customJWT });
  console.timeEnd('signIn-db-update');

  console.timeEnd('signIn-total');
  console.log('✅ Sign-in completed successfully');
  return { user, token: customJWT };
};

export const getCurrentUser = async (token: string) => {
  try {
    console.log('[getCurrentUser] Verifying token...');
    // Verify JWT token
    const decoded = await verifyToken(token);
    console.log('[getCurrentUser] Token decoded successfully');

    // Extract userId from decoded token
    const userId = (decoded as any).userId;
    console.log(`[getCurrentUser] Extracted userId from token: ${userId} (type: ${typeof userId})`);

    if (!userId) {
      console.error('[getCurrentUser] No userId found in token');
      throw new UnauthorizedError("Invalid token");
    }

    // Convert to string for MongoDB comparison (ObjectId might be different type)
    const userIdString = String(userId);
    console.log(`[getCurrentUser] Looking up user with ID: ${userIdString}`);

    // Get user from database
    const user = await userDML.getUserById(userIdString);

    if (!user) {
      console.error(`[getCurrentUser] User not found in database for userId: ${userIdString}`);
      throw new UnauthorizedError("User not found");
    }

    console.log(`[getCurrentUser] User found: ${user.id} (type: ${typeof user.id})`);
    return user;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      console.error(`[getCurrentUser] UnauthorizedError: ${error.message}`);
      throw error;
    }
    console.error('[getCurrentUser] Unexpected error:', error);
    throw new UnauthorizedError("Invalid token");
  }
};

export const userCore = {
  ssoSignup,
  signIn,
  getCurrentUser,
};
