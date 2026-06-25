import { Activity, BookOpen, Brain, Crown, UserPlus, Users } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ErrorState, LoadingPanel } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { useStats } from '@/api/queries'

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Users; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={tone} />
      </div>
      <p className="mt-3 text-2xl font-semibold sm:text-3xl">{value.toLocaleString('en-IN')}</p>
    </div>
  )
}

export default function DashboardPage() {
  const stats = useStats()

  if (stats.isLoading) return <LoadingPanel label="Loading dashboard" />
  if (stats.isError) return <ErrorState message="Could not load dashboard stats." onRetry={() => void stats.refetch()} />
  if (!stats.data) return null

  const planData = [
    { name: 'Free', value: stats.data.freeUsers, fill: 'hsl(var(--primary))' },
    { name: 'Premium', value: stats.data.premiumUsers, fill: 'hsl(var(--accent))' },
  ]

  return (
    <div className="grid gap-6">
      <PageHeader title="Dashboard" description="Live operational metrics from MongoDB." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={stats.data.totalUsers} icon={Users} tone="size-5 text-primary" />
        <StatCard label="New users 7 days" value={stats.data.newUsersLast7Days} icon={UserPlus} tone="size-5 text-accent" />
        <StatCard label="Premium users" value={stats.data.premiumUsers} icon={Crown} tone="size-5 text-warning" />
        <StatCard label="AI cache items" value={stats.data.aiCacheCount} icon={Brain} tone="size-5 text-success" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-border bg-card p-3 text-card-foreground sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
            <h2 className="text-base font-semibold">Signups</h2>
            <Badge tone="accent">Last 14 days</Badge>
          </div>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.data.signups} margin={{ left: -24, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="signupFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Area dataKey="count" type="monotone" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#signupFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-3 text-card-foreground sm:p-4">
          <h2 className="text-base font-semibold">Plans</h2>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2}>
                  {planData.map((item) => <Cell key={item.name} fill={item.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-2 text-sm">
            {planData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: item.fill }} />
                  {item.name}
                </span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            <h2 className="text-base font-semibold">Kundli cache</h2>
          </div>
          <p className="mt-3 text-3xl font-semibold">{stats.data.cachedKundliCount.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-accent" />
            <h2 className="text-base font-semibold">Auth providers</h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.data.providers.map((provider) => (
              <Badge key={provider.provider}>{provider.provider}: {provider.count}</Badge>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
