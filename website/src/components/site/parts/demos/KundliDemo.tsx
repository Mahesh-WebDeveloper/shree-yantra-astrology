import type { CSSProperties } from 'react'
import { AppBar, Body, StatusBar, d, root, type DemoProps } from './chrome'

/**
 * जन्म कुंडली — the North-Indian chart draws itself (stroke-dash), the rashi
 * numbers fade up, the planets settle into their houses, then the
 * लग्न / राशि / नक्षत्र chips, the dosha pair and the running mahadasha
 * arrive — so the screen reaches the tab bar with no dead band under it.
 */

type House = { n: number; x: number; y: number; planets: string[]; planetsEn: string[] }

/* Lagna = Vrishchik (8), so the rashi numbers run 8 → 7 clockwise. */
const HOUSES: House[] = [
  { n: 8, x: 100, y: 40, planets: ['श'], planetsEn: ['Sa'] },
  { n: 9, x: 56, y: 19, planets: [], planetsEn: [] },
  { n: 10, x: 24, y: 50, planets: ['मं'], planetsEn: ['Ma'] },
  { n: 11, x: 54, y: 96, planets: [], planetsEn: [] },
  { n: 12, x: 24, y: 146, planets: ['चं'], planetsEn: ['Mo'] },
  { n: 1, x: 56, y: 172, planets: ['के'], planetsEn: ['Ke'] },
  { n: 2, x: 100, y: 150, planets: ['गु'], planetsEn: ['Ju'] },
  { n: 3, x: 145, y: 172, planets: [], planetsEn: [] },
  { n: 4, x: 176, y: 146, planets: [], planetsEn: [] },
  { n: 5, x: 146, y: 96, planets: ['सू', 'शु'], planetsEn: ['Su', 'Ve'] },
  { n: 6, x: 176, y: 50, planets: ['बु'], planetsEn: ['Me'] },
  { n: 7, x: 145, y: 19, planets: ['रा'], planetsEn: ['Ra'] },
]

const CHIPS = [
  { kHi: 'लग्न', kEn: 'Lagna', vHi: 'वृश्चिक', vEn: 'Vrishchik' },
  { kHi: 'चंद्र राशि', kEn: 'Rashi', vHi: 'मीन', vEn: 'Meen' },
  { kHi: 'नक्षत्र', kEn: 'Nakshatra', vHi: 'रेवती', vEn: 'Revati' },
]

const FLAGS = [
  { kHi: 'मंगल दोष', kEn: 'Mangal dosha', vHi: 'नहीं', vEn: 'No', tone: 'ok' },
  { kHi: 'साढ़े साती', kEn: 'Sade Sati', vHi: 'चल रही है', vEn: 'Running', tone: 'warn' },
]

export function KundliDemo({ hi, play }: DemoProps) {
  return (
    <div className={root(play, 'syd--kundli')}>
      <StatusBar />
      <AppBar title={hi ? 'जन्म कुंडली' : 'Janam Kundli'} />
      <Body className="syd-k-body">
        <div className="syd-seg syd-seg--3 syd-in" style={d(0.05)}>
          <span className="is-on">{hi ? 'उत्तर' : 'North'}</span>
          <span>{hi ? 'दक्षिण' : 'South'}</span>
          <span>{hi ? 'पूर्व' : 'East'}</span>
        </div>

        <p className="syd-label syd-in" style={d(0.12)}>
          {hi ? 'जन्म — 14 Mar 1994 · 06:42 · Jodhpur' : 'Birth — 14 Mar 1994 · 06:42 · Jodhpur'}
        </p>

        <div className="syd-k-chart">
          <svg viewBox="0 0 200 200" role="img" aria-hidden>
            <g className="syd-k-lines" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect className="syd-k-line" x="3" y="3" width="194" height="194" pathLength={1} style={d(0.18)} />
              <path className="syd-k-line" d="M3 3 L197 197" pathLength={1} style={d(0.5)} />
              <path className="syd-k-line" d="M197 3 L3 197" pathLength={1} style={d(0.66)} />
              <path
                className="syd-k-line"
                d="M100 3 L197 100 L100 197 L3 100 Z"
                pathLength={1}
                style={d(0.82)}
              />
            </g>

            <g className="syd-k-nums">
              {HOUSES.map((h, i) => (
                <text
                  key={h.n}
                  className="syd-k-num"
                  x={h.x}
                  y={h.y}
                  textAnchor="middle"
                  style={d(1.25 + i * 0.035)}
                >
                  {h.n}
                </text>
              ))}
            </g>

            <g className="syd-k-planets">
              {HOUSES.flatMap((h, i) =>
                (hi ? h.planets : h.planetsEn).map((p, j, arr) => (
                  <text
                    key={`${h.n}-${p}`}
                    className="syd-k-planet"
                    x={h.x + (arr.length > 1 ? (j - (arr.length - 1) / 2) * 22 : 0)}
                    y={h.y + 17}
                    textAnchor="middle"
                    style={d(1.7 + i * 0.07)}
                  >
                    {p}
                  </text>
                )),
              )}
            </g>
          </svg>
          <span className="syd-k-sweep" aria-hidden />
        </div>

        <ul className="syd-k-chips">
          {CHIPS.map((c, i) => (
            <li className="syd-k-chip syd-pop" key={c.kEn} style={d(2.5 + i * 0.14)}>
              <span>{hi ? c.kHi : c.kEn}</span>
              <b>{hi ? c.vHi : c.vEn}</b>
            </li>
          ))}
        </ul>

        <ul className="syd-k-flags">
          {FLAGS.map((f, i) => (
            <li className="syd-in" key={f.kEn} data-tone={f.tone} style={d(2.94 + i * 0.12)}>
              <span>{hi ? f.kHi : f.kEn}</span>
              <b>{hi ? f.vHi : f.vEn}</b>
            </li>
          ))}
        </ul>

        <div className="syd-k-dasha syd-in" style={d(3.2)}>
          <div className="syd-k-dasha__top">
            <span>{hi ? 'महादशा' : 'Mahadasha'}</span>
            <em>2019 – 2039</em>
          </div>
          <div className="syd-k-dasha__mid">
            <b>{hi ? 'शुक्र' : 'Shukra'}</b>
            <span>{hi ? 'अंतर्दशा — चंद्र' : 'Antardasha — Chandra'}</span>
          </div>
          <span className="syd-r-track syd-r-track--thin">
            <b className="syd-r-fill" style={{ '--w': '35%', '--d': '3.45s' } as CSSProperties} />
          </span>
        </div>

        <p className="syd-k-foot syd-in" style={d(3.6)}>
          {hi ? 'किसी भी खाने या ग्रह पर टैप करके समझिए' : 'Tap any house or planet to understand it'}
        </p>
      </Body>
    </div>
  )
}
