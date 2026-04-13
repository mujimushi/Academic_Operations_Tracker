import { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      teamId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    dbUserId?: string;
    role?: Role;
    teamId?: string;
  }
}
