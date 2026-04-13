import { prisma } from "./prisma";

export async function generateTaskCode(): Promise<string> {
  const lastTask = await prisma.task.findFirst({
    orderBy: { code: "desc" },
    select: { code: true },
  });

  if (!lastTask) return "AOT-001";

  const lastNumber = parseInt(lastTask.code.replace("AOT-", ""), 10);
  const nextNumber = lastNumber + 1;
  return `AOT-${String(nextNumber).padStart(3, "0")}`;
}
