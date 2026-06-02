import { getVehicles } from "@/app/actions/frota";
import { VehicleSheet } from "@/components/VehicleSheet";
import { VehicleList } from "@/components/VehicleList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function FrotaPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;

  const vehicles = await getVehicles();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Frota Agrícola</h1>
          <p className="text-muted-foreground text-sm">Gerencie tratores, colheitadeiras, veículos e implementos</p>
        </div>
        <VehicleSheet tenantId={tenantId} />
      </div>

      <VehicleList vehicles={vehicles} tenantId={tenantId} />
    </div>
  );
}
