"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LivestockBatchSheet } from "@/components/LivestockBatchSheet";
import type { LivestockBatch } from "@prisma/client";

export function LivestockBatchList({ batches, tenantId }: { batches: LivestockBatch[]; tenantId: string }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lote</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Cabeças</TableHead>
            <TableHead>Peso Médio</TableHead>
            <TableHead>Piquete</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nenhum lote de gado cadastrado.
              </TableCell>
            </TableRow>
          ) : (
            batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell className="font-medium">
                  <Link href={`/${tenantId}/rebanho/${batch.id}`} className="hover:underline hover:text-primary">
                    {batch.name}
                  </Link>
                </TableCell>
                <TableCell className="capitalize">{batch.category}</TableCell>
                <TableCell>{batch.quantity}</TableCell>
                <TableCell>{batch.averageWeight ? `${Number(batch.averageWeight).toLocaleString()} kg` : "-"}</TableCell>
                <TableCell>{batch.location || "-"}</TableCell>
                <TableCell>
                  {batch.status === "ACTIVE" ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600/90 text-white border-none">Ativo</Badge>
                  ) : (
                    <Badge variant="secondary">Vendido</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <LivestockBatchSheet batch={batch} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
