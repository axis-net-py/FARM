'use server';

import { prismaWithTenant } from '@axis/core/prisma/client';
import { getTenantId } from '@axis/core/lib/tenant';

export interface DashboardStats {
  sales: { total: number; count: number };
  purchases: { total: number };
  lowStockAlerts: number;
  liquidity: number;
}

export interface TrendDataPoint {
  date: string;
  total: number;
}

interface PendingInvoice {
  totalAmount: number;
  currency: string;
}

export async function getDashboardStats(
  dateRange: { from: Date; to: Date }
): Promise<DashboardStats> {
  const tenantId = await getTenantId();

  const [sales, purchases, lowStockResult, pending] = await Promise.all([
    // Sales (paid invoices)
    prismaWithTenant(tenantId).invoice.aggregate({
      where: {
        direction: 'SALE',
        issueDate: { gte: dateRange.from, lte: dateRange.to },
        status: 'APPROVED',
        tenantId,
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),

    // Purchases
    prismaWithTenant(tenantId).invoice.aggregate({
      where: {
        direction: 'PURCHASE',
        issueDate: { gte: dateRange.from, lte: dateRange.to },
        tenantId,
      },
      _sum: { totalAmount: true },
    }),

    // Low stock alerts (currentStock <= minStock)
    prismaWithTenant(tenantId).$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "Product"
      WHERE "isActive" = true
        AND "currentStock" <= "minStock"
        AND "tenantId" = ${tenantId}
    `,

    // Pending invoices (liquidity)
    prismaWithTenant(tenantId).invoice.findMany({
      where: { status: 'PENDING', tenantId },
      select: { totalAmount: true, currency: true },
    }),
  ]);

  const lowStockAlerts = Number((lowStockResult as any)[0]?.count || 0);

  return {
    sales: {
      total: Number(sales._sum.totalAmount || 0),
      count: sales._count.id,
    },
    purchases: {
      total: Number(purchases._sum.totalAmount || 0),
    },
    lowStockAlerts,
    liquidity: pending.reduce((acc: number, curr: { totalAmount: any }) => acc + Number(curr.totalAmount || 0), 0),
  };
}

export async function getTrendData(
  dateRange: { from: Date; to: Date },
  groupBy: 'day' | 'month' = 'day'
): Promise<TrendDataPoint[]> {
  const tenantId = await getTenantId();

  const dateFormat = groupBy === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';

  const result = await prismaWithTenant(tenantId).$queryRaw<TrendDataPoint[]>`
    SELECT
      TO_CHAR("issueDate", ${dateFormat}) as date,
      SUM("totalAmount") as total
    FROM "Invoice"
    WHERE "direction" = 'SALES'
      AND "status" = 'APPROVED'
      AND "issueDate" >= ${dateRange.from}
      AND "issueDate" <= ${dateRange.to}
      AND "tenantId" = ${tenantId}
    GROUP BY date
    ORDER BY date ASC
  `;

  return result.map((item: TrendDataPoint) => ({
    date: item.date,
    total: Number(item.total),
  }));
}

export async function getTopProducts(
  dateRange: { from: Date; to: Date },
  limit: number = 5
): Promise<Array<{ name: string; quantity: number; revenue: number }>> {
  const tenantId = await getTenantId();

  const result = await prismaWithTenant(tenantId).$queryRaw<
    Array<{ name: string; quantity: number; revenue: number }>
  >`
    SELECT
      p."name" as name,
      SUM(ii."quantity") as quantity,
      SUM(ii."totalPrice") as revenue
    FROM "InvoiceItem" ii
    JOIN "Invoice" i ON i."id" = ii."invoiceId"
    JOIN "Product" p ON p."id" = ii."productId"
    WHERE i."direction" = 'SALES'
      AND i."status" = 'APPROVED'
      AND i."issueDate" >= ${dateRange.from}
      AND i."issueDate" <= ${dateRange.to}
      AND i."tenantId" = ${tenantId}
    GROUP BY p."id", p."name"
    ORDER BY revenue DESC
    LIMIT ${limit}
  `;

  return result.map((item: { name: string; quantity: number; revenue: number }) => ({
    name: item.name,
    quantity: Number(item.quantity),
    revenue: Number(item.revenue),
  }));
}
