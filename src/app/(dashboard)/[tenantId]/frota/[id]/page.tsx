import { getVehicleById } from "@/app/actions/frota";
import { getVehicleLogs, getFuelConsumption } from "@/app/actions/vehicleLog";
import { getEmployees } from "@/app/actions/funcionario";
import { VehicleLogSheet } from "@/components/VehicleLogSheet";
import { VehicleTimeline } from "@/components/VehicleTimeline";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

function getStatusBadge(status: string) {
  switch (status) {
    case "OPERATIONAL":
      return <Badge className="bg-emerald-600 hover:bg-emerald-600/90 text-white border-none">Operacional</Badge>;
    case "MAINTENANCE":
      return <Badge className="bg-amber-600 hover:bg-amber-600/90 text-white border-none">Manutenção</Badge>;
    case "OUT_OF_SERVICE":
      return <Badge variant="destructive">Fora de Serviço</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function VehicleProfilePage({
  params,
}: {
  params: Promise<{ tenantId: string; id: string }>;
}) {
  const { tenantId, id } = await params;
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const vehicle = await getVehicleById(id);
  if (!vehicle) notFound();

  const [logs, employees, consumption] = await Promise.all([
    getVehicleLogs(id),
    getEmployees(),
    getFuelConsumption(id),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link
          href={`/${tenantId}/frota`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Frota
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{vehicle.name}</h1>
            <p className="text-muted-foreground text-sm capitalize">{vehicle.type}{vehicle.plate ? ` · ${vehicle.plate}` : ""}</p>
          </div>
          <VehicleLogSheet vehicleId={id} employees={employees} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 flex flex-wrap items-center gap-6">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Status</div>
          <div className="mt-1">{getStatusBadge(vehicle.status)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Leitura Atual</div>
          <div className="text-lg font-bold text-foreground mt-1">
            {vehicle.currentReading ? Number(vehicle.currentReading).toLocaleString() : "-"}
          </div>
        </div>
      </div>

      <VehicleTimeline vehicleId={id} logs={logs} employees={employees} consumption={{ average: consumption.average, unit: consumption.unit }} />
    </div>
  );
}
