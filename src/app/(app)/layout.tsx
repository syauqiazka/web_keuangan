import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { Sidebar } from "@/components/Sidebar";
import { GantiPasswordModal } from "@/components/GantiPasswordModal";
import { PageTransitionIndicator } from "@/components/PageTransitionIndicator";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/masuk");
  }

  return (
    <div className="min-h-screen bg-canvas text-text flex flex-col lg:flex-row antialiased selection:bg-brand/20">
      <PageTransitionIndicator />
      <Sidebar user={user} />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-[1240px] mx-auto w-full page-transition">{children}</div>
      </main>
      {user.wajibGantiPassword && (
        <GantiPasswordModal open={true} isWajib={true} />
      )}
    </div>
  );
}
