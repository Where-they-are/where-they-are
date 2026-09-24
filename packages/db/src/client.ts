import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL is required to initialize the Prisma client");
}

const adapter = new PrismaPg({ connectionString });

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = db;
}

export { PrismaClient };
