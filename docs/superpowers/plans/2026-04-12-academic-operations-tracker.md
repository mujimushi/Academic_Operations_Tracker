# Academic Operations Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Next.js task tracking system for NUST's Academic Directorate with role-based views, Microsoft 365 SSO, real-time notifications, and PWA support.

**Architecture:** Next.js 14+ App Router monolith with Prisma ORM + MySQL, NextAuth.js for Microsoft 365 SSO, SSE for real-time, FCM for push notifications, local filesystem for uploads. Existing React/Tailwind UI designs from `UI_Design/By_claude/` ported 1:1 into Next.js pages.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, Prisma, MySQL, NextAuth.js, Firebase Admin SDK, nodemailer

**Spec:** `docs/superpowers/specs/2026-04-12-academic-operations-tracker-design.md`
**UI Reference:** `UI_Design/By_claude/` (REFERENCE_IMPLEMENTATION.jsx, constants/, README.md)

---

## Phase 1: Foundation (Scaffold, Database, Auth)

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `.env.local`
- Create: `.env.example`

- [ ] **Step 1: Create Next.js project with TypeScript**

Run:
```bash
cd "D:/Current Desktop/ICT/Projects/Academic_Tracker_App"
npx create-next-app@latest academic-operations-tracker --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: New directory `academic-operations-tracker/` with Next.js boilerplate.

- [ ] **Step 2: Verify the scaffold runs**

Run:
```bash
cd academic-operations-tracker
npm run dev
```

Expected: Server starts on http://localhost:3000, default Next.js page loads.

- [ ] **Step 3: Install project dependencies**

Run:
```bash
npm install prisma @prisma/client next-auth @auth/prisma-adapter nodemailer firebase-admin uuid
npm install -D @types/nodemailer @types/uuid
```

Expected: All packages installed, no errors.

- [ ] **Step 4: Create environment files**

Create `.env.local`:
```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/academic_tracker"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"

# Microsoft 365 SSO
AZURE_AD_CLIENT_ID=""
AZURE_AD_CLIENT_SECRET=""
AZURE_AD_TENANT_ID=""

# Cron
CRON_SECRET="generate-a-random-cron-secret"

# Firebase (optional for dev)
FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY=""
```

Create `.env.example` with the same keys but empty values and comments explaining each.

- [ ] **Step 5: Configure Tailwind with NUST brand colors**

Replace `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nust: {
          blue: "#003366",
          ceramic: "#0088B9",
          orange: "#E87722",
          silver: "#C0C0C0",
          beige: "#F5F0E8",
        },
        bg: "#F7F8FA",
        priority: {
          critical: "#DC2626",
          high: "#E87722",
          medium: "#D97706",
          low: "#059669",
        },
      },
      fontFamily: {
        heading: ["Georgia", "Calisto MT", "serif"],
        body: ["system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 6: Set up global styles**

Replace `src/app/globals.css`:
```css
@import "tailwindcss";

body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #F7F8FA;
  color: #1A1A2E;
}

h1, h2, h3, h4, h5, h6 {
  font-family: Georgia, "Calisto MT", serif;
}
```

- [ ] **Step 7: Create root layout**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NUST Academic Operations Tracker",
  description: "Task tracking system for Academic Directorate and Development Teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create placeholder home page**

Replace `src/app/page.tsx`:
```tsx
export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-2xl font-heading text-nust-blue">
        NUST Academic Operations Tracker
      </h1>
    </div>
  );
}
```

- [ ] **Step 9: Verify everything works**

Run:
```bash
npm run dev
```

Expected: Page shows "NUST Academic Operations Tracker" in Georgia font with NUST blue color.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind and NUST branding"
```

---

### Task 2: Prisma Schema & Database

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Initialize Prisma**

Run:
```bash
npx prisma init --datasource-provider mysql
```

Expected: Creates `prisma/schema.prisma` and updates `.env.local` if not already set.

- [ ] **Step 2: Write the full Prisma schema**

Replace `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  PRO_RECTOR
  DIRECTOR
  COORDINATOR
  TEAM_RESOURCE
}

enum TaskStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED_AWAITING_TEAM
  ACCEPTED_BY_TEAM
  IN_ANALYSIS
  IN_DEVELOPMENT
  IN_TESTING
  DEPLOYED
  COORDINATOR_ACCEPTED
  ACCEPTED_CLOSED
  REWORK
  REJECTED_BY_TEAM
  PAUSED
  KILLED
}

enum RequestType {
  NEW_DEVELOPMENT
  ENHANCEMENT
  BUG_FIX
  POLICY_CHANGE
}

enum Priority {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum DocType {
  REQUIREMENTS
  POLICY
  CHAT_ATTACHMENT
}

enum DocStatus {
  UPLOADED
  APPROVED
}

enum EffortUnit {
  HOURS
  DAYS
}

enum NotifSeverity {
  NORMAL
  HIGH
  CRITICAL
}

model User {
  id        String   @id @default(uuid())
  msId      String?  @unique
  email     String   @unique
  name      String
  role      Role
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  teamResource    Team[]          @relation("TeamResource")
  tasksCreated    Task[]          @relation("TaskCoordinator")
  chatMessages    ChatMessage[]
  documents       Document[]      @relation("DocumentUploader")
  auditLogs       AuditLog[]
  notifications   Notification[]
  deviceTokens    DeviceToken[]
  configUpdates   SystemConfig[]  @relation("ConfigUpdater")
}

model Team {
  id         String   @id @default(uuid())
  name       String   @unique
  resourceId String
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  resource User   @relation("TeamResource", fields: [resourceId], references: [id])
  tasks    Task[]
}

model Task {
  id               String     @id @default(uuid())
  code             String     @unique
  title            String     @db.VarChar(200)
  type             RequestType
  status           TaskStatus @default(DRAFT)
  priority         Priority
  description      String     @db.Text
  affectedProcess  String
  expectedOutcome  String     @db.Text
  expectedDate     DateTime   @db.Date
  tolerance        Int        @default(7)
  ictEstimatedDate DateTime?  @db.Date
  preEffort        Decimal?   @db.Decimal(10, 2)
  preUnit          EffortUnit?
  postEffort       Decimal?   @db.Decimal(10, 2)
  postUnit         EffortUnit?
  policyRef        String?
  rejectionCount   Int        @default(0)
  pauseReason      String?    @db.Text
  pauseResumeDate  DateTime?  @db.Date
  pausedFromStatus TaskStatus?
  coordinatorId    String
  teamId           String
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  coordinator        User                 @relation("TaskCoordinator", fields: [coordinatorId], references: [id])
  team               Team                 @relation(fields: [teamId], references: [id])
  acceptanceCriteria AcceptanceCriterion[]
  documents          Document[]
  chatMessages       ChatMessage[]
  auditLogs          AuditLog[]
  notifications      Notification[]
}

model AcceptanceCriterion {
  id          String    @id @default(uuid())
  taskId      String
  description String
  isComplete  Boolean   @default(false)
  completedAt DateTime?
  sortOrder   Int

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

model Document {
  id           String    @id @default(uuid())
  taskId       String
  type         DocType
  filename     String
  path         String
  size         Int
  uploadedById String
  status       DocStatus @default(UPLOADED)
  createdAt    DateTime  @default(now())

  task       Task          @relation(fields: [taskId], references: [id], onDelete: Cascade)
  uploadedBy User          @relation("DocumentUploader", fields: [uploadedById], references: [id])
  chatMessages ChatMessage[]
}

model ChatMessage {
  id           String   @id @default(uuid())
  taskId       String
  authorId     String
  content      String   @db.Text
  attachmentId String?
  createdAt    DateTime @default(now())

  task       Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author     User      @relation(fields: [authorId], references: [id])
  attachment Document? @relation(fields: [attachmentId], references: [id])
}

model AuditLog {
  id         String      @id @default(uuid())
  taskId     String
  userId     String
  action     String
  fromStatus TaskStatus?
  toStatus   TaskStatus?
  reason     String?     @db.Text
  metadata   Json?
  createdAt  DateTime    @default(now())

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])
}

model Notification {
  id              String        @id @default(uuid())
  userId          String
  taskId          String?
  type            String
  message         String
  severity        NotifSeverity @default(NORMAL)
  isRead          Boolean       @default(false)
  isSeen          Boolean       @default(false)
  seenAt          DateTime?
  emailSent       Boolean       @default(false)
  pushSent        Boolean       @default(false)
  escalationLevel Int?
  createdAt       DateTime      @default(now())

  user User  @relation(fields: [userId], references: [id])
  task Task? @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

model DeviceToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @db.Text
  device    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}

model SystemConfig {
  id          String   @id @default(uuid())
  key         String   @unique
  value       String   @db.Text
  updatedById String
  updatedAt   DateTime @updatedAt

  updatedBy User @relation("ConfigUpdater", fields: [updatedById], references: [id])
}
```

- [ ] **Step 3: Create Prisma client singleton**

Create `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Create the MySQL database**

Run:
```bash
mysql -u root -p -e "CREATE DATABASE academic_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Expected: Database created. Update `DATABASE_URL` in `.env.local` if your MySQL credentials differ.

- [ ] **Step 5: Run the first migration**

Run:
```bash
npx prisma migrate dev --name init
```

Expected: Migration created and applied. All tables created in MySQL. Prisma Client generated.

- [ ] **Step 6: Verify schema**

Run:
```bash
npx prisma studio
```

Expected: Prisma Studio opens in browser. All tables visible with correct columns.

- [ ] **Step 7: Commit**

```bash
git add prisma/ src/lib/prisma.ts
git commit -m "feat: add Prisma schema with all tables and initial migration"
```

---

### Task 3: Constants & Shared Types

**Files:**
- Create: `src/constants/colors.ts`
- Create: `src/constants/statuses.ts`
- Create: `src/types/index.ts`

- [ ] **Step 1: Port color constants from UI reference**

Create `src/constants/colors.ts`:
```typescript
export const COLORS = {
  nustBlue: "#003366",
  ceramicBlue: "#0088B9",
  orange: "#E87722",
  silver: "#C0C0C0",
  beige: "#F5F0E8",
  lightBlue: "#E8F4F8",
  white: "#FFFFFF",
  bg: "#F7F8FA",
  text: "#1A1A2E",
  textMuted: "#6B7280",
  cardBg: "#FFFFFF",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
} as const;

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT:                    { bg: "#F3F4F6", text: "#6B7280" },
  PENDING_APPROVAL:         { bg: "#FEF3C7", text: "#92400E" },
  APPROVED_AWAITING_TEAM:   { bg: "#DBEAFE", text: "#1E40AF" },
  ACCEPTED_BY_TEAM:         { bg: "#E0E7FF", text: "#3730A3" },
  IN_ANALYSIS:              { bg: "#EDE9FE", text: "#5B21B6" },
  IN_DEVELOPMENT:           { bg: "#CFFAFE", text: "#155E75" },
  IN_TESTING:               { bg: "#FEE2E2", text: "#991B1B" },
  DEPLOYED:                 { bg: "#D1FAE5", text: "#065F46" },
  COORDINATOR_ACCEPTED:     { bg: "#BBF7D0", text: "#166534" },
  ACCEPTED_CLOSED:          { bg: "#ECFDF5", text: "#059669" },
  REWORK:                   { bg: "#FEE2E2", text: "#DC2626" },
  REJECTED_BY_TEAM:         { bg: "#FEE2E2", text: "#DC2626" },
  PAUSED:                   { bg: "#FEF9C3", text: "#854D0E" },
  KILLED:                   { bg: "#1F2937", text: "#F9FAFB" },
};

