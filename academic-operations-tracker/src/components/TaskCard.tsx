"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";
import PriorityDot from "./PriorityDot";
import { ChatIcon } from "./Icons";
import type { TaskWithRelations } from "@/types";

export default function TaskCard({
  task,
  href,
}: {
  task: TaskWithRelations;
  href: string;
}) {
  const isOverdue =
    task.status !== "ACCEPTED_CLOSED" &&
    task.status !== "KILLED" &&
    new Date(task.expectedDate) < new Date();

  const daysOverdue = isOverdue
    ? Math.ceil(
        (new Date().getTime() - new Date(task.expectedDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const isEscalated = task.rejectionCount >= 3;

  return (
    <Link href={href} className="block">
      <div
        className={`bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow ${
          isEscalated ? "border-red-500 border-2" : "border-gray-100"
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono">{task.code}</span>
            {isEscalated && (
              <span className="text-[10px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded">
                ESCALATED
              </span>
            )}
          </div>
          <StatusBadge status={task.status} />
        </div>

        <h3 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">
          <PriorityDot priority={task.priority} />
          {task.title}
        </h3>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{task.team.name}</span>
          <div className="flex items-center gap-3">
            {isOverdue && (
              <span className="text-red-600 font-medium">
                {daysOverdue}d overdue
              </span>
            )}
            <span className="flex items-center gap-1">
              <ChatIcon />
              {task._count.chatMessages}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
          <span>Expected: {new Date(task.expectedDate).toLocaleDateString()}</span>
          {task.ictEstimatedDate && (
            <span>
              Team: {new Date(task.ictEstimatedDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
