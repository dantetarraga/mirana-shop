---
name: feedback-nextjs16-apis
description: APIs de Next.js 16 que cambiaron firma: revalidateTag requiere 2 argumentos, searchParams es Promise
metadata:
  type: feedback
---

En Next.js 16.x hay cambios de API respecto a versiones anteriores:

1. **revalidateTag requiere 2 argumentos:**
   ```typescript
   revalidateTag("my-tag", "layout"); // correcto
   revalidateTag("my-tag"); // error TS: Expected 2 arguments but got 1
   ```
   El segundo argumento es el perfil de caché (string o `{ expire?: number }`). Usar `"layout"` como valor por defecto.

2. **searchParams es Promise en Server Components:**
   ```typescript
   // Page component
   export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
     const { q } = await searchParams; // MUST await
   }
   ```

**Why:** Next.js 16 introdujo el nuevo sistema de caché con perfiles, haciendo revalidateTag asíncrona en su firma. searchParams también es Promise ahora para habilitar streaming.

**How to apply:** Siempre await searchParams en Server Components. Siempre pasar 2 args a revalidateTag.
