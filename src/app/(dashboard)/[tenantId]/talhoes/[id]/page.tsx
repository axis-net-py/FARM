import { getPlotById } from "@/app/actions/talhao";
import { getPlotApplications } from "@/app/actions/plotApplication";
import { getEmployees } from "@/app/actions/funcionario";
import { getProducts } from "@/app/actions/product";
import { PlotApplicationSheet } from "@/components/PlotApplicationSheet";
import { PlotApplicationTimeline } from "@/components/PlotApplicationTimeline";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

function getStatusBadge(status: string) {
  switch (status) {
    case "PLANTED":
      return <Badge className="bg-emerald-600 hover:bg-emerald-600/90 text-white border-none">Plantado</Badge>;
    case "PREPARING":
      return <Badge className="bg-sky-600 hover:bg-sky-600/90 text-white border-none">Preparando Solo</Badge>;
    case "FALLOW":
      return <Badge variant="secondary">Pousio</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function PlotProfilePage({
  params,
}: {
  params: Promise<{ tenantId: string; id: string }>;
}) {
  const { tenantId, id } = await params;
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const plot = await getPlotById(id);
  if (!plot) notFound();

  const [applications, employees, products] = await Promise.all([
    getPlotApplications(id),
    getEmployees(),
    getProducts(),
  ]);

  const activeProducts = products.filter((p: any) => p.isActive && !p.isService);

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link
          href={`/${tenantId}/talhoes`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Talhões
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{plot.name}</h1>
            <p className="text-muted-foreground text-sm">
              {Number(plot.area).toFixed(2)} {plot.unit === "HECTARE" ? "ha" : "alq"}
              {plot.currentCrop ? ` · ${plot.currentCrop}` : ""}
            </p>
          </div>
          <PlotApplicationSheet plotId={id} products={activeProducts} employees={employees} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 flex flex-wrap items-center gap-6">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Status</div>
          <div className="mt-1">{getStatusBadge(plot.status)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Safra Associada</div>
          <div className="text-sm font-medium text-foreground mt-1">
            {plot.harvest?.name || <span className="text-muted-foreground italic">Sem safra</span>}
          </div>
        </div>
      </div>

      <PlotApplicationTimeline applications={applications} />
    </div>
  );
}
