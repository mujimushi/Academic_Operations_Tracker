import { STATUS_COLORS, STATUS_DISPLAY_NAMES } from "@/constants/colors";
import { TaskStatus } from "@/generated/prisma/client";

export default function StatusBadge({ status }: { status: TaskStatus }) {
  const colors = STATUS_COLORS[status] || { bg: "#F3F4F6", text: "#6B7280" };
  const label = STATUS_DISPLAY_NAMES[status] || status;

  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {label}
    </span>
  );
}
