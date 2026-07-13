"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wrench, Fuel } from "lucide-react";
import { createVehicleLog, updateVehicleLog, deleteVehicleLog } from "@/app/actions/vehicleLog";
import type { VehicleLog, Employee, VehicleLogType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function VehicleLogSheet({
  vehicleId,
  employees,
  log,
  trigger,
}: {
  vehicleId: string;
  employees: Employee[];
  log?: VehicleLog;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!log;

  const [type, setType] = useState<VehicleLogType>(log?.type ?? "MAINTENANCE");
  const [date, setDate] = useState(
    log?.date ? new Date(log.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [odometerOrHours, setOdometerOrHours] = useState(log?.odometerOrHours != null ? String(log.odometerOrHours) : "");
  const [employeeId, setEmployeeId] = useState(log?.employeeId ?? "");
  const [notes, setNotes] = useState(log?.notes ?? "");
  const [liters, setLiters] = useState(log?.liters != null ? String(log.liters) : "");
  const [fuelCost, setFuelCost] = useState(log?.fuelCost != null ? String(log.fuelCost) : "");
  const [description, setDescription] = useState(log?.description ?? "");
  const [maintenanceCost, setMaintenanceCost] = useState(log?.maintenanceCost != null ? String(log.maintenanceCost) : "");

  async function handleDelete() {
    if (!log) return;
    const confirmDelete = window.confirm("Excluir este registro? Esta ação não pode ser desfeita.");
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await deleteVehicleLog(log.id);
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir registro");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;

    setLoading(true);
    try {
      const payload = {
        vehicleId,
        type,
        date: new Date(date),
        odometerOrHours: odometerOrHours ? Number(odometerOrHours) : undefined,
        employeeId: employeeId || undefined,
        notes: notes || undefined,
        liters: type === "FUEL" && liters ? Number(liters) : undefined,
        fuelCost: type === "FUEL" && fuelCost ? Number(fuelCost) : undefined,
        description: type === "MAINTENANCE" ? description || undefined : undefined,
        maintenanceCost: type === "MAINTENANCE" && maintenanceCost ? Number(maintenanceCost) : undefined,
      };

      if (isEdit && log) {
        await updateVehicleLog(log.id, payload);
      } else {
        await createVehicleLog(payload);
      }
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar registro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="axis-btn-primary min-h-[44px] md:h-[32px] px-6 md:px-4 text-[14px] md:text-[13px] flex items-center justify-center font-bold shadow-md cursor-pointer">
            Novo Registro
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[50vw] w-[95vw] glass-pop-up p-0 overflow-hidden">
        <DialogHeader className="text-left space-y-1 p-6 border-b border-border bg-muted/30">
          <DialogTitle className="text-[18px] font-bold tracking-tight text-foreground">
            {isEdit ? "Editar Registro" : "Novo Registro"}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground font-medium">
            Registre manutenção ou abastecimento do veículo/máquina.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("MAINTENANCE")}
              className={cn(
                "h-[40px] rounded-[8px] text-[13px] font-bold flex items-center justify-center gap-2 border transition-all",
                type === "MAINTENANCE"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground"
              )}
            >
              <Wrench className="w-4 h-4" /> Manutenção
            </button>
            <button
              type="button"
              onClick={() => setType("FUEL")}
              className={cn(
                "h-[40px] rounded-[8px] text-[13px] font-bold flex items-center justify-center gap-2 border transition-all",
                type === "FUEL"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground"
              )}
            >
              <Fuel className="w-4 h-4" /> Abastecimento
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Data</Label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Horímetro / Odômetro</Label>
              <Input
                type="number"
                step="0.01"
                value={odometerOrHours}
                onChange={(e) => setOdometerOrHours(e.target.value)}
                placeholder="Ex: 1250.5"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
          </div>

          {type === "FUEL" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Litros</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Custo do Combustível</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={fuelCost}
                  onChange={(e) => setFuelCost(e.target.value)}
                  className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Descrição</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Troca de óleo e filtro"
                  className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Custo da Manutenção</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={maintenanceCost}
                  onChange={(e) => setMaintenanceCost(e.target.value)}
                  className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Funcionário</Label>
              <Select value={employeeId || "none"} onValueChange={(v) => setEmployeeId(v === "none" ? "" : v)}>
                <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px] focus:ring-primary/20">
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="none" className="text-[12px]">Não informado</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="text-[12px]">{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="bg-background border-border text-[13px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
            />
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
                {loading ? "Salvando..." : isEdit ? "Atualizar" : "Registrar"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
