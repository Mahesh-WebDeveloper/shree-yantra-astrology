import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDownAZ, ArrowUpZA, CheckSquare, Search, Square, Trash2, X } from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { queryKeys, useUsers } from '@/api/queries'
import type { User } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingRows } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/store/AuthContext'

type SortField = 'createdAt' | 'name' | 'email' | 'plan' | 'role'
type SortDir = 'asc' | 'desc'
type PlanFilter = '' | 'free' | 'premium'
type RoleFilter = '' | 'user' | 'admin'
type StatusFilter = '' | 'active' | 'blocked'

function userId(user: User) {
  return user.id || user._id || ''
}

function canBulkSelect(user: User, selfId: string | undefined) {
  const id = userId(user)
  if (!id || id === selfId) return false
  if (user.role === 'admin') return false
  return true
}

export default function UsersPage() {
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
  const [selected, setSelected] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const queryClient = useQueryClient()
  const toast = useToast()

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

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<User> }) => endpoints.updateUser(payload.id, payload.data),
    onSuccess: (updated) => {
      setSelected(updated)
      invalidate()
      toast.success('User updated')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: endpoints.deleteUser,
    onSuccess: () => {
      setDeleteTarget(null)
      setSelected(null)
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
      if (selected && result.ids.includes(userId(selected))) setSelected(null)
      invalidate()
      const skipped = result.skipped.length
      toast.success(
        skipped
          ? `Deleted ${result.deleted} user(s). ${skipped} skipped (admin/self/invalid).`
          : `Deleted ${result.deleted} user(s).`,
      )
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
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

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Users"
        description="Search, filter, bulk-manage and moderate app accounts."
        action={
          pagination ? (
            <Badge tone="accent">{pagination.total.toLocaleString('en-IN')} total users</Badge>
          ) : null
        }
      />

      <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
        <div className="grid gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search name, email, phone"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-wrap lg:items-center">
              <Select
                value={planFilter}
                onChange={(event) => {
                  setPlanFilter(event.target.value as PlanFilter)
                  setPage(1)
                }}
                aria-label="Filter by plan"
              >
                <option value="">All plans</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </Select>
              <Select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value as RoleFilter)
                  setPage(1)
                }}
                aria-label="Filter by role"
              >
                <option value="">All roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Select>
              <Select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter)
                  setPage(1)
                }}
                aria-label="Filter by status"
              >
                <option value="">All status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </Select>
              <Select
                value={String(limit)}
                onChange={(event) => {
                  setLimit(Number(event.target.value))
                  setPage(1)
                }}
                aria-label="Rows per page"
              >
                <option value="12">12 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select className="min-w-[140px]" value={sortField} onChange={(event) => setSortField(event.target.value as SortField)} aria-label="Sort field">
              <option value="createdAt">Sort: Created</option>
              <option value="name">Sort: Name</option>
              <option value="email">Sort: Email</option>
              <option value="plan">Sort: Plan</option>
              <option value="role">Sort: Role</option>
            </Select>
            <Button type="button" variant="secondary" size="icon" onClick={() => setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))} aria-label="Toggle sort direction">
              {sortDir === 'asc' ? <ArrowDownAZ className="size-4" /> : <ArrowUpZA className="size-4" />}
            </Button>
            {hasFilters ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>

        {selectedIds.size > 0 ? (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">
              {selectedIds.size} user{selectedIds.size === 1 ? '' : 's'} selected
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedIds(new Set())}>
                <X className="size-4" />
                Clear selection
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="size-4" />
                Delete selected
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-4">
          {users.isLoading ? <LoadingRows /> : null}
          {users.isError ? <ErrorState message="Could not load users." onRetry={() => void users.refetch()} /> : null}
          {users.data && rows.length === 0 ? <EmptyState title="No users match the current filters." /> : null}
          {users.data && rows.length > 0 ? (
            <>
              <div className="grid gap-3 md:hidden">
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
                  <button type="button" className="flex cursor-pointer items-center gap-2 text-sm font-medium" onClick={toggleAllOnPage}>
                    {allPageSelected ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4" />}
                    Select page ({selectableOnPage.length})
                  </button>
                </div>
                {rows.map((user, index) => {
                  const id = userId(user)
                  const selectable = canBulkSelect(user, selfId)
                  const checked = selectedIds.has(id)
                  return (
                    <div
                      key={id}
                      className={cnCard(checked)}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          disabled={!selectable}
                          onClick={() => toggleRow(user)}
                          className="mt-0.5 shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label={selectable ? 'Select user' : 'Cannot select admin or your account'}
                        >
                          {checked ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4" />}
                        </button>
                        <button type="button" onClick={() => setSelected(user)} className="min-w-0 flex-1 text-left">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">#{rowOffset + index + 1}</p>
                              <p className="truncate font-semibold">{user.name || 'Unnamed user'}</p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">{user.email || user.phone || id}</p>
                            </div>
                            <Badge tone={user.blocked ? 'danger' : 'success'}>{user.blocked ? 'blocked' : 'active'}</Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge tone={user.plan === 'premium' ? 'warning' : 'neutral'}>{user.plan}</Badge>
                            <Badge tone={user.role === 'admin' ? 'accent' : 'neutral'}>{user.role}</Badge>
                            <Badge>{formatDate(user.createdAt)}</Badge>
                          </div>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[920px] border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="border-b border-border px-2 py-2 font-medium w-10">
                        <button type="button" onClick={toggleAllOnPage} aria-label="Select all on page" className="grid cursor-pointer place-items-center">
                          {allPageSelected ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4" />}
                        </button>
                      </th>
                      <th className="border-b border-border px-2 py-2 font-medium w-12">#</th>
                      {(['name', 'email', 'plan', 'role', 'createdAt'] as SortField[]).map((field) => (
                        <th key={field} className="border-b border-border px-3 py-2 font-medium">
                          <button type="button" onClick={() => toggleSort(field)} className="capitalize hover:text-foreground">
                            {field === 'createdAt' ? 'Created' : field}
                            {sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                          </button>
                        </th>
                      ))}
                      <th className="border-b border-border px-3 py-2 font-medium">Status</th>
                      <th className="border-b border-border px-3 py-2 font-medium w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((user, index) => {
                      const id = userId(user)
                      const selectable = canBulkSelect(user, selfId)
                      const checked = selectedIds.has(id)
                      return (
                        <tr key={id} className={checked ? 'bg-primary/5' : 'hover:bg-muted/60'}>
                          <td className="border-b border-border px-2 py-3">
                            <button
                              type="button"
                              disabled={!selectable}
                              onClick={() => toggleRow(user)}
                              className="grid cursor-pointer place-items-center disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label={selectable ? 'Select user' : 'Cannot select'}
                            >
                              {checked ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4" />}
                            </button>
                          </td>
                          <td className="border-b border-border px-2 py-3 tabular-nums text-muted-foreground">{rowOffset + index + 1}</td>
                          <td className="border-b border-border px-3 py-3 font-medium cursor-pointer" onClick={() => setSelected(user)}>{user.name}</td>
                          <td className="border-b border-border px-3 py-3 text-muted-foreground cursor-pointer" onClick={() => setSelected(user)}>{user.email || user.phone || 'No identifier'}</td>
                          <td className="border-b border-border px-3 py-3 cursor-pointer" onClick={() => setSelected(user)}>
                            <Badge tone={user.plan === 'premium' ? 'warning' : 'neutral'}>{user.plan}</Badge>
                          </td>
                          <td className="border-b border-border px-3 py-3 cursor-pointer" onClick={() => setSelected(user)}>
                            <Badge tone={user.role === 'admin' ? 'accent' : 'neutral'}>{user.role}</Badge>
                          </td>
                          <td className="border-b border-border px-3 py-3 text-muted-foreground cursor-pointer" onClick={() => setSelected(user)}>{formatDate(user.createdAt)}</td>
                          <td className="border-b border-border px-3 py-3 cursor-pointer" onClick={() => setSelected(user)}>
                            <Badge tone={user.blocked ? 'danger' : 'success'}>{user.blocked ? 'blocked' : 'active'}</Badge>
                          </td>
                          <td className="border-b border-border px-3 py-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={!selectable}
                              onClick={() => setDeleteTarget(user)}
                              aria-label="Delete user"
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
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
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {rowOffset + 1}–{Math.min(rowOffset + rows.length, pagination.total)} of {pagination.total.toLocaleString('en-IN')} · Page {pagination.page} of {pagination.pages}
            </span>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <Button type="button" variant="secondary" disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        ) : null}
      </section>

      {selected ? (
        <aside className="fixed inset-y-0 right-0 z-40 w-full overflow-y-auto border-l border-border bg-card p-4 pb-24 shadow-xl sm:max-w-md sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{selected.name}</h2>
              <p className="break-all text-sm text-muted-foreground">{selected.email || selected.phone || userId(selected)}</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => setSelected(null)}>Close</Button>
          </div>
          <div className="mt-5 grid gap-4">
            <Field label="Name">
              <Input
                value={selected.name}
                onChange={(event) => setSelected({ ...selected, name: event.target.value })}
                onBlur={() => updateMutation.mutate({ id: userId(selected), data: { name: selected.name } })}
              />
            </Field>
            <Field label="Plan">
              <Select
                value={selected.plan}
                onChange={(event) => updateMutation.mutate({ id: userId(selected), data: { plan: event.target.value as User['plan'] } })}
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </Select>
            </Field>
            <Field label="Role">
              <Select
                value={selected.role}
                onChange={(event) => updateMutation.mutate({ id: userId(selected), data: { role: event.target.value as User['role'] } })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium">Blocked</p>
                <p className="text-xs text-muted-foreground">Blocked users cannot authenticate.</p>
              </div>
              <Switch
                checked={selected.blocked}
                label="Blocked"
                onCheckedChange={(checked) => updateMutation.mutate({ id: userId(selected), data: { blocked: checked } })}
              />
            </div>
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              <p>Providers: {selected.providers.join(', ') || 'none'}</p>
              <p>Created: {formatDate(selected.createdAt)}</p>
              <p>Last login: {formatDate(selected.lastLoginAt)}</p>
            </div>
            {canBulkSelect(selected, selfId) ? (
              <Button type="button" variant="destructive" onClick={() => setDeleteTarget(selected)}>
                <Trash2 className="size-4" />
                Delete user
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">Admin accounts and your own account cannot be deleted from here.</p>
            )}
          </div>
        </aside>
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete user"
        description={`Delete ${deleteTarget?.name || 'this user'} permanently? This cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(userId(deleteTarget))}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedIds.size} users`}
        description={`Permanently delete ${selectedIds.size} selected user account(s)? Admin accounts and your own account are skipped automatically.`}
        confirmLabel={`Delete ${selectedIds.size}`}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={() => bulkDeleteMutation.mutate([...selectedIds])}
      />
    </div>
  )
}

function cnCard(selected: boolean) {
  return [
    'rounded-lg border p-3 transition',
    selected ? 'border-primary/40 bg-primary/5' : 'border-border bg-background',
  ].join(' ')
}
