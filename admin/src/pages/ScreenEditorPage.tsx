import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, Loader2, RotateCcw, Save, Sparkles } from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { queryKeys, useAppConfig, useScreens } from '@/api/queries'
import { enrichScreenClient, fieldsForEdit as buildFieldsForEdit } from '@/data/screenDefaults'
import {
  AppConfigPreviewPanel,
  CustomFieldBadge,
  EditorTabBar,
  ImageFieldEditor,
  PhoneMockup,
  PreviewFieldList,
  ProgressRing,
} from '@/components/screens/screenEditorUi'
import { BilingualFields } from '@/components/BilingualFields'
import { ErrorState, LoadingPanel } from '@/components/DataState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { countCustomFields, customizationPercent, isImageKey, prettyKey, type EditorTab, type ScreenFields } from '@/lib/screensPage'

export default function ScreenEditorPage() {
  const { page: pageId = '' } = useParams()
  const navigate = useNavigate()
  const screensQuery = useScreens()
  const appConfigQuery = useAppConfig()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<EditorTab>('edit')
  const [draftState, setDraftState] = useState<{ page: string; fields: ScreenFields }>({ page: '', fields: {} })
  const [uploading, setUploading] = useState<string | null>(null)

  const screens = useMemo(
    () => (screensQuery.data ?? []).map((s) => enrichScreenClient(s, appConfigQuery.data ?? null)),
    [screensQuery.data, appConfigQuery.data],
  )

  const current = useMemo(() => screens.find((s) => s.page === pageId), [screens, pageId])

  useEffect(() => {
    if (!current) return
    setDraftState({ page: current.page, fields: buildFieldsForEdit(current) })
  }, [current])

  const draft = draftState.page === pageId ? draftState.fields : buildFieldsForEdit(current || { page: pageId, label: '', group: '', order: 0, fields: {} })
  const setDraft = (next: ScreenFields | ((d: ScreenFields) => ScreenFields)) => {
    setDraftState((state) => {
      const base = state.page === pageId ? state.fields : buildFieldsForEdit(current || { page: pageId, label: '', group: '', order: 0, fields: {} })
      return { page: pageId, fields: typeof next === 'function' ? next(base) : next }
    })
  }

  const mutation = useMutation({
    mutationFn: (payload: { page: string; fields: ScreenFields }) =>
      endpoints.updateScreen(payload.page, { fields: payload.fields }),
    onSuccess: () => {
      toast.success('Saved — app will show updated content')
      void queryClient.invalidateQueries({ queryKey: queryKeys.screens })
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  })

  const onUpload = async (key: string, file: File) => {
    setUploading(key)
    try {
      const url = await endpoints.uploadImage(file)
      setDraft((d) => ({ ...d, [key]: url }))
      toast.success('Image uploaded — save to apply')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setUploading(null)
    }
  }

  const resetField = (key: string) => {
    setDraft((d) => ({ ...d, [key]: isImageKey(key) ? '' : { en: '', hi: '' } }))
    toast.success('Reset — save to use app default')
  }

  const handleSave = (e?: FormEvent) => {
    e?.preventDefault()
    if (!current) return
    mutation.mutate({ page: current.page, fields: draft })
  }

  if (screensQuery.isLoading || appConfigQuery.isLoading) return <LoadingPanel label="Loading page…" />
  if (screensQuery.isError) return <ErrorState message="Could not load page." onRetry={() => void screensQuery.refetch()} />

  if (!current) {
    return (
      <div className="grid gap-4">
        <Link to="/pages" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="size-4" /> Back to pages
        </Link>
        <ErrorState message={`Page "${pageId}" not found.`} onRetry={() => navigate('/pages')} />
      </div>
    )
  }

  const customCount = countCustomFields(current)
  const totalFields = Object.keys(current.effective || {}).length
  const pct = customizationPercent(current)

  return (
    <div className="grid gap-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-2">
          <Link to="/pages" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="size-4" /> Pages — Content & Images
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <ProgressRing percent={pct} />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{current.label}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {customCount} customized · {totalFields - customCount} defaults · <Badge tone="neutral">{current.page}</Badge>
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EditorTabBar tab={tab} onChange={setTab} />
          <Button onClick={() => handleSave()} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save
          </Button>
        </div>
      </div>

      {current.appConfigLinks?.length ? (
        <div className="flex flex-wrap gap-2">
          {current.appConfigLinks.map((link) => (
            <Link key={link.path + link.label} to={link.path}>
              <Badge tone="neutral">{link.label} <ExternalLink className="ml-1 inline size-3" /></Badge>
            </Link>
          ))}
        </div>
      ) : null}

      <AppConfigPreviewPanel page={current.page} preview={current.appConfigPreview} />

      {tab === 'preview' ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <PreviewFieldList screen={current} />
          <div className="hidden lg:block"><PhoneMockup screen={current} /></div>
        </div>
      ) : null}

      {tab === 'edit' ? (
        <form className="grid gap-4" onSubmit={handleSave}>
          {Object.keys(draft).length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground">No editable fields.</p>
          ) : null}
          {Object.entries(draft).map(([key, value], i) =>
            isImageKey(key) ? (
              <div key={key} style={{ animationDelay: `${i * 45}ms` }}>
                <ImageFieldEditor
                  fieldKey={key}
                  value={typeof value === 'string' ? value : ''}
                  hint={current.fieldMeta?.[key]?.hint}
                  uploading={uploading === key}
                  onUpload={(f) => void onUpload(key, f)}
                  onChange={(url) => setDraft((d) => ({ ...d, [key]: url }))}
                  onClear={() => setDraft((d) => ({ ...d, [key]: '' }))}
                  onReset={() => resetField(key)}
                />
              </div>
            ) : (
              <div key={key} className="activity-stagger rounded-2xl border border-border bg-card p-4" style={{ animationDelay: `${i * 45}ms` }}>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{prettyKey(key)}</p>
                    {current.fieldMeta?.[key]?.hint ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{current.fieldMeta[key].hint}</p>
                    ) : null}
                    <CustomFieldBadge saved={current.sources?.[key] === 'custom'} />
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => resetField(key)}>
                    <RotateCcw className="size-4" /> Default
                  </Button>
                </div>
                <BilingualFields
                  value={
                    typeof value === 'object' && value !== null
                      ? { en: { value: value.en || '' }, hi: { value: value.hi || '' } }
                      : { en: { value: String(value || '') }, hi: { value: '' } }
                  }
                  fields={[{ key: 'value', label: 'Content', multiline: String(typeof value === 'string' ? value : value?.en || '').length > 50 }]}
                  onChange={(next) => setDraft((d) => ({ ...d, [key]: { en: next.en.value || '', hi: next.hi.value || '' } }))}
                />
              </div>
            ),
          )}
          <div className="mt-6 flex justify-end border-t border-border pt-5">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save changes
            </Button>
          </div>
        </form>
      ) : null}

      {pageId === 'home' ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-accent" />
          Home also loads live rashifal and panchang from the API — only labels and banners are editable here.
        </p>
      ) : null}
    </div>
  )
}
