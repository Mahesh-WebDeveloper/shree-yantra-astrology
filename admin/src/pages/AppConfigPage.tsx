/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Save, Upload, X } from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { queryKeys, useAppConfig } from '@/api/queries'
import type { AppConfig, FeaturedContent, ImageItem } from '@/api/types'
import { BilingualFields } from '@/components/BilingualFields'
import { ErrorState, LoadingPanel } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { assetUrl } from '@/api/assets'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'

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
const emptyFeatured: FeaturedContent = { type: 'library', title: '', translations: { en: { title: '' }, hi: { title: '' } }, refId: '', order: 0 }

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

function ImageListEditor({
  title,
  items,
  onChange,
  onUpload,
}: {
  title: string
  items: ImageItem[]
  onChange: (items: ImageItem[]) => void
  onUpload: (file: File) => Promise<string>
}) {
  const update = (index: number, patch: Partial<ImageItem>) => {
    const next = [...items]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  return (
    <section className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...items, { ...emptyImageItem, order: items.length }])}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      {items.length === 0 && (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No items yet — use "Add" to create a new slide/banner.
        </p>
      )}
      {items.map((item, index) => (
        <div key={item._id || index} className="grid gap-3 rounded-md border border-border bg-background p-3">
          {/* live preview */}
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-28 place-items-center overflow-hidden rounded-md border border-border bg-muted">
              {item.imageUrl ? (
                <img src={assetUrl(item.imageUrl)} alt={item.title || 'preview'} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">No image</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">#{index + 1}{item.title ? ` · ${item.title}` : ''}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <BilingualFields
                value={item.translations}
                fields={[
                  { key: 'title', label: 'Title' },
                  { key: 'subtitle', label: 'Subtitle' },
                ]}
                onChange={(translations) => update(index, {
                  translations,
                  title: translations.en.title || item.title,
                  subtitle: translations.en.subtitle || item.subtitle,
                })}
              />
            </div>
            <Input placeholder="Title" value={item.title} onChange={(event) => update(index, { title: event.target.value })} />
            <Input placeholder="Subtitle" value={item.subtitle} onChange={(event) => update(index, { subtitle: event.target.value })} />
          </div>
          <Input placeholder="Image URL" value={item.imageUrl} onChange={(event) => update(index, { imageUrl: event.target.value })} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input placeholder="Link" value={item.link} onChange={(event) => update(index, { link: event.target.value })} />
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted">
              <Upload className="size-4" />
              Upload
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  const url = await onUpload(file)
                  update(index, { imageUrl: url })
                }}
              />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Active</span>
            <Switch checked={item.isActive} onCheckedChange={(checked) => update(index, { isActive: checked })} />
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
            <X className="size-4" />
            Remove
          </Button>
        </div>
      ))}
    </section>
  )
}

