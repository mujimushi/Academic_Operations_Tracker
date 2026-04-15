import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { Role } from "@/generated/prisma/client";

export const authOptions: NextAuthOptions = {
  providers: [
    // Microsoft 365 SSO (primary — when Azure AD is available)
    ...(process.env.AZURE_AD_CLIENT_ID
      ? [
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
        ]
      : []),
    // Google OAuth (alternative — works immediately)
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!dbUser || !dbUser.isActive) return false;

      // Capture Microsoft OID on first login (Azure AD)
      if (
        account?.provider === "azure-ad" &&
        !dbUser.msId &&
        (profile as Record<string, unknown>)?.oid
      ) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { msId: (profile as Record<string, unknown>).oid as string },
        });
      }

      // Capture Google ID on first login (Google)
      if (
        account?.provider === "google" &&
        !dbUser.msId &&
        (profile as Record<string, unknown>)?.sub
      ) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { msId: (profile as Record<string, unknown>).sub as string },
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
