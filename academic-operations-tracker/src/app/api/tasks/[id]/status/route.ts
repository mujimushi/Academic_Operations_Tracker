import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, TaskStatus } from "@/generated/prisma/client";
import { validateTransition } from "@/lib/transitions";

const REASON_REQUIRED_STATUSES: TaskStatus[] = [
  TaskStatus.KILLED,
  TaskStatus.PAUSED,
  TaskStatus.REWORK,
  TaskStatus.REJECTED_BY_TEAM,
];

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

  const { id } = await params;
  const { role, id: userId, teamId } = session.user;

  // Parse request body
  const body = await request.json();
  const {
    status: newStatus,
    reason,
    ictEstimatedDate,
    pauseReason,
    pauseResumeDate,
  } = body as {
    status: TaskStatus;
    reason?: string;
    ictEstimatedDate?: string;
    pauseReason?: string;
    pauseResumeDate?: string;
  };

  if (!newStatus) {
    return NextResponse.json(
      { error: "Missing required field: status" },
      { status: 400 }
    );
  }

  // Fetch the task with team relation for access control
  const task = await prisma.task.findUnique({
    where: { id },
    include: { team: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Access control: TEAM_RESOURCE can only update tasks assigned to their team
  if (role === Role.TEAM_RESOURCE) {
    if (!teamId || task.teamId !== teamId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Access control: COORDINATOR can only update their own tasks
  if (role === Role.COORDINATOR && task.coordinatorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Access control: ADMIN cannot perform status transitions
  if (role === Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check workflow history (has any status change audit entries)
  const auditCount = await prisma.auditLog.count({
    where: {
      taskId: id,
      fromStatus: { not: null },
    },
  });
  const hasWorkflowHistory = auditCount > 0;

  // Validate the transition
  const result = validateTransition(
    task.status,
    newStatus as TaskStatus,
    role,
    {
      isTaskOwner: task.coordinatorId === userId,
      hasWorkflowHistory,
      pausedFromStatus: task.pausedFromStatus,
    }
  );

  if (!result.valid) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  // Require reason for certain statuses
  if (REASON_REQUIRED_STATUSES.includes(newStatus as TaskStatus) && !reason) {
    return NextResponse.json(
      {
        error: `Reason is required when transitioning to ${newStatus}`,
      },
      { status: 400 }
    );
  }

  // Pause handling: require pauseReason and pauseResumeDate when pausing
  if (newStatus === TaskStatus.PAUSED) {
    if (!pauseReason || !pauseResumeDate) {
      return NextResponse.json(
        {
          error:
            "pauseReason and pauseResumeDate are required when pausing a task",
        },
        { status: 400 }
      );
    }
  }

  // Build update data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    status: newStatus as TaskStatus,
  };

  // Pause handling: set pausedFromStatus when pausing
  if (newStatus === TaskStatus.PAUSED) {
    updateData.pausedFromStatus = task.status;
    updateData.pauseReason = pauseReason!;
    updateData.pauseResumeDate = new Date(pauseResumeDate!);
  }

  // Unpause handling: clear pause fields when coming from PAUSED
  if (task.status === TaskStatus.PAUSED && newStatus !== TaskStatus.KILLED) {
    updateData.pauseReason = null;
    updateData.pauseResumeDate = null;
    updateData.pausedFromStatus = null;
  }

  // ICT estimated date: save when accepting by team
  if (
    newStatus === TaskStatus.ACCEPTED_BY_TEAM &&
    ictEstimatedDate
  ) {
    updateData.ictEstimatedDate = new Date(ictEstimatedDate);
  }

  // Rejection counter: increment when going to REWORK
  if (newStatus === TaskStatus.REWORK) {
    updateData.rejectionCount = { increment: 1 };
  }

  // Update task and create audit log in a transaction
  const [updatedTask] = await prisma.$transaction([
    prisma.task.update({
      where: { id },
      data: updateData,
      include: taskIncludes,
    }),
    prisma.auditLog.create({
      data: {
        taskId: id,
        userId,
        action: "status_change",
        fromStatus: task.status,
        toStatus: newStatus as TaskStatus,
        reason: reason ?? null,
      },
    }),
  ]);

  return NextResponse.json(updatedTask);
}
