import { useEffect, useState } from 'react'
import type { ApiPlanet } from '@/lib/api'
import { BirthChart } from '@/components/kundli/BirthChart'
import type { ChartStyle } from '@/data/kundliChart'

export function KundliChartModal({
  open,
  onClose,
  title,
  planets,
  ascendant,
  initialStyle,
}: {
  open: boolean
  onClose: () => void
  title: string
  planets: ApiPlanet[]
  ascendant?: string | null
  initialStyle: ChartStyle
}) {
  const [style, setStyle] = useState(initialStyle)
  useEffect(() => {
    if (open) setStyle(initialStyle)
  }, [open, initialStyle])

  if (!open) return null

  return (
    <div className="kundli-chart-modal" role="dialog" aria-modal aria-label={title}>
      <button type="button" className="kundli-chart-modal-backdrop" onClick={onClose} aria-label="Close" />
      <div className="kundli-chart-modal-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button type="button" className="kundli-tab-pill" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['north', 'south', 'east'] as ChartStyle[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`kundli-tab-pill ${style === s ? 'kundli-tab-pill--on' : ''}`}
              onClick={() => setStyle(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-center">
          <BirthChart style={style} planets={planets} ascendant={ascendant} className="max-w-md w-full" />
        </div>
      </div>
    </div>
  )
}
