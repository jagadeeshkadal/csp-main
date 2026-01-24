import { UnauthorizedError } from "../../common/errors";
import jwt from "jsonwebtoken";

export const verifyToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "" as unknown as string);
    return decoded;
  } catch (error) {
    throw new UnauthorizedError("Unauthorized");
  }
};