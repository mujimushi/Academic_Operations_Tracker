"use client";

import { useState, useEffect, useCallback } from "react";

type ConfigEntry = {
  key: string;
  value: string;
  updatedAt: string;
};

type Section = {
  title: string;
  keys: { key: string; label: string; type: "text" | "password" | "number" }[];
};

const SECTIONS: Section[] = [
  {
    title: "SMTP Configuration",
    keys: [
      { key: "smtp_host", label: "SMTP Host", type: "text" },
      { key: "smtp_port", label: "SMTP Port", type: "number" },
      { key: "smtp_user", label: "SMTP User", type: "text" },
      { key: "smtp_password", label: "SMTP Password", type: "password" },
      { key: "smtp_from", label: "From Address", type: "text" },
    ],
  },
  {
    title: "File Storage",
    keys: [
      { key: "upload_path", label: "Upload Path", type: "text" },
    ],
  },
  {
    title: "Task Defaults",
    keys: [
      { key: "default_tolerance", label: "Default Tolerance (days)", type: "number" },
    ],
  },
  {
    title: "Firebase (FCM)",
    keys: [
      { key: "fcm_project_id", label: "Project ID", type: "text" },
      { key: "fcm_client_email", label: "Client Email", type: "text" },
      { key: "fcm_private_key", label: "Private Key", type: "password" },
    ],
  },
];

const CRON_KEYS = [
  { key: "cron_inactivity_last_run", label: "Inactivity Check" },
  { key: "cron_overdue_last_run", label: "Overdue Check" },
  { key: "cron_stale_drafts_last_run", label: "Stale Drafts Check" },
  { key: "cron_stale_paused_last_run", label: "Stale Paused Check" },
];

export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<Record<string, ConfigEntry>>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data: ConfigEntry[] = await res.json();
        const map: Record<string, ConfigEntry> = {};
        const values: Record<string, string> = {};
        data.forEach((c) => {
          map[c.key] = c;
          values[c.key] = c.value;
        });
        setConfigs(map);
        setFormValues(values);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to load settings");
      }
    } catch {
      setError("Network error loading settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  }

  function updateValue(key: string, value: string) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  function togglePasswordVisibility(key: string) {
    setVisiblePasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function saveSection(section: Section) {
    setSavingSection(section.title);
    try {
      const sectionConfigs = section.keys.map((k) => ({
        key: k.key,
        value: formValues[k.key] ?? "",
      }));

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs: sectionConfigs }),
      });

      if (res.ok) {
        const updated: ConfigEntry[] = await res.json();
        const newConfigs = { ...configs };
        const newValues = { ...formValues };
        updated.forEach((c) => {
          newConfigs[c.key] = c;
          newValues[c.key] = c.value;
        });
        setConfigs(newConfigs);
        setFormValues(newValues);
        showFeedback("success", `${section.title} saved successfully`);
      } else {
        const data = await res.json();
        showFeedback("error", data.error || "Failed to save settings");
      }
    } catch {
      showFeedback("error", "Network error saving settings");
    } finally {
      setSavingSection(null);
    }
  }

  function formatDateTime(iso: string) {
    if (!iso) return "Never";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">Loading settings...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-heading text-nust-blue mb-6">System Settings</h1>

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

      {/* Config Sections */}
      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="text-sm font-medium text-gray-800 mb-4">{section.title}</h2>
            <div className="space-y-3">
              {section.keys.map((field) => (
                <div key={field.key} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <label className="text-sm text-gray-600">{field.label}</label>
                  <div className="sm:col-span-2 flex gap-2">
                    <input
                      type={
                        field.type === "password"
                          ? visiblePasswords[field.key]
                            ? "text"
                            : "password"
                          : field.type
                      }
                      value={formValues[field.key] ?? ""}
                      onChange={(e) => updateValue(field.key, e.target.value)}
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-nust-blue"
                      placeholder={field.label}
                    />
                    {field.type === "password" && (
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(field.key)}
                        className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                      >
                        {visiblePasswords[field.key] ? "Hide" : "Show"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => saveSection(section)}
                disabled={savingSection === section.title}
                className="px-4 py-2 text-sm font-medium text-white bg-nust-blue rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-colors"
              >
                {savingSection === section.title ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ))}

        {/* Cron Status Section */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-sm font-medium text-gray-800 mb-4">Cron Job Status</h2>
          <div className="space-y-3">
            {CRON_KEYS.map((cron) => {
              const entry = configs[cron.key];
              return (
                <div
                  key={cron.key}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <span className="text-sm text-gray-700">{cron.label}</span>
                  <span className="text-sm text-gray-500">
                    {entry ? formatDateTime(entry.value) : "Never run"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
