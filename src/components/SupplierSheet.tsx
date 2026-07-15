"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createSupplier, updateSupplier, deleteSupplier } from "@/app/actions/supplier";
import type { Supplier } from "@prisma/client";
import { useLanguage } from "@/components/language-provider";

const STRINGS = {
  pt: {
    newTrigger: "Novo Fornecedor",
    edit: "Editar",
    editTitle: "Editar Fornecedor",
    newTitle: "Novo Fornecedor",
    editDescription: "Atualize os dados do fornecedor",
    newDescription: "Cadastre um novo fornecedor no sistema.",
    tradeName: "Nome Fantasia",
    tradeNamePlaceholder: "Ex: Distribuidora Central",
    businessName: "Razão Social",
    businessNamePlaceholder: "Ex: Distribuidora Central S.A.",
    document: "Documento (RUC/CNPJ)",
    documentPlaceholder: "Ex: 80012345-6 ou CNPJ",
    documentType: "Tipo de Documento",
    documentTypePlaceholder: "Selecione tipo",
    paymentTerms: "Condições de Pagamento",
    paymentTermsPlaceholder: "Ex: 30 dias, Contado",
    category: "Categoria",
    categoryPlaceholder: "Selecione categoria",
    categoryPhysical: "Física",
    categoryLegal: "Jurídica",
    email: "E-mail",
    emailPlaceholder: "fornecedor@exemplo.com",
    phone: "Telefone",
    phonePlaceholder: "+595 991 234 567",
    address: "Endereço",
    addressPlaceholder: "Calle Principal 123",
    city: "Cidade",
    cityPlaceholder: "Asunción",
    country: "País",
    countryPlaceholder: "Selecione país",
    countryPY: "Paraguai (PY)",
    countryBR: "Brasil (BR)",
    active: "Ativo",
    deleteConfirm: "Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita se houver faturas vinculadas.",
    deleteErr: "Erro ao excluir fornecedor",
    saveErr: "Erro ao salvar fornecedor",
    delete: "Excluir",
    cancel: "Cancelar",
    saving: "Salvando...",
    update: "Atualizar",
    register: "Registrar Fornecedor",
  },
  es: {
    newTrigger: "Nuevo Proveedor",
    edit: "Editar",
    editTitle: "Editar Proveedor",
    newTitle: "Nuevo Proveedor",
    editDescription: "Actualice los datos del proveedor",
    newDescription: "Registre un nuevo proveedor en el sistema.",
    tradeName: "Nombre Fantasía",
    tradeNamePlaceholder: "Ej: Distribuidora Central",
    businessName: "Razón Social",
    businessNamePlaceholder: "Ej: Distribuidora Central S.A.",
    document: "Documento (RUC/CNPJ)",
    documentPlaceholder: "Ej: 80012345-6 o CNPJ",
    documentType: "Tipo de Documento",
    documentTypePlaceholder: "Seleccione tipo",
    paymentTerms: "Condiciones de Pago",
    paymentTermsPlaceholder: "Ej: 30 días, Contado",
    category: "Categoría",
    categoryPlaceholder: "Seleccione categoría",
    categoryPhysical: "Física",
    categoryLegal: "Jurídica",
    email: "E-mail",
    emailPlaceholder: "proveedor@ejemplo.com",
    phone: "Teléfono",
    phonePlaceholder: "+595 991 234 567",
    address: "Dirección",
    addressPlaceholder: "Calle Principal 123",
    city: "Ciudad",
    cityPlaceholder: "Asunción",
    country: "País",
    countryPlaceholder: "Seleccione país",
    countryPY: "Paraguay (PY)",
    countryBR: "Brasil (BR)",
    active: "Activo",
    deleteConfirm: "¿Está seguro que desea eliminar este proveedor? Esta acción no se puede deshacer si hay facturas vinculadas.",
    deleteErr: "Error al eliminar proveedor",
    saveErr: "Error al guardar proveedor",
    delete: "Eliminar",
    cancel: "Cancelar",
    saving: "Guardando...",
    update: "Actualizar",
    register: "Registrar Proveedor",
  },
} as const;

