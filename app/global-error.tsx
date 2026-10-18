'use client'

import { useEffect } from 'react'

// ---------------------------------------------------------------------------
// Último recurso: atiende los errores del layout raíz (app/layout.tsx), que
// app/error.tsx no puede capturar porque vive dentro de él. Reemplaza el
// layout entero, así que trae su propio <html>/<body> y no puede depender de
// globals.css, las fuentes ni los providers: estilos inline y nada más.
// ---------------------------------------------------------------------------

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app] Error en el layout raíz:', error)
  }, [error])

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          background: '#0b1830',
          color: '#ffffff',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <main>
          <h1 style={{ fontSize: 26, fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
            Algo salió mal
          </h1>
          <p style={{ opacity: 0.7, fontSize: 14, marginTop: 8, maxWidth: 360 }}>
            Ocurrió un error inesperado al cargar la tienda. Intenta de nuevo en unos segundos.
          </p>
          {error.digest && (
            <p style={{ opacity: 0.4, fontSize: 12, marginTop: 4 }}>Código: {error.digest}</p>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <button
              type="button"
              onClick={reset}
              style={{
                background: '#00c8ff',
                color: '#000000',
                border: 0,
                padding: '10px 20px',
                fontWeight: 700,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Reintentar
            </button>
            {/* <a> y no <Link>: si el layout raíz falló, el router puede no estar
                disponible; una navegación completa recarga todo desde cero. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- recarga completa a propósito */}
            <a
              href="/"
              style={{
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '10px 20px',
                fontWeight: 700,
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Ir al inicio
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
