"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import PriorityDot from "@/components/PriorityDot";
import { BackIcon, ChatIcon } from "@/components/Icons";
import AcceptanceCriteria from "@/components/AcceptanceCriteria";
import DocumentChecklist from "@/components/DocumentChecklist";
import ChatThread from "@/components/ChatThread";
import AuditLog from "@/components/AuditLog";
import { STATUS_DISPLAY_NAMES } from "@/constants/colors";
import { STATUS_ROLE_PERMISSIONS } from "@/constants/statuses";
import type { TaskWithRelations } from "@/types";
import type { TaskStatus, Role } from "@/generated/prisma/client";

// ─── Request Type Display Labels ──────────────────────────
const REQUEST_TYPE_LABELS: Record<string, string> = {
  NEW_DEVELOPMENT: "New Development",
  ENHANCEMENT: "Enhancement",
  BUG_FIX: "Bug Fix",
  POLICY_CHANGE: "Policy Change",
};

// ─── Helpers ──────────────────────────────────────────────
function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "---";
  return new Date(dateStr).toLocaleDateString();
}

function formatEffort(
  value: unknown,
  unit: string | null | undefined
): string {
  if (value === null || value === undefined) return "---";
  return `${value} ${unit?.toLowerCase() || ""}`.trim();
}

// ─── Role-specific Action Panels ──────────────────────────

function ProRectorActions({
  taskId,
  onStatusChange,
}: {
  taskId: string;
  onStatusChange: () => void;
}) {
  const [expanded, setExpanded] = useState<
    "kill" | "priority" | "deadline" | null
  >(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleKill() {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "KILLED", reason }),
      });
      if (res.ok) {
        setExpanded(null);
        setReason("");
        onStatusChange();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm mb-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Actions</h3>

      {/* Kill Task */}
      <button
        type="button"
        onClick={() => {
          setExpanded(expanded === "kill" ? null : "kill");
          setReason("");
        }}
        className="w-full text-left px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
      >
        Kill Task
      </button>
      {expanded === "kill" && (
        <div className="pl-2 border-l-2 border-red-200 ml-2 space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for killing this task (required)..."
            className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-red-400"
            rows={2}
          />
          <button
            type="button"
            onClick={handleKill}
            disabled={!reason.trim() || submitting}
            className="px-4 py-1.5 text-sm rounded-lg bg-red-600 text-white disabled:opacity-40 hover:bg-red-700"
          >
            {submitting ? "Submitting..." : "Confirm Kill"}
          </button>
        </div>
      )}

      {/* Change Priority */}
      <button
        type="button"
        onClick={() => {
          setExpanded(expanded === "priority" ? null : "priority");
          setReason("");
        }}
        className="w-full text-left px-3 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors"
      >
        Change Priority
      </button>
      {expanded === "priority" && (
        <div className="pl-2 border-l-2 border-gray-200 ml-2 space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for priority change (required)..."
            className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-nust-blue"
            rows={2}
          />
          <p className="text-xs text-gray-400">
            Priority change will be wired in a future update.
          </p>
        </div>
      )}

      {/* Push Deadline */}
      <button
        type="button"
        onClick={() => {
          setExpanded(expanded === "deadline" ? null : "deadline");
          setReason("");
        }}
        className="w-full text-left px-3 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors"
      >
        Push Deadline
      </button>
      {expanded === "deadline" && (
        <div className="pl-2 border-l-2 border-gray-200 ml-2 space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for deadline push (required)..."
            className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-nust-blue"
            rows={2}
          />
          <p className="text-xs text-gray-400">
            Deadline push will be wired in a future update.
          </p>
        </div>
      )}
    </div>
  );
}

function CoordinatorActions({
  taskId,
  taskStatus,
  onStatusChange,
}: {
  taskId: string;
  taskStatus: string;
  onStatusChange: () => void;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (taskStatus !== "DEPLOYED") return null;

  async function handleAccept() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COORDINATOR_ACCEPTED" }),
      });
      if (res.ok) onStatusChange();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REWORK", reason: rejectReason }),
      });
      if (res.ok) {
        setShowReject(false);
        setRejectReason("");
        onStatusChange();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions</h3>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAccept}
          disabled={submitting}
          className="flex-1 px-4 py-2 rounded-lg bg-nust-blue text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => setShowReject(!showReject)}
          className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Reject
        </button>
      </div>
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

