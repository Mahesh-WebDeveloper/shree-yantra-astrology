import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDownAZ, ArrowUpZA, Search, Trash2 } from 'lucide-react'

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

type SortField = 'createdAt' | 'name' | 'email' | 'plan' | 'role'
type SortDir = 'asc' | 'desc'

function userId(user: User) {
  return user.id || user._id || ''
}

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selected, setSelected] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const queryClient = useQueryClient()
  const toast = useToast()

  const params = useMemo(
    () => ({ page, limit: 12, search: search || undefined, sort: `${sortField}:${sortDir}` }),
    [page, search, sortField, sortDir],
  )
  const users = useUsers(params)

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.users(params) })
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

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Users" description="Search, inspect, update plans and moderate accounts." />
      <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name, email, phone" value={search} onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }} />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:items-center">
            <Select className="min-w-0" value={sortField} onChange={(event) => setSortField(event.target.value as SortField)} aria-label="Sort field">
              <option value="createdAt">Created</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="plan">Plan</option>
              <option value="role">Role</option>
            </Select>
            <Button type="button" variant="secondary" size="icon" onClick={() => setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))} aria-label="Toggle sort direction">
              {sortDir === 'asc' ? <ArrowDownAZ className="size-4" /> : <ArrowUpZA className="size-4" />}
            </Button>
          </div>
        </div>

        <div className="mt-4">
          {users.isLoading ? <LoadingRows /> : null}
          {users.isError ? <ErrorState message="Could not load users." onRetry={() => void users.refetch()} /> : null}
          {users.data && users.data.users.length === 0 ? <EmptyState title="No users match the current filters." /> : null}
          {users.data && users.data.users.length > 0 ? (
            <>
              <div className="grid gap-3 md:hidden">
                {users.data.users.map((user) => (
                  <button
                    key={userId(user)}
                    type="button"
                    onClick={() => setSelected(user)}
                    className="rounded-lg border border-border bg-background p-3 text-left transition active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{user.name || 'Unnamed user'}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{user.email || user.phone || userId(user)}</p>
                      </div>
                      <Badge tone={user.blocked ? 'danger' : 'success'}>{user.blocked ? 'blocked' : 'active'}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone={user.plan === 'premium' ? 'warning' : 'neutral'}>{user.plan}</Badge>
                      <Badge tone={user.role === 'admin' ? 'accent' : 'neutral'}>{user.role}</Badge>
                      <Badge>{formatDate(user.createdAt)}</Badge>
                    </div>
                  </button>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      {(['name', 'email', 'plan', 'role', 'createdAt'] as SortField[]).map((field) => (
                        <th key={field} className="border-b border-border px-3 py-2 font-medium">
                          <button type="button" onClick={() => toggleSort(field)} className="capitalize hover:text-foreground">
                            {field === 'createdAt' ? 'Created' : field}
                          </button>
                        </th>
                      ))}
                      <th className="border-b border-border px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.data.users.map((user) => (
                      <tr key={userId(user)} className="cursor-pointer hover:bg-muted/60" onClick={() => setSelected(user)}>
                        <td className="border-b border-border px-3 py-3 font-medium">{user.name}</td>
                        <td className="border-b border-border px-3 py-3 text-muted-foreground">{user.email || user.phone || 'No identifier'}</td>
                        <td className="border-b border-border px-3 py-3">
                          <Badge tone={user.plan === 'premium' ? 'warning' : 'neutral'}>{user.plan}</Badge>
                        </td>
                        <td className="border-b border-border px-3 py-3">
                          <Badge tone={user.role === 'admin' ? 'accent' : 'neutral'}>{user.role}</Badge>
                        </td>
                        <td className="border-b border-border px-3 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                        <td className="border-b border-border px-3 py-3">
                          <Badge tone={user.blocked ? 'danger' : 'success'}>{user.blocked ? 'blocked' : 'active'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>

        {users.data ? (
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Page {users.data.pagination.page} of {users.data.pagination.pages}
            </span>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <Button type="button" variant="secondary" disabled={page >= users.data.pagination.pages} onClick={() => setPage((value) => value + 1)}>Next</Button>
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
            <Button type="button" variant="destructive" onClick={() => setDeleteTarget(selected)}>
              <Trash2 className="size-4" />
              Delete user
            </Button>
          </div>
        </aside>
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete user"
        description={`Delete ${deleteTarget?.name || 'this user'} permanently?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(userId(deleteTarget))}
      />
    </div>
  )
}
