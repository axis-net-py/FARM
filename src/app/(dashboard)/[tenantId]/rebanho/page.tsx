import { getLivestockBatches } from "@/app/actions/livestock";
import { LivestockBatchSheet } from "@/components/LivestockBatchSheet";
import { LivestockBatchList } from "@/components/LivestockBatchList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function RebanhoPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;

  const batches = await getLivestockBatches();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Rebanho</h1>
          <p className="text-muted-foreground text-sm">Lotes de gado, pesagem, sanidade e movimentação</p>
        </div>
        <div className="self-start sm:self-auto">
          <LivestockBatchSheet />
        </div>
      </div>

      <LivestockBatchList batches={batches} tenantId={tenantId} />
    </div>
  );
}
