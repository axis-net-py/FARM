"use client";

import { useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VehicleSheet } from "@/components/VehicleSheet";
import type { Vehicle } from "@prisma/client";
import { Input } from "@/components/ui/input";

export function VehicleList({ vehicles, tenantId }: { vehicles: Vehicle[]; tenantId: string }) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "type" | "plate" | "status" | "currentReading" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: "name" | "type" | "plate" | "status" | "currentReading") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filtered = vehicles.filter((v) => {
    const term = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(term) ||
      v.type.toLowerCase().includes(term) ||
      (v.plate && v.plate.toLowerCase().includes(term))
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = a[sortField];
    const bVal = b[sortField];

    let compA: any = aVal;
    let compB: any = bVal;

    if (sortField === "currentReading") {
      compA = aVal ? Number(aVal) : 0;
      compB = bVal ? Number(bVal) : 0;
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
      case "OPERATIONAL":
        return <Badge className="bg-emerald-600 hover:bg-emerald-600/90 text-white border-none">Operacional</Badge>;
      case "MAINTENANCE":
        return <Badge className="bg-amber-600 hover:bg-amber-600/90 text-white border-none">Manutenção</Badge>;
      case "OUT_OF_SERVICE":
        return <Badge variant="destructive">Fora de Serviço</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <Input
          placeholder="Buscar por Nome, Tipo ou Placa..."
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
                Modelo/Nome{renderSortIndicator("name")}
              </TableHead>
              <TableHead onClick={() => handleSort("type")} className="cursor-pointer hover:bg-muted/50 select-none">
                Tipo{renderSortIndicator("type")}
              </TableHead>
              <TableHead onClick={() => handleSort("plate")} className="cursor-pointer hover:bg-muted/50 select-none">
                Placa/ID{renderSortIndicator("plate")}
              </TableHead>
              <TableHead onClick={() => handleSort("status")} className="cursor-pointer hover:bg-muted/50 select-none">
                Status{renderSortIndicator("status")}
              </TableHead>
              <TableHead onClick={() => handleSort("currentReading")} className="cursor-pointer hover:bg-muted/50 select-none">
                Leitura Atual{renderSortIndicator("currentReading")}
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum veículo ou maquinário cadastrado ou encontrado.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">
                    <Link href={`/${tenantId}/frota/${vehicle.id}`} className="hover:underline hover:text-primary">
                      {vehicle.name}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{vehicle.type}</TableCell>
                  <TableCell>{vehicle.plate ?? "-"}</TableCell>
                  <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                  <TableCell>{vehicle.currentReading ? Number(vehicle.currentReading).toLocaleString() : "-"}</TableCell>
                  <TableCell className="text-right">
                    <VehicleSheet
                      tenantId={tenantId}
                      vehicle={vehicle}
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
