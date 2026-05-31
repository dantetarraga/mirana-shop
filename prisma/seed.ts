import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, ProductStatus, OrderStatus, PaymentStatus, PaymentMethod, InventoryMovementType } from '../generated/prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // ── Admin user ─────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mirana.com' },
    update: {},
    create: {
      email: 'admin@mirana.com',
      name: 'Admin Mirana',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  })

  // ── Customer user (para las órdenes de seed) ───────────────────────────────
  const customer = await prisma.user.upsert({
    where: { email: 'cliente@example.com' },
    update: {},
    create: {
      email: 'cliente@example.com',
      name: 'Carlos Mendoza',
      role: 'CUSTOMER',
      emailVerified: new Date(),
      profile: {
        create: {
          phone: '999888777',
          address: 'Av. Larco 1234',
          district: 'Miraflores',
          city: 'Lima',
          country: 'PE',
        },
      },
    },
  })

  console.log(`✅ Users: ${admin.email}, ${customer.email}`)

  // ── Categories ─────────────────────────────────────────────────────────────
  const catFiguras = await prisma.category.upsert({
    where: { slug: 'figuras-de-accion' },
    update: {},
    create: { name: 'Figuras de Acción', slug: 'figuras-de-accion' },
  })

  const catLego = await prisma.category.upsert({
    where: { slug: 'sets-lego' },
    update: {},
    create: { name: 'Sets LEGO', slug: 'sets-lego' },
  })

  const catModelos = await prisma.category.upsert({
    where: { slug: 'modelos-a-escala' },
    update: {},
    create: { name: 'Modelos a Escala', slug: 'modelos-a-escala' },
  })

  console.log(`✅ Categories: ${catFiguras.name}, ${catLego.name}, ${catModelos.name}`)

  // ── Brands ─────────────────────────────────────────────────────────────────
  const bandai = await prisma.brand.upsert({
    where: { slug: 'bandai' },
    update: {},
    create: { name: 'Bandai', slug: 'bandai' },
  })

  const legoGroup = await prisma.brand.upsert({
    where: { slug: 'lego-group' },
    update: {},
    create: { name: 'LEGO Group', slug: 'lego-group' },
  })

  const goodSmile = await prisma.brand.upsert({
    where: { slug: 'good-smile-company' },
    update: {},
    create: { name: 'Good Smile Company', slug: 'good-smile-company' },
  })

  const kotobukiya = await prisma.brand.upsert({
    where: { slug: 'kotobukiya' },
    update: {},
    create: { name: 'Kotobukiya', slug: 'kotobukiya' },
  })

  console.log(`✅ Brands: ${bandai.name}, ${legoGroup.name}, ${goodSmile.name}, ${kotobukiya.name}`)

  // ── Products ───────────────────────────────────────────────────────────────
  const p1 = await prisma.product.upsert({
    where: { sku: 'BND-DBZ-GOKU-001' },
    update: {},
    create: {
      sku: 'BND-DBZ-GOKU-001',
      slug: 'son-goku-super-saiyan-dragon-ball-z-bandai',
      name: 'Son Goku Super Saiyan — Dragon Ball Z',
      description: 'Figura articulada de Son Goku en forma Super Saiyan. Escala 1:10. Incluye accesorios de energía. Fabricada por Bandai Spirits.',
      price: 249.90,
      compareAtPrice: 299.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: true,
      categoryId: catFiguras.id,
      brandId: bandai.id,
      images: {
        create: [
          { url: 'https://placehold.co/800x800/111624/58aaff?text=Goku+SS', alt: 'Son Goku Super Saiyan frente', position: 0 },
          { url: 'https://placehold.co/800x800/111624/58aaff?text=Goku+Back', alt: 'Son Goku Super Saiyan reverso', position: 1 },
        ],
      },
      inventory: {
        create: { availableStock: 15, reservedStock: 2, lowStockThreshold: 3 },
      },
    },
  })

  const p2 = await prisma.product.upsert({
    where: { sku: 'BND-EVA-UNIT01-001' },
    update: {},
    create: {
      sku: 'BND-EVA-UNIT01-001',
      slug: 'evangelion-unit-01-neon-genesis-bandai-robot-spirits',
      name: 'Evangelion Unit-01 — Neon Genesis Evangelion',
      description: 'Robot Spirits figura del Evangelion Unit-01. Alta fidelidad de detalle, múltiples puntos de articulación. Incluye lanza de Longinus.',
      price: 389.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: true,
      categoryId: catFiguras.id,
      brandId: bandai.id,
      images: {
        create: [
          { url: 'https://placehold.co/800x800/111624/7b5fff?text=EVA+Unit+01', alt: 'Evangelion Unit-01 frente', position: 0 },
        ],
      },
      inventory: {
        create: { availableStock: 8, reservedStock: 1, lowStockThreshold: 2 },
      },
    },
  })

  const p3 = await prisma.product.upsert({
    where: { sku: 'LGO-SW-FALCON-001' },
    update: {},
    create: {
      sku: 'LGO-SW-FALCON-001',
      slug: 'millennium-falcon-lego-star-wars-75375',
      name: 'Millennium Falcon — LEGO Star Wars 75375',
      description: 'Construye el mítico Halcón Milenario con 921 piezas. Incluye 7 minifiguras: Han Solo, Chewbacca, Leia, Luke Skywalker, R2-D2, C-3PO y Finn.',
      price: 599.90,
      compareAtPrice: 699.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: false,
      categoryId: catLego.id,
      brandId: legoGroup.id,
      images: {
        create: [
          { url: 'https://placehold.co/800x800/111624/5f9eff?text=LEGO+Falcon', alt: 'Millennium Falcon LEGO', position: 0 },
        ],
      },
      inventory: {
        create: { availableStock: 5, reservedStock: 0, lowStockThreshold: 2 },
      },
    },
  })

  const p4 = await prisma.product.upsert({
    where: { sku: 'GSC-CSW-MAKIMA-001' },
    update: {},
    create: {
      sku: 'GSC-CSW-MAKIMA-001',
      slug: 'makima-chainsaw-man-pop-up-parade-good-smile',
      name: 'Makima — Chainsaw Man Pop Up Parade',
      description: 'Figura Pop Up Parade de Makima de la serie Chainsaw Man. Altura 17 cm. Pintura de alta calidad. Edición estándar.',
      price: 199.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: true,
      categoryId: catFiguras.id,
      brandId: goodSmile.id,
      images: {
        create: [
          { url: 'https://placehold.co/800x800/111624/3fcf7f?text=Makima+PUP', alt: 'Makima Pop Up Parade', position: 0 },
        ],
      },
      inventory: {
        create: { availableStock: 3, reservedStock: 0, lowStockThreshold: 2 },
      },
    },
  })

  const p5 = await prisma.product.upsert({
    where: { sku: 'KOT-NRT-NARUTO-001' },
    update: {},
    create: {
      sku: 'KOT-NRT-NARUTO-001',
      slug: 'naruto-uzumaki-sage-mode-kotobukiya-artfx',
      name: 'Naruto Uzumaki Sage Mode — Kotobukiya ARTFX J',
      description: 'Figura ARTFX J de Naruto en modo sabio. Escala 1:8. Base decorativa incluida. Edición limitada Kotobukiya.',
      price: 459.90,
      compareAtPrice: 529.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: false,
      categoryId: catFiguras.id,
      brandId: kotobukiya.id,
      images: {
        create: [
          { url: 'https://placehold.co/800x800/111624/ffb84a?text=Naruto+ARTFX', alt: 'Naruto Sage Mode ARTFX J', position: 0 },
        ],
      },
      inventory: {
        create: { availableStock: 2, reservedStock: 1, lowStockThreshold: 2 },
      },
    },
  })

  const p6 = await prisma.product.upsert({
    where: { sku: 'LGO-TCH-BUGATTI-001' },
    update: {},
    create: {
      sku: 'LGO-TCH-BUGATTI-001',
      slug: 'bugatti-bolide-lego-technic-42151',
      name: 'Bugatti Bolide — LEGO Technic 42151',
      description: 'Réplica del Bugatti Bolide con 905 piezas. Motor funcional con movimiento de pistones. Colores azul y negro.',
      price: 449.90,
      currency: 'PEN',
      status: ProductStatus.COMING_SOON,
      featured: false,
      categoryId: catLego.id,
      brandId: legoGroup.id,
      images: {
        create: [
          { url: 'https://placehold.co/800x800/111624/ff6644?text=LEGO+Bugatti', alt: 'Bugatti Bolide LEGO Technic', position: 0 },
        ],
      },
      inventory: {
        create: { availableStock: 0, reservedStock: 0, lowStockThreshold: 3 },
      },
    },
  })

  console.log(`✅ Products: ${p1.name}, ${p2.name}, ${p3.name}, ${p4.name}, ${p5.name}, ${p6.name}`)

  // ── Inventory movements (restock inicial) ──────────────────────────────────
  for (const { product, qty } of [
    { product: p1, qty: 15 },
    { product: p2, qty: 8 },
    { product: p3, qty: 5 },
    { product: p4, qty: 3 },
    { product: p5, qty: 2 },
  ]) {
    const existing = await prisma.inventoryMovement.findFirst({
      where: { productId: product.id, type: InventoryMovementType.PURCHASE, reason: 'Restock inicial seed' },
    })
    if (!existing) {
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: InventoryMovementType.PURCHASE,
          stockType: 'NORMAL',
          quantity: qty,
          balanceAfter: qty,
          reason: 'Restock inicial seed',
          createdById: admin.id,
        },
      })
    }
  }

  // ── Orders ─────────────────────────────────────────────────────────────────
  const order1 = await prisma.order.upsert({
    where: { code: 'MIR-2025-0001' },
    update: {},
    create: {
      code: 'MIR-2025-0001',
      userId: customer.id,
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.CULQI_CARD,
      subtotal: 639.80,
      shippingCost: 15.00,
      total: 654.80,
      currency: 'PEN',
      paidAt: new Date('2025-04-10T14:23:00Z'),
      items: {
        create: [
          { productId: p1.id, quantity: 1, unitPrice: 249.90, productName: p1.name, productSku: p1.sku },
          { productId: p2.id, quantity: 1, unitPrice: 389.90, productName: p2.name, productSku: p2.sku },
        ],
      },
      payment: {
        create: {
          method: PaymentMethod.CULQI_CARD,
          status: PaymentStatus.PAID,
          amount: 654.80,
          currency: 'PEN',
          culqiChargeId: 'chr_test_seed_001',
          culqiEventId: 'evt_test_seed_001',
        },
      },
      shipping: {
        create: {
          fullName: 'Carlos Mendoza',
          phone: '999888777',
          address: 'Av. Larco 1234 Dpto. 501',
          district: 'Miraflores',
          city: 'Lima',
          reference: 'Edificio Torre Azul',
        },
      },
    },
  })

  const order2 = await prisma.order.upsert({
    where: { code: 'MIR-2025-0002' },
    update: {},
    create: {
      code: 'MIR-2025-0002',
      guestEmail: 'invitado@example.com',
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.WHATSAPP_TRANSFER,
      subtotal: 599.90,
      shippingCost: 20.00,
      total: 619.90,
      currency: 'PEN',
      paidAt: new Date('2025-04-18T10:05:00Z'),
      items: {
        create: [
          { productId: p3.id, quantity: 1, unitPrice: 599.90, productName: p3.name, productSku: p3.sku },
        ],
      },
      payment: {
        create: {
          method: PaymentMethod.WHATSAPP_TRANSFER,
          status: PaymentStatus.PAID,
          amount: 619.90,
          currency: 'PEN',
          proofUrl: 'https://placehold.co/400x600?text=Comprobante',
        },
      },
      shipping: {
        create: {
          fullName: 'Ana Torres',
          phone: '987654321',
          address: 'Jr. de la Unión 456',
          district: 'Cercado de Lima',
          city: 'Lima',
        },
      },
    },
  })

  const order3 = await prisma.order.upsert({
    where: { code: 'MIR-2025-0003' },
    update: {},
    create: {
      code: 'MIR-2025-0003',
      userId: customer.id,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      paymentMethod: PaymentMethod.CULQI_CARD,
      subtotal: 199.90,
      shippingCost: 15.00,
      total: 214.90,
      currency: 'PEN',
      items: {
        create: [
          { productId: p4.id, quantity: 1, unitPrice: 199.90, productName: p4.name, productSku: p4.sku },
        ],
      },
      payment: {
        create: {
          method: PaymentMethod.CULQI_CARD,
          status: PaymentStatus.PROCESSING,
          amount: 214.90,
          currency: 'PEN',
        },
      },
      shipping: {
        create: {
          fullName: 'Carlos Mendoza',
          phone: '999888777',
          address: 'Av. Larco 1234 Dpto. 501',
          district: 'Miraflores',
          city: 'Lima',
        },
      },
    },
  })

  const order4 = await prisma.order.upsert({
    where: { code: 'MIR-2025-0004' },
    update: {},
    create: {
      code: 'MIR-2025-0004',
      guestEmail: 'pedro@example.com',
      status: OrderStatus.AWAITING_PROOF,
      paymentStatus: PaymentStatus.UNPAID,
      paymentMethod: PaymentMethod.WHATSAPP_TRANSFER,
      subtotal: 918.80,
      shippingCost: 0,
      total: 918.80,
      currency: 'PEN',
      notes: 'Cliente solicitó envío a domicilio. Coordinar horario.',
      items: {
        create: [
          { productId: p5.id, quantity: 1, unitPrice: 459.90, productName: p5.name, productSku: p5.sku },
          { productId: p2.id, quantity: 1, unitPrice: 389.90, productName: p2.name, productSku: p2.sku },
        ],
      },
      payment: {
        create: {
          method: PaymentMethod.WHATSAPP_TRANSFER,
          status: PaymentStatus.UNPAID,
          amount: 918.80,
          currency: 'PEN',
        },
      },
      shipping: {
        create: {
          fullName: 'Pedro Castillo',
          phone: '956123456',
          address: 'Calle Los Pinos 789',
          district: 'San Isidro',
          city: 'Lima',
        },
      },
    },
  })

  console.log(`✅ Orders: ${order1.code}, ${order2.code}, ${order3.code}, ${order4.code}`)

  // ── Banners ────────────────────────────────────────────────────────────────
  const banner1 = await prisma.banner.upsert({
    where: { id: 'seed-banner-hero-01' },
    update: {},
    create: {
      id: 'seed-banner-hero-01',
      title: 'Colección Verano 2025',
      subtitle: 'Figuras exclusivas de Dragon Ball, Evangelion y más',
      imageUrl: 'https://placehold.co/1920x600/07090f/58aaff?text=Mirana+Shop',
      ctaLabel: 'Ver colección',
      ctaHref: '/catalogo',
      position: 0,
      active: true,
    },
  })

  const banner2 = await prisma.banner.upsert({
    where: { id: 'seed-banner-promo-01' },
    update: {},
    create: {
      id: 'seed-banner-promo-01',
      title: 'LEGO Star Wars',
      subtitle: 'Sets nuevos disponibles — envío gratis en compras +S/500',
      imageUrl: 'https://placehold.co/1920x600/07090f/5f9eff?text=LEGO+Star+Wars',
      ctaLabel: 'Ver LEGO',
      ctaHref: '/catalogo?cat=sets-lego',
      position: 1,
      active: true,
    },
  })

  console.log(`✅ Banners: ${banner1.title}, ${banner2.title}`)
  console.log('✅ Seed completado.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