function DirectorActions({
  taskId,
  taskStatus,
  onStatusChange,
}: {
  taskId: string;
  taskStatus: string;
  onStatusChange: () => void;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [priorityReason, setPriorityReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canApproveReject =
    taskStatus === "PENDING_APPROVAL" || taskStatus === "COORDINATOR_ACCEPTED";

  async function handleApprove() {
    setSubmitting(true);
    const nextStatus =
      taskStatus === "PENDING_APPROVAL"
        ? "APPROVED_AWAITING_TEAM"
        : "ACCEPTED_CLOSED";
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) onStatusChange();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setSubmitting(true);
    const nextStatus =
      taskStatus === "PENDING_APPROVAL" ? "DRAFT" : "REWORK";
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, reason: rejectReason }),
      });
      if (res.ok) {
        setShowReject(false);
        setRejectReason("");
        onStatusChange();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm mb-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Actions</h3>

      {canApproveReject && (
        <>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApprove}
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-nust-blue text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => setShowReject(!showReject)}
              className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
          </div>
          {showReject && (
            <div className="mt-2 space-y-2">
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
        </>
      )}

      {/* Change Priority — always available for Director */}
      <button
        type="button"
        onClick={() => {
          setShowPriority(!showPriority);
          setPriorityReason("");
        }}
        className="w-full text-left px-3 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors"
      >
        Change Priority
      </button>
      {showPriority && (
        <div className="pl-2 border-l-2 border-gray-200 ml-2 space-y-2">
          <textarea
            value={priorityReason}
            onChange={(e) => setPriorityReason(e.target.value)}
            placeholder="Reason for priority change (required)..."
            className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-nust-blue"
            rows={2}
          />
          <p className="text-xs text-gray-400">
            Priority change will be wired in a future update.
          </p>
        </div>
      )}
    </div>
  );
}

