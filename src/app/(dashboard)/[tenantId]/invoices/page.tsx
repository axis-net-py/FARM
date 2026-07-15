import { getInvoices } from "@/app/actions/invoice";
import { CommercialInvoiceSheet } from "@/components/CommercialInvoiceSheet";
import { AIInvoiceImporter } from "@/components/AIInvoiceImporter";
import { InvoiceList } from "@/components/InvoiceList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/get-locale";

const HEADER = {
  pt: {
    title: "Faturas",
    subtitle: "Faturas de Compra e Venda",
  },
  es: {
    title: "Facturas",
    subtitle: "Facturas de Compra y Venta",
  },
} as const;

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;
  const locale = await getLocale();
  const t = HEADER[locale];

  const { tenantId: paramTenantId } = await params;
  const resolvedTenantId = paramTenantId || tenantId;
  const invoices = await getInvoices();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.title}</h1>
          <p className="text-muted-foreground text-sm">
            {t.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <AIInvoiceImporter />
          <CommercialInvoiceSheet tenantId={tenantId} />
        </div>
      </div>

      <InvoiceList invoices={invoices} tenantId={tenantId} />
    </div>
  );
}
