// Re-export Prisma enums (as values)
export {
  AccountType,
  EntryStatus,
  LineType,
  Role,
  TransactionType,
  Currency,
  SifenStatus,
  TaxType,
  DocumentType,
  DocumentStatus,
  EntityType,
  TaxpayerType,
  IdentityDocumentType,
  InvoiceDirection,
  PaymentTerm,
  InvoiceType,
  InvoiceStatus,
  MovementType,
  LocationType,
  MoveType,
  ContractType,
  TimeOffType,
  TimeOffStatus,
  TaskStatus,
  TaskPriority,
  LeadStatus,
  QuotationStatus,
} from '@prisma/client';

// Re-export Prisma types (interfaces)
export type {
  Account,
  JournalEntry,
  JournalLine,
  LedgerEntry,
  User,
  Tenant,
  AuditLog,
  Transaction,
  Product,
  Customer,
  CommercialInvoice,
  InvoiceItem,
  InventoryMovement,
  Permission,
} from '@prisma/client';

// Re-export actions and utilities
export { prisma, prismaWithTenant } from './prisma/client';
export { withAuth, checkPermission, logAudit, seedDefaultPermissions, PERMISSIONS } from './lib/auth/guard';
