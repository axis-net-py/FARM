"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SiloSheet } from "@/components/SiloSheet";
import type { Silo } from "@prisma/client";

export function SiloList({ silos, tenantId }: { silos: Silo[]; tenantId: string }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Capacidade</TableHead>
            <TableHead>Estoque Atual</TableHead>
            <TableHead>Ocupação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {silos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Nenhum silo cadastrado.
              </TableCell>
            </TableRow>
          ) : (
            silos.map((silo) => {
              const capacity = Number(silo.capacity);
              const stock = Number(silo.currentStock);
              const pct = capacity > 0 ? Math.min(100, Math.round((stock / capacity) * 100)) : 0;
              return (
                <TableRow key={silo.id}>
                  <TableCell className="font-medium">
                    <Link href={`/${tenantId}/silos/${silo.id}`} className="hover:underline hover:text-primary">
                      {silo.name}
                    </Link>
                  </TableCell>
                  <TableCell>{capacity.toLocaleString()} {silo.unit}</TableCell>
                  <TableCell>{stock.toLocaleString()} {silo.unit}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-32">
                      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 90 ? "bg-destructive" : "bg-primary"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <SiloSheet silo={silo} />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
