"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import NotificationItem from "@/components/NotificationItem";
import type { NotificationWithTask } from "@/types";

export default function ProRectorAlerts() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationWithTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        setNotifications(await res.json());
      } else {
        setError("Failed to load notifications.");
      }
    } catch {
      setError("Network error loading notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    fetchNotifications();
  }, [sessionStatus, fetchNotifications]);

  async function handleAcknowledge(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}/acknowledge`, {
        method: "PATCH",
      });
      if (res.ok) {
        // Optimistically mark as seen
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isSeen: true } : n))
        );
      }
    } catch {
      // Silently fail — user can retry
    }
  }

  function handleNotificationClick(notification: NotificationWithTask) {
    if (notification.task?.id) {
      router.push(`/pro-rector/tasks/${notification.task.id}`);
    }
  }

  if (sessionStatus === "loading") {
    return <div className="p-4 text-sm text-gray-400">Loading...</div>;
  }

  const unreadCount = notifications.filter((n) => !n.isSeen).length;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-heading text-nust-blue">Alerts</h1>
        {!loading && unreadCount > 0 && (
          <span className="text-sm font-medium text-white bg-red-500 px-2.5 py-0.5 rounded-full">
            {unreadCount} unread
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 text-center py-10">
          Loading notifications...
        </div>
      ) : error ? (
        <div className="text-sm text-red-500 text-center py-10">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-10">
          No notifications
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={notification.task?.id ? "cursor-pointer" : undefined}
            >
              <NotificationItem
                notification={notification}
                onAcknowledge={
                  notification.escalationLevel != null
                    ? handleAcknowledge
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
