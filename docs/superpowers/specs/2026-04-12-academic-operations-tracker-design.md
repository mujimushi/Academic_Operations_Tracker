# Academic Operations Tracker — Technical Design Specification

**Version:** 1.0
**Date:** 2026-04-12
**Status:** Approved
**Source SRS:** `docs/SRS_Academic_Operations_Tracker_v1.docx`
**UI Reference:** `UI_Design/By_claude/` (definitive visual reference, port 1:1)

---

## 1. System Overview

A web-based task tracking system with mobile-first PWA for the Pro Rector and Director ACAD. Formalizes the workflow between the Academic Directorate and multiple development teams at NUST for requirement gathering, approval, tracking, and communication.

**Architecture:** Next.js 14+ full-stack monolith (Approach A). Single codebase, single deployment. API Routes for backend, React Server Components + Client Components for frontend, Prisma ORM for MySQL, NextAuth.js for Microsoft 365 SSO.

**Hosting:** On-premises.

---

## 2. User Roles

| Role | Description | Dashboard | PWA |
|---|---|---|---|
| **System Admin** | Manages SMTP, users, teams, system config. No involvement in tasks. | Admin panel | No |
| **Pro Rector** | Executive oversight. Read-only dashboard with 3 override actions. | Full dashboard + analytics | Yes |
| **Director ACAD** | Single person. Approves/rejects tasks. Final sign-off on deliverables. Changes priority. | Full dashboard + approval queue | Yes |
| **Academic Coordinator** | Multiple people. Creates tasks, owns them. First-gate acceptance of deliverables. Sees only own tasks. | Own tasks only | No |
| **Team Resource** | One designated person per registered dev team. Receives approved tasks, updates status, delivers. Arrives via email deep link. | Assigned tasks only | No |

### Role Permissions

| Role | Create | Approve | Update Status | Chat | Dashboard | Override |
|---|---|---|---|---|---|---|
| Admin | No | No | No | No | Admin panel | System config |
| Pro Rector | No | No | No | View-only | All tasks + analytics | Kill, change priority, push deadline |
| Director ACAD | No | Approve/reject tasks + final deliverable | No | Read/write | All tasks + analytics + approval queue | Change priority |
| Coordinator | Yes | Accept/reject deliverable (first gate) | No | Read/write | Own tasks | Kill own task (conditions apply) |
| Team Resource | No | No | Yes (status, effort, blockers) | Read/write | Assigned tasks | No |

---

## 3. Project Structure

