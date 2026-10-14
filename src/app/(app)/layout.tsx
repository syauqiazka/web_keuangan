import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { Sidebar } from "@/components/Sidebar";
import { GantiPasswordModal } from "@/components/GantiPasswordModal";

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
    <div className="min-h-screen bg-canvas text-text flex flex-col lg:flex-row">
      <Sidebar user={user} />
      <main className="flex-1 min-w-0 p-6 lg:p-8">
        <div className="max-w-[1200px] mx-auto w-full">{children}</div>
      </main>
      {user.wajibGantiPassword && (
        <GantiPasswordModal open={true} isWajib={true} />
      )}
    </div>
  );
}
