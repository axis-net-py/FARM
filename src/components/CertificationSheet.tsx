"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createCertification, updateCertification, deleteCertification } from "@/app/actions/certification";
import type { Certification } from "@prisma/client";
import { useRouter } from "next/navigation";

export function CertificationSheet({ certification }: { certification?: Certification }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!certification;

  const [name, setName] = useState(certification?.name ?? "");
  const [issuingBody, setIssuingBody] = useState(certification?.issuingBody ?? "");
  const [certificateNumber, setCertificateNumber] = useState(certification?.certificateNumber ?? "");
  const [issueDate, setIssueDate] = useState(
    certification?.issueDate ? new Date(certification.issueDate).toISOString().split("T")[0] : ""
  );
  const [expiryDate, setExpiryDate] = useState(
    certification?.expiryDate ? new Date(certification.expiryDate).toISOString().split("T")[0] : ""
  );
  const [status, setStatus] = useState(certification?.status ?? "ACTIVE");
  const [scope, setScope] = useState(certification?.scope ?? "");
  const [notes, setNotes] = useState(certification?.notes ?? "");

  async function handleDelete() {
    if (!certification) return;
    const confirmDelete = window.confirm("Tem certeza que deseja excluir esta certificação? Esta ação não pode ser desfeita.");
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await deleteCertification(certification.id);
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir certificação");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      const payload = {
        name,
        issuingBody: issuingBody || undefined,
        certificateNumber: certificateNumber || undefined,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        status,
        scope: scope || undefined,
        notes: notes || undefined,
      };
      if (isEdit && certification) {
        await updateCertification(certification.id, payload);
      } else {
        await createCertification(payload);
      }
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar certificação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="axis-btn-primary min-h-[44px] md:h-[32px] px-6 md:px-4 text-[14px] md:text-[13px] flex items-center justify-center font-bold shadow-md cursor-pointer">
          {isEdit ? "Editar" : "Nova Certificação"}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[50vw] w-[95vw] glass-pop-up p-0 overflow-hidden">
        <DialogHeader className="text-left space-y-1 p-6 border-b border-border bg-muted/30">
          <DialogTitle className="text-[18px] font-bold tracking-tight text-foreground">
            {isEdit ? "Editar Certificação" : "Nova Certificação"}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground font-medium">
            Registre certificações da fazenda (orgânico, GLOBALG.A.P, etc).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Nome</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: GLOBALG.A.P"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Órgão Emissor</Label>
              <Input
                value={issuingBody}
                onChange={(e) => setIssuingBody(e.target.value)}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Número</Label>
              <Input
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Emissão</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Validade</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px] focus:ring-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="ACTIVE" className="text-[12px]">Ativa</SelectItem>
                  <SelectItem value="PENDING" className="text-[12px]">Pendente</SelectItem>
                  <SelectItem value="EXPIRED" className="text-[12px]">Vencida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Escopo</Label>
              <Input
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="Ex: Talhões 1-5, Soja"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
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
