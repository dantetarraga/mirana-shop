import { describe, expect, it } from 'vitest'
import type { CategoryRow } from '@/features/categories/types'
import { buildCategoryPageData, buildMenuTree, filterPublicNodes } from './menu-tree'

function row(partial: Partial<CategoryRow> & Pick<CategoryRow, 'id' | 'name'>): CategoryRow {
  return {
    slug: partial.id,
    parentId: null,
    description: null,
    imageUrl: null,
    position: 0,
    isVisible: true,
    showInMenu: false,
    productCount: 0,
    ...partial,
  }
}

const rows: CategoryRow[] = [
  row({ id: 'lego', name: 'LEGO', position: 1, showInMenu: true, productCount: 1 }),
  row({ id: 'anime', name: 'Anime', position: 0, showInMenu: true }),
  row({ id: 'modelos', name: 'Modelos', position: 2, showInMenu: false, productCount: 5 }),
  row({ id: 'vacia', name: 'Vacía', position: 3, showInMenu: true }),
  row({ id: 'oculta', name: 'Oculta', position: 4, showInMenu: true, isVisible: false, productCount: 9 }),
  row({ id: 'sw', name: 'Star Wars', parentId: 'lego', position: 1, productCount: 2 }),
  row({ id: 'tech', name: 'Technic', parentId: 'lego', position: 0, productCount: 0 }),
  row({ id: 'db', name: 'Dragon Ball', parentId: 'anime', productCount: 3 }),
  row({ id: 'db-oculta', name: 'One Piece', parentId: 'anime', isVisible: false, productCount: 4 }),
  row({ id: 'hija-de-oculta', name: 'Hija', parentId: 'oculta', productCount: 1 }),
]

describe('filterPublicNodes', () => {
  it('quita las ocultas y toda su rama, en preorden', () => {
    const ids = filterPublicNodes(rows).map((r) => r.id)
    expect(ids).toEqual(['anime', 'db', 'lego', 'tech', 'sw', 'modelos', 'vacia'])
  })
})

describe('buildMenuTree', () => {
  const nodes = filterPublicNodes(rows)

  it('solo raíces del menú con productos (contando descendientes), por posición', () => {
    const menu = buildMenuTree(nodes)
    expect(menu.map((m) => m.id)).toEqual(['anime', 'lego'])
    expect(menu[0].productCount).toBe(3)
    expect(menu[1].productCount).toBe(3)
  })

  it('omite subcategorías sin productos', () => {
    const lego = buildMenuTree(nodes).find((m) => m.id === 'lego')!
    expect(lego.children.map((c) => c.id)).toEqual(['sw'])
  })
})

describe('buildCategoryPageData', () => {
  const nodes = filterPublicNodes(rows)

  it('raíz: hijas visibles (incluidas las vacías) e ids para filtrar', () => {
    const data = buildCategoryPageData(nodes, 'lego')!
    expect(data.ancestors).toEqual([])
    expect(data.children.map((c) => [c.id, c.productCount])).toEqual([
      ['tech', 0],
      ['sw', 2],
    ])
    expect(data.categoryIds.sort()).toEqual(['lego', 'sw', 'tech'])
    expect(data.category.productCount).toBe(3)
  })

  it('subcategoría: migas con el padre', () => {
    const data = buildCategoryPageData(nodes, 'sw')!
    expect(data.ancestors.map((a) => a.slug)).toEqual(['lego'])
    expect(data.children).toEqual([])
    expect(data.categoryIds).toEqual(['sw'])
  })

  it('null para ocultas o inexistentes', () => {
    expect(buildCategoryPageData(nodes, 'oculta')).toBeNull()
    expect(buildCategoryPageData(nodes, 'hija-de-oculta')).toBeNull()
    expect(buildCategoryPageData(nodes, 'nada')).toBeNull()
  })
})
