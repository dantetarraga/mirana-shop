'use client'

import { updateMyProfile, type ProfileData } from '@/features/users/actions/account-profile.actions'
import { Button } from '@/shared/components/ui/Button'
import { Loader2, Save } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const inputCls =
  'w-full bg-surf border border-(--bd) text-text font-sans text-[14px] px-[13px] py-[10px] outline-none focus:border-(--gold)/50 transition-colors duration-150'

export function ProfileEditForm({
  profile,
  email,
  onSaved,
}: {
  profile: ProfileData
  email: string
  onSaved: (updated: Partial<ProfileData>) => void
}) {
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [hasKids, setHasKids] = useState(profile.hasKids)
  const [kidsCount, setKidsCount] = useState(String(profile.kidsCount ?? ''))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const result = await updateMyProfile(email, {
      phone: phone.trim() || undefined,
      hasKids,
      kidsCount: hasKids && kidsCount ? Number(kidsCount) : null,
    })
    setSaving(false)
    if (result.success) {
      toast.success('Perfil actualizado')
      onSaved({
        phone: phone.trim() || null,
        hasKids,
        kidsCount: hasKids && kidsCount ? Number(kidsCount) : null,
      })
    } else {
      toast.error(result.error ?? 'Error al guardar')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-[10px] tracking-[2px] uppercase text-(--gold) mb-1.5">
          Teléfono / Celular
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+51 999 999 999"
          type="tel"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-[10px] tracking-[2px] uppercase text-(--gold) mb-2">
          ¿Tienes hijos?
        </label>
        <div className="flex gap-3">
          {[
            { val: false, label: 'No' },
            { val: true, label: 'Sí' },
          ].map(({ val, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setHasKids(val)}
              className={`px-5 py-2 text-[13px] font-semibold border transition-colors duration-150 ${
                hasKids === val
                  ? 'bg-(--gold) text-black border-(--gold)'
                  : 'bg-surf border-(--bd) text-muted hover:border-(--gold)/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {hasKids && (
        <div>
          <label className="block text-[10px] tracking-[2px] uppercase text-(--gold) mb-1.5">
            ¿Cuántos hijos tienes?
          </label>
          <input
            value={kidsCount}
            onChange={(e) => setKidsCount(e.target.value.replace(/\D/g, ''))}
            placeholder="Ej: 2"
            type="number"
            min={1}
            max={20}
            className={`${inputCls} w-24`}
          />
        </div>
      )}

      <Button
        variant="accent"
        size="md"
        onClick={handleSave}
        disabled={saving}
        className="self-start"
      >
        {saving ? (
          <Loader2 size={14} className="mr-2 animate-spin" />
        ) : (
          <Save size={14} className="mr-2" />
        )}
        Guardar cambios
      </Button>
    </div>
  )
}
