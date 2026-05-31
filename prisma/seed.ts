import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, ProductStatus, OrderStatus, PaymentStatus, PaymentMethod, InventoryMovementType } from '../generated/prisma/client'

// ---------------------------------------------------------------------------
// Slugs de categoría deben coincidir con CATEGORY_STRIPE en catalog.types.ts:
//   "figuras-accion" -> stripe-fig
//   "lego"           -> stripe-lego
//   "modelos-escala" -> stripe-veh
//   "anime"          -> stripe-fig
// ---------------------------------------------------------------------------

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

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

  console.log(`Users: ${admin.email}, ${customer.email}`)

  // ── Categories — slugs alineados con CATEGORY_STRIPE ──────────────────────
  const catFiguras = await prisma.category.upsert({
    where: { slug: 'figuras-accion' },
    update: { name: 'Figuras de Acción' },
    create: { name: 'Figuras de Acción', slug: 'figuras-accion' },
  })

  const catLego = await prisma.category.upsert({
    where: { slug: 'lego' },
    update: { name: 'LEGO' },
    create: { name: 'LEGO', slug: 'lego' },
  })

  const catModelos = await prisma.category.upsert({
    where: { slug: 'modelos-escala' },
    update: { name: 'Modelos a Escala' },
    create: { name: 'Modelos a Escala', slug: 'modelos-escala' },
  })

  const catAnime = await prisma.category.upsert({
    where: { slug: 'anime' },
    update: { name: 'Anime & Manga' },
    create: { name: 'Anime & Manga', slug: 'anime' },
  })

  console.log(`Categories: ${catFiguras.name}, ${catLego.name}, ${catModelos.name}, ${catAnime.name}`)

  // ── Brands ─────────────────────────────────────────────────────────────────
  const hasbro = await prisma.brand.upsert({
    where: { slug: 'hasbro' },
    update: {},
    create: { name: 'Hasbro', slug: 'hasbro' },
  })

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

  const funko = await prisma.brand.upsert({
    where: { slug: 'funko' },
    update: {},
    create: { name: 'Funko', slug: 'funko' },
  })

  const hotWheels = await prisma.brand.upsert({
    where: { slug: 'hot-wheels' },
    update: {},
    create: { name: 'Hot Wheels', slug: 'hot-wheels' },
  })

  console.log(`Brands: ${bandai.name}, ${legoGroup.name}, ${goodSmile.name}, ${kotobukiya.name}, ${hasbro.name}, ${funko.name}, ${hotWheels.name}`)

  // ── Products ───────────────────────────────────────────────────────────────
  const p1 = await prisma.product.upsert({
    where: { sku: 'BND-DBZ-GOKU-001' },
    update: {},
    create: {
      sku: 'BND-DBZ-GOKU-001',
      slug: 'son-goku-super-saiyan-dragon-ball-z-bandai',
      name: 'Son Goku Super Saiyan — Dragon Ball Z',
      description: 'Figura articulada de Son Goku en forma Super Saiyan. Escala 1:10. Incluye accesorios de energía intercambiables. Fabricada por Bandai Spirits con pintura de alta definición.',
      price: 249.90,
      compareAtPrice: 299.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: true,
      categoryId: catAnime.id,
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
      name: 'Evangelion Unit-01 — Robot Spirits',
      description: 'Robot Spirits figura del Evangelion Unit-01. Alta fidelidad de detalle, múltiples puntos de articulación. Incluye lanza de Longinus y efectos de AT Field.',
      price: 389.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: true,
      categoryId: catAnime.id,
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
      featured: true,
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
      description: 'Figura Pop Up Parade de Makima de la serie Chainsaw Man. Altura 17 cm. Pintura de alta calidad con detalles en el traje y expresión característica.',
      price: 199.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: true,
      categoryId: catAnime.id,
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
      name: 'Naruto Uzumaki Sage Mode — ARTFX J',
      description: 'Figura ARTFX J de Naruto en modo sabio. Escala 1:8. Base decorativa incluida. Edición limitada Kotobukiya con efectos de chakra natural.',
      price: 459.90,
      compareAtPrice: 529.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: false,
      categoryId: catAnime.id,
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
      description: 'Réplica del Bugatti Bolide con 905 piezas. Motor funcional con movimiento de pistones. Colores azul y negro característicos del modelo real.',
      price: 449.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: false,
      categoryId: catLego.id,
      brandId: legoGroup.id,
      images: {
        create: [
          { url: 'https://placehold.co/800x800/111624/ff6644?text=LEGO+Bugatti', alt: 'Bugatti Bolide LEGO Technic', position: 0 },
        ],
      },
      inventory: {
        create: { availableStock: 7, reservedStock: 0, lowStockThreshold: 3 },
      },
    },
  })

  // Productos adicionales para poblar mejor el catálogo
  const p7 = await prisma.product.upsert({
    where: { sku: 'HAS-MAR-IRONMAN-001' },
    update: {},
    create: {
      sku: 'HAS-MAR-IRONMAN-001',
      slug: 'iron-man-mk85-marvel-legends-hasbro',
      name: 'Iron Man MK-85 — Marvel Legends',
      description: 'Figura articulada de Iron Man en la armadura Mark 85 de Avengers: Endgame. 16 cm, 20 puntos de articulación. Incluye efecto de reactores y 3 pares de manos.',
      price: 149.90,
      compareAtPrice: 179.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: true,
      categoryId: catFiguras.id,
      brandId: hasbro.id,
      images: {
        create: [
          { url: 'https://placehold.co/800x800/111624/58aaff?text=Iron+Man+MK85', alt: 'Iron Man MK-85 Marvel Legends', position: 0 },
        ],
      },
      inventory: {
        create: { availableStock: 22, reservedStock: 0, lowStockThreshold: 5 },
      },
    },
  })

  const p8 = await prisma.product.upsert({
    where: { sku: 'HW-PREM-FERRARI-001' },
    update: {},
    create: {
      sku: 'HW-PREM-FERRARI-001',
      slug: 'ferrari-sf90-hot-wheels-premium-escala',
      name: 'Ferrari SF90 Stradale — Hot Wheels Premium',
      description: 'Modelo de metal fundido escala 1:64. Carrocería roja con detalles en carbono. Ruedas de perfil bajo con llantas doradas. Edición Premium de coleccionista.',
      price: 59.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: false,
      categoryId: catModelos.id,
      brandId: hotWheels.id,
      images: {
        create: [
          { url: 'https://placehold.co/800x800/111624/ff4444?text=Ferrari+SF90', alt: 'Ferrari SF90 Hot Wheels Premium', position: 0 },
        ],
      },
      inventory: {
        create: { availableStock: 45, reservedStock: 0, lowStockThreshold: 10 },
      },
    },
  })

  const p9 = await prisma.product.upsert({
    where: { sku: 'FNK-OP-LUFFY-001' },
    update: {},
    create: {
      sku: 'FNK-OP-LUFFY-001',
      slug: 'luffy-gear-5-funko-pop-one-piece',
      name: 'Luffy Gear 5 — Funko POP! One Piece',
      description: 'Funko POP! de Monkey D. Luffy en su transformación Gear 5 Sun God Nika. 15 cm de altura. Detalles en blanco con aura dorada. Edición especial de coleccionista.',
      price: 89.90,
      currency: 'PEN',
      status: ProductStatus.PREORDER,
      featured: false,
      categoryId: catAnime.id,
      brandId: funko.id,
      images: {
        create: [
          { url: 'https://placehold.co/800x800/111624/ffdd00?text=Luffy+Gear5', alt: 'Luffy Gear 5 Funko POP', position: 0 },
        ],
      },
      inventory: {
        create: { availableStock: 0, reservedStock: 0, preorderedStock: 30, lowStockThreshold: 5 },
      },
    },
  })

  const p10 = await prisma.product.upsert({
    where: { sku: 'LGO-HGW-CASTLE-001' },
    update: {},
    create: {
      sku: 'LGO-HGW-CASTLE-001',
      slug: 'hogwarts-castle-lego-harry-potter-71043',
      name: 'Castillo de Hogwarts — LEGO Harry Potter 71043',
      description: '6,020 piezas. El castillo más icónico de la saga. Incluye 4 torres emblemáticas, el Gran Salón y más de 27 minifiguras exclusivas. Para mayores de 16 años.',
      price: 1299.90,
      compareAtPrice: 1499.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: true,
      categoryId: catLego.id,
      brandId: legoGroup.id,
      images: {
        create: [
          { url: 'https://placehold.co/800x800/111624/8B4513?text=Hogwarts+Castle', alt: 'Castillo de Hogwarts LEGO', position: 0 },
        ],
      },
      inventory: {
        create: { availableStock: 4, reservedStock: 1, lowStockThreshold: 2 },
      },
    },
  })

  const p11 = await prisma.product.upsert({
    where: { sku: 'KOT-DEM-TANJIRO-001' },
    update: {},
    create: {
      sku: 'KOT-DEM-TANJIRO-001',
      slug: 'tanjiro-kamado-demon-slayer-kotobukiya',
      name: 'Tanjiro Kamado — Demon Slayer ARTFX J',
      description: 'Figura ARTFX J de Tanjiro Kamado del manga Demon Slayer. Escala 1:8. Pose de ataque con efectos de agua. Base diorama incluida con detalles del universo.',
      price: 479.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: false,
      categoryId: catAnime.id,
      brandId: kotobukiya.id,
      images: {
        create: [
          { url: 'https://placehold.co/800x800/111624/22aaff?text=Tanjiro+ARTFX', alt: 'Tanjiro Kamado Demon Slayer', position: 0 },
        ],
      },
      inventory: {
        create: { availableStock: 6, reservedStock: 0, lowStockThreshold: 2 },
      },
    },
  })

  const p12 = await prisma.product.upsert({
    where: { sku: 'HW-F1-REDBULL-001' },
    update: {},
    create: {
      sku: 'HW-F1-REDBULL-001',
      slug: 'red-bull-racing-rb19-hot-wheels-f1-2023',
      name: 'Red Bull Racing RB19 — Hot Wheels F1',
      description: 'Réplica oficial del RB19 de Red Bull Racing, campeón del mundo F1 2023. Escala 1:18. Metal fundido con detalles aerodinámicos auténticos y livrea completa.',
      price: 199.90,
      compareAtPrice: 249.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: false,
      categoryId: catModelos.id,
      brandId: hotWheels.id,
      images: {
        create: [
          { url: 'https://placehold.co/800x800/111624/0033FF?text=Red+Bull+F1', alt: 'Red Bull RB19 Hot Wheels F1', position: 0 },
        ],
      },
      inventory: {
        create: { availableStock: 18, reservedStock: 0, lowStockThreshold: 4 },
      },
    },
  })

  console.log(`Products: ${[p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12].map(p => p.sku).join(', ')}`)

  // ── Inventory movements (restock inicial) ──────────────────────────────────
  const stockEntries = [
    { product: p1, qty: 15 }, { product: p2, qty: 8 },
    { product: p3, qty: 5 },  { product: p4, qty: 3 },
    { product: p5, qty: 2 },  { product: p6, qty: 7 },
    { product: p7, qty: 22 }, { product: p8, qty: 45 },
    { product: p10, qty: 4 }, { product: p11, qty: 6 },
    { product: p12, qty: 18 },
  ]

  for (const { product, qty } of stockEntries) {
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
      status: OrderStatus.DELIVERED,
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
      notes: 'Cliente solicitó envío a domicilio. Coordinar horario por WhatsApp.',
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

  const order5 = await prisma.order.upsert({
    where: { code: 'MIR-2025-0005' },
    update: {},
    create: {
      code: 'MIR-2025-0005',
      guestEmail: 'sofia@example.com',
      status: OrderStatus.SHIPPED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.CULQI_YAPE,
      subtotal: 1549.70,
      shippingCost: 0,
      total: 1549.70,
      currency: 'PEN',
      paidAt: new Date('2025-05-20T16:40:00Z'),
      items: {
        create: [
          { productId: p10.id, quantity: 1, unitPrice: 1299.90, productName: p10.name, productSku: p10.sku },
          { productId: p7.id, quantity: 1, unitPrice: 149.90, productName: p7.name, productSku: p7.sku },
          { productId: p8.id, quantity: 1, unitPrice: 59.90, productName: p8.name, productSku: p8.sku },
        ],
      },
      payment: {
        create: {
          method: PaymentMethod.CULQI_YAPE,
          status: PaymentStatus.PAID,
          amount: 1549.70,
          currency: 'PEN',
        },
      },
      shipping: {
        create: {
          fullName: 'Sofía Paredes',
          phone: '945678901',
          address: 'Av. Petit Thouars 3001',
          district: 'San Isidro',
          city: 'Lima',
        },
      },
    },
  })

  console.log(`Orders: ${[order1, order2, order3, order4, order5].map(o => o.code).join(', ')}`)

  // ── Banners ────────────────────────────────────────────────────────────────
  const banner1 = await prisma.banner.upsert({
    where: { id: 'seed-banner-hero-01' },
    update: {},
    create: {
      id: 'seed-banner-hero-01',
      title: 'Nueva Temporada 2026',
      subtitle: 'Figuras exclusivas de anime, Marvel y LEGO',
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
      title: 'LEGO — Nuevos Sets',
      subtitle: 'Envío gratis en compras mayores a S/500',
      imageUrl: 'https://placehold.co/1920x600/07090f/5f9eff?text=LEGO+Sets',
      ctaLabel: 'Ver LEGO',
      ctaHref: '/catalogo?cat=lego',
      position: 1,
      active: true,
    },
  })

  const banner3 = await prisma.banner.upsert({
    where: { id: 'seed-banner-anime-01' },
    update: {},
    create: {
      id: 'seed-banner-anime-01',
      title: 'Anime & Manga',
      subtitle: 'Dragon Ball, Demon Slayer, One Piece y más',
      imageUrl: 'https://placehold.co/1920x600/07090f/7b5fff?text=Anime+Manga',
      ctaLabel: 'Explorar',
      ctaHref: '/catalogo?cat=anime',
      position: 2,
      active: true,
    },
  })

  const banner4 = await prisma.banner.upsert({
    where: { id: 'seed-banner-bf-01' },
    update: {},
    create: {
      id: 'seed-banner-bf-01',
      title: 'Black Friday Anticipado',
      subtitle: 'Hasta 40% de descuento en figuras seleccionadas',
      imageUrl: 'https://placehold.co/1920x600/1a0000/ff6644?text=Black+Friday',
      ctaLabel: 'Ver ofertas',
      ctaHref: '/catalogo',
      position: 3,
      active: false,
    },
  })

  console.log(`Banners: ${[banner1, banner2, banner3, banner4].map(b => b.title).join(', ')}`)

  // ── Enriquecer marcas con description e imageUrl ───────────────────────────
  await prisma.brand.update({
    where: { slug: 'bandai' },
    data: {
      description: 'Fabricante japonés líder en figuras de anime y modelos coleccionables. Responsables de las líneas Robot Spirits, S.H.Figuarts y Dragon Stars.',
      imageUrl: 'https://placehold.co/800x400/111624/58aaff?text=Bandai',
    },
  })

  await prisma.brand.update({
    where: { slug: 'lego-group' },
    data: {
      description: 'El grupo LEGO es el fabricante de juguetes de construcción más grande del mundo, con sets para todas las edades bajo las líneas City, Technic, Creator y más.',
      imageUrl: 'https://placehold.co/800x400/111624/5f9eff?text=LEGO+Group',
    },
  })

  await prisma.brand.update({
    where: { slug: 'good-smile-company' },
    data: {
      description: 'Fabricante japonés especializado en figuras de alta gama. Creadores de las líneas Nendoroid, figma y Pop Up Parade.',
      imageUrl: 'https://placehold.co/800x400/111624/3fcf7f?text=Good+Smile',
    },
  })

  await prisma.brand.update({
    where: { slug: 'kotobukiya' },
    data: {
      description: 'Empresa japonesa de figuras premium conocida por sus líneas ARTFX y ARTFX J con esculturas de alta fidelidad de personajes de anime y videojuegos.',
      imageUrl: 'https://placehold.co/800x400/111624/ffb84a?text=Kotobukiya',
    },
  })

  await prisma.brand.update({
    where: { slug: 'hasbro' },
    data: {
      description: 'Empresa estadounidense de juguetes y entretenimiento, conocida por las líneas Marvel Legends, G.I. Joe, Transformers y Star Wars Black Series.',
      imageUrl: 'https://placehold.co/800x400/111624/ff6644?text=Hasbro',
    },
  })

  await prisma.brand.update({
    where: { slug: 'funko' },
    data: {
      description: 'Fabricante de figuras Pop! coleccionables con licencias de cultura pop: anime, películas, series, videojuegos y deportes.',
      imageUrl: 'https://placehold.co/800x400/111624/ffdd00?text=Funko',
    },
  })

  await prisma.brand.update({
    where: { slug: 'hot-wheels' },
    data: {
      description: 'Línea de vehículos a escala de Mattel. La colección Premium y Race Team incluye réplicas oficiales de autos deportivos y de Fórmula 1.',
      imageUrl: 'https://placehold.co/800x400/111624/ff4444?text=Hot+Wheels',
    },
  })

  console.log('Brands enriquecidos con description e imageUrl')

  // ── Enriquecer categorías con description e imageUrl ──────────────────────
  await prisma.category.update({
    where: { slug: 'figuras-accion' },
    data: {
      description: 'Figuras articuladas de personajes de series, películas y cómics. Incluye líneas Marvel Legends, DC Multiverse y más.',
      imageUrl: 'https://placehold.co/800x400/111624/58aaff?text=Figuras',
    },
  })

  await prisma.category.update({
    where: { slug: 'lego' },
    data: {
      description: 'Sets de construcción LEGO oficiales: City, Technic, Creator Expert, Star Wars, Harry Potter y colecciones exclusivas.',
      imageUrl: 'https://placehold.co/800x400/111624/5f9eff?text=LEGO',
    },
  })

  await prisma.category.update({
    where: { slug: 'modelos-escala' },
    data: {
      description: 'Réplicas a escala de autos, motos y vehículos de colección. Metal fundido de alta calidad para coleccionistas exigentes.',
      imageUrl: 'https://placehold.co/800x400/111624/ff6644?text=Modelos',
    },
  })

  await prisma.category.update({
    where: { slug: 'anime' },
    data: {
      description: 'Figuras premium de los mejores animes: Dragon Ball Z, Evangelion, Chainsaw Man, One Piece, Naruto, Demon Slayer y más.',
      imageUrl: 'https://placehold.co/800x400/111624/7b5fff?text=Anime',
    },
  })

  console.log('Categories enriquecidas con description e imageUrl')

  // ── salePrice en productos con compareAtPrice ──────────────────────────────
  // Goku: compareAtPrice 299.90 → salePrice 249.90 (ya es el precio actual)
  await prisma.product.update({
    where: { sku: 'BND-DBZ-GOKU-001' },
    data: { salePrice: 249.90 },
  })

  // Millennium Falcon: compareAtPrice 699.90 → salePrice 599.90
  await prisma.product.update({
    where: { sku: 'LGO-SW-FALCON-001' },
    data: { salePrice: 599.90 },
  })

  // Naruto: compareAtPrice 529.90 → salePrice 459.90
  await prisma.product.update({
    where: { sku: 'KOT-NRT-NARUTO-001' },
    data: { salePrice: 459.90 },
  })

  // Iron Man: compareAtPrice 179.90 → salePrice 149.90
  await prisma.product.update({
    where: { sku: 'HAS-MAR-IRONMAN-001' },
    data: { salePrice: 149.90 },
  })

  // Hogwarts: compareAtPrice 1499.90 → salePrice 1299.90
  await prisma.product.update({
    where: { sku: 'LGO-HGW-CASTLE-001' },
    data: { salePrice: 1299.90 },
  })

  // Red Bull F1: compareAtPrice 249.90 → salePrice 199.90
  await prisma.product.update({
    where: { sku: 'HW-F1-REDBULL-001' },
    data: { salePrice: 199.90 },
  })

  console.log('salePrice actualizado en productos con compareAtPrice')

  // ── Colecciones ────────────────────────────────────────────────────────────
  const colBestsellers = await prisma.collection.upsert({
    where: { slug: 'bestsellers-2025' },
    update: { active: true },
    create: {
      name: 'Bestsellers 2025',
      slug: 'bestsellers-2025',
      description: 'Los productos más vendidos y mejor valorados de la temporada 2025. Selección curada por nuestro equipo.',
      imageUrl: 'https://placehold.co/1200x400/111624/ffb84a?text=Bestsellers+2025',
      active: true,
    },
  })

  const colAnime = await prisma.collection.upsert({
    where: { slug: 'anime-figures' },
    update: { active: true },
    create: {
      name: 'Anime Figures',
      slug: 'anime-figures',
      description: 'Colección exclusiva de figuras de los animes más populares: Dragon Ball, Evangelion, Chainsaw Man, One Piece, Naruto y Demon Slayer.',
      imageUrl: 'https://placehold.co/1200x400/111624/7b5fff?text=Anime+Figures',
      active: true,
    },
  })

  const colLegoTechnic = await prisma.collection.upsert({
    where: { slug: 'lego-technic' },
    update: { active: true },
    create: {
      name: 'LEGO Technic',
      slug: 'lego-technic',
      description: 'Los mejores sets LEGO Technic con mecánicas realistas, motores funcionales y diseños de ingeniería para entusiastas avanzados.',
      imageUrl: 'https://placehold.co/1200x400/111624/5f9eff?text=LEGO+Technic',
      active: true,
    },
  })

  console.log(`Collections: ${colBestsellers.name}, ${colAnime.name}, ${colLegoTechnic.name}`)

  // ── Asociar productos a colecciones ───────────────────────────────────────
  // Bestsellers: Goku, Evangelion, Millennium Falcon, Iron Man, Hogwarts
  const bestsellersProducts = [p1.id, p2.id, p3.id, p7.id, p10.id]
  for (const productId of bestsellersProducts) {
    await prisma.productCollection.upsert({
      where: { productId_collectionId: { productId, collectionId: colBestsellers.id } },
      update: {},
      create: { productId, collectionId: colBestsellers.id },
    })
  }

  // Anime Figures: Goku, Evangelion, Makima, Naruto, Luffy, Tanjiro
  const animeProducts = [p1.id, p2.id, p4.id, p5.id, p9.id, p11.id]
  for (const productId of animeProducts) {
    await prisma.productCollection.upsert({
      where: { productId_collectionId: { productId, collectionId: colAnime.id } },
      update: {},
      create: { productId, collectionId: colAnime.id },
    })
  }

  // LEGO Technic: Bugatti Bolide (el único Technic puro del catálogo)
  const legoTechnicProducts = [p6.id]
  for (const productId of legoTechnicProducts) {
    await prisma.productCollection.upsert({
      where: { productId_collectionId: { productId, collectionId: colLegoTechnic.id } },
      update: {},
      create: { productId, collectionId: colLegoTechnic.id },
    })
  }

  console.log('Productos asociados a colecciones')
  console.log('Seed completado exitosamente.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
