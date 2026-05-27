import { getProducts } from "@/app/actions/product";
import { ProductSheet } from "@/components/ProductSheet";
import { ProductList } from "@/components/ProductList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProductsPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;

  const products = await getProducts();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground text-sm">Gerencie o estoque de produtos</p>
        </div>
        <ProductSheet tenantId={tenantId} />
      </div>

      <ProductList products={products} tenantId={tenantId} />
    </div>
  );
}

