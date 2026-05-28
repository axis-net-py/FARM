// SeasonSheet.tsx – dialog component for creating/editing a season
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createSeason, updateSeason } from "@/app/actions/seasons";
import type { Season } from "@/app/(dashboard)/[tenantId]/seasons/SeasonList";

export function SeasonSheet({
  tenantId,
  season,
  onSuccess,
}: {
  tenantId: string;
  season?: Season;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!season;

  const [name, setName] = useState(season?.name ?? "");
  const [crop, setCrop] = useState(season?.crop ?? "Soja");
  const [startDate, setStartDate] = useState(
    season ? season.startDate.split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(season?.endDate?.split("T")[0] ?? "");

  async function handleSubmit() {
    if (!name || !crop || !startDate) return;
    setLoading(true);
    try {
      if (isEdit && season) {
        await updateSeason(tenantId, season.id, {
          name,
          crop,
          startDate,
          endDate: endDate || undefined,
        });
      } else {
        await createSeason(tenantId, {
          name,
          crop,
          startDate,
          endDate: endDate || undefined,
        });
      }
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar safra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="axis-btn-primary h-[32px] px-4 text-[13px] rounded-lg shadow-sm flex items-center gap-2">
          {isEdit ? "Editar Safra" : "Nova Safra"}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border border-border p-0 overflow-hidden rounded-lg shadow-lg">
        <DialogHeader className="text-left space-y-1 p-6 border-b border-border bg-muted/30">
          <DialogTitle className="text-[18px] font-bold tracking-tight text-foreground">
            {isEdit ? "Editar Safra" : "Adicionar Nova Safra"}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground font-medium">
            {isEdit ? "Atualize os dados da safra." : "Cadastre um novo ciclo de cultivo para monitorar custos e colheita."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-6 flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[11px] text-primary uppercase tracking-widest font-bold">Nome da Safra</Label>
            <Input
              id="name"
              placeholder="Ex: Safra de Soja 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background border-border text-[13px] h-[40px] rounded-lg font-medium shadow-sm focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crop" className="text-[11px] text-primary uppercase tracking-widest font-bold">Cultura</Label>
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger className="w-full h-[38px] rounded-lg bg-card border border-border text-foreground text-[13px]">
                <SelectValue placeholder="Selecione a cultura" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="Soja">Soja</SelectItem>
                <SelectItem value="Milho">Milho</SelectItem>
                <SelectItem value="Trigo">Trigo</SelectItem>
                <SelectItem value="Algodão">Algodão</SelectItem>
                <SelectItem value="Sorgo">Sorgo</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-[11px] text-primary uppercase tracking-widest font-bold">Data de Início</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-background border-border text-[13px] h-[40px] rounded-lg font-medium shadow-sm focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-[11px] text-primary uppercase tracking-widest font-bold">Data de Fim (Opcional)</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-background border-border text-[13px] h-[40px] rounded-lg font-medium shadow-sm focus:ring-primary/20"
            />
          </div>
          <div className="pt-4 flex gap-3 justify-end">
            <button type="button" onClick={() => setOpen(false)} className="px-4 h-[40px] rounded-lg text-[14px] font-semibold text-muted-foreground hover:bg-muted transition-all border border-border">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-6 h-[40px] rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-[14px] font-bold disabled:opacity-50 shadow-md active:scale-95">
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-secondary" /> : "Salvar"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
