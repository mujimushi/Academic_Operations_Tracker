import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTaskCode } from "@/lib/task-code";
import {
  Role,
  TaskStatus,
  Priority,
  RequestType,
  EffortUnit,
} from "@/generated/prisma/client";

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

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, id: userId, teamId } = session.user;

  if (role === Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;

  // Build filter conditions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  // Status filter (multi-value)
  const statusParams = searchParams.getAll("status");
  if (statusParams.length > 0) {
    where.status = { in: statusParams as TaskStatus[] };
  }

  // Priority filter (multi-value)
  const priorityParams = searchParams.getAll("priority");
  if (priorityParams.length > 0) {
    where.priority = { in: priorityParams as Priority[] };
  }

  // Type filter
  const typeParam = searchParams.get("type");
  if (typeParam) {
    where.type = typeParam as RequestType;
  }

  // Team filter
  const teamIdParam = searchParams.get("teamId");
  if (teamIdParam) {
    where.teamId = teamIdParam;
  }

  // Coordinator filter
  const coordinatorIdParam = searchParams.get("coordinatorId");
  if (coordinatorIdParam) {
    where.coordinatorId = coordinatorIdParam;
  }

  // Role-based filtering
  if (role === Role.COORDINATOR) {
    where.coordinatorId = userId;
  } else if (role === Role.TEAM_RESOURCE) {
    if (!teamId) {
      return NextResponse.json({ error: "No team assigned" }, { status: 403 });
    }
    where.teamId = teamId;
    where.status = where.status
      ? { in: (where.status.in as TaskStatus[]).filter(
          (s: TaskStatus) => s !== TaskStatus.DRAFT && s !== TaskStatus.PENDING_APPROVAL
        ) }
      : { notIn: [TaskStatus.DRAFT, TaskStatus.PENDING_APPROVAL] };
  }
  // DIRECTOR and PRO_RECTOR see all tasks (no additional where clause)

  const tasks = await prisma.task.findMany({
    where,
    include: taskIncludes,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== Role.COORDINATOR) {
    return NextResponse.json(
      { error: "Only coordinators can create tasks" },
      { status: 403 }
    );
  }

  const body = await request.json();

  const {
    title,
    type,
    priority,
    description,
    affectedProcess,
    expectedOutcome,
    expectedDate,
    tolerance,
    policyRef,
    preEffort,
    preUnit,
    postEffort,
    postUnit,
    teamId: bodyTeamId,
    acceptanceCriteria,
  } = body;

  // Validate required fields
  if (!title || !type || !priority || !description || !affectedProcess || !expectedOutcome || !expectedDate || !bodyTeamId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const code = await generateTaskCode();

  const task = await prisma.task.create({
    data: {
      code,
      title,
      type: type as RequestType,
      priority: priority as Priority,
      description,
      affectedProcess,
      expectedOutcome,
      expectedDate: new Date(expectedDate),
      tolerance: tolerance ?? 7,
      policyRef: policyRef ?? null,
      preEffort: preEffort ?? null,
      preUnit: preUnit ? (preUnit as EffortUnit) : null,
      postEffort: postEffort ?? null,
      postUnit: postUnit ? (postUnit as EffortUnit) : null,
      coordinatorId: session.user.id,
      teamId: bodyTeamId,
      acceptanceCriteria: acceptanceCriteria?.length
        ? {
            create: (acceptanceCriteria as { description: string }[]).map(
              (ac, index) => ({
                description: ac.description,
                sortOrder: index + 1,
              })
            ),
          }
        : undefined,
    },
    include: taskIncludes,
  });

  // Create audit log entry for task creation
  await prisma.auditLog.create({
    data: {
      taskId: task.id,
      userId: session.user.id,
      action: "status_change",
      toStatus: TaskStatus.DRAFT,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
