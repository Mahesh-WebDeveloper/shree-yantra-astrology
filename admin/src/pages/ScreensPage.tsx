import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  Image as ImageIcon,
  Layers,
  Pencil,
  Search,
  Smartphone,
} from 'lucide-react'

import { assetUrl } from '@/api/assets'
import type { ScreenContent } from '@/api/endpoints'
import { useAppConfig, useScreens } from '@/api/queries'
import { enrichScreenClient } from '@/data/screenDefaults'
import { EmptyState, ErrorState, LoadingPanel } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import {
  countCustomFields,
  customizationPercent,
  groupIcon,
  imageFieldCount,
  isImageKey,
  pageIcon,
  textPreview,
} from '@/lib/screensPage'
import { cn } from '@/lib/utils'

function PageCard({
  screen,
  index,
  onEdit,
}: {
  screen: ScreenContent
  index: number
  onEdit: () => void
}) {
  const Icon = pageIcon(screen.page)
  const custom = countCustomFields(screen)
  const pct = customizationPercent(screen)
  const effective = screen.effective || {}
  const bannerKey = Object.keys(effective).find(isImageKey)
  const bannerSrc = bannerKey ? (effective[bannerKey] as string) : ''
  const firstText = Object.entries(effective).find(([k]) => !isImageKey(k))
  const snippet = firstText ? textPreview(firstText[1], 'en') : ''

  return (
    <article
      className="activity-stagger group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative h-28 bg-gradient-to-br from-primary/15 via-muted/30 to-accent/10">
        {bannerSrc ? (
          <img src={assetUrl(bannerSrc)} alt="" className="size-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground/50">
            <ImageIcon className="size-10" />
          </div>
        )}
        <div className="absolute left-3 top-3 grid size-10 place-items-center rounded-xl bg-card/90 text-primary shadow-sm backdrop-blur-sm">
          <Icon className="size-5" />
        </div>
        {custom > 0 ? (
          <span className="absolute right-3 top-3 rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-semibold text-success-foreground backdrop-blur-sm">
            {custom} custom
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{screen.label}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{screen.page}</p>
          </div>
          <Badge tone={pct > 0 ? 'success' : 'neutral'}>{pct}%</Badge>
        </div>

        {snippet ? (
          <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">{snippet}</p>
        ) : (
          <p className="mt-3 flex-1 text-sm italic text-muted-foreground">App default content</p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">{Object.keys(effective).length} fields</span>
          <Button type="button" size="sm" onClick={onEdit}>
            <Pencil className="size-3.5" /> Edit
            <ChevronRight className="size-3.5 opacity-60" />
          </Button>
        </div>
      </div>
    </article>
  )
}

export default function ScreensPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const screensQuery = useScreens()
  const appConfigQuery = useAppConfig()

  const screens = useMemo(
    () => (screensQuery.data ?? []).map((s) => enrichScreenClient(s, appConfigQuery.data ?? null)),
    [screensQuery.data, appConfigQuery.data],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return screens
    return screens.filter((s) =>
      s.label.toLowerCase().includes(q) || s.page.toLowerCase().includes(q) || s.group.toLowerCase().includes(q),
    )
  }, [screens, search])

  const groups = useMemo(() => {
    const map: Record<string, typeof screens> = {}
    filtered.forEach((s) => {
      ;(map[s.group] ||= []).push(s)
    })
    return map
  }, [filtered])

  const totalCustom = screens.reduce((sum, s) => sum + countCustomFields(s), 0)
  const totalImages = screens.reduce((sum, s) => sum + imageFieldCount(s), 0)

  const openEdit = (page: string) => navigate(`/pages/edit/${page}`)

  if (screensQuery.isLoading) return <LoadingPanel label="Loading pages…" />
  if (screensQuery.isError) return <ErrorState message="Could not load pages." onRetry={() => void screensQuery.refetch()} />

  return (
    <div className="grid gap-6 pb-10">
      <PageHeader
        title="Pages — Content & Images"
        description="Tap a page card to open its full editor — customize English & Hindi text, banners and images for the mobile app."
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <Smartphone className="size-3.5" />
            {screens.length} screens
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'App screens', value: screens.length, icon: Layers, tone: 'text-primary' },
          { label: 'Custom fields', value: totalCustom, icon: Pencil, tone: 'text-accent' },
          { label: 'Image slots', value: totalImages, icon: ImageIcon, tone: 'text-warning' },
        ].map((stat, i) => (
          <div key={stat.label} className="activity-stagger rounded-xl border border-border bg-card p-4 shadow-sm" style={{ animationDelay: `${i * 55}ms` }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className={cn('size-5', stat.tone)} />
            </div>
            <p className="mt-2 text-2xl font-semibold">{stat.value.toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search pages…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No pages match your search." />
      ) : (
        Object.entries(groups).map(([group, list]) => {
          const GIcon = groupIcon(group)
          return (
            <section key={group} className="grid gap-4">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <GIcon className="size-4" />
                </span>
                <div>
                  <h2 className="text-base font-semibold">{group}</h2>
                  <p className="text-xs text-muted-foreground">{list.length} page{list.length === 1 ? '' : 's'}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((screen, i) => (
                  <PageCard key={screen.page} screen={screen} index={i} onEdit={() => openEdit(screen.page)} />
                ))}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
