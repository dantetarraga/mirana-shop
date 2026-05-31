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
import {
  createCollection,
  updateCollection,
} from "@/features/collections/actions/collection.actions";
import type { CollectionRow } from "@/modules/catalog/repositories/collection.repo";

// ---------------------------------------------------------------------------
// Schema del formulario
// ---------------------------------------------------------------------------

const formSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
  slug: z
    .string()
    .min(1, "Slug requerido")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  active: z.boolean().default(true),
});

// z.input captura los tipos antes de aplicar .default() — compatible con useForm generic
type FormValues = z.input<typeof formSchema>;

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

interface CollectionCrudDrawerProps {
  collection: CollectionRow | null;
  isNew: boolean;
  onClose: () => void;
}

export function CollectionCrudDrawer({
  collection,
  isNew,
  onClose,
}: CollectionCrudDrawerProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      active: true,
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
    if (collection) {
      reset({
        name: collection.name,
        slug: collection.slug,
        description: collection.description ?? "",
        imageUrl: collection.imageUrl ?? "",
        active: collection.active,
      });
    } else {
      reset({ name: "", slug: "", description: "", imageUrl: "", active: true });
    }
  }, [collection, reset]);

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const payload = {
        ...data,
        active: data.active ?? true,
        ...(collection && { id: collection.id }),
      };

      const result = collection
        ? await updateCollection(payload)
        : await createCollection(payload);

      if (result.success) {
        toast.success(isNew ? "Colección creada" : "Colección actualizada");
        onClose();
        window.location.reload();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <AdminDrawer
      title={isNew ? "Nueva colección" : (collection?.name ?? "Colección")}
      sub={isNew ? "Crear colección" : "Editar colección"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4.5">
        <FormField label="Nombre" error={errors.name?.message}>
          <input
            {...register("name")}
            className={cls.input}
            placeholder="Bestsellers 2025"
          />
        </FormField>

        <FormField label="Slug (URL)" error={errors.slug?.message}>
          <input
            {...register("slug")}
            className={cls.input}
            placeholder="bestsellers-2025"
          />
        </FormField>

        <FormField label="Descripción" error={errors.description?.message}>
          <textarea
            {...register("description")}
            className={cls.input}
            rows={3}
            placeholder="Descripción de la colección..."
          />
        </FormField>

        <FormField label="URL de imagen" error={errors.imageUrl?.message}>
          <input
            {...register("imageUrl")}
            className={cls.input}
            placeholder="https://..."
          />
        </FormField>

        <FormField label="Estado" error={errors.active?.message}>
          <select
            {...register("active", {
              setValueAs: (v) => v === "true" || v === true,
            })}
            className={cls.input}
          >
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </select>
        </FormField>

        <div className="flex gap-2.5 pt-1">
          <Button type="submit" variant="accent" size="md" full disabled={isPending}>
            {isPending ? "Guardando..." : isNew ? "Crear colección" : "Guardar cambios"}
          </Button>
          <Button type="button" variant="outline" size="md" full onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </AdminDrawer>
  );
}
