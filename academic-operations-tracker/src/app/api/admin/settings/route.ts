import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/client";

const SENSITIVE_KEYS = ["smtp_password", "fcm_private_key"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const configs = await prisma.systemConfig.findMany({
    select: { key: true, value: true, updatedAt: true },
  });

  // Mask sensitive values
  const masked = configs.map((c) => ({
    key: c.key,
    value: SENSITIVE_KEYS.includes(c.key) ? "****" : c.value,
    updatedAt: c.updatedAt,
  }));

  return NextResponse.json(masked);
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
  const { configs } = body;

  if (!Array.isArray(configs) || configs.length === 0) {
    return NextResponse.json(
      { error: "configs must be a non-empty array of { key, value }" },
      { status: 400 }
    );
  }

  const updated = [];

  for (const { key, value } of configs) {
    if (!key || value === undefined) continue;

    // Skip masked values -- don't overwrite with the mask placeholder
    if (SENSITIVE_KEYS.includes(key) && value === "****") continue;

    const existing = await prisma.systemConfig.findUnique({
      where: { key },
    });

    if (existing) {
      const config = await prisma.systemConfig.update({
        where: { key },
        data: { value, updatedById: session.user.id },
        select: { key: true, value: true, updatedAt: true },
      });
      updated.push({
        key: config.key,
        value: SENSITIVE_KEYS.includes(config.key) ? "****" : config.value,
        updatedAt: config.updatedAt,
      });
    } else {
      const config = await prisma.systemConfig.create({
        data: { key, value, updatedById: session.user.id },
        select: { key: true, value: true, updatedAt: true },
      });
      updated.push({
        key: config.key,
        value: SENSITIVE_KEYS.includes(config.key) ? "****" : config.value,
        updatedAt: config.updatedAt,
      });
    }
  }

  return NextResponse.json(updated);
}
