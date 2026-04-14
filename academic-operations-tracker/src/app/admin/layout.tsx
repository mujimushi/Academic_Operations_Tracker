import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { UsersIcon, TeamIcon, SettingsIcon } from "@/components/Icons";
import Sidebar, { type NavItem } from "@/components/Sidebar";

const SIDEBAR_ITEMS: NavItem[] = [
  { label: "Users", href: "/admin/users", icon: UsersIcon },
  { label: "Teams", href: "/admin/teams", icon: TeamIcon },
  { label: "Settings", href: "/admin/settings", icon: SettingsIcon },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={SIDEBAR_ITEMS}
        userName={session.user.name}
        roleName="Admin"
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
