export const COLORS = {
  nustBlue: "#003366",
  ceramicBlue: "#0088B9",
  orange: "#E87722",
  silver: "#C0C0C0",
  beige: "#F5F0E8",
  lightBlue: "#E8F4F8",
  white: "#FFFFFF",
  bg: "#F7F8FA",
  text: "#1A1A2E",
  textMuted: "#6B7280",
  cardBg: "#FFFFFF",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
} as const;

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT:                    { bg: "#F3F4F6", text: "#6B7280" },
  PENDING_APPROVAL:         { bg: "#FEF3C7", text: "#92400E" },
  APPROVED_AWAITING_TEAM:   { bg: "#DBEAFE", text: "#1E40AF" },
  ACCEPTED_BY_TEAM:         { bg: "#E0E7FF", text: "#3730A3" },
  IN_ANALYSIS:              { bg: "#EDE9FE", text: "#5B21B6" },
  IN_DEVELOPMENT:           { bg: "#CFFAFE", text: "#155E75" },
  IN_TESTING:               { bg: "#FEE2E2", text: "#991B1B" },
  DEPLOYED:                 { bg: "#D1FAE5", text: "#065F46" },
  COORDINATOR_ACCEPTED:     { bg: "#BBF7D0", text: "#166534" },
  ACCEPTED_CLOSED:          { bg: "#ECFDF5", text: "#059669" },
  REWORK:                   { bg: "#FEE2E2", text: "#DC2626" },
  REJECTED_BY_TEAM:         { bg: "#FEE2E2", text: "#DC2626" },
  PAUSED:                   { bg: "#FEF9C3", text: "#854D0E" },
  KILLED:                   { bg: "#1F2937", text: "#F9FAFB" },
};

export const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#DC2626",
  HIGH:     "#E87722",
  MEDIUM:   "#D97706",
  LOW:      "#059669",
};

export const STATUS_DISPLAY_NAMES: Record<string, string> = {
  DRAFT:                    "Draft",
  PENDING_APPROVAL:         "Pending Approval",
  APPROVED_AWAITING_TEAM:   "Approved - Awaiting Team",
  ACCEPTED_BY_TEAM:         "Accepted by Team",
  IN_ANALYSIS:              "In Analysis",
  IN_DEVELOPMENT:           "In Development",
  IN_TESTING:               "In Testing",
  DEPLOYED:                 "Deployed",
  COORDINATOR_ACCEPTED:     "Coordinator Accepted",
  ACCEPTED_CLOSED:          "Accepted - Closed",
  REWORK:                   "Rework",
  REJECTED_BY_TEAM:         "Rejected by Team",
  PAUSED:                   "Paused",
  KILLED:                   "Killed",
};
