"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AdminDrawer } from "@/shared/components/AdminDrawer";
import { Button } from "@/shared/components/ui/Button";
import { FormField } from "@/shared/components/ui/FormField";
import { cls } from "@/shared/lib/admin-classes";
import { createCategory, updateCategory } from "@/features/categories/actions/category.actions";
import type { CategoryRow } from "@/modules/catalog/repositories/category.repo";

// ---------------------------------------------------------------------------
// Schema del formulario
// ---------------------------------------------------------------------------

const formSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
  slug: z
    .string()
    .min(1, "Slug requerido")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  parentId: z.string().optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CategoryCrudDrawerProps {
  category: CategoryRow | null;
  isNew: boolean;
  /** Lista de categorías disponibles para seleccionar como padre */
  allCategories: CategoryRow[];
  onClose: () => void;
}

export function CategoryCrudDrawer({
  category,
  isNew,
  allCategories,
  onClose,
}: CategoryCrudDrawerProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      parentId: "",
      description: "",
      imageUrl: "",
    },
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = form;
  const nameValue = watch("name");

  // Auto-slug al crear
  useEffect(() => {
    if (isNew && nameValue) {
      setValue("slug", toSlug(nameValue), { shouldValidate: false });
    }
  }, [isNew, nameValue, setValue]);

  // Prellenar al editar
  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        slug: category.slug,
        parentId: category.parentId ?? "",
        description: category.description ?? "",
        imageUrl: category.imageUrl ?? "",
      });
    } else {
      reset({ name: "", slug: "", parentId: "", description: "", imageUrl: "" });
    }
  }, [category, reset]);

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const payload = {
        ...data,
        parentId: data.parentId || undefined,
        ...(category && { id: category.id }),
      };

      const result = category
        ? await updateCategory(payload)
        : await createCategory(payload);

      if (result.success) {
        toast.success(isNew ? "Categoría creada" : "Categoría actualizada");
        onClose();
        window.location.reload();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Filtra la categoría actual para que no sea su propio padre
  const parentOptions = allCategories.filter((c) => c.id !== category?.id);

  return (
    <AdminDrawer
      title={isNew ? "Nueva categoría" : (category?.name ?? "Categoría")}
      sub={isNew ? "Crear categoría" : "Editar categoría"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4.5">
        <FormField label="Nombre" error={errors.name?.message}>
          <input
            {...register("name")}
            className={cls.input}
            placeholder="Figuras de Acción"
          />
        </FormField>

        <FormField label="Slug (URL)" error={errors.slug?.message}>
          <input
            {...register("slug")}
            className={cls.input}
            placeholder="figuras-accion"
          />
        </FormField>

        <FormField label="Categoría padre (opcional)" error={errors.parentId?.message}>
          <select {...register("parentId")} className={cls.input}>
            <option value="">Sin categoría padre</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Descripción" error={errors.description?.message}>
          <textarea
            {...register("description")}
            className={cls.input}
            rows={3}
            placeholder="Descripción de la categoría..."
          />
        </FormField>

        <FormField label="URL de imagen" error={errors.imageUrl?.message}>
          <input
            {...register("imageUrl")}
            className={cls.input}
            placeholder="https://..."
          />
        </FormField>

        <div className="flex gap-2.5 pt-1">
          <Button type="submit" variant="accent" size="md" full disabled={isPending}>
            {isPending ? "Guardando..." : isNew ? "Crear categoría" : "Guardar cambios"}
          </Button>
          <Button type="button" variant="outline" size="md" full onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </AdminDrawer>
  );
}
