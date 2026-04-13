"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import TaskCard from "@/components/TaskCard";
import type { TaskWithRelations } from "@/types";
import { REQUEST_TYPES, PRIORITIES } from "@/constants/statuses";
import { STATUS_DISPLAY_NAMES } from "@/constants/colors";

const ALL_STATUSES = Object.keys(STATUS_DISPLAY_NAMES);

export default function ProRectorTasksPage() {
  const { status: sessionStatus } = useSession();

  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedType, setSelectedType] = useState("");

  useEffect(() => {
    if (sessionStatus === "loading") return;

    async function fetchTasks() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        selectedStatuses.forEach((s) => params.append("status", s));
        if (selectedPriority) params.append("priority", selectedPriority);
        if (selectedType) params.append("type", selectedType);

        const url = `/api/tasks${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url);
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
  }, [sessionStatus, selectedStatuses, selectedPriority, selectedType]);

  function toggleStatus(status: string) {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  }

  if (sessionStatus === "loading") {
    return <div className="p-4 text-sm text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-heading text-nust-blue">All Tasks</h1>
        {!loading && (
          <span className="text-sm text-gray-500">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-3 shadow-sm mb-4 space-y-3">
        {/* Status multi-select */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_STATUSES.map((status) => {
              const active = selectedStatuses.includes(status);
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleStatus(status)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    active
                      ? "bg-nust-blue text-white border-nust-blue"
                      : "bg-white text-gray-600 border-gray-200 hover:border-nust-blue"
                  }`}
                >
                  {STATUS_DISPLAY_NAMES[status]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority + Request Type dropdowns */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-nust-blue"
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Request Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-nust-blue"
            >
              <option value="">All Types</option>
              {REQUEST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="text-sm text-gray-400 text-center py-10">
          Loading tasks...
        </div>
      ) : error ? (
        <div className="text-sm text-red-500 text-center py-10">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-10">
          No tasks found.
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              href={`/pro-rector/tasks/${task.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
