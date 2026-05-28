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
import { createField, updateField, deleteField } from "@/app/actions/fields";
import type { Field } from "@/app/(dashboard)/[tenantId]/fields/FieldList";

export function FieldSheet({
  tenantId,
  field,
  onSuccess,
}: {
  tenantId: string;
  field?: Field;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!field;

  const [name, setName] = useState(field?.name ?? "");
  const [area, setArea] = useState(field?.areaHectares?.toString() ?? "");
  const [soilType, setSoilType] = useState(field?.soilType ?? "Argiloso");

  async function handleSubmit() {
    if (!name || !area) return;
    const areaVal = parseFloat(area);
    if (isNaN(areaVal) || areaVal <= 0) {
      alert("Área deve ser um número positivo");
      return;
    }
    setLoading(true);
    try {
      if (isEdit && field) {
        await updateField(tenantId, field.id, {
          name,
          areaHectares: areaVal,
          soilType,
        });
      } else {
        await createField(tenantId, {
          name,
          areaHectares: areaVal,
          soilType,
        });
      }
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar talhão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="axis-btn-primary h-[32px] px-4 text-[13px] rounded-lg shadow-sm flex items-center gap-2">
          {isEdit ? "Editar Talhão" : "Novo Talhão"}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border border-border p-0 overflow-hidden rounded-lg shadow-lg">
        <DialogHeader className="text-left space-y-1 p-6 border-b border-border bg-muted/30">
          <DialogTitle className="text-[18px] font-bold tracking-tight text-foreground">
            {isEdit ? "Editar Talhão" : "Adicionar Novo Talhão"}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground font-medium">
            {isEdit ? "Atualize as informações do talhão." : "Cadastre um novo talhão/área da fazenda."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-6 flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[11px] text-primary uppercase tracking-widest font-bold">Nome do Talhão</Label>
            <Input id="name" placeholder="Ex: Talhão Norte" value={name} onChange={(e) => setName(e.target.value)} className="bg-background border-border text-[13px] h-[40px] rounded-lg font-medium shadow-sm focus:ring-primary/20" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area" className="text-[11px] text-primary uppercase tracking-widest font-bold">Área (ha)</Label>
            <Input id="area" placeholder="Ex: 150" value={area} onChange={(e) => setArea(e.target.value)} className="bg-background border-border text-[13px] h-[40px] rounded-lg font-medium shadow-sm focus:ring-primary/20" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="soil" className="text-[11px] text-primary uppercase tracking-widest font-bold">Tipo de Solo</Label>
            <Select value={soilType} onValueChange={setSoilType}>
              <SelectTrigger className="w-full h-[38px] rounded-lg bg-card border border-border text-foreground text-[13px]">
                <SelectValue placeholder="Selecione o solo" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="Argiloso">Argiloso</SelectItem>
                <SelectItem value="Arenoso">Arenoso</SelectItem>
                <SelectItem value="Misto">Misto</SelectItem>
                <SelectItem value="Humoso">Humoso</SelectItem>
              </SelectContent>
            </Select>
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
