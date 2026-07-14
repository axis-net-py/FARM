"use client";

import { Droplets, Trash2 } from "lucide-react";
import { deleteIrrigationEvent } from "@/app/actions/irrigationEvent";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { IrrigationEvent } from "@prisma/client";

type EventWithEmployee = IrrigationEvent & { employee: { id: string; name: string } | null };

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

const methodLabels: Record<string, string> = {
  pivo: "Pivô Central",
  gotejamento: "Gotejamento",
  aspersao: "Aspersão",
  sulco: "Sulco",
  outro: "Outro",
};

export function IrrigationEventTimeline({ events }: { events: EventWithEmployee[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Excluir este turno de irrigação? Esta ação não pode ser desfeita.");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteIrrigationEvent(id);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir turno");
    } finally {
      setDeletingId(null);
    }
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
        Nenhum turno de irrigação registrado ainda.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div key={event.id} className="rounded-lg border border-border bg-card p-4 hover-lift flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
            <Droplets className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground text-sm">
                {event.method ? methodLabels[event.method] ?? event.method : "Irrigação"}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">{formatDate(event.date)}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
              {event.durationHours != null && <span>{Number(event.durationHours).toLocaleString()} h</span>}
              {event.flowRate != null && <span>Vazão: {Number(event.flowRate).toLocaleString()}</span>}
              {event.volumeApplied != null && <span>Volume: {Number(event.volumeApplied).toLocaleString()}</span>}
              {event.employee && <span>Por: {event.employee.name}</span>}
            </div>
            {event.notes && <div className="text-xs text-muted-foreground mt-1 italic">{event.notes}</div>}
          </div>
          <button
            type="button"
            onClick={() => handleDelete(event.id)}
            disabled={deletingId === event.id}
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
