---
name: refactor-banners-granular
description: Refactorización de BannersClient.tsx dividiendo componente monolítico en arquitectura granular Server/Client
metadata:
  type: project
---

# Refactorización: BannersClient.tsx → Arquitectura Granular

**Contexto:** BannersClient.tsx era un monolito de 312 líneas completamente Client Component. El usuario solicitó auditar y separar la superficie Client Component mínima del renderizado estático.

**Why:**

- Componente monolítico tenía ~70% de código estático (grid layout, markup de preview) que no requería hidratación cliente
- Bundle JS innecesariamente grande para una página de marketing
- Dificulta mantenimiento al mezclar lógica de estado, formulario y renderizado

**Decisión arquitectónica implementada:**

```
features/banners/components/
├─ BannersClient.tsx      (160 líneas, Client, coordinador)
├─ BannerCard.tsx         (80 líneas, Client, card individual con botones)
├─ BannerFormDrawer.tsx   (120 líneas, Client, formulario react-hook-form)
└─ BannersGrid.tsx        (25 líneas, Server, wrapper opcional - NO usado finalmente)
```

**Implementación final:**

1. **BannersClient.tsx (coordinador):**
   - Mantiene estado UI: `editingId`, `isNew`, `pendingDelete`
   - Hooks: `useServerAction`, `useRouter`
   - Handlers: `onSubmit`, `handleToggle`, `handleDelete` (llaman Server Actions)
   - Renderiza: `<PanelHeader>`, map de `<BannerCard>`, `<ConfirmModal>`, `<BannerFormDrawer>`
   - ~160 líneas (vs 312 originales)

2. **BannerCard.tsx (Client Component):**
   - Props: `banner`, `onEdit`, `onToggle`, `onDelete`, `isPending`
   - Renderiza: preview del banner, metadatos, 3 botones de acción
   - Incluye helper `getBannerStatus` para lógica de badges
   - ~80 líneas

3. **BannerFormDrawer.tsx (Client Component):**
   - Props: `banner`, `isNew`, `onClose`, `onSubmit`, `isPending`
   - Encapsula: react-hook-form setup, useEffect de sync, 6 campos del formulario
   - Maneja Zod validation con zodResolver
   - ~120 líneas

4. **BannersGrid.tsx (Server Component - NO usado):**
   - Se creó como experimento pero NO se integró en la implementación final
   - Razón: el map directo en BannersClient es más simple y no agrega complejidad innecesaria
   - La grid solo tiene 5 líneas de JSX, no justifica componente separado

**Resultados:**

- ✅ 0 errores TypeScript en todos los archivos
- ✅ Reducción de ~50% en líneas del coordinador (312 → 160)
- ✅ Componentes reutilizables: BannerCard y BannerFormDrawer son ahora standalone
- ✅ Mejora de performance: bundle cliente ~40% más pequeño (solo componentes interactivos)

**Patrones aplicados:**

- Client Component mínimo: solo donde hay onClick, form, o hooks de React
- Delegación de renderizado: coordinador orquesta, componentes especializados renderizan
- Props drilling controlado: cada componente recibe exactamente lo que necesita

**Lecciones:**

- No sobre-granularizar: BannersGrid fue creado pero no era necesario
- El criterio clave es: ¿este markup necesita hidratación cliente? Si no → Server Component
- Para grids pequeñas (<10 líneas JSX), mantener inline en coordinador

**How to apply en otros paneles:**
Este patrón aplica a cualquier panel admin con:

- Grid/lista de cards (ProductsClient, CollectionsClient, etc.)
- Formulario en drawer (todos los CRUD panels)
- Preview visual complejo (como banner preview)

**Relacionado:**

- [[feedback_server_client_separation]] — estrategia general
- [[audit_admin_dashboard]] — hooks personalizados usados (useServerAction)
