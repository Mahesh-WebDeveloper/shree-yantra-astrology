import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownAZ, ArrowUpZA, Calendar, CreditCard, Crown, IndianRupee,
  RefreshCw, Search, TrendingUp, Users, Wallet, X, Zap,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

import type { PaymentTransactionRow, SubscriptionRow } from '@/api/endpoints'
import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import {
  usePaymentTransactions, useSubscriptionDetail, useSubscriptionOverview, useSubscriptions,
} from '@/api/queries'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ErrorState, LoadingPanel, LoadingRows } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/form'
import { useToast } from '@/components/ui/toast'
import { formatDateTime, inr, cn } from '@/lib/utils'

const PIE_COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#ec4899']

type Tab = 'subscribers' | 'transactions'
type Segment = '' | 'all' | 'trial_active' | 'trial_started' | 'converted' | 'active_premium' | 'cancelled'
type SortField = 'updatedAt' | 'paidTotal' | 'createdAt'

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string; icon: typeof Users; accent: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md">
      <div className="absolute -right-4 -top-4 size-20 rounded-full opacity-10" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
          {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
        </div>
        <div className="rounded-lg p-2" style={{ backgroundColor: `${accent}22` }}>
          <Icon className="size-5" style={{ color: accent }} />
        </div>
      </div>
    </div>
  )
}

function segmentBadge(segment: string) {
  const map: Record<string, { label: string; tone: 'success' | 'warning' | 'accent' | 'neutral' | 'danger' }> = {
    trial_active: { label: 'Trial active', tone: 'warning' },
    trial_started: { label: 'Trial started', tone: 'accent' },
    converted: { label: 'Converted', tone: 'success' },
    active_premium: { label: 'Premium active', tone: 'success' },
    cancelled: { label: 'Cancelled', tone: 'danger' },
    other: { label: 'Other', tone: 'neutral' },
  }
  const m = map[segment] || map.other
  return <Badge tone={m.tone}>{m.label}</Badge>
}

function statusBadge(status: string) {
  const tone = ['active', 'authenticated', 'pending'].includes(status) ? 'success'
    : ['cancelled', 'expired', 'completed'].includes(status) ? 'danger' : 'neutral'
  return <Badge tone={tone}>{status}</Badge>
}

