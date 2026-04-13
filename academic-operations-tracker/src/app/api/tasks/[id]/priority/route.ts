import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, TaskStatus, Priority, NotifSeverity } from "@/generated/prisma/client";
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

const VALID_PRIORITIES = [
  Priority.CRITICAL,
  Priority.HIGH,
  Priority.MEDIUM,
  Priority.LOW,
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, id: userId } = session.user;

  if (role !== Role.PRO_RECTOR && role !== Role.DIRECTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const body = await request.json();
  const { priority, reason } = body as { priority?: string; reason?: string };

  if (!priority || priority.trim() === "") {
    return NextResponse.json(
      { error: "priority is required" },
      { status: 400 }
    );
  }

  if (!reason || reason.trim() === "") {
    return NextResponse.json(
      { error: "reason is required" },
      { status: 400 }
    );
  }

  if (!VALID_PRIORITIES.includes(priority as Priority)) {
    return NextResponse.json(
      { error: `priority must be one of: ${VALID_PRIORITIES.join(", ")}` },
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
      { error: `Cannot change priority of a ${task.status} task` },
      { status: 409 }
    );
  }

  const oldPriority = task.priority;
  const newPriority = priority as Priority;

  const [updatedTask] = await prisma.$transaction([
    prisma.task.update({
      where: { id },
      data: { priority: newPriority },
      include: taskIncludes,
    }),
    prisma.auditLog.create({
      data: {
        taskId: id,
        userId,
        action: "priority_change",
        reason,
        metadata: { oldPriority, newPriority },
      },
    }),
  ]);

  const roleName = role === Role.PRO_RECTOR ? "Pro Rector" : "Director";
  const message = `${task.code} priority changed from ${oldPriority} to ${newPriority} by ${roleName}. Reason: ${reason}`;

  // Notify coordinator
  await notify({
    userId: task.coordinatorId,
    taskId: id,
    type: "priority_change",
    message,
    severity: NotifSeverity.HIGH,
  });

  // Notify team resource person
  if (task.team?.resourceId) {
    await notify({
      userId: task.team.resourceId,
      taskId: id,
      type: "priority_change",
      message,
      severity: NotifSeverity.HIGH,
    });
  }

  // Notify director if changed by Pro Rector
  if (role === Role.PRO_RECTOR) {
    const director = await prisma.user.findFirst({
      where: { role: Role.DIRECTOR, isActive: true },
    });
    if (director) {
      await notify({
        userId: director.id,
        taskId: id,
        type: "priority_change",
        message,
        severity: NotifSeverity.HIGH,
      });
    }
  }

  return NextResponse.json(updatedTask);
}
