import { GradientText } from '@/components/ui/GradientText'
import { useTheme } from '@/theme/ThemeProvider'

export function SectionTitle({ label }: { label: string }) {
  const { theme } = useTheme()
  return (
    <div className="welcome-sec-title">
      <GradientText className="font-display text-[13px] font-bold uppercase tracking-[0.14em]">{label}</GradientText>
      <div
        className="welcome-sec-rule mt-2 h-px w-full"
        style={{
          background: theme.isDark
            ? 'linear-gradient(90deg, rgba(233,184,80,0.55), rgba(233,184,80,0.14), transparent)'
            : 'linear-gradient(90deg, rgba(176,115,22,0.45), rgba(176,115,22,0.12), transparent)',
        }}
      />
    </div>
  )
}
