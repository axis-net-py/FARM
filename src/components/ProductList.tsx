"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProductSheet } from "@/components/ProductSheet";
import { ProductDeleteButton } from "@/components/ProductDeleteButton";
import type { Product } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

const STRINGS = {
  pt: {
    searchPlaceholder: "Buscar por SKU ou Nome...",
    filterByTag: "Filtrar por Tag",
    allTags: "Todas as Tags",
    filterByType: "Filtrar por Tipo",
    allTypes: "Todos os Tipos",
    product: "Produtos",
    service: "Serviços",
    sku: "SKU",
    name: "Nome",
    price: "Preço",
    stock: "Estoque",
    tags: "Tags",
    status: "Status",
    actions: "Ações",
    noProducts: "Nenhum produto encontrado.",
    serviceLabel: "Serviço",
    active: "Ativo",
    inactive: "Inativo",
  },
  es: {
    searchPlaceholder: "Buscar por SKU o Nombre...",
    filterByTag: "Filtrar por Etiqueta",
    allTags: "Todas las Etiquetas",
    filterByType: "Filtrar por Tipo",
    allTypes: "Todos los Tipos",
    product: "Productos",
    service: "Servicios",
    sku: "SKU",
    name: "Nombre",
    price: "Precio",
    stock: "Stock",
    tags: "Etiquetas",
    status: "Estado",
    actions: "Acciones",
    noProducts: "No se encontraron productos.",
    serviceLabel: "Servicio",
    active: "Activo",
    inactive: "Inactivo",
  },
} as const;

export function ProductList({ products, tenantId }: { products: Product[]; tenantId: string }) {
  const { language } = useLanguage();
  const s = STRINGS[language];
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [sortField, setSortField] = useState<"sku" | "name" | "price" | "currentStock" | "isActive" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Collect all unique tags from products
  const allTags = Array.from(
    new Set(
      products
        .flatMap((p) => (p.tags ? p.tags.split(",").map((t) => t.trim().toLowerCase()) : []))
        .filter(Boolean)
    )
  ).sort();

  const handleSort = (field: "sku" | "name" | "price" | "currentStock" | "isActive") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Filter products based on search, selected tag and item type
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase());

    const matchesTag =
      selectedTag === "all" ||
      (p.tags &&
        p.tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .includes(selectedTag));

    const matchesType =
      selectedType === "all" ||
      (selectedType === "service" && p.isService) ||
      (selectedType === "product" && !p.isService);

    return matchesSearch && matchesTag && matchesType;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortField) return 0;
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === "price" || sortField === "currentStock") {
      aVal = Number(aVal);
      bVal = Number(bVal);
    } else if (typeof aVal === "boolean") {
      aVal = aVal ? 1 : 0;
      bVal = bVal ? 1 : 0;
    } else {
      aVal = String(aVal || "").toLowerCase();
      bVal = String(bVal || "").toLowerCase();
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const renderSortIndicator = (field: typeof sortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? " ▴" : " ▾";
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder={s.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs h-[38px] rounded-lg border-border bg-card"
          />
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-[180px] h-[38px] rounded-lg bg-card">
              <SelectValue placeholder={s.filterByTag} />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">{s.allTags}</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag} className="capitalize">
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px] h-[38px] rounded-lg bg-card">
              <SelectValue placeholder={s.filterByType} />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">{s.allTypes}</SelectItem>
              <SelectItem value="product">{s.product}</SelectItem>
              <SelectItem value="service">{s.service}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("sku")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.sku}{renderSortIndicator("sku")}
              </TableHead>
              <TableHead onClick={() => handleSort("name")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.name}{renderSortIndicator("name")}
              </TableHead>
              <TableHead onClick={() => handleSort("price")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.price}{renderSortIndicator("price")}
              </TableHead>
              <TableHead onClick={() => handleSort("currentStock")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.stock}{renderSortIndicator("currentStock")}
              </TableHead>
              <TableHead>{s.tags}</TableHead>
              <TableHead onClick={() => handleSort("isActive")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.status}{renderSortIndicator("isActive")}
              </TableHead>
              <TableHead className="text-right">{s.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {s.noProducts}
                </TableCell>
              </TableRow>
            ) : (
              sortedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat((product as any).currency === 'PYG' ? 'pt-BR' : (product as any).currency === 'BRL' ? 'pt-BR' : 'en-US', {
                      style: 'currency',
                      currency: (product as any).currency || 'PYG',
                      minimumFractionDigits: (product as any).currency === 'PYG' ? 0 : 2,
                      maximumFractionDigits: (product as any).currency === 'PYG' ? 0 : 2,
                    }).format(Number(product.price))}
                  </TableCell>
                  <TableCell>
                    {product.isService ? (
                      <span className="text-muted-foreground italic font-medium">{s.serviceLabel}</span>
                    ) : (
                      <span className={Number(product.currentStock) <= Number(product.minStock) ? "text-red-500 font-bold" : ""}>
                        {Number(product.currentStock)} {product.unit}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {product.tags && product.tags.split(",").map((tag) => {
                        const trimmed = tag.trim();
                        if (!trimmed) return null;
                        return (
                          <Badge key={trimmed} variant="outline" className="text-[10px] uppercase font-bold py-0.5 px-1.5 bg-primary/5 text-primary border-primary/20">
                            {trimmed}
                          </Badge>
                        );
                      })}
                      {!product.tags && <span className="text-muted-foreground text-xs">-</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? s.active : s.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <ProductSheet
                        tenantId={tenantId}
                        product={product}
                      />
                      <ProductDeleteButton product={product} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
