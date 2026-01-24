import { z } from "zod";
const configSchema = z.object({
    port: z.number().default(3000),
});
const parsedConfig = configSchema.safeParse({
    port: process.env.PORT ? parseInt(process.env.PORT) : undefined,
});
if (!parsedConfig.success) {
    throw new Error("Invalid configuration: " + parsedConfig.error.format());
}
export const config = parsedConfig.data;
