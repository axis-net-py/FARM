import { getPlots } from "@/app/actions/talhao";
import { getHarvests } from "@/app/actions/safra";
import { PlotSheet } from "@/components/PlotSheet";
import { PlotList } from "@/components/PlotList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function TalhoesPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;

  const plots = await getPlots();
  const harvests = await getHarvests();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Talhões</h1>
          <p className="text-muted-foreground text-sm">Gerencie as áreas cultiváveis, hectares/alqueires e culturas</p>
        </div>
        <PlotSheet tenantId={tenantId} harvests={harvests} />
      </div>

      <PlotList plots={plots} harvests={harvests} tenantId={tenantId} />
    </div>
  );
}
