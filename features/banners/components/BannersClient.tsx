"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight, Plus } from "lucide-react";
import { AdminDrawer } from "@/shared/components/AdminDrawer";
import { PanelHeader } from "@/shared/components/PanelHeader";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { FormField } from "@/shared/components/ui/FormField";
import { cls } from "@/shared/lib/admin-classes";
import { BANNER_STATUS } from "@/shared/lib/admin-constants";
import { bannerDbSchema, type BannerDbInput } from "@/shared/lib/schemas";
import {
  saveBanner,
  toggleBanner,
  deleteBanner,
} from "@/features/banners/actions/banner.actions";
import type { BannerRow } from "@/modules/catalog/repositories/banner.repo";

// ---------------------------------------------------------------------------
// Mapeo de estado BD -> estado UI
// ---------------------------------------------------------------------------

function getBannerStatus(banner: BannerRow): "activo" | "programado" | "inactivo" {
  const now = new Date();
  if (!banner.active) return "inactivo";
  if (banner.startsAt && banner.startsAt > now) return "programado";
  return "activo";
}

// ---------------------------------------------------------------------------
// Form por defecto
// ---------------------------------------------------------------------------

const EMPTY_FORM: BannerDbInput = {
  title: "",
  subtitle: "",
  ctaLabel: "",
  ctaHref: "",
  imageUrl: "https://placehold.co/1200x400/111111/FFFFFF?text=Banner",
  position: 0,
  active: false,
};

interface BannersClientProps {
  initialBanners: BannerRow[];
}

