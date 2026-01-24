import jwt from "jsonwebtoken";

export const createToken = async (userId: string) => {
  console.time('createToken-jwt-sign');
  const token = jwt.sign({ userId }, process.env.JWT_SECRET || "", { expiresIn: "5d" });
  console.timeEnd('createToken-jwt-sign');
  return token;
};

export const verifyToken = async (token: string) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || "" as unknown as string);
  return decoded;
};