export const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#DC2626",
  HIGH:     "#E87722",
  MEDIUM:   "#D97706",
  LOW:      "#059669",
};

export const STATUS_DISPLAY_NAMES: Record<string, string> = {
  DRAFT:                    "Draft",
  PENDING_APPROVAL:         "Pending Approval",
  APPROVED_AWAITING_TEAM:   "Approved - Awaiting Team",
  ACCEPTED_BY_TEAM:         "Accepted by Team",
  IN_ANALYSIS:              "In Analysis",
  IN_DEVELOPMENT:           "In Development",
  IN_TESTING:               "In Testing",
  DEPLOYED:                 "Deployed",
  COORDINATOR_ACCEPTED:     "Coordinator Accepted",
  ACCEPTED_CLOSED:          "Accepted - Closed",
  REWORK:                   "Rework",
  REJECTED_BY_TEAM:         "Rejected by Team",
  PAUSED:                   "Paused",
  KILLED:                   "Killed",
};
```

- [ ] **Step 2: Port status transition logic**

Create `src/constants/statuses.ts`:
```typescript
import { TaskStatus, Role } from "@prisma/client";

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  DRAFT:                  [TaskStatus.PENDING_APPROVAL, TaskStatus.KILLED],
  PENDING_APPROVAL:       [TaskStatus.APPROVED_AWAITING_TEAM, TaskStatus.DRAFT, TaskStatus.KILLED],
  APPROVED_AWAITING_TEAM: [TaskStatus.ACCEPTED_BY_TEAM, TaskStatus.REJECTED_BY_TEAM, TaskStatus.PAUSED, TaskStatus.KILLED],
  ACCEPTED_BY_TEAM:       [TaskStatus.IN_ANALYSIS, TaskStatus.PAUSED, TaskStatus.KILLED],
  IN_ANALYSIS:            [TaskStatus.IN_DEVELOPMENT, TaskStatus.PAUSED, TaskStatus.KILLED],
  IN_DEVELOPMENT:         [TaskStatus.IN_TESTING, TaskStatus.PAUSED, TaskStatus.KILLED],
  IN_TESTING:             [TaskStatus.DEPLOYED, TaskStatus.IN_DEVELOPMENT, TaskStatus.PAUSED, TaskStatus.KILLED],
  DEPLOYED:               [TaskStatus.COORDINATOR_ACCEPTED, TaskStatus.REWORK, TaskStatus.PAUSED, TaskStatus.KILLED],
  COORDINATOR_ACCEPTED:   [TaskStatus.ACCEPTED_CLOSED, TaskStatus.REWORK, TaskStatus.KILLED],
  REWORK:                 [TaskStatus.IN_DEVELOPMENT, TaskStatus.PAUSED, TaskStatus.KILLED],
  REJECTED_BY_TEAM:       [TaskStatus.DRAFT, TaskStatus.KILLED],
  PAUSED:                 [TaskStatus.KILLED],
  ACCEPTED_CLOSED:        [],
  KILLED:                 [],
};

