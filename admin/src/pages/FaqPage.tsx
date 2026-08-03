import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  HelpCircle,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { queryKeys, useFaq } from '@/api/queries'
import type { FaqItem } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingPanel } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/form'
import { useToast } from '@/components/ui/toast'
import {
  FAQ_CATEGORY_PRESETS,
  PUBLISHED_FILTERS,
  categoryCounts,
  categoryMeta,
  faqStats,
  filterFaqItems,
  groupByCategory,
  type PublishedFilter,
} from '@/lib/faqPage'
import { cn } from '@/lib/utils'

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  delay,
}: {
  label: string
  value: number
  hint: string
  icon: typeof HelpCircle
  tone: string
  delay: number
}) {
  return (
    <article
      className="activity-stagger rounded-2xl border border-border bg-card p-4 shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className={cn('grid size-10 place-items-center rounded-xl', tone)}>
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  )
}

function FaqCard({
  item,
  index,
  onEdit,
  onDelete,
}: {
  item: FaqItem
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const meta = categoryMeta(item.category)
  const Icon = meta.icon

  return (
    <article
      className="activity-stagger activity-card-hover group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/35"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <button type="button" className="flex flex-1 flex-col p-4 text-left" onClick={onEdit}>
        <div className="flex items-start gap-3">
          <div className={cn('grid size-10 shrink-0 place-items-center rounded-xl', meta.tone)}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="line-clamp-2 font-semibold leading-snug">{item.question}</h3>
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.answer}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone={item.published ? 'success' : 'neutral'}>
            {item.published ? 'Published' : 'Hidden'}
          </Badge>
          <Badge>{meta.label}</Badge>
          <span className="text-xs text-muted-foreground">Order {item.order ?? 0}</span>
          {item.translations?.hi?.question ? (
            <Badge tone="accent">HI</Badge>
          ) : null}
        </div>
      </button>
      <div className="flex border-t border-border">
        <Button type="button" variant="ghost" className="flex-1 rounded-none" onClick={onEdit}>
          <Pencil className="size-4" /> Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="rounded-none text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </article>
  )
}

