import { getCustomers } from "@/app/actions/customer";
import { CustomerSheet } from "@/components/CustomerSheet";
import { CustomerList } from "@/components/CustomerList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/get-locale";

const HEADER = {
  pt: {
    title: "Clientes",
    subtitle: "Gerencie os clientes do sistema",
  },
  es: {
    title: "Clientes",
    subtitle: "Gestione los clientes del sistema",
  },
} as const;

export default async function CustomersPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;
  const locale = await getLocale();
  const t = HEADER[locale];

  const customers = await getCustomers();

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.title}</h1>
          <p className="text-muted-foreground text-sm">{t.subtitle}</p>
        </div>
        <div className="self-start sm:self-auto">
          <CustomerSheet tenantId={tenantId} />
        </div>
      </div>

      <CustomerList customers={customers} tenantId={tenantId} />
    </div>
  );
}
