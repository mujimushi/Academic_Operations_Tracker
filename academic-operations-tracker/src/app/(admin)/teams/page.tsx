"use client";

import { useState, useEffect, useCallback } from "react";

type TeamResource = {
  id: string;
  name: string;
  email: string;
};

type Team = {
  id: string;
  name: string;
  resourceId: string;
  isActive: boolean;
  createdAt: string;
  resource: TeamResource;
};

type ResourceUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [resourceUsers, setResourceUsers] = useState<ResourceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newResourceId, setNewResourceId] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editResourceId, setEditResourceId] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamsRes, usersRes] = await Promise.all([
        fetch("/api/admin/teams"),
        fetch("/api/admin/users"),
      ]);
      if (teamsRes.ok && usersRes.ok) {
        const teamsData = await teamsRes.json();
        const usersData: ResourceUser[] = await usersRes.json();
        setTeams(teamsData);
        setResourceUsers(
          usersData.filter((u) => u.role === "TEAM_RESOURCE" && u.isActive)
        );
      } else {
        setError("Failed to load data");
      }
    } catch {
      setError("Network error loading data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  }

  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, resourceId: newResourceId }),
      });
      if (res.ok) {
        const created = await res.json();
        setTeams((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setNewName("");
        setNewResourceId("");
        setShowAddForm(false);
        showFeedback("success", "Team created successfully");
      } else {
        const data = await res.json();
        showFeedback("error", data.error || "Failed to create team");
      }
    } catch {
      showFeedback("error", "Network error creating team");
    } finally {
      setAddLoading(false);
    }
  }

  function startEditing(team: Team) {
    setEditingId(team.id);
    setEditName(team.name);
    setEditResourceId(team.resourceId);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName("");
    setEditResourceId("");
  }

  async function saveEdit(teamId: string) {
    try {
      const res = await fetch("/api/admin/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: teamId, name: editName, resourceId: editResourceId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTeams((prev) => prev.map((t) => (t.id === teamId ? updated : t)));
        cancelEditing();
        showFeedback("success", "Team updated");
      } else {
        const data = await res.json();
        showFeedback("error", data.error || "Failed to update team");
      }
    } catch {
      showFeedback("error", "Network error updating team");
    }
  }

  async function toggleActive(team: Team) {
    try {
      const res = await fetch("/api/admin/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: team.id, isActive: !team.isActive }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTeams((prev) => prev.map((t) => (t.id === team.id ? updated : t)));
        showFeedback("success", `Team ${updated.isActive ? "activated" : "deactivated"}`);
      } else {
        const data = await res.json();
        showFeedback("error", data.error || "Failed to toggle status");
      }
    } catch {
      showFeedback("error", "Network error toggling status");
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">Loading teams...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-heading text-nust-blue">Team Management</h1>
          <p className="text-sm text-gray-500 mt-1">{teams.length} team{teams.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 text-sm font-medium text-white bg-nust-blue rounded-lg hover:bg-opacity-90 transition-colors"
        >
          {showAddForm ? "Cancel" : "Add Team"}
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

      {/* Add Team Form */}
      {showAddForm && (
        <form onSubmit={handleAddTeam} className="bg-white rounded-lg p-4 shadow-sm mb-6 space-y-3">
          <h2 className="text-sm font-medium text-gray-700">New Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Team Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-nust-blue"
                placeholder="e.g., Web Development"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Resource Person</label>
              <select
                value={newResourceId}
                onChange={(e) => setNewResourceId(e.target.value)}
                required
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-nust-blue"
              >
                <option value="">Select resource person</option>
                {resourceUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
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
              {addLoading ? "Creating..." : "Create Team"}
            </button>
          </div>
        </form>
      )}

      {/* Teams Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Team Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Resource Person</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr
                  key={team.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  {/* Team Name */}
                  <td className="px-4 py-3">
                    {editingId === team.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-nust-blue w-full"
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{team.name}</span>
                    )}
                  </td>

                  {/* Resource Person */}
                  <td className="px-4 py-3">
                    {editingId === team.id ? (
                      <select
                        value={editResourceId}
                        onChange={(e) => setEditResourceId(e.target.value)}
                        className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-nust-blue"
                      >
                        {resourceUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-700">{team.resource.name}</span>
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-gray-600">
                    {team.resource.email}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        team.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {team.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    {editingId === team.id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => saveEdit(team.id)}
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
                          onClick={() => startEditing(team)}
                          className="px-3 py-1 text-xs font-medium text-nust-blue bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(team)}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                            team.isActive
                              ? "text-red-700 bg-red-50 hover:bg-red-100"
                              : "text-green-700 bg-green-50 hover:bg-green-100"
                          }`}
                        >
                          {team.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No teams found.
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
