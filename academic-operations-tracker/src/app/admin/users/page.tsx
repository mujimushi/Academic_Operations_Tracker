"use client";

import { useState, useEffect, useCallback } from "react";

const ROLES = ["ADMIN", "PRO_RECTOR", "DIRECTOR", "COORDINATOR", "TEAM_RESOURCE"] as const;

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  ADMIN:         { bg: "#FEE2E2", text: "#991B1B" },
  PRO_RECTOR:    { bg: "#EDE9FE", text: "#5B21B6" },
  DIRECTOR:      { bg: "#DBEAFE", text: "#1E40AF" },
  COORDINATOR:   { bg: "#FEF3C7", text: "#92400E" },
  TEAM_RESOURCE: { bg: "#D1FAE5", text: "#065F46" },
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  PRO_RECTOR: "Pro-Rector",
  DIRECTOR: "Director",
  COORDINATOR: "Coordinator",
  TEAM_RESOURCE: "Team Resource",
};

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  teamResource: { id: string; name: string }[];
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<string>("COORDINATOR");
  const [addLoading, setAddLoading] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        setUsers(await res.json());
      } else {
        const data = await res.json();
        setError(data.error || "Failed to load users");
      }
    } catch {
      setError("Network error loading users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, name: newName, role: newRole }),
      });
      if (res.ok) {
        const created = await res.json();
        setUsers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setNewEmail("");
        setNewName("");
        setNewRole("COORDINATOR");
        setShowAddForm(false);
        showFeedback("success", "User created successfully");
      } else {
        const data = await res.json();
        showFeedback("error", data.error || "Failed to create user");
      }
    } catch {
      showFeedback("error", "Network error creating user");
    } finally {
      setAddLoading(false);
    }
  }

  function startEditing(user: User) {
    setEditingId(user.id);
    setEditName(user.name);
    setEditRole(user.role);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName("");
    setEditRole("");
  }

  async function saveEdit(userId: string) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, name: editName, role: editRole }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? updated : u))
        );
        cancelEditing();
        showFeedback("success", "User updated");
      } else {
        const data = await res.json();
        showFeedback("error", data.error || "Failed to update user");
      }
    } catch {
      showFeedback("error", "Network error updating user");
    }
  }

  async function toggleActive(user: User) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? updated : u))
        );
        showFeedback("success", `User ${updated.isActive ? "activated" : "deactivated"}`);
      } else {
        const data = await res.json();
        showFeedback("error", data.error || "Failed to toggle status");
      }
    } catch {
      showFeedback("error", "Network error toggling status");
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">Loading users...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-heading text-nust-blue">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} user{users.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 text-sm font-medium text-white bg-nust-blue rounded-lg hover:bg-opacity-90 transition-colors"
        >
          {showAddForm ? "Cancel" : "Add User"}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`mb-4 px-4 py-2 rounded-lg text-sm ${
            feedback.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Add User Form */}
      {showAddForm && (
        <form onSubmit={handleAddUser} className="bg-white rounded-lg p-4 shadow-sm mb-6 space-y-3">
          <h2 className="text-sm font-medium text-gray-700">New User</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-nust-blue"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-nust-blue"
                placeholder="user@nust.edu.pk"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-nust-blue"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={addLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-nust-blue rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-colors"
            >
              {addLoading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    {editingId === user.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-nust-blue w-full"
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{user.name}</span>
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    {editingId === user.id ? (
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-nust-blue"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: ROLE_COLORS[user.role]?.bg || "#F3F4F6",
                          color: ROLE_COLORS[user.role]?.text || "#6B7280",
                        }}
                      >
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    {editingId === user.id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => saveEdit(user.id)}
                          className="px-3 py-1 text-xs font-medium text-white bg-nust-blue rounded hover:bg-opacity-90 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEditing(user)}
                          className="px-3 py-1 text-xs font-medium text-nust-blue bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(user)}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                            user.isActive
                              ? "text-red-700 bg-red-50 hover:bg-red-100"
                              : "text-green-700 bg-green-50 hover:bg-green-100"
                          }`}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
