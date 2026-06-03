import { Suspense } from 'react';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentContracts } from '@/components/dashboard/RecentContracts';
import { PlotBreakdown } from '@/components/dashboard/PlotBreakdown';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { WeatherCard } from '@/components/dashboard/WeatherCard';

// Default date range - last 30 days
const defaultDateRange = {
  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  to: new Date(),
};

// Default currency - should come from tenant settings
const defaultCurrency = 'PYG' as const;

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">
          Dashboard
        </h1>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Painel Agrícola
        </span>
      </div>

      {/* GPS Weather Card */}
      <WeatherCard />

      {/* Stats Cards */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        }
      >
        <StatsCards dateRange={defaultDateRange} currency={defaultCurrency} />
      </Suspense>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense
          fallback={
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          }
        >
          <RecentContracts limit={5} />
        </Suspense>

        <Suspense
          fallback={
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          }
        >
          <PlotBreakdown />
        </Suspense>
      </div>
    </div>
  );
}

