import { PrismaClient, ProductStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ---------------------------------------------------------------------------
  // Admin user
  // ---------------------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@mirana.com" },
    update: {},
    create: {
      email: "admin@mirana.com",
      name: "Admin Mirana",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`Admin user: ${admin.email}`);

  // ---------------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------------
  const catFiguras = await prisma.category.upsert({
    where: { slug: "figuras-de-accion" },
    update: {},
    create: {
      name: "Figuras de Acción",
      slug: "figuras-de-accion",
    },
  });

  const catLego = await prisma.category.upsert({
    where: { slug: "sets-lego" },
    update: {},
    create: {
      name: "Sets LEGO",
      slug: "sets-lego",
    },
  });

  console.log(`Categories: ${catFiguras.name}, ${catLego.name}`);

  // ---------------------------------------------------------------------------
  // Brands
  // ---------------------------------------------------------------------------
  const brandBandai = await prisma.brand.upsert({
    where: { slug: "bandai" },
    update: {},
    create: {
      name: "Bandai",
      slug: "bandai",
    },
  });

  const brandLego = await prisma.brand.upsert({
    where: { slug: "lego-group" },
    update: {},
    create: {
      name: "LEGO Group",
      slug: "lego-group",
    },
  });

  console.log(`Brands: ${brandBandai.name}, ${brandLego.name}`);

  // ---------------------------------------------------------------------------
  // Products
  // ---------------------------------------------------------------------------

  // Producto 1: Dragon Ball
  const p1 = await prisma.product.upsert({
    where: { sku: "BND-DBZ-GOKU-001" },
    update: {},
    create: {
      sku: "BND-DBZ-GOKU-001",
      slug: "son-goku-super-saiyan-dragon-ball-z-bandai",
      name: "Son Goku Super Saiyan — Dragon Ball Z",
      description:
        "Figura articulada de Son Goku en forma Super Saiyan. Escala 1:10. Incluye accesorios de energía. Fabricada por Bandai Spirits.",
      price: 249.9,
      compareAtPrice: 299.9,
      currency: "PEN",
      status: ProductStatus.AVAILABLE,
      featured: true,
      categoryId: catFiguras.id,
      brandId: brandBandai.id,
      images: {
        create: [
          {
            url: "https://placehold.co/800x800?text=Goku+SS",
            alt: "Son Goku Super Saiyan frente",
            position: 0,
          },
          {
            url: "https://placehold.co/800x800?text=Goku+SS+Back",
            alt: "Son Goku Super Saiyan reverso",
            position: 1,
          },
        ],
      },
      inventory: {
        create: {
          availableStock: 15,
          reservedStock: 0,
          lowStockThreshold: 3,
        },
      },
    },
  });

  // Producto 2: Evangelion
  const p2 = await prisma.product.upsert({
    where: { sku: "BND-EVA-UNIT01-001" },
    update: {},
    create: {
      sku: "BND-EVA-UNIT01-001",
      slug: "evangelion-unit-01-neon-genesis-bandai-robot-spirits",
      name: "Evangelion Unit-01 — Neon Genesis Evangelion",
      description:
        "Robot Spirits figura del Evangelion Unit-01 de la serie Neon Genesis Evangelion. Alta fidelidad de detalle, múltiples puntos de articulación. Incluye lanza de Longinus.",
      price: 389.9,
      currency: "PEN",
      status: ProductStatus.AVAILABLE,
      featured: true,
      categoryId: catFiguras.id,
      brandId: brandBandai.id,
      images: {
        create: [
          {
            url: "https://placehold.co/800x800?text=EVA+Unit+01",
            alt: "Evangelion Unit-01 frente",
            position: 0,
          },
        ],
      },
      inventory: {
        create: {
          availableStock: 8,
          reservedStock: 0,
          lowStockThreshold: 2,
        },
      },
    },
  });

  // Producto 3: LEGO Star Wars
  const p3 = await prisma.product.upsert({
    where: { sku: "LGO-SW-FALCON-001" },
    update: {},
    create: {
      sku: "LGO-SW-FALCON-001",
      slug: "millennium-falcon-lego-star-wars-75375",
      name: "Millennium Falcon — LEGO Star Wars 75375",
      description:
        "Construye el mítico Halcón Milenario de Star Wars con este set LEGO de 921 piezas. Incluye 7 minifiguras: Han Solo, Chewbacca, Leia, Luke Skywalker, R2-D2, C-3PO y Finn.",
      price: 599.9,
      compareAtPrice: 699.9,
      currency: "PEN",
      status: ProductStatus.AVAILABLE,
      featured: false,
      categoryId: catLego.id,
      brandId: brandLego.id,
      images: {
        create: [
          {
            url: "https://placehold.co/800x800?text=LEGO+Falcon",
            alt: "Millennium Falcon LEGO",
            position: 0,
          },
        ],
      },
      inventory: {
        create: {
          availableStock: 5,
          reservedStock: 0,
          lowStockThreshold: 2,
        },
      },
    },
  });

  // Producto 4: LEGO Technic (coming soon)
  const p4 = await prisma.product.upsert({
    where: { sku: "LGO-TCH-BUGATTI-001" },
    update: {},
    create: {
      sku: "LGO-TCH-BUGATTI-001",
      slug: "bugatti-bolide-lego-technic-42151",
      name: "Bugatti Bolide — LEGO Technic 42151",
      description:
        "Replica del Bugatti Bolide con 905 piezas. Motor funcional con movimiento de pistones. Colores azul y negro inspirados en el vehículo real.",
      price: 449.9,
      currency: "PEN",
      status: ProductStatus.COMING_SOON,
      featured: false,
      categoryId: catLego.id,
      brandId: brandLego.id,
      images: {
        create: [
          {
            url: "https://placehold.co/800x800?text=LEGO+Bugatti",
            alt: "Bugatti Bolide LEGO Technic",
            position: 0,
          },
        ],
      },
      inventory: {
        create: {
          availableStock: 0,
          reservedStock: 0,
          lowStockThreshold: 3,
        },
      },
    },
  });

  console.log(
    `Products: ${p1.name}, ${p2.name}, ${p3.name}, ${p4.name}`
  );

  // ---------------------------------------------------------------------------
  // Banner
  // ---------------------------------------------------------------------------
  const banner = await prisma.banner.upsert({
    where: { id: "seed-banner-hero-01" },
    update: {},
    create: {
      id: "seed-banner-hero-01",
      title: "Colección Verano 2025",
      subtitle: "Figuras exclusivas de Dragon Ball, Evangelion y más",
      imageUrl: "https://placehold.co/1920x600?text=Mirana+Shop+Banner",
      ctaLabel: "Ver colección",
      ctaHref: "/productos",
      position: 0,
      active: true,
    },
  });

  console.log(`Banner: ${banner.title}`);
  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
