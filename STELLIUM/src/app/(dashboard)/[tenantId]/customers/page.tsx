import { getCustomers } from "@/app/actions/customer";
import { CustomerSheet } from "@/components/CustomerSheet";
import { CustomerList } from "@/components/CustomerList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function CustomersPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;

  const customers = await getCustomers();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm">Gerencie os clientes do sistema</p>
        </div>
        <CustomerSheet tenantId={tenantId} />
      </div>

      <CustomerList customers={customers} tenantId={tenantId} />
    </div>
  );
}
