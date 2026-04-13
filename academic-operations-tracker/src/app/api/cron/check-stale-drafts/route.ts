import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { TaskStatus } from "@/generated/prisma/client";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_PER_DAY);
  const fortyFiveDaysAgo = new Date(now.getTime() - 45 * MS_PER_DAY);

  let notified = 0;
  let killed = 0;

  // 1. Auto-kill drafts > 45 days inactive
  const abandonedDrafts = await prisma.task.findMany({
    where: {
      status: TaskStatus.DRAFT,
      updatedAt: { lt: fortyFiveDaysAgo },
    },
  });

  for (const task of abandonedDrafts) {
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
        reason:
          "Abandoned draft — auto-cleaned after 45 days of inactivity",
      },
    });

    killed++;
  }

  // 2. Warn drafts > 30 days (but < 45 — already killed above)
  const staleDrafts = await prisma.task.findMany({
    where: {
      status: TaskStatus.DRAFT,
      updatedAt: {
        lt: thirtyDaysAgo,
        gte: fortyFiveDaysAgo,
      },
    },
  });

  for (const task of staleDrafts) {
    // Check if a STALE_DRAFT notification already exists for this task
    const existing = await prisma.notification.findFirst({
      where: {
        taskId: task.id,
        type: "STALE_DRAFT",
      },
    });

    if (!existing) {
      await notify({
        userId: task.coordinatorId,
        taskId: task.id,
        type: "STALE_DRAFT",
        message: `Draft task ${task.code} has been inactive for over 30 days and will be auto-cleaned after 45 days`,
        severity: "NORMAL",
      });
      notified++;
    }
  }

  return NextResponse.json({ notified, killed });
}
