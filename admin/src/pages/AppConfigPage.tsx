/* App Config — admin-only settings NOT duplicated on Pages (Content) screen.
   Page text/images → /pages/edit/:page. This screen: support, theme colors, logo URL,
   onboarding, home banner carousel, featured items, feature flags. */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { assetUrl } from '@/api/assets'
import { queryKeys, useAppConfig } from '@/api/queries'
import type { AppConfig, FeaturedContent, ImageItem } from '@/api/types'
import { BilingualFields } from '@/components/BilingualFields'
import { ErrorState, LoadingPanel } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import {
  CONFIG_TABS,
  FEATURED_TYPES,
  HOME_UI_FLAGS,
  MODULE_FLAGS,
  PROFILE_FLAGS,
  flagBool,
  flagNumber,
  type ConfigTab,
} from '@/lib/appConfigPage'
import { cn } from '@/lib/utils'

type DraftConfig = Omit<AppConfig, '_id'> & { flagsText: string }

const emptyImageItem: ImageItem = {
  title: '',
  subtitle: '',
  translations: { en: { title: '', subtitle: '' }, hi: { title: '', subtitle: '' } },
  imageUrl: '',
  link: '',
  order: 0,
  isActive: true,
}

const emptyFeatured: FeaturedContent = {
  type: 'library',
  title: '',
  translations: { en: { title: '' }, hi: { title: '' } },
  refId: '',
  order: 0,
}

function toDraft(config: AppConfig): DraftConfig {
  return {
    onboardingSlides: config.onboardingSlides || [],
    homeBanners: config.homeBanners || [],
    featuredContent: config.featuredContent || [],
    support: config.support || { email: '', phone: '' },
    branding: config.branding || {
      appName: 'Shree Yantra',
      tagline: 'Astrology',
      logoUrl: '',
      primaryColor: '',
      accentColor: '',
      translations: { en: { appName: 'Shree Yantra', tagline: 'Astrology' }, hi: { appName: '', tagline: '' } },
    },
    appVersion: config.appVersion || '1.0.0',
    featureFlags: config.featureFlags || {},
    flagsText: JSON.stringify(config.featureFlags || {}, null, 2),
  }
}

function PagesLinkCard({ title, desc, to }: { title: string; desc: string; to: string }) {
  return (
    <Link
      to={to}
      className="activity-stagger flex items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 transition-all hover:border-primary/40 hover:bg-primary/10"
    >
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="font-semibold text-primary">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-primary" />
    </Link>
  )
}

