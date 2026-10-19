import { SOCIAL_NETWORKS, type SocialNetworkId } from '@/features/settings/lib/social-networks'

/** Ícono oficial de una red social (path de simple-icons), en currentColor. */
export function SocialIcon({
  network,
  size = 18,
  className,
}: {
  network: SocialNetworkId
  size?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={className}
    >
      <path d={SOCIAL_NETWORKS[network].icon.path} />
    </svg>
  )
}

/** Color de marca de la red (hex sin #, de simple-icons). */
export function socialBrandColor(network: SocialNetworkId): string {
  return `#${SOCIAL_NETWORKS[network].icon.hex}`
}
