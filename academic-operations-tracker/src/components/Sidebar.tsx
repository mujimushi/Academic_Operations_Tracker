"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type SidebarProps = {
  items: NavItem[];
  userName: string;
  roleName: string;
};

export default function Sidebar({ items, userName, roleName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-nust-blue text-white">
      {/* Logo / Title */}
      <div className="px-5 py-6 border-b border-white/10">
        <h1 className="text-base font-heading font-semibold leading-tight">
          NUST Academic Operations Tracker
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-white/20 font-medium"
                  : "hover:bg-white/10"
              }`}
            >
              <Icon className="shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Coming Soon placeholder */}
      <div className="px-5 py-3 border-t border-white/10">
        <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">
          Coming Soon
        </p>
        <ul className="space-y-1 text-sm text-white/50">
          <li>Policy Chatbot</li>
          <li>Student Queries</li>
        </ul>
      </div>

      {/* User info and sign out */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-sm font-medium truncate">{userName}</p>
        <p className="text-xs text-white/60 mb-3">{roleName}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="text-xs text-white/60 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
