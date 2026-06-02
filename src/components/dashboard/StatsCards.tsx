'use client';

import { Geist_Mono } from 'next/font/google';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/lib/dashboard';
import { useLanguage } from '@/components/language-provider';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sprout, Map, Tractor, Users } from 'lucide-react';

const geistMono = Geist_Mono({ subsets: ['latin'] });

interface StatsCardsProps {
  dateRange: { from: Date; to: Date };
  currency: 'PYG' | 'USD' | 'BRL';
}

const tMap: Record<'pt' | 'es', Record<string, string>> = {
  pt: {
    harvestsTitle: "Safras Ativas",
    harvestsSub: "{active} em andamento de {total}",
    areaTitle: "Área Cultivada",
    areaSub: "{total} de área total",
    fleetTitle: "Frota Operacional",
    fleetSub: "{active} de {total} máquinas ativas",
    teamTitle: "Equipe em Campo",
    teamSub: "{active} de {total} colaboradores ativos",
    error: "Erro ao carregar estatísticas",
  },
  es: {
    harvestsTitle: "Cosechas Activas",
    harvestsSub: "{active} en curso de {total}",
    areaTitle: "Área Cultivada",
    areaSub: "{total} de área total",
    fleetTitle: "Flota Operacional",
    fleetSub: "{active} de {total} máquinas activas",
    teamTitle: "Personal en Campo",
    teamSub: "{active} de {total} colaboradores activos",
    error: "Error al cargar estadísticas",
  }
};

function formatArea(areaObj: { HECTARE: number; ALQUEIRE: number }) {
  const parts: string[] = [];
  if (areaObj.HECTARE > 0 || (areaObj.HECTARE === 0 && areaObj.ALQUEIRE === 0)) {
    parts.push(`${areaObj.HECTARE.toLocaleString()} ha`);
  }
  if (areaObj.ALQUEIRE > 0) {
    parts.push(`${areaObj.ALQUEIRE.toLocaleString()} alq`);
  }
  return parts.join(' / ');
}

export function StatsCards({ dateRange, currency }: StatsCardsProps) {
  const { language } = useLanguage();
  const currentLang = (language === 'es' || language === 'pt') ? language : 'pt';
  const labels = tMap[currentLang];

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats', dateRange, currency],
    queryFn: () => getDashboardStats({ start: dateRange.from, end: dateRange.to }),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-destructive text-sm font-medium py-4 px-2">{labels.error}</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Safras Ativas */}
      <Card className="border border-border bg-card/45 backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-md cursor-default border-l-4 border-l-emerald-500/80 group">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
            {labels.harvestsTitle}
          </CardTitle>
          <Sprout className="h-4 w-4 text-emerald-500 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <h3 className={`${geistMono.className} text-3xl font-extrabold tracking-tight text-foreground`}>
              {data.activeHarvests}
            </h3>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {labels.harvestsSub.replace('{active}', String(data.activeHarvests)).replace('{total}', String(data.totalHarvests))}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Área Cultivada */}
      <Card className="border border-border bg-card/45 backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-md cursor-default border-l-4 border-l-amber-500/80 group">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
            {labels.areaTitle}
          </CardTitle>
          <Map className="h-4 w-4 text-amber-500 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <h3 className={`${geistMono.className} text-xl font-extrabold tracking-tight text-foreground truncate`}>
              {formatArea(data.activeArea)}
            </h3>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">
              {labels.areaSub.replace('{total}', formatArea(data.totalArea))}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Frota Operacional */}
      <Card className="border border-border bg-card/45 backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-md cursor-default border-l-4 border-l-sky-500/80 group">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
            {labels.fleetTitle}
          </CardTitle>
          <Tractor className="h-4 w-4 text-sky-500 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <h3 className={`${geistMono.className} text-3xl font-extrabold tracking-tight text-foreground`}>
              {data.operationalVehicles}
            </h3>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {labels.fleetSub.replace('{active}', String(data.operationalVehicles)).replace('{total}', String(data.totalVehicles))}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Equipe em Campo */}
      <Card className="border border-border bg-card/45 backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-md cursor-default border-l-4 border-l-indigo-500/80 group">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
            {labels.teamTitle}
          </CardTitle>
          <Users className="h-4 w-4 text-indigo-500 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <h3 className={`${geistMono.className} text-3xl font-extrabold tracking-tight text-foreground`}>
              {data.activeEmployees}
            </h3>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {labels.teamSub.replace('{active}', String(data.activeEmployees)).replace('{total}', String(data.totalEmployees))}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function StatCardSkeleton() {
  return <Skeleton className="h-32 w-full rounded-xl" />;
}
