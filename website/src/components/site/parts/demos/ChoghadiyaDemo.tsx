import { AppBar, Body, StatusBar, d, root, type DemoProps } from './chrome'

/**
 * चौघड़िया — the window that is running right now fills its own progress bar,
 * then the day's EIGHT windows slide in with their quality colour and the
 * "next auspicious time" line lights up at the end.
 *
 * Eight is not decoration: a day carries exactly eight choghadiya windows
 * between sunrise and sunset, and showing all of them is also what carries the
 * list down to the tab bar with no empty band under it.
 */

type Tone = 'ok' | 'warn' | 'bad'

const ROWS: {
  hi: string
  en: string
  from: string
  to: string
  tone: Tone
  now?: boolean
}[] = [
  { hi: 'चर', en: 'Chara', from: '05:59', to: '07:40', tone: 'warn' },
  { hi: 'लाभ', en: 'Labha', from: '07:40', to: '09:21', tone: 'ok' },
  { hi: 'अमृत', en: 'Amrita', from: '09:21', to: '11:02', tone: 'ok' },
  { hi: 'काल', en: 'Kaala', from: '11:02', to: '12:44', tone: 'bad', now: true },
  { hi: 'शुभ', en: 'Shubha', from: '12:44', to: '14:25', tone: 'ok' },
  { hi: 'रोग', en: 'Roga', from: '14:25', to: '16:06', tone: 'bad' },
  { hi: 'उद्वेग', en: 'Udvega', from: '16:06', to: '17:47', tone: 'bad' },
  { hi: 'चर', en: 'Chara 2', from: '17:47', to: '19:29', tone: 'warn' },
]

export function ChoghadiyaDemo({ hi, play }: DemoProps) {
  return (
    <div className={root(play, 'syd--chogh')}>
      <StatusBar />
      <AppBar title={hi ? 'चौघड़िया' : 'Choghadiya'} />
      <Body className="syd-c-body">
        <div className="syd-seg syd-in" style={d(0.05)}>
          <span className="is-on">{hi ? 'दिन' : 'Day'}</span>
          <span>{hi ? 'रात' : 'Night'}</span>
        </div>

        <div className="syd-c-now syd-in" style={d(0.16)}>
          <div className="syd-c-now__top">
            <span className="syd-c-now__pill">
              <i className="syd-dot-live" />
              {hi ? 'अभी चल रहा है' : 'Running now'}
            </span>
            <span className="syd-c-now__left">{hi ? '49 मिनट बाकी' : '49 min left'}</span>
          </div>
          <div className="syd-c-now__name" data-tone="bad">
            <b>{hi ? 'काल' : 'Kaala'}</b>
            <em>11:02 – 12:44</em>
          </div>
          <div className="syd-c-bar">
            <span className="syd-c-bar__fill" />
          </div>
          <p className="syd-c-now__hint">
            {hi ? 'नया काम शुरू करने के लिए उपयुक्त नहीं' : 'Not suited to starting new work'}
          </p>
        </div>

        <ul className="syd-c-list">
          {ROWS.map((r, i) => (
            <li
              className={`syd-c-row syd-in${r.now ? ' is-now' : ''}`}
              key={r.en}
              data-tone={r.tone}
              style={d(0.4 + i * 0.1)}
            >
              <span className="syd-c-row__edge" />
              <span className="syd-c-row__name">{hi ? r.hi : r.en.replace(' 2', '')}</span>
              <span className="syd-c-row__time">
                {r.from} – {r.to}
              </span>
            </li>
          ))}
        </ul>

        <div className="syd-c-next syd-in" style={d(1.32)}>
          <span className="syd-c-next__k">{hi ? 'अगला शुभ समय' : 'Next auspicious window'}</span>
          <span className="syd-c-next__v">{hi ? 'शुभ · 12:44' : 'Shubha · 12:44'}</span>
        </div>
      </Body>
    </div>
  )
}
