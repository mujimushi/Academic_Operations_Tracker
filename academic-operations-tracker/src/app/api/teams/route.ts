import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teams = await prisma.team.findMany({
    where: { isActive: true },
    include: {
      resource: {
        select: { id: true, name: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(teams);
}
