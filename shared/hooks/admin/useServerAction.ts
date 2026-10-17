// El hook vive en shared/hooks/useServerAction.ts: ya no es exclusivo del admin
// (lo usan también las páginas de cuenta). Se re-exporta aquí para no tocar
// los imports existentes.
export { useServerAction } from '@/shared/hooks/useServerAction'
