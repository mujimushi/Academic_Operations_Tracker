"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import StatusBadge from "@/components/StatusBadge";
import PriorityDot from "@/components/PriorityDot";
import AcceptanceCriteria from "@/components/AcceptanceCriteria";
import DocumentChecklist from "@/components/DocumentChecklist";
import ChatThread from "@/components/ChatThread";
import AuditLog from "@/components/AuditLog";
import { VALID_TRANSITIONS, STATUS_ROLE_PERMISSIONS } from "@/constants/statuses";
import { STATUS_DISPLAY_NAMES } from "@/constants/colors";
import type { TaskWithRelations } from "@/types";
import type { TaskStatus, Role } from "@/generated/prisma/client";

// ─── Helpers ──────────────────────────────────────────────

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "---";
  return new Date(value).toLocaleDateString();
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  NEW_DEVELOPMENT: "New Development",
  ENHANCEMENT: "Enhancement",
  BUG_FIX: "Bug Fix",
  POLICY_CHANGE: "Policy Change",
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

// Statuses that require a reason field
const REASON_REQUIRED: TaskStatus[] = [
  "KILLED" as TaskStatus,
  "PAUSED" as TaskStatus,
  "REWORK" as TaskStatus,
  "REJECTED_BY_TEAM" as TaskStatus,
];

// Statuses where the ICT estimated date input is relevant
const SHOW_ICT_DATE_STATUSES: TaskStatus[] = [
  "ACCEPTED_BY_TEAM" as TaskStatus,
  "IN_ANALYSIS" as TaskStatus,
  "IN_DEVELOPMENT" as TaskStatus,
  "IN_TESTING" as TaskStatus,
  "DEPLOYED" as TaskStatus,
];

// ─── Action Panel ─────────────────────────────────────────