```
academic-operations-tracker/
├── prisma/
│   └── schema.prisma
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── app/
│   │   ├── layout.tsx                        # Root layout (auth, SSE provider)
│   │   ├── page.tsx                          # "/" redirect based on role
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts   # Microsoft 365 SSO
│   │   │   ├── tasks/route.ts                # CRUD tasks
│   │   │   ├── tasks/[id]/route.ts           # Single task ops
│   │   │   ├── tasks/[id]/status/route.ts    # Status transitions
│   │   │   ├── tasks/[id]/chat/route.ts      # Chat messages
│   │   │   ├── tasks/[id]/documents/route.ts # File upload/download
│   │   │   ├── notifications/route.ts        # Notification list
│   │   │   ├── notifications/sse/route.ts    # SSE real-time stream
│   │   │   ├── notifications/register-device/route.ts # FCM token
│   │   │   ├── admin/smtp/route.ts           # SMTP config
│   │   │   ├── admin/teams/route.ts          # Team CRUD
│   │   │   ├── admin/users/route.ts          # User management
│   │   │   └── cron/
│   │   │       ├── check-inactivity/route.ts
│   │   │       ├── check-overdue/route.ts
│   │   │       ├── check-stale-paused/route.ts
│   │   │       └── check-stale-drafts/route.ts
│   │   ├── (pro-rector)/                     # Route group — MobileShell
│   │   │   ├── layout.tsx                    # Bottom tab bar (3 tabs)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── tasks/page.tsx
│   │   │   ├── tasks/[id]/page.tsx
│   │   │   └── alerts/page.tsx
│   │   ├── (coordinator)/                    # Route group — DesktopShell
│   │   │   ├── layout.tsx                    # Sidebar nav
│   │   │   ├── new/page.tsx                  # Task submission form
│   │   │   ├── tasks/page.tsx
│   │   │   └── tasks/[id]/page.tsx
│   │   ├── (director)/                       # Route group — MobileShell (responsive)
│   │   │   ├── layout.tsx                    # Bottom tabs on mobile, sidebar on desktop
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── queue/page.tsx
│   │   │   ├── tasks/page.tsx
│   │   │   └── tasks/[id]/page.tsx
│   │   ├── (admin)/                          # Route group — DesktopShell
│   │   │   ├── layout.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── teams/page.tsx
│   │   │   └── settings/page.tsx             # SMTP, defaults, system config
│   │   └── task/[id]/page.tsx                # Team deep-link landing (no shell)
│   ├── components/                           # Ported from UI_Design/By_claude/
│   │   ├── StatusBadge.tsx
│   │   ├── PriorityDot.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskDetail.tsx
│   │   ├── ChatThread.tsx
│   │   ├── DocumentChecklist.tsx
│   │   ├── AcceptanceCriteria.tsx
│   │   ├── AuditLog.tsx
│   │   ├── BottomTabBar.tsx
│   │   └── NotificationItem.tsx
│   ├── lib/
│   │   ├── auth.ts                           # NextAuth config
│   │   ├── prisma.ts                         # Prisma client singleton
│   │   ├── sse.ts                            # SSE connection manager
│   │   ├── email.ts                          # SMTP mailer (reads config from DB)
│   │   ├── firebase.ts                       # FCM push notifications
│   │   ├── upload.ts                         # File storage to local filesystem
│   │   ├── transitions.ts                    # Status transition validation
│   │   └── notify.ts                         # Notification dispatcher
│   └── constants/
│       ├── colors.ts                         # NUST brand colors
│       └── statuses.ts                       # Status definitions + transitions
├── uploads/                                  # Default file storage (configurable)
├── .env.local
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

### UI Design Mapping

| Existing UI file | Next.js equivalent |
|---|---|
| `MobileShell.jsx` | `(pro-rector)/layout.tsx`, `(director)/layout.tsx` |
| `DesktopShell.jsx` | `(coordinator)/layout.tsx`, `(admin)/layout.tsx` |
| `ProRectorDashboard.jsx` | `(pro-rector)/dashboard/page.tsx` |
| `ProRectorTasks.jsx` | `(pro-rector)/tasks/page.tsx` |
| `ProRectorAlerts.jsx` | `(pro-rector)/alerts/page.tsx` |
| `CoordinatorForm.jsx` | `(coordinator)/new/page.tsx` |
| `CoordinatorTasks.jsx` | `(coordinator)/tasks/page.tsx` |
| `DirectorQueue.jsx` | `(director)/queue/page.tsx` |
| `ICTTaskPage.jsx` | `task/[id]/page.tsx` |
| All shared components | `components/` directory (same names, TypeScript added) |

### Routing

```
/                              → redirect based on role
/pro-rector/dashboard          → ProRectorDashboard (PWA start_url)
/pro-rector/tasks              → ProRectorTasks
/pro-rector/tasks/:id          → TaskDetail (role=prorector)
/pro-rector/alerts             → ProRectorAlerts

/coordinator/new               → CoordinatorForm
/coordinator/tasks             → CoordinatorTasks
/coordinator/tasks/:id         → TaskDetail (role=coordinator)

/director/dashboard            → DirectorDashboard (PWA start_url)
/director/queue                → DirectorQueue
/director/tasks                → DirectorTasks
/director/tasks/:id            → TaskDetail (role=director)

/admin/users                   → UserManagement
/admin/teams                   → TeamManagement
/admin/settings                → SystemSettings (SMTP, defaults)

/task/:id                      → TeamTaskPage (deep link, no shell, SSO required)
```

### Role-Based Redirects from `/`

| Role | Redirects to |
|---|---|
| Pro Rector | `/pro-rector/dashboard` |
| Director ACAD | `/director/dashboard` |
| Coordinator | `/coordinator/tasks` |
| Team Resource | No redirect — arrives via email deep link only |
| Admin | `/admin/users` |

---

## 4. Database Schema

### Enums

```
Role:           ADMIN | PRO_RECTOR | DIRECTOR | COORDINATOR | TEAM_RESOURCE
TaskStatus:     DRAFT | PENDING_APPROVAL | APPROVED_AWAITING_TEAM | ACCEPTED_BY_TEAM |
                IN_ANALYSIS | IN_DEVELOPMENT | IN_TESTING | DEPLOYED |
                COORDINATOR_ACCEPTED | ACCEPTED_CLOSED |
                REWORK | REJECTED_BY_TEAM | PAUSED | KILLED
