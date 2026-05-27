"use client";

import React, { useState, useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Plus, Trash2, Sprout, Calendar, Loader2 } from "lucide-react";
import { createSeason, deleteSeason } from "@/app/actions/seasons";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [crop, setCrop] = useState("Soja");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!name || !crop || !startDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    startTransition(async () => {
      try {
        const newSeason = await createSeason(tenantId, {
          name,
          crop,
          startDate,
          endDate: endDate || undefined,
        });

        // @ts-ignore
        setSeasons((prev) => [newSeason, ...prev]);
        toast.success(`Safra "${name}" adicionada com sucesso!`);
        setName("");
        setEndDate("");
        setIsOpen(false);
      } catch (err: any) {
        toast.error(err.message || "Erro ao adicionar safra");
      }
    });
  };

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

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex justify-between items-center">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-primary hover:bg-primary/95 text-white flex items-center gap-2 shadow-lg shadow-primary/10 border-none h-11">
              <Plus className="h-4 w-4" /> Nova Safra
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-8 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-heading text-primary">
                Adicionar Nova Safra
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cadastre um novo ciclo de cultivo para monitorar custos e colheita.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Safra</Label>
                <Input
                  id="name"
                  placeholder="Ex: Safra de Soja 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-full bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crop">Cultura</Label>
                <select
                  id="crop"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Soja">Soja</option>
                  <option value="Milho">Milho</option>
                  <option value="Trigo">Trigo</option>
                  <option value="Algodão">Algodão</option>
                  <option value="Sorgo">Sorgo</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-full bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Fim (Opcional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-full bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  onClick={handleAdd}
                  disabled={isPending}
                  className="flex-1 rounded-full h-11 bg-primary text-white border-none"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-full h-11"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seasons Table */}
      <Card className="rounded-[2.5rem] border-slate-200/50 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 dark:bg-slate-800/30">
                <TableHead className="font-bold">Nome da Safra</TableHead>
                <TableHead className="font-bold">Cultura</TableHead>
                <TableHead className="font-bold">Data Início</TableHead>
                <TableHead className="font-bold">Data Fim</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Ações</TableHead>
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
                  <TableRow key={season.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                    <TableCell className="font-medium flex items-center gap-2">
                      <Sprout className="h-4 w-4 text-primary shrink-0" />
                      {season.name}
                    </TableCell>
                    <TableCell>{season.crop}</TableCell>
                    <TableCell className="font-mono">
                      {format(new Date(season.startDate), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-mono">
                      {season.endDate
                        ? format(new Date(season.endDate), "dd/MM/yyyy", { locale: ptBR })
                        : "Em andamento"}
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
        </CardContent>
      </Card>
    </div>
  );
}
