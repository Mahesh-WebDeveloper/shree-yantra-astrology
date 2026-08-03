import {
  Activity,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  MemoryStick,
  Server,
  Smartphone,
  Users,
  Wifi,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useServerMonitor } from '@/api/queries'
import type { ServerMonitorResponse } from '@/api/serverMonitor.types'
import { ErrorState, LoadingPanel } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function toneForPct(pct: number) {
  if (pct >= 85) return 'text-destructive'
  if (pct >= 65) return 'text-warning'
  return 'text-success'
}

function barTone(pct: number) {
  if (pct >= 85) return 'bg-destructive'
  if (pct >= 65) return 'bg-warning'
  return 'bg-primary'
}

function statusBadge(status: ServerMonitorResponse['capacity']['status']) {
  if (status === 'critical') return { tone: 'danger' as const, label: 'Needs attention' }
  if (status === 'busy') return { tone: 'warning' as const, label: 'Getting busy' }
  return { tone: 'success' as const, label: 'Running smoothly' }
}

function RingGauge({
  label,
  sub,
  pct,
  icon: Icon,
}: {
  label: string
  sub: string
  pct: number
  icon: typeof Cpu
}) {
  const r = 42
  const c = 2 * Math.PI * r
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * c

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-primary/10 blur-2xl" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={cn('mt-1 text-3xl font-semibold tabular-nums', toneForPct(pct))}>{pct}%</p>
          <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        </div>
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div className="relative mx-auto mt-4 grid size-[108px] place-items-center">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute text-sm font-medium">{pct}% used</span>
      </div>
    </div>
  )
}

function PlainCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function UsageBar({ label, used, total, pct }: { label: string; used: string; total: string; pct: number }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {used} / {total}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', barTone(pct))}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{pct}% full · {100 - pct}% free</p>
    </div>
  )
}

function formatChartTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return iso
  }
}

