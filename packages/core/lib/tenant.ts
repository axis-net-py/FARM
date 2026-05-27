// Tenant utilities for multi-tenancy

// In a real implementation, this would read from the session/auth context
// For now, we'll use an environment variable or a default

export async function getTenantId(): Promise<string> {
  // Try to get from environment or session
  if (typeof process !== 'undefined' && process.env.TENANT_ID) {
    return process.env.TENANT_ID;
  }

  // Fallback to a default tenant for development
  return 'default-tenant-id';
}

// Helper to set tenant ID in server actions
export function setTenantId(tenantId: string) {
  if (typeof process !== 'undefined') {
    process.env.TENANT_ID = tenantId;
  }
}
