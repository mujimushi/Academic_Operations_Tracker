import { promises as fs } from "fs";
import path from "path";
import { prisma } from "./prisma";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_TASK_STORAGE = 200 * 1024 * 1024; // 200MB

export async function getUploadPath(): Promise<string> {
  const config = await prisma.systemConfig.findUnique({
    where: { key: "upload_path" },
  });
  return config?.value ?? "./uploads";
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function getTaskStorageUsed(taskId: string): Promise<number> {
  const result = await prisma.document.aggregate({
    where: { taskId },
    _sum: { size: true },
  });
  return result._sum.size ?? 0;
}

export function validateFileSize(size: number): string | null {
  if (size > MAX_FILE_SIZE) {
    return `File size exceeds the 25MB limit`;
  }
  return null;
}

export async function validateTaskStorage(
  taskId: string,
  newFileSize: number
): Promise<string | null> {
  const used = await getTaskStorageUsed(taskId);
  if (used + newFileSize > MAX_TASK_STORAGE) {
    return `Task storage limit of 200MB would be exceeded`;
  }
  return null;
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}