function ActionPanel({
  task,
  userRole,
  onSaveSuccess,
}: {
  task: TaskWithRelations;
  userRole: Role;
  onSaveSuccess: () => void;
}) {
  const currentStatus = task.status as TaskStatus;

  // Compute valid next statuses using VALID_TRANSITIONS filtered by role permissions
  const validNextStatuses: TaskStatus[] = (VALID_TRANSITIONS[currentStatus] ?? []).filter(
    (s) => {
      const perms = STATUS_ROLE_PERMISSIONS[currentStatus];
      const roles = perms?.[s] as Role[] | undefined;
      return roles?.includes(userRole);
    }
  );

  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(currentStatus);
  const [ictEstimatedDate, setIctEstimatedDate] = useState<string>(
    task.ictEstimatedDate
      ? new Date(task.ictEstimatedDate).toISOString().split("T")[0]
      : ""
  );
  const [pauseReason, setPauseReason] = useState("");
  const [pauseResumeDate, setPauseResumeDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Reset conditional fields when status selection changes
  function handleStatusChange(newStatus: TaskStatus) {
    setSelectedStatus(newStatus);
    setPauseReason("");
    setPauseResumeDate("");
    setReason("");
    setFeedback(null);
  }

  const isPaused = selectedStatus === ("PAUSED" as TaskStatus);
  const needsReason =
    selectedStatus !== currentStatus &&
    REASON_REQUIRED.includes(selectedStatus) &&
    selectedStatus !== ("PAUSED" as TaskStatus); // Pause uses its own fields
  const showIctDate =
    selectedStatus !== currentStatus &&
    SHOW_ICT_DATE_STATUSES.includes(selectedStatus);

  const isChanged = selectedStatus !== currentStatus;

  function isSubmitDisabled(): boolean {
    if (submitting) return true;
    if (!isChanged) return true;
    if (isPaused && (!pauseReason.trim() || !pauseResumeDate)) return true;
    if (needsReason && !reason.trim()) return true;
    return false;
  }

  async function handleSave() {
    if (isSubmitDisabled()) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const body: Record<string, string> = {
        status: selectedStatus,
      };

      if (ictEstimatedDate) {
        body.ictEstimatedDate = ictEstimatedDate;
      }

      if (isPaused) {
        body.pauseReason = pauseReason;
        body.pauseResumeDate = pauseResumeDate;
      } else if (needsReason && reason.trim()) {
        body.reason = reason;
      }

      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setFeedback({ type: "success", message: "Status updated successfully." });
        onSaveSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        setFeedback({
          type: "error",
          message: data?.error ?? "Failed to save update. Please try again.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (validNextStatuses.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Update Status</h3>
        <p className="text-sm text-gray-400">No status actions available for this task.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
      <h3 className="text-base font-semibold text-gray-800">Update Status</h3>

      {/* Status dropdown */}
      <div>
        <label htmlFor="status-select" className="block text-xs font-medium text-gray-500 mb-1">
          Move to status
        </label>
        <select
          id="status-select"
          value={selectedStatus}
          onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent bg-white"
        >
          <option value={currentStatus}>
            {STATUS_DISPLAY_NAMES[currentStatus] ?? currentStatus} (current)
          </option>
          {validNextStatuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_DISPLAY_NAMES[s] ?? s}
            </option>
          ))}
        </select>
      </div>

      {/* ICT Estimated Date — shown when accepting or on relevant statuses */}
      {(showIctDate || selectedStatus === currentStatus) && (
        <div>
          <label htmlFor="ict-date" className="block text-xs font-medium text-gray-500 mb-1">
            ICT estimated date
            {selectedStatus === ("ACCEPTED_BY_TEAM" as TaskStatus) && (
              <span className="text-gray-400 font-normal"> (set when accepting)</span>
            )}
          </label>
          <input
            id="ict-date"
            type="date"
            value={ictEstimatedDate}
            onChange={(e) => setIctEstimatedDate(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent"
          />
        </div>
      )}

      {/* Pause fields */}
      {isPaused && (
        <>
          <div>
            <label htmlFor="pause-reason" className="block text-xs font-medium text-gray-500 mb-1">
              Pause reason <span className="text-red-500">*</span>
            </label>
            <input
              id="pause-reason"
              type="text"
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              placeholder="Why is this task being paused?"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="resume-date" className="block text-xs font-medium text-gray-500 mb-1">
              Expected resume date <span className="text-red-500">*</span>
            </label>
            <input
              id="resume-date"
              type="date"
              value={pauseResumeDate}
              onChange={(e) => setPauseResumeDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
          </div>
        </>
      )}

      {/* Reason field — for reject/rework transitions */}
      {needsReason && (
        <div>
          <label htmlFor="reason" className="block text-xs font-medium text-gray-500 mb-1">
            Reason <span className="text-red-500">*</span>
          </label>
          <input
            id="reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              selectedStatus === ("REJECTED_BY_TEAM" as TaskStatus)
                ? "Why is the team rejecting this task?"
                : selectedStatus === ("KILLED" as TaskStatus)
                ? "Why is this task being killed?"
                : "Reason for this status change..."
            }
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent"
          />
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`text-sm px-3 py-2 rounded-lg ${
            feedback.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={isSubmitDisabled()}
        className="w-full px-4 py-2.5 rounded-lg bg-[#003366] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#002244] transition-colors"
      >
        {submitting ? "Saving..." : "Save Update"}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────

export default function TeamResourceTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status: sessionStatus } = useSession();

  const [task, setTask] = useState<TaskWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
        setError(null);
      } else if (res.status === 401) {
        setError("You must be signed in to view this task.");
      } else if (res.status === 403) {
        setError("You do not have permission to view this task.");
      } else if (res.status === 404) {
        setError("Task not found.");
      } else {
        setError("Failed to load task. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (sessionStatus === "unauthenticated") {
      setError("You must be signed in to view this task.");
      setLoading(false);
      return;
    }
    fetchTask();
  }, [sessionStatus, fetchTask]);

  // ── Loading state ──
  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading task...</p>
      </div>
    );
  }

  // ── Error state ──
  if (error || !task) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header bar */}
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: "#003366" }}
        >
          <span className="text-white text-sm font-semibold tracking-wide">
            NUST Academic Operations Tracker
          </span>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500 text-sm">{error ?? "Task not found."}</p>
        </div>
      </div>
    );
  }

  const userRole = session?.user?.role ?? ("TEAM_RESOURCE" as Role);

  // This deep-link page is intended for TEAM_RESOURCE — only show the action panel for them
  const isTeamResource = userRole === ("TEAM_RESOURCE" as Role);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header bar ───────────────────────────────────── */}
      <div
        className="px-4 py-3 flex items-center justify-between gap-3"
        style={{ backgroundColor: "#003366" }}
      >
        <span className="text-white text-sm font-semibold tracking-wide shrink-0">
          NUST Academic Operations Tracker
        </span>
        <span className="text-blue-200 text-xs font-mono truncate">
          {task.code}
        </span>
      </div>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-16 space-y-4">

        {/* 1. Task Header */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-mono mb-0.5">{task.code}</p>
              <h1 className="text-lg font-semibold text-gray-900 leading-snug">
                {task.title}
              </h1>
            </div>
            <div className="shrink-0 pt-0.5">
              <StatusBadge status={task.status} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              <PriorityDot priority={task.priority} />
              {PRIORITY_LABELS[task.priority] ?? task.priority}
            </span>
            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {REQUEST_TYPE_LABELS[task.type] ?? task.type}
            </span>
          </div>
        </div>

        {/* 2. Task Info */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Task Info</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Coordinator</p>
              <p className="text-gray-800">{task.coordinator.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Request Type</p>
              <p className="text-gray-800">
                {REQUEST_TYPE_LABELS[task.type] ?? task.type}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Expected Date</p>
              <p className="text-gray-800">{formatDate(task.expectedDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">ICT Estimated Date</p>
              <p className="text-gray-800">{formatDate(task.ictEstimatedDate)}</p>
            </div>
          </div>
        </div>

        {/* 3. Description */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Description</h2>
          <div
            className="text-sm text-gray-600 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: task.description }}
          />
        </div>

        {/* 4. Acceptance Criteria (read-only) */}
        <AcceptanceCriteria criteria={task.acceptanceCriteria} />

        {/* 5. Documents (view/download) */}
        <DocumentChecklist documents={task.documents} taskId={id} />

        {/* 6. Chat Thread (read/write for TEAM_RESOURCE) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Chat ({task._count.chatMessages})
            </h2>
          </div>
          <div className="p-0">
            <ChatThread
              taskId={id}
              currentUserRole={userRole}
              currentUserId={session?.user?.id ?? ""}
            />
          </div>
        </div>

        {/* 7. Audit Log */}
        <AuditLog taskId={id} />

        {/* 8. Action Panel — only for TEAM_RESOURCE */}
        {isTeamResource && (
          <ActionPanel
            task={task}
            userRole={userRole}
            onSaveSuccess={fetchTask}
          />
        )}
      </div>
    </div>
  );
}
