import { useState } from "react";

const COLORS = {
  nustBlue: "#003366",
  ceramicBlue: "#0088B9",
  lightBlue: "#E8F4F8",
  orange: "#E87722",
  silver: "#C0C0C0",
  beige: "#F5F0E8",
  white: "#FFFFFF",
  bg: "#F7F8FA",
  text: "#1A1A2E",
  textMuted: "#6B7280",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  cardBg: "#FFFFFF",
};

const STATUS_COLORS = {
  Draft: { bg: "#F3F4F6", text: "#6B7280" },
  "Pending Approval": { bg: "#FEF3C7", text: "#92400E" },
  "Approved - Awaiting ICT": { bg: "#DBEAFE", text: "#1E40AF" },
  "Accepted by ICT": { bg: "#E0E7FF", text: "#3730A3" },
  "In Analysis": { bg: "#EDE9FE", text: "#5B21B6" },
  "In Development": { bg: "#CFFAFE", text: "#155E75" },
  "In Testing": { bg: "#FEE2E2", text: "#991B1B" },
  Deployed: { bg: "#D1FAE5", text: "#065F46" },
  "Coordinator Accepted": { bg: "#BBF7D0", text: "#166534" },
  "Accepted - Closed": { bg: "#ECFDF5", text: "#059669" },
  Rework: { bg: "#FEE2E2", text: "#DC2626" },
  Paused: { bg: "#FEF9C3", text: "#854D0E" },
  Killed: { bg: "#1F2937", text: "#F9FAFB" },
};

const PRIORITY_COLORS = {
  Critical: "#DC2626",
  High: "#E87722",
  Medium: "#D97706",
  Low: "#059669",
};

const TASKS = [
  { id: "AOT-001", title: "Automate School Data Collection Portal", type: "New Development", status: "In Development", priority: "Critical", coordinator: "Asst. Prof. Ahmed", ict: "Engr. Farooq", expectedDate: "2026-04-20", ictDate: "2026-04-28", preSaved: "7 days", postSaved: "1 day", rejections: 0, lastActivity: "2026-04-08", daysOverdue: 0, comments: 3 },
  { id: "AOT-002", title: "Fee Structure Policy Update Module", type: "Policy Change", status: "Pending Approval", priority: "High", coordinator: "Dr. Sana", ict: "Engr. Ali", expectedDate: "2026-05-01", ictDate: null, preSaved: "3 days", postSaved: "0.5 days", rejections: 0, lastActivity: "2026-04-09", daysOverdue: 0, comments: 1 },
  { id: "AOT-003", title: "Exam Schedule Generator Bug Fix", type: "Bug Fix", status: "Rework", priority: "High", coordinator: "Asst. Prof. Ahmed", ict: "Engr. Bilal", expectedDate: "2026-04-05", ictDate: "2026-04-10", preSaved: null, postSaved: null, rejections: 3, lastActivity: "2026-04-02", daysOverdue: 4, comments: 12 },
  { id: "AOT-004", title: "Student Transcript Automation", type: "New Development", status: "Deployed", priority: "Medium", coordinator: "Dr. Sana", ict: "Engr. Farooq", expectedDate: "2026-03-30", ictDate: "2026-03-28", preSaved: "5 days", postSaved: "0.5 days", rejections: 0, lastActivity: "2026-04-07", daysOverdue: 0, comments: 7 },
  { id: "AOT-005", title: "Faculty Workload Dashboard Enhancement", type: "Enhancement", status: "In Analysis", priority: "Medium", coordinator: "Asst. Prof. Ahmed", ict: "Engr. Ali", expectedDate: "2026-05-15", ictDate: "2026-05-20", preSaved: "2 days", postSaved: "0.25 days", rejections: 0, lastActivity: "2026-04-06", daysOverdue: 0, comments: 2 },
  { id: "AOT-006", title: "Online Admission Portal v2", type: "New Development", status: "Accepted - Closed", priority: "Critical", coordinator: "Dr. Sana", ict: "Engr. Bilal", expectedDate: "2026-03-15", ictDate: "2026-03-14", preSaved: "14 days", postSaved: "2 days", rejections: 1, lastActivity: "2026-03-20", daysOverdue: 0, comments: 18 },
  { id: "AOT-007", title: "Attendance Integration with LMS", type: "Enhancement", status: "Paused", priority: "Low", coordinator: "Asst. Prof. Ahmed", ict: "Engr. Farooq", expectedDate: "2026-06-01", ictDate: null, preSaved: "1 day", postSaved: "0.1 days", rejections: 0, lastActivity: "2026-03-25", daysOverdue: 0, comments: 4 },
  { id: "AOT-008", title: "Semester Registration Workflow Digitization", type: "New Development", status: "Approved - Awaiting ICT", priority: "High", coordinator: "Dr. Sana", ict: "Engr. Ali", expectedDate: "2026-05-10", ictDate: null, preSaved: "10 days", postSaved: "1 day", rejections: 0, lastActivity: "2026-04-04", daysOverdue: 0, comments: 0 },
];

