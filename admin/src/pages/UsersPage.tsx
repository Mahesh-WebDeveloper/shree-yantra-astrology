import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownAZ,
  ArrowUpZA,
  CheckSquare,
  ChevronRight,
  Crown,
  LayoutGrid,
  List,
  Search,
  Shield,
  Square,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { assetUrl } from '@/api/assets'
import { queryKeys, useStats, useUsers } from '@/api/queries'
import type { User } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingRows } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/form'
import { useToast } from '@/components/ui/toast'
import {
  SORT_OPTIONS,
  avatarFromProfile,
  canBulkSelect,
  planTone,
  relativeTime,
  roleTone,
  statusTone,
  userId,
  userInitials,
  type PlanFilter,
  type RoleFilter,
  type SortDir,
  type SortField,
  type StatusFilter,
} from '@/lib/usersPage'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/store/AuthContext'

type ViewMode = 'cards' | 'table'

function UserAvatar({ user, className = 'size-11 text-sm' }: { user: User; className?: string }) {
  const avatar = avatarFromProfile(user)
  if (avatar) {
    return <img src={assetUrl(avatar)} alt="" className={`${className} shrink-0 rounded-full border border-border object-cover`} />
  }
  return (
    <div className={`${className} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/25 to-primary/5 font-semibold text-primary`}>
      {userInitials(user.name)}
    </div>
  )
}

