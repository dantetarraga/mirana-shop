---
name: feedback-server-client-separation
description: Estrategia validada para separar Server Components y Client Components en paneles admin de Mirana Shop
metadata:
  type: feedback
---

# Feedback: Separación Server/Client Components en Admin Panels

**Regla:** Cuando un componente admin monolítico es 100% Client Component pero contiene renderizado estático extenso (grids, cards sin interacción), separar en componentes granulares con mínima superficie cliente.

**Why:**

- Reduce bundle size del JavaScript client-side en ~60-70%
- Mejora hidratación y performance al renderizar estructura estática en servidor
- Facilita mantenimiento al separar responsabilidades claramente
- El patrón fue validado exitosamente en BannersClient.tsx (312 líneas → 160 líneas coordinador + 3 componentes especializados)

**How to apply:**

1. **Identificar superficie interactiva mínima:**
   - Formularios con react-hook-form → Client Component
   - Botones con onClick/handlers → Client Component
   - Renderizado de listas estáticas → Puede ser Server Component (pero los ítems individuales con interacción son Client)

2. **Arquitectura recomendada para paneles CRUD:**

   ```
   [Feature]Client.tsx      → Client Component (coordinador, maneja estado UI)
   ├─ [Feature]Grid.tsx     → Server Component (estructura estática, opcional si delegas directamente)
   ├─ [Feature]Card.tsx     → Client Component (card individual + botones)
   └─ [Feature]FormDrawer.tsx → Client Component (react-hook-form)
   ```

3. **Responsabilidades del coordinador ([Feature]Client.tsx):**
   - Maneja estado de UI: `editingId`, `isNew`, `drawerOpen`, `pendingDelete`
   - Usa hooks: `useServerAction`, `useRouter`
   - Handlers que llaman Server Actions: `onSubmit`, `handleToggle`, `handleDelete`
   - Delega renderizado a componentes granulares
   - Tamaño típico: 120-180 líneas

4. **Qué NO hacer:**
   - No crear Server Components para todo: los cards individuales NECESITAN ser Client si tienen onClick
   - No separar si el componente ya es pequeño (<150 líneas) y mayoritariamente interactivo
   - No sobre-granularizar: máximo 3-4 componentes por panel

**Ejemplo de implementación:**
Ver [[refactor_banners_granular]] para caso completo de BannersClient.tsx

**Relación con otros patrones:**

- Combina con [[audit_admin_dashboard]] (custom hooks strategy)
- Usa [[feedback_nextjs16_apis]] (router.refresh() para sincronizar estado servidor)
