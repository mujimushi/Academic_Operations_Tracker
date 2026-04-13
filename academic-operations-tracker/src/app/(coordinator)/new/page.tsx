"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { REQUEST_TYPES, PRIORITIES } from "@/constants/statuses";
import { FileIcon, XIcon, CheckIcon, UploadIcon } from "@/components/Icons";

/* ---------- Types ---------- */

interface TeamOption {
  id: string;
  name: string;
  resource: { id: string; name: string };
}

interface UploadedDoc {
  id: string;
  filename: string;
  size: number;
  type: string;
}

type EffortUnit = "HOURS" | "DAYS";

/* ---------- Helpers ---------- */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---------- Sub-components ---------- */

function RequiredStar() {
  return <span className="text-red-500 ml-0.5">*</span>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-red-500 text-xs mt-1">{message}</p>;
}

function CharCounter({ current, max }: { current: number; max: number }) {
  return (
    <span
      className={`text-xs ${current > max ? "text-red-500 font-medium" : "text-gray-400"}`}
    >
      {current}/{max}
    </span>
  );
}

/* ---------- Main Component ---------- */

export default function CoordinatorNewTask() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  // Teams
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  // Form fields
  const [title, setTitle] = useState("");
  const [requestType, setRequestType] = useState("");
  const [description, setDescription] = useState("");
  const [affectedProcess, setAffectedProcess] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>([]);
  const [newCriterion, setNewCriterion] = useState("");
  const [showCriterionInput, setShowCriterionInput] = useState(false);
  const [expectedDate, setExpectedDate] = useState("");
  const [tolerance, setTolerance] = useState(7);
  const [teamId, setTeamId] = useState("");
  const [priority, setPriority] = useState("");
  const [preEffort, setPreEffort] = useState<number | "">("");
  const [preUnit, setPreUnit] = useState<EffortUnit>("HOURS");
  const [postEffort, setPostEffort] = useState<number | "">("");
  const [postUnit, setPostUnit] = useState<EffortUnit>("HOURS");
  const [policyRef, setPolicyRef] = useState("");

  // Task state (after save)
  const [savedTaskId, setSavedTaskId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Documents
  const [reqDoc, setReqDoc] = useState<UploadedDoc | null>(null);
  const [policyDoc, setPolicyDoc] = useState<UploadedDoc | null>(null);
  const [uploadingReq, setUploadingReq] = useState(false);
  const [uploadingPolicy, setUploadingPolicy] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  // Refs
  const criterionInputRef = useRef<HTMLInputElement>(null);
  const reqFileRef = useRef<HTMLInputElement>(null);
  const policyFileRef = useRef<HTMLInputElement>(null);

  const isPolicyChange = requestType === "POLICY_CHANGE";

  // Fetch teams on mount
  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch("/api/teams");
        if (res.ok) {
          const data = await res.json();
          setTeams(data);
        }
      } catch {
        // Teams fetch failed silently
      } finally {
        setTeamsLoading(false);
      }
    }
    fetchTeams();
  }, []);

  // Focus criterion input when shown
  useEffect(() => {
    if (showCriterionInput && criterionInputRef.current) {
      criterionInputRef.current.focus();
    }
  }, [showCriterionInput]);

  /* ---------- Validation ---------- */

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};

    if (!title.trim()) errs.title = "Task title is required";
    else if (title.length > 200) errs.title = "Title must be 200 characters or fewer";

    if (!requestType) errs.requestType = "Request type is required";
    if (!description.trim()) errs.description = "Description is required";
    if (!affectedProcess.trim()) errs.affectedProcess = "Affected process is required";
    if (!expectedOutcome.trim()) errs.expectedOutcome = "Expected outcome is required";

    if (acceptanceCriteria.length === 0)
      errs.acceptanceCriteria = "At least one acceptance criterion is required";

    if (!expectedDate) errs.expectedDate = "Expected completion date is required";
    if (!teamId) errs.teamId = "Team selection is required";
    if (!priority) errs.priority = "Priority is required";

    if (preEffort === "" || preEffort < 0) errs.preEffort = "Pre-automation effort is required";
    if (postEffort === "" || postEffort < 0) errs.postEffort = "Post-automation effort is required";

    if (isPolicyChange && !policyRef.trim())
      errs.policyRef = "Policy reference is mandatory for Policy Change requests";

    return errs;
  }

  /* ---------- Acceptance Criteria ---------- */

  function addCriterion() {
    const text = newCriterion.trim();
    if (!text) return;
    setAcceptanceCriteria((prev) => [...prev, text]);
    setNewCriterion("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.acceptanceCriteria;
      return next;
    });
  }

  function removeCriterion(index: number) {
    setAcceptanceCriteria((prev) => prev.filter((_, i) => i !== index));
  }

  /* ---------- Save Draft ---------- */

  async function handleSaveDraft(e: FormEvent) {
    e.preventDefault();
    setGeneralError("");

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type: requestType,
          priority,
          description: description.trim(),
          affectedProcess: affectedProcess.trim(),
          expectedOutcome: expectedOutcome.trim(),
          expectedDate,
          tolerance,
          teamId,
          policyRef: policyRef.trim() || null,
          preEffort: preEffort === "" ? null : Number(preEffort),
          preUnit,
          postEffort: postEffort === "" ? null : Number(postEffort),
          postUnit,
          acceptanceCriteria: acceptanceCriteria.map((desc) => ({
            description: desc,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setGeneralError(data.error || "Failed to save draft");
        return;
      }

      const task = await res.json();
      setSavedTaskId(task.id);
    } catch {
      setGeneralError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Document Upload ---------- */

  async function handleUpload(
    file: File,
    docType: "REQUIREMENTS" | "POLICY",
    setUploading: (v: boolean) => void,
    setDoc: (d: UploadedDoc | null) => void
  ) {
    if (!savedTaskId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", docType);

      const res = await fetch(`/api/tasks/${savedTaskId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setGeneralError(data.error || `Failed to upload ${docType.toLowerCase()} document`);
        return;
      }

      const doc = await res.json();
      setDoc({ id: doc.id, filename: doc.filename, size: doc.size, type: doc.type });
    } catch {
      setGeneralError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  /* ---------- Submit for Approval ---------- */

  const reqDocUploaded = reqDoc !== null;
  const policyDocRequired = isPolicyChange;
  const policyDocUploaded = policyDoc !== null;
  const allRequiredDocsUploaded =
    reqDocUploaded && (!policyDocRequired || policyDocUploaded);

  const canSubmit = savedTaskId !== null && allRequiredDocsUploaded;

  function getSubmitHelperText(): string {
    if (!savedTaskId) return "Save draft first";
    if (!reqDocUploaded) return "Upload required documents";
    if (policyDocRequired && !policyDocUploaded)
      return "Upload policy document (required for Policy Change)";
    return "";
  }

  async function handleSubmitForApproval() {
    if (!canSubmit) return;

    setSubmitting(true);
    setGeneralError("");
    try {
      const res = await fetch(`/api/tasks/${savedTaskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PENDING_APPROVAL" }),
      });

      if (!res.ok) {
        const data = await res.json();
        setGeneralError(data.error || "Failed to submit for approval");
        return;
      }

      router.push("/coordinator/tasks");
    } catch {
      setGeneralError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Loading states ---------- */

  if (sessionStatus === "loading") {
    return (
      <div className="p-6">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  /* ---------- Render ---------- */

  const inputClass =
    "border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-nust-blue/30 focus:border-nust-blue transition-colors";
  const inputErrorClass =
    "border border-red-500 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-500 transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-heading text-nust-blue mb-1">New Task</h1>
      <p className="text-sm text-gray-500 mb-6">
        Fill in the details below to create a new task request.
      </p>

      {generalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSaveDraft} className="space-y-5">
        {/* 1. Task Title */}
        <div>
          <label className={labelClass}>
            Task Title <RequiredStar />
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Enter task title"
              className={errors.title ? inputErrorClass : inputClass}
              disabled={!!savedTaskId}
            />
            <CharCounter current={title.length} max={200} />
          </div>
          <FieldError message={errors.title} />
        </div>

        {/* 2. Request Type */}
        <div>
          <label className={labelClass}>
            Request Type <RequiredStar />
          </label>
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className={errors.requestType ? inputErrorClass : inputClass}
            disabled={!!savedTaskId}
          >
            <option value="">Select request type</option>
            {REQUEST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.requestType} />
        </div>

        {/* 3. Description */}
        <div>
          <label className={labelClass}>
            Description <RequiredStar />
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe the task in detail"
            className={errors.description ? inputErrorClass : inputClass}
            disabled={!!savedTaskId}
          />
          <FieldError message={errors.description} />
        </div>

        {/* 4. Affected Process */}
        <div>
          <label className={labelClass}>
            Affected Process <RequiredStar />
          </label>
          <input
            type="text"
            value={affectedProcess}
            onChange={(e) => setAffectedProcess(e.target.value)}
            placeholder="e.g., Student Registration"
            className={errors.affectedProcess ? inputErrorClass : inputClass}
            disabled={!!savedTaskId}
          />
          <FieldError message={errors.affectedProcess} />
        </div>

        {/* 5. Expected Outcome */}
        <div>
          <label className={labelClass}>
            Expected Outcome <RequiredStar />
          </label>
          <textarea
            value={expectedOutcome}
            onChange={(e) => setExpectedOutcome(e.target.value)}
            rows={3}
            placeholder="Describe the expected result"
            className={errors.expectedOutcome ? inputErrorClass : inputClass}
            disabled={!!savedTaskId}
          />
          <FieldError message={errors.expectedOutcome} />
        </div>

        {/* 6. Acceptance Criteria */}
        <div>
          <label className={labelClass}>
            Acceptance Criteria <RequiredStar />
          </label>

          {acceptanceCriteria.length > 0 && (
            <ul className="space-y-2 mb-2">
              {acceptanceCriteria.map((criterion, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm"
                >
                  <CheckIcon className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="flex-1">{criterion}</span>
                  {!savedTaskId && (
                    <button
                      type="button"
                      onClick={() => removeCriterion(idx)}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                      title="Remove criterion"
                    >
                      <XIcon />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!savedTaskId && (
            <>
              {showCriterionInput ? (
                <div className="flex gap-2">
                  <input
                    ref={criterionInputRef}
                    type="text"
                    value={newCriterion}
                    onChange={(e) => setNewCriterion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCriterion();
                      }
                      if (e.key === "Escape") {
                        setShowCriterionInput(false);
                        setNewCriterion("");
                      }
                    }}
                    placeholder="Type criterion and press Enter"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={addCriterion}
                    className="px-3 py-2 bg-nust-blue text-white rounded-lg text-sm hover:bg-nust-blue/90 flex-shrink-0"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCriterionInput(false);
                      setNewCriterion("");
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 flex-shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCriterionInput(true)}
                  className="text-sm text-nust-blue hover:text-nust-blue/80 font-medium"
                >
                  + Add criterion
                </button>
              )}
            </>
          )}

          <FieldError message={errors.acceptanceCriteria} />
        </div>

        {/* 7. Expected Completion Date + 8. Tolerance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Expected Completion Date <RequiredStar />
            </label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className={errors.expectedDate ? inputErrorClass : inputClass}
              disabled={!!savedTaskId}
            />
            <FieldError message={errors.expectedDate} />
          </div>
          <div>
            <label className={labelClass}>Tolerance (days)</label>
            <input
              type="number"
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              min={0}
              className={inputClass}
              disabled={!!savedTaskId}
            />
          </div>
        </div>

        {/* 9. Team */}
        <div>
          <label className={labelClass}>
            Team <RequiredStar />
          </label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className={errors.teamId ? inputErrorClass : inputClass}
            disabled={!!savedTaskId || teamsLoading}
          >
            <option value="">
              {teamsLoading ? "Loading teams..." : "Select team"}
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.resource.name})
              </option>
            ))}
          </select>
          <FieldError message={errors.teamId} />
        </div>

        {/* 10. Priority */}
        <div>
          <label className={labelClass}>
            Priority <RequiredStar />
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className={errors.priority ? inputErrorClass : inputClass}
            disabled={!!savedTaskId}
          >
            <option value="">Select priority</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.priority} />
        </div>

        {/* 11. Pre-Automation Effort */}
        <div>
          <label className={labelClass}>
            Pre-Automation Effort <RequiredStar />
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={preEffort}
              onChange={(e) =>
                setPreEffort(e.target.value === "" ? "" : Number(e.target.value))
              }
              min={0}
              placeholder="Effort"
              className={`${errors.preEffort ? inputErrorClass : inputClass} flex-1`}
              disabled={!!savedTaskId}
            />
            <select
              value={preUnit}
              onChange={(e) => setPreUnit(e.target.value as EffortUnit)}
              className={`${inputClass} w-28`}
              disabled={!!savedTaskId}
            >
              <option value="HOURS">Hours</option>
              <option value="DAYS">Days</option>
            </select>
          </div>
          <FieldError message={errors.preEffort} />
        </div>

        {/* 12. Post-Automation Effort */}
        <div>
          <label className={labelClass}>
            Post-Automation Effort <RequiredStar />
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={postEffort}
              onChange={(e) =>
                setPostEffort(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              min={0}
              placeholder="Effort"
              className={`${errors.postEffort ? inputErrorClass : inputClass} flex-1`}
              disabled={!!savedTaskId}
            />
            <select
              value={postUnit}
              onChange={(e) => setPostUnit(e.target.value as EffortUnit)}
              className={`${inputClass} w-28`}
              disabled={!!savedTaskId}
            >
              <option value="HOURS">Hours</option>
              <option value="DAYS">Days</option>
            </select>
          </div>
          <FieldError message={errors.postEffort} />
        </div>

        {/* 13. Policy Reference */}
        <div>
          <label className={labelClass}>
            Policy Reference{" "}
            {isPolicyChange ? (
              <RequiredStar />
            ) : (
              <span className="text-gray-400 font-normal">(optional)</span>
            )}
          </label>
          <input
            type="text"
            value={policyRef}
            onChange={(e) => setPolicyRef(e.target.value)}
            placeholder="e.g., Policy No. 2024/05"
            className={errors.policyRef ? inputErrorClass : inputClass}
            disabled={!!savedTaskId}
          />
          <FieldError message={errors.policyRef} />
        </div>

        {/* --- Save Draft Button --- */}
        {!savedTaskId && (
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-nust-blue text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-nust-blue/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
          </div>
        )}

        {savedTaskId && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
            Draft saved successfully. Upload required documents below, then
            submit for approval.
          </div>
        )}
      </form>

      {/* ========== Document Checklist Section ========== */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-heading text-nust-blue mb-4">
          Document Checklist
        </h2>

        {/* Requirements Document */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileIcon className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Requirements Document <RequiredStar />
                </p>
                {reqDoc ? (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {reqDoc.filename} ({formatFileSize(reqDoc.size)})
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">
                    No file uploaded
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {reqDoc ? (
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                  Uploaded
                </span>
              ) : (
                <span className="text-xs font-semibold text-red-600">
                  Required
                </span>
              )}
              {!reqDoc && (
                <>
                  <input
                    ref={reqFileRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "REQUIREMENTS", setUploadingReq, setReqDoc);
                      e.target.value = "";
                    }}
                    disabled={!savedTaskId || uploadingReq}
                  />
                  <button
                    type="button"
                    onClick={() => reqFileRef.current?.click()}
                    disabled={!savedTaskId || uploadingReq}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-nust-blue text-white rounded-lg text-xs font-medium hover:bg-nust-blue/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <UploadIcon className="w-3.5 h-3.5" />
                    {uploadingReq ? "Uploading..." : "Upload"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Policy Document */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileIcon className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Policy Document{" "}
                  {isPolicyChange ? (
                    <RequiredStar />
                  ) : (
                    <span className="text-gray-400 font-normal text-xs">
                      (optional)
                    </span>
                  )}
                </p>
                {policyDoc ? (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {policyDoc.filename} ({formatFileSize(policyDoc.size)})
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">
                    No file uploaded
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {policyDoc ? (
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                  Uploaded
                </span>
              ) : isPolicyChange ? (
                <span className="text-xs font-semibold text-red-600">
                  Required
                </span>
              ) : (
                <span className="text-xs text-gray-400">Optional</span>
              )}
              {!policyDoc && (
                <>
                  <input
                    ref={policyFileRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "POLICY", setUploadingPolicy, setPolicyDoc);
                      e.target.value = "";
                    }}
                    disabled={!savedTaskId || uploadingPolicy}
                  />
                  <button
                    type="button"
                    onClick={() => policyFileRef.current?.click()}
                    disabled={!savedTaskId || uploadingPolicy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-nust-blue text-white rounded-lg text-xs font-medium hover:bg-nust-blue/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <UploadIcon className="w-3.5 h-3.5" />
                    {uploadingPolicy ? "Uploading..." : "Upload"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========== Submit for Approval ========== */}
      <div className="mt-8 border-t border-gray-200 pt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={handleSubmitForApproval}
          disabled={!canSubmit || submitting}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            canSubmit
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {submitting ? "Submitting..." : "Submit for Approval"}
        </button>
        {!canSubmit && (
          <p className="text-sm text-gray-500">{getSubmitHelperText()}</p>
        )}
      </div>
    </div>
  );
}