export function BannersClient({ initialBanners }: BannersClientProps) {
  const [banners, setBanners] = useState<BannerRow[]>(initialBanners);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<BannerDbInput>({
    resolver: zodResolver(bannerDbSchema),
    defaultValues: EMPTY_FORM,
  });
  const { register, handleSubmit, reset, formState: { errors } } = form;

  const editingBanner = banners.find((b) => b.id === editingId) ?? null;

  useEffect(() => {
    if (editingBanner) {
      reset({
        title: editingBanner.title,
        subtitle: editingBanner.subtitle ?? "",
        ctaLabel: editingBanner.ctaLabel ?? "",
        ctaHref: editingBanner.ctaHref ?? "",
        imageUrl: editingBanner.imageUrl,
        position: editingBanner.position,
        active: editingBanner.active,
      });
    } else if (isNew) {
      reset(EMPTY_FORM);
    }
  }, [editingBanner, isNew, reset]);

  const closeDrawer = () => {
    setEditingId(null);
    setIsNew(false);
    reset(EMPTY_FORM);
  };

  const onSubmit = (data: BannerDbInput) => {
    startTransition(async () => {
      const result = await saveBanner(editingId, data);
      if (result.success) {
        toast.success(isNew ? "Banner creado" : "Banner actualizado");
        closeDrawer();
        window.location.reload();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleToggle = (b: BannerRow) => {
    startTransition(async () => {
      const result = await toggleBanner(b.id, b.active);
      if (result.success) {
        setBanners((prev) =>
          prev.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x))
        );
        toast.success(b.active ? `"${b.title}" pausado` : `"${b.title}" activado`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = (b: BannerRow) => {
    if (!confirm(`¿Eliminar "${b.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteBanner(b.id);
      if (result.success) {
        setBanners((prev) => prev.filter((x) => x.id !== b.id));
        toast.success(`"${b.title}" eliminado`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const activeCount = banners.filter((b) => getBannerStatus(b) === "activo").length;
  const drawerOpen = isNew || editingId !== null;

  return (
    <div className="px-8 pt-7 pb-12">
      <PanelHeader
        label="Marketing"
        title={`${activeCount} banner${activeCount !== 1 ? "s" : ""} activo${activeCount !== 1 ? "s" : ""}`}
        align="center"
        side={
          <Button
            variant="accent"
            size="md"
            onClick={() => {
              setEditingId(null);
              setIsNew(true);
            }}
          >
            <Plus className="mr-2" /> Nuevo banner
          </Button>
        }
      />

      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
        {banners.map((b) => {
          const uiStatus = getBannerStatus(b);
          return (
            <div key={b.id} className="overflow-hidden bg-card border border-(--bd)">
              <div className="h-37.5 relative">
                <div className="stripe-fig absolute inset-0" />
                <div className="absolute inset-0 flex flex-col justify-center pl-6 bg-linear-to-r from-black/55 to-black/15">
                  <div className="font-display text-[26px] font-black uppercase leading-[0.95]">
                    {b.title}
                  </div>
                  <div className="text-[12px] mt-1 text-white/80">{b.subtitle}</div>
                  {b.ctaLabel && (
                    <div className="font-display font-extrabold text-[12px] tracking-[1px] uppercase px-3 py-1.25 mt-2.5 w-fit bg-(--gold) text-black">
                      {b.ctaLabel} <ArrowRight className="inline-block ml-1" />
                    </div>
                  )}
                </div>
                <span className="absolute top-3 right-3 bg-black/60">
                  <StatusBadge config={BANNER_STATUS[uiStatus]} variant="filled" />
                </span>
              </div>

              <div className="px-4.5 py-4">
                <div className="flex justify-between py-1.5 text-[13px]">
                  <span className="text-[11px] tracking-[1px] uppercase text-muted">
                    Posición
                  </span>
                  <span className="font-semibold">{b.position}</span>
                </div>
                {b.ctaHref && (
                  <div className="flex justify-between py-1.5 text-[13px]">
                    <span className="text-[11px] tracking-[1px] uppercase text-muted">
                      Enlace
                    </span>
                    <span className="font-mono text-[11px] truncate max-w-[160px]">
                      {b.ctaHref}
                    </span>
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    full
                    onClick={() => {
                      setIsNew(false);
                      setEditingId(b.id);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    full
                    onClick={() => handleToggle(b)}
                    disabled={isPending}
                  >
                    {b.active ? "Pausar" : "Activar"}
                  </Button>
                  <Button
                    variant="icon"
                    size="sm"
                    destructive
                    onClick={() => handleDelete(b)}
                    disabled={isPending}
                  >
                    ×
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {drawerOpen && (
        <AdminDrawer
          title={isNew ? "Nuevo banner" : (editingBanner?.title ?? "Banner")}
          sub={isNew ? "Crear banner" : "Editar banner"}
          onClose={closeDrawer}
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4.5"
          >
            <FormField label="Título" error={errors.title?.message}>
              <input
                {...register("title")}
                className={cls.input}
                placeholder="Título del banner"
              />
            </FormField>

            <FormField label="Subtítulo" error={errors.subtitle?.message}>
              <input
                {...register("subtitle")}
                className={cls.input}
                placeholder="Descripción breve..."
              />
            </FormField>

            <FormField label="URL de imagen" error={errors.imageUrl?.message}>
              <input
                {...register("imageUrl")}
                className={cls.input}
                placeholder="https://..."
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3.5">
              <FormField label="Texto botón" error={errors.ctaLabel?.message}>
                <input
                  {...register("ctaLabel")}
                  className={cls.input}
                  placeholder="Ver colección"
                />
              </FormField>

              <FormField label="URL botón" error={errors.ctaHref?.message}>
                <input
                  {...register("ctaHref")}
                  className={cls.input}
                  placeholder="/catalogo"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <FormField label="Posición (orden)" error={errors.position?.message}>
                <input
                  {...register("position", { valueAsNumber: true })}
                  type="number"
                  min="0"
                  className={cls.input}
                  placeholder="0"
                />
              </FormField>

              <FormField label="Estado" error={errors.active?.message}>
                <select
                  {...register("active", {
                    setValueAs: (v) => v === "true" || v === true,
                  })}
                  className={cls.input}
                >
                  <option value="false">Inactivo</option>
                  <option value="true">Activo</option>
                </select>
              </FormField>
            </div>

            <div className="flex gap-2.5">
              <Button
                type="submit"
                variant="accent"
                size="md"
                full
                disabled={isPending}
              >
                {isPending ? "Guardando..." : "Guardar banner"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                full
                onClick={closeDrawer}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </AdminDrawer>
      )}
    </div>
  );
}
