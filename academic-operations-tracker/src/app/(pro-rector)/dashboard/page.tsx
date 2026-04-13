"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import TaskCard from "@/components/TaskCard";
import { STATUS_COLORS, STATUS_DISPLAY_NAMES } from "@/constants/colors";
import type { TaskWithRelations } from "@/types";

const TERMINAL_STATUSES = ["ACCEPTED_CLOSED", "KILLED"];

function toDays(effort: unknown, unit: string | null | undefined): number {
  const value = Number(effort);
  if (isNaN(value)) return 0;
  if (unit === "HOURS") return value / 8;
  return value; // DAYS or default
}

export default function ProRectorDashboard() {
  const { status: sessionStatus } = useSession();

  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overdueFilter, setOverdueFilter] = useState(false);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    async function fetchTasks() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/tasks");
        if (res.ok) {
          setTasks(await res.json());
        } else {
          setError("Failed to load tasks.");
        }
      } catch {
        setError("Network error loading tasks.");
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [sessionStatus]);

  const activeTasks = useMemo(
    () => tasks.filter((t) => !TERMINAL_STATUSES.includes(t.status)),
    [tasks]
  );

  const overdueTasks = useMemo(() => {
    const now = new Date();
    return activeTasks.filter((t) => new Date(t.expectedDate) < now);
  }, [activeTasks]);

  const awaitingApproval = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status === "PENDING_APPROVAL" || t.status === "COORDINATOR_ACCEPTED"
      ),
    [tasks]
  );

  const manDaysSaved = useMemo(() => {
    return tasks
      .filter((t) => t.status === "ACCEPTED_CLOSED")
      .reduce((sum, t) => {
        const pre = toDays(t.preEffort, t.preUnit);
        const post = toDays(t.postEffort, t.postUnit);
        return sum + Math.max(0, pre - post);
      }, 0);
  }, [tasks]);

  // Status distribution for the stacked bar (active statuses only)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeTasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).filter(([, count]) => count > 0);
  }, [activeTasks]);

  const totalActiveCount = activeTasks.length;

  const escalatedTasks = useMemo(
    () => activeTasks.filter((t) => t.rejectionCount >= 3),
    [activeTasks]
  );

  const recentActiveTasks = useMemo(
    () =>
      [...activeTasks]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 10),
    [activeTasks]
  );

  // Which tasks to show in bottom list
  const displayTasks = overdueFilter ? overdueTasks : recentActiveTasks;

  if (sessionStatus === "loading") {
    return <div className="p-4 text-sm text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-heading text-nust-blue mb-4">Dashboard</h1>

      {loading ? (
        <div className="text-sm text-gray-400 text-center py-10">
          Loading dashboard...
        </div>
      ) : error ? (
        <div className="text-sm text-red-500 text-center py-10">{error}</div>
      ) : (
        <>
          {/* Summary Cards - 2x2 grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Active Tasks */}
            <div className="bg-blue-600 text-white rounded-lg p-3">
              <p className="text-xs opacity-80">Active Tasks</p>
              <p className="text-2xl font-bold">{activeTasks.length}</p>
            </div>

            {/* Overdue */}
            <button
              type="button"
              onClick={() => setOverdueFilter((prev) => !prev)}
              className={`text-left rounded-lg p-3 transition-opacity ${
                overdueFilter
                  ? "bg-red-700 text-white ring-2 ring-red-300"
                  : "bg-red-600 text-white"
              }`}
            >
              <p className="text-xs opacity-80">Overdue</p>
              <p className="text-2xl font-bold">{overdueTasks.length}</p>
            </button>

            {/* Awaiting Approval */}
            <div className="bg-amber-500 text-white rounded-lg p-3">
              <p className="text-xs opacity-80">Awaiting Approval</p>
              <p className="text-2xl font-bold">{awaitingApproval.length}</p>
            </div>

            {/* Man-Days Saved */}
            <div className="bg-green-600 text-white rounded-lg p-3">
              <p className="text-xs opacity-80">Man-Days Saved</p>
              <p className="text-2xl font-bold">
                {manDaysSaved % 1 === 0
                  ? manDaysSaved
                  : manDaysSaved.toFixed(1)}
              </p>
            </div>
          </div>

          {/* Status Distribution Bar */}
          {totalActiveCount > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-700 mb-2">
                Status Distribution
              </h2>
              <div className="flex rounded-lg overflow-hidden h-8">
                {statusCounts.map(([status, count]) => {
                  const pct = (count / totalActiveCount) * 100;
                  const colors = STATUS_COLORS[status] ?? {
                    bg: "#E5E7EB",
                    text: "#374151",
                  };
                  return (
                    <div
                      key={status}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}
                      className="flex items-center justify-center text-[10px] font-medium overflow-hidden whitespace-nowrap"
                      title={`${STATUS_DISPLAY_NAMES[status] ?? status}: ${count}`}
                    >
                      {pct >= 8 ? count : ""}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {statusCounts.map(([status, count]) => {
                  const colors = STATUS_COLORS[status] ?? {
                    bg: "#E5E7EB",
                    text: "#374151",
                  };
                  return (
                    <div key={status} className="flex items-center gap-1 text-[10px] text-gray-600">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: colors.bg }}
                      />
                      {STATUS_DISPLAY_NAMES[status] ?? status} ({count})
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Escalated Tasks */}
          {escalatedTasks.length > 0 && (
            <div className="mb-6 border-2 border-red-500 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-medium text-red-700">
                  Escalated Tasks
                </h2>
                <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">
                  {escalatedTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {escalatedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    href={`/pro-rector/tasks/${task.id}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Active Tasks / Overdue Filter */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-700">
                {overdueFilter ? "Overdue Tasks" : "Recent Active Tasks"}
              </h2>
              {overdueFilter && (
                <button
                  type="button"
                  onClick={() => setOverdueFilter(false)}
                  className="text-xs text-blue-600 underline"
                >
                  Show recent
                </button>
              )}
            </div>
            {displayTasks.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-6">
                {overdueFilter ? "No overdue tasks" : "No active tasks"}
              </div>
            ) : (
              <div className="space-y-3">
                {displayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    href={`/pro-rector/tasks/${task.id}`}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
