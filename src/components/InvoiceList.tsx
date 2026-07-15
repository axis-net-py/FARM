"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InvoiceActions } from "@/components/InvoiceActions";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paperclip } from "lucide-react";
import { format } from "date-fns";
import { ptBR, es as esLocale } from "date-fns/locale";
import { useLanguage } from "@/components/language-provider";

const STRINGS = {
  pt: {
    sifenStatus: {
      PENDING: "Pendente Sifen",
      APPROVED: "Aprovado Sifen",
      REJECTED: "Rejeitado Sifen",
      CANCELLED: "Cancelado Sifen",
      RECIBO_COMUN: "Recibo Comum",
    } as Record<string, string>,
    searchPlaceholder: "Buscar por cliente ou número...",
    type: "Tipo",
    allTypes: "Todos os Tipos",
    sales: "Venda",
    purchase: "Compra",
    status: "Status",
    allStatus: "Todos Status",
    pending: "Pendente",
    approved: "Aprovada",
    cancelled: "Cancelada",
    sifenStatusLabel: "Status SET (Sifen)",
    allSifen: "Todos Sifen",
    notSent: "Não enviado",
    colCustomer: "Cliente",
    colInvoice: "Fatura",
    colDate: "Data",
    colSifenStatus: "Status SET",
    colTotal: "Total",
    colActions: "Ações",
    empty: "Nenhuma fatura encontrada.",
    viewOriginalDoc: "Visualizar documento original",
    na: "N/A",
  },
  es: {
    sifenStatus: {
      PENDING: "Pendiente Sifen",
      APPROVED: "Aprobado Sifen",
      REJECTED: "Rechazado Sifen",
      CANCELLED: "Cancelado Sifen",
      RECIBO_COMUN: "Recibo Común",
    } as Record<string, string>,
    searchPlaceholder: "Buscar por cliente o número...",
    type: "Tipo",
    allTypes: "Todos los Tipos",
    sales: "Venta",
    purchase: "Compra",
    status: "Estado",
    allStatus: "Todos los Estados",
    pending: "Pendiente",
    approved: "Aprobada",
    cancelled: "Cancelada",
    sifenStatusLabel: "Estado SET (Sifen)",
    allSifen: "Todos Sifen",
    notSent: "No enviado",
    colCustomer: "Cliente",
    colInvoice: "Factura",
    colDate: "Fecha",
    colSifenStatus: "Estado SET",
    colTotal: "Total",
    colActions: "Acciones",
    empty: "No se encontraron facturas.",
    viewOriginalDoc: "Ver documento original",
    na: "N/A",
  },
} as const;

