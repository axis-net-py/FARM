"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export type ReportItem = {
  id: string;
  date: string;
  total: number;
  currency: string;
  details?: string;
};

export async function getReportData(
  type: "sales" | "purchases" | "inventory" | "harvests" | "plots" | "vehicles" | "employees",
  startDateStr?: string,
  endDateStr?: string
): Promise<ReportItem[]> {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Tenant não encontrado");
  const tenantId = session.user.tenantId;

  const startDate = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 30 * 86400000);
  const endDate = endDateStr ? new Date(endDateStr) : new Date();

  // Set time bounds correctly
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  if (type === "sales") {
    const invoices = await prisma.commercialInvoice.findMany({
      where: {
        tenantId,
        type: "SALES",
        issuedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { issuedAt: "desc" },
      include: { customer: { select: { name: true } } },
    });

    return invoices.map((inv) => ({
      id: inv.id,
      date: inv.issuedAt.toISOString().split("T")[0],
      total: Number(inv.totalAmount),
      currency: inv.currency as string,
      details: inv.customer?.name || "Cliente Final",
    }));
  } else if (type === "purchases") {
    const invoices = await prisma.commercialInvoice.findMany({
      where: {
        tenantId,
        type: "PURCHASE",
        issuedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { issuedAt: "desc" },
      include: { supplier: { select: { name: true } } },
    });

    return invoices.map((inv) => ({
      id: inv.id,
      date: inv.issuedAt.toISOString().split("T")[0],
      total: Number(inv.totalAmount),
      currency: inv.currency as string,
      details: inv.supplier?.name || "Fornecedor",
    }));
  } else if (type === "inventory") {
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "desc" },
      include: { product: { select: { name: true, sku: true } } },
    });

    return movements.map((mov) => ({
      id: mov.id,
      date: mov.createdAt.toISOString().split("T")[0],
      total: Number(mov.quantity),
      currency: mov.type === "ENTRADA" ? "ENTRADA" : "SAÍDA",
      details: `${mov.product?.sku} - ${mov.product?.name}`,
    }));
  } else if (type === "harvests") {
    const harvests = await prisma.harvest.findMany({
      where: {
        tenantId,
        startDate: {
          gte: startDate,
        },
      },
      orderBy: { startDate: "desc" },
    });

    return harvests.map((h) => {
      const days = Math.ceil((new Date(h.endDate).getTime() - new Date(h.startDate).getTime()) / 86400000);
      return {
        id: h.id,
        date: h.startDate.toISOString().split("T")[0],
        total: days,
        currency: h.cropType,
        details: `${h.name} (${h.status === "ACTIVE" ? "Ativa" : h.status === "COMPLETED" ? "Concluída" : "Planejada"})`,
      };
    });
  } else if (type === "plots") {
    const plots = await prisma.plot.findMany({
      where: {
        tenantId,
      },
      orderBy: { name: "asc" },
    });

    return plots.map((p) => ({
      id: p.id,
      date: p.createdAt.toISOString().split("T")[0],
      total: Number(p.area),
      currency: p.unit,
      details: `${p.name} - Cultura: ${p.currentCrop || "Nenhuma"} (${p.status === "PLANTED" ? "Plantado" : p.status === "FALLOW" ? "Pousio" : "Preparando"})`,
    }));
  } else if (type === "vehicles") {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        tenantId,
      },
      orderBy: { name: "asc" },
    });

    return vehicles.map((v) => ({
      id: v.id,
      date: v.createdAt.toISOString().split("T")[0],
      total: 0,
      currency: v.type,
      details: `${v.name} (Placa: ${v.plate || "S/N"}) - Status: ${v.status === "OPERATIONAL" ? "Operando" : v.status === "MAINTENANCE" ? "Em Manutenção" : "Fora de Serviço"}${v.currentReading ? ` - Leitura: ${Number(v.currentReading).toLocaleString()}` : ""}`,
    }));
  } else {
    // employees
    const employees = await prisma.employee.findMany({
      where: {
        tenantId,
      },
      orderBy: { name: "asc" },
    });

    return employees.map((e) => ({
      id: e.id,
      date: e.createdAt.toISOString().split("T")[0],
      total: 0,
      currency: e.role,
      details: `${e.name} (Contato: ${e.phone || "S/T"}) - Status: ${e.status === "ACTIVE" ? "Ativo" : e.status === "INACTIVE" ? "Inativo" : "Afastado"}`,
    }));
  }
}
