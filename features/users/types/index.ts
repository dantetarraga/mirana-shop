export type UserSegment = 'todos' | 'vip' | 'activo' | 'nuevo'

export type UserRow = {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'CUSTOMER'
  createdAt: Date
  deletedAt: Date | null
  _count: { orders: number }
}

export type UserFilters = {
  search?: string
  segment?: UserSegment
  take?: number
  skip?: number
}
