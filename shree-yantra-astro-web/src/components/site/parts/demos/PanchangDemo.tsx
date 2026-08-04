import { AppBar, Body, StatusBar, d, root, type DemoProps } from './chrome'

/**
 * आज का पंचांग — the five limbs arrive one after another, each with the time
 * it ends, then sunrise/sunset settle in and the Rahu Kaal band breathes.
 */

const LIMBS = [
  {
    labelHi: 'तिथि',
    labelEn: 'Tithi',
    valueHi: 'दशमी',
    valueEn: 'Dashami',
    tillHi: '9:13 AM तक',
    tillEn: 'till 9:13 AM',
    noteHi: 'शुक्ल पक्ष',
    noteEn: 'Shukla paksha',
  },
  {
    labelHi: 'नक्षत्र',
    labelEn: 'Nakshatra',
    valueHi: 'अनुराधा',
    valueEn: 'Anuradha',
    tillHi: '4:35 AM तक',
    tillEn: 'till 4:35 AM',
    noteHi: 'पाद 1',
    noteEn: 'Pada 1',
  },
  {
    labelHi: 'योग',
    labelEn: 'Yoga',
    valueHi: 'शुक्ल',
    valueEn: 'Shukla',
    tillHi: '8:10 PM तक',
    tillEn: 'till 8:10 PM',
    noteHi: 'योग 24',
    noteEn: 'Yoga 24',
  },
  {
    labelHi: 'करण',
    labelEn: 'Karana',
    valueHi: 'गर',
    valueEn: 'Gara',
    tillHi: '9:13 AM तक',
    tillEn: 'till 9:13 AM',
    noteHi: 'अगला वणिज',
    noteEn: 'Vanija next',
  },
  {
    labelHi: 'वार',
    labelEn: 'Vaara',
    valueHi: 'शुक्रवार',
    valueEn: 'Shukravaar',
    tillHi: 'अगले सूर्योदय तक',
    tillEn: 'till next sunrise',
    noteHi: 'शुक्र का दिन',
    noteEn: 'day of Venus',
  },
]

export function PanchangDemo({ hi, play }: DemoProps) {
  return (
    <div className={root(play)}>
      <StatusBar />
      <AppBar title={hi ? 'पंचांग' : 'Panchang'} />
      <Body>
        <div className="syd-p-date syd-in" style={d(0.05)}>
          <span className="syd-p-date__arrow">‹</span>
          <span>
            <b>24 Jul 2026</b>
            <em>{hi ? 'शुक्रवार · आज' : 'Friday · today'}</em>
          </span>
          <span className="syd-p-date__arrow">›</span>
        </div>

        <div className="syd-p-place syd-in" style={d(0.14)}>
          <i className="syd-pin" />
          Jodhpur
        </div>

        <p className="syd-label syd-in" style={d(0.2)}>
          {hi ? 'पंचांग — पाँच अंग' : 'Panchang — the five limbs'}
        </p>

        <ul className="syd-p-list">
          {LIMBS.map((l, i) => (
            <li className="syd-p-row syd-in" key={l.labelEn} style={d(0.32 + i * 0.16)}>
              <span className="syd-p-row__k">{hi ? l.labelHi : l.labelEn}</span>
              <span className="syd-p-row__v">
                <b>{hi ? l.valueHi : l.valueEn}</b>
                <em>{hi ? l.noteHi : l.noteEn}</em>
              </span>
              <span className="syd-p-row__t">{hi ? l.tillHi : l.tillEn}</span>
            </li>
          ))}
        </ul>

        <div className="syd-p-sun">
          <div className="syd-p-sun__cell syd-in" style={d(1.2)}>
            <span>{hi ? 'सूर्योदय' : 'Sunrise'}</span>
            <b>05:59</b>
          </div>
          <div className="syd-p-sun__cell syd-in" style={d(1.3)}>
            <span>{hi ? 'सूर्यास्त' : 'Sunset'}</span>
            <b>19:29</b>
          </div>
        </div>

        <div className="syd-p-rahu syd-in" style={d(1.44)}>
          <span className="syd-p-rahu__band" />
          <span className="syd-p-rahu__k">{hi ? 'राहु काल' : 'Rahu Kaal'}</span>
          <span className="syd-p-rahu__v">10:45 – 12:26</span>
        </div>
      </Body>
    </div>
  )
}
