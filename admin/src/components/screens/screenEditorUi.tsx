import { Link } from 'react-router-dom'
import {
  Check,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Loader2,
  Pencil,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react'

import type { ScreenContent } from '@/api/endpoints'
import { assetUrl } from '@/api/assets'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import { isImageKey, pageIcon, prettyKey, textPreview } from '@/lib/screensPage'
import { cn } from '@/lib/utils'

export function AppConfigPreviewPanel({ page, preview }: { page: string; preview: Record<string, unknown> | null | undefined }) {
  if (!preview) return null

  if (page === 'home') {
    const p = preview as {
      homeBanners?: number
      activeBannerTitle?: string | null
      showZodiacWheel?: boolean
    }
    return (
      <div className="activity-stagger rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm">
        <p className="font-semibold text-primary">Also in App Config (live now)</p>
        <ul className="mt-2 grid gap-1.5 text-muted-foreground">
          <li>Home banners: <span className="font-medium text-foreground">{p.homeBanners ?? 0}</span>{p.activeBannerTitle ? ` · "${p.activeBannerTitle}"` : ''}</li>
          <li>Zodiac wheel: <span className="font-medium text-foreground">{p.showZodiacWheel === false ? 'Hidden' : 'Visible'}</span></li>
        </ul>
        <Link to="/app-config" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Open App Config <ExternalLink className="size-3.5" />
        </Link>
      </div>
    )
  }

  if (page === 'branding') {
    const p = preview as { appName?: string; tagline?: string }
    return (
      <div className="activity-stagger rounded-xl border border-dashed border-accent/30 bg-accent/5 p-4 text-sm">
        <p className="font-semibold text-accent">App Config branding fallback</p>
        <ul className="mt-2 grid gap-1.5 text-muted-foreground">
          <li>Name: <span className="font-medium text-foreground">{p.appName || '—'}</span></li>
          <li>Tagline: <span className="font-medium text-foreground">{p.tagline || '—'}</span></li>
        </ul>
        <Link to="/app-config" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Open App Config <ExternalLink className="size-3.5" />
        </Link>
      </div>
    )
  }

  return null
}

export function PhoneMockup({ screen }: { screen: ScreenContent }) {
  const Icon = pageIcon(screen.page)
  const effective = screen.effective || {}
  const textEntries = Object.entries(effective).filter(([k]) => !isImageKey(k)).slice(0, 5)
  const bannerKey = Object.keys(effective).find(isImageKey)
  const bannerSrc = bannerKey ? (effective[bannerKey] as string) : ''

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <div className="overflow-hidden rounded-[2rem] border-4 border-foreground/10 bg-gradient-to-b from-primary/15 via-card to-card shadow-2xl">
        <div className="flex items-center justify-between bg-primary/90 px-4 py-2 text-[10px] font-medium text-primary-foreground">
          <span>Shree Yantra</span>
          <span>{screen.label}</span>
        </div>
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
              <Icon className="size-4" />
            </div>
            <div>
              <p className="text-xs font-semibold">{screen.label}</p>
              <p className="text-[10px] text-muted-foreground">{screen.page}</p>
            </div>
          </div>
          {bannerSrc ? (
            <div className="mb-3 overflow-hidden rounded-xl border border-border">
              <img src={assetUrl(bannerSrc)} alt="" className="h-20 w-full object-cover" />
            </div>
          ) : (
            <div className="mb-3 grid h-20 place-items-center rounded-xl border border-dashed border-border bg-muted/30 text-[10px] text-muted-foreground">
              Banner / image area
            </div>
          )}
          <div className="grid gap-2">
            {textEntries.map(([key, val]) => (
              <div key={key} className="rounded-lg border border-border bg-background/80 p-2">
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{prettyKey(key)}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] font-medium">{textPreview(val, 'en')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProgressRing({ percent }: { percent: number }) {
  const r = 18
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <svg className="size-11 shrink-0 -rotate-90" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
      <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      <text x="22" y="24" textAnchor="middle" className="rotate-90 fill-foreground text-[9px] font-bold" style={{ transformOrigin: '22px 22px' }}>{percent}%</text>
    </svg>
  )
}

export function ImageFieldEditor({
  fieldKey,
  value,
  hint,
  uploading,
  onUpload,
  onChange,
  onReset,
  onClear,
}: {
  fieldKey: string
  value: string
  hint?: string
  uploading: boolean
  onUpload: (file: File) => void
  onChange: (url: string) => void
  onReset: () => void
  onClear: () => void
}) {
  return (
    <div className="activity-stagger rounded-2xl border border-border bg-gradient-to-br from-muted/30 to-card p-4 transition-all hover:border-primary/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{prettyKey(fieldKey)}</p>
          {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <Badge tone="accent"><ImageIcon className="mr-1 inline size-3" />Image</Badge>
      </div>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="group relative size-28 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/40">
          {value ? (
            <img src={assetUrl(value)} alt={fieldKey} className="size-full object-cover transition-transform group-hover:scale-105" />
          ) : (
            <div className="grid size-full place-items-center text-muted-foreground"><ImageIcon className="size-8 opacity-40" /></div>
          )}
        </div>
        <div className="grid flex-1 gap-2">
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-medium text-primary hover:bg-primary/15">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? 'Uploading…' : 'Upload image'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f) }} />
          </label>
          <Input placeholder="Or paste image URL…" value={value} onChange={(e) => onChange(e.target.value)} />
          <div className="flex gap-2">
            {value ? <Button type="button" variant="ghost" size="sm" onClick={onClear}><X className="size-4" /> Clear</Button> : null}
            <Button type="button" variant="ghost" size="sm" onClick={onReset}><RotateCcw className="size-4" /> Default</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PreviewFieldList({ screen }: { screen: ScreenContent }) {
  return (
    <div className="grid gap-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold"><Eye className="size-4 text-primary" /> Live content in app</h3>
      {Object.entries(screen.effective || {}).map(([key, val], i) => (
        <div key={key} className="activity-stagger rounded-xl border border-border bg-background p-4" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">{prettyKey(key)}</span>
            <Badge tone={screen.sources?.[key] === 'custom' ? 'success' : 'neutral'}>
              {screen.sources?.[key] === 'custom' ? 'Custom' : 'App default'}
            </Badge>
          </div>
          {isImageKey(key) ? (
            <div className="mt-3">
              {typeof val === 'string' && val ? (
                <img src={assetUrl(val)} alt={key} className="max-h-32 rounded-lg border border-border object-cover" />
              ) : (
                <p className="text-sm text-muted-foreground">No image — uses App Config fallback if set</p>
              )}
            </div>
          ) : (
            <div className="mt-3 grid gap-2 text-sm">
              <p><span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase">EN</span>{textPreview(val, 'en')}</p>
              <p><span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase">HI</span>{textPreview(val, 'hi')}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function EditorTabBar({ tab, onChange }: { tab: 'preview' | 'edit'; onChange: (t: 'preview' | 'edit') => void }) {
  return (
    <div className="flex rounded-xl border border-border bg-muted/20 p-1">
      {([
        { id: 'preview' as const, label: 'Preview', icon: Eye },
        { id: 'edit' as const, label: 'Edit', icon: Pencil },
      ]).map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
            tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <t.icon className="size-3.5" /> {t.label}
        </button>
      ))}
    </div>
  )
}

export function CustomFieldBadge({ saved }: { saved: boolean }) {
  return saved ? (
    <p className="mt-1 inline-flex items-center gap-1 text-xs text-success"><Check className="size-3" /> Custom saved</p>
  ) : (
    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Using app default until you save</p>
  )
}
