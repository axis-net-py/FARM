'use client';

import { Geist_Mono } from 'next/font/google';
import { useQuery } from '@tanstack/react-query';
import { getRecentContracts } from '@/lib/dashboard';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Handshake, Calendar, Landmark } from 'lucide-react';

const geistMono = Geist_Mono({ subsets: ['latin'] });

interface RecentContractsProps {
  limit?: number;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  COMPLETED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  CANCELLED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativo',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export function RecentContracts({ limit = 5 }: RecentContractsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recentContracts', limit],
    queryFn: () => getRecentContracts(limit),
  });

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-md">
        <Skeleton className="h-4 w-32" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-destructive text-sm shadow-md">
        Erro ao carregar contratos recentes.
      </div>
    );
  }

  const contracts = data || [];

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-md transition-all hover:shadow-lg">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
          <Handshake className="w-4 h-4" />
          Contratos Recentes (Venda de Grãos)
        </h3>
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full">
          Geral
        </span>
      </div>

      {contracts.length === 0 ? (
        <div className="text-center py-8 text-xs text-muted-foreground font-medium">
          Nenhum contrato cadastrado recentemente.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 pb-2 border-b border-border/80 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            <div className="col-span-3">Nro / Safra</div>
            <div className="col-span-3">Silo (Comprador)</div>
            <div className="col-span-3 text-right">Qtd / Grão</div>
            <div className="col-span-3 text-right">Status</div>
          </div>

          {contracts.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-12 gap-2 py-3 border-b border-border/40 text-xs items-center hover:bg-muted/10 transition-colors"
            >
              <div className="col-span-3">
                <div className="font-bold text-foreground">{c.contractNumber}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {c.harvest?.name || 'Sem safra'}
                </div>
              </div>
              <div className="col-span-3 flex items-center gap-1.5 font-semibold text-foreground/90">
                <Landmark className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{c.siloName}</span>
              </div>
              <div className="col-span-3 text-right">
                <div className={`font-bold ${geistMono.className} text-foreground`}>
                  {c.quantity.toLocaleString()} {c.unit}
                </div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                  {c.grainType}
                </div>
              </div>
              <div className="col-span-3 text-right flex justify-end">
                <Badge
                  variant="outline"
                  className={`${statusColors[c.status] || 'bg-muted text-muted-foreground'} text-[9px] font-bold tracking-widest px-2.5 py-0.5 rounded-full uppercase`}
                >
                  {statusLabels[c.status] || c.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
