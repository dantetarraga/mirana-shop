// Cookie con la que el visitante cierra la barra de promociones. La lee el
// servidor (PromoAnnouncementBar) para no pintar la barra ni reservar su alto:
// así no hay salto de layout y no hace falta un <script> antes del primer
// pintado (React no ejecuta scripts que renderiza un componente).
export const PROMO_BAR_COOKIE = 'mirana_promo_dismissed'
export const PROMO_BAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 días
