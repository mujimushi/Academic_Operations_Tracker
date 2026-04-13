import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { TaskStatus, Role } from "@/generated/prisma/client";

const INACTIVE_STATUSES = [
  TaskStatus.DRAFT,
  TaskStatus.PAUSED,
  TaskStatus.ACCEPTED_CLOSED,
  TaskStatus.KILLED,
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * MS_PER_DAY);

  // Find active tasks that haven't been updated in 3+ days
  const tasks = await prisma.task.findMany({
    where: {
      status: { notIn: INACTIVE_STATUSES },
      updatedAt: { lt: threeDaysAgo },
    },
    include: {
      coordinator: { select: { id: true, name: true } },
    },
  });

  let notified = 0;

  for (const task of tasks) {
    const daysInactive = Math.floor(
      (now.getTime() - task.updatedAt.getTime()) / MS_PER_DAY
    );

    // Check existing escalation notifications for this task
    const existingNotifications = await prisma.notification.findMany({
      where: {
        taskId: task.id,
        type: "INACTIVITY_WARNING",
      },
      select: {
        escalationLevel: true,
        isSeen: true,
      },
    });

    const level1 = existingNotifications.find(
      (n) => n.escalationLevel === 1
    );
    const level2 = existingNotifications.find(
      (n) => n.escalationLevel === 2
    );
    const level3 = existingNotifications.find(
      (n) => n.escalationLevel === 3
    );

    // Level 1: Day 3+ — notify Coordinator
    if (daysInactive >= 3 && !level1) {
      await notify({
        userId: task.coordinatorId,
        taskId: task.id,
        type: "INACTIVITY_WARNING",
        message: `Task ${task.code} has been inactive for ${daysInactive} days`,
        severity: "NORMAL",
        escalationLevel: 1,
      });
      notified++;
    }

    // Level 2: Day 5+ — notify Director (if level 1 unseen)
    if (daysInactive >= 5 && level1 && !level1.isSeen && !level2) {
      const director = await prisma.user.findFirst({
        where: { role: Role.DIRECTOR, isActive: true },
        select: { id: true },
      });
      if (director) {
        await notify({
          userId: director.id,
          taskId: task.id,
          type: "INACTIVITY_WARNING",
          message: `Task ${task.code} has been inactive for ${daysInactive} days (escalated)`,
          severity: "HIGH",
          escalationLevel: 2,
        });
        notified++;
      }
    }

    // Level 3: Day 10+ — notify Pro Rector (if level 2 unseen)
    if (daysInactive >= 10 && level2 && !level2.isSeen && !level3) {
      const proRector = await prisma.user.findFirst({
        where: { role: Role.PRO_RECTOR, isActive: true },
        select: { id: true },
      });
      if (proRector) {
        await notify({
          userId: proRector.id,
          taskId: task.id,
          type: "INACTIVITY_WARNING",
          message: `Task ${task.code} has been inactive for ${daysInactive} days (critical escalation)`,
          severity: "CRITICAL",
          escalationLevel: 3,
        });
        notified++;
      }
    }
  }

  return NextResponse.json({ checked: tasks.length, notified });
}