export default function UsersPage() {
  const navigate = useNavigate()
  const { user: adminUser } = useAuth()
  const selfId = adminUser?.id || adminUser?._id

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [planFilter, setPlanFilter] = useState<PlanFilter>('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const queryClient = useQueryClient()
  const toast = useToast()
  const stats = useStats()

  const params = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      sort: `${sortField}:${sortDir}`,
      plan: planFilter || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
    }),
    [page, limit, search, sortField, sortDir, planFilter, roleFilter, statusFilter],
  )
  const users = useUsers(params)

  useEffect(() => {
    setSelectedIds(new Set())
  }, [page, limit, search, planFilter, roleFilter, statusFilter, sortField, sortDir])

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['users'] })
    void queryClient.invalidateQueries({ queryKey: queryKeys.stats })
  }

  const deleteMutation = useMutation({
    mutationFn: endpoints.deleteUser,
    onSuccess: () => {
      setDeleteTarget(null)
      invalidate()
      toast.success('User deleted')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: endpoints.bulkDeleteUsers,
    onSuccess: (result) => {
      setBulkDeleteOpen(false)
      setSelectedIds(new Set())
      invalidate()
      const skipped = result.skipped.length
      toast.success(skipped ? `Deleted ${result.deleted} user(s). ${skipped} skipped.` : `Deleted ${result.deleted} user(s).`)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir(field === 'name' || field === 'email' ? 'asc' : 'desc')
    }
    setPage(1)
  }

  const rows = users.data?.users ?? []
  const pagination = users.data?.pagination
  const rowOffset = pagination ? (pagination.page - 1) * pagination.limit : 0

  const selectableOnPage = rows.filter((user) => canBulkSelect(user, selfId))
  const allPageSelected = selectableOnPage.length > 0 && selectableOnPage.every((user) => selectedIds.has(userId(user)))

  const toggleRow = (user: User) => {
    const id = userId(user)
    if (!canBulkSelect(user, selfId)) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllOnPage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        selectableOnPage.forEach((user) => next.delete(userId(user)))
        return next
      })
      return
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      selectableOnPage.forEach((user) => next.add(userId(user)))
      return next
    })
  }

  const clearFilters = () => {
    setSearch('')
    setPlanFilter('')
    setRoleFilter('')
    setStatusFilter('')
    setPage(1)
  }

  const hasFilters = search || planFilter || roleFilter || statusFilter

  const quickFilters: Array<{ label: string; apply: () => void; active: boolean }> = [
    { label: 'Premium', apply: () => { setPlanFilter('premium'); setPage(1) }, active: planFilter === 'premium' },
    { label: 'Free', apply: () => { setPlanFilter('free'); setPage(1) }, active: planFilter === 'free' },
    { label: 'Admins', apply: () => { setRoleFilter('admin'); setPage(1) }, active: roleFilter === 'admin' },
    { label: 'Blocked', apply: () => { setStatusFilter('blocked'); setPage(1) }, active: statusFilter === 'blocked' },
    { label: 'Active', apply: () => { setStatusFilter('active'); setPage(1) }, active: statusFilter === 'active' },
  ]

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Users"
        description="Search, filter, sort and manage all app accounts — open any user for full profile, activity & billing."
      />

      {stats.data ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total users', value: stats.data.totalUsers, icon: Users, tone: 'text-primary' },
            { label: 'New (7 days)', value: stats.data.newUsersLast7Days, icon: UserPlus, tone: 'text-emerald-600' },
            { label: 'Premium', value: stats.data.premiumUsers, icon: Crown, tone: 'text-amber-600' },
            { label: 'Free', value: stats.data.freeUsers, icon: Shield, tone: 'text-muted-foreground' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <item.icon className={`size-4 ${item.tone}`} />
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums">{item.value.toLocaleString('en-IN')}</p>
              {pagination && item.label === 'Total users' ? (
                <p className="mt-1 text-xs text-muted-foreground">{pagination.total.toLocaleString('en-IN')} match filters</p>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-muted/20 px-3 py-3 sm:px-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1 lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 pl-9"
                placeholder="Search name, email, phone…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center lg:justify-end">
              <Select className="h-9 w-full min-w-0 sm:w-auto sm:min-w-[7.25rem]" value={planFilter} onChange={(e) => { setPlanFilter(e.target.value as PlanFilter); setPage(1) }} aria-label="Plan">
                <option value="">All plans</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </Select>
              <Select className="h-9 w-full min-w-0 sm:w-auto sm:min-w-[7.25rem]" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as RoleFilter); setPage(1) }} aria-label="Role">
                <option value="">All roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Select>
              <Select className="h-9 w-full min-w-0 sm:w-auto sm:min-w-[7.25rem]" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1) }} aria-label="Status">
                <option value="">All status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </Select>
              <Select className="h-9 w-full min-w-0 sm:w-auto sm:min-w-[4.5rem]" value={String(limit)} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }} aria-label="Page size">
                <option value="12">12</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </Select>
              <div className="col-span-2 flex h-9 w-full shrink-0 justify-end rounded-md border border-border bg-background p-0.5 sm:w-auto">
                <Button type="button" variant={viewMode === 'cards' ? 'default' : 'ghost'} size="icon" className="size-8" onClick={() => setViewMode('cards')} aria-label="Card view">
                  <LayoutGrid className="size-4" />
                </Button>
                <Button type="button" variant={viewMode === 'table' ? 'default' : 'ghost'} size="icon" className="size-8" onClick={() => setViewMode('table')} aria-label="Table view">
                  <List className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="mr-0.5 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Quick</span>
              {quickFilters.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={f.apply}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    f.active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              {hasFilters ? (
                <button type="button" onClick={clearFilters} className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                  <X className="size-3" /> Clear
                </button>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:justify-end">
              <span className="mr-0.5 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sort</span>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleSort(opt.value)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    sortField === opt.value
                      ? 'bg-primary/15 text-primary ring-1 ring-primary/25'
                      : 'border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  {opt.label}
                  {sortField === opt.value ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </button>
              ))}
              <Button type="button" variant="secondary" size="icon" className="size-7 shrink-0" onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))} aria-label="Toggle sort direction">
                {sortDir === 'asc' ? <ArrowDownAZ className="size-3.5" /> : <ArrowUpZA className="size-3.5" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4">
        {selectedIds.size > 0 ? (
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">{selectedIds.size} selected</p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="size-4" /> Delete selected
              </Button>
            </div>
          </div>
        ) : null}

        <div>
          {users.isLoading ? <LoadingRows /> : null}
          {users.isError ? <ErrorState message="Could not load users." onRetry={() => void users.refetch()} /> : null}
          {users.data && rows.length === 0 ? <EmptyState title="No users match your filters." /> : null}

          {rows.length > 0 && viewMode === 'cards' ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((user) => {
                const id = userId(user)
                const selectable = canBulkSelect(user, selfId)
                const checked = selectedIds.has(id)
                return (
                  <div
                    key={id}
                    className={`group relative overflow-hidden rounded-xl border bg-background transition hover:border-primary/40 hover:shadow-md ${
                      checked ? 'border-primary/50 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="absolute left-3 top-3 z-10">
                      <button
                        type="button"
                        disabled={!selectable}
                        onClick={() => toggleRow(user)}
                        className="rounded-md bg-background/90 p-1 shadow-sm backdrop-blur disabled:opacity-30"
                        aria-label="Select user"
                      >
                        {checked ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4" />}
                      </button>
                    </div>
                    <button type="button" className="flex w-full flex-col p-4 pt-12 text-left" onClick={() => navigate(`/users/${id}`)}>
                      <div className="flex items-start gap-3">
                        <UserAvatar user={user} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{user.name || 'Unnamed'}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email || user.phone || id}</p>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        <Badge tone={planTone(user.plan)}>{user.plan}</Badge>
                        <Badge tone={roleTone(user.role)}>{user.role}</Badge>
                        <Badge tone={statusTone(!!user.blocked)}>{user.blocked ? 'blocked' : 'active'}</Badge>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Joined {formatDate(user.createdAt)} · Login {relativeTime(user.lastLoginAt)}
                      </p>
                    </button>
                    {selectable ? (
                      <div className="border-t border-border p-2">
                        <Button type="button" variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" onClick={() => setDeleteTarget(user)}>
                          <Trash2 className="size-3.5" /> Delete
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : null}

          {rows.length > 0 && viewMode === 'table' ? (
            <>
              <div className="grid gap-2 md:hidden">
                {rows.map((user) => {
                  const id = userId(user)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => navigate(`/users/${id}`)}
                      className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition hover:border-primary/35"
                    >
                      <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/15 text-sm font-semibold text-primary">
                        {avatarFromProfile(user) ? (
                          <img src={assetUrl(avatarFromProfile(user)!)} alt="" className="size-full object-cover" />
                        ) : (
                          userInitials(user.name)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{user.name || 'Unnamed'}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email || user.phone || '—'}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge tone={planTone(user.plan)}>{user.plan}</Badge>
                          <Badge tone={statusTone(!!user.blocked)}>{user.blocked ? 'Blocked' : 'Active'}</Badge>
                        </div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  )
                })}
              </div>
              <div className="admin-scroll-x hidden rounded-lg border border-border md:block">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 w-10">
                      <button type="button" onClick={toggleAllOnPage} aria-label="Select page">
                        {allPageSelected ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4" />}
                      </button>
                    </th>
                    <th className="px-3 py-3">
                      <button type="button" onClick={() => toggleSort('name')} className="font-medium hover:text-foreground">
                        User{sortField === 'name' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                      </button>
                    </th>
                    <th className="px-3 py-3">
                      <button type="button" onClick={() => toggleSort('createdAt')} className="font-medium hover:text-foreground">
                        Joined{sortField === 'createdAt' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                      </button>
                    </th>
                    <th className="px-3 py-3">
                      <button type="button" onClick={() => toggleSort('lastLoginAt')} className="font-medium hover:text-foreground">
                        Last login{sortField === 'lastLoginAt' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                      </button>
                    </th>
                    <th className="px-3 py-3">
                      <button type="button" onClick={() => toggleSort('plan')} className="font-medium hover:text-foreground">
                        Plan{sortField === 'plan' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                      </button>
                    </th>
                    <th className="px-3 py-3">
                      <button type="button" onClick={() => toggleSort('role')} className="font-medium hover:text-foreground">
                        Role{sortField === 'role' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                      </button>
                    </th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((user, index) => {
                    const id = userId(user)
                    const selectable = canBulkSelect(user, selfId)
                    const checked = selectedIds.has(id)
                    return (
                      <tr key={id} className={`border-t border-border ${checked ? 'bg-primary/5' : 'hover:bg-muted/40'}`}>
                        <td className="px-3 py-3">
                          <button type="button" disabled={!selectable} onClick={() => toggleRow(user)} className="disabled:opacity-30">
                            {checked ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4" />}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <button type="button" className="flex items-center gap-3 text-left" onClick={() => navigate(`/users/${id}`)}>
                            <UserAvatar user={user} className="size-9 text-xs" />
                            <div className="min-w-0">
                              <p className="font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email || user.phone || `#${rowOffset + index + 1}`}</p>
                            </div>
                          </button>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                        <td className="px-3 py-3 text-muted-foreground">{relativeTime(user.lastLoginAt)}</td>
                        <td className="px-3 py-3"><Badge tone={planTone(user.plan)}>{user.plan}</Badge></td>
                        <td className="px-3 py-3"><Badge tone={roleTone(user.role)}>{user.role}</Badge></td>
                        <td className="px-3 py-3"><Badge tone={statusTone(!!user.blocked)}>{user.blocked ? 'blocked' : 'active'}</Badge></td>
                        <td className="px-3 py-3">
                          {selectable ? (
                            <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteTarget(user)} aria-label="Delete">
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            </>
          ) : null}
        </div>

        {pagination ? (
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              {rowOffset + 1}–{Math.min(rowOffset + rows.length, pagination.total)} of {pagination.total.toLocaleString('en-IN')} · Page {pagination.page}/{pagination.pages}
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button type="button" variant="secondary" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        ) : null}
        </div>
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete user"
        description={`Delete ${deleteTarget?.name || 'this user'} permanently?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(userId(deleteTarget))}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedIds.size} users`}
        description="Permanently delete selected accounts? Admins and your own account are skipped."
        confirmLabel={`Delete ${selectedIds.size}`}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={() => bulkDeleteMutation.mutate([...selectedIds])}
      />
    </div>
  )
}
