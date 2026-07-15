import { getSuppliers } from "@/app/actions/supplier";
import { SupplierSheet } from "@/components/SupplierSheet";
import { SupplierList } from "@/components/SupplierList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/get-locale";

const HEADER = {
  pt: {
    title: "Fornecedores",
    description: "Gerencie os fornecedores e parceiros comerciais",
  },
  es: {
    title: "Proveedores",
    description: "Gestione los proveedores y socios comerciales",
  },
} as const;

export default async function SuppliersPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;
  const locale = await getLocale();
  const t = HEADER[locale];

  const suppliers = await getSuppliers();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.title}</h1>
          <p className="text-muted-foreground text-sm">{t.description}</p>
        </div>
        <div className="self-start sm:self-auto">
          <SupplierSheet tenantId={tenantId} />
        </div>
      </div>

      <SupplierList suppliers={suppliers} tenantId={tenantId} />
    </div>
  );
}
