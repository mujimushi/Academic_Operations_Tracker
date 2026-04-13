import { prisma } from "./prisma";
import { sseManager } from "./sse";
import { NotifSeverity } from "@/generated/prisma/client";

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

  // Push via SSE to connected clients
  sseManager.send(params.userId, {
    type: "notification",
    payload: notification,
  });

  // Mark emailSent for HIGH/CRITICAL (actual email sending deferred to Task 23)
  if (params.severity === "HIGH" || params.severity === "CRITICAL") {
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
