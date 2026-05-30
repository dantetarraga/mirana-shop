"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store-context";
import { Button } from "@/components/ui/Button";
import { X, LayoutGrid } from "lucide-react";

export function AuthModal() {
  const { authOpen, authMode, closeAuth, authenticate, openAuth } = useStore();
  const [mode, setMode] = useState<"login" | "register">(authMode);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [err, setErr] = useState("");

  useEffect(() => { setMode(authMode); }, [authMode]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") closeAuth(); };
    if (authOpen) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [authOpen, closeAuth]);

  if (!authOpen) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!form.email || !form.password) { setErr("Completa todos los campos"); return; }
    if (mode === "register" && form.password !== form.confirm) { setErr("Las contraseñas no coinciden"); return; }
    authenticate({ name: form.name || form.email.split("@")[0], email: form.email });
  };

  const I = ({ label }: { label: string }) => (
    <label style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", marginBottom: 6, display: "block" }}>{label}</label>
  );

  return (
    <div onClick={closeAuth} style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,.82)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--surf)", border: "1px solid var(--bd)",
        maxWidth: 440, width: "100%", position: "relative", padding: "40px 36px",
      }}>
        <Button
          variant="icon"
          size="md"
          onClick={closeAuth}
          style={{ position: "absolute", top: 14, right: 14 }}
        ><X size={16} /></Button>

        <div style={{ display: "flex", border: "1px solid var(--bd)", marginBottom: 28 }}>
          {(["login", "register"] as const).map((m) => (
            <Button
              key={m}
              variant="tab"
              size="md"
              active={mode === m}
              onClick={() => { setMode(m); setErr(""); openAuth(m); }}
              style={{ flex: 1 }}
            >
              {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </Button>
          ))}
        </div>

        <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.5px", lineHeight: 1, marginBottom: 6 }}>
          {mode === "login" ? "Bienvenido" : "Únete a Mirana"}
        </div>
        <div style={{ color: "var(--mt)", fontSize: 13, marginBottom: 24 }}>
          {mode === "login" ? "Ingresa para acceder a tu cuenta y pedidos" : "Crea una cuenta y desbloquea ofertas exclusivas"}
        </div>

        <form onSubmit={submit}>
          {mode === "register" && (
            <div style={{ marginBottom: 14 }}>
              <I label="Nombre completo" />
              <input className="auth-input" placeholder="Tu nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: "100%", background: "var(--card)", border: "1px solid var(--bd)", color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 14, padding: "12px 14px", outline: "none" }} />
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <I label="Correo electrónico" />
            <input type="email" placeholder="tucorreo@ejemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: "100%", background: "var(--card)", border: "1px solid var(--bd)", color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 14, padding: "12px 14px", outline: "none" }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <I label="Contraseña" />
            <input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ width: "100%", background: "var(--card)", border: "1px solid var(--bd)", color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 14, padding: "12px 14px", outline: "none" }} />
          </div>
          {mode === "register" && (
            <div style={{ marginBottom: 14 }}>
              <I label="Confirmar contraseña" />
              <input type="password" placeholder="••••••••" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} style={{ width: "100%", background: "var(--card)", border: "1px solid var(--bd)", color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 14, padding: "12px 14px", outline: "none" }} />
            </div>
          )}
          {err && <div style={{ color: "#ff6644", fontSize: 12, marginBottom: 10 }}>{err}</div>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--mt)", margin: "6px 0 18px" }}>
            {mode === "login" ? (
              <><label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}><input type="checkbox" /> Recordarme</label>
                <a style={{ color: "var(--gold)", cursor: "pointer" }}>¿Olvidaste tu contraseña?</a></>
            ) : <span>Al registrarte aceptas los <a style={{ color: "var(--gold)" }}>Términos</a></span>}
          </div>
          <Button type="submit" variant="accent" size="lg" full>
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </Button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0", color: "var(--mt)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
          <span style={{ flex: 1, height: 1, background: "var(--bd)" }} /> o continúa con <span style={{ flex: 1, height: 1, background: "var(--bd)" }} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="outline" size="md" onClick={() => authenticate({ name: "Usuario Google", email: "demo@gmail.com" })} style={{ flex: 1 }}>
            <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Google
          </Button>
          {/* Botón demo admin para facilitar pruebas */}
          <Button variant="outline" size="md" onClick={() => authenticate({ name: "Admin Mirana", email: "admin@mirana.com" })} style={{ flex: 1 }}>
            <LayoutGrid size={14} />
            Demo Admin
          </Button>
        </div>
      </div>
    </div>
  );
}
