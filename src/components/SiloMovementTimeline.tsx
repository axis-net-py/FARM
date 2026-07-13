"use client";

import { ArrowDownToLine, ArrowUpFromLine, Trash2 } from "lucide-react";
import { deleteSiloMovement } from "@/app/actions/siloMovement";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SiloMovement } from "@prisma/client";

type MovementWithRelations = SiloMovement & {
  harvest: { id: string; name: string } | null;
  contract: { id: string; contractNumber: string } | null;
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function SiloMovementTimeline({ movements, unit }: { movements: MovementWithRelations[]; unit: string }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Excluir este movimento? O estoque do silo será ajustado de volta. Esta ação não pode ser desfeita.");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteSiloMovement(id);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir movimento");
    } finally {
      setDeletingId(null);
    }
  }

  if (movements.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
        Nenhum movimento registrado ainda.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {movements.map((m) => (
        <div key={m.id} className="rounded-lg border border-border bg-card p-4 hover-lift flex items-start gap-3">
          <div
            className={
              m.type === "IN"
                ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400"
            }
          >
            {m.type === "IN" ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground text-sm">
                {m.type === "IN" ? "Entrada" : "Saída"} · {Number(m.quantity).toLocaleString()} {unit}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">{formatDate(m.date)}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
              {m.harvest && <span>Safra: {m.harvest.name}</span>}
              {m.contract && <span>Contrato: {m.contract.contractNumber}</span>}
              {m.moisture != null && <span>Umidade: {Number(m.moisture).toLocaleString()}%</span>}
              {m.qualityGrade && <span>{m.qualityGrade}</span>}
            </div>
            {m.notes && <div className="text-xs text-muted-foreground mt-1 italic">{m.notes}</div>}
          </div>
          <button
            type="button"
            onClick={() => handleDelete(m.id)}
            disabled={deletingId === m.id}
            className="shrink-0 p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