export function SupplierSheet({
  tenantId,
  supplier,
  onSuccess,
}: {
  tenantId: string;
  supplier?: Supplier;
  onSuccess?: () => void;
}) {
  const { language } = useLanguage();
  const s = STRINGS[language];
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!supplier;

  const [name, setName] = useState(supplier?.name ?? "");
  const [businessName, setBusinessName] = useState(supplier?.businessName ?? "");
  const [document, setDocument] = useState(supplier?.document ?? "");
  const [documentType, setDocumentType] = useState(supplier?.documentType ?? "");
  const [email, setEmail] = useState(supplier?.email ?? "");
  const [phone, setPhone] = useState(supplier?.phone ?? "");
  const [address, setAddress] = useState(supplier?.address ?? "");
  const [city, setCity] = useState(supplier?.city ?? "");
  const [country, setCountry] = useState(supplier?.country ?? "PY");
  const [category, setCategory] = useState(supplier?.category ?? "fisica");
  const [paymentTerms, setPaymentTerms] = useState(supplier?.paymentTerms ?? "");
  const [isActive, setIsActive] = useState(supplier?.isActive ?? true);

  async function handleDelete() {
    if (!supplier) return;
    const confirmDelete = window.confirm(s.deleteConfirm);
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await deleteSupplier(supplier.id);
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      alert(err.message || s.deleteErr);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      if (isEdit && supplier) {
        await updateSupplier(supplier.id, {
          name,
          businessName,
          document,
          documentType,
          email,
          phone,
          address,
          city,
          country,
          category,
          paymentTerms,
          isActive,
        });
      } else {
        await createSupplier({
          name,
          businessName,
          document,
          documentType,
          email,
          phone,
          address,
          city,
          country,
          category,
          paymentTerms,
        });
      }
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      alert(err.message || s.saveErr);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="axis-btn-primary min-h-[44px] md:h-[32px] px-6 md:px-4 text-[14px] md:text-[13px] flex items-center justify-center font-bold shadow-md cursor-pointer">
          {isEdit ? s.edit : s.newTrigger}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[75vw] w-[95vw] glass-pop-up p-0 overflow-hidden">
        <DialogHeader className="text-left space-y-1 p-6 border-b border-border bg-muted/30">
          <DialogTitle className="text-[18px] font-bold tracking-tight text-foreground">
            {isEdit ? s.editTitle : s.newTitle}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground font-medium">
            {isEdit ? s.editDescription : s.newDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.tradeName}</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={s.tradeNamePlaceholder}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.businessName}</Label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={s.businessNamePlaceholder}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.document}</Label>
              <Input
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder={s.documentPlaceholder}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.documentType}</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px] focus:ring-primary/20">
                  <SelectValue placeholder={s.documentTypePlaceholder} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="RUC" className="text-[12px]">RUC</SelectItem>
                  <SelectItem value="CNPJ" className="text-[12px]">CNPJ</SelectItem>
                  <SelectItem value="CI" className="text-[12px]">CI</SelectItem>
                  <SelectItem value="CPF" className="text-[12px]">CPF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.paymentTerms}</Label>
              <Input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder={s.paymentTermsPlaceholder}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.category}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px] focus:ring-primary/20">
                  <SelectValue placeholder={s.categoryPlaceholder} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="fisica" className="text-[12px]">{s.categoryPhysical}</SelectItem>
                  <SelectItem value="juridica" className="text-[12px]">{s.categoryLegal}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.email}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={s.emailPlaceholder}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.phone}</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={s.phonePlaceholder}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.address}</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={s.addressPlaceholder}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.city}</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={s.cityPlaceholder}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.country}</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px] focus:ring-primary/20">
                  <SelectValue placeholder={s.countryPlaceholder} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="PY" className="text-[12px]">{s.countryPY}</SelectItem>
                  <SelectItem value="BR" className="text-[12px]">{s.countryBR}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4"
              />
              <Label className="text-[13px]">{s.active}</Label>
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
                  {s.delete}
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 h-[40px] rounded-[8px] text-[14px] font-semibold text-muted-foreground hover:bg-muted transition-all"
              >
                {s.cancel}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground px-6 h-[40px] rounded-[8px] hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-[14px] font-bold disabled:opacity-50 shadow-md active:scale-95"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin text-secondary" />}
                {loading ? s.saving : isEdit ? s.update : s.register}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
