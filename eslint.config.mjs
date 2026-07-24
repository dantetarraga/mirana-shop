import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next ya registra el plugin jsx-a11y pero solo con un
  // subconjunto de reglas. Activamos aquí, como WARNING, las reglas de mayor
  // valor que faltaban — las que detectan interacciones sin teclado, labels
  // sueltos y anchors inválidos. No se re-declara el plugin (tira "Cannot
  // redefine plugin") ni se sube a error: son guía para no meter regresiones,
  // sin bloquear el build por deuda preexistente de admin. Se omite el resto
  // del set recomendado (label-has-for está deprecado; control-has-associated-
  // label es muy ruidoso) para mantener alta la señal.
  {
    rules: {
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
    },
  },
  prettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
