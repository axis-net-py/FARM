// AXIS ERP - Core Package
// Exports: Prisma client, tenant utils, and auth guard

export { prismaWithTenant, default as prisma } from '../prisma/client';
export type { Session } from './auth/guard';
export { getSession, withAuth, checkPermission, seedDefaultPermissions } from './auth/guard';
export { getTenantId, setTenantId } from './tenant';

// Re-export Prisma enums (value + type) for use in other packages
export {
  AccountType,
  EntryStatus,
  LineType,
  Role,
} from '@prisma/client';

// Re-export Prisma types for use in other packages
export type {
  JournalEntry,
  JournalLine,
  LedgerEntry,
  Account,
  Permission,
  User,
  AuditLog,
  Transaction,
  CommercialInvoice,
  Invoice,
} from '@prisma/client';
