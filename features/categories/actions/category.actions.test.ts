import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createCategory,
  deleteCategory,
  reassignProductCategory,
  reorderCategories,
  updateCategory,
} from './category.actions'

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  productFindFirst: vi.fn(),
  productUpdate: vi.fn(),
  transaction: vi.fn(),
  findCategoryById: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/shared/lib/db', () => ({
  db: {
    $transaction: mocks.transaction,
    category: {
      findMany: mocks.findMany,
      findFirst: mocks.findFirst,
      findUnique: mocks.findUnique,
      count: mocks.count,
      create: mocks.create,
      update: mocks.update,
    },
    product: { findFirst: mocks.productFindFirst, update: mocks.productUpdate },
  },
}))
vi.mock('@/shared/lib/require-admin', () => ({ requireAdmin: vi.fn().mockResolvedValue(null) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('@/features/categories/queries/category.queries', () => ({
  findCategoryById: mocks.findCategoryById,
}))
vi.mock('@/features/products/queries/drawer-product.queries', () => ({
  findDrawerProducts: vi.fn().mockResolvedValue([]),
}))

const tree = [
  { id: 'lego', name: 'LEGO', slug: 'lego', parentId: null, position: 0 },
  { id: 'sw', name: 'Star Wars', slug: 'lego-star-wars', parentId: 'lego', position: 0 },
  { id: 'anime', name: 'Anime', slug: 'anime', parentId: null, position: 1 },
]

beforeEach(() => {
  vi.clearAllMocks()
  mocks.findMany.mockResolvedValue(tree)
  mocks.findUnique.mockResolvedValue(null)
  mocks.findFirst.mockResolvedValue(null)
  mocks.create.mockResolvedValue({ id: 'nueva' })
  mocks.update.mockResolvedValue({ id: 'x' })
  mocks.transaction.mockResolvedValue([])
})

describe('createCategory', () => {
  it('rechaza un tercer nivel', async () => {
    const result = await createCategory({ name: 'Naves', slug: 'naves', parentId: 'sw' })
    expect(result).toMatchObject({ success: false, code: 422 })
    expect(!result.success && result.error).toMatch(/ya es una subcategoría/)
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('rechaza un padre en la papelera o inexistente', async () => {
    const result = await createCategory({ name: 'X', slug: 'x', parentId: 'borrada' })
    expect(!result.success && result.error).toMatch(/papelera/)
  })

  it('rechaza nombre repetido entre raíces (el índice no lo cubre en MariaDB)', async () => {
    mocks.findFirst.mockResolvedValue({ name: 'LEGO', deletedAt: null, parent: null })
    const result = await createCategory({ name: 'Lego', slug: 'lego-2' })
    expect(result).toMatchObject({ success: false, code: 409 })
  })

  it('una subcategoría nueva nunca entra al menú y va al final', async () => {
    await createCategory({ name: 'Technic', slug: 'lego-technic', parentId: 'lego', showInMenu: true })
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ parentId: 'lego', showInMenu: false, position: 1 }),
      }),
    )
  })

  it('traduce el P2002 de Prisma sin filtrar el mensaje crudo', async () => {
    mocks.create.mockRejectedValue(
      Object.assign(new Error('Unique constraint failed on Category_parentId_name_key'), { code: 'P2002' }),
    )
    const result = await createCategory({ name: 'Nueva', slug: 'nueva' })
    expect(result).toMatchObject({ success: false, code: 409 })
    expect(!result.success && result.error).not.toMatch(/constraint/i)
  })
})

describe('updateCategory', () => {
  it('no permite colgarla de su propia subcategoría', async () => {
    const result = await updateCategory({ id: 'lego', parentId: 'sw' })
    expect(result).toMatchObject({ success: false, code: 422 })
  })

  it('una raíz con hijas no puede volverse subcategoría', async () => {
    const result = await updateCategory({ id: 'lego', parentId: 'anime' })
    expect(!result.success && result.error).toMatch(/tiene subcategorías/)
  })
})

describe('reorderCategories', () => {
  it('valida el árbol resultante y no guarda si hay ciclo', async () => {
    const result = await reorderCategories([
      { id: 'lego', parentId: 'sw', position: 0 },
    ])
    expect(result.success).toBe(false)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('guarda en una transacción y saca del menú a la que pasa a subcategoría', async () => {
    const result = await reorderCategories([{ id: 'anime', parentId: 'lego', position: 1 }])
    expect(result.success).toBe(true)
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'anime' },
      data: { parentId: 'lego', position: 1, showInMenu: false },
    })
  })

  it('rechaza ids que ya no existen', async () => {
    const result = await reorderCategories([{ id: 'fantasma', parentId: null, position: 0 }])
    expect(result).toMatchObject({ success: false, code: 409 })
  })
})

describe('deleteCategory', () => {
  it('bloquea un padre con subcategorías vivas', async () => {
    mocks.findCategoryById.mockResolvedValue({ id: 'lego', productCount: 0 })
    mocks.count.mockResolvedValue(3)
    const result = await deleteCategory('lego')
    expect(result).toMatchObject({ success: false, code: 422 })
    expect(!result.success && result.error).toBe('Mueve o elimina sus 3 subcategorías primero')
    expect(mocks.update).not.toHaveBeenCalled()
  })
})

describe('reassignProductCategory', () => {
  it('no reasigna a una categoría en la papelera', async () => {
    mocks.productFindFirst.mockResolvedValue({ id: 'p' })
    mocks.findFirst.mockResolvedValue({ name: 'Vieja', deletedAt: new Date() })
    const result = await reassignProductCategory('p', 'vieja')
    expect(!result.success && result.error).toMatch(/"Vieja" está en la papelera/)
    expect(mocks.productUpdate).not.toHaveBeenCalled()
  })
})
