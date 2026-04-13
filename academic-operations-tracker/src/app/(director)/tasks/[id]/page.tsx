"use client";

import { useSession } from "next-auth/react";
import TaskDetail from "@/components/TaskDetail";
import { use } from "react";

export default function DirectorTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();

  if (!session) return <div className="p-4">Loading...</div>;

  return <TaskDetail taskId={id} role="DIRECTOR" userId={session.user.id} />;
}
