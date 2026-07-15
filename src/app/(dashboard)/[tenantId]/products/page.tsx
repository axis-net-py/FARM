import { getProducts } from "@/app/actions/product";
import { ProductSheet } from "@/components/ProductSheet";
import { ProductList } from "@/components/ProductList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/get-locale";

const HEADER = {
  pt: {
    title: "Produtos",
    subtitle: "Gerencie o estoque de produtos",
  },
  es: {
    title: "Productos",
    subtitle: "Gestione el stock de productos",
  },
} as const;

export default async function ProductsPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;
  const locale = await getLocale();
  const t = HEADER[locale];

  const products = await getProducts();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.title}</h1>
          <p className="text-muted-foreground text-sm">{t.subtitle}</p>
        </div>
        <div className="self-start sm:self-auto">
          <ProductSheet tenantId={tenantId} />
        </div>
      </div>

      <ProductList products={products} tenantId={tenantId} />
    </div>
  );
}

