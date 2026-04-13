import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { prisma } from "./prisma";
import { Role } from "@/generated/prisma/client";

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      if (!user.email) return false;

      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!dbUser || !dbUser.isActive) return false;

      // Capture Microsoft OID on first login
      if (!dbUser.msId && (profile as Record<string, unknown>)?.oid) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { msId: (profile as Record<string, unknown>).oid as string },
        });
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { teamResource: { select: { id: true } } },
        });
        if (dbUser) {
          token.dbUserId = dbUser.id;
          token.role = dbUser.role;
          token.teamId = dbUser.teamResource[0]?.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.dbUserId) {
        session.user.id = token.dbUserId as string;
        session.user.role = token.role as Role;
        session.user.teamId = token.teamId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
};
