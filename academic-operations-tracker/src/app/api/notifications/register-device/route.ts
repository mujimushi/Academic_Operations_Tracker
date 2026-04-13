import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token, device } = await req.json();
  if (!token || !device) {
    return NextResponse.json({ error: "Token and device are required" }, { status: 400 });
  }

  // Upsert: same token for same user = update device info
  const existing = await prisma.deviceToken.findFirst({
    where: { userId: session.user.id, token },
  });

  let deviceToken;
  if (existing) {
    deviceToken = await prisma.deviceToken.update({
      where: { id: existing.id },
      data: { device, updatedAt: new Date() },
    });
  } else {
    deviceToken = await prisma.deviceToken.create({
      data: {
        userId: session.user.id,
        token,
        device,
      },
    });
  }

  return NextResponse.json(deviceToken);
}
