import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { BellIcon } from "@/components/Icons";
import BottomTabBar, { PRO_RECTOR_TABS } from "@/components/BottomTabBar";

export default async function ProRectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PRO_RECTOR") {
    redirect("/unauthorized");
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-bg">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-nust-blue text-white">
        <h1 className="text-base font-heading font-semibold">
          Academic Tracker
        </h1>
        <Link href="/pro-rector/alerts" aria-label="Alerts">
          <BellIcon className="text-white" />
        </Link>
      </header>

      {/* Page content with bottom bar clearance */}
      <main className="pb-16">{children}</main>

      {/* Bottom navigation */}
      <BottomTabBar tabs={PRO_RECTOR_TABS} />
    </div>
  );
}
