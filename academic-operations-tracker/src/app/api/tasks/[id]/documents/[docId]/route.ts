import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFileExtension } from "@/lib/upload";

function getMimeType(ext: string): string {
  const types: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return types[ext] || "application/octet-stream";
}

const INLINE_TYPES = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: taskId, docId } = await params;

  const document = await prisma.document.findUnique({
    where: { id: docId },
  });

  if (!document || document.taskId !== taskId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const fileBuffer = await readFile(document.path);

  const ext = getFileExtension(document.filename);
  const mimeType = getMimeType(ext);
  const isInline = INLINE_TYPES.has(ext);

  const headers: Record<string, string> = {
    "Content-Type": mimeType,
    "Content-Length": String(fileBuffer.length),
  };

  if (isInline) {
    headers["Content-Disposition"] = "inline";
  } else {
    headers["Content-Disposition"] = `attachment; filename="${document.filename}"`;
  }

  return new Response(fileBuffer, { headers });
}
