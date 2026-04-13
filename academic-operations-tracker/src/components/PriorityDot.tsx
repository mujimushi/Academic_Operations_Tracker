import { PRIORITY_COLORS } from "@/constants/colors";
import { Priority } from "@/generated/prisma/client";

export default function PriorityDot({ priority }: { priority: Priority }) {
  const color = PRIORITY_COLORS[priority] || "#6B7280";

  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-1.5"
      style={{ backgroundColor: color }}
      title={priority}
    />
  );
}
