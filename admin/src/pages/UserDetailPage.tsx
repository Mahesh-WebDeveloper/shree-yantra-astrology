import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  ArrowLeft,
  Ban,
  Calendar,
  Crown,
  CreditCard,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Shield,
  Smartphone,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { assetUrl } from '@/api/assets'
import { queryKeys, useActivityUser, useSubscriptionDetail, useUser } from '@/api/queries'
import type { User } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ErrorState, LoadingPanel } from '@/components/DataState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import {
  avatarFromProfile,
  canBulkSelect,
  planTone,
  providerLabel,
  relativeTime,
  roleTone,
  statusTone,
  userId,
  userInitials,
} from '@/lib/usersPage'
import { formatDate, formatDateTime } from '@/lib/utils'
import { useAuth } from '@/store/AuthContext'

type Tab = 'overview' | 'account' | 'activity' | 'billing'

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  account: 'Account',
  activity: 'Activity',
  billing: 'Billing',
}

function UserAvatar({ user, size = 'lg' }: { user: User; size?: 'sm' | 'lg' }) {
  const avatar = avatarFromProfile(user)
  const cls = size === 'lg' ? 'size-20 text-2xl' : 'size-10 text-sm'
  if (avatar) {
    return <img src={assetUrl(avatar)} alt="" className={`${cls} shrink-0 rounded-full border-2 border-border object-cover`} />
  }
  return (
    <div className={`${cls} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 font-bold text-primary`}>
      {userInitials(user.name)}
    </div>
  )
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { user: adminUser } = useAuth()
  const selfId = adminUser?.id || adminUser?._id

  const userQuery = useUser(id)
  const activityQuery = useActivityUser(id || '')
  const billingQuery = useSubscriptionDetail(id || '')
  const [draft, setDraft] = useState<User | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (userQuery.data) setDraft(userQuery.data)
  }, [userQuery.data])

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['users'] })
    void queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    if (id) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.user(id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.activityUser(id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionDetail(id) })
    }
  }

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<User>) => endpoints.updateUser(id!, payload),
    onSuccess: (updated) => {
      setDraft(updated)
      setDirty(false)
      invalidate()
      toast.success('User updated')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: endpoints.deleteUser,
    onSuccess: () => {
      invalidate()
      toast.success('User deleted')
      navigate('/users')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const saveAccount = () => {
    if (!draft) return
    updateMutation.mutate({
      name: draft.name,
      plan: draft.plan,
      role: draft.role,
      blocked: draft.blocked,
    })
  }

  const patch = (next: Partial<User>) => {
    setDirty(true)
    setDraft((prev) => (prev ? { ...prev, ...next } : prev))
  }

  if (userQuery.isLoading) return <LoadingPanel label="Loading user…" />
  if (userQuery.isError || !draft) {
    return <ErrorState message="Could not load this user." onRetry={() => void userQuery.refetch()} />
  }

  const activity = activityQuery.data
  const billing = billingQuery.data
  const profile = (draft.profile || {}) as Record<string, string | number | undefined>
  const deletable = canBulkSelect(draft, selfId)
  const online = activity?.summary?.online

  return (
    <div className="grid min-w-0 gap-0">
      <header className="sticky top-0 z-10 -mx-3 border-b border-border bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Button type="button" variant="ghost" size="icon" className="mt-0.5 shrink-0" onClick={() => navigate('/users')} aria-label="Back">
              <ArrowLeft className="size-5" />
            </Button>
            <UserAvatar user={draft} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="max-w-full truncate text-lg font-semibold sm:text-xl">{draft.name || 'Unnamed user'}</h1>
                <Badge tone={statusTone(!!draft.blocked)}>{draft.blocked ? 'Blocked' : 'Active'}</Badge>
                <Badge tone={planTone(draft.plan)}>{draft.plan}</Badge>
                {draft.role === 'admin' ? <Badge tone={roleTone(draft.role)}>Admin</Badge> : null}
                {online ? <Badge tone="success">Online</Badge> : null}
                {dirty ? <Badge tone="warning">Unsaved</Badge> : null}
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">{draft.email || draft.phone || userId(draft)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Joined {formatDate(draft.createdAt)} · Last login {relativeTime(draft.lastLoginAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pl-0 sm:pl-12">
            {deletable ? (
              <Button type="button" variant="destructive" size="sm" className="flex-1 sm:flex-none" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" /> Delete
              </Button>
            ) : null}
            {tab === 'account' && dirty ? (
              <Button type="button" className="flex-1 sm:flex-none" disabled={updateMutation.isPending} onClick={saveAccount}>
                {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Save changes
              </Button>
            ) : null}
          </div>
        </div>
        <nav className="admin-scroll-x mt-3 flex gap-1 pb-0.5">
          {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </nav>
      </header>

      <div className="grid min-w-0 gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-w-0 gap-6">
          {tab === 'overview' ? (
            <>
              <section className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
                {[
                  { label: 'Events', value: activity?.summary?.events ?? '—', icon: Activity },
                  { label: 'Sessions', value: activity?.summary?.sessions ?? '—', icon: Smartphone },
                  { label: 'Devices', value: activity?.devices?.length ?? '—', icon: Globe },
                  { label: 'Last seen', value: activity?.summary?.lastSeen ? relativeTime(activity.summary.lastSeen) : '—', icon: Calendar },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <item.icon className="size-4 text-primary" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold tabular-nums">{item.value}</p>
                  </div>
                ))}
              </section>

              <section className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:p-6 lg:grid-cols-2">
                <div>
                  <h2 className="font-semibold">Contact & identity</h2>
                  <ul className="mt-4 grid gap-3 text-sm">
                    <li className="flex items-center gap-3">
                      <Mail className="size-4 shrink-0 text-muted-foreground" />
                      <span>{draft.email || 'No email'}</span>
                      {draft.emailVerified ? <Badge tone="success">Verified</Badge> : null}
                    </li>
                    <li className="flex items-center gap-3">
                      <Phone className="size-4 shrink-0 text-muted-foreground" />
                      <span>{draft.phone || 'No phone'}</span>
                      {draft.phoneVerified ? <Badge tone="success">Verified</Badge> : null}
                    </li>
                    <li className="flex items-start gap-3">
                      <Shield className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span>{draft.providers.length ? draft.providers.map(providerLabel).join(', ') : 'No providers'}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h2 className="font-semibold">Profile & birth data</h2>
                  <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-3"><Calendar className="size-4 shrink-0" /> DOB: <span className="text-foreground">{String(profile.dob || '—')}</span></li>
                    <li className="flex items-center gap-3"><Calendar className="size-4 shrink-0" /> TOB: <span className="text-foreground">{String(profile.tob || '—')}</span></li>
                    <li className="flex items-center gap-3"><MapPin className="size-4 shrink-0" /> Place: <span className="text-foreground">{String(profile.place || '—')}</span></li>
                    <li>Gender: <span className="text-foreground">{String(profile.gender || '—')}</span></li>
                    <li>Interests: <span className="text-foreground">{draft.interests?.length ? draft.interests.join(', ') : '—'}</span></li>
                  </ul>
                </div>
              </section>

              {activity?.topScreens?.length ? (
                <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
                  <h2 className="font-semibold">Top screens</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activity.topScreens.slice(0, 12).map((s) => (
                      <Badge key={s.screen}>{s.screen} · {s.count}</Badge>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}

          {tab === 'account' ? (
            <section className="grid max-w-xl gap-5 rounded-xl border border-border bg-card p-4 sm:p-6">
              <h2 className="font-semibold">Manage account</h2>
              <Field label="Display name">
                <Input value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
              </Field>
              <Field label="Plan">
                <Select value={draft.plan} onChange={(e) => patch({ plan: e.target.value as User['plan'] })}>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </Select>
              </Field>
              <Field label="Role">
                <Select value={draft.role} onChange={(e) => patch({ role: e.target.value as User['role'] })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </Select>
              </Field>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="flex items-center gap-2 font-medium"><Ban className="size-4" /> Block account</p>
                  <p className="mt-1 text-xs text-muted-foreground">Blocked users cannot sign in to the app.</p>
                </div>
                <Switch checked={draft.blocked} label="Blocked" onCheckedChange={(checked) => patch({ blocked: checked })} />
              </div>
              {!deletable ? (
                <p className="text-xs text-muted-foreground">Admin accounts and your own account have restricted delete/block rules.</p>
              ) : null}
            </section>
          ) : null}

          {tab === 'activity' ? (
            <section className="grid gap-6">
              {activityQuery.isLoading ? <LoadingPanel label="Loading activity…" /> : null}
              {activity?.perDay?.length ? (
                <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
                  <h2 className="font-semibold">Activity (14 days)</h2>
                  <div className="mt-4 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activity.perDay}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => String(v).slice(5)} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : null}
              {activity?.timeline?.length ? (
                <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
                  <h2 className="font-semibold">Recent events</h2>
                  <ul className="mt-4 grid gap-2">
                    {activity.timeline.slice(0, 30).map((ev) => (
                      <li key={ev._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium">{ev.name}</span>
                          {ev.screen ? <span className="ml-2 text-muted-foreground">· {ev.screen}</span> : null}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDateTime(ev.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/activity" className="mt-4 inline-flex text-xs font-medium text-primary hover:underline">
                    Open full activity dashboard →
                  </Link>
                </div>
              ) : (
                !activityQuery.isLoading ? <p className="text-sm text-muted-foreground">No activity recorded yet for this user.</p> : null
              )}
            </section>
          ) : null}

          {tab === 'billing' ? (
            <section className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:p-6">
              <h2 className="flex items-center gap-2 font-semibold"><CreditCard className="size-5" /> Subscription & payments</h2>
              {billingQuery.isLoading ? <LoadingPanel label="Loading billing…" /> : null}
              {billing?.subscription ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="mt-1 font-semibold capitalize">{billing.subscription.status || '—'}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-xs text-muted-foreground">Entitlement</p>
                    <p className="mt-1 font-semibold">{billing.subscription.entitlementActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  {billing.subscription.currentPeriodEnd ? (
                    <div className="rounded-lg border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground">Current period ends</p>
                      <p className="mt-1 font-semibold">{formatDateTime(billing.subscription.currentPeriodEnd)}</p>
                    </div>
                  ) : null}
                  {billing.subscription.nextChargeAt ? (
                    <div className="rounded-lg border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground">Next charge</p>
                      <p className="mt-1 font-semibold">{formatDateTime(billing.subscription.nextChargeAt)}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                !billingQuery.isLoading ? <p className="text-sm text-muted-foreground">No Razorpay subscription on file for this user.</p> : null
              )}
              {billing?.transactions?.length ? (
                <div>
                  <h3 className="text-sm font-semibold">Recent payments</h3>
                  <ul className="mt-3 grid gap-2">
                    {billing.transactions.slice(0, 10).map((tx) => (
                      <li key={tx.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                        <span>₹{(tx.amountInr || (tx.amountPaise || 0) / 100).toLocaleString('en-IN')} · {tx.eventType || tx.status}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(tx.capturedAt || tx.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Link to="/subscriptions" className="inline-flex text-xs font-medium text-primary hover:underline">
                Open subscriptions dashboard →
              </Link>
            </section>
          ) : null}
        </div>

        <aside className="grid gap-4 lg:sticky lg:top-36 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">Quick info</h3>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">User ID</dt><dd className="truncate font-mono text-xs">{userId(draft)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Created</dt><dd>{formatDate(draft.createdAt)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Updated</dt><dd>{draft.updatedAt ? formatDate(draft.updatedAt) : '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Last login</dt><dd>{draft.lastLoginAt ? formatDateTime(draft.lastLoginAt) : 'Never'}</dd></div>
            </dl>
          </div>
          {activity?.devices?.length ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">Devices</h3>
              <ul className="mt-3 grid gap-2 text-xs">
                {activity.devices.slice(0, 4).map((d) => (
                  <li key={d.deviceId} className="rounded-md border border-border bg-background p-2">
                    <p className="font-medium">{d.device || d.platform || 'Unknown device'}</p>
                    <p className="text-muted-foreground">{d.appVersion ? `v${d.appVersion}` : ''} · {d.events} events</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {draft.subscription?.status ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><Crown className="size-4 text-amber-600" /> Subscription mirror</h3>
              <p className="mt-2 text-sm capitalize">{draft.subscription.status}</p>
            </div>
          ) : null}
        </aside>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete user"
        description={`Permanently delete ${draft.name}? This cannot be undone.`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(userId(draft))}
      />
    </div>
  )
}
