import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LedgerTable from "@/components/accounting/LedgerTable";
import { getLocale } from "@/lib/get-locale";

const HEADER = {
  pt: {
    title: "Contabilidade",
    subtitle: "Livro Razão e Partidas Dobradas",
  },
  es: {
    title: "Contabilidad",
    subtitle: "Libro Mayor y Partida Doble",
  },
} as const;

export default async function AccountingPage({
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t.title}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t.subtitle}
        </p>
      </div>

      <LedgerTable tenantId={resolvedTenantId} />
    </div>
  );
}
