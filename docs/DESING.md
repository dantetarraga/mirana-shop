# MIRANA — Paleta Arc Reactor

### Sistema de color · Tema Neon

---

## ¿Qué es Arc Reactor?

Dirección de color inspirada en suits tecnológicos, Iron Man y Gundam.  
La premisa: **navy real en vez de negro**. Los fondos tienen una identidad cromática clara — azul profundo — lo que hace que los acentos cyan eléctrico respiren y la tienda sienta premium sin sentirse cueva.

---

## Tokens de color

```css
[data-theme='arc-reactor'] {
  /* ── FONDOS ── */
  --bg: #0b1830; /* Fondo principal · navy profundo */
  --surf: #0f1e3a; /* Superficies: nav, modales, drawers */
  --card: #122040; /* Cards de producto en reposo */
  --card-h: #182e55; /* Cards de producto en hover */

  /* ── BORDES ── */
  --bd: rgba(0, 200, 255, 0.12); /* Borde base · sutil */
  --bdh: rgba(0, 200, 255, 0.48); /* Borde en hover · encendido */

  /* ── ACENTO PRINCIPAL ── */
  --gold: #00c8ff; /* Cyan eléctrico · precios, CTAs, activos */
  --gl: #50e0ff; /* Cyan claro · hover de botones gold */
  --gd: rgba(0, 200, 255, 0.1); /* Cyan muy translúcido · fills suaves */

  /* ── TIPOGRAFÍA ── */
  --text: #e4f0ff; /* Texto principal */
  --mt: rgba(228, 240, 255, 0.42); /* Texto muted · categorías, labels */
  --sub: rgba(0, 200, 255, 0.06); /* Fill de hover en items de menú */

  /* ── ALIAS ── */
  --blue: #00c8ff; /* Mismo que --gold · compatibilidad */
}
```

---

## Escala de fondos

Los cuatro tonos de fondo forman una jerarquía Z — cada capa es visualmente más clara que la de abajo, creando profundidad sin sombras explícitas.

```
  ▓▓▓▓  --bg      #0b1830   Capa 0 · el suelo
  ▓▓▓░  --surf    #0f1e3a   Capa 1 · nav, sidebars, drawers
  ▓▓░░  --card    #122040   Capa 2 · cards y paneles
  ▓░░░  --card-h  #182e55   Capa 3 · estado hover/activo
```

---

## El efecto Glow (círculos de luz ambiental)

El glow son **gradientes radiales absolutos** colocados dentro de una sección con `position: relative`. No son elementos decorativos independientes — viven como capas CSS encima del fondo y debajo del contenido.

### Cómo funciona

```html
<section style="position: relative; background: var(--bg); overflow: hidden;">
  <!-- GLOW 1 · Polo derecho-superior (más brillante) -->
  <div
    style="
    position: absolute;
    top: 20%; right: 15%;
    width: 320px; height: 320px;
    background: radial-gradient(
      ellipse,
      rgba(0, 200, 255, 0.12),   /* cyan al 12% en el centro */
      transparent 70%             /* se desvanece al 70% del radio */
    );
    pointer-events: none;         /* no bloquea clics */
  "
  ></div>

  <!-- GLOW 2 · Polo izquierdo-inferior (más suave, crea balance) -->
  <div
    style="
    position: absolute;
    bottom: 10%; left: 20%;
    width: 220px; height: 220px;
    background: radial-gradient(
      ellipse,
      rgba(0, 130, 200, 0.08),   /* cyan más oscuro al 8% */
      transparent 70%
    );
    pointer-events: none;
  "
  ></div>

  <!-- Contenido real aquí -->
  <div style="position: relative; z-index: 1;">...</div>
</section>
```

### Parámetros del glow

| Parámetro       | Valor hero          | Valor card          | Descripción                         |
| --------------- | ------------------- | ------------------- | ----------------------------------- |
| Color           | `rgba(0,200,255,…)` | `rgba(0,200,255,…)` | Siempre el acento principal         |
| Opacidad centro | `0.12`              | `0.08`              | Hero más brillante, cards más suave |
| Tamaño          | `280–400px`         | `160–220px`         | Proporcional al contenedor          |
| Fade            | `70%`               | `70%`               | El gradiente muere al 70% del radio |
| Forma           | `ellipse`           | `ellipse`           | Más orgánico que `circle`           |

### Regla de composición

Siempre usar **dos glows por sección** en posiciones opuestas (ej. arriba-derecha + abajo-izquierda). Uno actúa como fuente de luz, el otro como rebote. Esto evita que la sección se vea plana o centrada.

```
  ┌──────────────────────────┐
  │              ·  ✦  ·    │  ← Glow primario (más opaco)
  │                          │
  │                          │
  │   ·  ✦  ·                │  ← Glow secundario (más suave)
  └──────────────────────────┘
```

---

## Bordes activos vs. en reposo

Los bordes son la forma principal de comunicar estado en Arc Reactor.

```css
/* En reposo — casi invisible */
border: 1px solid rgba(0, 200, 255, 0.12);

/* En hover — encendido */
border: 1px solid rgba(0, 200, 255, 0.48);

/* Foco (inputs, campos) */
border-color: var(--gold); /* #00c8ff sólido */
```

---

## Uso del acento `--gold` (#00c8ff)

El token `--gold` hereda su nombre del sistema de diseño base (donde era dorado). En Arc Reactor su valor es **cyan eléctrico**. Se usa en:

- Precios de producto
- Botones primarios (fondo)
- Texto activo en nav y filtros
- Badges (NUEVO, BESTSELLER, etc.)
- Avatares de usuario
- Puntos de rating (estrellas)
- Bordes en foco

---

## Tipografía sobre Arc Reactor

| Token    | Color                   | Uso                              |
| -------- | ----------------------- | -------------------------------- |
| `--text` | `#e4f0ff`               | Cuerpo, títulos, nombres         |
| `--mt`   | `rgba(228,240,255,.42)` | Labels, categorías, nav links    |
| `--gold` | `#00c8ff`               | Precios, CTAs, elementos activos |

El tinte azulado de `--text` (`#e4f0ff` vs. blanco puro `#ffffff`) armoniza con los fondos navy. Blanco puro generaría demasiado contraste y se sentiría fuera de tono.

---

## Stripe helpers (texturas de tarjetas)

Las imágenes de producto usan un patrón de rayas diagonales. Para armonizar con Arc Reactor, actualizar los colores base:

```css
/* Figuras — azul-navy */
.stripe-fig {
  background: repeating-linear-gradient(45deg, #162840 0, #162840 9px, #1b3050 9px, #1b3050 18px);
}

/* LEGO — teal oscuro */
.stripe-lego {
  background: repeating-linear-gradient(45deg, #102028 0, #102028 9px, #142830 9px, #142830 18px);
}

/* Vehículos — navy cálido */
.stripe-veh {
  background: repeating-linear-gradient(45deg, #182035 0, #182035 9px, #1e2840 9px, #1e2840 18px);
}
```

---

## Swatches completos

```
#0b1830  ████  bg         Fondo principal
#0f1e3a  ████  surf       Superficies elevadas
#122040  ████  card       Cards en reposo
#182e55  ████  card-h     Cards en hover
#00c8ff  ████  acento     Cyan eléctrico
#50e0ff  ████  acento-l   Cyan claro (hover)
#e4f0ff  ████  text       Texto principal
```

---

_Mirana Design Docs · Paleta 01 Arc Reactor_
