import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { UploadIcon, TasksIcon } from "@/components/Icons";
import Sidebar, { type NavItem } from "@/components/Sidebar";

const SIDEBAR_ITEMS: NavItem[] = [
  { label: "New Task", href: "/coordinator/new", icon: UploadIcon },
  { label: "My Tasks", href: "/coordinator/tasks", icon: TasksIcon },
];

export default async function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "COORDINATOR") {
    redirect("/unauthorized");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={SIDEBAR_ITEMS}
        userName={session.user.name}
        roleName="Coordinator"
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
