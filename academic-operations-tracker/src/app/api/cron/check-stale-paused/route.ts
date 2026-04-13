import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { TaskStatus, Role } from "@/generated/prisma/client";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find paused tasks where the resume date has passed
  const tasks = await prisma.task.findMany({
    where: {
      status: TaskStatus.PAUSED,
      pauseResumeDate: { lt: now },
    },
  });

  let notified = 0;

  for (const task of tasks) {
    const daysPastResume = Math.floor(
      (now.getTime() - task.pauseResumeDate!.getTime()) / MS_PER_DAY
    );

    // Check existing stale-pause notifications for this task
    const existingNotifications = await prisma.notification.findMany({
      where: {
        taskId: task.id,
        type: "STALE_PAUSE",
      },
      select: {
        escalationLevel: true,
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

    // Level 1: Day 1+ — notify who paused it
    if (daysPastResume >= 1 && !level1) {
      // Find who paused this task from the audit log
      const pauseLog = await prisma.auditLog.findFirst({
        where: {
          taskId: task.id,
          toStatus: TaskStatus.PAUSED,
        },
        orderBy: { createdAt: "desc" },
        select: { userId: true },
      });

      if (pauseLog) {
        await notify({
          userId: pauseLog.userId,
          taskId: task.id,
          type: "STALE_PAUSE",
          message: `Task ${task.code} is ${daysPastResume} day(s) past its resume date`,
          severity: "HIGH",
          escalationLevel: 1,
        });
        notified++;
      }
    }

    // Level 2: Day 3+ — notify Director
    if (daysPastResume >= 3 && !level2) {
      const director = await prisma.user.findFirst({
        where: { role: Role.DIRECTOR, isActive: true },
        select: { id: true },
      });
      if (director) {
        await notify({
          userId: director.id,
          taskId: task.id,
          type: "STALE_PAUSE",
          message: `Task ${task.code} is ${daysPastResume} day(s) past its resume date (escalated)`,
          severity: "HIGH",
          escalationLevel: 2,
        });
        notified++;
      }
    }

    // Level 3: Day 7+ — notify Pro Rector
    if (daysPastResume >= 7 && !level3) {
      const proRector = await prisma.user.findFirst({
        where: { role: Role.PRO_RECTOR, isActive: true },
        select: { id: true },
      });
      if (proRector) {
        await notify({
          userId: proRector.id,
          taskId: task.id,
          type: "STALE_PAUSE",
          message: `Task ${task.code} is ${daysPastResume} day(s) past its resume date (critical escalation)`,
          severity: "CRITICAL",
          escalationLevel: 3,
        });
        notified++;
      }
    }
  }

  return NextResponse.json({ checked: tasks.length, notified });
}
