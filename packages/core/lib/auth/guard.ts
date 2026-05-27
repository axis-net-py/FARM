import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// ─── Permission Actions ──────────────────────────────

export const PERMISSIONS = {
  // Accounting
  'accounting:read': 'View ledger, journal entries, and financial reports',
  'accounting:write': 'Create and post journal entries',
  // Sales
  'sales:read': 'View sales invoices and customers',
  'sales:write': 'Create and manage sales invoices',
  // Inventory
  'inventory:read': 'View inventory and stock levels',
  'inventory:write': 'Manage inventory movements',
  // CRM
  'crm:read': 'View leads and quotations',
  'crm:write': 'Manage leads and create quotations',
  // HR
  'hr:read': 'View employee records and contracts',
  'hr:write': 'Manage employees and contracts',
  // Settings
  'settings:read': 'View tenant settings',
  'settings:write': 'Manage team, roles, and permissions',
  // Audit
  'audit:read': 'View audit logs',
  // Users
  'users:manage': 'Manage user roles and permissions',
} as const;

export type PermissionAction = keyof typeof PERMISSIONS;

// ─── Check Permission ───────────────────────────────

export async function checkPermission(
  userId: string,
  action: string,
  tenantId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, tenantId: true }
  });

  if (!user || user.tenantId !== tenantId) return false;

  // SOVEREIGN bypasses all checks
  if (user.role === 'SOVEREIGN') return true;

  // Check specific permission
  const permission = await prisma.permission.findUnique({
    where: {
      action_role_tenantId: {
        action,
        role: user.role as any,
        tenantId,
      }
    }
  });

  return !!permission;
}

// ─── withAuth Wrapper ──────────────────────────────

export async function withAuth<T>(
  action: string,
  tenantId: string,
  callback: () => Promise<T>
): Promise<T> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("ACCESS_DENIED: Not authenticated.");
  }

  // SOVEREIGN bypasses all permission checks
  if (session.user.role === 'SOVEREIGN') {
    await logAudit(session.user.id, tenantId, action, { bypass: true });
    return callback();
  }

  const hasPermission = await checkPermission(session.user.id, action, tenantId);

  if (!hasPermission) {
    await logAudit(session.user.id, tenantId, action, { denied: true });
    throw new Error("ACCESS_DENIED: Insufficient clearance.");
  }

  await logAudit(session.user.id, tenantId, action, { granted: true });
  return callback();
}

// ─── Audit Logger ──────────────────────────────────

export async function logAudit(
  userId: string,
  tenantId: string,
  action: string,
  details: Record<string, any> = {}
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        tenantId,
        action,
        details: {
          ...details,
          timestamp: new Date().toISOString(),
        } as any,
      }
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

// ─── Seed Default Permissions ───────────────────────

export async function seedDefaultPermissions(tenantId: string) {
  const defaultPermissions: Array<{ action: string; role: string }> = [
    // SOVEREIGN gets everything by bypass, no need to seed

    // ADMIN gets everything
    ...Object.keys(PERMISSIONS).map(action => ({ action, role: 'ADMIN' })),

    // OPERATOR gets read + write on operational areas
    { action: 'accounting:write', role: 'OPERATOR' },
    { action: 'sales:read', role: 'OPERATOR' },
    { action: 'sales:write', role: 'OPERATOR' },
    { action: 'inventory:read', role: 'OPERATOR' },
    { action: 'inventory:write', role: 'OPERATOR' },
    { action: 'crm:read', role: 'OPERATOR' },
    { action: 'crm:write', role: 'OPERATOR' },

    // AUDITOR gets read-only
    { action: 'accounting:read', role: 'AUDITOR' },
    { action: 'sales:read', role: 'AUDITOR' },
    { action: 'inventory:read', role: 'AUDITOR' },
    { action: 'crm:read', role: 'AUDITOR' },
    { action: 'hr:read', role: 'AUDITOR' },
    { action: 'audit:read', role: 'AUDITOR' },
  ];

  for (const perm of defaultPermissions) {
    await prisma.permission.upsert({
      where: {
        action_role_tenantId: {
          action: perm.action,
          role: perm.role as any,
          tenantId,
        }
      },
      update: {},
      create: {
        action: perm.action,
        role: perm.role as any,
        tenantId,
      }
    });
  }

  return { success: true, count: defaultPermissions.length };
}
