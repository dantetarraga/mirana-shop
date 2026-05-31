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
import { createBrand, updateBrand } from "@/features/brands/actions/brand.actions";
import type { BrandRow } from "@/modules/catalog/repositories/brand.repo";

// ---------------------------------------------------------------------------
// Schema del formulario
// ---------------------------------------------------------------------------

const formSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
  slug: z
    .string()
    .min(1, "Slug requerido")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  logoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
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

interface BrandCrudDrawerProps {
  /** null = crear nuevo */
  brand: BrandRow | null;
  isNew: boolean;
  onClose: () => void;
}

export function BrandCrudDrawer({ brand, isNew, onClose }: BrandCrudDrawerProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      logoUrl: "",
    },
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = form;

  const nameValue = watch("name");

  // Auto-slug cuando el nombre cambia y se está creando
  useEffect(() => {
    if (isNew && nameValue) {
      setValue("slug", toSlug(nameValue), { shouldValidate: false });
    }
  }, [isNew, nameValue, setValue]);

  // Prellenar formulario con datos del brand a editar
  useEffect(() => {
    if (brand) {
      reset({
        name: brand.name,
        slug: brand.slug,
        description: brand.description ?? "",
        imageUrl: brand.imageUrl ?? "",
        logoUrl: brand.logoUrl ?? "",
      });
    } else {
      reset({ name: "", slug: "", description: "", imageUrl: "", logoUrl: "" });
    }
  }, [brand, reset]);

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const payload = {
        ...data,
        ...(brand && { id: brand.id }),
      };

      const result = brand
        ? await updateBrand(payload)
        : await createBrand(payload);

      if (result.success) {
        toast.success(isNew ? "Marca creada" : "Marca actualizada");
        onClose();
        // Recarga la página para reflejar los cambios del Server Component
        window.location.reload();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <AdminDrawer
      title={isNew ? "Nueva marca" : (brand?.name ?? "Marca")}
      sub={isNew ? "Crear marca" : "Editar marca"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4.5">
        <FormField label="Nombre" error={errors.name?.message}>
          <input
            {...register("name")}
            className={cls.input}
            placeholder="LEGO Group"
          />
        </FormField>

        <FormField label="Slug (URL)" error={errors.slug?.message}>
          <input
            {...register("slug")}
            className={cls.input}
            placeholder="lego-group"
          />
        </FormField>

        <FormField label="Descripción" error={errors.description?.message}>
          <textarea
            {...register("description")}
            className={cls.input}
            rows={3}
            placeholder="Descripción de la marca..."
          />
        </FormField>

        <FormField label="URL de imagen (banner/perfil)" error={errors.imageUrl?.message}>
          <input
            {...register("imageUrl")}
            className={cls.input}
            placeholder="https://..."
          />
        </FormField>

        <FormField label="URL de logo" error={errors.logoUrl?.message}>
          <input
            {...register("logoUrl")}
            className={cls.input}
            placeholder="https://..."
          />
        </FormField>

        <div className="flex gap-2.5 pt-1">
          <Button type="submit" variant="accent" size="md" full disabled={isPending}>
            {isPending ? "Guardando..." : isNew ? "Crear marca" : "Guardar cambios"}
          </Button>
          <Button type="button" variant="outline" size="md" full onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </AdminDrawer>
  );
}
