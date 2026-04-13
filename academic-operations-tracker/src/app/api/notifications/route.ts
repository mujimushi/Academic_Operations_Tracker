import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    include: {
      task: { select: { id: true, code: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Capture original isRead values before bulk update
  const result = notifications.map((n) => ({ ...n }));

  // Mark all unread notifications as read
  const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
  if (unreadIds.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: unreadIds } },
      data: { isRead: true },
    });
  }

  return NextResponse.json(result);
}