RequestType:    NEW_DEVELOPMENT | ENHANCEMENT | BUG_FIX | POLICY_CHANGE
Priority:       CRITICAL | HIGH | MEDIUM | LOW
DocType:        REQUIREMENTS | POLICY | CHAT_ATTACHMENT
DocStatus:      UPLOADED | APPROVED
EffortUnit:     HOURS | DAYS
NotifSeverity:  NORMAL | HIGH | CRITICAL
NotifChannel:   IN_APP | EMAIL | PUSH
```

### Tables

#### User
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| msId | String (nullable) | Microsoft 365 object ID. Null until first SSO login. |
| email | String (unique) | Microsoft 365 email. Set by Admin at registration. |
| name | String | Display name |
| role | Role enum | |
| isActive | Boolean | Default true. Deactivated users can't log in. |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### Team
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | String (unique) | e.g., "ICT Web Team", "ERP Team" |
| resourceId | UUID FK → User | The designated resource person |
| isActive | Boolean | Default true |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### Task
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| code | String (unique) | Auto-generated: AOT-001, AOT-002, etc. |
| title | String | Max 200 characters |
| type | RequestType enum | |
| status | TaskStatus enum | Default DRAFT |
| priority | Priority enum | |
| description | Text | Rich text (stored as HTML) |
| affectedProcess | String | |
| expectedOutcome | Text | Rich text |
| expectedDate | Date | Set by Coordinator |
| tolerance | Int | Days. Default 7. |
| ictEstimatedDate | Date (nullable) | Set by Team when accepting |
| preEffort | Decimal (nullable) | Pre-automation effort value |
| preUnit | EffortUnit (nullable) | HOURS or DAYS |
| postEffort | Decimal (nullable) | Post-automation effort value |
| postUnit | EffortUnit (nullable) | HOURS or DAYS |
| policyRef | String (nullable) | Policy number/name |
| rejectionCount | Int | Default 0. Tracks post-deployment rejections. |
| pauseReason | String (nullable) | Free text, set when pausing |
| pauseResumeDate | Date (nullable) | Mandatory when pausing |
| pausedFromStatus | TaskStatus (nullable) | Status before pause. Used to restore on unpause. |
| coordinatorId | UUID FK → User | Task creator. Only this user does first-gate acceptance. |
| teamId | UUID FK → Team | Assigned dev team |
| createdAt | DateTime | |
| updatedAt | DateTime | Updated on any activity (status change, chat, doc upload) |

#### AcceptanceCriterion
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| taskId | UUID FK → Task | |
| description | String | |
| isComplete | Boolean | Default false |
| completedAt | DateTime (nullable) | |
| sortOrder | Int | Display order |

#### Document
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| taskId | UUID FK → Task | |
| type | DocType enum | REQUIREMENTS, POLICY, or CHAT_ATTACHMENT |
| filename | String | Original filename for display |
| path | String | Filesystem path |
| size | Int | Bytes |
| uploadedById | UUID FK → User | |
| status | DocStatus enum | Default UPLOADED |
| createdAt | DateTime | |

#### ChatMessage
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| taskId | UUID FK → Task | |
| authorId | UUID FK → User | |
| content | Text | Message text |
| attachmentId | UUID FK → Document (nullable) | If message has a file attachment |
| createdAt | DateTime | |

#### AuditLog
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| taskId | UUID FK → Task | |
| userId | UUID FK → User | Who performed the action |
| action | String | e.g., "status_change", "priority_change", "deadline_push", "kill", "pause", "acknowledge_notification" |
| fromStatus | TaskStatus (nullable) | Previous status (for status changes) |
| toStatus | TaskStatus (nullable) | New status |
| reason | String (nullable) | Mandatory for rejects, kills, pauses, Pro Rector actions |
| metadata | JSON (nullable) | Additional context (e.g., old priority, new priority, old deadline, new deadline) |
| createdAt | DateTime | Immutable. No update/delete exposed. |

#### Notification
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID FK → User | Recipient |
| taskId | UUID FK → Task (nullable) | Related task |
| type | String | e.g., "TASK_SUBMITTED", "INACTIVITY_WARNING", "ESCALATION", "OVERDUE" |
| message | String | Human-readable notification text |
| severity | NotifSeverity enum | NORMAL, HIGH, CRITICAL |
| channel | NotifChannel enum | IN_APP, EMAIL, PUSH |
| isRead | Boolean | Default false. Set when user opens/clicks the notification. Passive. |
| isSeen | Boolean | Default false. Set when user explicitly acknowledges. Active. Used by escalation ladder. |
| seenAt | DateTime (nullable) | Timestamp of acknowledgment |
| emailSent | Boolean | Default false. Prevents double-send. |
| pushSent | Boolean | Default false. Prevents double-send. |
| escalationLevel | Int (nullable) | 1 = Coordinator, 2 = Director, 3 = Pro Rector. For inactivity escalations only. |
| createdAt | DateTime | |

#### DeviceToken
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID FK → User | |
| token | String | FCM registration token |
| device | String | "Android Chrome", "iOS Safari", etc. |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### SystemConfig
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| key | String (unique) | e.g., "smtp_host", "smtp_port", "smtp_user", "smtp_password", "upload_path", "fcm_key", "default_tolerance" |
| value | Text | Encrypted for sensitive values (smtp_password, fcm_key) |
| updatedById | UUID FK → User | Last person who changed it |
| updatedAt | DateTime | |

---

## 5. Authentication & Authorization

### Authentication Flow

1. User visits the app → NextAuth.js checks session cookie
2. No session → redirect to Microsoft 365 login (Azure AD OAuth2)
3. Microsoft returns `oid` (object ID) + email + name
4. NextAuth matches `oid` against `User.msId` in database
5. If matched and `isActive = true` → session created, redirect to role-based home
6. If first login (User exists by email but `msId` is null) → capture `oid`, save to `User.msId`, create session
7. If no matching user → "Access denied — contact your System Admin" screen
8. No self-registration. Admin pre-registers users with email + role.

### Authorization Middleware

Single Next.js middleware on every request:

| Route pattern | Allowed roles |
|---|---|
| `(pro-rector)/*` | PRO_RECTOR |
| `(coordinator)/*` | COORDINATOR |
| `(director)/*` | DIRECTOR |
| `(admin)/*` | ADMIN |
| `task/[id]` | TEAM_RESOURCE (only if task.teamId matches user's team) |
| `/api/tasks` GET | All authenticated roles (filtered by role in handler) |
| `/api/tasks` POST | COORDINATOR |
| `/api/tasks/[id]/status` PATCH | TEAM_RESOURCE, COORDINATOR, DIRECTOR (action-dependent) |
| `/api/admin/*` | ADMIN |
| `/api/cron/*` | Cron secret header (not role-based) |

### Team Deep Link Auth Flow

1. Task approved → email sent to team's resource person with link `https://domain/task/AOT-015`
2. Resource person clicks link
3. NextAuth middleware: no session → redirect to Microsoft 365 login (callback URL stored)
4. User authenticates → session created → role confirmed as TEAM_RESOURCE
5. Redirect back to `/task/AOT-015`
6. Middleware checks: user's team matches task.teamId → page loads
7. If team doesn't match → access denied

### Session

- HTTP-only secure cookie (NextAuth.js default)
- Contains: userId, role, teamId (if TEAM_RESOURCE)
- HTTPS enforced for all traffic

---

## 6. Task Lifecycle

### Status Transitions

```
Draft → Pending Approval → Approved - Awaiting Team → Accepted by Team
→ In Analysis → In Development → In Testing → Deployed
→ Coordinator Accepted → Accepted - Closed

Branches:
- Pending Approval → [Director Rejects] → Draft (with comments)
- Approved - Awaiting Team → [Team Rejects] → Draft (with comments)
- Deployed → [Coordinator Rejects] → Rework → In Development → In Testing → Deployed
- Coordinator Accepted → [Director Rejects] → Rework → In Development → In Testing → Deployed
- 3rd rejection → auto-escalation to Pro Rector
- Any active state → Paused (reason + resume date mandatory)
- Draft (no prior activity) → Killed (by Coordinator, no notification)
- Draft (was previously in workflow) → Killed (by Coordinator, Director notified)
- Rejected by Team → Killed (by Coordinator, Director notified)
- Any active state → Killed (by Director ACAD or Pro Rector, reason mandatory)
```

### Valid Transitions Table

| From Status | Valid Next Statuses | Who Can Trigger |
|---|---|---|
| Draft | Pending Approval, Killed | Coordinator |
| Pending Approval | Approved - Awaiting Team, Draft (reject), Killed | Director |
| Approved - Awaiting Team | Accepted by Team, Rejected by Team, Paused, Killed | Team / Director / Pro Rector |
| Accepted by Team | In Analysis, Paused, Killed | Team / Director / Pro Rector |
| In Analysis | In Development, Paused, Killed | Team / Director / Pro Rector |
| In Development | In Testing, Paused, Killed | Team / Director / Pro Rector |
| In Testing | Deployed, In Development, Paused, Killed | Team / Director / Pro Rector |
| Deployed | Coordinator Accepted, Rework, Paused, Killed | Coordinator / Director / Pro Rector |
| Coordinator Accepted | Accepted - Closed, Rework, Killed | Director / Pro Rector |
| Rework | In Development, Paused, Killed | Team / Director / Pro Rector |
| Rejected by Team | Draft, Killed | Coordinator |
| Paused | (returns to `pausedFromStatus`), Killed | Whoever paused it (via AuditLog) / Director / Pro Rector |
| Accepted - Closed | (terminal) | — |
| Killed | (terminal) | — |

### Coordinator Kill Rules

| Task state | Has prior workflow activity? | Can Coordinator kill? | Director notified? |
|---|---|---|---|
| Draft, never submitted | No (audit log only has Draft creation) | Yes | No |
| Draft, previously submitted and rejected back | Yes | Yes | Yes |
| Rejected by Team | Yes | Yes | Yes |
| Any other active status | — | No (only Director / Pro Rector can) | — |

Determination: check AuditLog for any status change beyond Draft creation. If any exists, the task has been in the workflow.

### ICT Estimated Date Tolerance

When a team resource accepts a task and enters their estimated completion date:
- System compares against Coordinator's `expectedDate + tolerance` (default 7 days)
- If team estimate exceeds this → auto-alert to Coordinator for renegotiation
- Both dates visible on the task card at all times

### Rejection Counter

- `rejectionCount` increments each time a deliverable is rejected after deployment (by Coordinator or Director)
- Counter is visible on the task card
- At 3+ rejections: auto-escalation to Pro Rector (in-app + email + push) and Director (email)
- Task flagged as "Escalated" with visual badge on Pro Rector and Director dashboards

### Pause Behavior

When any authorized user pauses a task:
- **Reason**: free text input (mandatory)
- **Expected resume date**: date picker (mandatory)
- System records `pausedFromStatus` (the status the task was in before pausing)
- All three fields stored on the Task record (`pauseReason`, `pauseResumeDate`, `pausedFromStatus`)
- On unpause: task returns to `pausedFromStatus`. All three fields cleared.
- Who paused it is determined from the AuditLog (last status_change to PAUSED)

---

## 7. Task Submission Form

The Coordinator creates tasks through a structured form. All fields mandatory unless noted.

### Fields

| Field | Type | Rules |
|---|---|---|
| Task Title | Text input | Max 200 characters |
| Request Type | Dropdown | New Development / Enhancement / Bug Fix / Policy Change |
| Description | Rich text editor | Detailed description |
| Affected Process | Text input | Which academic process is affected |
| Expected Outcome | Rich text editor | Acceptance criteria narrative |
| Acceptance Criteria | Checklist builder | Add/remove measurable criteria items |
| Expected Completion Date | Date picker | |
| Tolerance | Number input | Days, default 7 |
| Team | Dropdown | List of active teams from Team table |
| Priority | Dropdown | Critical / High / Medium / Low |
| Pre-Automation Effort | Number + unit dropdown | Value + HOURS/DAYS |
| Post-Automation Effort | Number + unit dropdown | Value + HOURS/DAYS |
| Policy Reference | Text input | Optional (mandatory if type = Policy Change) |

### Document Checklist (Gate)

Task cannot be submitted (moved to Pending Approval) until:
- **Requirements Document**: uploaded (mandatory for all types)
- **Policy Document**: uploaded (mandatory if type = Policy Change, optional otherwise)

Submit button stays disabled with helper text until mandatory documents are attached.

Each document slot shows status: Not Uploaded / Uploaded / Approved by Director.

---

## 8. Notifications & Alerts

### Channels

| Channel | Mechanism | Use case |
|---|---|---|
| In-App | Notification bell + SSE real-time | All alerts |
| Email | SMTP (config from Admin panel) with deep links | High/Critical severity |
| Push | Firebase Cloud Messaging | Critical alerts to Pro Rector and Director |

### Notification Flow

1. Trigger event occurs (status change, inactivity detected, etc.)
2. `notify()` function determines recipients, severity, channels from alert rules
3. For each recipient:
   - Always: create `Notification` row in DB
   - Always: push via SSE stream (instant if user is online)
   - If severity = High/Critical: send email via SMTP with deep link
   - If recipient = Pro Rector or Director + severity = Critical: send FCM push

### Alert Rules

| Trigger | Recipients | Severity |
|---|---|---|
| Task submitted for approval | Director ACAD | Normal |
| Task approved by Director | Coordinator (in-app), Team resource (email with deep link) | Normal |
| Task rejected by Director | Coordinator | Normal |
| Task rejected by Team | Coordinator | High |
| Team estimate exceeds coordinator date + tolerance | Coordinator | High |
| Inactivity Day 3 (escalation level 1) | Coordinator | Normal |
| Inactivity Day 5 + Coordinator hasn't acknowledged (level 2) | Director | High |
| Inactivity Day 10 + Director hasn't acknowledged (level 3) | Pro Rector | Critical |
| Task overdue (past expected completion date) | Pro Rector, Director, Coordinator | High |
| Task deployed, awaiting sign-off | Coordinator | Normal |
| Coordinator accepted, awaiting Director final approval | Director | Normal |
| Rework (rejection after deployment) | Team resource, Coordinator | High |
| 3rd rejection auto-escalation | Pro Rector (in-app + email + push), Director (email) | Critical |
| Pro Rector action (kill/priority/deadline) | Coordinator, Director, Team resource | High |
| Task paused | Pro Rector, Director | Normal |
| Coordinator kills task (with prior activity) | Director | Normal |
| Stale pause (past resume date) — see cron section | Escalation ladder | High |

### Inactivity Escalation Ladder

Cascading escalation based on task inactivity AND notification acknowledgment:

| Condition | Recipient | Escalation Level |
|---|---|---|
| No activity for 3 days | Coordinator | 1 |
| No activity for 5 days + Coordinator hasn't acknowledged (isSeen = false on level 1) | Director | 2 |
| No activity for 10 days + Director hasn't acknowledged (isSeen = false on level 2) | Pro Rector | 3 |

If Coordinator acknowledges (isSeen = true) on level 1, escalation to Director does NOT fire.
If Director acknowledges on level 2, escalation to Pro Rector does NOT fire.

Acknowledgment is an explicit "Acknowledge" button on the notification — distinct from just reading it.

### isRead vs isSeen

- **isRead**: user opened/viewed the notification. Automatic on click. Passive.
- **isSeen**: user explicitly tapped "Acknowledge" button. Active. Stops escalation.

### Pro Rector Escalation Resolution

Pro Rector seeing/acknowledging an escalated notification does NOT restart the inactivity timer. The timer is based on `task.updatedAt` (actual task activity). The Pro Rector must take an action:

| Action | Restarts timer? |
|---|---|
| Kill task | Task is terminal. No more checks. |
| Push deadline | Yes — logged as activity, updatedAt refreshes |
| Change priority | Yes — logged as activity, updatedAt refreshes |
| Post directive in chat | Yes — logged as activity, updatedAt refreshes |

If no action is taken and 3 more days pass, the escalation ladder fires again from level 1.

### Email Format

All emails to team resource persons contain:
- Subject: task code + title + action summary
- Body: brief description of the event, who triggered it, any comments
- Prominent "View Task" button linking to `https://domain/task/AOT-XXX`
- Plain text fallback

---

## 9. Real-Time (SSE)

### Architecture

```
Browser (each logged-in user)
    │
    │  GET /api/notifications/sse (authenticated, long-lived)
    │
    ▼
SSE Manager (in-memory Map<userId, Response[]>)
    │
    │  notify(userId, payload) — called from any API handler
    │
    ▼
Pushes event to all active connections for that user
```

- One user can have multiple tabs → multiple connections stored per userId
- On disconnect, connection removed from map
- Browser `EventSource` auto-reconnects on disconnect
- Single Next.js process → in-memory map works for on-prem single instance

---

## 10. File Storage

### Filesystem Structure

```
{configurable_upload_path}/
├── tasks/
│   ├── AOT-001/
│   │   ├── documents/
│   │   │   ├── requirements_1744123456.pdf
│   │   │   └── policy_1744123500.docx
│   │   └── chat/
│   │       ├── screenshot_1744200000.png
│   │       └── revised_spec_1744200100.pdf
│   ├── AOT-002/
│   │   └── ...
```

### Behavior

- Upload path configurable by Admin in settings panel (default: `./uploads`)
- Files organized by task code, then by type (`documents/` vs `chat/`)
- Filenames: `{type}_{timestamp}.{ext}`. Original filename preserved in Document DB record.
- Upload: multipart form data to `/api/tasks/[id]/documents`
- Download/view: `/api/tasks/[id]/documents/[docId]` streams file from disk after auth check
- PDFs and images viewable inline; other types trigger download

### Limits

- 25 MB per file
- 200 MB total per task (documents + chat attachments combined)
- Validated server-side on every upload

### Document Gate

- Requirements Document: mandatory for all task types
- Policy Document: mandatory if request type = Policy Change, optional otherwise
- Submit button disabled + red helper text until mandatory docs uploaded
- Director can mark documents as "Approved" (`Document.status = APPROVED`)

---

## 11. Cron Jobs

### Schedule

| Job | API Route | Schedule | Day |
|---|---|---|---|
| Inactivity checker | `/api/cron/check-inactivity` | 1:00 PM and 5:00 PM | Mon–Sat |
| Overdue checker | `/api/cron/check-overdue` | 8:00 AM | Mon–Sat |
| Stale pause checker | `/api/cron/check-stale-paused` | 8:00 AM | Mon–Sat |
| Stale draft cleanup | `/api/cron/check-stale-drafts` | 8:00 AM | Monday only |

### Implementation

All cron jobs are Next.js API routes secured with a shared secret in the request header (`CRON_SECRET` env var). Called by Windows Task Scheduler on the on-prem server:

```
curl -H "Authorization: Bearer {CRON_SECRET}" https://localhost:3000/api/cron/check-inactivity
```

Admin panel displays last run time and result for each job (stored in SystemConfig).

### Inactivity Checker Logic

```
For each active task (status not in [DRAFT, PAUSED, ACCEPTED_CLOSED, KILLED]):
  daysInactive = today - task.updatedAt

  if daysInactive >= 3 AND no Level 1 notification exists for this task:
    → Create notification for Coordinator (escalationLevel = 1)

  if daysInactive >= 5 AND Level 1 exists AND isSeen = false:
    → Create notification for Director (escalationLevel = 2)

  if daysInactive >= 10 AND Level 2 exists AND isSeen = false:
    → Create notification for Pro Rector (escalationLevel = 3)
```

### Stale Pause Checker Logic

```
For each task with status = PAUSED:
  daysPastResume = today - task.pauseResumeDate

  if daysPastResume >= 1 AND no stale-pause notification exists for this task at level 1:
    → Notify whoever paused the task (lookup from AuditLog)

  if daysPastResume >= 3 AND no stale-pause notification exists at level 2:
    → Notify Director

  if daysPastResume >= 7 AND no stale-pause notification exists at level 3:
    → Notify Pro Rector
```

### Stale Draft Cleanup Logic

```
For each task with status = DRAFT:
  daysInactive = today - task.updatedAt

  if daysInactive >= 30:
    → Notify Coordinator: "Stale draft — complete or delete"

  if daysInactive >= 45:
    → Auto-kill with reason "Abandoned draft — auto-cleaned"
```

---

## 12. PWA Configuration

### Pro Rector PWA

- `manifest.json`: name "NUST Academic Operations Tracker", theme color `#003366`, `display: "standalone"`
- `start_url: "/pro-rector/dashboard"`
- Service worker caches app shell (HTML, CSS, JS, icons)
- Offline: app loads from cache, shows "You're offline — connect to view tasks" banner
- FCM: requests notification permission on load, registers device token

### Director ACAD PWA

- Same manifest configuration
- `start_url: "/director/dashboard"`
- Same offline shell behavior
- FCM: registers device token for Director-specific alerts

### Tabs

| Role | Tab 1 | Tab 2 | Tab 3 | Tab 4 |
|---|---|---|---|---|
| Pro Rector | Dashboard | Tasks | Alerts | — |
| Director | Dashboard | Queue | Tasks | Alerts |

### FCM Push Triggers

| Recipient | Push fires on |
|---|---|
| Pro Rector | Inactivity escalation (level 3), overdue tasks, 3rd rejection auto-escalation |
| Director | Task submitted for approval, Coordinator accepted awaiting final approval, 3rd rejection escalation, rework alerts |

---

## 13. Dashboard (Pro Rector & Director)

Both roles see the same dashboard layout with identical data visibility.

### Summary View (Top)

- **Total active tasks** with breakdown by status (horizontal stacked bar or donut chart)
- **Overdue tasks count** (red badge, tappable to filter)
- **Tasks awaiting approval** (amber badge, tappable — Director can action directly)
- **Completion rate** (percentage of tasks closed vs total in last 30/60/90 days, toggle)
- **Aggregate man-hours saved** across all completed tasks (pre minus post effort delta)

### Escalated Tasks Section

- Red-bordered section below summary
- Shows tasks with 3+ rejections
- "ESCALATED" badge on each task card
- Floats to top of dashboard for immediate visibility

### Task List

Filterable and sortable. Filters:
- Status (multi-select)
- Priority (multi-select)
- Request type
- Assigned team
- Coordinator
- Date range

Each task card shows: code, title, type, priority (color-coded dot), status badge, expected date, team estimated date, days overdue (red if applicable), team name, comment count.

### Differences Between Roles

| Feature | Pro Rector | Director |
|---|---|---|
| Quick actions on task | Kill, Change Priority, Push Deadline | Change Priority, Approve/Reject (from queue) |
| Chat thread | Read-only | Read/write |
| Approval queue tab | No | Yes |

---

## 14. NUST Branding

Ported from `UI_Design/By_claude/src/constants/colors.js`:

### Colors

| Token | Hex | Usage |
|---|---|---|
| NUST Blue | `#003366` | Primary, headers, nav, PWA theme |
| Ceramic Blue | `#0088B9` | Secondary, active tab, team chat bubbles |
| Orange | `#E87722` | Accent, high priority |
| Silver | `#C0C0C0` | Borders, dividers |
| Beige | `#F5F0E8` | Subtle backgrounds |
| Background | `#F7F8FA` | Page background |

### Typography

- Headings: Georgia / Calisto MT fallback
- Body: system sans-serif stack
- No external font loading

### Status Badge Colors

| Status | Background | Text |
|---|---|---|
| Draft | `#F3F4F6` | `#6B7280` |
| Pending Approval | `#FEF3C7` | `#92400E` |
| Approved - Awaiting Team | `#DBEAFE` | `#1E40AF` |
| Accepted by Team | `#E0E7FF` | `#3730A3` |
| In Analysis | `#EDE9FE` | `#5B21B6` |
| In Development | `#CFFAFE` | `#155E75` |
| In Testing | `#FEE2E2` | `#991B1B` |
| Deployed | `#D1FAE5` | `#065F46` |
| Coordinator Accepted | `#BBF7D0` | `#166534` |
| Accepted - Closed | `#ECFDF5` | `#059669` |
| Rework | `#FEE2E2` | `#DC2626` |
| Paused | `#FEF9C3` | `#854D0E` |
| Killed | `#1F2937` | `#F9FAFB` |

### Priority Colors

| Priority | Color |
|---|---|
| Critical | `#DC2626` |
| High | `#E87722` |
| Medium | `#D97706` |
| Low | `#059669` |

---

## 15. Impact Tracking

Each task carries two impact fields entered at creation:
- **Pre-Automation Effort**: current manual effort (number + HOURS/DAYS)
- **Post-Automation Effort**: expected effort after digitization (number + HOURS/DAYS)

Dashboard aggregates the delta (pre minus post) across all completed (Accepted - Closed) tasks. Displayed as total man-hours/man-days saved.

Fields are informational. Entered once at creation. Not updated post-completion in Phase 1.

---

## 16. Future Module Placeholders

Navigation includes disabled/greyed-out slots for:
- Policy Chatbot
- Student Query Dashboard
- Additional Academic Dashboards

These are visible from day one in the Pro Rector and Director navigation to signal the system's planned expansion. Clicking shows "Coming Soon" placeholder.

---

## 17. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Dashboard load | < 2 seconds on 4G mobile |
| Task form response | < 1 second on save |
| Notification delivery | < 30 seconds from trigger |
| Uptime | 99.5% during business hours (8 AM–6 PM, Mon–Sat) |
| Maintenance window | Sundays |
| Browser support | Chrome 90+, Edge 90+, Firefox 90+, Safari 15+ |
| PWA support | Android 10+ (Chrome), iOS 15+ (Safari, home screen install required for push) |
| Responsive | 360px (phone) to 1920px (desktop) |
| File limits | 25 MB per file, 200 MB per task |
| Backups | Daily automated, 30-day retention |
| Auth | Microsoft 365 SSO, HTTPS enforced, RBAC |
| Audit log | Immutable — no edit/delete by any role |

---

## 18. System Acceptance Criteria

1. A Coordinator can submit a fully documented task in under 10 minutes.
2. Director ACAD can review and approve/reject a task in under 2 minutes.
3. Pro Rector can view all active tasks, filter by any dimension, and take an action in under 3 taps.
4. Overdue alerts are delivered within 30 seconds of the trigger condition.
5. All task communication threads are persistent and visible to all permitted roles.
6. Dual sign-off closure workflow functions without manual workarounds.
7. Inactivity escalation ladder fires correctly with acknowledgment gating.
8. No task can reach a stale/invisible state (verified by deadlock analysis in this spec).
9. PWA installable and push notifications functional for Pro Rector and Director on Android and iOS.
10. Admin can configure SMTP, manage users, and manage teams without developer intervention.
