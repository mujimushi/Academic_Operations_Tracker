import { TaskStatus, Role } from "@/generated/prisma/client";

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  DRAFT:                  [TaskStatus.PENDING_APPROVAL, TaskStatus.KILLED],
  PENDING_APPROVAL:       [TaskStatus.APPROVED_AWAITING_TEAM, TaskStatus.DRAFT, TaskStatus.KILLED],
  APPROVED_AWAITING_TEAM: [TaskStatus.ACCEPTED_BY_TEAM, TaskStatus.REJECTED_BY_TEAM, TaskStatus.PAUSED, TaskStatus.KILLED],
  ACCEPTED_BY_TEAM:       [TaskStatus.IN_ANALYSIS, TaskStatus.PAUSED, TaskStatus.KILLED],
  IN_ANALYSIS:            [TaskStatus.IN_DEVELOPMENT, TaskStatus.PAUSED, TaskStatus.KILLED],
  IN_DEVELOPMENT:         [TaskStatus.IN_TESTING, TaskStatus.PAUSED, TaskStatus.KILLED],
  IN_TESTING:             [TaskStatus.DEPLOYED, TaskStatus.IN_DEVELOPMENT, TaskStatus.PAUSED, TaskStatus.KILLED],
  DEPLOYED:               [TaskStatus.COORDINATOR_ACCEPTED, TaskStatus.REWORK, TaskStatus.PAUSED, TaskStatus.KILLED],
  COORDINATOR_ACCEPTED:   [TaskStatus.ACCEPTED_CLOSED, TaskStatus.REWORK, TaskStatus.KILLED],
  REWORK:                 [TaskStatus.IN_DEVELOPMENT, TaskStatus.PAUSED, TaskStatus.KILLED],
  REJECTED_BY_TEAM:       [TaskStatus.DRAFT, TaskStatus.KILLED],
  PAUSED:                 [TaskStatus.KILLED],
  ACCEPTED_CLOSED:        [],
  KILLED:                 [],
};

export const STATUS_ROLE_PERMISSIONS: Record<TaskStatus, Partial<Record<TaskStatus, Role[]>>> = {
  DRAFT: {
    [TaskStatus.PENDING_APPROVAL]: [Role.COORDINATOR],
    [TaskStatus.KILLED]: [Role.COORDINATOR, Role.DIRECTOR, Role.PRO_RECTOR],
  },
  PENDING_APPROVAL: {
    [TaskStatus.APPROVED_AWAITING_TEAM]: [Role.DIRECTOR],
    [TaskStatus.DRAFT]: [Role.DIRECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  APPROVED_AWAITING_TEAM: {
    [TaskStatus.ACCEPTED_BY_TEAM]: [Role.TEAM_RESOURCE],
    [TaskStatus.REJECTED_BY_TEAM]: [Role.TEAM_RESOURCE],
    [TaskStatus.PAUSED]: [Role.TEAM_RESOURCE, Role.DIRECTOR, Role.PRO_RECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  ACCEPTED_BY_TEAM: {
    [TaskStatus.IN_ANALYSIS]: [Role.TEAM_RESOURCE],
    [TaskStatus.PAUSED]: [Role.TEAM_RESOURCE, Role.DIRECTOR, Role.PRO_RECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  IN_ANALYSIS: {
    [TaskStatus.IN_DEVELOPMENT]: [Role.TEAM_RESOURCE],
    [TaskStatus.PAUSED]: [Role.TEAM_RESOURCE, Role.DIRECTOR, Role.PRO_RECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  IN_DEVELOPMENT: {
    [TaskStatus.IN_TESTING]: [Role.TEAM_RESOURCE],
    [TaskStatus.PAUSED]: [Role.TEAM_RESOURCE, Role.DIRECTOR, Role.PRO_RECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  IN_TESTING: {
    [TaskStatus.DEPLOYED]: [Role.TEAM_RESOURCE],
    [TaskStatus.IN_DEVELOPMENT]: [Role.TEAM_RESOURCE],
    [TaskStatus.PAUSED]: [Role.TEAM_RESOURCE, Role.DIRECTOR, Role.PRO_RECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  DEPLOYED: {
    [TaskStatus.COORDINATOR_ACCEPTED]: [Role.COORDINATOR],
    [TaskStatus.REWORK]: [Role.COORDINATOR, Role.DIRECTOR],
    [TaskStatus.PAUSED]: [Role.COORDINATOR, Role.DIRECTOR, Role.PRO_RECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  COORDINATOR_ACCEPTED: {
    [TaskStatus.ACCEPTED_CLOSED]: [Role.DIRECTOR],
    [TaskStatus.REWORK]: [Role.DIRECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  REWORK: {
    [TaskStatus.IN_DEVELOPMENT]: [Role.TEAM_RESOURCE],
    [TaskStatus.PAUSED]: [Role.TEAM_RESOURCE, Role.DIRECTOR, Role.PRO_RECTOR],
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  REJECTED_BY_TEAM: {
    [TaskStatus.DRAFT]: [Role.COORDINATOR],
    [TaskStatus.KILLED]: [Role.COORDINATOR, Role.DIRECTOR, Role.PRO_RECTOR],
  },
  PAUSED: {
    [TaskStatus.KILLED]: [Role.DIRECTOR, Role.PRO_RECTOR],
  },
  ACCEPTED_CLOSED: {},
  KILLED: {},
};

export const REQUEST_TYPES = [
  { value: "NEW_DEVELOPMENT", label: "New Development" },
  { value: "ENHANCEMENT", label: "Enhancement" },
  { value: "BUG_FIX", label: "Bug Fix" },
  { value: "POLICY_CHANGE", label: "Policy Change" },
] as const;

export const PRIORITIES = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
] as const;
