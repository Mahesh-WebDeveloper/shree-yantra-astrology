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
              <KeyStatus label="Groq fallback key" set={!!data.keyStatus.groqKeySet} />
              <KeyStatus label="OpenRouter fallback keys" set={!!data.keyStatus.openrouterKeySet} />
            </div>
            {data.aiOps ? (
              <div className="rounded-md border border-border bg-muted/20 p-3 text-sm">
                <p className="font-medium">AI fallback status</p>
                <p className="mt-1 text-xs text-muted-foreground">Prompt version <span className="font-mono">{data.aiOps.promptVersion}</span> · {data.aiOps.cooldowns.length} model(s) in cooldown</p>
                {data.aiOps.cooldowns.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {data.aiOps.cooldowns.slice(0, 5).map((c) => (
                      <li key={c.id}>{c.id} — retry in {c.cooldownSec}s</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-success">All fallback models available</p>
                )}
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-base font-semibold">Payments & SMS</h2>
          <div className="mt-4 grid gap-3">
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium">Payments gate</p>
                <p className="text-xs text-muted-foreground">Env: PAYMENTS_ENABLED=true on server</p>
              </div>
              <Badge tone={data.paymentsEnabled ? 'success' : 'neutral'}>{data.paymentsEnabled ? 'enabled' : 'disabled'}</Badge>
            </div>
            <KeyStatus label="Razorpay configured" set={!!data.paymentsConfigured} />
            <KeyStatus label="MSG91 OTP configured" set={!!data.msg91Configured} />
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 xl:col-span-2">
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
