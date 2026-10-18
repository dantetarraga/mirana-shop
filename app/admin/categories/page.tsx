import { CategoryTreeClient } from '@/features/categories/components/CategoryTreeClient'
import { getAdminCategoryTree } from '@/features/categories/queries/category.queries'
import { verifyAdmin } from '@/shared/lib/require-admin'

export const metadata = { title: 'Categorías — Admin Mirana' }

// Árbol completo sin paginar (docs/NAVEGACION-CATALOGO.md §4): reordenar con
// arrastrar y soltar necesita ver todas las hermanas a la vez. La búsqueda es
// local, dentro del árbol.
export default async function CategoriesPage() {
  await verifyAdmin()
  const categories = await getAdminCategoryTree()
  return <CategoryTreeClient categories={categories} />
}
