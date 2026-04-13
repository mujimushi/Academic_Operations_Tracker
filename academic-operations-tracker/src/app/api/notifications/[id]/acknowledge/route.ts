import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification || notification.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: {
      isSeen: true,
      seenAt: new Date(),
    },
    include: {
      task: { select: { id: true, code: true, title: true } },
    },
  });

  // Create audit log entry for escalation acknowledgments
  if (notification.taskId && notification.escalationLevel != null) {
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
