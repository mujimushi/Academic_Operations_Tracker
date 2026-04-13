import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { BellIcon, DashboardIcon, QueueIcon, TasksIcon } from "@/components/Icons";
import Sidebar, { type NavItem } from "@/components/Sidebar";
import BottomTabBar, { DIRECTOR_TABS } from "@/components/BottomTabBar";

const SIDEBAR_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/director/dashboard", icon: DashboardIcon },
  { label: "Approval Queue", href: "/director/queue", icon: QueueIcon },
  { label: "All Tasks", href: "/director/tasks", icon: TasksIcon },
  { label: "Alerts", href: "/director/alerts", icon: BellIcon },
];

export default async function DirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DIRECTOR") {
    redirect("/unauthorized");
  }

  return (
    <>
      {/* Desktop layout */}
      <div className="hidden md:flex min-h-screen">
        <Sidebar
          items={SIDEBAR_ITEMS}
          userName={session.user.name}
          roleName="Director"
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden max-w-lg mx-auto min-h-screen bg-bg">
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-nust-blue text-white">
          <h1 className="text-base font-heading font-semibold">
            Academic Tracker
          </h1>
          <Link href="/director/alerts" aria-label="Alerts">
            <BellIcon className="text-white" />
          </Link>
        </header>
        <main className="pb-16">{children}</main>
        <BottomTabBar tabs={DIRECTOR_TABS} />
      </div>
    </>
  );
}
