import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ─── Tenant-scoped Prisma Client ───────────────────────

export function prismaWithTenant(tenantId: string) {
  // Create a proxy that automatically adds tenantId to where clauses
  return new Proxy(prisma, {
    get(target, prop) {
      const value = (target as any)[prop];

      // If it's not a model (doesn't have findMany, etc), return as-is
      if (typeof value !== 'object' || value === null) {
        return value;
      }

      // Return a wrapped model that auto-scopes queries
      return new Proxy(value, {
        get(modelTarget, modelProp) {
          const modelValue = (modelTarget as any)[modelProp];

          if (typeof modelValue !== 'function') {
            return modelValue;
          }

          // Wrap query functions to auto-add tenantId
          return async (args: any = {}) => {
            const operation = modelProp as string;

            // Read operations - add tenantId to where
            if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(operation)) {
              args.where = { ...args.where, tenantId };
            }

            // Write operations - add tenantId to data
            if (['create', 'createMany'].includes(operation)) {
              if (Array.isArray(args.data)) {
                args.data = args.data.map((item: any) => ({ ...item, tenantId }));
              } else {
                args.data = { ...args.data, tenantId };
              }
            }

            // Update operations - scope where and prevent tenantId change
            if (['update', 'updateMany', 'upsert'].includes(operation)) {
              args.where = { ...args.where, tenantId };
              if (args.data) {
                delete (args.data as any).tenantId;
              }
            }

            return modelValue.call(modelTarget, args);
          };
        }
      });
    }
  }) as typeof prisma;
}
