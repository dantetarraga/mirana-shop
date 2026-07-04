import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'

export interface Column<T> {
  header: string
  headerClassName?: string
  className?: string
  render: (row: T) => React.ReactNode
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string | number
  onRowClick?: (row: T) => void
  /** Omite el div wrapper con cls.panelTable. Usar cuando la tabla vive dentro de un cls.panel existente. */
  noWrapper?: boolean
}

export function AdminTable<T>({ columns, data, keyExtractor, onRowClick, noWrapper }: Props<T>) {
  const table = (
    <table className="w-full min-w-max border-collapse">
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i} className={cn(cls.th, 'whitespace-nowrap', col.headerClassName)}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr
            key={keyExtractor(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={onRowClick ? 'cursor-pointer' : undefined}
          >
            {columns.map((col, i) => (
              <td key={i} className={cn(cls.td, col.className)}>
                {col.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )

  // Contenedor con scroll horizontal: en mobile/tablet la tabla puede exceder
  // el ancho de pantalla (muchas columnas) — se prefiere scroll contenido
  // antes que comprimir columnas ilegibles o desbordar el layout de la página.
  const scrollable = <div className="overflow-x-auto">{table}</div>

  if (noWrapper) return scrollable
  return <div className={cls.panelTable}>{scrollable}</div>
}
