import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import {
  PrismaClient,
  Role,
  TaskStatus,
  RequestType,
  Priority,
  EffortUnit,
} from "../src/generated/prisma/client";

// Parse DATABASE_URL to extract connection params
// Expected format: mysql://user:password@host:port/database
function parseDatabaseUrl(url: string) {
  const match = url.match(
    /^mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)$/
  );
  if (!match) {
    throw new Error(`Invalid DATABASE_URL format: ${url}`);
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5],
  };
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const connParams = parseDatabaseUrl(dbUrl);
const adapter = new PrismaMariaDb(connParams);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Cleaning existing data...");

  // Delete in correct FK order (children before parents)
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.document.deleteMany();
  await prisma.acceptanceCriterion.deleteMany();
  await prisma.task.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating users...");

  // 1 Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@nust.edu.pk",
      name: "System Admin",
      role: Role.ADMIN,
    },
  });

  // 1 Pro Rector
  const proRector = await prisma.user.create({
    data: {
      email: "prorector@nust.edu.pk",
      name: "Prof. Dr. Rector",
      role: Role.PRO_RECTOR,
    },
  });

  // 1 Director
  const director = await prisma.user.create({
    data: {
      email: "director.acad@nust.edu.pk",
      name: "Director ACAD",
      role: Role.DIRECTOR,
    },
  });

  // 2 Coordinators
  const coordinator1 = await prisma.user.create({
    data: {
      email: "ahmed.coordinator@nust.edu.pk",
      name: "Asst. Prof. Ahmed",
      role: Role.COORDINATOR,
    },
  });

  const coordinator2 = await prisma.user.create({
    data: {
      email: "sana.coordinator@nust.edu.pk",
      name: "Dr. Sana",
      role: Role.COORDINATOR,
    },
  });

  // 3 Team Resources
  const farooq = await prisma.user.create({
    data: {
      email: "farooq@nust.edu.pk",
      name: "Engr. Farooq",
      role: Role.TEAM_RESOURCE,
    },
  });

  const ali = await prisma.user.create({
    data: {
      email: "ali@nust.edu.pk",
      name: "Engr. Ali",
      role: Role.TEAM_RESOURCE,
    },
  });

  const bilal = await prisma.user.create({
    data: {
      email: "bilal@nust.edu.pk",
      name: "Engr. Bilal",
      role: Role.TEAM_RESOURCE,
    },
  });

  console.log("Creating teams...");

  const webTeam = await prisma.team.create({
    data: {
      name: "ICT Web Team",
      resourceId: farooq.id,
    },
  });

  const erpTeam = await prisma.team.create({
    data: {
      name: "ICT ERP Team",
      resourceId: ali.id,
    },
  });

  const networkTeam = await prisma.team.create({
    data: {
      name: "Network & Infra Team",
      resourceId: bilal.id,
    },
  });

  console.log("Creating system config...");

  const configEntries = [
    { key: "smtp_host", value: "smtp.nust.edu.pk" },
    { key: "smtp_port", value: "587" },
    { key: "smtp_user", value: "noreply@nust.edu.pk" },
    { key: "smtp_password", value: "changeme" },
    { key: "smtp_from", value: "noreply@nust.edu.pk" },
    { key: "upload_path", value: "./uploads" },
    { key: "default_tolerance", value: "7" },
    { key: "fcm_project_id", value: "academic-tracker-nust" },
    { key: "fcm_client_email", value: "firebase-adminsdk@academic-tracker-nust.iam.gserviceaccount.com" },
    { key: "fcm_private_key", value: "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0Z3VS5JJcds3xHn/ygWep4cSMgMVzjRByOgOIHpbFZ2mkR\n-----END RSA PRIVATE KEY-----" },
  ];

  for (const entry of configEntries) {
    await prisma.systemConfig.create({
      data: {
        key: entry.key,
        value: entry.value,
        updatedById: admin.id,
      },
    });
  }

  console.log("Creating tasks...");

  // AOT-001
  const task1 = await prisma.task.create({
    data: {
      code: "AOT-001",
      title: "Automate School Data Collection Portal",
      type: RequestType.NEW_DEVELOPMENT,
      status: TaskStatus.IN_DEVELOPMENT,
      priority: Priority.CRITICAL,
      description:
        "Develop an automated portal for collecting and aggregating school-level data across all NUST constituent schools. The portal should support bulk data uploads, validation workflows, and real-time reporting dashboards.",
      affectedProcess: "School Data Management",
      expectedOutcome:
        "A fully automated portal reducing manual data entry by 90% and enabling real-time school performance tracking.",
      expectedDate: new Date("2026-04-20"),
      ictEstimatedDate: new Date("2026-04-28"),
      preEffort: 7,
      preUnit: EffortUnit.DAYS,
      postEffort: 1,
      postUnit: EffortUnit.DAYS,
      coordinatorId: coordinator1.id,
      teamId: webTeam.id,
    },
  });

  // AOT-002
  const task2 = await prisma.task.create({
    data: {
      code: "AOT-002",
      title: "Fee Structure Policy Update Module",
      type: RequestType.POLICY_CHANGE,
      status: TaskStatus.PENDING_APPROVAL,
      priority: Priority.HIGH,
      description:
        "Implement a module to manage and communicate fee structure changes as per the Board of Governors finance committee directives. The module must support version-controlled policy documents and automated notifications.",
      affectedProcess: "Fee Management",
      expectedOutcome:
        "Streamlined fee policy update process with full audit trail and automated notifications to relevant stakeholders.",
      expectedDate: new Date("2026-05-01"),
      policyRef: "BOG/FIN/2026-03",
      coordinatorId: coordinator2.id,
      teamId: erpTeam.id,
    },
  });

  // AOT-003
  const task3 = await prisma.task.create({
    data: {
      code: "AOT-003",
      title: "Exam Schedule Generator Bug Fix",
      type: RequestType.BUG_FIX,
      status: TaskStatus.REWORK,
      priority: Priority.HIGH,
      description:
        "Fix critical bugs in the exam schedule generator that cause incorrect room assignments and time slot conflicts for final examinations. Issue has been escalated due to repeated failures in testing.",
      affectedProcess: "Examination Scheduling",
      expectedOutcome:
        "Bug-free exam schedule generation with zero room conflicts and correct time slot assignments.",
      expectedDate: new Date("2026-04-05"),
      ictEstimatedDate: new Date("2026-04-10"),
      rejectionCount: 3,
      coordinatorId: coordinator1.id,
      teamId: networkTeam.id,
    },
  });

  // AOT-004
  const task4 = await prisma.task.create({
    data: {
      code: "AOT-004",
      title: "Student Transcript Automation",
      type: RequestType.NEW_DEVELOPMENT,
      status: TaskStatus.DEPLOYED,
      priority: Priority.MEDIUM,
      description:
        "Automate the generation and issuance of student transcripts with digital signatures and watermarks. Integration with the degree management system and automated email dispatch upon request approval.",
      affectedProcess: "Student Records Management",
      expectedOutcome:
        "Fully automated transcript generation reducing processing time from 5 days to under 2 hours.",
      expectedDate: new Date("2026-03-30"),
      ictEstimatedDate: new Date("2026-03-28"),
      preEffort: 5,
      preUnit: EffortUnit.DAYS,
      postEffort: 0.5,
      postUnit: EffortUnit.DAYS,
      coordinatorId: coordinator2.id,
      teamId: webTeam.id,
    },
  });

  // AOT-005
  const task5 = await prisma.task.create({
    data: {
      code: "AOT-005",
      title: "Faculty Workload Dashboard Enhancement",
      type: RequestType.ENHANCEMENT,
      status: TaskStatus.IN_ANALYSIS,
      priority: Priority.MEDIUM,
      description:
        "Enhance the existing faculty workload dashboard to include semester-wise comparisons, overload detection alerts, and exportable reports in PDF/Excel formats for departmental heads.",
      affectedProcess: "Faculty Management",
      expectedOutcome:
        "Enhanced dashboard with comprehensive workload analytics enabling proactive management of faculty teaching loads.",
      expectedDate: new Date("2026-05-15"),
      ictEstimatedDate: new Date("2026-05-20"),
      preEffort: 2,
      preUnit: EffortUnit.DAYS,
      postEffort: 0.25,
      postUnit: EffortUnit.DAYS,
      coordinatorId: coordinator1.id,
      teamId: erpTeam.id,
    },
  });

  console.log("Creating acceptance criteria for AOT-001...");

  await prisma.acceptanceCriterion.createMany({
    data: [
      {
        taskId: task1.id,
        description: "Portal supports bulk CSV upload for school data with field-level validation and error reporting",
        isComplete: true,
        completedAt: new Date("2026-04-10T09:30:00Z"),
        sortOrder: 1,
      },
      {
        taskId: task1.id,
        description: "Real-time dashboard shows aggregated school data with drill-down capability per school",
        isComplete: false,
        sortOrder: 2,
      },
      {
        taskId: task1.id,
        description: "Email notifications are sent automatically upon successful data submission and validation",
        isComplete: false,
        sortOrder: 3,
      },
    ],
  });

  console.log("Creating audit logs for AOT-001...");

  const auditLogsData = [
    {
      taskId: task1.id,
      userId: coordinator1.id,
      action: "TASK_CREATED",
      fromStatus: null,
      toStatus: TaskStatus.DRAFT,
      reason: "Initial task submission for school data automation initiative",
    },
    {
      taskId: task1.id,
      userId: coordinator1.id,
      action: "SUBMITTED_FOR_APPROVAL",
      fromStatus: TaskStatus.DRAFT,
      toStatus: TaskStatus.PENDING_APPROVAL,
      reason: "Task documentation complete and ready for director review",
    },
    {
      taskId: task1.id,
      userId: director.id,
      action: "APPROVED",
      fromStatus: TaskStatus.PENDING_APPROVAL,
      toStatus: TaskStatus.APPROVED_AWAITING_TEAM,
      reason: "Task aligns with NUST digitization strategy Q2 2026",
    },
    {
      taskId: task1.id,
      userId: farooq.id,
      action: "TEAM_ACCEPTED",
      fromStatus: TaskStatus.APPROVED_AWAITING_TEAM,
      toStatus: TaskStatus.ACCEPTED_BY_TEAM,
      reason: "ICT Web Team has capacity and required expertise for this task",
    },
    {
      taskId: task1.id,
      userId: farooq.id,
      action: "ANALYSIS_STARTED",
      fromStatus: TaskStatus.ACCEPTED_BY_TEAM,
      toStatus: TaskStatus.IN_ANALYSIS,
      reason: "Beginning requirements analysis and technical feasibility study",
    },
    {
      taskId: task1.id,
      userId: farooq.id,
      action: "DEVELOPMENT_STARTED",
      fromStatus: TaskStatus.IN_ANALYSIS,
      toStatus: TaskStatus.IN_DEVELOPMENT,
      reason: "Analysis complete. Architecture approved. Development phase initiated.",
    },
  ];

  for (const log of auditLogsData) {
    await prisma.auditLog.create({ data: log });
  }

  console.log("Creating chat messages for AOT-003...");

  const chatMessages = [
    {
      taskId: task3.id,
      authorId: coordinator1.id,
      content: "The exam schedule generator is still failing to assign rooms correctly. We have 48 hours until the schedule needs to be published. Please prioritize this fix.",
    },
    {
      taskId: task3.id,
      authorId: bilal.id,
      content: "Understood. I've identified the root cause — the room capacity constraint is not being checked against enrolled students at the section level. Working on the fix now.",
    },
    {
      taskId: task3.id,
      authorId: coordinator1.id,
      content: "Good. Please also check why the CS-301 and EE-401 time slots are overlapping for shared faculty members. That was flagged in the last rejection as well.",
    },
    {
      taskId: task3.id,
      authorId: bilal.id,
      content: "Confirmed — the faculty conflict detection was only checking direct assignments, not co-instructor roles. Fix has been applied locally. Running full test suite now.",
    },
    {
      taskId: task3.id,
      authorId: director.id,
      content: "This is the third rejection. Please ensure thorough testing across all departments before resubmitting. The Examination Division needs the schedule by EOD Friday.",
    },
  ];

  for (const msg of chatMessages) {
    await prisma.chatMessage.create({ data: msg });
  }

  console.log("Creating notifications for Pro Rector...");

  await prisma.notification.createMany({
    data: [
      {
        userId: proRector.id,
        taskId: task3.id,
        type: "ESCALATION",
        message: "Task AOT-003 (Exam Schedule Generator Bug Fix) has been rejected 3 times and requires your attention. The fix is critical for upcoming final examinations.",
        severity: "CRITICAL",
        escalationLevel: 3,
        isRead: false,
        isSeen: false,
        emailSent: true,
        pushSent: true,
      },
      {
        userId: proRector.id,
        taskId: task3.id,
        type: "OVERDUE",
        message: "Task AOT-003 (Exam Schedule Generator Bug Fix) is overdue. Expected completion was 2026-04-05 but task is still in REWORK status.",
        severity: "HIGH",
        isRead: false,
        isSeen: false,
        emailSent: true,
        pushSent: false,
      },
      {
        userId: proRector.id,
        taskId: task4.id,
        type: "DEPLOYED",
        message: "Task AOT-004 (Student Transcript Automation) has been successfully deployed to production. Coordinator acceptance pending.",
        severity: "NORMAL",
        isRead: true,
        isSeen: true,
        seenAt: new Date("2026-03-29T11:00:00Z"),
        emailSent: true,
        pushSent: true,
      },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
