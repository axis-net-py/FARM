import { getFields } from "@/app/actions/fields";
import { FieldList } from "@/app/(dashboard)/[tenantId]/fields/FieldList";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function FieldsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const fields = await getFields(tenantId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground font-heading">
            Talhões (Áreas da Fazenda)
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            Gerencie as dimensões e culturas das áreas de plantio
          </p>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-[2rem]" />}>
        <FieldList initialFields={fields} tenantId={tenantId} />
      </Suspense>
    </div>
  );
}
