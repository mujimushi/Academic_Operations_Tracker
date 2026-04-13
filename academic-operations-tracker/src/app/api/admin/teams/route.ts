import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teams = await prisma.team.findMany({
    include: {
      resource: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(teams);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, resourceId } = body;

  if (!name || !resourceId) {
    return NextResponse.json(
      { error: "Missing required fields: name, resourceId" },
      { status: 400 }
    );
  }

  // Validate team name is unique
  const existingTeam = await prisma.team.findUnique({ where: { name } });
  if (existingTeam) {
    return NextResponse.json(
      { error: "A team with this name already exists" },
      { status: 409 }
    );
  }

  // Validate resource person exists and has TEAM_RESOURCE role
  const resourceUser = await prisma.user.findUnique({
    where: { id: resourceId },
  });
  if (!resourceUser) {
    return NextResponse.json(
      { error: "Resource person not found" },
      { status: 404 }
    );
  }
  if (resourceUser.role !== Role.TEAM_RESOURCE) {
    return NextResponse.json(
      { error: "Resource person must have TEAM_RESOURCE role" },
      { status: 400 }
    );
  }

  const team = await prisma.team.create({
    data: { name, resourceId },
    include: {
      resource: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json(team, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, name, resourceId, isActive } = body;

  if (!id) {
    return NextResponse.json({ error: "Team id is required" }, { status: 400 });
  }

  const existing = await prisma.team.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};

  if (name !== undefined) {
    // Check name uniqueness if changing
    if (name !== existing.name) {
      const nameConflict = await prisma.team.findUnique({ where: { name } });
      if (nameConflict) {
        return NextResponse.json(
          { error: "A team with this name already exists" },
          { status: 409 }
        );
      }
    }
    data.name = name;
  }

  if (resourceId !== undefined) {
    const resourceUser = await prisma.user.findUnique({
      where: { id: resourceId },
    });
    if (!resourceUser) {
      return NextResponse.json(
        { error: "Resource person not found" },
        { status: 404 }
      );
    }
    if (resourceUser.role !== Role.TEAM_RESOURCE) {
      return NextResponse.json(
        { error: "Resource person must have TEAM_RESOURCE role" },
        { status: 400 }
      );
    }
    data.resourceId = resourceId;
  }

  if (isActive !== undefined) data.isActive = isActive;

  const updated = await prisma.team.update({
    where: { id },
    data,
    include: {
      resource: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json(updated);
}
