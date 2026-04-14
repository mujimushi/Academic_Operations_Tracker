"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import PriorityDot from "@/components/PriorityDot";
import type { TaskWithRelations } from "@/types";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  NEW_DEVELOPMENT: "New Development",
  ENHANCEMENT: "Enhancement",
  BUG_FIX: "Bug Fix",
  POLICY_CHANGE: "Policy Change",
};

function daysAgo(dateStr: string | Date): number {
  return Math.floor(
    (new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function QueueCard({
  task,
  onAction,
}: {
  task: TaskWithRelations;
  onAction: () => void;
}) {
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isCoordinatorAccepted = task.status === "COORDINATOR_ACCEPTED";
  const approveStatus = isCoordinatorAccepted
    ? "ACCEPTED_CLOSED"
    : "APPROVED_AWAITING_TEAM";
  const rejectStatus = isCoordinatorAccepted ? "REWORK" : "DRAFT";

  async function handleApprove() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: approveStatus }),
      });
      if (res.ok) onAction();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: rejectStatus, reason: rejectReason }),
      });
      if (res.ok) {
        setShowReject(false);
        setRejectReason("");
        onAction();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const submitted = daysAgo(task.createdAt);

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      {/* Top row: code + priority dot + coordinator */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400">{task.code}</span>
          <PriorityDot priority={task.priority} />
        </div>
        <span className="text-xs text-gray-500">{task.coordinator.name}</span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
        {task.title}
      </h3>

      {/* Tags row */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {REQUEST_TYPE_LABELS[task.type] ?? task.type}
        </span>
        <span className="text-xs text-gray-400">
          Submitted {submitted === 0 ? "today" : `${submitted} day${submitted !== 1 ? "s" : ""} ago`}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={submitting}
          className="flex-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => {
            setShowReject(!showReject);
            setRejectReason("");
          }}
          disabled={submitting}
          className="flex-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-40 transition-colors"
        >
          Reject
        </button>
      </div>

      {/* Reject reason (expandable) */}
      {showReject && (
        <div className="mt-3 space-y-2">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (required)..."
            className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-red-400"
            rows={2}
          />
          <button
            type="button"
            onClick={handleReject}
            disabled={!rejectReason.trim() || submitting}
            className="px-4 py-1.5 text-sm rounded-lg bg-red-600 text-white disabled:opacity-40 hover:bg-red-700"
          >
            {submitting ? "Submitting..." : "Confirm Reject"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function DirectorQueue() {
  const { status: sessionStatus } = useSession();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/tasks?status=PENDING_APPROVAL&status=COORDINATOR_ACCEPTED"
      );
      if (res.ok) {
        setTasks(await res.json());
      } else {
        setError("Failed to load approval queue.");
      }
    } catch {
      setError("Network error loading approval queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    fetchQueue();
  }, [sessionStatus, fetchQueue]);

  if (sessionStatus === "loading") {
    return <div className="p-4 text-sm text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-heading text-nust-blue">Approval Queue</h1>
        {!loading && (
          <span className="text-sm text-gray-500">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} awaiting action
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 text-center py-10">
          Loading queue...
        </div>
      ) : error ? (
        <div className="text-sm text-red-500 text-center py-10">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-10">
          No tasks awaiting approval
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <QueueCard key={task.id} task={task} onAction={fetchQueue} />
          ))}
        </div>
      )}
    </div>
  );
}
