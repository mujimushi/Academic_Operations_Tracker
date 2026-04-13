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

  const users = await prisma.user.findMany({
    include: {
      teamResource: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
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
  const { email, name, role } = body;

  if (!email || !name || !role) {
    return NextResponse.json(
      { error: "Missing required fields: email, name, role" },
      { status: 400 }
    );
  }

  if (!Object.values(Role).includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: { email, name, role: role as Role },
    include: {
      teamResource: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(user, { status: 201 });
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
  const { id, name, role, isActive } = body;

  if (!id) {
    return NextResponse.json({ error: "User id is required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (role !== undefined) {
    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    data.role = role;
  }
  if (isActive !== undefined) data.isActive = isActive;

  const updated = await prisma.user.update({
    where: { id },
    data,
    include: {
      teamResource: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}
