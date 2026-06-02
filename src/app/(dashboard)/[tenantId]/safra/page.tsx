import { getHarvests } from "@/app/actions/safra";
import { HarvestSheet } from "@/components/HarvestSheet";
import { HarvestList } from "@/components/HarvestList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SafraPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;

  const harvests = await getHarvests();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Safras</h1>
          <p className="text-muted-foreground text-sm">Gerencie as safras, plantios e culturas do sistema</p>
        </div>
        <HarvestSheet tenantId={tenantId} />
      </div>

      <HarvestList harvests={harvests} tenantId={tenantId} />
    </div>
  );
}
