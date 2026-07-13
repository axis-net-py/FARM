"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createVehicle, updateVehicle, deleteVehicle } from "@/app/actions/frota";
import type { Vehicle } from "@prisma/client";
import { useRouter } from "next/navigation";

export function VehicleSheet({
  tenantId,
  vehicle,
  onSuccess,
}: {
  tenantId: string;
  vehicle?: Vehicle;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!vehicle;

  const [name, setName] = useState(vehicle?.name ?? "");
  const [type, setType] = useState(vehicle?.type ?? "trator");
  const [plate, setPlate] = useState(vehicle?.plate ?? "");
  const [status, setStatus] = useState(vehicle?.status ?? "OPERATIONAL");

  async function handleDelete() {
    if (!vehicle) return;
    const confirmDelete = window.confirm("Tem certeza que deseja excluir este veículo/maquinário? Esta ação não pode ser desfeita.");
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await deleteVehicle(vehicle.id);
      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir veículo");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !type) return;

    setLoading(true);
    try {
      const payload = {
        name,
        type,
        plate: plate || undefined,
        status,
      };

      if (isEdit && vehicle) {
        await updateVehicle(vehicle.id, payload);
      } else {
        await createVehicle(payload);
      }
      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar veículo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="axis-btn-primary min-h-[44px] md:h-[32px] px-6 md:px-4 text-[14px] md:text-[13px] flex items-center justify-center font-bold shadow-md cursor-pointer">
          {isEdit ? "Editar" : "Novo Veículo"}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[50vw] w-[95vw] glass-pop-up p-0 overflow-hidden">
        <DialogHeader className="text-left space-y-1 p-6 border-b border-border bg-muted/30">
          <DialogTitle className="text-[18px] font-bold tracking-tight text-foreground">
            {isEdit ? "Editar Veículo" : "Novo Veículo / Máquina"}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground font-medium">
            {isEdit ? "Atualize os dados da máquina ou veículo." : "Cadastre maquinários, tratores ou caminhões da fazenda."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Nome / Modelo</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Trator John Deere 7200"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px] focus:ring-primary/20">
                  <SelectValue placeholder="Selecione tipo" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="trator" className="text-[12px]">Trator</SelectItem>
                  <SelectItem value="colheitadeira" className="text-[12px]">Colheitadeira</SelectItem>
                  <SelectItem value="pulverizador" className="text-[12px]">Pulverizador</SelectItem>
                  <SelectItem value="caminhao" className="text-[12px]">Caminhão</SelectItem>
                  <SelectItem value="implemento" className="text-[12px]">Implemento Agrícola</SelectItem>
                  <SelectItem value="outro" className="text-[12px]">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Placa / Chassi / Identificação</Label>
              <Input
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="Ex: ABC1234 ou Chassi"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Status Operacional</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px] focus:ring-primary/20">
                  <SelectValue placeholder="Selecione status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="OPERATIONAL" className="text-[12px]">Operando (Disponível)</SelectItem>
                  <SelectItem value="MAINTENANCE" className="text-[12px]">Em Manutenção</SelectItem>
                  <SelectItem value="OUT_OF_SERVICE" className="text-[12px]">Fora de Serviço</SelectItem>
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
                {loading ? "Salvando..." : isEdit ? "Atualizar" : "Registrar Veículo"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
