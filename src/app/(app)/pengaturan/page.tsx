import { requireAuth } from "@/server/auth/guards";
import { PengaturanView } from "./PengaturanView";

export default async function PengaturanPage() {
  const user = await requireAuth();

  return <PengaturanView user={user} />;
}
