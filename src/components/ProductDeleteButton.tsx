"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/app/actions/product";
import { useLanguage } from "@/components/language-provider";

const STRINGS = {
  pt: {
    del: "Excluir",
    title: "Excluir produto",
    confirm: (name: string) =>
      `Excluir "${name}"? Se ele já tiver faturas ou movimentações de estoque, será arquivado em vez de apagado (o histórico fiscal é preservado).`,
    archived:
      "Produto arquivado: ele tem faturas ou movimentações vinculadas, então o cadastro foi desativado para preservar o histórico fiscal.",
    err: "Erro ao excluir produto",
  },
  es: {
    del: "Eliminar",
    title: "Eliminar producto",
    confirm: (name: string) =>
      `¿Eliminar "${name}"? Si ya tiene facturas o movimientos de stock, será archivado en lugar de eliminado (el historial fiscal se preserva).`,
    archived:
      "Producto archivado: tiene facturas o movimientos vinculados, por eso el registro fue desactivado para preservar el historial fiscal.",
    err: "Error al eliminar producto",
  },
} as const;

/**
 * Excluir produto direto da listagem, sem abrir a ficha de edição.
 * Produto com histórico fiscal é arquivado pela action, não apagado.
 */
export function ProductDeleteButton({ product }: { product: { id: string; name: string } }) {
  const { language } = useLanguage();
  const s = STRINGS[language];
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (loading) return;
    if (!window.confirm(s.confirm(product.name))) return;

    setLoading(true);
    try {
      const res = await deleteProduct(product.id);
      if (res?.archived) alert(s.archived);
      router.refresh();
    } catch (err: any) {
      alert(err.message || s.err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={handleDelete}
      title={s.title}
      className="h-8 px-2.5 text-xs flex items-center gap-1.5 bg-card hover:bg-destructive/10 hover:text-destructive border-border"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
      )}
      <span>{s.del}</span>
    </Button>
  );
}
