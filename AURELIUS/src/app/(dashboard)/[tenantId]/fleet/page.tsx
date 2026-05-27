import { getMachineries } from "@/app/actions/fleet";
import { FleetList } from "@/app/(dashboard)/[tenantId]/fleet/FleetList";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function FleetPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const machinery = await getMachineries(tenantId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground font-heading">
            Gestão de Frota e Maquinários
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            Monitore veículos, tratores, colheitadeiras e equipamentos
          </p>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-[2rem]" />}>
        <FleetList initialMachinery={machinery} tenantId={tenantId} />
      </Suspense>
    </div>
  );
}
