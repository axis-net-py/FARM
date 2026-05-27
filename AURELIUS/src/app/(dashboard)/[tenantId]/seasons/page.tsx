import { getSeasons } from "@/app/actions/seasons";
import { SeasonList } from "@/app/(dashboard)/[tenantId]/seasons/SeasonList";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function SeasonsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const seasons = await getSeasons(tenantId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground font-heading">
            Gestão de Safras
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            Planeje e acompanhe os ciclos de cultivo e colheita
          </p>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-[2rem]" />}>
        <SeasonList initialSeasons={seasons} tenantId={tenantId} />
      </Suspense>
    </div>
  );
}