export default function FaqPage() {
  const navigate = useNavigate()
  const faq = useFaq()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [publishedFilter, setPublishedFilter] = useState<PublishedFilter>('')
  const [groupedView, setGroupedView] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null)

  const allItems = faq.data ?? []
  const stats = useMemo(() => faqStats(allItems), [allItems])
  const counts = useMemo(() => categoryCounts(allItems), [allItems])

  const filtered = useMemo(
    () => filterFaqItems(allItems, { search, category, published: publishedFilter }),
    [allItems, search, category, publishedFilter],
  )

  const grouped = useMemo(() => groupByCategory(filtered), [filtered])

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.faq })

  const deleteMutation = useMutation({
    mutationFn: endpoints.deleteFaq,
    onSuccess: () => {
      setDeleteTarget(null)
      invalidate()
      toast.success('FAQ deleted')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const openNew = (cat?: string) => {
    navigate(cat ? `/faq/new?category=${encodeURIComponent(cat)}` : '/faq/new')
  }

  return (
    <div className="grid gap-6 pb-8">
      <PageHeader
        title="FAQ"
        description="Help content shown in the mobile app — bilingual questions users can browse by category."
        action={
          <Button type="button" onClick={() => openNew(category || undefined)}>
            <Plus className="size-4" /> New FAQ
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total" value={stats.total} hint="All FAQ entries" icon={HelpCircle} tone="text-primary bg-primary/10" delay={0} />
        <KpiCard label="Published" value={stats.published} hint="Visible in app" icon={Eye} tone="text-success bg-success/10" delay={60} />
        <KpiCard label="Hidden" value={stats.hidden} hint="Admin only drafts" icon={EyeOff} tone="text-muted-foreground bg-muted" delay={120} />
        <KpiCard label="Categories" value={stats.categories} hint="Topic groups" icon={Layers} tone="text-accent bg-accent/10" delay={180} />
      </section>

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Categories</h2>
            <p className="mt-1 text-xs text-muted-foreground">Filter by topic · add FAQ pre-filled for that category</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={cn(
              'rounded-xl border p-4 text-left transition',
              !category ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted/50',
            )}
          >
            <p className="font-semibold">All topics</p>
            <p className="mt-1 text-xs text-muted-foreground">{stats.total} items</p>
          </button>
          {FAQ_CATEGORY_PRESETS.map((preset) => {
            const Icon = preset.icon
            const count = counts.get(preset.value) ?? 0
            return (
              <div
                key={preset.value}
                className={cn(
                  'rounded-xl border p-4 transition',
                  category === preset.value ? 'border-primary bg-primary/10' : 'border-border bg-background',
                )}
              >
                <button type="button" className="w-full text-left" onClick={() => setCategory(preset.value)}>
                  <div className="flex items-center gap-2 font-semibold">
                    <span className={cn('grid size-8 place-items-center rounded-lg', preset.tone)}>
                      <Icon className="size-4" />
                    </span>
                    {preset.label}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{count} · {preset.desc}</p>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-3 h-8 px-2 text-xs"
                  onClick={() => openNew(preset.value)}
                >
                  <Plus className="size-3.5" /> Add
                </Button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_160px_160px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search question, answer, category…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Category filter">
              <option value="">All categories</option>
              {[...new Set(allItems.map((item) => item.category))].sort().map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Select>
            <Select
              value={publishedFilter}
              onChange={(event) => setPublishedFilter(event.target.value as PublishedFilter)}
              aria-label="Published filter"
            >
              {PUBLISHED_FILTERS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </div>
          <Button
            type="button"
            variant={groupedView ? 'secondary' : 'ghost'}
            onClick={() => setGroupedView((value) => !value)}
          >
            <Filter className="size-4" />
            {groupedView ? 'Grouped' : 'Flat list'}
          </Button>
        </div>

        {faq.isLoading ? <LoadingPanel label="Loading FAQ…" /> : null}
        {faq.isError ? <ErrorState message="Could not load FAQ." onRetry={() => void faq.refetch()} /> : null}

        {faq.data && filtered.length === 0 ? (
          <EmptyState
            title={
              search || category || publishedFilter
                ? 'No FAQ matches your filters.'
                : 'No FAQ items yet — create help entries for the app support screen.'
            }
            action={
              !search && !publishedFilter ? (
                <Button type="button" onClick={() => openNew(category || 'General')}>
                  <Plus className="size-4" /> Add first FAQ
                </Button>
              ) : undefined
            }
          />
        ) : null}

        {filtered.length > 0 && groupedView ? (
          <div className="grid gap-8">
            {grouped.map(([cat, items]) => {
              const meta = categoryMeta(cat)
              const CatIcon = meta.icon
              return (
                <div key={cat}>
                  <div className="mb-4 flex items-center gap-2">
                    <span className={cn('grid size-9 place-items-center rounded-xl', meta.tone)}>
                      <CatIcon className="size-4" />
                    </span>
                    <div>
                      <h3 className="font-semibold">{meta.label}</h3>
                      <p className="text-xs text-muted-foreground">{items.length} question{items.length === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((item, index) => (
                      <FaqCard
                        key={item._id}
                        item={item}
                        index={index}
                        onEdit={() => navigate(`/faq/edit/${item._id}`)}
                        onDelete={() => setDeleteTarget(item)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {filtered.length > 0 && !groupedView ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item, index) => (
              <FaqCard
                key={item._id}
                item={item}
                index={index}
                onEdit={() => navigate(`/faq/edit/${item._id}`)}
                onDelete={() => setDeleteTarget(item)}
              />
            ))}
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <p className="mt-6 flex items-center gap-1 text-xs text-muted-foreground">
            <ChevronRight className="size-3.5" />
            Showing {filtered.length} of {allItems.length} FAQ items
          </p>
        ) : null}
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete FAQ"
        description={`Delete "${deleteTarget?.question || 'this FAQ'}"? This cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  )
}
