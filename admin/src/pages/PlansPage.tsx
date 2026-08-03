import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Crown,
  IndianRupee,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { queryKeys, usePlans } from '@/api/queries'
import type { SubscriptionPlan } from '@/api/types'
import { BilingualFields } from '@/components/BilingualFields'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingPanel } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import {
  DEFAULT_MONTHLY_PLAN,
  blankDraft,
  durationLabel,
  isPrimaryMonthly,
  toDraft,
  type DraftPlan,
} from '@/lib/plansPage'
import { cn, inr } from '@/lib/utils'

function PlanPreviewCard({
  plan,
  selected,
  onSelect,
  index,
}: {
  plan: SubscriptionPlan
  selected: boolean
  onSelect: () => void
  index: number
}) {
  const primary = isPrimaryMonthly(plan)
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'activity-stagger group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300',
        selected
          ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/30'
          : 'border-border bg-card hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg',
        primary && !selected && 'border-accent/40 bg-gradient-to-br from-accent/5 to-primary/5',
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {primary ? (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
          <Crown className="size-3" /> Primary
        </span>
      ) : null}
      <div className="flex items-start gap-3">
        <div className={cn(
          'grid size-11 shrink-0 place-items-center rounded-xl',
          plan.isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
        )}
        >
          {primary ? <Crown className="size-5" /> : <Sparkles className="size-5" />}
        </div>
        <div className="min-w-0 flex-1 pr-16">
          <p className="font-semibold leading-tight">{plan.name}</p>
          <p className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">{inr(plan.priceINR)}</span>
            <span className="text-sm text-muted-foreground">/ {plan.durationDays === 30 ? 'month' : `${plan.durationDays}d`}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{durationLabel(plan.durationDays)}{plan.badge ? ` · ${plan.badge}` : ''}</p>
        </div>
      </div>
      <ul className="mt-4 grid gap-1.5">
        {plan.features.slice(0, 4).map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
            <span className="line-clamp-1">{feature}</span>
          </li>
        ))}
        {plan.features.length > 4 ? (
          <li className="text-xs text-muted-foreground">+{plan.features.length - 4} more features</li>
        ) : null}
      </ul>
      <div className="mt-4 flex items-center justify-between">
        <Badge tone={plan.isActive ? 'success' : 'neutral'}>{plan.isActive ? 'Live in app' : 'Hidden'}</Badge>
        <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">Edit →</span>
      </div>
    </button>
  )
}

