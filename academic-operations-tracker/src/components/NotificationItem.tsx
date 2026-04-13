"use client";

import type { NotificationWithTask } from "@/types";

function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return "just now";
}

const SEVERITY_STYLES: Record<string, { border: string; bg: string }> = {
  CRITICAL: { border: "border-l-4 border-l-red-500", bg: "bg-red-50" },
  HIGH:     { border: "border-l-4 border-l-orange-500", bg: "bg-orange-50" },
  NORMAL:   { border: "border-l-4 border-l-blue-500", bg: "bg-white" },
};

export default function NotificationItem({
  notification,
  onAcknowledge,
}: {
  notification: NotificationWithTask;
  onAcknowledge?: (id: string) => void;
}) {
  const severity = notification.severity ?? "NORMAL";
  const styles = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.NORMAL;

  const showAcknowledge =
    !notification.isSeen &&
    notification.escalationLevel != null &&
    !!onAcknowledge;

  return (
    <div
      className={`rounded-lg p-3 ${styles.border} ${styles.bg} flex flex-col gap-1`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-800 flex-1">{notification.message}</p>
        {showAcknowledge && (
          <button
            onClick={() => onAcknowledge!(notification.id)}
            className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
          >
            Acknowledge
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{getTimeAgo(notification.createdAt)}</span>
        {notification.task && (
          <span className="font-mono text-gray-500">{notification.task.code}</span>
        )}
      </div>
    </div>
  );
}
