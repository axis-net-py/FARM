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
import { Plus, Trash2, MapPin, Compass, Loader2 } from "lucide-react";
import { createField, deleteField } from "@/app/actions/fields";
import { toast } from "sonner";

interface Field {
  id: string;
  name: string;
  areaHectares: any;
  soilType: string | null;
  status: string;
  createdAt: Date;
}

export function FieldList({ initialFields, tenantId }: { initialFields: Field[]; tenantId: string }) {
  const [fields, setFields] = useState<Field[]>(initialFields);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [soilType, setSoilType] = useState("Argiloso");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!name || !area) {
      toast.error("Preencha o nome e a área do talhão");
      return;
    }

    startTransition(async () => {
      try {
        const areaVal = parseFloat(area);
        if (isNaN(areaVal) || areaVal <= 0) {
          toast.error("Área deve ser um número positivo");
          return;
        }

        const newField = await createField(tenantId, {
          name,
          areaHectares: areaVal,
          soilType,
        });

        // @ts-ignore
        setFields((prev) => [newField, ...prev]);
        toast.success(`Talhão "${name}" adicionado com sucesso!`);
        setName("");
        setArea("");
        setIsOpen(false);
      } catch (err: any) {
        toast.error(err.message || "Erro ao adicionar talhão");
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Deseja realmente deletar o talhão "${name}"?`)) return;

    startTransition(async () => {
      try {
        await deleteField(tenantId, id);
        setFields((prev) => prev.filter((f) => f.id !== id));
        toast.success(`Talhão "${name}" removido.`);
      } catch (err: any) {
        toast.error(err.message || "Erro ao deletar talhão");
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
              <Plus className="h-4 w-4" /> Novo Talhão
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-8 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-heading text-primary">
                Adicionar Novo Talhão
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cadastre um talhão/área da fazenda especificando as dimensões.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Talhão</Label>
                <Input
                  id="name"
                  placeholder="Ex: Talhão Norte"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-full bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Área em Hectares (ha)</Label>
                <Input
                  id="area"
                  type="number"
                  placeholder="Ex: 150"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="rounded-full bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="soilType">Tipo de Solo</Label>
                <select
                  id="soilType"
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Argiloso">Argiloso</option>
                  <option value="Arenoso">Arenoso</option>
                  <option value="Misto">Misto</option>
                  <option value="Humoso">Humoso</option>
                </select>
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

      {/* Fields Table */}
      <Card className="rounded-[2.5rem] border-slate-200/50 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 dark:bg-slate-800/30">
                <TableHead className="font-bold">Nome do Talhão</TableHead>
                <TableHead className="font-bold">Área (ha)</TableHead>
                <TableHead className="font-bold">Tipo de Solo</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum talhão cadastrado ainda. Clique em "Novo Talhão" para adicionar.
                  </TableCell>
                </TableRow>
              ) : (
                fields.map((field) => (
                  <TableRow key={field.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                    <TableCell className="font-medium flex items-center gap-2">
                      <Compass className="h-4 w-4 text-primary shrink-0" />
                      {field.name}
                    </TableCell>
                    <TableCell className="font-mono">{Number(field.areaHectares).toFixed(1)} ha</TableCell>
                    <TableCell>{field.soilType || "Argiloso"}</TableCell>
                    <TableCell>
                      <Badge variant={field.status === "active" ? "default" : "secondary"} className="rounded-full">
                        {field.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(field.id, field.name)}
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
