import { describe, expect, it } from 'vitest'
import {
  applyCategoryMoves,
  computeMoves,
  flattenVisible,
  getProjection,
  moveItem,
  type DndRow,
} from './tree-dnd'

const rows: DndRow[] = [
  { id: 'anime', parentId: null, position: 0, name: 'Anime' },
  { id: 'db', parentId: 'anime', position: 0, name: 'Dragon Ball' },
  { id: 'op', parentId: 'anime', position: 1, name: 'One Piece' },
  { id: 'lego', parentId: null, position: 1, name: 'LEGO' },
  { id: 'sw', parentId: 'lego', position: 0, name: 'Star Wars' },
  { id: 'modelos', parentId: null, position: 2, name: 'Modelos' },
]

const INDENT = 28
const ids = (list: { row: DndRow }[]) => list.map((i) => i.row.id)

describe('flattenVisible', () => {
  it('pinta en preorden con nivel 0/1', () => {
    const flat = flattenVisible(rows, new Set())
    expect(ids(flat)).toEqual(['anime', 'db', 'op', 'lego', 'sw', 'modelos'])
    expect(flat.map((i) => i.depth)).toEqual([0, 1, 1, 0, 1, 0])
    expect(flat[0].hasChildren).toBe(true)
  })

  it('oculta hijas de contraídas y de la arrastrada', () => {
    expect(ids(flattenVisible(rows, new Set(['anime'])))).toEqual(['anime', 'lego', 'sw', 'modelos'])
    expect(ids(flattenVisible(rows, new Set(), 'lego'))).toEqual(['anime', 'db', 'op', 'lego', 'modelos'])
  })
})

describe('getProjection', () => {
  const flat = flattenVisible(rows, new Set())

  it('arrastrar a la derecha bajo una raíz la vuelve subcategoría', () => {
    // "modelos" sobre "sw" (queda tras Star Wars, dentro de LEGO)
    expect(getProjection(flat, 'modelos', 'sw', INDENT, INDENT)).toEqual({ depth: 1, parentId: 'lego' })
  })

  it('sin desplazamiento horizontal conserva su nivel si es posible', () => {
    expect(getProjection(flat, 'op', 'sw', 0, INDENT)).toEqual({ depth: 1, parentId: 'lego' })
  })

  it('arrastrar a la izquierda saca a la subcategoría', () => {
    expect(getProjection(flat, 'sw', 'sw', -INDENT, INDENT)).toEqual({ depth: 0, parentId: null })
  })

  it('nunca pasa de 2 niveles', () => {
    expect(getProjection(flat, 'modelos', 'sw', INDENT * 5, INDENT)?.depth).toBe(1)
  })

  it('una raíz con hijas no puede volverse subcategoría', () => {
    const dragging = flattenVisible(rows, new Set(), 'lego')
    expect(getProjection(dragging, 'lego', 'op', INDENT, INDENT)).toEqual({ depth: 0, parentId: null })
  })

  it('la primera posición siempre es raíz', () => {
    expect(getProjection(flat, 'sw', 'anime', INDENT, INDENT)).toEqual({ depth: 0, parentId: null })
  })
})

describe('computeMoves', () => {
  it('mover entre padres reindexa hermanas nuevas y viejas', () => {
    const flat = flattenVisible(rows, new Set())
    const from = flat.findIndex((i) => i.row.id === 'op')
    const to = flat.findIndex((i) => i.row.id === 'sw')
    const order = moveItem(flat, from, to).map((i) => i.row.id)
    const moves = computeMoves(rows, order, 'op', 'lego')
    expect(moves).toEqual(
      expect.arrayContaining([
        { id: 'op', parentId: 'lego', position: 1 },
      ]),
    )
    // Star Wars no cambia (sigue en 0) y Dragon Ball tampoco: no se envían.
    expect(moves.map((m) => m.id)).toEqual(['op'])
  })

  it('reordenar raíces envía solo las que cambian', () => {
    const flat = flattenVisible(rows, new Set(), 'modelos')
    const order = moveItem(
      flat,
      flat.findIndex((i) => i.row.id === 'modelos'),
      0,
    ).map((i) => i.row.id)
    const moves = computeMoves(rows, order, 'modelos', null)
    expect(moves).toEqual([
      { id: 'modelos', parentId: null, position: 0 },
      { id: 'anime', parentId: null, position: 1 },
      { id: 'lego', parentId: null, position: 2 },
    ])
  })

  it('sacar una subcategoría a raíz reindexa a sus ex hermanas', () => {
    const order = ['anime', 'db', 'op', 'lego', 'sw', 'modelos'].filter((x) => x !== 'db')
    order.splice(2, 0, 'db') // queda entre op y lego como raíz
    const moves = computeMoves(rows, order, 'db', null)
    expect(moves).toEqual(
      expect.arrayContaining([
        { id: 'db', parentId: null, position: 1 },
        { id: 'lego', parentId: null, position: 2 },
        { id: 'modelos', parentId: null, position: 3 },
        { id: 'op', parentId: 'anime', position: 0 },
      ]),
    )
  })

  it('si el padre nuevo está contraído va al final de sus hijas', () => {
    const moves = computeMoves(rows, [], 'modelos', 'anime', new Set(['anime']))
    expect(moves).toContainEqual({ id: 'modelos', parentId: 'anime', position: 2 })
  })

  it('applyCategoryMoves aplica sin mutar', () => {
    const next = applyCategoryMoves(rows, [{ id: 'sw', parentId: null, position: 9 }])
    expect(next.find((r) => r.id === 'sw')).toMatchObject({ parentId: null, position: 9 })
    expect(rows.find((r) => r.id === 'sw')?.parentId).toBe('lego')
  })
})
