import { mediaUrl } from '@/lib/location'

export function HomeBanner({ imageUrl }: { imageUrl: string }) {
  const src = mediaUrl(imageUrl) || imageUrl
  return (
    <img
      src={src}
      alt=""
      className="relative z-10 mt-4 h-[150px] w-full rounded-2xl object-cover"
    />
  )
}
