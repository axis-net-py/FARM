import { getLivestockBatchById } from "@/app/actions/livestock";
import { getLivestockEvents } from "@/app/actions/livestockEvent";
import { getEmployees } from "@/app/actions/funcionario";
import { LivestockEventSheet } from "@/components/LivestockEventSheet";
import { LivestockEventTimeline } from "@/components/LivestockEventTimeline";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function LivestockBatchProfilePage({
  params,
}: {
  params: Promise<{ tenantId: string; id: string }>;
}) {
  const { tenantId, id } = await params;
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const batch = await getLivestockBatchById(id);
  if (!batch) notFound();

  const [events, employees] = await Promise.all([
    getLivestockEvents(id),
    getEmployees(),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link
          href={`/${tenantId}/rebanho`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Rebanho
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{batch.name}</h1>
            <p className="text-muted-foreground text-sm capitalize">{batch.category} · {batch.quantity} cabeças</p>
          </div>
          <LivestockEventSheet batchId={id} employees={employees} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 flex flex-wrap items-center gap-6">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Status</div>
          <div className="mt-1">
            {batch.status === "ACTIVE" ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-600/90 text-white border-none">Ativo</Badge>
            ) : (
              <Badge variant="secondary">Vendido</Badge>
            )}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Peso Médio</div>
          <div className="text-sm font-medium text-foreground mt-1">
            {batch.averageWeight ? `${Number(batch.averageWeight).toLocaleString()} kg` : "-"}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Piquete Atual</div>
          <div className="text-sm font-medium text-foreground mt-1">
            {batch.location || <span className="text-muted-foreground italic">Não informado</span>}
          </div>
        </div>
      </div>

      <LivestockEventTimeline events={events} />
    </div>
  );
}
