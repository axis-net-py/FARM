"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CertificationSheet } from "@/components/CertificationSheet";
import { AlertTriangle } from "lucide-react";
import type { Certification } from "@prisma/client";

function formatDate(date: Date | string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function daysUntil(date: Date | string) {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function CertificationList({ certifications }: { certifications: Certification[] }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Órgão Emissor</TableHead>
            <TableHead>Número</TableHead>
            <TableHead>Validade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {certifications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Nenhuma certificação cadastrada.
              </TableCell>
            </TableRow>
          ) : (
            certifications.map((cert) => {
              const expiringSoon = cert.expiryDate && cert.status === "ACTIVE" && daysUntil(cert.expiryDate) <= 30 && daysUntil(cert.expiryDate) >= 0;
              const expired = cert.expiryDate && daysUntil(cert.expiryDate) < 0 && cert.status !== "EXPIRED";
              return (
                <TableRow key={cert.id}>
                  <TableCell className="font-medium">{cert.name}</TableCell>
                  <TableCell>{cert.issuingBody || "-"}</TableCell>
                  <TableCell>{cert.certificateNumber || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {formatDate(cert.expiryDate)}
                      {(expiringSoon || expired) && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    {cert.status === "ACTIVE" ? (
                      expiringSoon || expired ? (
                        <Badge className="bg-amber-600 hover:bg-amber-600/90 text-white border-none">
                          {expired ? "Vencendo" : "Vence em breve"}
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600/90 text-white border-none">Ativa</Badge>
                      )
                    ) : cert.status === "EXPIRED" ? (
                      <Badge variant="destructive">Vencida</Badge>
                    ) : (
                      <Badge variant="secondary">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <CertificationSheet certification={cert} />
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
