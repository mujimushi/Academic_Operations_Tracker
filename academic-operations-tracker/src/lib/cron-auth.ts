import { NextRequest } from "next/server";

export function verifyCronSecret(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  return auth.slice(7) === process.env.CRON_SECRET;
}
