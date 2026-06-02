import { getContracts } from "@/app/actions/contrato";
import { getHarvests } from "@/app/actions/safra";
import { ContractSheet } from "@/components/ContractSheet";
import { ContractList } from "@/components/ContractList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ContratosPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;

  const contracts = await getContracts();
  const harvests = await getHarvests();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Contratos de Venda</h1>
          <p className="text-muted-foreground text-sm">Gerencie as vendas programadas de safras e entregas a silos compradores</p>
        </div>
        <div className="self-start sm:self-auto">
          <ContractSheet tenantId={tenantId} harvests={harvests} />
        </div>
      </div>

      <ContractList contracts={contracts} harvests={harvests} tenantId={tenantId} />
    </div>
  );
}
