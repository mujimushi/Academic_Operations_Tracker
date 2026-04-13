"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  TasksIcon,
  BellIcon,
  QueueIcon,
} from "@/components/Icons";

type Tab = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

export const PRO_RECTOR_TABS: Tab[] = [
  { label: "Dashboard", href: "/pro-rector/dashboard", icon: DashboardIcon },
  { label: "Tasks", href: "/pro-rector/tasks", icon: TasksIcon },
  { label: "Alerts", href: "/pro-rector/alerts", icon: BellIcon },
];

export const DIRECTOR_TABS: Tab[] = [
  { label: "Dashboard", href: "/director/dashboard", icon: DashboardIcon },
  { label: "Queue", href: "/director/queue", icon: QueueIcon },
  { label: "Tasks", href: "/director/tasks", icon: TasksIcon },
  { label: "Alerts", href: "/director/alerts", icon: BellIcon },
];

export default function BottomTabBar({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full ${
                isActive ? "text-nust-ceramic" : "text-gray-400"
              }`}
            >
              <span className="relative">
                <Icon />
                {tab.badge != null && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] leading-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
