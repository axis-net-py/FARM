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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createProduct, updateProduct, deleteProduct } from "@/app/actions/product";
import type { Product } from "@prisma/client";
import { useLanguage } from "@/components/language-provider";

const STRINGS = {
  pt: {
    edit: "Editar",
    newProduct: "Novo Produto",
    editTitle: "Editar Produto",
    editDescription: "Atualize os dados do produto",
    newDescription: "Cadastre um novo produto no sistema.",
    sku: "SKU",
    skuPlaceholder: "Ex: PROD-001",
    category: "Categoria",
    product: "Produto (Físico)",
    service: "Serviço (Sem Estoque)",
    currency: "Moeda",
    unit: "Unidade",
    unitPlaceholder: "Ex: un, kg, lt",
    name: "Nome",
    namePlaceholder: "Ex: Produto A",
    price: "Preço",
    pricePlaceholder: "Ex: 50000",
    cost: "Custo",
    costPlaceholder: "Ex: 35000",
    minStock: "Estoque Mínimo",
    minStockPlaceholder: "Ex: 10",
    active: "Ativo",
    tags: "Tags / Filtros (Separados por vírgula)",
    tagsPlaceholder: "Ex: eletronicos, importado, novo",
    delete: "Excluir",
    cancel: "Cancelar",
    saving: "Salvando...",
    update: "Atualizar",
    register: "Registrar Produto",
    deleteConfirm: "Tem certeza que deseja excluir este produto? Se ele já tiver faturas ou movimentações de estoque, será arquivado em vez de apagado (o histórico fiscal é preservado).",
    deleteErr: "Erro ao excluir produto",
    archivedMsg: "Produto arquivado: ele tem faturas ou movimentações vinculadas, então o cadastro foi desativado para preservar o histórico fiscal.",
    saveErr: "Erro ao salvar produto",
  },
  es: {
    edit: "Editar",
    newProduct: "Nuevo Producto",
    editTitle: "Editar Producto",
    editDescription: "Actualice los datos del producto",
    newDescription: "Registre un nuevo producto en el sistema.",
    sku: "SKU",
    skuPlaceholder: "Ej: PROD-001",
    category: "Categoría",
    product: "Producto (Físico)",
    service: "Servicio (Sin Stock)",
    currency: "Moneda",
    unit: "Unidad",
    unitPlaceholder: "Ej: un, kg, lt",
    name: "Nombre",
    namePlaceholder: "Ej: Producto A",
    price: "Precio",
    pricePlaceholder: "Ej: 50000",
    cost: "Costo",
    costPlaceholder: "Ej: 35000",
    minStock: "Stock Mínimo",
    minStockPlaceholder: "Ej: 10",
    active: "Activo",
    tags: "Etiquetas / Filtros (Separados por coma)",
    tagsPlaceholder: "Ej: electronicos, importado, nuevo",
    delete: "Eliminar",
    cancel: "Cancelar",
    saving: "Guardando...",
    update: "Actualizar",
    register: "Registrar Producto",
    deleteConfirm: "¿Está seguro que desea eliminar este producto? Si ya tiene facturas o movimientos de stock, será archivado en lugar de eliminado (el historial fiscal se preserva).",
    deleteErr: "Error al eliminar producto",
    archivedMsg: "Producto archivado: tiene facturas o movimientos vinculados, por eso el registro fue desactivado para preservar el historial fiscal.",
    saveErr: "Error al guardar producto",
  },
} as const;

export function ProductSheet({
  tenantId,
  product,
  onSuccess,
}: {
  tenantId: string;
  product?: Product;
  onSuccess?: () => void;
}) {
  const { language } = useLanguage();
  const s = STRINGS[language];
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!product;

  const [sku, setSku] = useState(product?.sku ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product?.price ? Number(product.price) : 0);
  const [cost, setCost] = useState(product?.cost ? Number(product.cost) : 0);
  const [unit, setUnit] = useState(product?.unit ?? "un");
  const [minStock, setMinStock] = useState(product?.minStock ? Number(product.minStock) : 0);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [tags, setTags] = useState(product?.tags ?? "");
  const [isService, setIsService] = useState(product?.isService ?? false);
  const [currency, setCurrency] = useState<"PYG" | "USD" | "BRL">(product?.currency ?? "PYG");

  async function handleDelete() {
    if (!product) return;
    const confirmDelete = window.confirm(s.deleteConfirm);
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const res = await deleteProduct(product.id);
      if (res?.archived) alert(s.archivedMsg);
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
    if (!sku || !name) return;

    setLoading(true);
    try {
      if (isEdit && product) {
         await updateProduct(product.id, {
          sku,
          name,
          price,
          cost,
          unit,
          minStock,
          isActive,
          tags,
          isService,
          currency,
        });
      } else {
        await createProduct({
          sku,
          name,
          price,
          cost,
          unit,
          minStock,
          tags,
          isService,
          currency,
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
          {isEdit ? s.edit : s.newProduct}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[75vw] w-[95vw] glass-pop-up p-0 overflow-hidden">
        <DialogHeader className="text-left space-y-1 p-6 border-b border-border bg-muted/30">
          <DialogTitle className="text-[18px] font-bold tracking-tight text-foreground">
            {isEdit ? s.editTitle : s.newProduct}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground font-medium">
            {isEdit ? s.editDescription : s.newDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.sku}</Label>
              <Input
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder={s.skuPlaceholder}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.category}</Label>
              <Select
                value={isService ? "service" : "product"}
                onValueChange={(val) => setIsService(val === "service")}
              >
                <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[8px]">
                  <SelectItem value="product">{s.product}</SelectItem>
                  <SelectItem value="service">{s.service}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.currency}</Label>
              <Select
                value={currency}
                onValueChange={(val: "PYG" | "USD" | "BRL") => setCurrency(val)}
              >
                <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[8px]">
                  <SelectItem value="PYG">PYG (Gs)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="BRL">BRL (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.unit}</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder={s.unitPlaceholder}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.name}</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={s.namePlaceholder}
              className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.price} ({currency})</Label>
              <Input
                type="number"
                required
                min={0}
                step={currency === "PYG" ? "1" : "0.01"}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder={s.pricePlaceholder}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.cost} ({currency})</Label>
              <Input
                type="number"
                required
                min={0}
                step={currency === "PYG" ? "1" : "0.01"}
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                placeholder={s.costPlaceholder}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {!isService && (
              <div className="space-y-2">
                <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.minStock}</Label>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={minStock}
                  onChange={(e) => setMinStock(Number(e.target.value))}
                  placeholder={s.minStockPlaceholder}
                  className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
                />
              </div>
            )}
            <div className={`space-y-2 flex items-center gap-2 ${isService ? 'pt-2' : 'pt-6'}`}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4"
              />
              <Label className="text-[13px]">{s.active}</Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">{s.tags}</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={s.tagsPlaceholder}
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
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
