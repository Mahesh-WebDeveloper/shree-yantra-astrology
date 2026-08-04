import type { CSSProperties } from 'react'
import { AppBar, Body, StatusBar, d, root, type DemoProps } from './chrome'

/**
 * राशिफल — a complete daily reading, top to bottom:
 * the day's headline, four mood meters that fill from zero, three area cards
 * with their own score bar and a single line of advice, the lucky trio, and
 * the button that opens the full reading.
 *
 * The board is 300x630 and the app's tab bar owns the bottom 56px, so the
 * content column here is budgeted to ~487px — nothing scrolls, nothing is cut.
 */

/** The day's mood, as the app shows it. */
const METERS = [
  { hi: 'ऊर्जा', en: 'Energy', v: 82 },
  { hi: 'प्रेम', en: 'Love', v: 74 },
  { hi: 'करियर', en: 'Career', v: 64 },
  { hi: 'स्वास्थ्य', en: 'Health', v: 88 },
]

const AREAS = [
  {
    hi: 'करियर',
    en: 'Career',
    v: 64,
    textHi: 'बड़ी बात दोपहर से पहले रख लीजिए।',
    textEn: 'Put the big conversation before noon.',
  },
  {
    hi: 'धन',
    en: 'Money',
    v: 52,
    textHi: 'आज उधार देने से बचिए।',
    textEn: 'Hold off on lending money today.',
  },
  {
    hi: 'रिश्ते',
    en: 'Relationships',
    v: 79,
    textHi: 'घर की एक पुरानी बात आज सुलझ सकती है।',
    textEn: 'An old matter at home can settle today.',
  },
]

const LUCKY = [
  { kHi: 'शुभ रंग', kEn: 'Colour', vHi: 'सुनहरा', vEn: 'Gold' },
  { kHi: 'शुभ अंक', kEn: 'Number', vHi: '5', vEn: '5' },
  { kHi: 'शुभ समय', kEn: 'Hour', vHi: '10:30', vEn: '10:30' },
]

export function RashifalDemo({ hi, play }: DemoProps) {
  return (
    <div className={root(play, 'syd--rashifal')}>
      <StatusBar />
      <AppBar title={hi ? 'मेरा राशिफल' : 'My Rashifal'} />
      <Body className="syd-r-body">
        <div className="syd-seg syd-seg--4 syd-in" style={d(0.04)}>
          <span className="is-on">{hi ? 'दैनिक' : 'Daily'}</span>
          <span>{hi ? 'साप्ताहिक' : 'Weekly'}</span>
          <span>{hi ? 'मासिक' : 'Monthly'}</span>
          <span>{hi ? 'वार्षिक' : 'Yearly'}</span>
        </div>

        <div className="syd-r-head syd-in" style={d(0.12)}>
          <span className="syd-r-sign">{hi ? 'मीन' : 'Meen'}</span>
          <span className="syd-r-date">24 Jul 2026</span>
        </div>

        <div className="syd-r-lede syd-in" style={d(0.2)}>
          <span className="syd-r-lede__score">
            <b>77</b>
            <i>{hi ? 'में से 100' : 'of 100'}</i>
          </span>
          <p>
            {hi
              ? 'सोच-समझकर उठाया एक कदम आज पूरे हफ़्ते का रुख़ बदल सकता है।'
              : 'One considered step today can set the tone for the whole week.'}
          </p>
        </div>

        <ul className="syd-r-meters">
          {METERS.map((m, i) => (
            <li className="syd-in" key={m.en} style={d(0.34 + i * 0.09)}>
              <span className="syd-r-meters__k">{hi ? m.hi : m.en}</span>
              <span className="syd-r-meters__v">{m.v}</span>
              <span className="syd-r-track">
                <b
                  className="syd-r-fill"
                  style={{ '--w': `${m.v}%`, '--d': `${0.48 + i * 0.11}s` } as CSSProperties}
                />
              </span>
            </li>
          ))}
        </ul>

        <ul className="syd-r-areas">
          {AREAS.map((a, i) => (
            <li className="syd-in" key={a.en} style={d(0.92 + i * 0.16)}>
              <div className="syd-r-areas__top">
                <b>{hi ? a.hi : a.en}</b>
                <span>{a.v}</span>
              </div>
              <span className="syd-r-track syd-r-track--thin">
                <b
                  className="syd-r-fill"
                  style={{ '--w': `${a.v}%`, '--d': `${1.1 + i * 0.16}s` } as CSSProperties}
                />
              </span>
              <p>{hi ? a.textHi : a.textEn}</p>
            </li>
          ))}
        </ul>

        <ul className="syd-r-lucky">
          {LUCKY.map((l, i) => (
            <li className="syd-pop" key={l.kEn} style={d(1.62 + i * 0.11)}>
              <span>{hi ? l.kHi : l.kEn}</span>
              <b>{hi ? l.vHi : l.vEn}</b>
            </li>
          ))}
        </ul>

        <div className="syd-r-cta syd-in" style={d(1.98)}>
          {hi ? 'पूरा राशिफल पढ़ें' : 'Read the full rashifal'}
          <i aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </i>
        </div>
      </Body>
    </div>
  )
}
