import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, TaskStatus } from "@/generated/prisma/client";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { role, id: userId, teamId } = session.user;

  const task = await prisma.task.findUnique({
    where: { id },
    include: taskIncludes,
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Access control
  if (role === Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (role === Role.COORDINATOR && task.coordinatorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (role === Role.TEAM_RESOURCE) {
    if (!teamId || task.teamId !== teamId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (
      task.status === TaskStatus.DRAFT ||
      task.status === TaskStatus.PENDING_APPROVAL
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // DIRECTOR and PRO_RECTOR can see all tasks

  return NextResponse.json(task);
}