const NOTIFICATIONS = [
  { id: 1, type: "critical", text: "AOT-003 rejected 3 times. Auto-escalated.", time: "2 hours ago", read: false },
  { id: 2, type: "danger", text: "AOT-003 is 4 days overdue.", time: "3 hours ago", read: false },
  { id: 3, type: "warning", text: "AOT-008 has no activity for 5 days.", time: "5 hours ago", read: false },
  { id: 4, type: "info", text: "AOT-004 deployed, awaiting sign-off.", time: "1 day ago", read: true },
  { id: 5, type: "info", text: "AOT-002 submitted for your review.", time: "1 day ago", read: true },
];

const CHAT_MESSAGES = [
  { role: "Academic Coordinator", name: "Asst. Prof. Ahmed", text: "The exam schedule bug is affecting all departments. Students are seeing wrong dates.", time: "Apr 2, 10:15 AM" },
  { role: "ICT", name: "Engr. Bilal", text: "Fixed the date parsing logic. Deployed to staging.", time: "Apr 3, 2:30 PM" },
  { role: "Academic Coordinator", name: "Asst. Prof. Ahmed", text: "Tested. The overlap detection is still broken for multi-section courses.", time: "Apr 4, 9:00 AM" },
  { role: "Director ACAD", name: "Director ACAD", text: "This is critical. Board meeting is next week and we need this resolved.", time: "Apr 5, 11:00 AM" },
  { role: "ICT", name: "Engr. Bilal", text: "Understood. Reworking the overlap algorithm. Will need 2 more days.", time: "Apr 5, 3:00 PM" },
  { role: "Academic Coordinator", name: "Asst. Prof. Ahmed", text: "Tested again. Now the time slots are correct but room assignments are duplicating.", time: "Apr 7, 10:00 AM" },
];

// Icons as simple SVG components
const Icons = {
  Dashboard: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Tasks: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  Bell: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  User: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Send: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>,
  Clip: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.49"/></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
  Upload: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>,
  File: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
  Alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>,
  Calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  Chat: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { bg: "#F3F4F6", text: "#6B7280" };
  return <span style={{ background: c.bg, color: c.text, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{status}</span>;
}

function PriorityDot({ priority }) {
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_COLORS[priority], display: "inline-block", marginRight: 6 }} />;
}