function PhonePreview({ draft }: { draft: DraftPlan }) {
  const features = (draft.featuresText || '').split('\n').map((f) => f.trim()).filter(Boolean).slice(0, 5)
  const name = draft.translations?.en.name || draft.name || 'Premium Monthly'
  const price = draft.priceINR ?? 499

  return (
    <div className="mx-auto w-full max-w-[240px] rounded-[2rem] border-4 border-foreground/10 bg-gradient-to-b from-primary/20 via-card to-card p-4 shadow-xl">
      <div className="mb-3 flex justify-center">
        <div className="h-1 w-12 rounded-full bg-foreground/20" />
      </div>
      <div className="rounded-2xl border border-primary/25 bg-card/90 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Crown className="size-4 text-accent" />
          <span className="text-xs font-semibold text-accent">{draft.badge || draft.translations?.en.badge || 'Monthly'}</span>
        </div>
        <p className="mt-2 text-lg font-bold">{name}</p>
        <p className="mt-1 text-2xl font-bold text-primary">{inr(price)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
        <ul className="mt-3 grid gap-1.5">
          {features.map((f) => (
            <li key={f} className="flex gap-1.5 text-[11px] text-muted-foreground">
              <Check className="size-3 shrink-0 text-success" />
              <span className="line-clamp-2">{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-lg bg-primary py-2 text-center text-xs font-semibold text-primary-foreground">
          Subscribe
        </div>
      </div>
      <p className="mt-3 text-center text-[10px] text-muted-foreground">App preview</p>
    </div>
  )
}

export default function PlansPage() {
  const plans = usePlans()
  const [draft, setDraft] = useState<DraftPlan | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null)
  const queryClient = useQueryClient()
  const toast = useToast()

  const list = plans.data ?? []
  const activeCount = list.filter((p) => p.isActive).length
  const primaryPlan = list.find(isPrimaryMonthly) ?? list.find((p) => p.isActive)

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
      setDraft(null)
      invalidate()
      toast.success('Plan deleted')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const editing = draft !== null
  const stats = useMemo(() => [
    { label: 'Active plans', value: activeCount, icon: Zap, tone: 'text-success' },
    { label: 'Total plans', value: list.length, icon: Sparkles, tone: 'text-primary' },
    { label: 'Primary price', value: primaryPlan ? inr(primaryPlan.priceINR) : '₹499', icon: IndianRupee, tone: 'text-accent', isText: true },
  ], [activeCount, list.length, primaryPlan])

  const startDefaultPlan = () => setDraft(toDraft())
  const startNewPlan = () => setDraft(blankDraft())
  const startEdit = (plan: SubscriptionPlan) => setDraft(toDraft(plan))

  return (
    <div className="grid gap-6 pb-10">
      <PageHeader
        title="Subscription Plans"
        description="Manage what users see on the subscription screen. One ₹499/month plan is included — add more plans anytime."
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={startNewPlan}>
              <Plus className="size-4" /> Add plan
            </Button>
            {list.length === 0 ? (
              <Button type="button" onClick={startDefaultPlan}>
                <Crown className="size-4" /> Create ₹499 monthly
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="activity-stagger rounded-xl border border-border bg-card p-4 shadow-sm"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className={cn('size-5', stat.tone)} />
            </div>
            <p className="mt-2 text-2xl font-semibold">{stat.isText ? stat.value : Number(stat.value).toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      {primaryPlan ? (
        <div className="activity-stagger overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 via-primary/5 to-transparent p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2"><Badge tone="warning">Primary plan · shown to users</Badge></div>
              <h2 className="text-xl font-semibold">{primaryPlan.name}</h2>
              <p className="mt-1 text-3xl font-bold text-primary">{inr(primaryPlan.priceINR)}<span className="text-base font-normal text-muted-foreground"> / month</span></p>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                This is your main Premium subscription — ₹499 per month, auto-renewing via Razorpay. Edit features, badge and Hindi copy below.
              </p>
            </div>
            <Button type="button" onClick={() => startEdit(primaryPlan)}>Edit primary plan</Button>
          </div>
        </div>
      ) : null}

      <div className={cn('grid gap-6', editing ? 'xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]' : '')}>
        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">All plans</h2>
            {list.length > 0 ? <Badge tone="neutral">{list.length} total</Badge> : null}
          </div>

          {plans.isLoading ? <LoadingPanel label="Loading plans…" /> : null}
          {plans.isError ? <ErrorState message="Could not load plans." onRetry={() => void plans.refetch()} /> : null}

          {plans.data && list.length === 0 ? (
            <div className="grid gap-4 py-6">
              <EmptyState title="No subscription plan yet." />
              <div className="mx-auto grid max-w-md gap-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Start with the default <strong>₹499/month Premium</strong> plan — fully bilingual, ready for the app.
                </p>
                <Button type="button" className="mx-auto w-fit" onClick={startDefaultPlan}>
                  <Crown className="size-4" /> Create default ₹499 monthly plan
                </Button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {list.map((plan, i) => (
              <PlanPreviewCard
                key={plan._id}
                plan={plan}
                selected={draft?._id === plan._id}
                onSelect={() => startEdit(plan)}
                index={i}
              />
            ))}
          </div>

          {!editing && list.length > 0 ? (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Tap a plan to edit · Use <strong>Add plan</strong> for yearly, trial or custom offerings
            </p>
          ) : null}
        </section>

        {editing && draft ? (
          <div className="grid gap-4 xl:sticky xl:top-4 xl:self-start">
            <form
              className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
              onSubmit={(event) => {
                event.preventDefault()
                saveMutation.mutate(draft)
              }}
            >
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h2 className="text-base font-semibold">{draft._id ? 'Edit plan' : 'New plan'}</h2>
                  <p className="text-xs text-muted-foreground">{draft._id ? 'Changes sync to the mobile app' : 'Fill details and save'}</p>
                </div>
                <Button type="submit" disabled={saveMutation.isPending}>
                  <Save className="size-4" /> Save
                </Button>
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
                    { key: 'badge', label: 'Badge (e.g. Monthly)' },
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Price (₹ INR)">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={draft.priceINR ?? 499}
                      onChange={(event) => setDraft({ ...draft, priceINR: Number(event.target.value) })}
                    />
                  </Field>
                  <Field label="Duration (days)">
                    <Input
                      type="number"
                      min="1"
                      value={draft.durationDays ?? 30}
                      onChange={(event) => setDraft({ ...draft, durationDays: Number(event.target.value) })}
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">30 = monthly · 365 = yearly</p>
                  </Field>
                </div>

                <Field label="Features (English) — one per line">
                  <Textarea
                    rows={5}
                    value={draft.featuresText || ''}
                    onChange={(event) => setDraft({ ...draft, featuresText: event.target.value })}
                    placeholder={DEFAULT_MONTHLY_PLAN.features.join('\n')}
                  />
                </Field>

                <Field label="Features (Hindi) — one per line">
                  <Textarea
                    rows={5}
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
                    placeholder={DEFAULT_MONTHLY_PLAN.translations.hi.features.join('\n')}
                  />
                </Field>

                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4">
                  <div>
                    <p className="text-sm font-medium">Show in app</p>
                    <p className="text-xs text-muted-foreground">Inactive plans are hidden from users</p>
                  </div>
                  <Switch checked={!!draft.isActive} onCheckedChange={(checked) => setDraft({ ...draft, isActive: checked })} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" onClick={() => setDraft(null)}>Close</Button>
                  {draft._id ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setDeleteTarget(draft as SubscriptionPlan)}
                    >
                      <Trash2 className="size-4" /> Delete
                    </Button>
                  ) : null}
                </div>
              </div>
            </form>

            <div className="hidden rounded-xl border border-border bg-card p-4 lg:block">
              <p className="mb-3 text-center text-xs font-medium text-muted-foreground">Live preview</p>
              <PhonePreview draft={draft} />
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete plan"
        description={`Delete "${deleteTarget?.name || 'this plan'}"? Users will no longer see it.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  )
}
