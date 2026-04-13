import { prisma } from "./prisma";
import { sseManager } from "./sse";
import { NotifSeverity } from "@/generated/prisma/client";
import { sendEmail, buildTaskEmailHtml } from "./email";
import { sendPushNotification } from "./firebase";

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

  // Send email for HIGH/CRITICAL severity
  if (params.severity === "HIGH" || params.severity === "CRITICAL") {
    // Fetch email and role together — role is also needed for FCM below
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true, role: true },
    });

    if (user?.email && notification.task) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const taskUrl = `${baseUrl}/task/${notification.task.id}`;

      const emailSent = await sendEmail({
        to: user.email,
        subject: `[AOT] ${notification.task.code} — ${params.message}`,
        html: buildTaskEmailHtml({
          heading: params.type.replace(/_/g, " "),
          message: params.message,
          taskCode: notification.task.code,
          taskTitle: notification.task.title,
          actionUrl: taskUrl,
        }),
      });

      await prisma.notification.update({
        where: { id: notification.id },
        data: { emailSent },
      });
    }

    // Send FCM push for CRITICAL severity to Pro Rector and Director
    if (params.severity === "CRITICAL" && user && (user.role === "PRO_RECTOR" || user.role === "DIRECTOR")) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const taskUrl = notification.task
        ? `${baseUrl}/task/${notification.task.id}`
        : baseUrl;

      const pushSent = await sendPushNotification({
        userId: params.userId,
        title: "NUST Academic Tracker",
        body: params.message,
        taskUrl,
      });

      if (pushSent) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { pushSent: true },
        });
      }
    }
  }

  return notification;
}

export async function notifyMany(paramsList: NotifyParams[]) {
  for (const params of paramsList) {
    await notify(params);
  }
}
