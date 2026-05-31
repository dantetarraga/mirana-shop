---
name: feedback-zod-v4-rhf
description: Patrón correcto para Zod v4 + react-hook-form en este proyecto — usar z.input<> para el generic de useForm
metadata:
  type: feedback
---

En Zod v4 (^4.4.3) + @hookform/resolvers (^5.4.0), usar `z.infer<typeof schema>` como generic de `useForm<T>` causa error de TypeScript porque Zod v4 distingue Input (con campos .default() como opcionales) y Output (con defaults aplicados).

**Regla:** Siempre usar `z.input<typeof schema>` para el generic de `useForm`. El `onSubmit` recibe el tipo Input, y los campos con `.default()` pueden ser `undefined` en el tipo pero zodResolver garantiza que tienen valor al llegar al callback.

```typescript
type FormValues = z.input<typeof mySchema>;
const form = useForm<FormValues>({ resolver: zodResolver(mySchema) });
const onSubmit = (data: FormValues) => {
  const val = data.fieldWithDefault ?? defaultValue; // necesario para campos .default()
};
```

**Why:** Zod v4 rompe la compatibilidad de tipos con @hookform/resolvers cuando se usa z.infer (que es Output). El error de TypeScript es "Resolver<Input, any, Output> no es asignable a Resolver<Output, any, Output>".

**How to apply:** En cualquier componente que use `zodResolver` con un schema que tenga `.default()`, `.optional()` con default, etc. — siempre pasar `z.input<typeof schema>` al generic de `useForm`.
