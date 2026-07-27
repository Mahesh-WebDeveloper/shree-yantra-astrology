import { AppBar, Body, StatusBar, d, root, type DemoProps } from './chrome'

/**
 * ज्योतिषी से प्रश्न — a question goes up, the astrologer pauses, then the
 * answer arrives ONE LINE AT A TIME, carrying its verdict, the placements it
 * rests on, and the follow-ups you can tap next.
 *
 * Each line is its own block element with `white-space: normal`; only opacity
 * and a blur are animated. Nothing is ever split into per-word spans —
 * that is what made a reveal stack vertically inside a narrow column.
 */

const LINES = {
  hi: [
    'आपकी कुंडली में मंगल तीसरे भाव में है।',
    'मांगलिक तब माना जाता है जब मंगल पहले, चौथे, सातवें, आठवें या बारहवें भाव में बैठा हो।',
    'तीसरा भाव इनमें नहीं आता — इसलिए यहाँ मंगल दोष नहीं बनता।',
    'यानी आपकी अपनी कुंडली के अनुसार आपको मंगल दोष नहीं है।',
  ],
  en: [
    'In your chart, Mars sits in the third house.',
    'Manglik means Mars in the 1st, 4th, 7th, 8th or 12th house.',
    'The third house is not one of them, so the dosha does not form here.',
    'Going by your own chart, you do not have Mangal dosha.',
  ],
}

const EVIDENCE = [
  { kHi: 'मंगल', kEn: 'Mars', vHi: 'तीसरा भाव', vEn: '3rd house' },
  { kHi: 'लग्न', kEn: 'Lagna', vHi: 'वृश्चिक', vEn: 'Vrishchik' },
  { kHi: 'चंद्र', kEn: 'Moon', vHi: 'मीन', vEn: 'Meen' },
]

const NEXT = {
  hi: ['विवाह का समय?', 'करियर कैसा?', 'कौन-सा रत्न?'],
  en: ['Marriage timing?', 'Career?', 'Gemstone?'],
}

export function AskJyotishiDemo({ hi, play }: DemoProps) {
  const lines = hi ? LINES.hi : LINES.en
  const next = hi ? NEXT.hi : NEXT.en

  return (
    <div className={root(play, 'syd--ask')}>
      <StatusBar />
      <AppBar title={hi ? 'ज्योतिषी से प्रश्न' : 'Ask the Jyotishi'} />
      <Body className="syd-a-body">
        <p className="syd-label syd-in" style={d(0.05)}>
          {hi ? 'आपकी अपनी कुंडली से उत्तर' : 'Answered from your own kundli'}
        </p>

        <div className="syd-a-ask syd-in" style={d(0.2)}>
          <p>
            {hi
              ? 'क्या मुझे मंगल दोष है? घर में किसी ने बताया कि है।'
              : 'Do I have Mangal dosha? I was told that I do.'}
          </p>
        </div>

        <div className="syd-a-think syd-think" style={d(0.7)}>
          <span className="syd-a-think__dots">
            <i />
            <i />
            <i />
          </span>
          {hi ? 'कुंडली देख रहे हैं…' : 'Reading your chart…'}
        </div>

        <div className="syd-a-answer syd-in" style={d(1.7)}>
          <div className="syd-a-answer__head">
            <span className="syd-a-avatar" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" opacity=".55" />
              </svg>
            </span>
            <b>{hi ? 'ज्योतिषी' : 'Jyotishi'}</b>
          </div>

          <div className="syd-a-lines">
            {lines.map((line, i) => (
              <span className="syd-a-line" key={i} style={d(1.9 + i * 0.52)}>
                {line}
              </span>
            ))}
          </div>

          <div className="syd-a-verdict syd-pop" style={d(4.2)}>
            <i aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                <path d="M5 12.6l4.4 4.4L19 7.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </i>
            <b>{hi ? 'मंगल दोष — नहीं' : 'Mangal dosha — no'}</b>
          </div>

          <ul className="syd-a-ev">
            {EVIDENCE.map((e, i) => (
              <li className="syd-pop" key={e.kEn} style={d(4.42 + i * 0.11)}>
                <span>{hi ? e.kHi : e.kEn}</span>
                <b>{hi ? e.vHi : e.vEn}</b>
              </li>
            ))}
          </ul>
        </div>

        <div className="syd-a-next">
          <p className="syd-a-next__k syd-in" style={d(4.78)}>
            {hi ? 'आगे पूछ सकते हैं' : 'Ask next'}
          </p>
          <ul>
            {next.map((q, i) => (
              <li className="syd-pop" key={q} style={d(4.89 + i * 0.1)}>
                {q}
              </li>
            ))}
          </ul>
        </div>

        <div className="syd-a-input syd-in" style={d(5.2)}>
          <span>{hi ? 'अपना प्रश्न लिखिए…' : 'Type your question…'}</span>
          <i className="syd-a-send" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 12l16-7-7 16-2-7-7-2z" strokeLinejoin="round" />
            </svg>
          </i>
        </div>
      </Body>
    </div>
  )
}
