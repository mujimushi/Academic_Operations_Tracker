import { TaskStatus, Role } from "@/generated/prisma/client";
import {
  VALID_TRANSITIONS,
  STATUS_ROLE_PERMISSIONS,
} from "@/constants/statuses";

export type TransitionResult =
  | { valid: true }
  | { valid: false; reason: string };

export function validateTransition(
  fromStatus: TaskStatus,
  toStatus: TaskStatus,
  userRole: Role,
  options?: {
    isTaskOwner?: boolean;
    hasWorkflowHistory?: boolean;
    pausedFromStatus?: TaskStatus | null;
  }
): TransitionResult {
  // Special case: unpausing returns to pausedFromStatus
  if (fromStatus === TaskStatus.PAUSED && toStatus !== TaskStatus.KILLED) {
    if (!options?.pausedFromStatus) {
      return {
        valid: false,
        reason: "No previous status recorded for unpause",
      };
    }
    if (toStatus !== options.pausedFromStatus) {
      return {
        valid: false,
        reason: `Can only unpause to ${options.pausedFromStatus}`,
      };
    }
    return { valid: true };
  }

  // Check if transition is valid
  const validNext = VALID_TRANSITIONS[fromStatus];
  if (!validNext || !validNext.includes(toStatus)) {
    return {
      valid: false,
      reason: `Cannot transition from ${fromStatus} to ${toStatus}`,
    };
  }

  // Check role permissions
  const permissions = STATUS_ROLE_PERMISSIONS[fromStatus];
  const allowedRoles = permissions?.[toStatus];
  if (!allowedRoles || !allowedRoles.includes(userRole)) {
    return {
      valid: false,
      reason: `Role ${userRole} cannot perform this transition`,
    };
  }

  // Special: Coordinator can only kill own tasks from DRAFT or REJECTED_BY_TEAM
  if (toStatus === TaskStatus.KILLED && userRole === Role.COORDINATOR) {
    if (!options?.isTaskOwner) {
      return {
        valid: false,
        reason: "Coordinators can only kill their own tasks",
      };
    }
    if (
      fromStatus !== TaskStatus.DRAFT &&
      fromStatus !== TaskStatus.REJECTED_BY_TEAM
    ) {
      return {
        valid: false,
        reason:
          "Coordinators can only kill tasks in Draft or Rejected by Team status",
      };
    }
  }

  return { valid: true };
}
