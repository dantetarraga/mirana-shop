import {
  siDiscord,
  siFacebook,
  siInstagram,
  siPinterest,
  siThreads,
  siTiktok,
  siTwitch,
  siX,
  siYoutube,
} from 'simple-icons'

// ---------------------------------------------------------------------------
// Redes sociales que el admin puede mostrar en el footer. Cada una trae su
// ícono oficial (simple-icons, CC0), su color de marca y los dominios que se
// aceptan como enlace, para que un enlace de Facebook no termine con el ícono
// de TikTok por error.
// ---------------------------------------------------------------------------

export const SOCIAL_NETWORKS = {
  instagram: { label: 'Instagram', icon: siInstagram, hosts: ['instagram.com'] },
  tiktok: { label: 'TikTok', icon: siTiktok, hosts: ['tiktok.com'] },
  facebook: { label: 'Facebook', icon: siFacebook, hosts: ['facebook.com', 'fb.com', 'fb.me'] },
  youtube: { label: 'YouTube', icon: siYoutube, hosts: ['youtube.com', 'youtu.be'] },
  x: { label: 'X (Twitter)', icon: siX, hosts: ['x.com', 'twitter.com'] },
  threads: { label: 'Threads', icon: siThreads, hosts: ['threads.net', 'threads.com'] },
  pinterest: { label: 'Pinterest', icon: siPinterest, hosts: ['pinterest.com', 'pin.it'] },
  twitch: { label: 'Twitch', icon: siTwitch, hosts: ['twitch.tv'] },
  discord: { label: 'Discord', icon: siDiscord, hosts: ['discord.gg', 'discord.com'] },
} as const

export type SocialNetworkId = keyof typeof SOCIAL_NETWORKS

export const SOCIAL_NETWORK_IDS = Object.keys(SOCIAL_NETWORKS) as SocialNetworkId[]

export interface SocialLink {
  network: SocialNetworkId
  url: string
}

export function isSocialNetworkId(value: unknown): value is SocialNetworkId {
  return typeof value === 'string' && value in SOCIAL_NETWORKS
}

/** ¿El enlace es del dominio de esa red? (acepta subdominios: m., www., vm.) */
export function urlMatchesNetwork(url: string, network: SocialNetworkId): boolean {
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return false
  }
  return SOCIAL_NETWORKS[network].hosts.some((h) => host === h || host.endsWith(`.${h}`))
}

/** Campos anteriores a la lista configurable (siguen en StoreSettings). */
interface LegacySocialFields {
  instagramUrl?: string | null
  tiktokUrl?: string | null
  youtubeUrl?: string | null
  facebookUrl?: string | null
}

/**
 * Lista de redes a mostrar. Si el admin ya guardó la lista nueva (`socialLinks`,
 * aunque esté vacía) manda esa; si nunca la guardó, se arma con los campos
 * *Url de antes para no perder lo que ya estaba configurado.
 */
export function resolveSocialLinks(raw: unknown, legacy: LegacySocialFields = {}): SocialLink[] {
  if (Array.isArray(raw)) {
    const seen = new Set<SocialNetworkId>()
    const links: SocialLink[] = []
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue
      const { network, url } = item as { network?: unknown; url?: unknown }
      if (!isSocialNetworkId(network) || typeof url !== 'string' || !url.trim()) continue
      if (seen.has(network)) continue
      seen.add(network)
      links.push({ network, url: url.trim() })
    }
    return links
  }

  const fromLegacy: [SocialNetworkId, string | null | undefined][] = [
    ['instagram', legacy.instagramUrl],
    ['tiktok', legacy.tiktokUrl],
    ['facebook', legacy.facebookUrl],
    ['youtube', legacy.youtubeUrl],
  ]
  return fromLegacy
    .filter((entry): entry is [SocialNetworkId, string] => Boolean(entry[1]?.trim()))
    .map(([network, url]) => ({ network, url: url.trim() }))
}
