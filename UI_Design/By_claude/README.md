# NUST Academic Operations Tracker - Frontend

## Overview
A role-based task tracking system for NUST's Academic Directorate and ICT Department. Four user roles access the same React app with different views.

## Tech Stack
- React 18+ with Vite
- React Router v6 for routing
- Tailwind CSS for styling (utility-first)
- No component library - custom components throughout
- PWA-ready (service worker + manifest for Pro Rector mobile)

## Brand Guidelines (NUST)
- Primary: NUST Blue `#003366`
- Secondary: Ceramic Blue `#0088B9`
- Accent: Orange `#E87722`
- Supporting: Silver `#C0C0C0`, Beige `#F5F0E8`
- Background: `#F7F8FA`
- Font: Georgia / Calisto MT fallback for headings, system sans-serif for body
- All colors defined in `src/constants/colors.js`

## Project Structure
```
src/
├── constants/
│   ├── colors.js          # Brand color palette
│   ├── statuses.js        # Task status definitions, colors, transitions
│   └── mockData.js        # Mock tasks, notifications, chat messages
├── components/
│   ├── StatusBadge.jsx    # Colored status pill
│   ├── PriorityDot.jsx    # Priority color indicator
│   ├── TaskCard.jsx       # Task list item (reused across all views)
│   ├── TaskDetail.jsx     # Full task detail page (role-aware)
│   ├── ChatThread.jsx     # WhatsApp-style messaging per task
│   ├── DocumentChecklist.jsx  # Upload slots with gate logic
│   ├── AcceptanceCriteria.jsx # Checklist builder + display
│   ├── AuditLog.jsx       # Timestamped status change history
│   ├── BottomTabBar.jsx   # WhatsApp-style bottom navigation
│   └── NotificationItem.jsx   # Single notification row
├── views/
│   ├── ProRectorDashboard.jsx  # Summary cards + status bar + escalated + task list
│   ├── ProRectorTasks.jsx      # Filterable/sortable all-tasks list
│   ├── ProRectorAlerts.jsx     # Notification center
│   ├── CoordinatorForm.jsx     # New task submission form
│   ├── CoordinatorTasks.jsx    # Coordinator's own tasks
│   ├── DirectorQueue.jsx       # Approval queue with inline approve/reject
│   └── ICTTaskPage.jsx         # Landing page from email deep link
├── layouts/
│   ├── MobileShell.jsx    # PWA shell with header + bottom tabs (Pro Rector)
│   └── DesktopShell.jsx   # Sidebar nav shell (Coordinator, Director)
├── App.jsx                # Route definitions
└── main.jsx               # Entry point
```

## Routing Plan
```
/                          → redirect based on role
/pro-rector                → MobileShell
  /pro-rector/dashboard    → ProRectorDashboard
  /pro-rector/tasks        → ProRectorTasks
  /pro-rector/tasks/:id    → TaskDetail (role=prorector)
  /pro-rector/alerts       → ProRectorAlerts

/coordinator               → DesktopShell
  /coordinator/new         → CoordinatorForm
  /coordinator/tasks       → CoordinatorTasks
  /coordinator/tasks/:id   → TaskDetail (role=coordinator)

/director                  → DesktopShell
  /director/queue          → DirectorQueue
  /director/tasks/:id      → TaskDetail (role=director)

/task/:id                  → ICTTaskPage (no shell, direct landing from email link)
```

## Role Behaviors

### Pro Rector (PWA, mobile-first)
- Bottom tab bar: Dashboard | Tasks | Alerts
- Dashboard: 4 summary cards (active, overdue, pending approval, man-days saved), status distribution bar, escalated tasks section (red), active task list
- Task detail: read-only except 3 quick actions (Kill, Change Priority, Push Deadline) - each requires exactly 1 tap + mandatory reason
- Chat thread: read-only
- Alerts: notification list with unread badges

### Academic Coordinator (desktop)
- Primary view: New Task submission form
- Form fields (ALL mandatory):
  - Task Title (text, max 200 chars)
  - Request Type (dropdown: New Development / Enhancement / Bug Fix / Policy Change)
  - Description (rich text)
  - Affected Process (text)
  - Expected Outcome (rich text)
  - Acceptance Criteria (dynamic checklist builder - add/remove items)
  - Expected Completion Date (date picker)
  - Tolerance in days (number, default 7)
  - Priority (dropdown: Critical / High / Medium / Low)
  - ICT Resource Person (dropdown, single select)
  - Pre-Automation Effort (number + unit: days/hours)
  - Post-Automation Effort (number + unit: days/hours)
  - Policy Reference (text, optional except for Policy Change type)
- Document Checklist (GATE - blocks submission):
  - Requirements Document (mandatory always)
  - Policy Document (mandatory for Policy Change type, optional otherwise)
- Submit button disabled until requirements doc uploaded
- Task detail: can Accept/Reject deliverables when status = Deployed
- Chat: full read/write

