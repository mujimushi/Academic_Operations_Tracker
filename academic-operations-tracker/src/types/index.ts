import type { Task, User, Team, Document, ChatMessage, AuditLog, AcceptanceCriterion, Notification } from "@/generated/prisma/client";
import { Role } from "@/generated/prisma/client";

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
