"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getUsers, getPermissions, updatePermission } from '@/app/actions/team';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Shield, Crown, UserCog, Eye, Loader2, Users } from 'lucide-react';
import type { Role, Permission } from '@prisma/client';

// ─── Types ──────────────────────────────────────────────

interface UserWithPermissions {
  id: string;
  email: string;
  name?: string;
  role: Role;
  permissions: Permission[];
}

interface PermissionMatrix {
  action: string;
  SOVEREIGN: boolean;
  ADMIN: boolean;
  OPERATOR: boolean;
  AUDITOR: boolean;
}

// ─── Main Page ─────────────────────────────────────────────

export default function TeamSettingsPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [permissions, setPermissions] = useState<PermissionMatrix[]>([]);
  const [saving, setSaving] = useState(false);

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, permsData] = await Promise.all([
        getUsers(tenantId),
        getPermissions(tenantId),
      ]);

      setUsers(usersData as any);
      setPermissions(buildPermissionMatrix(permsData as any));
    } catch (error: any) {
      toast.error('Falha ao carregar dados da equipe: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  // Build permission matrix
  const buildPermissionMatrix = (perms: Permission[]): PermissionMatrix[] => {
    const matrix: Map<string, PermissionMatrix> = new Map();

    perms.forEach(p => {
      const existing = matrix.get(p.action) || {
        action: p.action,
        SOVEREIGN: false,
        ADMIN: false,
        OPERATOR: false,
        AUDITOR: false,
      };

      existing[p.role as Role] = true;
      matrix.set(p.action, existing);
    });

    return Array.from(matrix.values()).sort((a, b) => a.action.localeCompare(b.action));
  };

  // Toggle permission
  const togglePermission = async (action: string, role: Role) => {
    try {
      setSaving(true);
      const current = permissions.find(p => p.action === action);
      if (!current) return;

      const newVal = !current[role];
      await updatePermission(tenantId, action, role, newVal);

      setPermissions(prev =>
        prev.map(p =>
          p.action === action
            ? { ...p, [role]: newVal }
            : p
        )
      );

      toast.success(`Permissão ${action} para ${role} ${newVal ? 'concedida' : 'revogada'}`);
    } catch (error: any) {
      toast.error('Falha ao atualizar permissão: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  // Load on mount
  useEffect(() => {
    loadData();
  }, []);

  // Role icon
  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'SOVEREIGN': return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'ADMIN': return <UserCog className="w-3 h-3 text-primary" />;
      case 'OPERATOR': return <Users className="w-3 h-3 text-blue-500" />;
      case 'AUDITOR': return <Eye className="w-3 h-3 text-purple-500" />;
    }
  };

  // Role badge color
  const getRoleBadgeClass = (role: Role) => {
    switch (role) {
      case 'SOVEREIGN': return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500';
      case 'ADMIN': return 'border-primary/30 bg-primary/10 text-primary';
      case 'OPERATOR': return 'border-blue-500/30 bg-blue-500/10 text-blue-500';
      case 'AUDITOR': return 'border-purple-500/30 bg-purple-500/10 text-purple-500';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Matriz de Controle de Acesso
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie membros, funções e permissões granulares
            </p>
          </div>
          <Button
            onClick={loadData}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="p-8">
        <div className="border border-border rounded-sm overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">
                  Membro
                </TableHead>
                <TableHead className="text-muted-foreground font-medium">
                  E-mail
                </TableHead>
                <TableHead className="text-muted-foreground font-medium">
                  Função
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">Carregando...</span>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-20">
                    <span className="text-[11px] text-muted-foreground/80 font-bold uppercase tracking-widest">Nenhum membro encontrado</span>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="border-border hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
                          <span className="text-foreground text-xs font-bold">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {user.name || "Sem nome"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`gap-1 font-normal ${getRoleBadgeClass(user.role)}`}
                      >
                        {getRoleIcon(user.role)}
                        {user.role}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="mt-8 px-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Matriz de Permissões
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Visualização das permissões granulares por função. O nível
          SOVEREIGN possui bypass automático em todas as verificações.
        </p>

        <div className="border border-border rounded-sm overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium w-[300px]">
                  Permissão
                </TableHead>
                <TableHead className="text-center text-muted-foreground font-medium">
                  <Crown className="w-4 h-4 mx-auto text-yellow-500" />
                  <span className="text-xs">SOVEREIGN</span>
                </TableHead>
                <TableHead className="text-center text-muted-foreground font-medium">
                  <UserCog className="w-4 h-4 mx-auto text-primary" />
                  <span className="text-xs">ADMIN</span>
                </TableHead>
                <TableHead className="text-center text-muted-foreground font-medium">
                  <Users className="w-4 h-4 mx-auto text-blue-500" />
                  <span className="text-xs">OPERATOR</span>
                </TableHead>
                <TableHead className="text-center text-muted-foreground font-medium">
                  <Eye className="w-4 h-4 mx-auto text-purple-500" />
                  <span className="text-xs">AUDITOR</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">Carregando permissões...</span>
                  </TableCell>
                </TableRow>
              ) : permissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">Nenhuma permissão definida</span>
                  </TableCell>
                </TableRow>
              ) : (
                permissions.map((perm) => (
                  <TableRow key={perm.action} className="border-border hover:bg-muted/50 transition-colors">
                    <TableCell className="text-sm font-medium text-foreground">
                      <div>
                        <p>{perm.action}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={true}
                        disabled={true}
                        className="data-[state=checked]:bg-primary"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={perm.ADMIN}
                        onCheckedChange={() => togglePermission(perm.action, 'ADMIN' as any)}
                        disabled={saving}
                        className="data-[state=checked]:bg-primary"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={perm.OPERATOR}
                        onCheckedChange={() => togglePermission(perm.action, 'OPERATOR' as any)}
                        disabled={saving}
                        className="data-[state=checked]:bg-primary"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={perm.AUDITOR}
                        onCheckedChange={() => togglePermission(perm.action, 'AUDITOR' as any)}
                        disabled={saving}
                        className="data-[state=checked]:bg-primary"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Info Box */}
      <div className="m-8 border border-primary/30 bg-primary/5 rounded-sm p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Sobre o Nível SOVEREIGN
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              O nível SOVEREIGN possui bypass automático em todas as
              verificações de permissão. Este nível é reservado apenas para o
              criador do sistema (Allan) e não pode ser alterado através desta
              interface. Todas as ações realizadas por um SOVEREIGN são
              registradas nos Audit Logs com a flag{" "}
              <code className="text-primary">bypass: true</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