### Director ACAD (desktop)
- Primary view: Approval queue
- Inline Approve/Reject on pending tasks
- Task detail: can give final approval when status = Coordinator Accepted
- Can change priority on any task
- Chat: full read/write

### ICT (email deep link landing)
- Arrives at /task/:id directly from email
- No navigation shell, minimal chrome
- Task detail with: status dropdown, ICT estimated date field, blocker flag
- Chat: full read/write
- Single "Save Update" action

## Component Specifications

### TaskCard
- Shows: ID, title, priority dot, status badge, ICT resource, expected date, comment count
- Overdue tasks show red text with days overdue
- Escalated tasks (3+ rejections) show red border + badge
- Clickable → navigates to TaskDetail

### TaskDetail (role-aware)
- Header: back button, task ID, status badge
- Priority + type tags
- Info grid: coordinator, ICT, dates, rejections, last activity
- Impact estimate card (green): before → after automation
- Document list with status (Not Uploaded / Uploaded / Approved)
- Acceptance criteria checklist with checkmarks
- Chat thread button with message count
- Audit log (timestamped history)
- Action buttons vary by role (see Role Behaviors above)

### ChatThread
- WhatsApp-style bubbles
- ICT messages right-aligned (ceramic blue), others left (white)
- Author name + role label above each bubble
- Timestamp below
- Input bar at bottom: attachment icon + text input + send button
- Pro Rector sees "Read-only view" bar instead of input

### BottomTabBar (Pro Rector only)
- Fixed bottom, 3 tabs with icons
- Active tab: ceramic blue color
- Alerts tab: red badge with unread count

## Status Flow Reference
```
Draft → Pending Approval → Approved - Awaiting ICT → Accepted by ICT
→ In Analysis → In Development → In Testing → Deployed
→ Coordinator Accepted → Accepted - Closed

Branches:
- Pending Approval → [Director Rejects] → Draft
- Approved - Awaiting ICT → [ICT Rejects] → Draft
- Deployed → [Coordinator Rejects] → Rework → In Development → ...
- Coordinator Accepted → [Director Rejects] → Rework → In Development → ...
- 3rd rejection → auto-escalation badge on Pro Rector dashboard
- Any → Paused (reason mandatory)
- Any → Killed (by Director/Pro Rector, reason mandatory)
```

## Status Colors
```js
Draft:                    bg #F3F4F6, text #6B7280
Pending Approval:         bg #FEF3C7, text #92400E
Approved - Awaiting ICT:  bg #DBEAFE, text #1E40AF
Accepted by ICT:          bg #E0E7FF, text #3730A3
In Analysis:              bg #EDE9FE, text #5B21B6
In Development:           bg #CFFAFE, text #155E75
In Testing:               bg #FEE2E2, text #991B1B
Deployed:                 bg #D1FAE5, text #065F46
Coordinator Accepted:     bg #BBF7D0, text #166534
Accepted - Closed:        bg #ECFDF5, text #059669
Rework:                   bg #FEE2E2, text #DC2626
Paused:                   bg #FEF9C3, text #854D0E
Killed:                   bg #1F2937, text #F9FAFB
```

## Priority Colors
```
Critical: #DC2626
High:     #E87722
Medium:   #D97706
Low:      #059669
```

## Alert Rules (for notification logic)
| Trigger | Recipients | Channel |
|---------|-----------|---------|
| Task submitted for approval | Director ACAD | In-App |
| Task approved by Director | Coordinator (In-App), ICT (Email with deep link) | In-App + Email |
| Task rejected by Director | Coordinator | In-App |
| Task rejected by ICT | Coordinator | In-App + Email |
| ICT estimate > coordinator date + tolerance | Coordinator | In-App + Email |
| No activity > 3 days | ICT + Coordinator | In-App |
| No activity > 5 days (escalation) | Pro Rector | In-App + Email |
| Task overdue | Pro Rector, Director, Coordinator | In-App + Email |
| Deployed, awaiting sign-off | Coordinator | In-App |
| Coordinator accepted | Director | In-App |
| Rework (rejection) | ICT, Coordinator | In-App + Email |
| 3rd rejection (escalation) | Pro Rector | In-App + Email |
| Pro Rector action (kill/priority/deadline) | Coordinator, Director, ICT | In-App + Email |

## Implementation Notes
- Use React Context for role state (or mock auth)
- All dates in ISO format, display as locale strings
- Task IDs follow format AOT-XXX
- Mobile-first CSS for Pro Rector views, responsive for others
- Bottom tab bar fixed position, content area scrollable with bottom padding
- Pro Rector quick actions: tap button → inline expansion with reason field → confirm
- Document gate: submit button disabled + red helper text until mandatory docs uploaded
- Chat input disabled for Pro Rector (show "Read-only view" instead)
- Escalated tasks float to top of Pro Rector dashboard in a distinct red section
