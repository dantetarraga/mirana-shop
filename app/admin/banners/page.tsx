"use client";

import { AdminDrawer } from "@/shared/components/AdminDrawer";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { FormField } from "@/shared/components/ui/FormField";
import { cls } from "@/shared/lib/admin-classes";
import { BANNER_STATUS } from "@/shared/lib/admin-constants";
import { useAdminStore } from "@/shared/stores/admin.store";
import type { Banner } from "@/shared/types/admin-mock.types";
import { PanelHeader } from "@/shared/components/PanelHeader";
import { ArrowRight, Plus } from "lucide-react";
import { useState } from "react";

export default function BannersPage() {
  const banners      = useAdminStore((s) => s.banners);
  const saveBanner   = useAdminStore((s) => s.saveBanner);
  const toggleBanner = useAdminStore((s) => s.toggleBanner);
  const [editing, setEditing] = useState<Banner | null>(null);

  return (
    <div className="px-8 pt-7 pb-12">
      <PanelHeader
        label="Marketing"
        title={`${banners.filter((b) => b.status === "activo").length} banners activos`}
        align="center"
        side={
          <Button variant="accent" size="md" onClick={() => setEditing({ id: 0, title: "", subtitle: "", cta: "", position: "Hero principal", status: "programado", clicks: 0 })}>
            <Plus className="mr-2" /> Nuevo banner
          </Button>
        }
      />

      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
        {banners.map((b) => (
          <div key={b.id} className="overflow-hidden bg-card border border-(--bd)">
            <div className="h-37.5 relative">
              <div className="stripe-fig absolute inset-0" />

              <div className="absolute inset-0 flex flex-col justify-center pl-6 bg-linear-to-r from-black/55 to-black/15">
                <div className="font-display text-[26px] font-black uppercase leading-[0.95]">{b.title}</div>
                
                <div className="text-[12px] mt-1 text-white/80">{b.subtitle}</div>
                
                <div className="font-display font-extrabold text-[12px] tracking-[1px] uppercase px-3 py-1.25 mt-2.5 w-fit bg-(--gold) text-black">
                  {b.cta} <ArrowRight className="inline-block ml-1" />
                </div>

              </div>

              <span className="absolute top-3 right-3 bg-black/60">
                <StatusBadge config={BANNER_STATUS[b.status]} variant="filled" />
              </span>
            </div>

            <div className="px-4.5 py-4">
              <div className="flex justify-between py-1.5 text-[13px]">
                <span className="text-[11px] tracking-[1px] uppercase text-muted">Posición</span>
                <span className="font-semibold">{b.position}</span>
              </div>

              <div className="flex justify-between py-1.5 text-[13px]">
                <span className="text-[11px] tracking-[1px] uppercase text-muted">Clics</span>
                <span className="font-display font-extrabold text-(--gold)">{b.clicks.toLocaleString()}</span>
              </div>

              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" full onClick={() => setEditing(b)}>Editar</Button>

                <Button variant="outline" size="sm" full onClick={() => toggleBanner(b.id)}>
                  {b.status === "activo" ? "Pausar" : "Activar"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <AdminDrawer
          title={editing.title || "Banner"}
          sub={editing.id ? "Editar banner" : "Nuevo banner"}
          onClose={() => setEditing(null)}
        >
          <FormField label="Título">
            <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={cls.input} />
          </FormField>

          <FormField label="Subtítulo">
            <input value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} className={cls.input} />
          </FormField>
          
          <div className="grid grid-cols-2 gap-3.5">
            <FormField label="Texto botón">
              <input value={editing.cta} onChange={(e) => setEditing({ ...editing, cta: e.target.value })} className={cls.input} />
            </FormField>

            <FormField label="Posición">
              <select value={editing.position} onChange={(e) => setEditing({ ...editing, position: e.target.value })} className={cls.input}>
                <option>Hero principal</option>
                <option>Banda CTA</option>
                <option>Marquee superior</option>
              </select>
            </FormField>
          </div>

          <div className="flex gap-2.5">
            <Button variant="accent" size="md" full onClick={() => { saveBanner(editing); setEditing(null); }}>Guardar banner</Button>

            <Button variant="outline" size="md" full onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </AdminDrawer>
      )}
    </div>
  );
}
