"use client";

import { useState } from "react";
import { AdminDrawer } from "@/features/admin/dashboard/components/AdminDrawer";
import { BANNERS_DATA } from "@/features/admin/dashboard/lib/admin-data";
import { BANNER_STATUS } from "@/features/admin/dashboard/lib/admin-constants";
import { formInp } from "@/features/admin/dashboard/lib/admin-styles";
import { Button } from "@/components/ui/Button";

export function BannersModule() {
  const [banners, setBanners] = useState(BANNERS_DATA);
  const [editing, setEditing] = useState<typeof BANNERS_DATA[number] | null>(null);

  const toggle = (id: number) =>
    setBanners(bs => bs.map(b => b.id === id ? { ...b, status: b.status === "activo" ? "inactivo" : "activo" } : b));

  const save = (b: typeof BANNERS_DATA[number]) => {
    setBanners(bs => b.id ? bs.map(x => x.id === b.id ? b : x) : [...bs, { ...b, id: Math.max(0, ...bs.map(x => x.id)) + 1 }]);
    setEditing(null);
  };

  return (
    <div style={{ padding: "28px 32px 48px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)", marginBottom: 5 }}>Marketing</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, textTransform: "uppercase" }}>{banners.filter(b => b.status === "activo").length} banners activos</div>
        </div>
        <Button variant="accent" size="md" onClick={() => setEditing({ id: 0, title: "", subtitle: "", cta: "", position: "Hero principal", status: "programado", clicks: 0 })}>
          + Nuevo banner
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {banners.map(b => (
          <div key={b.id} style={{ background: "var(--card)", border: "1px solid var(--bd)", overflow: "hidden" }}>
            <div style={{ height: 150, position: "relative" }}>
              <div className="stripe-fig" style={{ position: "absolute", inset: 0 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.15) 70%)", display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 24 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 900, textTransform: "uppercase", lineHeight: .95 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.8)", marginTop: 4 }}>{b.subtitle}</div>
                <div style={{ display: "inline-block", background: "var(--gold)", color: "#000", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", padding: "5px 12px", marginTop: 10, width: "fit-content" }}>{b.cta} →</div>
              </div>
              <span style={{ position: "absolute", top: 12, right: 12, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", padding: "4px 11px", color: BANNER_STATUS[b.status].color, background: "rgba(0,0,0,.6)" }}>{BANNER_STATUS[b.status].label}</span>
            </div>
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}><span style={{ color: "var(--mt)", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Posición</span><span style={{ fontWeight: 600 }}>{b.position}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}><span style={{ color: "var(--mt)", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Clics</span><span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--gold)" }}>{b.clicks.toLocaleString()}</span></div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button variant="outline" size="sm" full onClick={() => setEditing(b)}>Editar</Button>
                <Button variant="outline" size="sm" full onClick={() => toggle(b.id)}>{b.status === "activo" ? "Pausar" : "Activar"}</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <AdminDrawer title={editing.title || "Banner"} sub={editing.id ? "Editar banner" : "Nuevo banner"} onClose={() => setEditing(null)}>
          <div><label style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", marginBottom: 6, display: "block" }}>Título</label><input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} style={formInp} /></div>
          <div><label style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", marginBottom: 6, display: "block" }}>Subtítulo</label><input value={editing.subtitle} onChange={e => setEditing({ ...editing, subtitle: e.target.value })} style={formInp} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", marginBottom: 6, display: "block" }}>Texto botón</label><input value={editing.cta} onChange={e => setEditing({ ...editing, cta: e.target.value })} style={formInp} /></div>
            <div><label style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", marginBottom: 6, display: "block" }}>Posición</label>
              <select value={editing.position} onChange={e => setEditing({ ...editing, position: e.target.value })} style={formInp}>
                <option>Hero principal</option><option>Banda CTA</option><option>Marquee superior</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="accent" size="md" full onClick={() => save(editing)}>Guardar banner</Button>
            <Button variant="outline" size="md" full onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </AdminDrawer>
      )}
    </div>
  );
}
