import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

function parseDatabaseUrl(url: string) {
  const match = url.match(
    /^mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)$/
  );
  if (!match) {
    throw new Error(`Invalid DATABASE_URL format: ${url}`);
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5],
  };
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const connParams = parseDatabaseUrl(dbUrl);
  const adapter = new PrismaMariaDb(connParams);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
