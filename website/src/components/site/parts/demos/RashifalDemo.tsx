import type { CSSProperties } from 'react'
import { AppBar, Body, StatusBar, d, root, type DemoProps } from './chrome'

/**
 * राशिफल — the four mood meters fill from zero, then the area cards slide in
 * with their own score bars, and the reading-size control settles at the end.
 */

const METERS = [
  { hi: 'प्रेम', en: 'Love', v: 78 },
  { hi: 'करियर', en: 'Career', v: 64 },
  { hi: 'स्वास्थ्य', en: 'Health', v: 85 },
  { hi: 'धन', en: 'Money', v: 52 },
]

const AREAS = [
  {
    hi: 'करियर',
    en: 'Career',
    v: 64,
    textHi: 'दिन का पहला भाग काम के लिए साफ़ है — बड़ी बात दोपहर से पहले रख लीजिए।',
    textEn: 'The first half of the day is clear for work — put the big conversation before noon.',
  },
  {
    hi: 'स्वास्थ्य',
    en: 'Health',
    v: 85,
    textHi: 'ऊर्जा अच्छी है, बस नींद का समय एक जैसा रखिए।',
    textEn: 'Energy holds well today; keep your sleep at the same hour.',
  },
]

export function RashifalDemo({ hi, play }: DemoProps) {
  return (
    <div className={root(play)}>
      <StatusBar />
      <AppBar title={hi ? 'मेरा राशिफल' : 'My Rashifal'} />
      <Body>
        <div className="syd-seg syd-seg--4 syd-in" style={d(0.05)}>
          <span className="is-on">{hi ? 'दैनिक' : 'Daily'}</span>
          <span>{hi ? 'साप्ताहिक' : 'Weekly'}</span>
          <span>{hi ? 'मासिक' : 'Monthly'}</span>
          <span>{hi ? 'वार्षिक' : 'Yearly'}</span>
        </div>

        <div className="syd-r-head syd-in" style={d(0.14)}>
          <span className="syd-r-sign">{hi ? 'मीन' : 'Meen'}</span>
          <span className="syd-r-date">24 Jul 2026</span>
        </div>

        <p className="syd-label syd-in" style={d(0.22)}>
          {hi ? 'आज का मिज़ाज' : "Today's mood"}
        </p>

        <ul className="syd-r-meters">
          {METERS.map((m, i) => (
            <li className="syd-in" key={m.en} style={d(0.34 + i * 0.12)}>
              <span className="syd-r-meters__k">{hi ? m.hi : m.en}</span>
              <span className="syd-r-track">
                <b className="syd-r-fill" style={{ '--w': `${m.v}%`, '--d': `${0.5 + i * 0.14}s` } as CSSProperties} />
              </span>
              <span className="syd-r-meters__v">{m.v}</span>
            </li>
          ))}
        </ul>

        <ul className="syd-r-areas">
          {AREAS.map((a, i) => (
            <li className="syd-in" key={a.en} style={d(1.15 + i * 0.22)}>
              <div className="syd-r-areas__top">
                <b>{hi ? a.hi : a.en}</b>
                <span>{a.v}</span>
              </div>
              <span className="syd-r-track syd-r-track--thin">
                <b
                  className="syd-r-fill"
                  style={{ '--w': `${a.v}%`, '--d': `${1.35 + i * 0.22}s` } as CSSProperties}
                />
              </span>
              <p>{hi ? a.textHi : a.textEn}</p>
            </li>
          ))}
        </ul>

        <div className="syd-r-size syd-in" style={d(1.75)}>
          <span>{hi ? 'पढ़ने का आकार' : 'Reading size'}</span>
          <span className="syd-r-size__set">
            <i>{hi ? 'अ' : 'A'}</i>
            <i className="is-on">{hi ? 'अ' : 'A'}</i>
            <i>{hi ? 'अ' : 'A'}</i>
          </span>
        </div>
      </Body>
    </div>
  )
}
