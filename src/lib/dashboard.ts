'use server'

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getDashboardStats(dateRange?: { start?: Date; end?: Date }) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Tenant nao encontrado");
  const tenantId = session.user.tenantId;

  const [
    activeHarvestsCount,
    totalHarvestsCount,
    activePlots,
    allPlots,
    operationalVehiclesCount,
    totalVehiclesCount,
    activeEmployeesCount,
    totalEmployeesCount,
  ] = await Promise.all([
    prisma.harvest.count({
      where: { tenantId, status: "ACTIVE" },
    }),
    prisma.harvest.count({
      where: { tenantId },
    }),
    prisma.plot.findMany({
      where: { tenantId, status: "PLANTED" },
      select: { area: true, unit: true },
    }),
    prisma.plot.findMany({
      where: { tenantId },
      select: { area: true, unit: true },
    }),
    prisma.vehicle.count({
      where: { tenantId, status: "OPERATIONAL" },
    }),
    prisma.vehicle.count({
      where: { tenantId },
    }),
    prisma.employee.count({
      where: { tenantId, status: "ACTIVE" },
    }),
    prisma.employee.count({
      where: { tenantId },
    }),
  ]);

  const activeArea = { HECTARE: 0, ALQUEIRE: 0 };
  for (const plot of activePlots) {
    const val = Number(plot.area || 0);
    if (plot.unit === "ALQUEIRE") {
      activeArea.ALQUEIRE += val;
    } else {
      activeArea.HECTARE += val;
    }
  }

  const totalArea = { HECTARE: 0, ALQUEIRE: 0 };
  for (const plot of allPlots) {
    const val = Number(plot.area || 0);
    if (plot.unit === "ALQUEIRE") {
      totalArea.ALQUEIRE += val;
    } else {
      totalArea.HECTARE += val;
    }
  }

  return {
    activeHarvests: activeHarvestsCount,
    totalHarvests: totalHarvestsCount,
    activeArea,
    totalArea,
    operationalVehicles: operationalVehiclesCount,
    totalVehicles: totalVehiclesCount,
    activeEmployees: activeEmployeesCount,
    totalEmployees: totalEmployeesCount,
  };
}

export async function getTrendData(dateRange?: { start?: Date; end?: Date }) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Tenant nao encontrado");
  const tenantId = session.user.tenantId;

  const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateRange?.end || new Date();

  const invoices = await prisma.commercialInvoice.findMany({
    where: { tenantId, status: "APPROVED", issuedAt: { gte: startDate, lte: endDate } },
    orderBy: { issuedAt: "asc" },
    select: { issuedAt: true, totalAmount: true },
  });

  const grouped: Record<string, number> = {};
  for (const inv of invoices) {
    const date = inv.issuedAt.toISOString().split("T")[0];
    grouped[date] = (grouped[date] || 0) + Number(inv.totalAmount);
  }

  return Object.entries(grouped).map(([date, total]) => ({ date, total }));
}

export async function getTopProducts(dateRange?: { start?: Date; end?: Date }, limit = 5) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Tenant nao encontrado");
  const tenantId = session.user.tenantId;

  const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateRange?.end || new Date();

  const items = await prisma.invoiceItem.findMany({
    where: {
      commercialInvoice: { tenantId, status: "APPROVED", issuedAt: { gte: startDate, lte: endDate } },
    },
    include: { product: true },
  });

  const grouped: Record<string, { name: string; quantity: number; revenue: number }> = {};
  for (const item of items) {
    if (!item.product) continue;
    const existing = grouped[item.product.id] || { name: item.product.name, quantity: 0, revenue: 0 };
    existing.quantity += Number(item.quantity);
    existing.revenue += Number(item.totalPrice);
    grouped[item.product.id] = existing;
  }

  return Object.values(grouped)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getRecentContracts(limit = 5) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Tenant nao encontrado");
  const tenantId = session.user.tenantId;

  const contracts = await prisma.contract.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { harvest: true }
  });

  return contracts.map(c => ({
    ...c,
    quantity: Number(c.quantity),
    pricePerUnit: Number(c.pricePerUnit),
  }));
}

export async function getPlotsBreakdown() {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Tenant nao encontrado");
  const tenantId = session.user.tenantId;

  const plots = await prisma.plot.findMany({
    where: { tenantId },
    select: { area: true, unit: true, status: true, currentCrop: true }
  });

  // Calculate areas by status
  const byStatus: Record<string, number> = { PLANTED: 0, FALLOW: 0, PREPARING: 0 };
  const byCrop: Record<string, number> = {};

  for (const p of plots) {
    const areaVal = Number(p.area || 0);
    // Convert alqueires to hectares for standardized metrics breakdown
    const areaInHectares = p.unit === "ALQUEIRE" ? areaVal * 2.42 : areaVal;

    byStatus[p.status] = (byStatus[p.status] || 0) + areaInHectares;
    
    if (p.status === "PLANTED" && p.currentCrop) {
      const crop = p.currentCrop.toLowerCase();
      byCrop[crop] = (byCrop[crop] || 0) + areaInHectares;
    } else if (p.status === "FALLOW") {
      byCrop["pousio"] = (byCrop["pousio"] || 0) + areaInHectares;
    } else if (p.status === "PREPARING") {
      byCrop["preparação"] = (byCrop["preparação"] || 0) + areaInHectares;
    }
  }

  return {
    byStatus: Object.entries(byStatus).map(([status, area]) => ({ status, area })),
    byCrop: Object.entries(byCrop).map(([crop, area]) => ({ crop, area }))
  };
}

