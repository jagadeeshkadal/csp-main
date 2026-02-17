import { BadRequestError, UnauthorizedError } from "../../common/errors.js";
import { userDML } from "../../dml/user.js";
import { IUser } from "../../interfaces/index.js";
import { createToken, verifyToken } from "./hydrator.js";
import { z } from "zod";
import { Request, Response } from "express";
import firebaseAdmin from "../../config/firebase.js";
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
  teamNumber: z.string().optional(), // Or z.number().transform(String).optional() if frontend sends mixed types
  departmentName: z.string().optional(),
  avatar: z.string().nullable().optional(),
});

export const ssoSignup = async (params: { token: string; phoneNumber: string; teamNumber?: string; departmentName?: string; avatar?: string | null }) => {
  const parsed = ssoSignupSchema.safeParse(params);
  if (!parsed.success) {
    throw new BadRequestError("Invalid input", parsed.error.message);
  }

  const { token, phoneNumber, teamNumber, departmentName, avatar } = parsed.data;

  // Verify Firebase token
  const decoded = await firebaseAdmin.auth().verifyIdToken(token);
  console.log(`[ssoSignup] Decoded Token Claims - Picture: ${decoded.picture ? 'Found' : 'Missing'}, Email: ${decoded.email}, Name: ${decoded.name}`);


  // Check if user already exists by email (for Google sign-in) or phone number
  let user = null;

  // Try to find by email first (for Google users) - Normalize for comparison
  const normalizedEmail = decoded.email ? decoded.email.toLowerCase() : null;
  if (normalizedEmail) {
    console.log(`[ssoSignup] Looking up existing user by normalized email: ${normalizedEmail}`);
    user = await userDML.getUserByEmail(normalizedEmail);
  }

  // Also check by phone number if not found by email
  if (!user) {
    console.log(`[ssoSignup] User not found by email, checking by phone number: ${phoneNumber}`);
    user = await userDML.getUserByPhoneNumber(phoneNumber);
  }

  // IF USER EXISTS: Instead of throwing error, Just Log them In!
  if (user) {
    console.log(`[ssoSignup] User already exists (ID: ${user.id}). Syncing details and logging in.`);

    // Generate custom JWT
    const userIdString = String(user.id);
    const customJWT = await createToken(userIdString);

    // Update JWT and profile info if it's missing or different
    const updateData: any = { jwt: customJWT };

    // Sync email and name if they are missing or different
    if (normalizedEmail && user.email !== normalizedEmail) {
      console.log(`[ssoSignup] Syncing/Correcting email: ${user.email} -> ${normalizedEmail}`);
      updateData.email = normalizedEmail;
    }
    if (decoded.name && user.name !== decoded.name) {
      console.log(`[ssoSignup] Syncing name: ${user.name} -> ${decoded.name}`);
      updateData.name = decoded.name;
    }

    // Prioritize provided avatar, then token picture
    const newAvatar = avatar || decoded.picture;
    if (newAvatar && !user.avatar) {
      updateData.avatar = newAvatar;
    }

    if (teamNumber) updateData.teamNumber = teamNumber;
    if (departmentName) updateData.departmentName = departmentName;

    await userDML.updateUser(user.id, updateData);

    return { user: { ...user, ...updateData }, token: customJWT };
  }

  // Create new user - include avatar from Google photoURL if available
  user = await userDML.createUser({
    phoneNumber,
    phoneExtension: "+91", // Default
    email: normalizedEmail,
    name: decoded.name || null,
    avatar: null, // Force null as per user request
    teamNumber: teamNumber || null,
    departmentName: departmentName || null,
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
  const normalizedEmail = email ? email.toLowerCase() : null;

  console.log(`[signIn] Decoded token - Email (orig): ${email}, Email (norm): ${normalizedEmail}, Phone: ${phoneNumber}`);

  let user = null;

  console.time('signIn-db-lookup');
  try {
    // Try to find by email first (normalized)
    if (normalizedEmail) {
      console.log(`[signIn] Attempting DB lookup by email: "${normalizedEmail}"`);
      console.time('signIn-db-email');
      user = await userDML.getUserByEmail(normalizedEmail);
      console.timeEnd('signIn-db-email');
      console.log(`[signIn] Lookup by email result: ${user ? `Found user (ID: ${user.id})` : 'Not found'}`);
    }

    // If not found by email, try by phone number (Self-healing lookup)
    if (!user && phoneNumber) {
      console.log(`[signIn] Attempting DB lookup by phone number (fallback): "${phoneNumber}"`);
      console.time('signIn-db-phone');
      user = await userDML.getUserByPhoneNumber(phoneNumber);
      console.timeEnd('signIn-db-phone');

      if (user) {
        console.log(`[signIn] Found user by phone number. Syncing email: ${normalizedEmail}`);
        // If found by phone, sync the email immediately so next sign-in is faster/automatic
        if (normalizedEmail && user.email !== normalizedEmail) {
          await userDML.updateUser(user.id, { email: normalizedEmail });
        }
      }
    }
  } catch (err) {
    console.error("[signIn] Database lookup failed:", err);
    throw new Error("Database lookup failed during sign-in");
  }
  console.timeEnd('signIn-db-lookup');

  if (!user) {
    console.log('[signIn] User not found by email or phone. Access denied (Loop avoidance).');
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

export const updateUser = async (token: string, data: any) => {
  const decoded = await verifyToken(token);
  const userId = (decoded as any).userId;
  if (!userId) {
    throw new UnauthorizedError("Invalid token");
  }

  const updatedUser = await userDML.updateUser(String(userId), data);
  return { user: updatedUser };
};

export const userCore = {
  ssoSignup,
  signIn,
  getCurrentUser,
  updateUser,
};