export function InvoiceList({ invoices, tenantId }: { invoices: any[]; tenantId: string }) {
  const { language } = useLanguage();
  const s = STRINGS[language];
  const dateLocale = language === "pt" ? ptBR : esLocale;
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSifenStatus, setSelectedSifenStatus] = useState("all");

  const [sortField, setSortField] = useState<"type" | "customer" | "documentNumber" | "issuedAt" | "status" | "sifenStatus" | "totalAmount" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: "type" | "customer" | "documentNumber" | "issuedAt" | "status" | "sifenStatus" | "totalAmount") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const term = search.toLowerCase();
    const customerName = inv.customer?.name?.toLowerCase() || "";
    const supplierName = inv.supplier?.name?.toLowerCase() || "";
    const docNum = inv.documentNumber?.toLowerCase() || "";

    const matchesSearch =
      customerName.includes(term) ||
      supplierName.includes(term) ||
      docNum.includes(term);

    const matchesType =
      selectedType === "all" || inv.type === selectedType;

    const matchesStatus =
      selectedStatus === "all" || inv.status === selectedStatus;

    const matchesSifenStatus =
      selectedSifenStatus === "all" ||
      (selectedSifenStatus === "none" && !inv.sifenStatus) ||
      (selectedSifenStatus === "RECIBO_COMUN" && inv.sifenStatus === "RECIBO_COMUN") ||
      (selectedSifenStatus === "APPROVED" && inv.sifenStatus === "APPROVED") ||
      (selectedSifenStatus === "REJECTED" && inv.sifenStatus === "REJECTED") ||
      (selectedSifenStatus === "PENDING" && inv.sifenStatus === "PENDING");

    return matchesSearch && matchesType && matchesStatus && matchesSifenStatus;
  });

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (!sortField) return 0;

    let aVal: any;
    let bVal: any;

    if (sortField === "customer") {
      aVal = (a.customer?.name || a.supplier?.name || "").toLowerCase();
      bVal = (b.customer?.name || b.supplier?.name || "").toLowerCase();
    } else if (sortField === "totalAmount") {
      aVal = Number(a.totalAmount);
      bVal = Number(b.totalAmount);
    } else if (sortField === "issuedAt") {
      aVal = new Date(a.issuedAt).getTime();
      bVal = new Date(b.issuedAt).getTime();
    } else {
      aVal = String(a[sortField] || "").toLowerCase();
      bVal = String(b[sortField] || "").toLowerCase();
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
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Input
            placeholder={s.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs h-[38px] rounded-lg border-border bg-card"
          />
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[140px] h-[38px] rounded-lg bg-card">
              <SelectValue placeholder={s.type} />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">{s.allTypes}</SelectItem>
              <SelectItem value="SALES">{s.sales}</SelectItem>
              <SelectItem value="PURCHASE">{s.purchase}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px] h-[38px] rounded-lg bg-card">
              <SelectValue placeholder={s.status} />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">{s.allStatus}</SelectItem>
              <SelectItem value="PENDING">{s.pending}</SelectItem>
              <SelectItem value="APPROVED">{s.approved}</SelectItem>
              <SelectItem value="CANCELLED">{s.cancelled}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedSifenStatus} onValueChange={setSelectedSifenStatus}>
            <SelectTrigger className="w-[160px] h-[38px] rounded-lg bg-card">
              <SelectValue placeholder={s.sifenStatusLabel} />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">{s.allSifen}</SelectItem>
              <SelectItem value="none">{s.notSent}</SelectItem>
              <SelectItem value="RECIBO_COMUN">{s.sifenStatus.RECIBO_COMUN}</SelectItem>
              <SelectItem value="PENDING">{s.sifenStatus.PENDING}</SelectItem>
              <SelectItem value="APPROVED">{s.sifenStatus.APPROVED}</SelectItem>
              <SelectItem value="REJECTED">{s.sifenStatus.REJECTED}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("type")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.type}{renderSortIndicator("type")}
              </TableHead>
              <TableHead onClick={() => handleSort("customer")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.colCustomer}{renderSortIndicator("customer")}
              </TableHead>
              <TableHead onClick={() => handleSort("documentNumber")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.colInvoice}{renderSortIndicator("documentNumber")}
              </TableHead>
              <TableHead onClick={() => handleSort("issuedAt")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.colDate}{renderSortIndicator("issuedAt")}
              </TableHead>
              <TableHead onClick={() => handleSort("status")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.status}{renderSortIndicator("status")}
              </TableHead>
              <TableHead onClick={() => handleSort("sifenStatus")} className="cursor-pointer hover:bg-muted/50 select-none">
                {s.colSifenStatus}{renderSortIndicator("sifenStatus")}
              </TableHead>
              <TableHead onClick={() => handleSort("totalAmount")} className="text-right cursor-pointer hover:bg-muted/50 select-none">
                {s.colTotal}{renderSortIndicator("totalAmount")}
              </TableHead>
              <TableHead className="text-right">{s.colActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {s.empty}
                </TableCell>
              </TableRow>
            ) : (
              sortedInvoices.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Badge variant={inv.type === "PURCHASE" ? "default" : "secondary"}>
                      {inv.type === "PURCHASE" ? s.purchase : s.sales}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {inv.customer?.name || inv.supplier?.name || s.na}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-center gap-1.5">
                      <span>{inv.documentNumber || "-"}</span>
                      {inv.attachmentUrl && (
                        <a
                          href={inv.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={s.viewOriginalDoc}
                          className="inline-flex text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(inv.issuedAt), "dd/MM/yyyy", {
                      locale: dateLocale,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inv.status === "APPROVED"
                          ? "default"
                          : inv.status === "CANCELLED"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {inv.status === "APPROVED"
                        ? s.approved
                        : inv.status === "CANCELLED"
                        ? s.cancelled
                        : s.pending}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inv.sifenStatus === "APPROVED"
                          ? "default"
                          : inv.sifenStatus === "REJECTED"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {s.sifenStatus[inv.sifenStatus] || inv.sifenStatus || s.notSent}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: inv.currency || "PYG",
                      minimumFractionDigits: inv.currency === "PYG" ? 0 : 2,
                      maximumFractionDigits: inv.currency === "PYG" ? 0 : 2,
                    }).format(Number(inv.totalAmount))}
                  </TableCell>
                  <TableCell className="text-right">
                    <InvoiceActions invoice={inv} tenantId={tenantId} />
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
