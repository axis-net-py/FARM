"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createPlot, updatePlot, deletePlot } from "@/app/actions/talhao";
import type { Plot, Harvest } from "@prisma/client";
import { useRouter } from "next/navigation";

export function PlotSheet({
  tenantId,
  plot,
  harvests = [],
  onSuccess,
}: {
  tenantId: string;
  plot?: Plot;
  harvests?: Harvest[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!plot;

  const [name, setName] = useState(plot?.name ?? "");
  const [area, setArea] = useState(plot?.area ? Number(plot.area) : 0);
  const [unit, setUnit] = useState(plot?.unit ?? "HECTARE");
  const [currentCrop, setCurrentCrop] = useState(plot?.currentCrop ?? "");
  const [status, setStatus] = useState(plot?.status ?? "PLANTED");
  const [harvestId, setHarvestId] = useState(plot?.harvestId ?? "none");

  async function handleDelete() {
    if (!plot) return;
    const confirmDelete = window.confirm("Tem certeza que deseja excluir este talhão? Esta ação não pode ser desfeita.");
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await deletePlot(plot.id);
      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir talhão");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || area <= 0) return;

    setLoading(true);
    try {
      const payload = {
        name,
        area,
        unit,
        currentCrop: currentCrop || undefined,
        status,
        harvestId: harvestId === "none" ? undefined : harvestId,
      };

      if (isEdit && plot) {
        await updatePlot(plot.id, payload);
      } else {
        await createPlot(payload);
      }
      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar talhão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="axis-btn-primary min-h-[44px] md:h-[32px] px-6 md:px-4 text-[14px] md:text-[13px] flex items-center justify-center font-bold shadow-md cursor-pointer">
          {isEdit ? "Editar" : "Novo Talhão"}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[60vw] w-[95vw] glass-pop-up p-0 overflow-hidden">
        <DialogHeader className="text-left space-y-1 p-6 border-b border-border bg-muted/30">
          <DialogTitle className="text-[18px] font-bold tracking-tight text-foreground">
            {isEdit ? "Editar Talhão" : "Novo Talhão"}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground font-medium">
            {isEdit ? "Atualize os dados do talhão." : "Cadastre as informações da área cultivável."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Identificação / Nome</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Talhão A1 - Entrada Norte"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Área</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={area || ""}
                  onChange={(e) => setArea(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Unidade</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px] focus:ring-primary/20">
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="HECTARE" className="text-[12px]">Hectares (ha)</SelectItem>
                    <SelectItem value="ALQUEIRE" className="text-[12px]">Alqueires (alq)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Cultura Atual</Label>
              <Input
                value={currentCrop}
                onChange={(e) => setCurrentCrop(e.target.value)}
                placeholder="Ex: Soja, Milho, Pousio"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Status do Talhão</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px] focus:ring-primary/20">
                  <SelectValue placeholder="Selecione status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="PLANTED" className="text-[12px]">Plantado / Cultivado</SelectItem>
                  <SelectItem value="FALLOW" className="text-[12px]">Pousio / Sem cultura</SelectItem>
                  <SelectItem value="PREPARING" className="text-[12px]">Preparação / Solo exposto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Vincular a Safra</Label>
              <Select value={harvestId} onValueChange={setHarvestId}>
                <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px] focus:ring-primary/20">
                  <SelectValue placeholder="Selecione a Safra" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="none" className="text-[12px]">Nenhuma (Sem vínculo)</SelectItem>
                  {harvests.map((h) => (
                    <SelectItem key={h.id} value={h.id} className="text-[12px]">{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 pt-6 border-t border-border flex justify-between items-center gap-3">
            <div>
              {isEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 h-[40px] rounded-[8px] text-[14px] font-bold disabled:opacity-50 shadow-md active:scale-95 transition-all"
                >
                  Excluir
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 h-[40px] rounded-[8px] text-[14px] font-semibold text-muted-foreground hover:bg-muted transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground px-6 h-[40px] rounded-[8px] hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-[14px] font-bold disabled:opacity-50 shadow-md active:scale-95"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin text-secondary" />}
                {loading ? "Salvando..." : isEdit ? "Atualizar" : "Registrar Talhão"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
