import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/client";

const messageIncludes = {
  author: { select: { id: true, name: true, role: true } },
  attachment: { select: { id: true, filename: true, size: true } },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: taskId } = await params;

  const messages = await prisma.chatMessage.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    include: messageIncludes,
  });

  return NextResponse.json(messages);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === Role.PRO_RECTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: taskId } = await params;
  const { id: authorId } = session.user;

  const body = await request.json();
  const { content, attachmentId } = body as {
    content: string;
    attachmentId?: string;
  };

  if (!content) {
    return NextResponse.json(
      { error: "Missing required field: content" },
      { status: 400 }
    );
  }

  const [message] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        taskId,
        authorId,
        content,
        attachmentId: attachmentId ?? null,
      },
      include: messageIncludes,
    }),
    prisma.task.update({
      where: { id: taskId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return NextResponse.json(message, { status: 201 });
}
