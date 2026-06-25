import { useMutation, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Save } from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { queryKeys, useSettings } from '@/api/queries'
import type { Settings } from '@/api/types'
import { ErrorState, LoadingPanel } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { formatDateTime } from '@/lib/utils'

function KeyStatus({ label, set }: { label: string; set: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border p-3">
      <span className="flex items-center gap-2 text-sm font-medium">
        <KeyRound className="size-4 text-muted-foreground" />
        {label}
      </span>
      <Badge tone={set ? 'success' : 'danger'}>{set ? 'set' : 'missing'}</Badge>
    </div>
  )
}

export default function SettingsPage() {
  const settings = useSettings()
  const queryClient = useQueryClient()
  const toast = useToast()

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.settings })

  const updateSettings = useMutation({
    mutationFn: endpoints.updateSettings,
    onSuccess: () => {
      invalidate()
      toast.success('Settings updated')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const updateAuth = useMutation({
    mutationFn: endpoints.updateAuthMethods,
    onSuccess: () => {
      invalidate()
      toast.success('Auth methods updated')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  if (settings.isLoading) return <LoadingPanel label="Loading settings" />
  if (settings.isError || !settings.data) return <ErrorState message="Could not load settings." onRetry={() => void settings.refetch()} />

  const data = settings.data
  const updateMethod = (method: keyof Settings['authMethods'], value: boolean) => {
    updateAuth.mutate({ [method]: value })
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Settings" description={`Last updated ${formatDateTime(data.updatedAt)}`} />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-base font-semibold">Astrology and AI</h2>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="vedastro-tier">Astrology API tier</label>
              <Select
                id="vedastro-tier"
                value={data.vedastroTier}
                onChange={(event) => updateSettings.mutate({ vedastroTier: event.target.value as Settings['vedastroTier'] })}
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="ai-provider">AI provider</label>
              <Select
                id="ai-provider"
                value={data.aiProvider}
                onChange={(event) => updateSettings.mutate({ aiProvider: event.target.value as Settings['aiProvider'] })}
              >
                <option value="gemini">Gemini</option>
                <option value="claude">Claude</option>
              </Select>
            </div>
            <div className="grid gap-3">
              <KeyStatus label="Astrology API key" set={data.keyStatus.vedastroKeySet} />
              <KeyStatus label="Gemini key" set={data.keyStatus.geminiKeySet} />
              <KeyStatus label="Claude key" set={data.keyStatus.claudeKeySet} />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Authentication methods</h2>
            <Badge tone="accent">Mobile config</Badge>
          </div>
          <div className="mt-4 grid gap-3">
            {Object.entries(data.authMethods).map(([method, enabled]) => (
              <div key={method} className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium capitalize">{method}</p>
                  <p className="text-xs text-muted-foreground">Controls visibility in auth config.</p>
                </div>
                <Switch checked={enabled} onCheckedChange={(checked) => updateMethod(method as keyof Settings['authMethods'], checked)} />
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Save className="size-4" />
          Changes are saved immediately and read by backend APIs from MongoDB.
        </div>
      </section>
    </div>
  )
}
