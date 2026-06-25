import { Activity, Globe, MapPin, Smartphone, Users } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ErrorState, LoadingPanel } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { useAnalytics } from '@/api/queries'

function StatCard({ label, value, sub, icon: Icon, tone }: { label: string; value: number; sub?: string; icon: typeof Users; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={tone} />
      </div>
      <p className="mt-3 text-2xl font-semibold sm:text-3xl">{value.toLocaleString('en-IN')}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

function ListCard({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <section className="rounded-lg border border-border bg-card p-3 text-card-foreground sm:p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-3 grid gap-2 text-sm">
        {rows.length === 0 && <p className="text-muted-foreground">No data yet.</p>}
        {rows.map((r) => (
          <div key={r.label} className="grid gap-1">
            <div className="flex items-center justify-between">
              <span className="truncate">{r.label}</span>
              <span className="font-medium">{r.count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(r.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function AnalyticsPage() {
  const q = useAnalytics()

  if (q.isLoading) return <LoadingPanel label="Loading analytics" />
  if (q.isError) return <ErrorState message="Could not load analytics." onRetry={() => void q.refetch()} />
  if (!q.data) return null
  const d = q.data

  return (
    <div className="grid gap-6">
      <PageHeader title="Analytics" description="App usage, active users, location & devices (IP-based, privacy friendly)." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active users today" value={d.activeUsers.today} sub={`${d.activeUsers.last7Days} in 7 days`} icon={Users} tone="size-5 text-primary" />
        <StatCard label="Active devices today" value={d.activeDevices.today} sub={`${d.activeDevices.last30Days} in 30 days`} icon={Smartphone} tone="size-5 text-accent" />
        <StatCard label="Events today" value={d.totals.eventsToday} sub={`${d.totals.events7d} in 7 days`} icon={Activity} tone="size-5 text-success" />
        <StatCard label="Total events" value={d.totals.totalEvents} icon={Globe} tone="size-5 text-warning" />
      </div>

      <section className="rounded-lg border border-border bg-card p-3 text-card-foreground sm:p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Activity</h2>
          <Badge tone="accent">Last 14 days</Badge>
        </div>
        <div className="h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={d.perDay} margin={{ left: -24, right: 10, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="evFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Area dataKey="devices" name="Devices" type="monotone" stroke="hsl(var(--accent))" strokeWidth={2} fill="none" />
              <Area dataKey="count" name="Events" type="monotone" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#evFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ListCard title="Top screens" rows={d.topScreens.map((s) => ({ label: s.screen, count: s.count }))} />
        <ListCard title="Platforms" rows={d.platforms.map((p) => ({ label: p.platform, count: p.count }))} />
        <ListCard title="Countries" rows={d.countries.map((c) => ({ label: c.country, count: c.count }))} />
        <ListCard title="Cities" rows={d.cities.map((c) => ({ label: c.country ? `${c.city}, ${c.country}` : c.city, count: c.count }))} />
      </div>

      <section className="rounded-lg border border-border bg-card p-3 text-card-foreground sm:p-4">
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-primary" />
          <h2 className="text-base font-semibold">Recent events</h2>
        </div>
        <div className="mt-3 grid gap-3 md:hidden">
          {d.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet. Open the mobile app to start tracking.</p>
          ) : null}
          {d.recent.map((e) => (
            <div key={e._id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                <Badge>{e.name}</Badge>
                <span className="text-right text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString('en-IN')}</span>
              </div>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Screen</span><span className="truncate">{e.screen || '-'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Platform</span><span>{e.platform || '-'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Location</span><span className="truncate">{[e.city, e.country].filter(Boolean).join(', ') || '-'}</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Event</th>
                <th className="py-2 pr-4">Screen</th>
                <th className="py-2 pr-4">Platform</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {d.recent.length === 0 && (
                <tr><td className="py-3 text-muted-foreground" colSpan={5}>No events yet. Open the mobile app to start tracking.</td></tr>
              )}
              {d.recent.map((e) => (
                <tr key={e._id} className="border-t border-border">
                  <td className="py-2 pr-4"><Badge>{e.name}</Badge></td>
                  <td className="py-2 pr-4">{e.screen || '-'}</td>
                  <td className="py-2 pr-4">{e.platform || '-'}</td>
                  <td className="py-2 pr-4">{[e.city, e.country].filter(Boolean).join(', ') || '-'}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{new Date(e.createdAt).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
