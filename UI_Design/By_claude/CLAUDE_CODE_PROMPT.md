# Instructions for Claude Code

## What You Are Building
A React + Vite web application called "NUST Academic Operations Tracker". It tracks tasks between the Academic Directorate and ICT Department at a university.

## Reference Files in This Package
1. **README.md** - Full architecture, routing, component specs, role behaviors, status definitions. Read this first.
2. **src/REFERENCE_IMPLEMENTATION.jsx** - A working single-file React prototype. This is the visual/functional reference. Your job is to decompose it into proper project structure.
3. **src/constants/colors.js** - Brand color palette (NUST branding). Use these exact values.
4. **src/constants/statuses.js** - Status definitions, valid transitions, enums.
5. **src/constants/mockData.js** - Mock data with realistic NUST context. Use this for development.

## What To Do

### Step 1: Scaffold
```bash
npm create vite@latest nust-tracker -- --template react
cd nust-tracker
npm install react-router-dom
npm install -D tailwindcss @tailwindcss/vite
```

### Step 2: Build the component tree
Follow the structure in README.md. Decompose REFERENCE_IMPLEMENTATION.jsx into:
- Reusable components (StatusBadge, TaskCard, ChatThread, etc.)
- Role-specific views (ProRectorDashboard, CoordinatorForm, DirectorQueue, ICTTaskPage)
- Layout shells (MobileShell for Pro Rector, DesktopShell for others)
- App.jsx with React Router

### Step 3: Key behaviors to implement correctly
1. **Pro Rector quick actions**: Kill/Priority/Deadline each expand inline with mandatory reason field. Single tap + confirm. Do not use modals.
2. **Document gate**: Coordinator cannot submit task until Requirements Document is uploaded. Button stays disabled with red helper text.
3. **Sequential closure**: Deployed -> Coordinator accepts first -> then Director sees it for final approval. Not parallel.
4. **Chat thread**: WhatsApp-style. ICT messages right-aligned (ceramic blue). Others left (white). Pro Rector is read-only.
5. **ICT landing**: /task/:id route has no navigation shell. ICT arrives via email link, sees the task directly, updates status, leaves.
6. **Escalation badge**: Tasks with 3+ rejections show red "ESCALATED" badge and float to top of Pro Rector dashboard in a separate attention section.
7. **Bottom tab bar**: Pro Rector only. Fixed bottom. Bell icon shows unread count badge.

### Step 4: Styling
- Use Tailwind CSS utility classes
- Follow NUST brand colors from colors.js
- Mobile-first for Pro Rector views (max-width 420px frame)
- Desktop-responsive for Coordinator and Director views
- Font: Georgia for headings, system sans-serif for body
- No component libraries (no MUI, no Ant Design, no shadcn)

### Step 5: What NOT to build yet
- No backend, no API calls, no database
- No authentication (use a role switcher dropdown for demo)
- No actual file upload (mock the upload states)
- No email sending
- No PWA service worker (structure for it but do not implement)

## Quality Checks
- Every task card must be clickable and navigate to task detail
- Every status badge must use the correct color from STATUS_COLORS
- Every priority must show the correct colored dot
- The coordinator form must block submission without the required document
- The Pro Rector dashboard must show: 4 summary cards, status bar, escalated section, task list
- The chat thread must be accessible from task detail for all roles
- Audit log must show inside every task detail view