export default function ServerMonitorPage() {
  const q = useServerMonitor()

  if (q.isLoading && !q.data) return <LoadingPanel label="Connecting to live server" />
  if (q.isError) return <ErrorState message="Could not load server metrics." onRetry={() => void q.refetch()} />
  if (!q.data) return null

  const d = q.data
  const badge = statusBadge(d.capacity.status)
  const chartData = d.history.map((h) => ({
    ...h,
    time: formatChartTime(h.t),
  }))

  const userFillPct = Math.min(
    100,
    Math.round((d.users.onlineUsers / Math.max(1, d.capacity.comfortableConcurrent)) * 100),
  )

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Server Monitor"
        description="Live health of your VPS — CPU, memory, storage, and how many people are using the app right now."
        action={
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-success" />
            </span>
            <Badge tone="accent">Live · updates every 4s</Badge>
          </div>
        }
      />

      {/* Hero status */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-card to-accent/10 p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -left-10 top-0 size-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 right-0 size-44 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={badge.tone}>{badge.label}</Badge>
              <Badge>{d.host.hostname}</Badge>
              <Badge tone="accent">Up {d.host.uptimeHuman}</Badge>
            </div>
            <h2 className="mt-3 text-xl font-semibold sm:text-2xl">{d.capacity.plainSummary}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{d.capacity.statusHint}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Last updated {new Date(d.at).toLocaleString('en-IN')} · {d.host.cpus} CPU cores · Node {d.host.nodeVersion}
              {q.dataUpdatedAt ? ` · refreshed ${new Date(q.dataUpdatedAt).toLocaleTimeString('en-IN')}` : ''}
            </p>
          </div>
          <div className="grid gap-3 rounded-xl border border-border/70 bg-background/70 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Users right now</span>
              <span className="text-2xl font-semibold tabular-nums">{d.users.onlineUsers.toLocaleString('en-IN')}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full transition-all duration-700', barTone(userFillPct))}
                style={{ width: `${userFillPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Comfortable up to ~{d.capacity.comfortableConcurrent.toLocaleString('en-IN')} at once (estimated) · max estimate ~
              {d.capacity.estimatedMaxConcurrent.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </section>

      {/* User stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Using app now', value: d.users.onlineUsers, sub: 'last 2 minutes', icon: Wifi, tone: 'text-success' },
          { label: 'Devices online', value: d.users.onlineDevices, sub: 'active devices', icon: Smartphone, tone: 'text-accent' },
          { label: 'Active today', value: d.users.activeToday, sub: 'unique users', icon: Activity, tone: 'text-primary' },
          { label: 'Active this week', value: d.users.activeWeek, sub: 'unique users', icon: Users, tone: 'text-primary' },
          { label: 'Total registered', value: d.users.totalUsers, sub: 'all app users', icon: Users, tone: 'text-muted-foreground' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <s.icon className={cn('size-4', s.tone)} />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{s.value.toLocaleString('en-IN')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Gauges */}
      <div className="grid gap-4 md:grid-cols-3">
        <RingGauge label="CPU usage" sub={`Load ${d.cpu.load1} · ${d.cpu.cores} cores`} pct={d.cpu.usagePct} icon={Cpu} />
        <RingGauge label="Memory (RAM)" sub={`${d.memory.freeHuman} free`} pct={d.memory.usedPct} icon={MemoryStick} />
        <RingGauge
          label="Storage disk"
          sub={d.disk ? `${d.disk.freeHuman} free on ${d.disk.mount}` : 'Not available on this host'}
          pct={d.disk?.usedPct ?? 0}
          icon={HardDrive}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <PlainCard title="CPU & memory — live trend">
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="cpuFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="memFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Area dataKey="cpuPct" name="CPU %" type="monotone" stroke="hsl(var(--primary))" fill="url(#cpuFill)" strokeWidth={2} />
                <Area dataKey="memPct" name="Memory %" type="monotone" stroke="hsl(var(--accent))" fill="url(#memFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Higher lines mean the server is working harder. Spikes during panchang or AI requests are normal.</p>
        </PlainCard>

        <PlainCard title="Users online — live trend (from MongoDB)">
          {chartData.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              Collecting live samples… chart builds as the page polls every 4 seconds ({d.meta.historyPoints} samples so far).
            </p>
          ) : (
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Line
                    dataKey="onlineUsers"
                    name="Users online"
                    type="monotone"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Real count of users with app activity in the last 2 minutes — polled live from your database.
          </p>
        </PlainCard>

        <PlainCard title="Capacity estimate (calculated, not dummy)">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Gauge className="size-4" />
                Comfortable capacity (estimate)
              </div>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{d.capacity.comfortableConcurrent.toLocaleString('en-IN')}</p>
              <p className="mt-1 text-xs text-muted-foreground">Calculated from current CPU, RAM and server specs</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Server className="size-4" />
                Estimated maximum
              </div>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{d.capacity.estimatedMaxConcurrent.toLocaleString('en-IN')}</p>
              <p className="mt-1 text-xs text-muted-foreground">Rough upper limit before upgrade is wise</p>
            </div>
          </div>
        </PlainCard>
      </div>

      {/* Storage + system details */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PlainCard title="Storage — how full is the disk?">
          {d.disk ? (
            <UsageBar label="Main disk" used={d.disk.usedHuman} total={d.disk.totalHuman} pct={d.disk.usedPct} />
          ) : (
            <p className="text-sm text-muted-foreground">Disk info is available on the live Linux server.</p>
          )}
          <div className="mt-4 grid gap-3">
            <UsageBar label="RAM (memory)" used={d.memory.usedHuman} total={d.memory.totalHuman} pct={d.memory.usedPct} />
          </div>
        </PlainCard>

        <PlainCard title="System details (simple view)">
          <dl className="grid gap-3 text-sm">
            {[
              ['Server name', d.host.hostname],
              ['Server uptime', d.host.uptimeHuman],
              ['App process memory', d.process.rssHuman],
              ['App running since', d.process.uptimeHuman],
              ['Database', d.database.ok ? 'Connected ✓' : d.database.status],
              ['DB documents', d.database.stats ? `${d.database.stats.objects.toLocaleString('en-IN')} objects` : '—'],
              ['DB storage', d.database.stats?.storageSizeHuman ?? '—'],
              ['PM2 process', d.pm2 ? `${d.pm2.name} · ${d.pm2.status} · PID ${d.pm2.pid}` : '—'],
              ['PM2 memory', d.pm2?.memoryHuman ?? '—'],
              ['PM2 restarts', d.pm2 ? String(d.pm2.restarts) : '—'],
              ['Swap used', d.swap ? `${d.swap.usedHuman} / ${d.swap.totalHuman} (${d.swap.usedPct}%)` : 'None'],
              ['CPU cores', String(d.host.cpus)],
              ['Platform', `${d.host.platform} (${d.host.arch})`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 border-b border-border/70 pb-2 last:border-0 last:pb-0">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
            <Database className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              <strong className="text-foreground">For non-technical users:</strong> green status means the server is healthy. If CPU or storage bars stay
              above 80% for long periods, plan a server upgrade.
            </p>
          </div>
        </PlainCard>
      </div>

      <PlainCard title="Live data sources (nothing is dummy or static)">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {Object.entries(d.meta.sources).map(([key, source]) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-background px-3 py-2">
              <dt className="capitalize text-muted-foreground">{key}</dt>
              <dd className="text-right font-mono text-xs">{source}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Sample #{d.meta.historyPoints} at {new Date(d.meta.sampledAt).toLocaleString('en-IN')} on VPS <strong>{d.host.hostname}</strong>.
          CPU and memory charts update every 4 seconds from the live server.
        </p>
      </PlainCard>
    </div>
  )
}
