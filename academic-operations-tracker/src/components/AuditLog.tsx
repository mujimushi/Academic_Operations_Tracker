"use client";

import { useState, useEffect } from "react";
import StatusBadge from "@/components/StatusBadge";
import { STATUS_DISPLAY_NAMES } from "@/constants/colors";
import type { AuditLogWithUser } from "@/types";
import type { TaskStatus } from "@/generated/prisma/client";

const ACTION_LABELS: Record<string, string> = {
  status_change: "Status changed",
  priority_change: "Priority changed",
  deadline_push: "Deadline pushed",
  kill: "Task killed",
  acknowledge_notification: "Notification acknowledged",
};

export default function AuditLog({ taskId }: { taskId: string }) {
  const [entries, setEntries] = useState<AuditLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAudit() {
      try {
        const res = await fetch(`/api/tasks/${taskId}/audit`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data);
        }
      } catch {
        // silently handle fetch errors
      } finally {
        setLoading(false);
      }
    }
    fetchAudit();
  }, [taskId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Audit Log</h3>
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Audit Log</h3>
        <p className="text-sm text-gray-400">No activity recorded.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Audit Log</h3>
      <div className="relative pl-5">
        {/* Vertical timeline line */}
        <div className="absolute left-[3px] top-1 bottom-1 border-l-2 border-gray-200" />

        <ul className="space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-5 top-1.5 w-2 h-2 bg-gray-400 rounded-full" />

              <div>
                {/* Action description */}
                {entry.action === "status_change" &&
                entry.fromStatus &&
                entry.toStatus ? (
                  <p className="text-sm text-gray-700 flex items-center flex-wrap gap-1">
                    Status changed from{" "}
                    <StatusBadge status={entry.fromStatus as TaskStatus} />
                    {" to "}
                    <StatusBadge status={entry.toStatus as TaskStatus} />
                  </p>
                ) : (
                  <p className="text-sm text-gray-700">
                    {ACTION_LABELS[entry.action] || entry.action}
                    {entry.fromStatus && entry.toStatus
                      ? ` from ${STATUS_DISPLAY_NAMES[entry.fromStatus] || entry.fromStatus} to ${STATUS_DISPLAY_NAMES[entry.toStatus] || entry.toStatus}`
                      : ""}
                  </p>
                )}

                {/* Reason if present */}
                {entry.reason && (
                  <p className="text-xs text-gray-500 mt-0.5 italic">
                    &ldquo;{entry.reason}&rdquo;
                  </p>
                )}

                {/* User and timestamp */}
                <p className="text-xs text-gray-500 mt-1">
                  {entry.user.name}{" "}
                  <span className="text-gray-400">
                    &middot; {entry.user.role.replace(/_/g, " ")}
                  </span>{" "}
                  <span className="text-gray-400">
                    &middot;{" "}
                    {new Date(entry.createdAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