export default function AppConfigPage() {
  const configQuery = useAppConfig()
  const [draft, setDraft] = useState<DraftConfig | null>(null)
  const queryClient = useQueryClient()
  const toast = useToast()

  useEffect(() => {
    if (configQuery.data) setDraft(toDraft(configQuery.data))
  }, [configQuery.data])

  const saveMutation = useMutation({
    mutationFn: (payload: DraftConfig) => {
      const flags = (() => {
        try {
          return JSON.parse(payload.flagsText) as Record<string, unknown>
        } catch {
          throw new Error('Feature flags must be valid JSON')
        }
      })()
      return endpoints.updateAppConfig({ ...payload, featureFlags: flags })
    },
    onSuccess: (config) => {
      setDraft(toDraft(config))
      void queryClient.invalidateQueries({ queryKey: queryKeys.appConfig })
      toast.success('App config saved')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const uploadMutation = useMutation({
    mutationFn: endpoints.uploadImage,
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const uploadImage = async (file: File) => {
    const url = await uploadMutation.mutateAsync(file)
    toast.success('Image uploaded')
    return url
  }

  if (configQuery.isError) return <ErrorState message="Could not load app config." onRetry={() => void configQuery.refetch()} />
  if (configQuery.isLoading || !draft) return <LoadingPanel label="Loading app config" />

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        saveMutation.mutate(draft)
      }}
    >
      <PageHeader
        title="App Config"
        description="Control onboarding, banners, featured content, support details, app version, and flags."
        action={<Button type="submit" disabled={saveMutation.isPending}><Save className="size-4" />Save config</Button>}
      />
      <section className="grid gap-4 rounded-lg border border-border bg-card p-3 sm:p-4 md:grid-cols-3">
        <div className="md:col-span-3">
          <BilingualFields
            value={draft.branding?.translations}
            fields={[
              { key: 'appName', label: 'App name' },
              { key: 'tagline', label: 'Tagline' },
            ]}
            onChange={(translations) => setDraft({
              ...draft,
              branding: {
                ...(draft.branding || { appName: '', tagline: '', logoUrl: '', primaryColor: '', accentColor: '' }),
                translations,
                appName: translations.en.appName || draft.branding?.appName || 'Shree Yantra',
                tagline: translations.en.tagline || draft.branding?.tagline || 'Astrology',
              },
            })}
          />
        </div>
        <Field label="Support email">
          <Input value={draft.support.email} onChange={(event) => setDraft({ ...draft, support: { ...draft.support, email: event.target.value } })} />
        </Field>
        <Field label="Support phone">
          <Input value={draft.support.phone} onChange={(event) => setDraft({ ...draft, support: { ...draft.support, phone: event.target.value } })} />
        </Field>
        <Field label="App version">
          <Input value={draft.appVersion} onChange={(event) => setDraft({ ...draft, appVersion: event.target.value })} />
        </Field>
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <ImageListEditor
          title="Onboarding slides"
          items={draft.onboardingSlides}
          onUpload={uploadImage}
          onChange={(items) => setDraft({ ...draft, onboardingSlides: items })}
        />
        <ImageListEditor
          title="Home banners"
          items={draft.homeBanners}
          onUpload={uploadImage}
          onChange={(items) => setDraft({ ...draft, homeBanners: items })}
        />
      </div>
      <section className="grid gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Featured content</h2>
          <Button type="button" variant="secondary" size="sm" onClick={() => setDraft({ ...draft, featuredContent: [...draft.featuredContent, { ...emptyFeatured, order: draft.featuredContent.length }] })}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
        {draft.featuredContent.map((item, index) => (
          <div key={item._id || index} className="grid gap-3 rounded-md border border-border bg-background p-3 md:grid-cols-4">
            <Input placeholder="Type" value={item.type} onChange={(event) => {
              const next = [...draft.featuredContent]
              next[index] = { ...next[index], type: event.target.value }
              setDraft({ ...draft, featuredContent: next })
            }} />
            <div className="md:col-span-3">
              <BilingualFields
                value={item.translations}
                fields={[{ key: 'title', label: 'Title' }]}
                onChange={(translations) => {
                  const next = [...draft.featuredContent]
                  next[index] = { ...next[index], translations, title: translations.en.title || next[index].title }
                  setDraft({ ...draft, featuredContent: next })
                }}
              />
            </div>
            <Input placeholder="Title" value={item.title} onChange={(event) => {
              const next = [...draft.featuredContent]
              next[index] = { ...next[index], title: event.target.value }
              setDraft({ ...draft, featuredContent: next })
            }} />
            <Input placeholder="Ref id" value={item.refId || ''} onChange={(event) => {
              const next = [...draft.featuredContent]
              next[index] = { ...next[index], refId: event.target.value }
              setDraft({ ...draft, featuredContent: next })
            }} />
            <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, featuredContent: draft.featuredContent.filter((_, itemIndex) => itemIndex !== index) })}>
              <X className="size-4" />
              Remove
            </Button>
          </div>
        ))}
      </section>
      <section className="rounded-lg border border-border bg-card p-4">
        <Field label="Feature flags JSON">
          <Textarea className="min-h-40 font-mono text-xs" value={draft.flagsText} onChange={(event) => setDraft({ ...draft, flagsText: event.target.value })} />
        </Field>
      </section>
    </form>
  )
}
