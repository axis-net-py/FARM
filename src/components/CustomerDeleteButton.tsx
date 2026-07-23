"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCustomer } from "@/app/actions/customer";
import { useLanguage } from "@/components/language-provider";

const STRINGS = {
  pt: {
    del: "Excluir",
    title: "Excluir cliente",
    confirm: (name: string) =>
      `Excluir "${name}"? Se já tiver faturas vinculadas, será arquivado em vez de apagado (o histórico fiscal é preservado).`,
    archived:
      "Cliente arquivado: ele tem faturas vinculadas, então o cadastro foi desativado para preservar o histórico fiscal.",
    err: "Erro ao excluir cliente",
  },
  es: {
    del: "Eliminar",
    title: "Eliminar cliente",
    confirm: (name: string) =>
      `¿Eliminar "${name}"? Si ya tiene facturas vinculadas, será archivado en lugar de eliminado (el historial fiscal se preserva).`,
    archived:
      "Cliente archivado: tiene facturas vinculadas, por eso el registro fue desactivado para preservar el historial fiscal.",
    err: "Error al eliminar cliente",
  },
} as const;

/**
 * Excluir cliente direto da listagem, sem abrir a ficha de edição.
 * Cliente com histórico fiscal é arquivado pela action, não apagado.
 */
export function CustomerDeleteButton({ customer }: { customer: { id: string; name: string } }) {
  const { language } = useLanguage();
  const s = STRINGS[language];
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (loading) return;
    if (!window.confirm(s.confirm(customer.name))) return;

    setLoading(true);
    try {
      const res = await deleteCustomer(customer.id);
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
