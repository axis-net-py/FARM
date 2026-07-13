"use client";

import { Sprout, Trash2 } from "lucide-react";
import { deletePlotApplication } from "@/app/actions/plotApplication";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PlotApplication } from "@prisma/client";

type ApplicationWithRelations = PlotApplication & {
  product: { id: string; name: string; unit: string };
  employee: { id: string; name: string } | null;
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function PlotApplicationTimeline({ applications }: { applications: ApplicationWithRelations[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Excluir esta aplicação? O estoque do insumo será estornado. Esta ação não pode ser desfeita.");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deletePlotApplication(id);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir aplicação");
    } finally {
      setDeletingId(null);
    }
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
        Nenhuma aplicação registrada ainda.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {applications.map((app) => (
        <div key={app.id} className="rounded-lg border border-border bg-card p-4 hover-lift flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sprout className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground text-sm">{app.product.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">{formatDate(app.date)}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
              <span>{Number(app.quantity).toLocaleString()} {app.product.unit}</span>
              {app.totalCost != null && <span>Custo: {Number(app.totalCost).toLocaleString()}</span>}
              {app.employee && <span>Por: {app.employee.name}</span>}
            </div>
            {app.notes && <div className="text-xs text-muted-foreground mt-1 italic">{app.notes}</div>}
          </div>
          <button
            type="button"
            onClick={() => handleDelete(app.id)}
            disabled={deletingId === app.id}
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
