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
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  // Find tasks that are overdue (not closed/killed, past expected date)
  const tasks = await prisma.task.findMany({
    where: {
      status: {
        notIn: [TaskStatus.ACCEPTED_CLOSED, TaskStatus.KILLED],
      },
      expectedDate: { lt: now },
    },
    include: {
      coordinator: { select: { id: true, name: true } },
    },
  });

  let notified = 0;

  for (const task of tasks) {
    // Check if an OVERDUE notification was already sent today
    const alreadySentToday = await prisma.notification.findFirst({
      where: {
        taskId: task.id,
        type: "OVERDUE",
        createdAt: { gte: startOfToday },
      },
    });

    if (alreadySentToday) continue;

    const daysOverdue = Math.floor(
      (now.getTime() - task.expectedDate.getTime()) / MS_PER_DAY
    );

    // Notify Coordinator
    await notify({
      userId: task.coordinatorId,
      taskId: task.id,
      type: "OVERDUE",
      message: `Task ${task.code} is overdue by ${daysOverdue} day(s)`,
      severity: "HIGH",
    });
    notified++;

    // Notify Director
    const director = await prisma.user.findFirst({
      where: { role: Role.DIRECTOR, isActive: true },
      select: { id: true },
    });
    if (director) {
      await notify({
        userId: director.id,
        taskId: task.id,
        type: "OVERDUE",
        message: `Task ${task.code} is overdue by ${daysOverdue} day(s)`,
        severity: "HIGH",
      });
      notified++;
    }

    // Notify Pro Rector
    const proRector = await prisma.user.findFirst({
      where: { role: Role.PRO_RECTOR, isActive: true },
      select: { id: true },
    });
    if (proRector) {
      await notify({
        userId: proRector.id,
        taskId: task.id,
        type: "OVERDUE",
        message: `Task ${task.code} is overdue by ${daysOverdue} day(s)`,
        severity: "HIGH",
      });
      notified++;
    }
  }

  return NextResponse.json({ checked: tasks.length, notified });
}
