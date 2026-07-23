"use client";

import { Printer, Pencil, Trash2, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CommercialInvoiceSheet } from "@/components/CommercialInvoiceSheet";
import { deletePurchaseInvoice } from "@/app/actions/invoice";
import { useLanguage } from "@/components/language-provider";

const STRINGS = {
  pt: {
    edit: "Editar",
    print: "Imprimir",
    del: "Excluir",
    delDisabled: "Faturas de venda são documentos fiscais e não podem ser excluídas",
    confirm: "Excluir definitivamente esta fatura de compra? O estoque e os lançamentos contábeis serão revertidos. Esta ação não pode ser desfeita.",
    err: "Erro ao excluir a fatura.",
  },
  es: {
    edit: "Editar",
    print: "Imprimir",
    del: "Eliminar",
    delDisabled: "Las facturas de venta son documentos fiscales y no pueden eliminarse",
    confirm: "¿Eliminar definitivamente esta factura de compra? El stock y los asientos contables se revertirán. Esta acción no se puede deshacer.",
    err: "Error al eliminar la factura.",
  },
} as const;

interface InvoiceActionsProps {
  invoice: any;
  tenantId: string;
}

export function InvoiceActions({ invoice, tenantId }: InvoiceActionsProps) {
  const { language } = useLanguage();
  const s = STRINGS[language];
  const [printing, setPrinting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const router = useRouter();

  // Exclusão definitiva só para faturas de COMPRA.
  // Faturas de venda são documentos fiscais de saída — não se apagam.
  const canDelete = invoice.type === "PURCHASE";

  const handleDelete = async () => {
    if (!canDelete || cancelling) return;
    if (!window.confirm(s.confirm)) return;
    setCancelling(true);
    try {
      await deletePurchaseInvoice(invoice.id);
      router.refresh();
    } catch (err: any) {
      alert(err.message || s.err);
    } finally {
      setCancelling(false);
    }
  };

  const isSifen = !!invoice.sifenStatus;
  const a4Url = isSifen
    ? `/api/v1/invoices/${invoice.id}/generate`
    : `/api/invoices/${invoice.id}/pdf`;
  const receiptUrl = `/api/invoices/${invoice.id}/receipt`;

  const handlePrint = (url: string) => {
    setPrinting(true);
    // Create hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.visibility = "hidden";
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Direct printing failed, opening in new tab", e);
        window.open(url, "_blank");
      } finally {
        setPrinting(false);
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 5000);
      }
    };

    iframe.onerror = () => {
      console.error("Failed to load PDF in iframe, opening in new tab");
      window.open(url, "_blank");
      setPrinting(false);
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    };
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <CommercialInvoiceSheet
        tenantId={tenantId}
        invoice={invoice}
        trigger={
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs flex items-center gap-1.5 bg-card hover:bg-accent border-border"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{s.edit}</span>
          </Button>
        }
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={printing}
            className="h-8 px-2.5 text-xs flex items-center gap-1.5 bg-card hover:bg-accent border-border"
          >
            {printing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Printer className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span>{s.print}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handlePrint(a4Url)}>A4</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePrint(receiptUrl)}>80mm</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        disabled={!canDelete || cancelling}
        onClick={handleDelete}
        title={!canDelete ? s.delDisabled : undefined}
        className="h-8 px-2.5 text-xs flex items-center gap-1.5 bg-card hover:bg-destructive/10 hover:text-destructive border-border disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-inherit"
      >
        {cancelling ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
        )}
        <span>{s.del}</span>
      </Button>
    </div>
  );
}
