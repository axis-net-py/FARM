"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SupplierSheet } from "@/components/SupplierSheet";
import { SupplierDeleteButton } from "@/components/SupplierDeleteButton";
import type { Supplier } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/components/language-provider";

const STRINGS = {
  pt: {
    searchPlaceholder: "Buscar por Nome Fantasia, Razão Social, Documento...",
    tradeName: "Nome Fantasia",
    businessName: "Razão Social",
    document: "Documento",
    email: "E-mail",
    paymentTerms: "Condição Pagto",
    status: "Status",
    actions: "Ações",
    noSuppliers: "Nenhum fornecedor cadastrado ou encontrado.",
    cash: "Contado",
    active: "Ativo",
    inactive: "Inativo",
    showInactive: "Mostrar Inativos",
  },
  es: {
    searchPlaceholder: "Buscar por Nombre Fantasía, Razón Social, Documento...",
    tradeName: "Nombre Fantasía",
    businessName: "Razón Social",
    document: "Documento",
    email: "E-mail",
    paymentTerms: "Condición Pago",
    status: "Estado",
    actions: "Acciones",
    noSuppliers: "Ningún proveedor registrado o encontrado.",
    cash: "Contado",
    active: "Activo",
    inactive: "Inactivo",
    showInactive: "Mostrar Inactivos",
  },
} as const;

export function SupplierList({ suppliers, tenantId }: { suppliers: Supplier[]; tenantId: string }) {
  const { language } = useLanguage();
  const s = STRINGS[language];
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [sortField, setSortField] = useState<"name" | "businessName" | "document" | "email" | "paymentTerms" | "isActive" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: "name" | "businessName" | "document" | "email" | "paymentTerms" | "isActive") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredSuppliers = suppliers.filter((sup) => {
    const term = search.toLowerCase();
    const matchesSearch =
      sup.name.toLowerCase().includes(term) ||
      (sup.businessName && sup.businessName.toLowerCase().includes(term)) ||
      (sup.document && sup.document.toLowerCase().includes(term)) ||
      (sup.email && sup.email.toLowerCase().includes(term));
    return matchesSearch && (showInactive || sup.isActive);
  });

  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    if (!sortField) return 0;
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (typeof aVal === "boolean") {
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
        <Input
          placeholder={s.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md h-[38px] rounded-lg border-border bg-card"
        />
        <div className="h-[38px] flex items-center gap-2 px-1">
          <Switch checked={showInactive} onCheckedChange={setShowInactive} />
          <span className="text-sm text-muted-foreground whitespace-nowrap">{s.showInactive}</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("name")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.tradeName}{renderSortIndicator("name")}
              </TableHead>
              <TableHead onClick={() => handleSort("businessName")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.businessName}{renderSortIndicator("businessName")}
              </TableHead>
              <TableHead onClick={() => handleSort("document")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.document}{renderSortIndicator("document")}
              </TableHead>
              <TableHead onClick={() => handleSort("email")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.email}{renderSortIndicator("email")}
              </TableHead>
              <TableHead onClick={() => handleSort("paymentTerms")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.paymentTerms}{renderSortIndicator("paymentTerms")}
              </TableHead>
              <TableHead onClick={() => handleSort("isActive")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.status}{renderSortIndicator("isActive")}
              </TableHead>
              <TableHead className="text-right">{s.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {s.noSuppliers}
                </TableCell>
              </TableRow>
            ) : (
              sortedSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.businessName ?? "-"}</TableCell>
                  <TableCell>{supplier.document ? `${supplier.documentType ?? "DOC"}: ${supplier.document}` : "-"}</TableCell>
                  <TableCell>{supplier.email ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{supplier.paymentTerms ?? s.cash}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={supplier.isActive ? "default" : "secondary"}>
                      {supplier.isActive ? s.active : s.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <SupplierSheet tenantId={tenantId} supplier={supplier} />
                      <SupplierDeleteButton supplier={{ id: supplier.id, name: supplier.businessName || supplier.name }} />
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
