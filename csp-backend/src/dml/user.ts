import prisma from "../db/prisma.js";
import { IUser } from "../interfaces/index.js";

type UserCreateData = {
  phoneNumber: string;
  phoneExtension?: string;
  name?: string | null;
  email?: string | null;
  jwt?: string | null;
  deletedAt?: Date | null;
};

type UserUpdateData = {
  phoneNumber?: string;
  phoneExtension?: string;
  name?: string | null;
  email?: string | null;
  jwt?: string | null;
  deletedAt?: Date | null;
};

const createUser = async (user: UserCreateData): Promise<IUser> => {
  // Explicitly set deletedAt to null to ensure it's not undefined
  const newUser = await prisma.user.create({
    data: {
      ...user,
      deletedAt: null, // Explicitly set to null for new users
    },
  });
  return newUser as IUser;
};

const getUserByPhoneNumber = async (phoneNumber: string): Promise<IUser | null> => {
  console.time('db-getUserByPhoneNumber');
  const user = await prisma.user.findFirst({
    where: { phoneNumber, deletedAt: null },
  });
  console.timeEnd('db-getUserByPhoneNumber');
  return user;
};

const getUserByEmail = async (email: string): Promise<IUser | null> => {
  console.time('db-getUserByEmail');
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  console.timeEnd('db-getUserByEmail');
  return user;
};

const getUserById = async (id: string): Promise<IUser | null> => {
  console.log(`[getUserById] Looking up user with ID: ${id} (type: ${typeof id})`);

  // First try to find user with deletedAt: null
  let user: IUser | null = await prisma.user.findFirst({
    where: { id, deletedAt: null },
  });

  // If not found, try without deletedAt filter (for backwards compatibility with users that don't have deletedAt set)
  if (!user) {
    console.log(`[getUserById] User not found with deletedAt: null, trying without filter`);
    const userWithoutFilter = await prisma.user.findFirst({
      where: { id },
    });

    // If user exists but has deletedAt set (not null), return null
    if (userWithoutFilter && userWithoutFilter.deletedAt) {
      console.log(`[getUserById] User found but is deleted: ${userWithoutFilter.id}`);
      return null;
    }

    user = userWithoutFilter;
  }

  console.log(`[getUserById] User lookup result: ${user ? `found user ${user.id}` : 'not found'}`);
  return user;
};

const updateUser = async (id: string, user: UserUpdateData): Promise<IUser | null> => {
  console.time('db-updateUser');
  const updatedUser = await prisma.user.update({
    where: { id },
    data: user,
  });
  console.timeEnd('db-updateUser');
  return updatedUser;
};

const deleteUser = async (id: string): Promise<IUser | null> => {
  const deletedUser = await prisma.user.update({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return deletedUser;
};

export const userDML = {
  createUser,
  getUserByPhoneNumber,
  getUserByEmail,
  getUserById,
  updateUser,
  deleteUser,
};
