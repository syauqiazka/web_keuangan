import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/guards";
import { getAkunList } from "@/server/queries/akun";
import { KelolaAkunClient } from "@/app/(app)/pengaturan/akun/KelolaAkunClient";

export default async function KelolaAkunPage() {
  const user = await requireAdmin().catch(() => null);
  if (!user) redirect("/pengaturan");

  const akunList = await getAkunList();

  return <KelolaAkunClient akunList={akunList} currentUserId={user.id} />;
}
