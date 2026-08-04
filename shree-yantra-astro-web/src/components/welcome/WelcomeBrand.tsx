import { motion } from 'framer-motion'
import { ShreeYantraLogo } from '@/components/brand/ShreeYantraLogo'
import { BrandOrnament } from '@/components/ui/OrnamentLine'
import { GradientText } from '@/components/ui/GradientText'
import { mediaUrl } from '@/lib/location'

export function WelcomeBrand({
  appName,
  tagline,
  logoUrl,
}: {
  appName: string
  tagline: string
  logoUrl?: string | null
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="relative z-10 flex flex-col items-center gap-3 pt-2 text-center"
    >
      {logoUrl ? (
        <img
          src={mediaUrl(logoUrl) || logoUrl}
          alt=""
          className="h-[72px] w-[72px] rounded-2xl object-contain shadow-[0_0_32px_rgba(233,184,80,0.35)]"
        />
      ) : (
        <ShreeYantraLogo size={72} />
      )}
      <h1 className="font-display text-2xl font-extrabold tracking-[0.2em] sm:text-[1.65rem]">
        <GradientText>{appName.toUpperCase()}</GradientText>
      </h1>
      <div className="flex items-center gap-3 text-[var(--sy-accent)]">
        <BrandOrnament />
        <span className="font-display text-[11px] font-semibold tracking-[0.38em]">{tagline.toUpperCase()}</span>
        <BrandOrnament flip />
      </div>
    </motion.header>
  )
}
