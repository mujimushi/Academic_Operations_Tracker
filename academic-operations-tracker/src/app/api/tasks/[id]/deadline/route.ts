import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, TaskStatus, NotifSeverity } from "@/generated/prisma/client";
import { notify } from "@/lib/notify";

const taskIncludes = {
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
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
  },
  _count: { select: { chatMessages: true } },
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, id: userId } = session.user;

  if (role !== Role.PRO_RECTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const body = await request.json();
  const { deadline, reason } = body as { deadline?: string; reason?: string };

  if (!deadline || deadline.trim() === "") {
    return NextResponse.json(
      { error: "deadline is required" },
      { status: 400 }
    );
  }

  if (!reason || reason.trim() === "") {
    return NextResponse.json(
      { error: "reason is required" },
      { status: 400 }
    );
  }

  const newDeadline = new Date(deadline);
  if (isNaN(newDeadline.getTime())) {
    return NextResponse.json(
      { error: "deadline must be a valid ISO date string" },
      { status: 400 }
    );
  }

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      coordinator: { select: { id: true } },
      team: { select: { resourceId: true } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (
    task.status === TaskStatus.KILLED ||
    task.status === TaskStatus.ACCEPTED_CLOSED
  ) {
    return NextResponse.json(
      { error: `Cannot push deadline of a ${task.status} task` },
      { status: 409 }
    );
  }

  const oldDeadline = task.expectedDate;

  const [updatedTask] = await prisma.$transaction([
    prisma.task.update({
      where: { id },
      data: {
        expectedDate: newDeadline,
        updatedAt: new Date(),
      },
      include: taskIncludes,
    }),
    prisma.auditLog.create({
      data: {
        taskId: id,
        userId,
        action: "deadline_push",
        reason,
        metadata: {
          oldDeadline: oldDeadline.toISOString(),
          newDeadline: newDeadline.toISOString(),
        },
      },
    }),
  ]);

  const formattedNewDeadline = newDeadline.toISOString().split("T")[0];
  const message = `${task.code} deadline pushed to ${formattedNewDeadline} by Pro Rector. Reason: ${reason}`;

  // Notify coordinator
  await notify({
    userId: task.coordinatorId,
    taskId: id,
    type: "deadline_push",
    message,
    severity: NotifSeverity.HIGH,
  });

  // Notify team resource person
  if (task.team?.resourceId) {
    await notify({
      userId: task.team.resourceId,
      taskId: id,
      type: "deadline_push",
      message,
      severity: NotifSeverity.HIGH,
    });
  }

  // Always notify director for deadline pushes
  const director = await prisma.user.findFirst({
    where: { role: Role.DIRECTOR, isActive: true },
  });
  if (director) {
    await notify({
      userId: director.id,
      taskId: id,
      type: "deadline_push",
      message,
      severity: NotifSeverity.HIGH,
    });
  }

  return NextResponse.json(updatedTask);
}
