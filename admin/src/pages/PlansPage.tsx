import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Save, Trash2 } from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { queryKeys, usePlans } from '@/api/queries'
import type { SubscriptionPlan } from '@/api/types'
import { BilingualFields } from '@/components/BilingualFields'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingRows } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { inr } from '@/lib/utils'

type DraftPlan = Partial<SubscriptionPlan> & { featuresText?: string }

const emptyPlan: DraftPlan = {
  name: '',
  translations: { en: { name: '', badge: '', features: [] }, hi: { name: '', badge: '', features: [] } },
  priceINR: 0,
  durationDays: 30,
  badge: '',
  features: [],
  featuresText: '',
  isActive: true,
  order: 0,
}

function toDraft(plan?: SubscriptionPlan): DraftPlan {
  return plan ? {
    ...plan,
    translations: plan.translations || {
      en: { name: plan.name || '', badge: plan.badge || '', features: plan.features || [] },
      hi: { name: '', badge: '', features: [] },
    },
    featuresText: plan.features.join('\n'),
  } : { ...emptyPlan }
}

export default function PlansPage() {
  const plans = usePlans()
  const [draft, setDraft] = useState<DraftPlan>(() => toDraft())
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null)
  const queryClient = useQueryClient()
  const toast = useToast()

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.plans })

  const saveMutation = useMutation({
    mutationFn: (payload: DraftPlan) => {
      const features = (payload.featuresText || '').split('\n').map((item) => item.trim()).filter(Boolean)
      return endpoints.savePlan({
        ...payload,
        features,
        translations: {
          en: {
            name: payload.translations?.en.name || payload.name || '',
            badge: payload.translations?.en.badge || payload.badge || '',
            features,
          },
          hi: {
            name: payload.translations?.hi.name || '',
            badge: payload.translations?.hi.badge || '',
            features: payload.translations?.hi.features || [],
          },
        },
      })
    },
    onSuccess: (plan) => {
      setDraft(toDraft(plan))
      invalidate()
      toast.success('Plan saved')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: endpoints.deletePlan,
    onSuccess: () => {
      setDeleteTarget(null)
      setDraft(toDraft())
      invalidate()
      toast.success('Plan deleted')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Subscription Plans"
        description="Control plans shown to users in the mobile subscription screen."
        action={<Button type="button" variant="secondary" onClick={() => setDraft(toDraft())}><Plus className="size-4" />New plan</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
          {plans.isLoading ? <LoadingRows /> : null}
          {plans.isError ? <ErrorState message="Could not load plans." onRetry={() => void plans.refetch()} /> : null}
          {plans.data && plans.data.length === 0 ? <EmptyState title="No subscription plans yet." /> : null}
          <div className="grid gap-3 md:grid-cols-2">
            {plans.data?.map((plan) => (
              <button key={plan._id} type="button" onClick={() => setDraft(toDraft(plan))} className="rounded-lg border border-border bg-background p-3 text-left transition hover:bg-muted/60 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="mt-1 text-2xl font-semibold">{inr(plan.priceINR)}</p>
                  </div>
                  <Badge tone={plan.isActive ? 'success' : 'neutral'}>{plan.isActive ? 'active' : 'hidden'}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.durationDays} days {plan.badge ? `- ${plan.badge}` : ''}</p>
                <ul className="mt-3 grid gap-1 text-sm text-muted-foreground">
                  {plan.features.slice(0, 4).map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
              </button>
            ))}
          </div>
        </section>

        <form
          className="rounded-lg border border-border bg-card p-3 sm:p-4"
          onSubmit={(event) => {
            event.preventDefault()
            saveMutation.mutate(draft)
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{draft._id ? 'Edit plan' : 'Create plan'}</h2>
            <Button type="submit" disabled={saveMutation.isPending}><Save className="size-4" />Save</Button>
          </div>
          <div className="grid gap-4">
            <BilingualFields
              value={{
                en: {
                  name: draft.translations?.en.name || draft.name || '',
                  badge: draft.translations?.en.badge || draft.badge || '',
                },
                hi: {
                  name: draft.translations?.hi.name || '',
                  badge: draft.translations?.hi.badge || '',
                },
              }}
              fields={[
                { key: 'name', label: 'Plan name' },
                { key: 'badge', label: 'Badge' },
              ]}
              onChange={(translations) => setDraft({
                ...draft,
                translations: {
                  en: {
                    name: translations.en.name || '',
                    badge: translations.en.badge || '',
                    features: draft.translations?.en.features || [],
                  },
                  hi: {
                    name: translations.hi.name || '',
                    badge: translations.hi.badge || '',
                    features: draft.translations?.hi.features || [],
                  },
                },
                name: translations.en.name || draft.name,
                badge: translations.en.badge || draft.badge,
              })}
            />
            <Field label="Name">
              <Input value={draft.name || ''} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price INR">
                <Input type="number" min="0" value={draft.priceINR ?? 0} onChange={(event) => setDraft({ ...draft, priceINR: Number(event.target.value) })} />
              </Field>
              <Field label="Duration days">
                <Input type="number" min="1" value={draft.durationDays ?? 30} onChange={(event) => setDraft({ ...draft, durationDays: Number(event.target.value) })} />
              </Field>
            </div>
            <Field label="Badge">
              <Input value={draft.badge || ''} onChange={(event) => setDraft({ ...draft, badge: event.target.value })} />
            </Field>
            <Field label="Features">
              <Textarea value={draft.featuresText || ''} onChange={(event) => setDraft({ ...draft, featuresText: event.target.value })} placeholder="One feature per line" />
            </Field>
            <Field label="Features - Hindi">
              <Textarea
                value={(draft.translations?.hi.features || []).join('\n')}
                onChange={(event) => setDraft({
                  ...draft,
                  translations: {
                    en: {
                      name: draft.translations?.en.name || draft.name || '',
                      badge: draft.translations?.en.badge || draft.badge || '',
                      features: (draft.featuresText || '').split('\n').map((item) => item.trim()).filter(Boolean),
                    },
                    hi: {
                      name: draft.translations?.hi.name || '',
                      badge: draft.translations?.hi.badge || '',
                      features: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean),
                    },
                  },
                })}
                placeholder="Hindi features, one per line"
              />
            </Field>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <span className="text-sm font-medium">Active</span>
              <Switch checked={!!draft.isActive} onCheckedChange={(checked) => setDraft({ ...draft, isActive: checked })} />
            </div>
            {draft._id ? (
              <Button type="button" variant="destructive" onClick={() => setDeleteTarget(draft as SubscriptionPlan)}>
                <Trash2 className="size-4" />
                Delete plan
              </Button>
            ) : null}
          </div>
        </form>
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete plan"
        description={`Delete ${deleteTarget?.name || 'this plan'}?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  )
}
