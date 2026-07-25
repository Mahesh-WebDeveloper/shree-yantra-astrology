import { useEffect, useRef, useState } from 'react'
import { GoldButton } from '@/components/ui/GoldButton'
import { SyField, SyInput } from '@/components/feature/BirthDetailsForm'
import { GradientText } from '@/components/ui/GradientText'
import { ShreeYantraLogo } from '@/components/brand/ShreeYantraLogo'
import { requestOtp, verifyOtp, type AuthUser } from '@/lib/api'
import { saveAuth } from '@/lib/authSession'
import { useLang } from '@/i18n/LangProvider'

const OTP_LEN = 6

function phoneE164(digits: string) {
  return '+91' + digits.replace(/\D/g, '').slice(-10)
}

export function MobileAuthScreen({
  defaultName,
  onVerified,
  compact,
}: {
  defaultName?: string
  onVerified: (r: { token: string; user: AuthUser; isNew: boolean; profileComplete: boolean }) => void
  /** Embedded in profile card */
  compact?: boolean
}) {
  const { hi } = useLang()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [secs, setSecs] = useState(0)
  const otpRef = useRef<HTMLInputElement>(null)

  const digits = phone.replace(/\D/g, '')

  useEffect(() => {
    if (secs <= 0) return
    const t = window.setTimeout(() => setSecs((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [secs])

  const sendOtp = async () => {
    setError(null)
    if (digits.length < 10) {
      setError(hi ? 'कृपया 10-अंकीय मोबाइल नंबर दर्ज करें।' : 'Please enter a 10-digit mobile number.')
      return
    }
    if (busy) return
    setBusy(true)
    try {
      const r = await requestOtp(phoneE164(digits))
      setDevCode(r.devCode || null)
      setCode('')
      setStep('otp')
      setSecs(30)
      setTimeout(() => otpRef.current?.focus(), 200)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : hi ? 'OTP नहीं भेजा जा सका।' : 'Could not send OTP.')
    } finally {
      setBusy(false)
    }
  }

  const verify = async (full: string) => {
    if (busy || full.length < OTP_LEN) return
    setError(null)
    setBusy(true)
    try {
      const r = await verifyOtp({
        phone: phoneE164(digits),
        code: full,
        name: defaultName?.trim() || undefined,
      })
      saveAuth(r.token, r.user)
      onVerified(r)
    } catch (e: unknown) {
      setCode('')
      setError(e instanceof Error ? e.message : hi ? 'गलत OTP — पुनः प्रयास करें।' : 'Incorrect OTP — try again.')
    } finally {
      setBusy(false)
    }
  }

  const onOtpChange = (raw: string) => {
    const clean = raw.replace(/\D/g, '').slice(0, OTP_LEN)
    setCode(clean)
    if (clean.length === OTP_LEN) void verify(clean)
  }

  const shellClass = compact ? 'auth-screen auth-screen--compact' : 'auth-screen'

  return (
    <div className={shellClass}>
      {!compact ? (
        <div className="auth-screen-hero">
          <div className="auth-screen-om">
            <ShreeYantraLogo size={56} pulse={false} />
          </div>
          <GradientText className="auth-screen-title">
            {step === 'phone' ? (hi ? 'मोबाइल दर्ज करें' : 'ENTER MOBILE') : hi ? 'OTP सत्यापित करें' : 'VERIFY OTP'}
          </GradientText>
          <p className="auth-screen-lead">
            {step === 'phone'
              ? hi
                ? 'सत्यापन के लिए एक बार का कोड भेजा जाएगा — ऐप जैसा।'
                : 'We’ll send a one-time code to verify your number — same as the app.'
              : `${hi ? 'कोड भेजा' : 'Code sent to'} +91 ${digits.slice(-10)}`}
          </p>
        </div>
      ) : (
        <>
          <GradientText className="font-display text-lg font-semibold tracking-wide">
            {step === 'phone' ? (hi ? 'मोबाइल लॉगिन' : 'Mobile login') : hi ? 'OTP' : 'Verify OTP'}
          </GradientText>
          <p className="mt-2 text-sm text-[var(--sy-text-soft)]">
            {step === 'phone'
              ? hi
                ? 'ऐप जैसा OTP — कोई नया API नहीं।'
                : 'App-style OTP — existing backend only.'
              : `+91 ${digits.slice(-10)}`}
          </p>
        </>
      )}

      {error ? <p className="auth-screen-error">{error}</p> : null}

      {step === 'phone' ? (
        <div className="auth-screen-block">
          <SyField label={hi ? 'मोबाइल नंबर' : 'Mobile number'}>
            <div className="flex gap-2">
              <span className="sy-input flex w-14 shrink-0 items-center justify-center text-sm font-semibold text-[var(--sy-text-muted)]">
                +91
              </span>
              <SyInput
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="98XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void sendOtp()}
              />
            </div>
          </SyField>
          <GoldButton type="button" className="w-full" disabled={busy} onClick={() => void sendOtp()}>
            {busy ? (hi ? 'भेजा जा रहा है…' : 'Sending…') : hi ? 'OTP भेजें' : 'Send OTP'}
          </GoldButton>
          <p className="auth-screen-terms">
            {hi ? 'जारी रखकर आप नियम व गोपनीयता से सहमत हैं।' : 'By continuing you agree to our Terms & Privacy Policy.'}
          </p>
        </div>
      ) : (
        <div className="auth-screen-block">
          <button
            type="button"
            className="text-xs font-semibold text-[var(--sy-accent)] hover:underline"
            onClick={() => {
              setStep('phone')
              setCode('')
              setError(null)
            }}
          >
            ← {hi ? 'नंबर बदलें' : 'Change number'}
          </button>

          <div className="auth-otp-row" role="group" aria-label={hi ? 'OTP' : 'OTP digits'} onClick={() => otpRef.current?.focus()}>
            {Array.from({ length: OTP_LEN }).map((_, i) => {
              const filled = i < code.length
              const active = i === code.length
              return (
                <div key={i} className={`auth-otp-box ${active ? 'auth-otp-box--active' : ''}`}>
                  {filled ? code[i] : ''}
                </div>
              )
            })}
          </div>
          <input
            ref={otpRef}
            className="sr-only"
            value={code}
            onChange={(e) => onOtpChange(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LEN}
            aria-label="OTP"
          />

          {devCode ? (
            <button type="button" className="auth-dev-hint" onClick={() => onOtpChange(devCode)}>
              DEMO · {hi ? 'OTP भरें' : 'Auto-fill'}: {devCode}
            </button>
          ) : null}

          <GoldButton type="button" className="w-full" disabled={busy || code.length < OTP_LEN} onClick={() => void verify(code)}>
            {busy ? (hi ? 'सत्यापित…' : 'Verifying…') : hi ? 'सत्यापित करें और आगे बढ़ें' : 'Verify & continue'}
          </GoldButton>

          <button
            type="button"
            disabled={secs > 0 || busy}
            className={`mx-auto block text-sm font-semibold ${secs > 0 ? 'text-[var(--sy-text-muted)]' : 'text-[var(--sy-accent)] hover:underline'}`}
            onClick={() => secs === 0 && void sendOtp()}
          >
            {secs > 0 ? `${hi ? 'OTP दोबारा' : 'Resend in'} ${secs}s` : hi ? 'OTP दोबारा भेजें' : 'Resend OTP'}
          </button>
        </div>
      )}
    </div>
  )
}
