import { redirect } from 'next/navigation'

// /cuenta no tiene contenido propio: antes daba 404. La entrada natural del
// área de cuenta es el historial de pedidos.
export default function CuentaPage() {
  redirect('/cuenta/pedidos')
}