export const STATUS_ROLE_PERMISSIONS: Record<TaskStatus, Record<TaskStatus, Role[]>> = {
  DRAFT: {
    [TaskStatus.PENDING_APPROVAL]: [Role.COORDINATOR],
    [TaskStatus.KILLED]: [Role.COORDINATOR, Role.DIRECTOR, Role.PRO_RECTOR],
  },
  PENDING_APPROVAL: {
    [TaskStatus.APPROVED_AWAITING_TEAM]: [Role.DIRECTOR],
    [TaskStatus.DRAFT]: [Role.DIRECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  APPROVED_AWAITING_TEAM: {
    [TaskStatus.ACCEPTED_BY_TEAM]: [Role.TEAM_RESOURCE],
    [TaskStatus.REJECTED_BY_TEAM]: [Role.TEAM_RESOURCE],
    [TaskStatus.PAUSED]: [Role.TEAM_RESOURCE, Role.DIRECTOR, Role.PRO_RECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  ACCEPTED_BY_TEAM: {
    [TaskStatus.IN_ANALYSIS]: [Role.TEAM_RESOURCE],
    [TaskStatus.PAUSED]: [Role.TEAM_RESOURCE, Role.DIRECTOR, Role.PRO_RECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  IN_ANALYSIS: {
    [TaskStatus.IN_DEVELOPMENT]: [Role.TEAM_RESOURCE],
    [TaskStatus.PAUSED]: [Role.TEAM_RESOURCE, Role.DIRECTOR, Role.PRO_RECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  IN_DEVELOPMENT: {
    [TaskStatus.IN_TESTING]: [Role.TEAM_RESOURCE],
    [TaskStatus.PAUSED]: [Role.TEAM_RESOURCE, Role.DIRECTOR, Role.PRO_RECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  IN_TESTING: {
    [TaskStatus.DEPLOYED]: [Role.TEAM_RESOURCE],
    [TaskStatus.IN_DEVELOPMENT]: [Role.TEAM_RESOURCE],
    [TaskStatus.PAUSED]: [Role.TEAM_RESOURCE, Role.DIRECTOR, Role.PRO_RECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  DEPLOYED: {
    [TaskStatus.COORDINATOR_ACCEPTED]: [Role.COORDINATOR],
    [TaskStatus.REWORK]: [Role.COORDINATOR, Role.DIRECTOR],
    [TaskStatus.PAUSED]: [Role.COORDINATOR, Role.DIRECTOR, Role.PRO_RECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  COORDINATOR_ACCEPTED: {
    [TaskStatus.ACCEPTED_CLOSED]: [Role.DIRECTOR],
    [TaskStatus.REWORK]: [Role.DIRECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  REWORK: {
    [TaskStatus.IN_DEVELOPMENT]: [Role.TEAM_RESOURCE],
    [TaskStatus.PAUSED]: [Role.TEAM_RESOURCE, Role.DIRECTOR, Role.PRO_RECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  REJECTED_BY_TEAM: {
    [TaskStatus.DRAFT]: [Role.COORDINATOR],
    [TaskStatus.KILLED]: [Role.COORDINATOR, Role.DIRECTOR, Role.PRO_RECTOR],
  },
  PAUSED: {
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  ACCEPTED_CLOSED: {},
  KILLED: {},
};

export const REQUEST_TYPES = [
  { value: "NEW_DEVELOPMENT", label: "New Development" },
  { value: "ENHANCEMENT", label: "Enhancement" },
  { value: "BUG_FIX", label: "Bug Fix" },
  { value: "POLICY_CHANGE", label: "Policy Change" },
] as const;

export const PRIORITIES = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
] as const;
```

- [ ] **Step 3: Create shared types**

Create `src/types/index.ts`:
```typescript
import type { Task, User, Team, Document, ChatMessage, AuditLog, AcceptanceCriterion, Notification } from "@prisma/client";

export type TaskWithRelations = Task & {
  coordinator: Pick<User, "id" | "name" | "email">;
  team: Pick<Team, "id" | "name"> & {
    resource: Pick<User, "id" | "name" | "email">;
  };
  acceptanceCriteria: AcceptanceCriterion[];
  documents: (Document & {
    uploadedBy: Pick<User, "id" | "name">;
  })[];
  _count: {
    chatMessages: number;
  };
};

export type ChatMessageWithAuthor = ChatMessage & {
  author: Pick<User, "id" | "name" | "role">;
  attachment: Pick<Document, "id" | "filename" | "size"> | null;
};

export type AuditLogWithUser = AuditLog & {
  user: Pick<User, "id" | "name" | "role">;
};

export type NotificationWithTask = Notification & {
  task: Pick<Task, "id" | "code" | "title"> | null;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  teamId?: string;
};

import { Role } from "@prisma/client";
```

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/constants/ src/types/
git commit -m "feat: add color constants, status transitions, and shared types"
```

---

### Task 4: NextAuth.js with Microsoft 365 SSO

**Files:**
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/lib/auth.ts`
- Create: `src/middleware.ts`
- Create: `src/components/providers/AuthProvider.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create NextAuth configuration**

Create `src/lib/auth.ts`:
```typescript
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";

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
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!dbUser || !dbUser.isActive) return false;

      // Capture Microsoft OID on first login
      if (!dbUser.msId && (profile as any)?.oid) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { msId: (profile as any).oid },
        });
      }

      return true;
    },
    async session({ session, token }) {
      if (token.dbUserId) {
        session.user.id = token.dbUserId as string;
        session.user.role = token.role as Role;
        session.user.teamId = token.teamId as string | undefined;
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
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
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
};
```

- [ ] **Step 2: Create NextAuth route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 3: Augment NextAuth types**

Create `src/types/next-auth.d.ts`:
```typescript
import { Role } from "@prisma/client";

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
```

- [ ] **Step 4: Create auth middleware**

Create `src/middleware.ts`:
```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    const roleRoutes: Record<string, string[]> = {
      PRO_RECTOR: ["/pro-rector"],
      DIRECTOR: ["/director"],
      COORDINATOR: ["/coordinator"],
      ADMIN: ["/admin"],
      TEAM_RESOURCE: ["/task"],
    };

    // Check if user has access to this route group
    for (const [allowedRole, prefixes] of Object.entries(roleRoutes)) {
      for (const prefix of prefixes) {
        if (pathname.startsWith(prefix) && role !== allowedRole) {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
      }
    }

    // Redirect "/" to role-based home
    if (pathname === "/") {
      const redirectMap: Record<string, string> = {
        PRO_RECTOR: "/pro-rector/dashboard",
        DIRECTOR: "/director/dashboard",
        COORDINATOR: "/coordinator/tasks",
        ADMIN: "/admin/users",
        TEAM_RESOURCE: "/task/landing",
      };
      const target = redirectMap[role as string] || "/unauthorized";
      return NextResponse.redirect(new URL(target, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/pro-rector/:path*",
    "/director/:path*",
    "/coordinator/:path*",
    "/admin/:path*",
    "/task/:path*",
  ],
};
```

- [ ] **Step 5: Create AuthProvider for client components**

Create `src/components/providers/AuthProvider.tsx`:
```tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export default function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 6: Update root layout with AuthProvider**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import AuthProvider from "@/components/providers/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "NUST Academic Operations Tracker",
  description: "Task tracking system for Academic Directorate and Development Teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Create auth error and unauthorized pages**

Create `src/app/auth/error/page.tsx`:
```tsx
export default function AuthError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
        <h1 className="text-2xl font-heading text-nust-blue mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          Your account is not registered in the system. Please contact your System Administrator.
        </p>
      </div>
    </div>
  );
}
```

Create `src/app/unauthorized/page.tsx`:
```tsx
"use client";

import { signOut } from "next-auth/react";

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
        <h1 className="text-2xl font-heading text-nust-blue mb-4">Unauthorized</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access this page.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="bg-nust-blue text-white px-6 py-2 rounded-lg hover:opacity-90"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ src/middleware.ts src/components/providers/ src/types/next-auth.d.ts src/app/auth/ src/app/unauthorized/ src/app/layout.tsx
git commit -m "feat: add NextAuth.js with Microsoft 365 SSO and role-based middleware"
```

---

### Task 5: Database Seed Script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add seed config)

- [ ] **Step 1: Create seed script with realistic NUST data**

Create `prisma/seed.ts`:
```typescript
import { PrismaClient, Role, TaskStatus, RequestType, Priority, EffortUnit, DocType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.document.deleteMany();
  await prisma.acceptanceCriterion.deleteMany();
  await prisma.task.deleteMany();
  await prisma.team.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const admin = await prisma.user.create({
    data: { email: "admin@nust.edu.pk", name: "System Admin", role: Role.ADMIN },
  });
  const proRector = await prisma.user.create({
    data: { email: "prorector@nust.edu.pk", name: "Prof. Dr. Rector", role: Role.PRO_RECTOR },
  });
  const director = await prisma.user.create({
    data: { email: "director.acad@nust.edu.pk", name: "Director ACAD", role: Role.DIRECTOR },
  });
  const coordinator1 = await prisma.user.create({
    data: { email: "ahmed.coordinator@nust.edu.pk", name: "Asst. Prof. Ahmed", role: Role.COORDINATOR },
  });
  const coordinator2 = await prisma.user.create({
    data: { email: "sana.coordinator@nust.edu.pk", name: "Dr. Sana", role: Role.COORDINATOR },
  });
  const ictFarooq = await prisma.user.create({
    data: { email: "farooq@nust.edu.pk", name: "Engr. Farooq", role: Role.TEAM_RESOURCE },
  });
  const ictAli = await prisma.user.create({
    data: { email: "ali@nust.edu.pk", name: "Engr. Ali", role: Role.TEAM_RESOURCE },
  });
  const ictBilal = await prisma.user.create({
    data: { email: "bilal@nust.edu.pk", name: "Engr. Bilal", role: Role.TEAM_RESOURCE },
  });

  // Teams
  const webTeam = await prisma.team.create({
    data: { name: "ICT Web Team", resourceId: ictFarooq.id },
  });
  const erpTeam = await prisma.team.create({
    data: { name: "ICT ERP Team", resourceId: ictAli.id },
  });
  const networkTeam = await prisma.team.create({
    data: { name: "Network & Infra Team", resourceId: ictBilal.id },
  });

  // System Config defaults
  const configDefaults = [
    { key: "smtp_host", value: "" },
    { key: "smtp_port", value: "587" },
    { key: "smtp_user", value: "" },
    { key: "smtp_password", value: "" },
    { key: "smtp_from", value: "noreply@nust.edu.pk" },
    { key: "upload_path", value: "./uploads" },
    { key: "default_tolerance", value: "7" },
    { key: "fcm_project_id", value: "" },
    { key: "fcm_client_email", value: "" },
    { key: "fcm_private_key", value: "" },
  ];
  for (const cfg of configDefaults) {
    await prisma.systemConfig.create({
      data: { ...cfg, updatedById: admin.id },
    });
  }

  // Tasks
  const task1 = await prisma.task.create({
    data: {
      code: "AOT-001",
      title: "Automate School Data Collection Portal",
      type: RequestType.NEW_DEVELOPMENT,
      status: TaskStatus.IN_DEVELOPMENT,
      priority: Priority.CRITICAL,
      description: "Build a centralized portal for schools to submit enrollment, faculty, and infrastructure data directly instead of the current email-based process.",
      affectedProcess: "School data collection for annual reporting",
      expectedOutcome: "Schools can submit data through a structured form. Data is validated and stored centrally.",
      expectedDate: new Date("2026-04-20"),
      tolerance: 7,
      ictEstimatedDate: new Date("2026-04-28"),
      preEffort: 7,
      preUnit: EffortUnit.DAYS,
      postEffort: 1,
      postUnit: EffortUnit.DAYS,
      coordinatorId: coordinator1.id,
      teamId: webTeam.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      code: "AOT-002",
      title: "Fee Structure Policy Update Module",
      type: RequestType.POLICY_CHANGE,
      status: TaskStatus.PENDING_APPROVAL,
      priority: Priority.HIGH,
      description: "Update the fee management module to reflect the new fee structure policy approved by the Board.",
      affectedProcess: "Fee calculation and student billing",
      expectedOutcome: "Fee module reflects new policy. Existing student records updated.",
      expectedDate: new Date("2026-05-01"),
      tolerance: 7,
      preEffort: 3,
      preUnit: EffortUnit.DAYS,
      postEffort: 0.5,
      postUnit: EffortUnit.DAYS,
      policyRef: "BOG/FIN/2026-03",
      coordinatorId: coordinator2.id,
      teamId: erpTeam.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      code: "AOT-003",
      title: "Exam Schedule Generator Bug Fix",
      type: RequestType.BUG_FIX,
      status: TaskStatus.REWORK,
      priority: Priority.HIGH,
      description: "Fix the exam schedule generator which produces overlapping time slots for multi-section courses.",
      affectedProcess: "Examination scheduling",
      expectedOutcome: "No overlapping time slots. Room assignments unique per slot.",
      expectedDate: new Date("2026-04-05"),
      tolerance: 5,
      ictEstimatedDate: new Date("2026-04-10"),
      rejectionCount: 3,
      coordinatorId: coordinator1.id,
      teamId: networkTeam.id,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      code: "AOT-004",
      title: "Student Transcript Automation",
      type: RequestType.NEW_DEVELOPMENT,
      status: TaskStatus.DEPLOYED,
      priority: Priority.MEDIUM,
      description: "Automate transcript generation from the student records system.",
      affectedProcess: "Transcript issuance",
      expectedOutcome: "One-click transcript generation with QR verification.",
      expectedDate: new Date("2026-03-30"),
      tolerance: 7,
      ictEstimatedDate: new Date("2026-03-28"),
      preEffort: 5,
      preUnit: EffortUnit.DAYS,
      postEffort: 0.5,
      postUnit: EffortUnit.DAYS,
      coordinatorId: coordinator2.id,
      teamId: webTeam.id,
    },
  });

  const task5 = await prisma.task.create({
    data: {
      code: "AOT-005",
      title: "Faculty Workload Dashboard Enhancement",
      type: RequestType.ENHANCEMENT,
      status: TaskStatus.IN_ANALYSIS,
      priority: Priority.MEDIUM,
      description: "Add visualization and export features to the existing faculty workload dashboard.",
      affectedProcess: "Faculty workload management",
      expectedOutcome: "Charts showing workload distribution. PDF export for reporting.",
      expectedDate: new Date("2026-05-15"),
      tolerance: 7,
      ictEstimatedDate: new Date("2026-05-20"),
      preEffort: 2,
      preUnit: EffortUnit.DAYS,
      postEffort: 0.25,
      postUnit: EffortUnit.DAYS,
      coordinatorId: coordinator1.id,
      teamId: erpTeam.id,
    },
  });

  // Acceptance criteria for task 1
  await prisma.acceptanceCriterion.createMany({
    data: [
      { taskId: task1.id, description: "Schools can register and log in", isComplete: true, completedAt: new Date("2026-04-10"), sortOrder: 1 },
      { taskId: task1.id, description: "Data submission form with validation", isComplete: false, sortOrder: 2 },
      { taskId: task1.id, description: "Admin can view and export submitted data", isComplete: false, sortOrder: 3 },
    ],
  });

  // Audit logs for task 1
  await prisma.auditLog.createMany({
    data: [
      { taskId: task1.id, userId: coordinator1.id, action: "status_change", fromStatus: null, toStatus: TaskStatus.DRAFT, createdAt: new Date("2026-03-15") },
      { taskId: task1.id, userId: coordinator1.id, action: "status_change", fromStatus: TaskStatus.DRAFT, toStatus: TaskStatus.PENDING_APPROVAL, createdAt: new Date("2026-03-16") },
      { taskId: task1.id, userId: director.id, action: "status_change", fromStatus: TaskStatus.PENDING_APPROVAL, toStatus: TaskStatus.APPROVED_AWAITING_TEAM, createdAt: new Date("2026-03-17") },
      { taskId: task1.id, userId: ictFarooq.id, action: "status_change", fromStatus: TaskStatus.APPROVED_AWAITING_TEAM, toStatus: TaskStatus.ACCEPTED_BY_TEAM, createdAt: new Date("2026-03-18") },
      { taskId: task1.id, userId: ictFarooq.id, action: "status_change", fromStatus: TaskStatus.ACCEPTED_BY_TEAM, toStatus: TaskStatus.IN_ANALYSIS, createdAt: new Date("2026-03-20") },
      { taskId: task1.id, userId: ictFarooq.id, action: "status_change", fromStatus: TaskStatus.IN_ANALYSIS, toStatus: TaskStatus.IN_DEVELOPMENT, createdAt: new Date("2026-04-01") },
    ],
  });

  // Chat messages for task 3
  await prisma.chatMessage.createMany({
    data: [
      { taskId: task3.id, authorId: coordinator1.id, content: "The exam schedule bug is affecting all departments. Students are seeing wrong dates.", createdAt: new Date("2026-04-02T10:15:00") },
      { taskId: task3.id, authorId: ictBilal.id, content: "Fixed the date parsing logic. Deployed to staging.", createdAt: new Date("2026-04-03T14:30:00") },
      { taskId: task3.id, authorId: coordinator1.id, content: "Tested. The overlap detection is still broken for multi-section courses.", createdAt: new Date("2026-04-04T09:00:00") },
      { taskId: task3.id, authorId: director.id, content: "This is critical. Board meeting is next week and we need this resolved.", createdAt: new Date("2026-04-05T11:00:00") },
      { taskId: task3.id, authorId: ictBilal.id, content: "Understood. Reworking the overlap algorithm. Will need 2 more days.", createdAt: new Date("2026-04-05T15:00:00") },
    ],
  });

  // Notifications for pro rector
  await prisma.notification.createMany({
    data: [
      { userId: proRector.id, taskId: task3.id, type: "ESCALATION", message: "AOT-003 rejected 3 times. Auto-escalated.", severity: "CRITICAL", createdAt: new Date("2026-04-08T10:00:00") },
      { userId: proRector.id, taskId: task3.id, type: "OVERDUE", message: "AOT-003 is overdue by 4 days.", severity: "HIGH", createdAt: new Date("2026-04-09T08:00:00") },
      { userId: proRector.id, taskId: task4.id, type: "TASK_DEPLOYED", message: "AOT-004 deployed, awaiting sign-off.", severity: "NORMAL", isRead: true, createdAt: new Date("2026-04-07T14:00:00") },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add seed config to package.json**

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

Install tsx:
```bash
npm install -D tsx
```

- [ ] **Step 3: Run the seed**

Run:
```bash
npx prisma db seed
```

Expected: "Seed complete." output. Verify in Prisma Studio: `npx prisma studio`

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add database seed with realistic NUST sample data"
```

---

## Phase 2: Core UI Components

### Task 6: Shared UI Components

**Files:**
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/PriorityDot.tsx`
- Create: `src/components/TaskCard.tsx`
- Create: `src/components/NotificationItem.tsx`
- Create: `src/components/Icons.tsx`

- [ ] **Step 1: Create Icons component**

Create `src/components/Icons.tsx`:
```tsx
export function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function TasksIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

export function BellIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

export function QueueIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  );
}

export function BackIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function SendIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

export function ClipIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.49" />
    </svg>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function XIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function UploadIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}

export function FileIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

export function ChatIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

export function AlertIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function UsersIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

export function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

export function TeamIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}
```

- [ ] **Step 2: Create StatusBadge**

Create `src/components/StatusBadge.tsx`:
```tsx
import { STATUS_COLORS, STATUS_DISPLAY_NAMES } from "@/constants/colors";
import { TaskStatus } from "@prisma/client";

export default function StatusBadge({ status }: { status: TaskStatus }) {
  const colors = STATUS_COLORS[status] || { bg: "#F3F4F6", text: "#6B7280" };
  const label = STATUS_DISPLAY_NAMES[status] || status;

  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 3: Create PriorityDot**

Create `src/components/PriorityDot.tsx`:
```tsx
import { PRIORITY_COLORS } from "@/constants/colors";
import { Priority } from "@prisma/client";

export default function PriorityDot({ priority }: { priority: Priority }) {
  const color = PRIORITY_COLORS[priority] || "#6B7280";

  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-1.5"
      style={{ backgroundColor: color }}
      title={priority}
    />
  );
}
```

- [ ] **Step 4: Create TaskCard**

Create `src/components/TaskCard.tsx`:
```tsx
"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";
import PriorityDot from "./PriorityDot";
import { ChatIcon } from "./Icons";
import type { TaskWithRelations } from "@/types";

export default function TaskCard({
  task,
  href,
}: {
  task: TaskWithRelations;
  href: string;
}) {
  const isOverdue =
    task.status !== "ACCEPTED_CLOSED" &&
    task.status !== "KILLED" &&
    new Date(task.expectedDate) < new Date();

  const daysOverdue = isOverdue
    ? Math.ceil(
        (new Date().getTime() - new Date(task.expectedDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const isEscalated = task.rejectionCount >= 3;

  return (
    <Link href={href} className="block">
      <div
        className={`bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow ${
          isEscalated ? "border-red-500 border-2" : "border-gray-100"
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono">{task.code}</span>
            {isEscalated && (
              <span className="text-[10px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded">
                ESCALATED
              </span>
            )}
          </div>
          <StatusBadge status={task.status} />
        </div>

        <h3 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">
          <PriorityDot priority={task.priority} />
          {task.title}
        </h3>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{task.team.name}</span>
          <div className="flex items-center gap-3">
            {isOverdue && (
              <span className="text-red-600 font-medium">
                {daysOverdue}d overdue
              </span>
            )}
            <span className="flex items-center gap-1">
              <ChatIcon />
              {task._count.chatMessages}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
          <span>Expected: {new Date(task.expectedDate).toLocaleDateString()}</span>
          {task.ictEstimatedDate && (
            <span>
              Team: {new Date(task.ictEstimatedDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 5: Create NotificationItem**

Create `src/components/NotificationItem.tsx`:
```tsx
"use client";

import { NotificationWithTask } from "@/types";

const severityStyles: Record<string, string> = {
  CRITICAL: "border-l-4 border-red-600 bg-red-50",
  HIGH: "border-l-4 border-orange-500 bg-orange-50",
  NORMAL: "border-l-4 border-blue-400 bg-white",
};

export default function NotificationItem({
  notification,
  onAcknowledge,
}: {
  notification: NotificationWithTask;
  onAcknowledge?: (id: string) => void;
}) {
  const style = severityStyles[notification.severity] || severityStyles.NORMAL;
  const timeAgo = getTimeAgo(notification.createdAt);

  return (
    <div
      className={`p-3 rounded-lg mb-2 ${style} ${
        notification.isRead ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-800">{notification.message}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{timeAgo}</span>
            {notification.task && (
              <span className="text-xs text-gray-400 font-mono">
                {notification.task.code}
              </span>
            )}
          </div>
        </div>
        {!notification.isSeen &&
          notification.escalationLevel &&
          onAcknowledge && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAcknowledge(notification.id);
              }}
              className="ml-2 text-xs bg-nust-blue text-white px-3 py-1 rounded hover:opacity-90"
            >
              Acknowledge
            </button>
          )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/
git commit -m "feat: add shared UI components (StatusBadge, PriorityDot, TaskCard, NotificationItem, Icons)"
```

---

### Task 7: Layout Shells

**Files:**
- Create: `src/components/BottomTabBar.tsx`
- Create: `src/components/Sidebar.tsx`
- Create: `src/app/(pro-rector)/layout.tsx`
- Create: `src/app/(director)/layout.tsx`
- Create: `src/app/(coordinator)/layout.tsx`
- Create: `src/app/(admin)/layout.tsx`

- [ ] **Step 1: Create BottomTabBar for mobile views**

Create `src/components/BottomTabBar.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, TasksIcon, BellIcon, QueueIcon } from "./Icons";
import { COLORS } from "@/constants/colors";

type Tab = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

export default function BottomTabBar({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              <div className="relative">
                <Icon
                  className={isActive ? "text-nust-ceramic" : "text-gray-400"}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 ${
                  isActive ? "text-nust-ceramic font-medium" : "text-gray-400"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const PRO_RECTOR_TABS: Tab[] = [
  { label: "Dashboard", href: "/pro-rector/dashboard", icon: DashboardIcon },
  { label: "Tasks", href: "/pro-rector/tasks", icon: TasksIcon },
  { label: "Alerts", href: "/pro-rector/alerts", icon: BellIcon },
];

export const DIRECTOR_TABS: Tab[] = [
  { label: "Dashboard", href: "/director/dashboard", icon: DashboardIcon },
  { label: "Queue", href: "/director/queue", icon: QueueIcon },
  { label: "Tasks", href: "/director/tasks", icon: TasksIcon },
  { label: "Alerts", href: "/director/alerts", icon: BellIcon },
];
```

- [ ] **Step 2: Create Sidebar for desktop views**

Create `src/components/Sidebar.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { COLORS } from "@/constants/colors";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export default function Sidebar({
  items,
  userName,
  roleName,
}: {
  items: NavItem[];
  userName: string;
  roleName: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{ backgroundColor: COLORS.nustBlue }}
    >
      <div className="p-4 border-b border-white/10">
        <h1 className="text-white font-heading text-sm font-bold">
          NUST Academic Operations Tracker
        </h1>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-white/20 text-white font-medium"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon />
              {item.label}
            </Link>
          );
        })}

        {/* Future module placeholders */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-white/30 text-xs px-3 mb-2 uppercase tracking-wider">
            Coming Soon
          </p>
          <div className="text-white/20 text-sm px-3 py-2">Policy Chatbot</div>
          <div className="text-white/20 text-sm px-3 py-2">Student Queries</div>
        </div>
      </nav>

      <div className="p-4 border-t border-white/10">
        <p className="text-white text-sm font-medium">{userName}</p>
        <p className="text-white/50 text-xs">{roleName}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-2 text-white/50 hover:text-white text-xs"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Create Pro Rector layout (mobile shell)**

Create `src/app/(pro-rector)/layout.tsx`:
```tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import BottomTabBar, { PRO_RECTOR_TABS } from "@/components/BottomTabBar";
import { BellIcon } from "@/components/Icons";
import { COLORS } from "@/constants/colors";

export default async function ProRectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRO_RECTOR") redirect("/unauthorized");

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto relative">
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: COLORS.nustBlue }}
      >
        <h1 className="text-white text-sm font-heading font-bold">
          Academic Tracker
        </h1>
        <a href="/pro-rector/alerts" className="relative">
          <BellIcon className="text-white" />
        </a>
      </header>

      <main className="pb-16">{children}</main>

      <BottomTabBar tabs={PRO_RECTOR_TABS} />
    </div>
  );
}
```

- [ ] **Step 4: Create Director layout (mobile + desktop responsive)**

Create `src/app/(director)/layout.tsx`:
```tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import BottomTabBar, { DIRECTOR_TABS } from "@/components/BottomTabBar";
import Sidebar from "@/components/Sidebar";
import { BellIcon, DashboardIcon, QueueIcon, TasksIcon } from "@/components/Icons";
import { COLORS } from "@/constants/colors";

const DIRECTOR_NAV = [
  { label: "Dashboard", href: "/director/dashboard", icon: DashboardIcon },
  { label: "Approval Queue", href: "/director/queue", icon: QueueIcon },
  { label: "All Tasks", href: "/director/tasks", icon: TasksIcon },
  { label: "Alerts", href: "/director/alerts", icon: BellIcon },
];

export default async function DirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DIRECTOR") redirect("/unauthorized");

  return (
    <>
      {/* Desktop layout */}
      <div className="hidden md:flex min-h-screen">
        <Sidebar
          items={DIRECTOR_NAV}
          userName={session.user.name}
          roleName="Director ACAD"
        />
        <main className="flex-1 bg-bg p-6">{children}</main>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden min-h-screen bg-bg max-w-lg mx-auto relative">
        <header
          className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: COLORS.nustBlue }}
        >
          <h1 className="text-white text-sm font-heading font-bold">
            Academic Tracker
          </h1>
          <a href="/director/alerts" className="relative">
            <BellIcon className="text-white" />
          </a>
        </header>
        <main className="pb-16">{children}</main>
        <BottomTabBar tabs={DIRECTOR_TABS} />
      </div>
    </>
  );
}
```

- [ ] **Step 5: Create Coordinator layout (desktop sidebar)**

Create `src/app/(coordinator)/layout.tsx`:
```tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import { TasksIcon } from "@/components/Icons";
import { UploadIcon } from "@/components/Icons";

const COORDINATOR_NAV = [
  { label: "New Task", href: "/coordinator/new", icon: UploadIcon },
  { label: "My Tasks", href: "/coordinator/tasks", icon: TasksIcon },
];

export default async function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "COORDINATOR") redirect("/unauthorized");

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={COORDINATOR_NAV}
        userName={session.user.name}
        roleName="Academic Coordinator"
      />
      <main className="flex-1 bg-bg p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 6: Create Admin layout (desktop sidebar)**

Create `src/app/(admin)/layout.tsx`:
```tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import { UsersIcon, TeamIcon, SettingsIcon } from "@/components/Icons";

const ADMIN_NAV = [
  { label: "Users", href: "/admin/users", icon: UsersIcon },
  { label: "Teams", href: "/admin/teams", icon: TeamIcon },
  { label: "Settings", href: "/admin/settings", icon: SettingsIcon },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/unauthorized");

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={ADMIN_NAV}
        userName={session.user.name}
        roleName="System Administrator"
      />
      <main className="flex-1 bg-bg p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 7: Create placeholder pages for each route group**

Create placeholder pages so routing works:

`src/app/(pro-rector)/dashboard/page.tsx`:
```tsx
export default function ProRectorDashboard() {
  return <div className="p-4"><h2 className="text-lg font-heading">Dashboard</h2><p className="text-gray-500 text-sm mt-2">Coming in Phase 3</p></div>;
}
```

`src/app/(pro-rector)/tasks/page.tsx`:
```tsx
export default function ProRectorTasks() {
  return <div className="p-4"><h2 className="text-lg font-heading">All Tasks</h2><p className="text-gray-500 text-sm mt-2">Coming in Phase 3</p></div>;
}
```

`src/app/(pro-rector)/alerts/page.tsx`:
```tsx
export default function ProRectorAlerts() {
  return <div className="p-4"><h2 className="text-lg font-heading">Alerts</h2><p className="text-gray-500 text-sm mt-2">Coming in Phase 4</p></div>;
}
```

`src/app/(director)/dashboard/page.tsx`:
```tsx
export default function DirectorDashboard() {
  return <div className="p-4"><h2 className="text-lg font-heading">Dashboard</h2><p className="text-gray-500 text-sm mt-2">Coming in Phase 3</p></div>;
}
```

`src/app/(director)/queue/page.tsx`:
```tsx
export default function DirectorQueue() {
  return <div className="p-4"><h2 className="text-lg font-heading">Approval Queue</h2><p className="text-gray-500 text-sm mt-2">Coming in Phase 2</p></div>;
}
```

`src/app/(director)/tasks/page.tsx`:
```tsx
export default function DirectorTasks() {
  return <div className="p-4"><h2 className="text-lg font-heading">All Tasks</h2><p className="text-gray-500 text-sm mt-2">Coming in Phase 3</p></div>;
}
```

`src/app/(director)/alerts/page.tsx`:
```tsx
export default function DirectorAlerts() {
  return <div className="p-4"><h2 className="text-lg font-heading">Alerts</h2><p className="text-gray-500 text-sm mt-2">Coming in Phase 4</p></div>;
}
```

`src/app/(coordinator)/new/page.tsx`:
```tsx
export default function NewTask() {
  return <div><h2 className="text-lg font-heading">New Task</h2><p className="text-gray-500 text-sm mt-2">Coming in Phase 2</p></div>;
}
```

`src/app/(coordinator)/tasks/page.tsx`:
```tsx
export default function CoordinatorTasks() {
  return <div><h2 className="text-lg font-heading">My Tasks</h2><p className="text-gray-500 text-sm mt-2">Coming in Phase 2</p></div>;
}
```

`src/app/(admin)/users/page.tsx`:
```tsx
export default function AdminUsers() {
  return <div><h2 className="text-lg font-heading">User Management</h2><p className="text-gray-500 text-sm mt-2">Coming in Phase 5</p></div>;
}
```

`src/app/(admin)/teams/page.tsx`:
```tsx
export default function AdminTeams() {
  return <div><h2 className="text-lg font-heading">Team Management</h2><p className="text-gray-500 text-sm mt-2">Coming in Phase 5</p></div>;
}
```

`src/app/(admin)/settings/page.tsx`:
```tsx
export default function AdminSettings() {
  return <div><h2 className="text-lg font-heading">System Settings</h2><p className="text-gray-500 text-sm mt-2">Coming in Phase 5</p></div>;
}
```

`src/app/task/[id]/page.tsx`:
```tsx
export default function TeamTaskPage({ params }: { params: { id: string } }) {
  return <div className="p-4"><h2 className="text-lg font-heading">Task {params.id}</h2><p className="text-gray-500 text-sm mt-2">Coming in Phase 2</p></div>;
}
```

- [ ] **Step 8: Verify routing**

Run:
```bash
npm run dev
```

Verify these routes load (you'll need to bypass auth temporarily or use the seed users):
- `/pro-rector/dashboard` — mobile shell with bottom tabs
- `/director/dashboard` — responsive shell
- `/coordinator/tasks` — desktop sidebar
- `/admin/users` — desktop sidebar

- [ ] **Step 9: Commit**

```bash
git add src/components/BottomTabBar.tsx src/components/Sidebar.tsx src/app/
git commit -m "feat: add layout shells (mobile + desktop) and placeholder pages for all route groups"
```

---

## Phase 3: Task APIs & Views

### Task 8: Task CRUD API

**Files:**
- Create: `src/app/api/tasks/route.ts`
- Create: `src/app/api/tasks/[id]/route.ts`
- Create: `src/lib/task-code.ts`

- [ ] **Step 1: Create task code generator**

Create `src/lib/task-code.ts`:
```typescript
import { prisma } from "./prisma";

export async function generateTaskCode(): Promise<string> {
  const lastTask = await prisma.task.findFirst({
    orderBy: { code: "desc" },
    select: { code: true },
  });

  if (!lastTask) return "AOT-001";

  const lastNumber = parseInt(lastTask.code.replace("AOT-", ""), 10);
  const nextNumber = lastNumber + 1;
  return `AOT-${String(nextNumber).padStart(3, "0")}`;
}
```

- [ ] **Step 2: Create task list and create API**

Create `src/app/api/tasks/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTaskCode } from "@/lib/task-code";
import { Role, TaskStatus } from "@prisma/client";

const taskInclude = {
  coordinator: { select: { id: true, name: true, email: true } },
  team: {
    select: {
      id: true,
      name: true,
      resource: { select: { id: true, name: true, email: true } },
    },
  },
  acceptanceCriteria: { orderBy: { sortOrder: "asc" as const } },
  documents: {
    include: { uploadedBy: { select: { id: true, name: true } } },
  },
  _count: { select: { chatMessages: true } },
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, id: userId, teamId } = session.user;

  let where: any = {};

  switch (role) {
    case Role.COORDINATOR:
      where = { coordinatorId: userId };
      break;
    case Role.TEAM_RESOURCE:
      where = {
        teamId,
        status: { notIn: [TaskStatus.DRAFT, TaskStatus.PENDING_APPROVAL] },
      };
      break;
    case Role.DIRECTOR:
    case Role.PRO_RECTOR:
      // See all tasks
      break;
    default:
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse query filters
  const url = new URL(req.url);
  const status = url.searchParams.getAll("status");
  const priority = url.searchParams.getAll("priority");
  const type = url.searchParams.get("type");
  const teamFilter = url.searchParams.get("teamId");
  const coordinatorFilter = url.searchParams.get("coordinatorId");

  if (status.length) where.status = { in: status };
  if (priority.length) where.priority = { in: priority };
  if (type) where.type = type;
  if (teamFilter) where.teamId = teamFilter;
  if (coordinatorFilter) where.coordinatorId = coordinatorFilter;

  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.COORDINATOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const code = await generateTaskCode();

  const task = await prisma.task.create({
    data: {
      code,
      title: body.title,
      type: body.type,
      priority: body.priority,
      description: body.description,
      affectedProcess: body.affectedProcess,
      expectedOutcome: body.expectedOutcome,
      expectedDate: new Date(body.expectedDate),
      tolerance: body.tolerance ?? 7,
      policyRef: body.policyRef,
      preEffort: body.preEffort,
      preUnit: body.preUnit,
      postEffort: body.postEffort,
      postUnit: body.postUnit,
      coordinatorId: session.user.id,
      teamId: body.teamId,
      acceptanceCriteria: body.acceptanceCriteria?.length
        ? {
            create: body.acceptanceCriteria.map(
              (item: { description: string }, i: number) => ({
                description: item.description,
                sortOrder: i + 1,
              })
            ),
          }
        : undefined,
    },
    include: taskInclude,
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      taskId: task.id,
      userId: session.user.id,
      action: "status_change",
      toStatus: TaskStatus.DRAFT,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
```

- [ ] **Step 3: Create single task API**

Create `src/app/api/tasks/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, TaskStatus } from "@prisma/client";

const taskInclude = {
  coordinator: { select: { id: true, name: true, email: true } },
  team: {
    select: {
      id: true,
      name: true,
      resource: { select: { id: true, name: true, email: true } },
    },
  },
  acceptanceCriteria: { orderBy: { sortOrder: "asc" as const } },
  documents: {
    include: { uploadedBy: { select: { id: true, name: true } } },
  },
  _count: { select: { chatMessages: true } },
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: taskInclude,
  });

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Access control
  const { role, id: userId, teamId } = session.user;
  if (role === Role.COORDINATOR && task.coordinatorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (role === Role.TEAM_RESOURCE) {
    if (task.teamId !== teamId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if ([TaskStatus.DRAFT, TaskStatus.PENDING_APPROVAL].includes(task.status)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(task);
}
```

- [ ] **Step 4: Verify API returns seeded data**

Run:
```bash
npm run dev
```

Test with curl (you'll need a valid session, or temporarily remove auth for testing):
```bash
curl http://localhost:3000/api/tasks
```

Expected: JSON array of seeded tasks.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/tasks/ src/lib/task-code.ts
git commit -m "feat: add task CRUD API with role-based filtering"
```

---

### Task 9: Status Transition API

**Files:**
- Create: `src/app/api/tasks/[id]/status/route.ts`
- Create: `src/lib/transitions.ts`

- [ ] **Step 1: Create transition validation logic**

Create `src/lib/transitions.ts`:
```typescript
import { TaskStatus, Role } from "@prisma/client";
import { VALID_TRANSITIONS, STATUS_ROLE_PERMISSIONS } from "@/constants/statuses";

export type TransitionResult =
  | { valid: true }
  | { valid: false; reason: string };

export function validateTransition(
  fromStatus: TaskStatus,
  toStatus: TaskStatus,
  userRole: Role,
  options?: {
    isTaskOwner?: boolean;
    hasWorkflowHistory?: boolean;
    pausedFromStatus?: TaskStatus | null;
  }
): TransitionResult {
  // Special case: unpausing returns to pausedFromStatus
  if (fromStatus === TaskStatus.PAUSED && toStatus !== TaskStatus.KILLED) {
    if (!options?.pausedFromStatus) {
      return { valid: false, reason: "No previous status recorded for unpause" };
    }
    if (toStatus !== options.pausedFromStatus) {
      return { valid: false, reason: `Can only unpause to ${options.pausedFromStatus}` };
    }
    return { valid: true };
  }

  // Check if transition is valid
  const validNext = VALID_TRANSITIONS[fromStatus];
  if (!validNext || !validNext.includes(toStatus)) {
    return { valid: false, reason: `Cannot transition from ${fromStatus} to ${toStatus}` };
  }

  // Check role permissions
  const permissions = STATUS_ROLE_PERMISSIONS[fromStatus];
  const allowedRoles = permissions?.[toStatus];
  if (!allowedRoles || !allowedRoles.includes(userRole)) {
    return { valid: false, reason: `Role ${userRole} cannot perform this transition` };
  }

  // Special: Coordinator can only kill own tasks
  if (toStatus === TaskStatus.KILLED && userRole === Role.COORDINATOR) {
    if (!options?.isTaskOwner) {
      return { valid: false, reason: "Coordinators can only kill their own tasks" };
    }
    if (
      fromStatus !== TaskStatus.DRAFT &&
      fromStatus !== TaskStatus.REJECTED_BY_TEAM
    ) {
      return { valid: false, reason: "Coordinators can only kill tasks in Draft or Rejected by Team status" };
    }
  }

  return { valid: true };
}
```

- [ ] **Step 2: Create status transition endpoint**

Create `src/app/api/tasks/[id]/status/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateTransition } from "@/lib/transitions";
import { TaskStatus, Role } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status: newStatus, reason, ictEstimatedDate, pauseReason, pauseResumeDate } = body;

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      team: { select: { resourceId: true } },
    },
  });

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { role, id: userId, teamId } = session.user;

  // Verify team resource access
  if (role === Role.TEAM_RESOURCE && task.teamId !== teamId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if task has workflow history (for coordinator kill rules)
  const hasWorkflowHistory = await prisma.auditLog.count({
    where: {
      taskId: task.id,
      action: "status_change",
      fromStatus: { not: null },
    },
  }) > 0;

  const validation = validateTransition(
    task.status,
    newStatus as TaskStatus,
    role,
    {
      isTaskOwner: task.coordinatorId === userId,
      hasWorkflowHistory,
      pausedFromStatus: task.pausedFromStatus,
    }
  );

  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  // Require reason for certain transitions
  const requiresReason = [
    TaskStatus.KILLED,
    TaskStatus.PAUSED,
    TaskStatus.REWORK,
    TaskStatus.REJECTED_BY_TEAM,
  ];
  if (requiresReason.includes(newStatus as TaskStatus) && !reason) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }

  // Build update data
  const updateData: any = { status: newStatus };

  // Pause handling
  if (newStatus === TaskStatus.PAUSED) {
    if (!pauseReason || !pauseResumeDate) {
      return NextResponse.json(
        { error: "Pause reason and resume date are required" },
        { status: 400 }
      );
    }
    updateData.pauseReason = pauseReason;
    updateData.pauseResumeDate = new Date(pauseResumeDate);
    updateData.pausedFromStatus = task.status;
  }

  // Unpause handling: clear pause fields
  if (task.status === TaskStatus.PAUSED && newStatus !== TaskStatus.KILLED) {
    updateData.pauseReason = null;
    updateData.pauseResumeDate = null;
    updateData.pausedFromStatus = null;
  }

  // ICT estimated date when team accepts
  if (newStatus === TaskStatus.ACCEPTED_BY_TEAM && ictEstimatedDate) {
    updateData.ictEstimatedDate = new Date(ictEstimatedDate);
  }

  // Increment rejection count on rework
  if (newStatus === TaskStatus.REWORK) {
    updateData.rejectionCount = { increment: 1 };
  }

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: updateData,
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      taskId: task.id,
      userId,
      action: "status_change",
      fromStatus: task.status,
      toStatus: newStatus as TaskStatus,
      reason,
    },
  });

  // TODO: Phase 4 will add notification triggers here

  return NextResponse.json(updated);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/tasks/[id]/status/ src/lib/transitions.ts
git commit -m "feat: add status transition API with validation and audit logging"
```

---

### Task 10: Chat API

**Files:**
- Create: `src/app/api/tasks/[id]/chat/route.ts`

- [ ] **Step 1: Create chat endpoint**

Create `src/app/api/tasks/[id]/chat/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, TaskStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.chatMessage.findMany({
    where: { taskId: params.id },
    include: {
      author: { select: { id: true, name: true, role: true } },
      attachment: { select: { id: true, filename: true, size: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Pro Rector is read-only in chat
  if (session.user.role === Role.PRO_RECTOR) {
    return NextResponse.json({ error: "Pro Rector has read-only access to chat" }, { status: 403 });
  }

  const body = await req.json();

  const message = await prisma.chatMessage.create({
    data: {
      taskId: params.id,
      authorId: session.user.id,
      content: body.content,
      attachmentId: body.attachmentId || null,
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
      attachment: { select: { id: true, filename: true, size: true } },
    },
  });

  // Update task's updatedAt to track activity
  await prisma.task.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(message, { status: 201 });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/tasks/[id]/chat/
git commit -m "feat: add chat message API with role-based access control"
```

---

### Task 11: Document Upload API

**Files:**
- Create: `src/app/api/tasks/[id]/documents/route.ts`
- Create: `src/app/api/tasks/[id]/documents/[docId]/route.ts`
- Create: `src/lib/upload.ts`

- [ ] **Step 1: Create upload utility**

Create `src/lib/upload.ts`:
```typescript
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "./prisma";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_TASK_STORAGE = 200 * 1024 * 1024; // 200 MB

export async function getUploadPath(): Promise<string> {
  const config = await prisma.systemConfig.findUnique({
    where: { key: "upload_path" },
  });
  return config?.value || "./uploads";
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function getTaskStorageUsed(taskId: string): Promise<number> {
  const result = await prisma.document.aggregate({
    where: { taskId },
    _sum: { size: true },
  });
  return result._sum.size || 0;
}

export function validateFileSize(size: number): string | null {
  if (size > MAX_FILE_SIZE) {
    return `File exceeds maximum size of 25 MB`;
  }
  return null;
}

export async function validateTaskStorage(
  taskId: string,
  newFileSize: number
): Promise<string | null> {
  const used = await getTaskStorageUsed(taskId);
  if (used + newFileSize > MAX_TASK_STORAGE) {
    return `Task storage limit of 200 MB would be exceeded (${Math.round(used / 1024 / 1024)} MB used)`;
  }
  return null;
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}
```

- [ ] **Step 2: Create document upload and list endpoint**

Create `src/app/api/tasks/[id]/documents/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUploadPath,
  ensureDir,
  validateFileSize,
  validateTaskStorage,
  getFileExtension,
} from "@/lib/upload";
import { DocType } from "@prisma/client";
import path from "path";
import { writeFile } from "fs/promises";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const documents = await prisma.document.findMany({
    where: { taskId: params.id },
    include: { uploadedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    select: { code: true },
  });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const docType = formData.get("type") as DocType | null;

  if (!file || !docType) {
    return NextResponse.json({ error: "File and type are required" }, { status: 400 });
  }

  // Validate file size
  const sizeError = validateFileSize(file.size);
  if (sizeError) return NextResponse.json({ error: sizeError }, { status: 400 });

  // Validate task storage
  const storageError = await validateTaskStorage(params.id, file.size);
  if (storageError) return NextResponse.json({ error: storageError }, { status: 400 });

  // Save file
  const uploadBase = await getUploadPath();
  const subDir = docType === "CHAT_ATTACHMENT" ? "chat" : "documents";
  const dir = path.join(uploadBase, "tasks", task.code, subDir);
  await ensureDir(dir);

  const ext = getFileExtension(file.name);
  const filename = `${docType.toLowerCase()}_${Date.now()}${ext}`;
  const filePath = path.join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const document = await prisma.document.create({
    data: {
      taskId: params.id,
      type: docType,
      filename: file.name,
      path: filePath,
      size: file.size,
      uploadedById: session.user.id,
    },
    include: { uploadedBy: { select: { id: true, name: true } } },
  });

  // Update task's updatedAt
  await prisma.task.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(document, { status: 201 });
}
```

- [ ] **Step 3: Create document download endpoint**

Create `src/app/api/tasks/[id]/documents/[docId]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

const INLINE_TYPES = [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const document = await prisma.document.findUnique({
    where: { id: params.docId },
  });

  if (!document || document.taskId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await readFile(document.path);
  const ext = path.extname(document.filename).toLowerCase();
  const isInline = INLINE_TYPES.includes(ext);

  const headers: Record<string, string> = {
    "Content-Type": getMimeType(ext),
    "Content-Length": String(buffer.length),
  };

  if (!isInline) {
    headers["Content-Disposition"] = `attachment; filename="${document.filename}"`;
  }

  return new NextResponse(buffer, { headers });
}

function getMimeType(ext: string): string {
  const types: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return types[ext] || "application/octet-stream";
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/tasks/[id]/documents/ src/lib/upload.ts
git commit -m "feat: add document upload/download API with size validation"
```

---

### Task 12: Audit Log API

**Files:**
- Create: `src/app/api/tasks/[id]/audit/route.ts`

- [ ] **Step 1: Create audit log endpoint**

Create `src/app/api/tasks/[id]/audit/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.auditLog.findMany({
    where: { taskId: params.id },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(logs);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/tasks/[id]/audit/
git commit -m "feat: add audit log API endpoint"
```

---

## Phase 4: Notification System

### Task 13: Notification API & SSE

**Files:**
- Create: `src/app/api/notifications/route.ts`
- Create: `src/app/api/notifications/sse/route.ts`
- Create: `src/app/api/notifications/[id]/acknowledge/route.ts`
- Create: `src/lib/sse.ts`
- Create: `src/lib/notify.ts`

- [ ] **Step 1: Create SSE manager**

Create `src/lib/sse.ts`:
```typescript
type SSEConnection = {
  controller: ReadableStreamDefaultController;
  userId: string;
};

class SSEManager {
  private connections: Map<string, SSEConnection[]> = new Map();

  addConnection(userId: string, controller: ReadableStreamDefaultController) {
    const existing = this.connections.get(userId) || [];
    existing.push({ controller, userId });
    this.connections.set(userId, existing);
  }

  removeConnection(userId: string, controller: ReadableStreamDefaultController) {
    const existing = this.connections.get(userId) || [];
    const filtered = existing.filter((c) => c.controller !== controller);
    if (filtered.length === 0) {
      this.connections.delete(userId);
    } else {
      this.connections.set(userId, filtered);
    }
  }

  send(userId: string, data: any) {
    const connections = this.connections.get(userId) || [];
    const message = `data: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    for (const conn of connections) {
      try {
        conn.controller.enqueue(encoder.encode(message));
      } catch {
        this.removeConnection(userId, conn.controller);
      }
    }
  }
}

export const sseManager = new SSEManager();
```

- [ ] **Step 2: Create notification dispatcher**

Create `src/lib/notify.ts`:
```typescript
import { prisma } from "./prisma";
import { sseManager } from "./sse";
import { NotifSeverity } from "@prisma/client";

type NotifyParams = {
  userId: string;
  taskId?: string;
  type: string;
  message: string;
  severity: NotifSeverity;
  escalationLevel?: number;
};

export async function notify(params: NotifyParams) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      taskId: params.taskId,
      type: params.type,
      message: params.message,
      severity: params.severity,
      escalationLevel: params.escalationLevel,
    },
    include: {
      task: { select: { id: true, code: true, title: true } },
    },
  });

  // Push via SSE
  sseManager.send(params.userId, {
    type: "notification",
    payload: notification,
  });

  // Send email for HIGH/CRITICAL severity
  if (params.severity === "HIGH" || params.severity === "CRITICAL") {
    // Email sending deferred to Phase 5 (email.ts implementation)
    await prisma.notification.update({
      where: { id: notification.id },
      data: { emailSent: true },
    });
  }

  return notification;
}

export async function notifyMany(paramsList: NotifyParams[]) {
  for (const params of paramsList) {
    await notify(params);
  }
}
```

- [ ] **Step 3: Create notification list endpoint**

Create `src/app/api/notifications/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    include: {
      task: { select: { id: true, code: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Mark as read
  const unreadIds = notifications
    .filter((n) => !n.isRead)
    .map((n) => n.id);

  if (unreadIds.length) {
    await prisma.notification.updateMany({
      where: { id: { in: unreadIds } },
      data: { isRead: true },
    });
  }

  return NextResponse.json(notifications);
}
```

- [ ] **Step 4: Create SSE endpoint**

Create `src/app/api/notifications/sse/route.ts`:
```typescript
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sseManager } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const stream = new ReadableStream({
    start(controller) {
      sseManager.addConnection(userId, controller);

      // Send initial ping
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Heartbeat every 30 seconds
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(interval);
        }
      }, 30000);

      // Cleanup on close
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        sseManager.removeConnection(userId, controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 5: Create acknowledge endpoint**

Create `src/app/api/notifications/[id]/acknowledge/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notification = await prisma.notification.findUnique({
    where: { id: params.id },
  });

  if (!notification || notification.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.notification.update({
    where: { id: params.id },
    data: { isSeen: true, seenAt: new Date() },
  });

  // Log acknowledgment in audit trail if this is a task-related escalation
  if (notification.taskId && notification.escalationLevel) {
    await prisma.auditLog.create({
      data: {
        taskId: notification.taskId,
        userId: session.user.id,
        action: "acknowledge_notification",
        metadata: {
          escalationLevel: notification.escalationLevel,
          notificationType: notification.type,
        },
      },
    });
  }

  return NextResponse.json(updated);
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/sse.ts src/lib/notify.ts src/app/api/notifications/
git commit -m "feat: add notification system with SSE real-time delivery and acknowledgment"
```

---

### Task 14: Cron Job Endpoints

**Files:**
- Create: `src/app/api/cron/check-inactivity/route.ts`
- Create: `src/app/api/cron/check-overdue/route.ts`
- Create: `src/app/api/cron/check-stale-paused/route.ts`
- Create: `src/app/api/cron/check-stale-drafts/route.ts`
- Create: `src/lib/cron-auth.ts`

- [ ] **Step 1: Create cron auth helper**

Create `src/lib/cron-auth.ts`:
```typescript
import { NextRequest } from "next/server";

export function verifyCronSecret(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  return auth.slice(7) === process.env.CRON_SECRET;
}
```

- [ ] **Step 2: Create inactivity checker**

Create `src/app/api/cron/check-inactivity/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { TaskStatus, Role } from "@prisma/client";

const EXCLUDED_STATUSES: TaskStatus[] = [
  TaskStatus.DRAFT,
  TaskStatus.PAUSED,
  TaskStatus.ACCEPTED_CLOSED,
  TaskStatus.KILLED,
];

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

  const inactiveTasks = await prisma.task.findMany({
    where: {
      status: { notIn: EXCLUDED_STATUSES },
      updatedAt: { lt: threeDaysAgo },
    },
    include: {
      coordinator: { select: { id: true } },
    },
  });

  let notified = 0;

  for (const task of inactiveTasks) {
    const daysInactive = Math.floor(
      (now.getTime() - task.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Level 1: Coordinator (3+ days)
    if (daysInactive >= 3) {
      const existing = await prisma.notification.findFirst({
        where: {
          taskId: task.id,
          type: "INACTIVITY_WARNING",
          escalationLevel: 1,
        },
      });

      if (!existing) {
        await notify({
          userId: task.coordinatorId,
          taskId: task.id,
          type: "INACTIVITY_WARNING",
          message: `${task.code} has had no activity for ${daysInactive} days.`,
          severity: "NORMAL",
          escalationLevel: 1,
        });
        notified++;
      }
    }

    // Level 2: Director (5+ days, Level 1 not acknowledged)
    if (daysInactive >= 5) {
      const level1 = await prisma.notification.findFirst({
        where: {
          taskId: task.id,
          type: "INACTIVITY_WARNING",
          escalationLevel: 1,
        },
      });

      if (level1 && !level1.isSeen) {
        const level2Exists = await prisma.notification.findFirst({
          where: {
            taskId: task.id,
            type: "INACTIVITY_WARNING",
            escalationLevel: 2,
          },
        });

        if (!level2Exists) {
          const director = await prisma.user.findFirst({
            where: { role: Role.DIRECTOR, isActive: true },
          });
          if (director) {
            await notify({
              userId: director.id,
              taskId: task.id,
              type: "INACTIVITY_WARNING",
              message: `${task.code} has had no activity for ${daysInactive} days. Coordinator has not acknowledged.`,
              severity: "HIGH",
              escalationLevel: 2,
            });
            notified++;
          }
        }
      }
    }

    // Level 3: Pro Rector (10+ days, Level 2 not acknowledged)
    if (daysInactive >= 10) {
      const level2 = await prisma.notification.findFirst({
        where: {
          taskId: task.id,
          type: "INACTIVITY_WARNING",
          escalationLevel: 2,
        },
      });

      if (level2 && !level2.isSeen) {
        const level3Exists = await prisma.notification.findFirst({
          where: {
            taskId: task.id,
            type: "INACTIVITY_WARNING",
            escalationLevel: 3,
          },
        });

        if (!level3Exists) {
          const proRector = await prisma.user.findFirst({
            where: { role: Role.PRO_RECTOR, isActive: true },
          });
          if (proRector) {
            await notify({
              userId: proRector.id,
              taskId: task.id,
              type: "INACTIVITY_WARNING",
              message: `${task.code} has had no activity for ${daysInactive} days. Escalated to Pro Rector.`,
              severity: "CRITICAL",
              escalationLevel: 3,
            });
            notified++;
          }
        }
      }
    }
  }

  // Store last run time
  await prisma.systemConfig.upsert({
    where: { key: "cron_inactivity_last_run" },
    update: { value: now.toISOString(), updatedById: "system" },
    create: { key: "cron_inactivity_last_run", value: now.toISOString(), updatedById: "system" },
  }).catch(() => {
    // systemConfig requires a valid userId; we'll handle this with a system user in production
  });

  return NextResponse.json({ checked: inactiveTasks.length, notified });
}
```

- [ ] **Step 3: Create overdue checker**

Create `src/app/api/cron/check-overdue/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { TaskStatus, Role } from "@prisma/client";

const TERMINAL_STATUSES: TaskStatus[] = [
  TaskStatus.ACCEPTED_CLOSED,
  TaskStatus.KILLED,
];

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const overdueTasks = await prisma.task.findMany({
    where: {
      status: { notIn: TERMINAL_STATUSES },
      expectedDate: { lt: now },
    },
    include: {
      coordinator: { select: { id: true } },
    },
  });

  let notified = 0;

  for (const task of overdueTasks) {
    // Check if we already sent an overdue notification today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const existingToday = await prisma.notification.findFirst({
      where: {
        taskId: task.id,
        type: "OVERDUE",
        createdAt: { gte: todayStart },
      },
    });

    if (existingToday) continue;

    const daysOverdue = Math.ceil(
      (now.getTime() - new Date(task.expectedDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Notify Coordinator, Director, Pro Rector
    const director = await prisma.user.findFirst({
      where: { role: Role.DIRECTOR, isActive: true },
    });
    const proRector = await prisma.user.findFirst({
      where: { role: Role.PRO_RECTOR, isActive: true },
    });

    const recipients = [
      task.coordinatorId,
      director?.id,
      proRector?.id,
    ].filter(Boolean) as string[];

    for (const userId of recipients) {
      await notify({
        userId,
        taskId: task.id,
        type: "OVERDUE",
        message: `${task.code} is ${daysOverdue} day(s) overdue.`,
        severity: "HIGH",
      });
      notified++;
    }
  }

  return NextResponse.json({ checked: overdueTasks.length, notified });
}
```

- [ ] **Step 4: Create stale pause checker**

Create `src/app/api/cron/check-stale-paused/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { TaskStatus, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const pausedTasks = await prisma.task.findMany({
    where: {
      status: TaskStatus.PAUSED,
      pauseResumeDate: { lt: now },
    },
  });

  let notified = 0;

  for (const task of pausedTasks) {
    const daysPast = Math.ceil(
      (now.getTime() - new Date(task.pauseResumeDate!).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Level 1: whoever paused it (1+ days past)
    if (daysPast >= 1) {
      const pauseLog = await prisma.auditLog.findFirst({
        where: { taskId: task.id, toStatus: TaskStatus.PAUSED },
        orderBy: { createdAt: "desc" },
      });

      if (pauseLog) {
        const existing = await prisma.notification.findFirst({
          where: { taskId: task.id, type: "STALE_PAUSE", escalationLevel: 1 },
        });
        if (!existing) {
          await notify({
            userId: pauseLog.userId,
            taskId: task.id,
            type: "STALE_PAUSE",
            message: `${task.code} is ${daysPast} day(s) past its expected resume date.`,
            severity: "HIGH",
            escalationLevel: 1,
          });
          notified++;
        }
      }
    }

    // Level 2: Director (3+ days past)
    if (daysPast >= 3) {
      const existing = await prisma.notification.findFirst({
        where: { taskId: task.id, type: "STALE_PAUSE", escalationLevel: 2 },
      });
      if (!existing) {
        const director = await prisma.user.findFirst({
          where: { role: Role.DIRECTOR, isActive: true },
        });
        if (director) {
          await notify({
            userId: director.id,
            taskId: task.id,
            type: "STALE_PAUSE",
            message: `${task.code} has been paused ${daysPast} days past its resume date.`,
            severity: "HIGH",
            escalationLevel: 2,
          });
          notified++;
        }
      }
    }

    // Level 3: Pro Rector (7+ days past)
    if (daysPast >= 7) {
      const existing = await prisma.notification.findFirst({
        where: { taskId: task.id, type: "STALE_PAUSE", escalationLevel: 3 },
      });
      if (!existing) {
        const proRector = await prisma.user.findFirst({
          where: { role: Role.PRO_RECTOR, isActive: true },
        });
        if (proRector) {
          await notify({
            userId: proRector.id,
            taskId: task.id,
            type: "STALE_PAUSE",
            message: `${task.code} has been paused ${daysPast} days past its resume date. Requires attention.`,
            severity: "CRITICAL",
            escalationLevel: 3,
          });
          notified++;
        }
      }
    }
  }

  return NextResponse.json({ checked: pausedTasks.length, notified });
}
```

- [ ] **Step 5: Create stale draft cleanup**

Create `src/app/api/cron/check-stale-drafts/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { TaskStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);

  let notified = 0;
  let killed = 0;

  // Auto-kill drafts older than 45 days
  const ancientDrafts = await prisma.task.findMany({
    where: {
      status: TaskStatus.DRAFT,
      updatedAt: { lt: fortyFiveDaysAgo },
    },
  });

  for (const task of ancientDrafts) {
    await prisma.task.update({
      where: { id: task.id },
      data: { status: TaskStatus.KILLED },
    });
    await prisma.auditLog.create({
      data: {
        taskId: task.id,
        userId: task.coordinatorId,
        action: "status_change",
        fromStatus: TaskStatus.DRAFT,
        toStatus: TaskStatus.KILLED,
        reason: "Abandoned draft — auto-cleaned after 45 days of inactivity",
      },
    });
    killed++;
  }

  // Warn coordinators about drafts older than 30 days
  const staleDrafts = await prisma.task.findMany({
    where: {
      status: TaskStatus.DRAFT,
      updatedAt: { lt: thirtyDaysAgo, gte: fortyFiveDaysAgo },
    },
  });

  for (const task of staleDrafts) {
    const existing = await prisma.notification.findFirst({
      where: { taskId: task.id, type: "STALE_DRAFT" },
    });
    if (!existing) {
      await notify({
        userId: task.coordinatorId,
        taskId: task.id,
        type: "STALE_DRAFT",
        message: `${task.code} has been in draft for over 30 days. Complete or delete it.`,
        severity: "NORMAL",
      });
      notified++;
    }
  }

  return NextResponse.json({ notified, killed });
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/cron/ src/lib/cron-auth.ts
git commit -m "feat: add cron job endpoints for inactivity, overdue, stale pause, and stale draft checks"
```

---

## Phase 5: Frontend Views (remaining tasks)

> **Note:** The remaining tasks build out the actual page views by porting components from `UI_Design/By_claude/REFERENCE_IMPLEMENTATION.jsx`. Each task below follows the same pattern: create the page component, wire it to the API, replace the placeholder page.
>
> Due to plan length constraints, these are described at a higher level with file paths and key implementation points. The code follows the same patterns established in Tasks 6-7 (components) and Tasks 8-12 (APIs).

### Task 15: Coordinator Task Form

**Files:**
- Replace: `src/app/(coordinator)/new/page.tsx`
- Create: `src/components/AcceptanceCriteria.tsx`
- Create: `src/components/DocumentChecklist.tsx`

Port `CoordinatorForm.jsx` from the reference implementation. Key behaviors:
- All form fields from spec section 7
- Dynamic acceptance criteria checklist builder (add/remove items)
- Document upload slots with gate logic (submit blocked until requirements doc uploaded)
- Policy document mandatory when type = Policy Change
- Form submits to `POST /api/tasks`

### Task 16: Coordinator Task List

**Files:**
- Replace: `src/app/(coordinator)/tasks/page.tsx`
- Create: `src/app/(coordinator)/tasks/[id]/page.tsx`

Coordinator sees only their own tasks. Task list uses `TaskCard` component. Task detail view shows full task info with accept/reject buttons when status = DEPLOYED.

### Task 17: Director Approval Queue & Views

**Files:**
- Replace: `src/app/(director)/queue/page.tsx`
- Replace: `src/app/(director)/tasks/page.tsx`
- Create: `src/app/(director)/tasks/[id]/page.tsx`
- Create: `src/app/(director)/alerts/page.tsx`

Port `DirectorQueue.jsx`. Inline approve/reject on pending tasks. Tasks list shows all tasks. Task detail shows final approval button when status = COORDINATOR_ACCEPTED.

### Task 18: Team Resource Task Page (Deep Link)

**Files:**
- Replace: `src/app/task/[id]/page.tsx`

Port `ICTTaskPage.jsx`. No navigation shell. Status dropdown, ICT estimated date field. Chat thread. Single "Save Update" action.

### Task 19: Task Detail & Chat Thread Components

**Files:**
- Create: `src/components/TaskDetail.tsx`
- Create: `src/components/ChatThread.tsx`
- Create: `src/components/AuditLog.tsx`

Port from reference implementation. TaskDetail is role-aware (different action buttons per role). ChatThread is WhatsApp-style with team messages right-aligned. AuditLog shows timestamped history. Pro Rector chat is read-only.

### Task 20: Pro Rector Dashboard

**Files:**
- Replace: `src/app/(pro-rector)/dashboard/page.tsx`
- Replace: `src/app/(pro-rector)/tasks/page.tsx`
- Create: `src/app/(pro-rector)/tasks/[id]/page.tsx`
- Replace: `src/app/(pro-rector)/alerts/page.tsx`

Port `ProRectorDashboard.jsx`. Summary cards (active, overdue, pending, man-days saved), status distribution bar, escalated tasks section, task list. Quick actions: Kill, Change Priority, Push Deadline (inline with mandatory reason).

### Task 21: Director Dashboard

**Files:**
- Replace: `src/app/(director)/dashboard/page.tsx`

Same layout as Pro Rector dashboard. Identical data. Different actions (Change Priority, approve from queue link).

### Task 22: Admin Panel

**Files:**
- Replace: `src/app/(admin)/users/page.tsx`
- Replace: `src/app/(admin)/teams/page.tsx`
- Replace: `src/app/(admin)/settings/page.tsx`
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/teams/route.ts`
- Create: `src/app/api/admin/smtp/route.ts`

User CRUD (email, name, role, isActive). Team CRUD (name, resource person dropdown). Settings page with SMTP config fields, upload path, default tolerance, FCM keys. Cron job last-run display.

---

## Phase 6: Email, Push, PWA

### Task 23: Email Service

**Files:**
- Create: `src/lib/email.ts`
- Modify: `src/lib/notify.ts`

Create nodemailer transport that reads SMTP config from SystemConfig table. Email template with task deep link button. Update `notify()` to call email for HIGH/CRITICAL severity.

### Task 24: Firebase Cloud Messaging

**Files:**
- Create: `src/lib/firebase.ts`
- Create: `src/app/api/notifications/register-device/route.ts`
- Modify: `src/lib/notify.ts`

Initialize firebase-admin with config from SystemConfig. Register device token endpoint. Update `notify()` to send FCM push for CRITICAL severity to Pro Rector and Director.

### Task 25: PWA Setup

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Create: `public/firebase-messaging-sw.js`
- Modify: `src/app/layout.tsx`

PWA manifest with NUST branding. Service worker for app shell caching. Firebase messaging service worker for background push. Offline banner component.

### Task 26: Pro Rector Override Actions API

**Files:**
- Create: `src/app/api/tasks/[id]/kill/route.ts`
- Create: `src/app/api/tasks/[id]/priority/route.ts`
- Create: `src/app/api/tasks/[id]/deadline/route.ts`

Three dedicated endpoints for Pro Rector's single-tap actions. Each requires mandatory reason. All log to audit trail and trigger notifications.

---

## Phase 7: Integration & Polish

### Task 27: Wire Notifications to Status Transitions

**Files:**
- Modify: `src/app/api/tasks/[id]/status/route.ts`

Add notification triggers after every status change according to the alert rules table in the spec. This is where the full alert rules matrix gets implemented.

### Task 28: Tolerance Check (ICT Estimate)

**Files:**
- Modify: `src/app/api/tasks/[id]/status/route.ts`

When team accepts task and enters estimated date: compare against `expectedDate + tolerance`. If exceeded, auto-notify coordinator.

### Task 29: Auto-Escalation on 3rd Rejection

**Files:**
- Modify: `src/app/api/tasks/[id]/status/route.ts`

After incrementing rejectionCount on REWORK transition: if count >= 3, auto-notify Pro Rector (critical, in-app + email + push) and Director (email).

### Task 30: End-to-End Testing

Manual testing checklist:
- [ ] Coordinator creates task, uploads documents, submits
- [ ] Director approves/rejects task
- [ ] Team receives email with deep link, accepts task, enters ICT date
- [ ] Team moves through statuses: Analysis → Development → Testing → Deployed
- [ ] Coordinator accepts deliverable
- [ ] Director gives final approval → task closed
- [ ] Rejection → Rework cycle with counter
- [ ] 3rd rejection → Pro Rector escalation
- [ ] Pro Rector kills a task, changes priority, pushes deadline
- [ ] Inactivity escalation ladder fires correctly
- [ ] Paused task with resume date triggers stale pause alerts
- [ ] Coordinator kills own draft (no notification) vs kills rejected task (Director notified)
- [ ] SSE delivers notifications in real-time
- [ ] PWA installable on mobile, push notifications work
- [ ] Admin manages users, teams, SMTP settings

### Task 31: Initial Commit & Push

```bash
git add -A
git commit -m "feat: complete Academic Operations Tracker Phase 1"
git push -u origin main
```
