import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Image as ImageIcon, Save, Upload, X } from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints, type ScreenContent } from '@/api/endpoints'
import { assetUrl } from '@/api/assets'
import { queryKeys, useScreens } from '@/api/queries'
import { BilingualFields } from '@/components/BilingualFields'
import { ErrorState, LoadingPanel } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/form'
import { useToast } from '@/components/ui/toast'

const isImageKey = (k: string) => /image|logo|photo|icon|cover|banner/i.test(k)
const prettyKey = (k: string) =>
  k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).replace(/\bUrl\b/i, '')
type ScreenFields = Record<string, string | { en?: string; hi?: string }>

export default function ScreensPage() {
  const screensQuery = useScreens()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [active, setActive] = useState<string>('')
  const [draftState, setDraftState] = useState<{ page: string; fields: ScreenFields }>({ page: '', fields: {} })
  const [uploading, setUploading] = useState<string | null>(null)

  const screens = useMemo(() => screensQuery.data ?? [], [screensQuery.data])
  const activePage = active || screens[0]?.page || ''
  const current = useMemo(() => screens.find((s) => s.page === activePage), [screens, activePage])
  const draft = draftState.page === activePage ? draftState.fields : { ...((current && current.fields) || {}) }
  const setDraft = (next: ScreenFields | ((currentDraft: ScreenFields) => ScreenFields)) => {
    setDraftState((state) => {
      const base = state.page === activePage ? state.fields : { ...((current && current.fields) || {}) }
      return {
        page: activePage,
        fields: typeof next === 'function' ? next(base) : next,
      }
    })
  }

  const mutation = useMutation({
    mutationFn: (payload: { page: string; fields: ScreenFields }) =>
      endpoints.updateScreen(payload.page, { fields: payload.fields }),
    onSuccess: () => {
      toast.success('Page content saved')
      queryClient.invalidateQueries({ queryKey: queryKeys.screens })
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  })

  if (screensQuery.isLoading) return <LoadingPanel label="Loading pages" />
  if (screensQuery.isError) return <ErrorState message="Could not load pages." onRetry={() => void screensQuery.refetch()} />

  const groups = screens.reduce<Record<string, ScreenContent[]>>((acc, s) => {
    ;(acc[s.group] ||= []).push(s)
    return acc
  }, {})

  const onUpload = async (key: string, file: File) => {
    setUploading(key)
    try {
      const url = await endpoints.uploadImage(file)
      setDraft((d) => ({ ...d, [key]: url }))
      toast.success('Image uploaded — Save to apply')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Pages — Content & Images"
        description="Edit each app page's content here. The app reflects these changes in real time."
      />
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* page list */}
        <aside className="max-h-72 overflow-y-auto rounded-lg border border-border bg-card p-2 text-card-foreground lg:max-h-none">
          {Object.entries(groups).map(([group, list]) => (
            <div key={group} className="mb-2">
              <p className="px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground">{group}</p>
              <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
                {list.map((s) => (
                  <button
                    key={s.page}
                    onClick={() => setActive(s.page)}
                    className={`min-w-max rounded-md px-3 py-2 text-left text-sm lg:block lg:w-full lg:min-w-0 ${
                      activePage === s.page ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    {s.label || s.page}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* editor */}
        <section className="rounded-lg border border-border bg-card p-3 text-card-foreground sm:p-5">
          {!current ? (
            <p className="text-muted-foreground">Select a page.</p>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold">{current.label || current.page}</h2>
                <Button onClick={() => mutation.mutate({ page: current.page, fields: draft })} disabled={mutation.isPending}>
                  <Save className="mr-2 size-4" />
                  {mutation.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {Object.keys(draft).length === 0 && <p className="text-muted-foreground">No editable fields.</p>}
                {Object.entries(draft).map(([key, value]) =>
                  isImageKey(key) ? (
                    <div key={key} className="md:col-span-2">
                    <Field label={prettyKey(key)}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="grid size-16 place-items-center overflow-hidden rounded-md border border-border bg-muted">
                        {typeof value === 'string' && value ? (
                            <img src={assetUrl(value)} alt={key} className="size-full object-cover" />
                          ) : (
                            <ImageIcon className="size-5 text-muted-foreground" />
                          )}
                        </div>
                        <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-muted sm:h-10">
                          <Upload className="size-4" />
                          {uploading === key ? 'Uploading…' : 'Upload image'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) void onUpload(key, f) }}
                          />
                        </label>
                        {value ? (
                          <Button type="button" variant="ghost" size="sm" onClick={() => setDraft((d) => ({ ...d, [key]: '' }))}>
                            <X className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                      <Input
                        className="mt-2"
                        placeholder="or paste an image URL"
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                      />
                    </Field>
                    </div>
                  ) : (
                    <div key={key} className="md:col-span-2">
                    <BilingualFields
                      value={typeof value === 'object' && value !== null ? { en: { value: value.en || '' }, hi: { value: value.hi || '' } } : { en: { value: String(value || '') }, hi: { value: '' } }}
                      fields={[{ key: 'value', label: prettyKey(key), multiline: String(typeof value === 'string' ? value : value?.en || '').length > 60 }]}
                      onChange={(next) => setDraft((d) => ({ ...d, [key]: { en: next.en.value || '', hi: next.hi.value || '' } }))}
                    />
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
