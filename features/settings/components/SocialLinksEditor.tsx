'use client'

import {
  SOCIAL_NETWORK_IDS,
  SOCIAL_NETWORKS,
  urlMatchesNetwork,
  type SocialLink,
  type SocialNetworkId,
} from '@/features/settings/lib/social-networks'
import { SocialIcon } from '@/shared/components/ui/SocialIcon'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'

interface SocialLinksEditorProps {
  value: SocialLink[]
  onChange: (links: SocialLink[]) => void
}

const PLACEHOLDERS: Record<SocialNetworkId, string> = {
  instagram: 'https://www.instagram.com/mirana.shop',
  tiktok: 'https://www.tiktok.com/@mirana.shop',
  facebook: 'https://www.facebook.com/mirana.shop',
  youtube: 'https://www.youtube.com/@miranashop',
  x: 'https://x.com/miranashop',
  threads: 'https://www.threads.net/@mirana.shop',
  pinterest: 'https://www.pinterest.com/miranashop',
  twitch: 'https://www.twitch.tv/miranashop',
  discord: 'https://discord.gg/tu-invitacion',
}

const iconBtn =
  'grid place-items-center w-10 h-10 border border-(--bd) text-muted hover:text-text hover:border-(--bdh) disabled:opacity-35 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-ring'

/**
 * Redes del footer: el admin elige cuáles mostrar, en qué orden y con qué
 * enlace. Las que no se agregan no aparecen en la tienda. El enlace se valida
 * contra el dominio de la red (también en el servidor).
 */
export function SocialLinksEditor({ value, onChange }: SocialLinksEditorProps) {
  const baseId = useId()
  const used = new Set(value.map((l) => l.network))
  const available = SOCIAL_NETWORK_IDS.filter((id) => !used.has(id))
  const [toAdd, setToAdd] = useState<SocialNetworkId | ''>('')

  const update = (index: number, patch: Partial<SocialLink>) =>
    onChange(value.map((link, i) => (i === index ? { ...link, ...patch } : link)))

  const move = (index: number, dir: -1 | 1) => {
    const next = [...value]
    const target = index + dir
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const add = () => {
    const network = toAdd || available[0]
    if (!network) return
    onChange([...value, { network, url: '' }])
    setToAdd('')
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 ? (
        <p className="text-[13px] text-muted">
          No hay redes. Agrega las que quieras mostrar en el footer; las demás no aparecen.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {value.map((link, i) => {
            const meta = SOCIAL_NETWORKS[link.network]
            const urlId = `${baseId}-url-${i}`
            const wrongHost = link.url.trim() !== '' && !urlMatchesNetwork(link.url, link.network)
            return (
              <li
                key={link.network}
                className="flex items-start gap-2.5 border border-(--bd) bg-card p-2.5"
              >
                <span className="grid place-items-center w-10 h-10 shrink-0 bg-surf text-text">
                  <SocialIcon network={link.network} size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <label htmlFor={urlId} className="block text-[13px] font-semibold text-text mb-1">
                    {meta.label}
                  </label>
                  <input
                    id={urlId}
                    type="url"
                    inputMode="url"
                    value={link.url}
                    onChange={(e) => update(i, { url: e.target.value })}
                    placeholder={PLACEHOLDERS[link.network]}
                    aria-invalid={wrongHost || undefined}
                    aria-describedby={wrongHost ? `${urlId}-err` : undefined}
                    className={cls.input}
                  />
                  {wrongHost && (
                    <p id={`${urlId}-err`} role="alert" className="mt-1 text-[12px] text-danger">
                      Este enlace no es de {meta.label}. Debe empezar con https://{meta.hosts[0]}/…
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0 pt-6">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Subir ${meta.label}`}
                    className={iconBtn}
                  >
                    <ArrowUp size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                    aria-label={`Bajar ${meta.label}`}
                    className={iconBtn}
                  >
                    <ArrowDown size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((_, j) => j !== i))}
                    aria-label={`Quitar ${meta.label}`}
                    className={cn(iconBtn, 'hover:text-danger')}
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {available.length > 0 && (
        <div className="flex gap-2">
          <label htmlFor={`${baseId}-add`} className="sr-only">
            Red social para agregar
          </label>
          <select
            id={`${baseId}-add`}
            value={toAdd}
            onChange={(e) => setToAdd(e.target.value as SocialNetworkId | '')}
            className={cn(cls.input, 'flex-1')}
          >
            <option value="">Elige una red…</option>
            {available.map((id) => (
              <option key={id} value={id}>
                {SOCIAL_NETWORKS[id].label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={add}
            disabled={!toAdd}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 border border-(--bd) text-[13px] font-semibold text-text hover:border-(--bdh) disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Plus size={16} aria-hidden />
            Agregar
          </button>
        </div>
      )}
    </div>
  )
}