function CarouselEditor({
  title,
  subtitle,
  items,
  onChange,
  onUpload,
  pagesNote,
}: {
  title: string
  subtitle: string
  items: ImageItem[]
  onChange: (items: ImageItem[]) => void
  onUpload: (file: File) => Promise<string>
  pagesNote?: { label: string; to: string }
}) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  const update = (index: number, patch: Partial<ImageItem>) => {
    const next = [...items]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next.map((item, i) => ({ ...item, order: i })))
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...items, { ...emptyImageItem, order: items.length }])}>
          <Plus className="size-4" /> Add slide
        </Button>
      </div>

      {pagesNote ? <PagesLinkCard title={pagesNote.label} desc="Page-level text & single banner override — not duplicated here." to={pagesNote.to} /> : null}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No slides yet — tap Add slide to create the carousel.
        </div>
      ) : null}

      <div className="grid gap-4">
        {items.map((item, index) => (
          <article
            key={item._id || `slide-${index}`}
            className="activity-stagger overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/30"
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <div className="flex flex-col gap-4 p-4 sm:flex-row">
              <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:w-44">
                {item.imageUrl ? (
                  <img src={assetUrl(item.imageUrl)} alt="" className="size-full object-cover" />
                ) : (
                  <div className="grid size-full place-items-center text-xs text-muted-foreground">No image</div>
                )}
                <span className="absolute left-2 top-2 rounded-md bg-card/90 px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm">#{index + 1}</span>
              </div>
              <div className="min-w-0 flex-1 grid gap-3">
                <BilingualFields
                  value={item.translations}
                  fields={[
                    { key: 'title', label: 'Title' },
                    { key: 'subtitle', label: 'Subtitle', multiline: true },
                  ]}
                  onChange={(translations) => update(index, {
                    translations,
                    title: translations.en.title || '',
                    subtitle: translations.en.subtitle || '',
                  })}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input placeholder="Deep link (optional)" value={item.link} onChange={(e) => update(index, { link: e.target.value })} />
                  <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 text-sm font-medium text-primary hover:bg-primary/15">
                    {uploadingIdx === index ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setUploadingIdx(index)
                        try {
                          const url = await onUpload(file)
                          update(index, { imageUrl: url })
                        } finally {
                          setUploadingIdx(null)
                        }
                      }}
                    />
                  </label>
                </div>
                <Input placeholder="Image URL" value={item.imageUrl} onChange={(e) => update(index, { imageUrl: e.target.value })} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active</span>
                    <Switch checked={item.isActive} onCheckedChange={(checked) => update(index, { isActive: checked })} />
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move up"><ArrowUp className="size-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" disabled={index === items.length - 1} onClick={() => move(index, 1)} aria-label="Move down"><ArrowDown className="size-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label="Remove"><Trash2 className="size-4 text-destructive" /></Button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function AppConfigPage() {
  const configQuery = useAppConfig()
  const [draft, setDraft] = useState<DraftConfig | null>(null)
  const [tab, setTab] = useState<ConfigTab>('support')
  const [logoUploading, setLogoUploading] = useState(false)
  const queryClient = useQueryClient()
  const toast = useToast()

  useEffect(() => {
    if (configQuery.data) setDraft(toDraft(configQuery.data))
  }, [configQuery.data])

  const saveMutation = useMutation({
    mutationFn: (payload: DraftConfig) => {
      let flags: Record<string, unknown>
      try {
        flags = JSON.parse(payload.flagsText) as Record<string, unknown>
      } catch {
        throw new Error('Feature flags must be valid JSON')
      }
      return endpoints.updateAppConfig({ ...payload, featureFlags: flags })
    },
    onSuccess: (config) => {
      setDraft(toDraft(config))
      void queryClient.invalidateQueries({ queryKey: queryKeys.appConfig })
      void queryClient.invalidateQueries({ queryKey: queryKeys.screens })
      toast.success('App config saved — changes apply on next app open')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const uploadImage = async (file: File) => {
    const url = await endpoints.uploadImage(file)
    toast.success('Image uploaded')
    return url
  }

  const parsedFlags = useMemo(() => {
    if (!draft) return {}
    try {
      return JSON.parse(draft.flagsText || '{}') as Record<string, unknown>
    } catch {
      return {}
    }
  }, [draft?.flagsText])

  const setFlag = (key: string, value: boolean | number) => {
    if (!draft) return
    const next = { ...parsedFlags, [key]: value }
    setDraft({ ...draft, flagsText: JSON.stringify(next, null, 2) })
  }

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault()
    if (draft) saveMutation.mutate(draft)
  }

  if (configQuery.isError) return <ErrorState message="Could not load app config." onRetry={() => void configQuery.refetch()} />
  if (configQuery.isLoading || !draft) return <LoadingPanel label="Loading app config…" />

  const activeSlides = draft.onboardingSlides.filter((s) => s.isActive).length
  const activeBanners = draft.homeBanners.filter((b) => b.isActive).length

  return (
    <form className="grid gap-6 pb-12" onSubmit={handleSubmit}>
      <PageHeader
        title="App Config"
        description="Global app settings — support, carousels, modules & behavior. Page text & labels are edited under Pages (Content), not here."
        action={
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save config
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Onboarding slides', value: `${activeSlides}/${draft.onboardingSlides.length}` },
          { label: 'Home banners', value: `${activeBanners}/${draft.homeBanners.length}` },
          { label: 'Featured items', value: draft.featuredContent.length },
          { label: 'App version', value: draft.appVersion },
        ].map((stat, i) => (
          <div key={stat.label} className="activity-stagger rounded-xl border border-border bg-card p-4 shadow-sm" style={{ animationDelay: `${i * 40}ms` }}>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <PagesLinkCard
        title="Page text & screen labels"
        desc="App name, tagline, home greetings, feature descriptions — edit on Pages screen."
        to="/pages"
      />

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-muted/20 p-2">
        {CONFIG_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
              tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-card/70',
            )}
          >
            <t.icon className="size-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        {tab === 'support' ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Support email">
              <Input type="email" value={draft.support.email} onChange={(e) => setDraft({ ...draft, support: { ...draft.support, email: e.target.value } })} placeholder="support@example.com" />
            </Field>
            <Field label="Support phone">
              <Input value={draft.support.phone} onChange={(e) => setDraft({ ...draft, support: { ...draft.support, phone: e.target.value } })} placeholder="+91 …" />
            </Field>
            <Field label="App version (shown in app)">
              <Input value={draft.appVersion} onChange={(e) => setDraft({ ...draft, appVersion: e.target.value })} placeholder="1.0.0" />
            </Field>
            <p className="text-xs text-muted-foreground md:col-span-2">
              Users see these on Help & Settings. Version is informational — store builds use Expo/app.json separately.
            </p>
          </div>
        ) : null}

        {tab === 'theme' ? (
          <div className="grid gap-6">
            <PagesLinkCard title="App name, tagline & splash text" desc="Edit on Pages → Branding (Content screen)." to="/pages/edit/branding" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm font-semibold">Logo URL (global fallback)</p>
                <p className="mt-1 text-xs text-muted-foreground">Pages → Branding logo image overrides this when set.</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-background">
                    {draft.branding?.logoUrl ? (
                      <img src={assetUrl(draft.branding.logoUrl)} alt="" className="size-full object-contain p-1" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">No logo</span>
                    )}
                  </div>
                  <div className="grid flex-1 gap-2">
                    <Input value={draft.branding?.logoUrl || ''} onChange={(e) => setDraft({ ...draft, branding: { ...draft.branding!, logoUrl: e.target.value } })} placeholder="Logo image URL" />
                    <label className="inline-flex h-10 w-fit cursor-pointer items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-medium text-primary">
                      {logoUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                      Upload logo
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        setLogoUploading(true)
                        try {
                          const url = await uploadImage(f)
                          setDraft({ ...draft, branding: { ...draft.branding!, logoUrl: url } })
                        } finally {
                          setLogoUploading(false)
                        }
                      }} />
                    </label>
                  </div>
                </div>
              </div>
              <Field label="Primary color (hex, optional)">
                <div className="flex gap-2">
                  <Input value={draft.branding?.primaryColor || ''} onChange={(e) => setDraft({ ...draft, branding: { ...draft.branding!, primaryColor: e.target.value } })} placeholder="#1a7a6e" />
                  {draft.branding?.primaryColor ? <span className="size-10 shrink-0 rounded-lg border border-border" style={{ background: draft.branding.primaryColor }} /> : null}
                </div>
              </Field>
              <Field label="Accent color (hex, optional)">
                <div className="flex gap-2">
                  <Input value={draft.branding?.accentColor || ''} onChange={(e) => setDraft({ ...draft, branding: { ...draft.branding!, accentColor: e.target.value } })} placeholder="#e9b850" />
                  {draft.branding?.accentColor ? <span className="size-10 shrink-0 rounded-lg border border-border" style={{ background: draft.branding.accentColor }} /> : null}
                </div>
              </Field>
            </div>
          </div>
        ) : null}

        {tab === 'onboarding' ? (
          <CarouselEditor
            title="Onboarding slides"
            subtitle="First-time users see these full-screen slides before sign-in."
            items={draft.onboardingSlides}
            onChange={(items) => setDraft({ ...draft, onboardingSlides: items })}
            onUpload={uploadImage}
          />
        ) : null}

        {tab === 'banners' ? (
          <CarouselEditor
            title="Home banner carousel"
            subtitle="Rotating banners on the welcome / home screen (from App Config API)."
            items={draft.homeBanners}
            onChange={(items) => setDraft({ ...draft, homeBanners: items })}
            onUpload={uploadImage}
            pagesNote={{ label: 'Single home banner override', to: '/pages/edit/home' }}
          />
        ) : null}

        {tab === 'featured' ? (
          <section className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Featured content</h2>
                <p className="text-sm text-muted-foreground">Highlight library books or media on home.</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => setDraft({ ...draft, featuredContent: [...draft.featuredContent, { ...emptyFeatured, order: draft.featuredContent.length }] })}>
                <Plus className="size-4" /> Add
              </Button>
            </div>
            {draft.featuredContent.map((item, index) => (
              <div key={item._id || index} className="activity-stagger rounded-xl border border-border bg-background p-4" style={{ animationDelay: `${index * 40}ms` }}>
                <div className="grid gap-3 md:grid-cols-4">
                  <Field label="Type">
                    <Select value={item.type} onChange={(e) => {
                      const next = [...draft.featuredContent]
                      next[index] = { ...next[index], type: e.target.value }
                      setDraft({ ...draft, featuredContent: next })
                    }}>
                      {FEATURED_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </Select>
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Reference ID">
                      <Input placeholder="MongoDB book or media _id" value={item.refId || ''} onChange={(e) => {
                        const next = [...draft.featuredContent]
                        next[index] = { ...next[index], refId: e.target.value }
                        setDraft({ ...draft, featuredContent: next })
                      }} />
                    </Field>
                  </div>
                  <div className="flex items-end">
                    <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, featuredContent: draft.featuredContent.filter((_, i) => i !== index) })}>
                      <Trash2 className="size-4 text-destructive" /> Remove
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <BilingualFields
                    value={item.translations}
                    fields={[{ key: 'title', label: 'Display title' }]}
                    onChange={(translations) => {
                      const next = [...draft.featuredContent]
                      next[index] = { ...next[index], translations, title: translations.en.title || '' }
                      setDraft({ ...draft, featuredContent: next })
                    }}
                  />
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {tab === 'behavior' ? (
          <div className="grid gap-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">App modules</h3>
              <p className="mt-1 text-xs text-muted-foreground">Turn entire sections on or off without redeploying the app.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {MODULE_FLAGS.map((mod, i) => (
                  <div key={mod.key} className="activity-stagger flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-4" style={{ animationDelay: `${i * 35}ms` }}>
                    <div className="flex gap-3">
                      <mod.icon className="mt-0.5 size-5 shrink-0 text-primary" />
                      <div>
                        <p className="font-medium">{mod.label}</p>
                        <p className="text-xs text-muted-foreground">{mod.desc}</p>
                      </div>
                    </div>
                    <Switch checked={flagBool(parsedFlags, mod.key, mod.defaultOn)} onCheckedChange={(v) => setFlag(mod.key, v)} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Profile editing</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {PROFILE_FLAGS.map((f, i) => (
                  <div key={f.key} className="activity-stagger flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-4" style={{ animationDelay: `${i * 35}ms` }}>
                    <div className="flex gap-3">
                      <f.icon className="mt-0.5 size-5 shrink-0 text-accent" />
                      <div>
                        <p className="font-medium">{f.label}</p>
                        <p className="text-xs text-muted-foreground">{f.desc}</p>
                      </div>
                    </div>
                    <Switch checked={flagBool(parsedFlags, f.key, false)} onCheckedChange={(v) => setFlag(f.key, v)} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Welcome screen UI</h3>
              <div className="mt-4 grid gap-4">
                {HOME_UI_FLAGS.map((f) =>
                  f.type === 'boolean' ? (
                    <div key={f.key} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
                      <div>
                        <p className="font-medium">{f.label}</p>
                        <p className="text-xs text-muted-foreground">{f.desc}</p>
                      </div>
                      <Switch
                        checked={f.key === 'showZodiacWheel' ? parsedFlags.showZodiacWheel !== false : flagBool(parsedFlags, f.key)}
                        onCheckedChange={(v) => setFlag(f.key, v)}
                      />
                    </div>
                  ) : (
                    <Field key={f.key} label={f.label}>
                      <Input
                        type="number"
                        min={f.min}
                        max={f.max}
                        value={String(flagNumber(parsedFlags, f.key, 0))}
                        onChange={(e) => setFlag(f.key, Math.max(f.min ?? -999, Math.min(f.max ?? 999, Number(e.target.value) || 0)))}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
                    </Field>
                  ),
                )}
              </div>
              <Link to="/pages/edit/home" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Home screen text labels <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>
        ) : null}

        {tab === 'advanced' ? (
          <div className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              Raw feature flags JSON. Prefer toggles in App behavior — edit here only for keys not yet in the admin UI.
            </p>
            <Textarea className="min-h-64 font-mono text-xs" value={draft.flagsText} onChange={(e) => setDraft({ ...draft, flagsText: e.target.value })} />
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex justify-end border-t border-border pt-5">
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save changes
        </Button>
      </div>
    </form>
  )
}
