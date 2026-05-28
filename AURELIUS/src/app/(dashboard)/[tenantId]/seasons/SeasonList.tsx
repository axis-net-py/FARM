"use client";

import React, { useState, useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Sprout } from "lucide-react";
import { deleteSeason } from "@/app/actions/seasons";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SeasonSheet } from "@/app/(dashboard)/[tenantId]/seasons/SeasonSheet";

interface Season {
  id: string;
  name: string;
  crop: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
}

export function SeasonList({ initialSeasons, tenantId }: { initialSeasons: Season[]; tenantId: string }) {
  const [seasons, setSeasons] = useState<Season[]>(initialSeasons);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Deseja realmente deletar a safra "${name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteSeason(tenantId, id);
        setSeasons((prev) => prev.filter((s) => s.id !== id));
        toast.success(`Safra "${name}" deletada.`);
      } catch (err: any) {
        toast.error(err.message || "Erro ao deletar safra");
      }
    });
  };

  const refreshSeasons = async () => {
    const res = await fetch(`/api/seasons?tenantId=${tenantId}`);
    const data = await res.json();
    setSeasons(data);
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex justify-between items-center">
        <SeasonSheet tenantId={tenantId} onSuccess={refreshSeasons} />
      </div>

      {/* Seasons Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Nome da Safra</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Cultura</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Data Início</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Data Fim</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Status</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seasons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhuma safra registrada ainda. Clique em "Nova Safra" para adicionar.
                </TableCell>
              </TableRow>
            ) : (
              seasons.map((season) => (
                <TableRow key={season.id} className="hover:bg-muted/30 border-b border-border transition-colors">
                  <TableCell className="font-medium flex items-center gap-2">
                    <Sprout className="h-4 w-4 text-primary shrink-0" />
                    {season.name}
                  </TableCell>
                  <TableCell>{season.crop}</TableCell>
                  <TableCell className="font-mono">
                    {format(new Date(season.startDate), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-mono">
                    {season.endDate ? format(new Date(season.endDate), "dd/MM/yyyy", { locale: ptBR }) : "Em andamento"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={season.status === "active" ? "default" : "secondary"} className="rounded-full">
                      {season.status === "active" ? "Ativa" : "Concluída"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(season.id, season.name)}
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
