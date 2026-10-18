import { describe, expect, it } from 'vitest'
import {
  ancestorsOf,
  applyMoves,
  assertNoCycle,
  buildTree,
  CategoryTreeError,
  childrenOf,
  depthOf,
  descendantsOf,
  findParentError,
  flattenTree,
  subtreeHeight,
  totalsWithDescendants,
  validateTree,
  type TreeItem,
} from './category-tree'
import { limitMenuChildren, splitMenuRoots } from './menu-limits'

type Cat = TreeItem & { name: string; count: number }

const cats: Cat[] = [
  { id: 'lego', parentId: null, position: 1, name: 'LEGO', count: 2 },
  { id: 'anime', parentId: null, position: 0, name: 'Anime & Manga', count: 1 },
  { id: 'sw', parentId: 'lego', position: 1, name: 'Star Wars', count: 3 },
  { id: 'tech', parentId: 'lego', position: 0, name: 'Technic', count: 4 },
  { id: 'db', parentId: 'anime', position: 0, name: 'Dragon Ball', count: 0 },
  { id: 'modelos', parentId: null, position: 2, name: 'Modelos', count: 0 },
]

describe('buildTree / flattenTree', () => {
  it('ordena por position y anida con su profundidad', () => {
    const tree = buildTree(cats)
    expect(tree.map((n) => n.id)).toEqual(['anime', 'lego', 'modelos'])
    expect(tree[1].children.map((n) => n.id)).toEqual(['tech', 'sw'])
    expect(tree[1].children[0].depth).toBe(2)
    expect(flattenTree(tree).map((n) => n.id)).toEqual([
      'anime',
      'db',
      'lego',
      'tech',
      'sw',
      'modelos',
    ])
  })

  it('cuelga de la raíz a una hija cuyo padre no está (papelera)', () => {
    const tree = buildTree([{ id: 'x', parentId: 'borrada', name: 'X' }])
    expect(tree).toHaveLength(1)
    expect(tree[0].depth).toBe(1)
  })

  it('no pierde ni se cuelga con un ciclo', () => {
    const cyclic: TreeItem[] = [
      { id: 'a', parentId: 'b' },
      { id: 'b', parentId: 'a' },
    ]
    const flat = flattenTree(buildTree(cyclic))
    expect(flat.map((n) => n.id).sort()).toEqual(['a', 'b'])
  })

  it('empata por nombre cuando la posición es igual', () => {
    const list = [
      { id: '2', parentId: null, position: 0, name: 'Zeta' },
      { id: '1', parentId: null, position: 0, name: 'Alfa' },
    ]
    expect(childrenOf(list, null).map((c) => c.name)).toEqual(['Alfa', 'Zeta'])
  })
})

describe('ancestros y descendientes', () => {
  it('descendantsOf devuelve hijas sin incluirse', () => {
    expect(descendantsOf(cats, 'lego').sort()).toEqual(['sw', 'tech'])
    expect(descendantsOf(cats, 'sw')).toEqual([])
  })

  it('ancestorsOf va de la raíz hacia abajo', () => {
    expect(ancestorsOf(cats, 'sw').map((c) => c.id)).toEqual(['lego'])
    expect(ancestorsOf(cats, 'lego')).toEqual([])
  })

  it('depthOf y subtreeHeight', () => {
    expect(depthOf(cats, 'lego')).toBe(1)
    expect(depthOf(cats, 'sw')).toBe(2)
    expect(subtreeHeight(cats, 'lego')).toBe(2)
    expect(subtreeHeight(cats, 'modelos')).toBe(1)
  })
})

describe('reglas de integridad', () => {
  it('assertNoCycle lanza al colgar de sí misma o de una descendiente', () => {
    expect(() => assertNoCycle(cats, 'lego', 'lego')).toThrow(CategoryTreeError)
    expect(() => assertNoCycle(cats, 'lego', 'sw')).toThrow(/propias subcategorías/)
    expect(() => assertNoCycle(cats, 'sw', 'anime')).not.toThrow()
  })

  it('findParentError: padre inexistente o en la papelera', () => {
    expect(findParentError(cats, null, 'no-existe')).toMatch(/papelera/)
  })

  it('findParentError: no permite un tercer nivel', () => {
    expect(findParentError(cats, null, 'sw')).toMatch(/ya es una subcategoría/)
    expect(findParentError(cats, 'modelos', 'sw')).toMatch(/ya es una subcategoría/)
  })

  it('findParentError: una raíz con hijas no puede volverse subcategoría', () => {
    expect(findParentError(cats, 'lego', 'anime')).toMatch(/tiene subcategorías/)
  })

  it('findParentError: movimientos válidos', () => {
    expect(findParentError(cats, 'modelos', 'anime')).toBeNull()
    expect(findParentError(cats, 'sw', 'anime')).toBeNull()
    expect(findParentError(cats, 'sw', null)).toBeNull()
    expect(findParentError(cats, null, 'lego')).toBeNull()
  })

  it('validateTree detecta ciclos, huérfanas y profundidad', () => {
    expect(validateTree(cats)).toBeNull()
    expect(validateTree(applyMoves(cats, [{ id: 'lego', parentId: 'sw', position: 0 }]))).toMatch(
      /propia subcategoría/,
    )
    expect(validateTree(applyMoves(cats, [{ id: 'modelos', parentId: 'tech', position: 0 }]))).toMatch(
      /nivel 3/,
    )
    expect(validateTree([{ id: 'a', parentId: 'fantasma', name: 'A' }])).toMatch(/no existe/)
  })

  it('applyMoves no muta la lista original', () => {
    const moved = applyMoves(cats, [{ id: 'sw', parentId: 'anime', position: 5 }])
    expect(moved.find((c) => c.id === 'sw')).toMatchObject({ parentId: 'anime', position: 5 })
    expect(cats.find((c) => c.id === 'sw')?.parentId).toBe('lego')
  })
})

describe('totalsWithDescendants', () => {
  it('suma los conteos de las subcategorías', () => {
    const totals = totalsWithDescendants(cats, (c) => c.count)
    expect(totals.get('lego')).toBe(9)
    expect(totals.get('anime')).toBe(1)
    expect(totals.get('sw')).toBe(3)
    expect(totals.get('modelos')).toBe(0)
  })
})

describe('límites del menú', () => {
  it('splitMenuRoots manda el desborde a "Más"', () => {
    const roots = Array.from({ length: 8 }, (_, i) => i)
    expect(splitMenuRoots(roots)).toEqual({ bar: [0, 1, 2, 3, 4, 5], overflow: [6, 7] })
    expect(splitMenuRoots([1, 2]).overflow).toEqual([])
  })

  it('limitMenuChildren indica si hace falta "Ver todo"', () => {
    expect(limitMenuChildren([1, 2, 3, 4, 5, 6]).hasMore).toBe(false)
    expect(limitMenuChildren([1, 2, 3, 4, 5, 6, 7])).toEqual({
      shown: [1, 2, 3, 4, 5, 6],
      hasMore: true,
    })
  })
})