function DetailDrawer({ userId, onClose }: { userId: string; onClose: () => void }) {
  const q = useSubscriptionDetail(userId)
  const queryClient = useQueryClient()
  const toast = useToast()
  const [confirmCancel, setConfirmCancel] = useState(false)

  const syncMutation = useMutation({
    mutationFn: () => endpoints.adminSyncSubscription(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['subscription-detail', userId] })
      void queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Synced from Razorpay')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const cancelMutation = useMutation({
    mutationFn: () => endpoints.adminCancelSubscription(userId),
    onSuccess: () => {
      setConfirmCancel(false)
      void queryClient.invalidateQueries({ queryKey: ['subscription-detail', userId] })
      void queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Subscription cancellation requested')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })
  if (q.isLoading) return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 p-0 sm:p-4">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-card p-6 shadow-2xl sm:rounded-xl">
        <LoadingPanel label="Loading subscription details" />
      </div>
    </div>
  )
  if (q.isError || !q.data) return null
  const d = q.data

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-card shadow-2xl sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{d.user.name || 'User'}</h2>
            <p className="truncate text-sm text-muted-foreground">{d.user.email || d.user.phone || d.user.id}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onClose} aria-label="Close"><X className="size-4" /></Button>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 border-b border-border px-4 pb-3">
          <Button type="button" size="sm" variant="secondary" disabled={syncMutation.isPending} onClick={() => syncMutation.mutate()}>
            <RefreshCw className={cn('mr-1 size-3.5', syncMutation.isPending && 'animate-spin')} /> Sync Razorpay
          </Button>
          {d.subscription && !['cancelled', 'expired', 'completed'].includes(d.subscription.status) ? (
            <Button type="button" size="sm" variant="destructive" disabled={cancelMutation.isPending} onClick={() => setConfirmCancel(true)}>
              Cancel subscription
            </Button>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5">
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Total paid</p>
            <p className="text-xl font-bold text-primary">{inr(d.summary.totalPaidInr)}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Payments</p>
            <p className="text-xl font-bold">{d.summary.paymentCount}</p>
            <p className="text-xs text-muted-foreground">{d.summary.trialPayments} trial · {d.summary.recurringPayments} recurring</p>
          </div>
        </div>

        {d.subscription ? (
          <section className="mb-4 rounded-lg border border-border p-3">
            <h3 className="mb-2 text-sm font-semibold">Subscription</h3>
            <dl className="grid gap-2 text-sm">
              {[
                ['Status', d.subscription.status],
                ['Razorpay sub ID', d.subscription.providerSubscriptionId],
                ['Trial type', d.subscription.initialPeriodType],
                ['Paid cycles', String(d.subscription.paidCount)],
                ['Entitlement', d.subscription.entitlementActive ? 'Active' : 'Inactive'],
                ['Trial started', formatDateTime(d.subscription.trialConsumedAt)],
                ['Checkout verified', formatDateTime(d.subscription.checkoutVerifiedAt)],
                ['Next charge', formatDateTime(d.subscription.nextChargeAt)],
                ['Access until', formatDateTime(d.subscription.accessUntil)],
                ['Cancel at cycle end', d.subscription.cancelAtCycleEnd ? 'Yes' : 'No'],
                ['Last payment ID', d.subscription.lastPaymentId || '—'],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-1 border-b border-border/50 pb-2 last:border-0 sm:grid-cols-[140px_1fr] sm:gap-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="min-w-0 break-all font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : (
          <p className="mb-4 text-sm text-muted-foreground">No subscription record for this user.</p>
        )}

        <section className="mb-4">
          <h3 className="mb-2 text-sm font-semibold">Payment history</h3>
          <div className="grid gap-2">
            {d.transactions.length === 0 && <p className="text-sm text-muted-foreground">No payments recorded yet.</p>}
            {d.transactions.map((t) => (
              <div key={t.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{inr(t.amountInr)}</span>
                  <Badge tone={t.status === 'captured' ? 'success' : t.status === 'failed' ? 'danger' : 'neutral'}>{t.status}</Badge>
                </div>
                <p className="mt-1 text-muted-foreground">{t.methodLabel || t.method}</p>
                <p className="mt-1 break-all font-mono text-xs">{t.providerPaymentId}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(t.capturedAt)} · {t.isTrial ? '₹1 trial' : 'Recurring'}</p>
              </div>
            ))}
          </div>
        </section>

        {d.webhooks.length > 0 ? (
          <section>
            <h3 className="mb-2 text-sm font-semibold">Webhook events</h3>
            <div className="grid max-h-48 gap-1 overflow-y-auto text-xs">
              {d.webhooks.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded border border-border px-2 py-1.5">
                  <span>{w.eventType}</span>
                  <Badge tone={w.status === 'processed' ? 'success' : w.status === 'failed' ? 'danger' : 'neutral'}>{w.status}</Badge>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        </div>
      </div>
      <ConfirmDialog
        open={confirmCancel}
        title="Cancel subscription"
        description="This will cancel the user's Razorpay subscription. Paid access may continue until the current period ends."
        confirmLabel="Cancel subscription"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => cancelMutation.mutate()}
      />
    </div>
  )
}

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<Tab>('subscribers')
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState<Segment>('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [txPage, setTxPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [methodFilter, setMethodFilter] = useState('')
  const [trialFilter, setTrialFilter] = useState<'' | 'true' | 'false'>('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const overview = useSubscriptionOverview()
  const subParams = useMemo(() => ({
    page, limit: 20, search: search || undefined,
    segment: segment || undefined, status: statusFilter || undefined,
    sort: `${sortField}:${sortDir}`,
  }), [page, search, segment, statusFilter, sortField, sortDir])
  const txParams = useMemo(() => ({
    page: txPage, limit: 25, search: search || undefined,
    method: methodFilter || undefined, isTrial: trialFilter || undefined,
    sort: 'capturedAt:desc',
  }), [txPage, search, methodFilter, trialFilter])

  const subs = useSubscriptions(subParams)
  const txs = usePaymentTransactions(txParams)

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('desc') }
  }

  if (overview.isLoading) return <LoadingPanel label="Loading subscription analytics" />
  if (overview.isError) return <ErrorState message="Could not load subscription overview." onRetry={() => void overview.refetch()} />
  const o = overview.data!

  const methodChart = o.paymentMethods.map((m, i) => ({ name: m.method || 'unknown', value: m.count, fill: PIE_COLORS[i % PIE_COLORS.length] }))

  return (
    <div className="grid gap-6 pb-8">
      <PageHeader
        title="Subscriptions & Payments"
        description="Live Razorpay tracking — every trial (₹1), renewal, payment method, transaction ID, and user journey."
        action={(
          <Button type="button" variant="secondary" onClick={() => { void overview.refetch(); void subs.refetch(); void txs.refetch() }}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
        )}
      />

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={inr(o.revenue.totalInr)} sub={`${o.revenue.transactionCount} payments`} icon={IndianRupee} accent="#0ea5e9" />
        <StatCard label="Trial active now" value={o.subscriptions.trialActive} sub={`₹${o.pricing.trialInr} · ${o.pricing.trialDays}-day trial`} icon={Zap} accent="#f59e0b" />
        <StatCard label="Converted after trial" value={o.subscriptions.convertedAfterTrial} sub={`${o.subscriptions.conversionRatePercent}% conversion`} icon={TrendingUp} accent="#10b981" />
        <StatCard label="Active premium" value={o.subscriptions.activePremium} sub={`${o.subscriptions.cancelled} cancelled`} icon={Crown} accent="#8b5cf6" />
        <StatCard label="Trial payments" value={o.revenue.trialPayments} sub={inr(o.revenue.trialInr)} icon={Wallet} accent="#6366f1" />
        <StatCard label="Recurring revenue" value={inr(o.revenue.recurringInr)} sub={`${o.revenue.recurringPayments} charges`} icon={CreditCard} accent="#ec4899" />
        <StatCard label="Trials started" value={o.subscriptions.trialStarted} sub="All-time ₹1 checkouts" icon={Users} accent="#14b8a6" />
        <StatCard label="Monthly price" value={inr(o.pricing.monthlyInr)} sub="After trial period" icon={Calendar} accent="#ef4444" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Revenue — last 30 days</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={o.dailyRevenue}>
                <defs>
                  <linearGradient id="revFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v) => inr(Number(v ?? 0))} />
                <Area type="monotone" dataKey="totalInr" stroke="hsl(var(--primary))" fill="url(#revFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Payment methods</h2>
          <div className="h-56">
            {methodChart.length === 0 ? (
              <p className="grid h-full place-items-center text-sm text-muted-foreground">No payments yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={methodChart} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={3}>
                    {methodChart.map((e) => <Cell key={e.name} fill={e.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {o.paymentMethods.map((m) => (
              <Badge key={m.method} tone="neutral">{m.method}: {m.count}</Badge>
            ))}
          </div>
        </section>
      </div>

      {/* Top payers + recent */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Top payers</h2>
          <div className="grid gap-2">
            {o.topPayers.length === 0 && <p className="text-sm text-muted-foreground">No payers yet.</p>}
            {o.topPayers.map((p, i) => (
              <button
                key={p.user?.id || i}
                type="button"
                className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:border-primary/40"
                onClick={() => p.user?.id && setSelectedUserId(p.user.id)}
              >
                <span>
                  <span className="font-medium">{p.user?.name || 'Unknown'}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{p.payments} payments</span>
                </span>
                <span className="font-bold text-primary">{inr(p.totalInr)}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Latest payments</h2>
          <div className="grid gap-2">
            {o.recentTransactions.map((t) => (
              <button
                key={t.id}
                type="button"
                className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:border-primary/40"
                onClick={() => setSelectedUserId(t.userId)}
              >
                <span>
                  <span className="font-medium">{t.user?.name || 'User'}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{t.methodLabel} · {formatDateTime(t.capturedAt)}</span>
                </span>
                <span className="font-semibold">{inr(t.amountInr)}</span>
              </button>
            ))}
          </div>
          {o.milestones.latestSubscriber ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Latest subscriber: <strong>{o.milestones.latestSubscriber.user?.name}</strong> · {formatDateTime(o.milestones.latestSubscriber.at)}
            </p>
          ) : null}
        </section>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {(['subscribers', 'transactions'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            {t === 'subscribers' ? 'All subscribers' : 'All transactions'}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[200px] flex-1">
          <Field label="Search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Name, email, phone, payment ID…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); setTxPage(1) }} />
            </div>
          </Field>
        </div>
        {tab === 'subscribers' ? (
          <>
            <Field label="Segment">
              <Select value={segment} onChange={(e) => { setSegment(e.target.value as Segment); setPage(1) }}>
                <option value="">All segments</option>
                <option value="trial_active">Trial active (₹1 · 7 days)</option>
                <option value="trial_started">Trial started</option>
                <option value="converted">Converted after trial</option>
                <option value="active_premium">Active premium</option>
                <option value="cancelled">Cancelled / expired</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
                <option value="">Any status</option>
                <option value="authenticated">authenticated</option>
                <option value="active">active</option>
                <option value="cancelled">cancelled</option>
                <option value="expired">expired</option>
              </Select>
            </Field>
            <Button type="button" variant="secondary" onClick={() => toggleSort('paidTotal')}>
              {sortField === 'paidTotal' && sortDir === 'desc' ? <ArrowDownAZ className="size-4" /> : <ArrowUpZA className="size-4" />}
              Sort by paid
            </Button>
          </>
        ) : (
          <>
            <Field label="Method">
              <Select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setTxPage(1) }}>
                <option value="">All methods</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="netbanking">Netbanking</option>
                <option value="wallet">Wallet</option>
              </Select>
            </Field>
            <Field label="Type">
              <Select value={trialFilter} onChange={(e) => { setTrialFilter(e.target.value as '' | 'true' | 'false'); setTxPage(1) }}>
                <option value="">All</option>
                <option value="true">₹1 trial only</option>
                <option value="false">Recurring only</option>
              </Select>
            </Field>
          </>
        )}
      </div>

      {tab === 'subscribers' && (
        subs.isLoading ? <LoadingRows /> : subs.isError ? (
          <ErrorState message="Could not load subscribers." onRetry={() => void subs.refetch()} />
        ) : (
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Segment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Total paid</th>
                    <th className="px-4 py-3">Cycles</th>
                    <th className="px-4 py-3">Last payment</th>
                    <th className="px-4 py-3">Next charge</th>
                  </tr>
                </thead>
                <tbody>
                  {(subs.data?.subscriptions || []).map((row: SubscriptionRow) => (
                    <tr
                      key={row.subscription.id}
                      className="cursor-pointer border-b border-border/60 transition hover:bg-muted/30"
                      onClick={() => setSelectedUserId(row.user?.id || row.subscription.userId)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.user?.name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{row.user?.email || row.user?.phone}</p>
                      </td>
                      <td className="px-4 py-3">{segmentBadge(row.segment)}</td>
                      <td className="px-4 py-3">{statusBadge(row.subscription.status)}</td>
                      <td className="px-4 py-3 font-semibold text-primary">{inr(row.totalPaidInr)}</td>
                      <td className="px-4 py-3">{row.subscription.paidCount}</td>
                      <td className="px-4 py-3 text-xs">{formatDateTime(row.lastPaymentAt)}</td>
                      <td className="px-4 py-3 text-xs">{formatDateTime(row.subscription.nextChargeAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {subs.data?.pagination ? (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
                <span className="text-muted-foreground">Page {subs.data.pagination.page} of {subs.data.pagination.pages} · {subs.data.pagination.total} total</span>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                  <Button type="button" variant="secondary" size="sm" disabled={page >= subs.data.pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            ) : null}
          </section>
        )
      )}

      {tab === 'transactions' && (
        txs.isLoading ? <LoadingRows /> : txs.isError ? (
          <ErrorState message="Could not load transactions." onRetry={() => void txs.refetch()} />
        ) : (
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Date & time</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(txs.data?.transactions || []).map((t: PaymentTransactionRow) => (
                    <tr
                      key={t.id}
                      className="cursor-pointer border-b border-border/60 transition hover:bg-muted/30"
                      onClick={() => setSelectedUserId(t.userId)}
                    >
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDateTime(t.capturedAt)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{t.user?.name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{t.user?.email || t.user?.phone}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold">{inr(t.amountInr)}</td>
                      <td className="px-4 py-3">{t.methodLabel || t.method}</td>
                      <td className="px-4 py-3">{t.isTrial ? <Badge tone="warning">Trial</Badge> : <Badge tone="success">Recurring</Badge>}</td>
                      <td className="px-4 py-3 font-mono text-xs break-all">{t.providerPaymentId}</td>
                      <td className="px-4 py-3">{statusBadge(t.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {txs.data?.pagination ? (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
                <span className="text-muted-foreground">Page {txs.data.pagination.page} of {txs.data.pagination.pages} · {txs.data.pagination.total} transactions</span>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" disabled={txPage <= 1} onClick={() => setTxPage((p) => p - 1)}>Prev</Button>
                  <Button type="button" variant="secondary" size="sm" disabled={txPage >= txs.data.pagination.pages} onClick={() => setTxPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            ) : null}
          </section>
        )
      )}

      {selectedUserId ? <DetailDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} /> : null}
    </div>
  )
}
