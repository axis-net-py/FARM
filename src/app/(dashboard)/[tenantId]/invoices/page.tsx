import { getInvoices } from "@/app/actions/invoice";
import { CommercialInvoiceSheet } from "@/components/CommercialInvoiceSheet";
import { AIInvoiceImporter } from "@/components/AIInvoiceImporter";
import { InvoiceList } from "@/components/InvoiceList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/get-locale";
import { PageHeader } from "@/components/ui/page-header";

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
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <>
            <AIInvoiceImporter />
            <CommercialInvoiceSheet tenantId={tenantId} />
          </>
        }
      />

      <InvoiceList invoices={invoices} tenantId={tenantId} />
    </div>
  );
}