function TeamResourceActions({
  taskId,
  taskStatus,
  ictEstimatedDate,
  role,
  onStatusChange,
}: {
  taskId: string;
  taskStatus: TaskStatus;
  ictEstimatedDate: string;
  role: Role;
  onStatusChange: () => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState(taskStatus);
  const [estimatedDate, setEstimatedDate] = useState(ictEstimatedDate);
  const [pauseReason, setPauseReason] = useState("");
  const [pauseResumeDate, setPauseResumeDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Compute valid next statuses for this user based on role permissions
  const rolePerms = STATUS_ROLE_PERMISSIONS[taskStatus] || {};
  const validStatuses = Object.entries(rolePerms)
    .filter(([, roles]) => roles?.includes(role))
    .map(([status]) => status as TaskStatus);

  async function handleSave() {
    setSubmitting(true);
    try {
      const body: Record<string, string> = { status: selectedStatus };
      if (estimatedDate) body.ictEstimatedDate = estimatedDate;
      if (selectedStatus === "PAUSED" && pauseReason) {
        body.pauseReason = pauseReason;
        if (pauseResumeDate) body.pauseResumeDate = pauseResumeDate;
      }
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) onStatusChange();
    } finally {
      setSubmitting(false);
    }
  }

  if (validStatuses.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Actions</h3>
        <p className="text-sm text-gray-400">
          No actions available for this status.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm mb-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Actions</h3>

      <div>
        <label className="text-xs text-gray-500 block mb-1">
          Move to status
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as TaskStatus)}
          className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-nust-ceramic"
        >
          <option value={taskStatus}>
            {STATUS_DISPLAY_NAMES[taskStatus] || taskStatus} (current)
          </option>
          {validStatuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_DISPLAY_NAMES[s] || s}
            </option>
          ))}
        </select>
      </div>

      {selectedStatus === "PAUSED" && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Pause reason
            </label>
            <textarea
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              placeholder="Why is this task paused?"
              className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-nust-ceramic"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Expected resume date
            </label>
            <input
              type="date"
              value={pauseResumeDate}
              onChange={(e) => setPauseResumeDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-nust-ceramic"
            />
          </div>
        </>
      )}

      <div>
        <label className="text-xs text-gray-500 block mb-1">
          ICT estimated date
        </label>
        <input
          type="date"
          value={estimatedDate}
          onChange={(e) => setEstimatedDate(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-nust-ceramic"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={submitting}
        className="w-full px-4 py-2 rounded-lg bg-nust-blue text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        {submitting ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

// ─── Main TaskDetail Component ────────────────────────────

export default function TaskDetail({
  taskId,
  role,
  userId,
}: {
  taskId: string;
  role: string;
  userId: string;
}) {
  const router = useRouter();
  const [task, setTask] = useState<TaskWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchTask() {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        setTask(await res.json());
        setError(null);
      } else {
        setError("Failed to load task.");
      }
    } catch {
      setError("Network error loading task.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  function handleStatusChange() {
    fetchTask(); // Re-fetch task after any status change
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading task...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-red-500">{error || "Task not found."}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-nust-blue underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const ictDateStr = task.ictEstimatedDate
    ? new Date(task.ictEstimatedDate).toISOString().split("T")[0]
    : "";

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* 1. Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <BackIcon className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-mono">{task.code}</p>
          <h1 className="text-lg font-semibold text-gray-900 leading-tight truncate">
            {task.title}
          </h1>
        </div>
        <StatusBadge status={task.status} />
      </div>

      {/* 2. Priority + Type tags */}
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          <PriorityDot priority={task.priority} />
          {task.priority}
        </span>
        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {REQUEST_TYPE_LABELS[task.type] || task.type}
        </span>
      </div>

      {/* 3. Info grid */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-gray-400">Coordinator</p>
            <p className="text-gray-700">{task.coordinator.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Team</p>
            <p className="text-gray-700">{task.team.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Expected Date</p>
            <p className="text-gray-700">{formatDate(task.expectedDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">ICT Estimated Date</p>
            <p className="text-gray-700">
              {formatDate(task.ictEstimatedDate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Rejections</p>
            <p
              className={`font-medium ${
                task.rejectionCount >= 3 ? "text-red-600" : "text-gray-700"
              }`}
            >
              {task.rejectionCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Last Activity</p>
            <p className="text-gray-700">{formatDate(task.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* 4. Description */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Description
        </h3>
        <div
          className="text-sm text-gray-600 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: task.description }}
        />
      </div>

      {/* 5. Impact card */}
      {(task.preEffort || task.postEffort) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">
            Automation Impact
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-green-600">Pre-Automation Effort</p>
              <p className="text-green-800 font-medium">
                {formatEffort(task.preEffort, task.preUnit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-green-600">Post-Automation Effort</p>
              <p className="text-green-800 font-medium">
                {formatEffort(task.postEffort, task.postUnit)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. Acceptance Criteria */}
      <AcceptanceCriteria criteria={task.acceptanceCriteria} />

      {/* 7. Document Checklist */}
      <DocumentChecklist documents={task.documents} taskId={taskId} />

      {/* 8. Chat toggle */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowChat(!showChat)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white shadow-sm border border-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ChatIcon />
          {showChat ? "Hide Chat" : `Chat (${task._count.chatMessages})`}
        </button>
        {showChat && (
          <div className="mt-2">
            <ChatThread
              taskId={taskId}
              currentUserRole={role}
              currentUserId={userId}
            />
          </div>
        )}
      </div>

      {/* 9. Audit Log */}
      <AuditLog taskId={taskId} />

      {/* 10. Role-specific actions */}
      {role === "PRO_RECTOR" && (
        <ProRectorActions taskId={taskId} onStatusChange={handleStatusChange} />
      )}
      {role === "COORDINATOR" && (
        <CoordinatorActions
          taskId={taskId}
          taskStatus={task.status}
          onStatusChange={handleStatusChange}
        />
      )}
      {role === "DIRECTOR" && (
        <DirectorActions
          taskId={taskId}
          taskStatus={task.status}
          onStatusChange={handleStatusChange}
        />
      )}
      {role === "TEAM_RESOURCE" && (
        <TeamResourceActions
          taskId={taskId}
          taskStatus={task.status as TaskStatus}
          ictEstimatedDate={ictDateStr}
          role={role as Role}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
