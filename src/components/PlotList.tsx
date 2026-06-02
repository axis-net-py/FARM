"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlotSheet } from "@/components/PlotSheet";
import type { Plot, Harvest } from "@prisma/client";
import { Input } from "@/components/ui/input";

export function PlotList({
  plots,
  harvests,
  tenantId,
}: {
  plots: (Plot & { harvest?: { name: string } | null })[];
  harvests: Harvest[];
  tenantId: string;
}) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "area" | "currentCrop" | "status" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: "name" | "area" | "currentCrop" | "status") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filtered = plots.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.currentCrop && p.currentCrop.toLowerCase().includes(term)) ||
      (p.harvest?.name && p.harvest.name.toLowerCase().includes(term))
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = a[sortField];
    const bVal = b[sortField];

    let compA: any = aVal;
    let compB: any = bVal;

    if (sortField === "area") {
      compA = Number(aVal || 0);
      compB = Number(bVal || 0);
    } else {
      compA = String(aVal || "").toLowerCase();
      compB = String(bVal || "").toLowerCase();
    }

    if (compA < compB) return sortOrder === "asc" ? -1 : 1;
    if (compA > compB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const renderSortIndicator = (field: typeof sortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? " ▴" : " ▾";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PLANTED":
        return <Badge className="bg-emerald-600 hover:bg-emerald-600/90 text-white border-none">Plantado</Badge>;
      case "PREPARING":
        return <Badge className="bg-sky-600 hover:bg-sky-600/90 text-white border-none">Preparando Solo</Badge>;
      case "FALLOW":
        return <Badge variant="secondary">Pousio</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <Input
          placeholder="Buscar por Nome, Cultura ou Safra..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md h-[38px] rounded-lg border-border bg-card"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("name")} className="cursor-pointer hover:bg-muted/50 select-none">
                Nome/Talhão{renderSortIndicator("name")}
              </TableHead>
              <TableHead onClick={() => handleSort("area")} className="cursor-pointer hover:bg-muted/50 select-none">
                Área{renderSortIndicator("area")}
              </TableHead>
              <TableHead onClick={() => handleSort("currentCrop")} className="cursor-pointer hover:bg-muted/50 select-none">
                Cultura Atual{renderSortIndicator("currentCrop")}
              </TableHead>
              <TableHead onClick={() => handleSort("status")} className="cursor-pointer hover:bg-muted/50 select-none">
                Status{renderSortIndicator("status")}
              </TableHead>
              <TableHead className="select-none">
                Safra Associada
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum talhão cadastrado ou encontrado.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((plot) => (
                <TableRow key={plot.id}>
                  <TableCell className="font-medium">{plot.name}</TableCell>
                  <TableCell>
                    {Number(plot.area).toFixed(2)} {plot.unit === "HECTARE" ? "ha" : "alq"}
                  </TableCell>
                  <TableCell>{plot.currentCrop || "-"}</TableCell>
                  <TableCell>{getStatusBadge(plot.status)}</TableCell>
                  <TableCell>{plot.harvest?.name || <span className="text-muted-foreground italic text-xs">Sem safra</span>}</TableCell>
                  <TableCell className="text-right">
                    <PlotSheet
                      tenantId={tenantId}
                      plot={plot}
                      harvests={harvests}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
