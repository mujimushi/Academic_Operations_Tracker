import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocType } from "@/generated/prisma/client";
import {
  getUploadPath,
  ensureDir,
  validateFileSize,
  validateTaskStorage,
  getFileExtension,
} from "@/lib/upload";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: taskId } = await params;

  const documents = await prisma.document.findMany({
    where: { taskId },
    include: { uploadedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: taskId } = await params;
  const { id: uploadedById } = session.user;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const typeRaw = formData.get("type") as string | null;

  if (!file || !typeRaw) {
    return NextResponse.json(
      { error: "Missing required fields: file and type" },
      { status: 400 }
    );
  }

  const validTypes = Object.values(DocType) as string[];
  if (!validTypes.includes(typeRaw)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }
  const type = typeRaw as DocType;

  const fileSizeError = validateFileSize(file.size);
  if (fileSizeError) {
    return NextResponse.json({ error: fileSizeError }, { status: 400 });
  }

  const storageError = await validateTaskStorage(taskId, file.size);
  if (storageError) {
    return NextResponse.json({ error: storageError }, { status: 400 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { code: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const uploadPath = await getUploadPath();
  const subDir = type === DocType.CHAT_ATTACHMENT ? "chat" : "documents";
  const ext = getFileExtension(file.name);
  const timestamp = Date.now();
  const filename = `${type}_${timestamp}${ext}`;
  const taskDir = path.join(uploadPath, "tasks", task.code, subDir);

  await ensureDir(taskDir);

  const filePath = path.join(taskDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const [document] = await prisma.$transaction([
    prisma.document.create({
      data: {
        taskId,
        type,
        filename: file.name,
        path: filePath,
        size: file.size,
        uploadedById,
      },
      include: { uploadedBy: { select: { id: true, name: true } } },
    }),
    prisma.task.update({
      where: { id: taskId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return NextResponse.json(document, { status: 201 });
}