// ─── PRO RECTOR VIEW ────────────────────────────────────
function ProRectorDashboard({ onTaskClick }) {
  const active = TASKS.filter(t => t.status !== "Accepted - Closed" && t.status !== "Killed");
  const overdue = TASKS.filter(t => t.daysOverdue > 0);
  const pending = TASKS.filter(t => t.status === "Pending Approval");
  const closed = TASKS.filter(t => t.status === "Accepted - Closed");
  const totalSaved = TASKS.filter(t => t.status === "Accepted - Closed" && t.preSaved).reduce((acc) => acc + 12, 0);

  return (
    <div style={{ padding: "16px 16px 100px" }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>Good Morning,</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.nustBlue, margin: "2px 0 0" }}>Pro Rector Academics</h2>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Active Tasks", value: active.length, color: COLORS.ceramicBlue, bg: "#E8F4F8" },
          { label: "Overdue", value: overdue.length, color: COLORS.danger, bg: "#FEE2E2" },
          { label: "Awaiting Approval", value: pending.length, color: COLORS.warning, bg: "#FEF3C7" },
          { label: "Man-Days Saved", value: totalSaved, color: COLORS.success, bg: "#D1FAE5" },
        ].map((card, i) => (
          <div key={i} style={{ background: COLORS.white, borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderLeft: `4px solid ${card.color}` }}>
            <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>{card.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: card.color, margin: "4px 0 0" }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Status Breakdown Bar */}
      <div style={{ background: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.5 }}>Status Distribution</p>
        <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 28 }}>
          {[
            { label: "Dev", count: 1, color: "#06B6D4" },
            { label: "Analysis", count: 1, color: "#8B5CF6" },
            { label: "Deployed", count: 1, color: "#10B981" },
            { label: "Rework", count: 1, color: "#EF4444" },
            { label: "Pending", count: 1, color: "#F59E0B" },
            { label: "Paused", count: 1, color: "#9CA3AF" },
          ].map((s, i) => (
            <div key={i} style={{ flex: s.count, background: s.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 9, color: "#fff", fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Escalated / Attention Needed */}
      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: 14, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Icons.Alert />
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.danger }}>Requires Your Attention</span>
        </div>
        <div onClick={() => onTaskClick(TASKS[2])} style={{ background: COLORS.white, borderRadius: 8, padding: 12, cursor: "pointer", border: "1px solid #FECACA" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: COLORS.danger, margin: 0 }}>AOT-003 - ESCALATED</p>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "4px 0 0", color: COLORS.text }}>Exam Schedule Generator Bug Fix</p>
            </div>
            <span style={{ background: COLORS.danger, color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>3 rejections</span>
          </div>
          <p style={{ fontSize: 11, color: COLORS.danger, margin: "6px 0 0" }}>4 days overdue · Last activity: 7 days ago</p>
        </div>
      </div>

      {/* Task List */}
      <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 10px" }}>All Active Tasks</p>
      {active.filter(t => t.id !== "AOT-003").map(task => (
        <div key={task.id} onClick={() => onTaskClick(task)} style={{ background: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
            <div style={{ flex: 1, marginRight: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>{task.id}</span>
                <PriorityDot priority={task.priority} />
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>{task.priority}</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: 0 }}>{task.title}</p>
            </div>
            <StatusBadge status={task.status} />
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: COLORS.textMuted }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icons.User /> {task.ict}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icons.Calendar /> {task.expectedDate}</span>
            {task.comments > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icons.Chat /> {task.comments}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TASK DETAIL VIEW ────────────────────────────────────
function TaskDetail({ task, onBack, role }) {
  const [showAction, setShowAction] = useState(null);
  const [showChat, setShowChat] = useState(false);

  if (showChat) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 10 }}>
          <div onClick={() => setShowChat(false)} style={{ cursor: "pointer" }}><Icons.Back /></div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{task.id} - Chat</p>
            <p style={{ margin: 0, fontSize: 11, color: COLORS.textMuted }}>6 messages</p>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16, background: "#F0F2F5" }}>
          {CHAT_MESSAGES.map((msg, i) => {
            const isICT = msg.role === "ICT";
            return (
              <div key={i} style={{ marginBottom: 12, display: "flex", flexDirection: "column", alignItems: isICT ? "flex-end" : "flex-start" }}>
                <span style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2 }}>{msg.name}</span>
                <div style={{ background: isICT ? COLORS.ceramicBlue : COLORS.white, color: isICT ? "#fff" : COLORS.text, padding: "8px 12px", borderRadius: 12, maxWidth: "80%", fontSize: 13, lineHeight: 1.5 }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 2 }}>{msg.time}</span>
              </div>
            );
          })}
        </div>
        {role !== "prorector" && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid #E5E7EB", display: "flex", gap: 8, background: COLORS.white }}>
            <div style={{ color: COLORS.textMuted, padding: "8px 4px", cursor: "pointer" }}><Icons.Clip /></div>
            <input placeholder="Type a message..." style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: 20, padding: "8px 14px", fontSize: 13, outline: "none" }} />
            <div style={{ background: COLORS.ceramicBlue, borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}><Icons.Send /></div>
          </div>
        )}
        {role === "prorector" && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB", textAlign: "center" }}>
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>Read-only view</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "0 0 100px" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 10, background: COLORS.white, position: "sticky", top: 0, zIndex: 10 }}>
        <div onClick={onBack} style={{ cursor: "pointer" }}><Icons.Back /></div>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{task.id}</span>
        <div style={{ marginLeft: "auto" }}><StatusBadge status={task.status} /></div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <PriorityDot priority={task.priority} />
          <span style={{ fontSize: 12, color: PRIORITY_COLORS[task.priority], fontWeight: 600 }}>{task.priority}</span>
          <span style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 8, background: "#F3F4F6", padding: "2px 8px", borderRadius: 4 }}>{task.type}</span>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: "0 0 16px" }}>{task.title}</h2>

        {/* Info Grid */}
        <div style={{ background: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {[
            ["Coordinator", task.coordinator],
            ["ICT Resource", task.ict],
            ["Expected Date", task.expectedDate],
            ["ICT Estimate", task.ictDate || "Awaiting"],
            ["Rejections", task.rejections.toString()],
            ["Last Activity", task.lastActivity],
          ].map(([label, value], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 5 ? "1px solid #F3F4F6" : "none" }}>
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: value === "Awaiting" ? COLORS.warning : COLORS.text }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Impact */}
        {task.preSaved && (
          <div style={{ background: "#ECFDF5", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #A7F3D0" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.success, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Impact Estimate</p>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0 }}>Before Automation</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: "2px 0 0" }}>{task.preSaved}</p>
              </div>
              <div style={{ fontSize: 20, color: COLORS.success, alignSelf: "center" }}>→</div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0 }}>After Automation</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.success, margin: "2px 0 0" }}>{task.postSaved}</p>
              </div>
            </div>
          </div>
        )}

        {/* Documents */}
        <div style={{ background: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.5 }}>Documents</p>
          {[
            { name: "Requirements Document.pdf", status: "Approved" },
            { name: "Policy Circular 2026-14.pdf", status: "Uploaded" },
          ].map((doc, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i === 0 ? "1px solid #F3F4F6" : "none" }}>
              <div style={{ color: COLORS.ceramicBlue }}><Icons.File /></div>
              <span style={{ flex: 1, fontSize: 13, color: COLORS.text }}>{doc.name}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: doc.status === "Approved" ? COLORS.success : COLORS.warning, background: doc.status === "Approved" ? "#D1FAE5" : "#FEF3C7", padding: "2px 8px", borderRadius: 4 }}>{doc.status}</span>
            </div>
          ))}
        </div>

        {/* Acceptance Criteria */}
        <div style={{ background: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.5 }}>Acceptance Criteria</p>
          {[
            { text: "Data collected from all 15 schools within 24 hours", done: true },
            { text: "Auto-validation of submitted forms", done: true },
            { text: "Export to Excel with standardized format", done: false },
            { text: "Email notifications to school focal persons", done: false },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${item.done ? COLORS.success : "#D1D5DB"}`, background: item.done ? COLORS.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {item.done && <span style={{ color: "#fff", fontSize: 11 }}><Icons.Check /></span>}
              </div>
              <span style={{ fontSize: 13, color: item.done ? COLORS.textMuted : COLORS.text, textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Chat Button */}
        <div onClick={() => setShowChat(true)} style={{ background: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: COLORS.lightBlue, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.ceramicBlue }}><Icons.Chat /></div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Communication Thread</p>
            <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0 }}>{task.comments} messages</p>
          </div>
          <span style={{ fontSize: 20, color: COLORS.textMuted }}>›</span>
        </div>

        {/* Pro Rector Actions */}
        {role === "prorector" && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.5 }}>Quick Actions</p>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Kill Task", color: COLORS.danger, bg: "#FEE2E2", action: "kill" },
                { label: "Change Priority", color: COLORS.warning, bg: "#FEF3C7", action: "priority" },
                { label: "Push Deadline", color: COLORS.ceramicBlue, bg: COLORS.lightBlue, action: "deadline" },
              ].map((btn, i) => (
                <button key={i} onClick={() => setShowAction(showAction === btn.action ? null : btn.action)} style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: `1.5px solid ${btn.color}`, background: showAction === btn.action ? btn.color : btn.bg, color: showAction === btn.action ? "#fff" : btn.color, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {btn.label}
                </button>
              ))}
            </div>
            {showAction && (
              <div style={{ marginTop: 10, background: COLORS.white, borderRadius: 10, padding: 14, border: "1px solid #E5E7EB" }}>
                {showAction === "kill" && <p style={{ fontSize: 13, margin: "0 0 8px", fontWeight: 600, color: COLORS.danger }}>Kill this task?</p>}
                {showAction === "priority" && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 13, margin: "0 0 8px", fontWeight: 600 }}>Select new priority:</p>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["Critical", "High", "Medium", "Low"].map(p => (
                        <span key={p} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: `1.5px solid ${PRIORITY_COLORS[p]}`, color: PRIORITY_COLORS[p], cursor: "pointer" }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                {showAction === "deadline" && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 13, margin: "0 0 8px", fontWeight: 600 }}>New deadline:</p>
                    <input type="date" style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, width: "100%" }} />
                  </div>
                )}
                <textarea placeholder="Reason (mandatory)" rows={2} style={{ width: "100%", border: "1px solid #D1D5DB", borderRadius: 6, padding: "8px 10px", fontSize: 12, resize: "none", marginBottom: 8, boxSizing: "border-box" }} />
                <button style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", background: COLORS.nustBlue, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Confirm</button>
              </div>
            )}
          </div>
        )}

        {/* Director Actions */}
        {role === "director" && task.status === "Coordinator Accepted" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: COLORS.success, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Approve & Close</button>
            <button style={{ flex: 1, padding: 12, borderRadius: 10, border: `2px solid ${COLORS.danger}`, background: "transparent", color: COLORS.danger, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Reject</button>
          </div>
        )}

        {/* Coordinator Actions */}
        {role === "coordinator" && task.status === "Deployed" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: COLORS.success, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Accept Deliverable</button>
            <button style={{ flex: 1, padding: 12, borderRadius: 10, border: `2px solid ${COLORS.danger}`, background: "transparent", color: COLORS.danger, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Reject (Rework)</button>
          </div>
        )}

        {/* ICT Actions */}
        {role === "ict" && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.5 }}>Update Status</p>
            <select style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, marginBottom: 8 }}>
              <option>In Analysis</option>
              <option>In Development</option>
              <option>In Testing</option>
              <option>Deployed</option>
              <option>Paused</option>
            </select>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: COLORS.textMuted }}>ICT Estimated Completion</label>
              <input type="date" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, marginTop: 4, boxSizing: "border-box" }} />
            </div>
            <button style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", background: COLORS.ceramicBlue, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save Update</button>
          </div>
        )}

        {/* Audit Log */}
        <div style={{ background: COLORS.white, borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.5 }}>Audit Log</p>
          {[
            { action: "Status changed to In Development", by: "Engr. Farooq", time: "Apr 8, 2:30 PM" },
            { action: "Accepted by ICT. Estimate: Apr 28", by: "Engr. Farooq", time: "Apr 6, 10:00 AM" },
            { action: "Approved by Director ACAD", by: "Director ACAD", time: "Apr 5, 4:00 PM" },
            { action: "Documents verified", by: "Director ACAD", time: "Apr 5, 3:45 PM" },
            { action: "Task submitted for approval", by: "Asst. Prof. Ahmed", time: "Apr 4, 11:00 AM" },
            { action: "Task created", by: "Asst. Prof. Ahmed", time: "Apr 3, 9:30 AM" },
          ].map((log, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < 5 ? "1px solid #F7F8FA" : "none" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.ceramicBlue, marginTop: 5, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 12, color: COLORS.text, margin: 0 }}>{log.action}</p>
                <p style={{ fontSize: 10, color: COLORS.textMuted, margin: "2px 0 0" }}>{log.by} · {log.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS VIEW ────────────────────────────────
function NotificationsView() {
  return (
    <div style={{ padding: "16px 16px 100px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.nustBlue, margin: "0 0 16px" }}>Notifications</h2>
      {NOTIFICATIONS.map(n => (
        <div key={n.id} style={{ background: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderLeft: `4px solid ${n.type === "critical" ? COLORS.danger : n.type === "danger" ? COLORS.orange : n.type === "warning" ? COLORS.warning : COLORS.ceramicBlue}`, opacity: n.read ? 0.7 : 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <p style={{ fontSize: 13, color: COLORS.text, margin: 0, lineHeight: 1.5 }}>{n.text}</p>
            {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.ceramicBlue, flexShrink: 0, marginTop: 4 }} />}
          </div>
          <p style={{ fontSize: 11, color: COLORS.textMuted, margin: "6px 0 0" }}>{n.time}</p>
        </div>
      ))}
    </div>
  );
}

// ─── COORDINATOR SUBMISSION FORM ────────────────────────
function CoordinatorForm() {
  const [docs, setDocs] = useState({ req: false, policy: false });
  return (
    <div style={{ padding: "16px 16px 100px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.nustBlue, margin: "0 0 4px" }}>New Task Request</h2>
      <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "0 0 20px" }}>All fields are mandatory</p>

      <div style={{ background: COLORS.white, borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        {[
          { label: "Task Title", type: "text", placeholder: "e.g., Automate Semester Registration" },
          { label: "Request Type", type: "select", options: ["Select type...", "New Development", "Enhancement", "Bug Fix", "Policy Change"] },
          { label: "Description", type: "textarea", placeholder: "Detailed description of the requirement..." },
          { label: "Affected Process", type: "text", placeholder: "e.g., Student Registration" },
          { label: "Expected Outcome", type: "textarea", placeholder: "What does done look like? Be specific..." },
        ].map((field, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, display: "block", marginBottom: 4 }}>{field.label} <span style={{ color: COLORS.danger }}>*</span></label>
            {field.type === "select" ? (
              <select style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, background: "#fff", boxSizing: "border-box" }}>
                {field.options.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : field.type === "textarea" ? (
              <textarea rows={3} placeholder={field.placeholder} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, resize: "none", boxSizing: "border-box" }} />
            ) : (
              <input type="text" placeholder={field.placeholder} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }} />
            )}
          </div>
        ))}

        {/* Acceptance Criteria Builder */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, display: "block", marginBottom: 4 }}>Acceptance Criteria <span style={{ color: COLORS.danger }}>*</span></label>
          <div style={{ border: "1px solid #D1D5DB", borderRadius: 8, padding: 10 }}>
            {["Data collection time reduced to under 24 hours", "All forms auto-validated before submission"].map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: 13 }}>{i + 1}.</span>
                <span style={{ fontSize: 13, flex: 1 }}>{c}</span>
                <span style={{ color: COLORS.danger, cursor: "pointer", fontSize: 12 }}><Icons.X /></span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <input placeholder="Add criterion..." style={{ flex: 1, padding: "6px 8px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 12 }} />
              <span style={{ color: COLORS.ceramicBlue, cursor: "pointer" }}><Icons.Plus /></span>
            </div>
          </div>
        </div>

        {/* Dates, Priority, ICT Resource */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, display: "block", marginBottom: 4 }}>Expected Completion <span style={{ color: COLORS.danger }}>*</span></label>
            <input type="date" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, display: "block", marginBottom: 4 }}>Tolerance (days) <span style={{ color: COLORS.danger }}>*</span></label>
            <input type="number" defaultValue={7} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, display: "block", marginBottom: 4 }}>Priority <span style={{ color: COLORS.danger }}>*</span></label>
            <select style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}>
              <option>Medium</option><option>Critical</option><option>High</option><option>Low</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, display: "block", marginBottom: 4 }}>ICT Resource <span style={{ color: COLORS.danger }}>*</span></label>
            <select style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}>
              <option>Select...</option><option>Engr. Farooq</option><option>Engr. Ali</option><option>Engr. Bilal</option>
            </select>
          </div>
        </div>

        {/* Impact Estimate */}
        <div style={{ background: "#F0FDF4", borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.success, margin: "0 0 8px" }}>Impact Estimate</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: COLORS.textMuted }}>Pre-Automation Effort</label>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <input type="number" placeholder="7" style={{ flex: 1, padding: 6, borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }} />
                <select style={{ padding: 6, borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }}>
                  <option>days</option><option>hours</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: COLORS.textMuted }}>Post-Automation Effort</label>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <input type="number" placeholder="1" style={{ flex: 1, padding: 6, borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }} />
                <select style={{ padding: 6, borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }}>
                  <option>days</option><option>hours</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Document Checklist */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, margin: "0 0 8px" }}>Document Checklist <span style={{ color: COLORS.danger }}>*</span></p>
          {[
            { label: "Requirements Document", mandatory: true, uploaded: docs.req },
            { label: "Policy Document", mandatory: false, uploaded: docs.policy },
          ].map((doc, i) => (
            <div key={i} onClick={() => setDocs(prev => ({ ...prev, [i === 0 ? "req" : "policy"]: !prev[i === 0 ? "req" : "policy"] }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, border: `1.5px dashed ${doc.uploaded ? COLORS.success : "#D1D5DB"}`, borderRadius: 8, marginBottom: 8, cursor: "pointer", background: doc.uploaded ? "#F0FDF4" : "transparent" }}>
              <div style={{ color: doc.uploaded ? COLORS.success : COLORS.textMuted }}>{doc.uploaded ? <Icons.Check /> : <Icons.Upload />}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, margin: 0, color: COLORS.text }}>{doc.label} {doc.mandatory && <span style={{ color: COLORS.danger }}>*</span>}</p>
                <p style={{ fontSize: 10, color: COLORS.textMuted, margin: 0 }}>{doc.uploaded ? "requirements_v1.pdf uploaded" : "Click to upload PDF/DOCX"}</p>
              </div>
            </div>
          ))}
        </div>

        <button disabled={!docs.req} style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", background: docs.req ? COLORS.nustBlue : "#D1D5DB", color: "#fff", fontSize: 14, fontWeight: 700, cursor: docs.req ? "pointer" : "not-allowed" }}>
          Submit for Director Approval
        </button>
        {!docs.req && <p style={{ fontSize: 11, color: COLORS.danger, textAlign: "center", marginTop: 6 }}>Requirements Document must be uploaded before submission</p>}
      </div>
    </div>
  );
}

// ─── DIRECTOR APPROVAL QUEUE ────────────────────────────
function DirectorView({ onTaskClick }) {
  const pendingTasks = TASKS.filter(t => t.status === "Pending Approval" || t.status === "Coordinator Accepted" || t.status === "Deployed");
  return (
    <div style={{ padding: "16px 16px 100px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.nustBlue, margin: "0 0 4px" }}>Director ACAD</h2>
      <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "0 0 20px" }}>Approval queue and task oversight</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
        {["All", "Pending Approval", "Coordinator Accepted", "Active"].map(f => (
          <span key={f} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: f === "All" ? COLORS.nustBlue : "#F3F4F6", color: f === "All" ? "#fff" : COLORS.textMuted, whiteSpace: "nowrap", cursor: "pointer" }}>{f}</span>
        ))}
      </div>

      {TASKS.filter(t => t.status !== "Accepted - Closed" && t.status !== "Killed").map(task => (
        <div key={task.id} onClick={() => onTaskClick(task)} style={{ background: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", cursor: "pointer", borderLeft: task.status === "Pending Approval" ? `4px solid ${COLORS.warning}` : task.status === "Rework" ? `4px solid ${COLORS.danger}` : "4px solid transparent" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>{task.id}</span>
                <PriorityDot priority={task.priority} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: 0 }}>{task.title}</p>
            </div>
            <StatusBadge status={task.status} />
          </div>
          {task.status === "Pending Approval" && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={e => e.stopPropagation()} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", background: COLORS.success, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Approve</button>
              <button onClick={e => e.stopPropagation()} style={{ flex: 1, padding: 8, borderRadius: 8, border: `1.5px solid ${COLORS.danger}`, background: "transparent", color: COLORS.danger, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── ICT TASK PAGE (landed via email link) ──────────────
function ICTLandingPage({ task, onBack }) {
  return <TaskDetail task={task} onBack={onBack} role="ict" />;
}

// ─── MAIN APP ────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState("prorector");
  const [tab, setTab] = useState("dashboard");
  const [selectedTask, setSelectedTask] = useState(null);
  const [ictTask] = useState(TASKS[0]);

  const roles = [
    { id: "prorector", label: "Pro Rector (PWA)" },
    { id: "coordinator", label: "Academic Coordinator" },
    { id: "director", label: "Director ACAD" },
    { id: "ict", label: "ICT (Email Link)" },
  ];

  const tabs = role === "prorector"
    ? [
        { id: "dashboard", label: "Dashboard", icon: Icons.Dashboard },
        { id: "tasks", label: "Tasks", icon: Icons.Tasks },
        { id: "alerts", label: "Alerts", icon: Icons.Bell },
      ]
    : role === "coordinator"
    ? [
        { id: "new", label: "New Task", icon: Icons.Plus },
        { id: "tasks", label: "My Tasks", icon: Icons.Tasks },
        { id: "alerts", label: "Alerts", icon: Icons.Bell },
      ]
    : role === "director"
    ? [
        { id: "dashboard", label: "Queue", icon: Icons.Dashboard },
        { id: "tasks", label: "All Tasks", icon: Icons.Tasks },
        { id: "alerts", label: "Alerts", icon: Icons.Bell },
      ]
    : [];

  const unreadCount = NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <div style={{ fontFamily: "'Georgia', 'Calisto MT', serif", background: "#F0F2F5", minHeight: "100vh" }}>
      {/* Role Switcher */}
      <div style={{ background: COLORS.nustBlue, padding: "8px 16px", display: "flex", gap: 6, overflowX: "auto" }}>
        {roles.map(r => (
          <button key={r.id} onClick={() => { setRole(r.id); setTab(r.id === "coordinator" ? "new" : "dashboard"); setSelectedTask(null); }}
            style={{ padding: "6px 14px", borderRadius: 20, border: role === r.id ? "none" : "1px solid rgba(255,255,255,0.3)", background: role === r.id ? COLORS.orange : "transparent", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Phone Frame */}
      <div style={{ maxWidth: 420, margin: "0 auto", background: COLORS.bg, minHeight: "calc(100vh - 40px)", position: "relative", boxShadow: "0 0 40px rgba(0,0,0,0.1)" }}>
        {/* Status Bar */}
        <div style={{ background: COLORS.nustBlue, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>NUST</span>
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Academic Operations Tracker</span>
        </div>

        {/* Content */}
        <div style={{ paddingBottom: role === "ict" ? 0 : 70, overflowY: "auto" }}>
          {selectedTask ? (
            <TaskDetail task={selectedTask} onBack={() => setSelectedTask(null)} role={role} />
          ) : role === "prorector" && tab === "dashboard" ? (
            <ProRectorDashboard onTaskClick={setSelectedTask} />
          ) : role === "prorector" && tab === "tasks" ? (
            <div style={{ padding: "16px 16px 100px" }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.nustBlue, margin: "0 0 16px" }}>All Tasks</h2>
              {TASKS.map(task => (
                <div key={task.id} onClick={() => setSelectedTask(task)} style={{ background: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <span style={{ fontSize: 11, color: COLORS.textMuted }}>{task.id}</span>
                      <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: "2px 0 0" }}>{task.title}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (role === "prorector" || role === "coordinator" || role === "director") && tab === "alerts" ? (
            <NotificationsView />
          ) : role === "coordinator" && tab === "new" ? (
            <CoordinatorForm />
          ) : role === "coordinator" && tab === "tasks" ? (
            <div style={{ padding: "16px 16px 100px" }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.nustBlue, margin: "0 0 16px" }}>My Tasks</h2>
              {TASKS.filter(t => t.coordinator === "Asst. Prof. Ahmed").map(task => (
                <div key={task.id} onClick={() => setSelectedTask(task)} style={{ background: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <span style={{ fontSize: 11, color: COLORS.textMuted }}>{task.id}</span>
                      <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: "2px 0 0" }}>{task.title}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : role === "director" && (tab === "dashboard" || tab === "tasks") ? (
            <DirectorView onTaskClick={setSelectedTask} />
          ) : role === "ict" ? (
            <ICTLandingPage task={ictTask} onBack={() => {}} />
          ) : null}
        </div>

        {/* Bottom Tab Bar */}
        {role !== "ict" && !selectedTask && (
          <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: COLORS.white, borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "space-around", padding: "8px 0 12px", zIndex: 20 }}>
            {tabs.map(t => (
              <div key={t.id} onClick={() => { setTab(t.id); setSelectedTask(null); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", color: tab === t.id ? COLORS.ceramicBlue : COLORS.textMuted, position: "relative" }}>
                <t.icon />
                {t.id === "alerts" && unreadCount > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -4, background: COLORS.danger, color: "#fff", fontSize: 9, fontWeight: 700, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount}</span>
                )}
                <span style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
