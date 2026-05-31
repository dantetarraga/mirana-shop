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

// ---------------------------------------------------------------------------
// Helpers de Unsplash — URLs estables con crop y calidad
// ---------------------------------------------------------------------------
const img = (id: string, w = 800, h = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`

const banner = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1920&h=600&fit=crop&q=80&auto=format`

// ---------------------------------------------------------------------------
// Imágenes por tema (IDs de Unsplash)
// ---------------------------------------------------------------------------

const IMGS = {
  // Figuras de acción y anime
  goku:      '1563396983906-b3795482a59a', // figura articulada colorida
  eva01:     '1608889825205-eebdb9fc5806', // colección de figuras
  makima:    '1614732414444-086425adebe5', // figura anime femenina
  naruto:    '1611532736597-de2d4265fba3', // acción figure orange
  ironman:   '1594736797933-d0401ba2fe65', // superhero figure rojo
  tanjiro:   '1619364726002-c54a0bc7ba04', // anime figure azul
  luffy:     '1578632767115-351597cf2477', // anime figure naranja

  // LEGO
  falcon:    '1587654780291-39c9404d746b', // LEGO colorido
  bugatti:   '1530281700549-e82e7bf110d6', // LEGO technic
  hogwarts:  '1516770965459-ef23bdff65dd', // LEGO castle

  // Modelos a escala / autos
  ferrari:   '1568605117036-5fe5e7bab0b7', // Ferrari rojo
  f1:        '1525609004556-c46c7d6cf023', // Formula 1

  // Categorías (paisaje)
  catFiguras: '1527443224154-599571801185', // estante de figuras
  catLego:    '1607604276583-eef5d176b328', // LEGO colorido wide
  catModelos: '1558618666-fcd25c85cd64',   // colección de autos
  catAnime:   '1612036782180-6f0b6cd846fe', // figuras anime shelf

  // Banners (panorámico oscuro)
  bannerHero:    '1542281286-9e0a16bb7366', // toys display dark
  bannerLego:    '1531746790731-6c087fecd65a', // LEGO dark
  bannerAnime:   '1518770660439-4636190af475', // neon dark collectibles
  bannerBlack:   '1616159236399-5f52e6ad60b3', // dark discount

  // Marcas (logos placeholder con color de marca real)
  brandBandai:     '1608889825205-eebdb9fc5806',
  brandLego:       '1587654780291-39c9404d746b',
  brandGsc:        '1614732414444-086425adebe5',
  brandKotobukiya: '1611532736597-de2d4265fba3',
  brandHasbro:     '1594736797933-d0401ba2fe65',
  brandFunko:      '1578632767115-351597cf2477',
  brandHotWheels:  '1568605117036-5fe5e7bab0b7',
}

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

  // ── Categories ─────────────────────────────────────────────────────────────
  const catFiguras = await prisma.category.upsert({
    where: { slug: 'figuras-accion' },
    update: {
      name: 'Figuras de Acción',
      description: 'Figuras articuladas de superhéroes, personajes de videojuegos y series de TV. Alta fidelidad de detalle para coleccionistas exigentes.',
      imageUrl: img(IMGS.catFiguras, 800, 400),
    },
    create: {
      name: 'Figuras de Acción',
      slug: 'figuras-accion',
      description: 'Figuras articuladas de superhéroes, personajes de videojuegos y series de TV. Alta fidelidad de detalle para coleccionistas exigentes.',
      imageUrl: img(IMGS.catFiguras, 800, 400),
    },
  })

  const catLego = await prisma.category.upsert({
    where: { slug: 'lego' },
    update: {
      name: 'LEGO',
      description: 'Sets oficiales LEGO: Star Wars, Harry Potter, Technic, City y más. Desde sets para principiantes hasta colecciones de experto.',
      imageUrl: img(IMGS.catLego, 800, 400),
    },
    create: {
      name: 'LEGO',
      slug: 'lego',
      description: 'Sets oficiales LEGO: Star Wars, Harry Potter, Technic, City y más. Desde sets para principiantes hasta colecciones de experto.',
      imageUrl: img(IMGS.catLego, 800, 400),
    },
  })

  const catModelos = await prisma.category.upsert({
    where: { slug: 'modelos-escala' },
    update: {
      name: 'Modelos a Escala',
      description: 'Réplicas de alta precisión de autos, aviones y motos a escala. Metal fundido y detalles auténticos para coleccionistas serios.',
      imageUrl: img(IMGS.catModelos, 800, 400),
    },
    create: {
      name: 'Modelos a Escala',
      slug: 'modelos-escala',
      description: 'Réplicas de alta precisión de autos, aviones y motos a escala. Metal fundido y detalles auténticos para coleccionistas serios.',
      imageUrl: img(IMGS.catModelos, 800, 400),
    },
  })

  const catAnime = await prisma.category.upsert({
    where: { slug: 'anime' },
    update: {
      name: 'Anime & Manga',
      description: 'Figuras oficiales de series anime: Dragon Ball, Naruto, One Piece, Demon Slayer y más. Importaciones directas de Japón.',
      imageUrl: img(IMGS.catAnime, 800, 400),
    },
    create: {
      name: 'Anime & Manga',
      slug: 'anime',
      description: 'Figuras oficiales de series anime: Dragon Ball, Naruto, One Piece, Demon Slayer y más. Importaciones directas de Japón.',
      imageUrl: img(IMGS.catAnime, 800, 400),
    },
  })

  console.log(`Categories: ${catFiguras.name}, ${catLego.name}, ${catModelos.name}, ${catAnime.name}`)

  // ── Brands ─────────────────────────────────────────────────────────────────
  const hasbro = await prisma.brand.upsert({
    where: { slug: 'hasbro' },
    update: {
      description: 'Fabricante estadounidense de juguetes y figuras de acción. Creadores de Marvel Legends, Star Wars Black Series y G.I. Joe.',
      imageUrl: img(IMGS.brandHasbro, 400, 400),
    },
    create: {
      name: 'Hasbro',
      slug: 'hasbro',
      description: 'Fabricante estadounidense de juguetes y figuras de acción. Creadores de Marvel Legends, Star Wars Black Series y G.I. Joe.',
      imageUrl: img(IMGS.brandHasbro, 400, 400),
    },
  })

  const bandai = await prisma.brand.upsert({
    where: { slug: 'bandai' },
    update: {
      description: 'Casa japonesa líder en figuras de anime y mecha. Creadores de la línea Robot Spirits, S.H.Figuarts y Dragon Stars.',
      imageUrl: img(IMGS.brandBandai, 400, 400),
    },
    create: {
      name: 'Bandai',
      slug: 'bandai',
      description: 'Casa japonesa líder en figuras de anime y mecha. Creadores de la línea Robot Spirits, S.H.Figuarts y Dragon Stars.',
      imageUrl: img(IMGS.brandBandai, 400, 400),
    },
  })

  const legoGroup = await prisma.brand.upsert({
    where: { slug: 'lego-group' },
    update: {
      description: 'La marca de construcción más reconocida del mundo. Desde Dinamarca, con sets para todas las edades y niveles de habilidad.',
      imageUrl: img(IMGS.brandLego, 400, 400),
    },
    create: {
      name: 'LEGO Group',
      slug: 'lego-group',
      description: 'La marca de construcción más reconocida del mundo. Desde Dinamarca, con sets para todas las edades y niveles de habilidad.',
      imageUrl: img(IMGS.brandLego, 400, 400),
    },
  })

  const goodSmile = await prisma.brand.upsert({
    where: { slug: 'good-smile-company' },
    update: {
      description: 'Fabricante japonés premium de figuras de anime. Creadores de las líneas Nendoroid, Figma y Pop Up Parade.',
      imageUrl: img(IMGS.brandGsc, 400, 400),
    },
    create: {
      name: 'Good Smile Company',
      slug: 'good-smile-company',
      description: 'Fabricante japonés premium de figuras de anime. Creadores de las líneas Nendoroid, Figma y Pop Up Parade.',
      imageUrl: img(IMGS.brandGsc, 400, 400),
    },
  })

  const kotobukiya = await prisma.brand.upsert({
    where: { slug: 'kotobukiya' },
    update: {
      description: 'Fabricante japonés especializado en kits de modelos y figuras ARTFX. Detalles escultóricos excepcionales en cada pieza.',
      imageUrl: img(IMGS.brandKotobukiya, 400, 400),
    },
    create: {
      name: 'Kotobukiya',
      slug: 'kotobukiya',
      description: 'Fabricante japonés especializado en kits de modelos y figuras ARTFX. Detalles escultóricos excepcionales en cada pieza.',
      imageUrl: img(IMGS.brandKotobukiya, 400, 400),
    },
  })

  const funko = await prisma.brand.upsert({
    where: { slug: 'funko' },
    update: {
      description: 'Creadores de los icónicos Funko POP! con más de 15,000 diseños de pop culture: anime, películas, videojuegos y más.',
      imageUrl: img(IMGS.brandFunko, 400, 400),
    },
    create: {
      name: 'Funko',
      slug: 'funko',
      description: 'Creadores de los icónicos Funko POP! con más de 15,000 diseños de pop culture: anime, películas, videojuegos y más.',
      imageUrl: img(IMGS.brandFunko, 400, 400),
    },
  })

  const hotWheels = await prisma.brand.upsert({
    where: { slug: 'hot-wheels' },
    update: {
      description: 'La marca de autos a escala más popular del mundo. Desde modelos básicos hasta la línea Premium de coleccionistas en metal fundido.',
      imageUrl: img(IMGS.brandHotWheels, 400, 400),
    },
    create: {
      name: 'Hot Wheels',
      slug: 'hot-wheels',
      description: 'La marca de autos a escala más popular del mundo. Desde modelos básicos hasta la línea Premium de coleccionistas en metal fundido.',
      imageUrl: img(IMGS.brandHotWheels, 400, 400),
    },
  })

  console.log(`Brands: ${bandai.name}, ${legoGroup.name}, ${goodSmile.name}, ${kotobukiya.name}, ${hasbro.name}, ${funko.name}, ${hotWheels.name}`)

  // ── Products ───────────────────────────────────────────────────────────────
  const p1 = await prisma.product.upsert({
    where: { sku: 'BND-DBZ-GOKU-001' },
    update: {
      images: { deleteMany: {} },
    },
    create: {
      sku: 'BND-DBZ-GOKU-001',
      slug: 'son-goku-super-saiyan-dragon-ball-z-bandai',
      name: 'Son Goku Super Saiyan — Dragon Ball Z',
      description: 'Figura articulada de Son Goku en forma Super Saiyan. Escala 1:10. Incluye accesorios de energía intercambiables. Fabricada por Bandai Spirits con pintura de alta definición.',
      price: 249.90,
      salePrice: 219.90,
      compareAtPrice: 299.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: true,
      categoryId: catAnime.id,
      brandId: bandai.id,
      images: {
        create: [
          { url: img(IMGS.goku), alt: 'Son Goku Super Saiyan frente', position: 0 },
          { url: img(IMGS.goku, 800, 600), alt: 'Son Goku Super Saiyan reverso', position: 1 },
        ],
      },
      inventory: {
        create: { availableStock: 15, reservedStock: 2, lowStockThreshold: 3 },
      },
    },
  })

  await prisma.productImage.createMany({
    data: [
      { productId: p1.id, url: img(IMGS.goku), alt: 'Son Goku Super Saiyan frente', position: 0 },
      { productId: p1.id, url: img(IMGS.goku, 800, 600), alt: 'Son Goku reverso', position: 1 },
    ],
    skipDuplicates: true,
  }).catch(() => {}) // Ignorar si ya existen

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
        create: [{ url: img(IMGS.eva01), alt: 'Evangelion Unit-01 frente', position: 0 }],
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
      salePrice: 539.90,
      compareAtPrice: 699.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: true,
      categoryId: catLego.id,
      brandId: legoGroup.id,
      images: {
        create: [{ url: img(IMGS.falcon), alt: 'Millennium Falcon LEGO', position: 0 }],
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
        create: [{ url: img(IMGS.makima), alt: 'Makima Pop Up Parade', position: 0 }],
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
      salePrice: 389.90,
      compareAtPrice: 529.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: false,
      categoryId: catAnime.id,
      brandId: kotobukiya.id,
      images: {
        create: [{ url: img(IMGS.naruto), alt: 'Naruto Sage Mode ARTFX J', position: 0 }],
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
        create: [{ url: img(IMGS.bugatti), alt: 'Bugatti Bolide LEGO Technic', position: 0 }],
      },
      inventory: {
        create: { availableStock: 7, reservedStock: 0, lowStockThreshold: 3 },
      },
    },
  })

  const p7 = await prisma.product.upsert({
    where: { sku: 'HAS-MAR-IRONMAN-001' },
    update: {},
    create: {
      sku: 'HAS-MAR-IRONMAN-001',
      slug: 'iron-man-mk85-marvel-legends-hasbro',
      name: 'Iron Man MK-85 — Marvel Legends',
      description: 'Figura articulada de Iron Man en la armadura Mark 85 de Avengers: Endgame. 16 cm, 20 puntos de articulación. Incluye efecto de reactores y 3 pares de manos.',
      price: 149.90,
      salePrice: 129.90,
      compareAtPrice: 179.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: true,
      categoryId: catFiguras.id,
      brandId: hasbro.id,
      images: {
        create: [{ url: img(IMGS.ironman), alt: 'Iron Man MK-85 Marvel Legends', position: 0 }],
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
        create: [{ url: img(IMGS.ferrari), alt: 'Ferrari SF90 Hot Wheels Premium', position: 0 }],
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
        create: [{ url: img(IMGS.luffy), alt: 'Luffy Gear 5 Funko POP', position: 0 }],
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
      salePrice: 1099.90,
      compareAtPrice: 1499.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: true,
      categoryId: catLego.id,
      brandId: legoGroup.id,
      images: {
        create: [{ url: img(IMGS.hogwarts), alt: 'Castillo de Hogwarts LEGO', position: 0 }],
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
        create: [{ url: img(IMGS.tanjiro), alt: 'Tanjiro Kamado Demon Slayer', position: 0 }],
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
      salePrice: 169.90,
      compareAtPrice: 249.90,
      currency: 'PEN',
      status: ProductStatus.AVAILABLE,
      featured: false,
      categoryId: catModelos.id,
      brandId: hotWheels.id,
      images: {
        create: [{ url: img(IMGS.f1), alt: 'Red Bull RB19 Hot Wheels F1', position: 0 }],
      },
      inventory: {
        create: { availableStock: 18, reservedStock: 0, lowStockThreshold: 4 },
      },
    },
  })

  console.log(`Products: ${[p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12].map(p => p.sku).join(', ')}`)

  // ── Inventory movements ────────────────────────────────────────────────────
  const stockEntries = [
    { product: p1, qty: 15 }, { product: p2, qty: 8  },
    { product: p3, qty: 5  }, { product: p4, qty: 3  },
    { product: p5, qty: 2  }, { product: p6, qty: 7  },
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
          { productId: p7.id,  quantity: 1, unitPrice: 149.90,  productName: p7.name,  productSku: p7.sku  },
          { productId: p8.id,  quantity: 1, unitPrice: 59.90,   productName: p8.name,  productSku: p8.sku  },
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
  await prisma.banner.upsert({
    where: { id: 'seed-banner-hero-01' },
    update: {
      title: 'Nueva Temporada 2026',
      subtitle: 'Figuras exclusivas de anime, Marvel y LEGO — importaciones directas',
      imageUrl: banner(IMGS.bannerHero),
      ctaLabel: 'Ver colección',
      ctaHref: '/catalogo',
      position: 0,
      active: true,
    },
    create: {
      id: 'seed-banner-hero-01',
      title: 'Nueva Temporada 2026',
      subtitle: 'Figuras exclusivas de anime, Marvel y LEGO — importaciones directas',
      imageUrl: banner(IMGS.bannerHero),
      ctaLabel: 'Ver colección',
      ctaHref: '/catalogo',
      position: 0,
      active: true,
    },
  })

  await prisma.banner.upsert({
    where: { id: 'seed-banner-promo-01' },
    update: {
      imageUrl: banner(IMGS.bannerLego),
      title: 'LEGO — Nuevos Sets',
      subtitle: 'Envío gratis en compras mayores a S/ 500',
    },
    create: {
      id: 'seed-banner-promo-01',
      title: 'LEGO — Nuevos Sets',
      subtitle: 'Envío gratis en compras mayores a S/ 500',
      imageUrl: banner(IMGS.bannerLego),
      ctaLabel: 'Ver LEGO',
      ctaHref: '/catalogo?cat=lego',
      position: 1,
      active: true,
    },
  })

  await prisma.banner.upsert({
    where: { id: 'seed-banner-anime-01' },
    update: {
      imageUrl: banner(IMGS.bannerAnime),
      title: 'Anime & Manga',
      subtitle: 'Dragon Ball, Demon Slayer, One Piece y más',
    },
    create: {
      id: 'seed-banner-anime-01',
      title: 'Anime & Manga',
      subtitle: 'Dragon Ball, Demon Slayer, One Piece y más',
      imageUrl: banner(IMGS.bannerAnime),
      ctaLabel: 'Explorar',
      ctaHref: '/catalogo?cat=anime',
      position: 2,
      active: true,
    },
  })

  await prisma.banner.upsert({
    where: { id: 'seed-banner-bf-01' },
    update: {
      imageUrl: banner(IMGS.bannerBlack),
    },
    create: {
      id: 'seed-banner-bf-01',
      title: 'Black Friday Anticipado',
      subtitle: 'Hasta 40% de descuento en figuras seleccionadas',
      imageUrl: banner(IMGS.bannerBlack),
      ctaLabel: 'Ver ofertas',
      ctaHref: '/catalogo',
      position: 3,
      active: false,
    },
  })

  console.log('Banners actualizados con imágenes de Unsplash')

  // ── Collections ────────────────────────────────────────────────────────────
  const colBestsellers = await prisma.collection.upsert({
    where: { slug: 'bestsellers-2025' },
    update: {
      description: 'Los productos más vendidos de Mirana Shop en 2025. Calidad garantizada por miles de coleccionistas.',
      imageUrl: img(IMGS.catFiguras, 1200, 400),
    },
    create: {
      name: 'Bestsellers 2025',
      slug: 'bestsellers-2025',
      description: 'Los productos más vendidos de Mirana Shop en 2025. Calidad garantizada por miles de coleccionistas.',
      imageUrl: img(IMGS.catFiguras, 1200, 400),
      active: true,
    },
  })

  const colAnime = await prisma.collection.upsert({
    where: { slug: 'anime-figures' },
    update: {
      description: 'La mejor selección de figuras anime: Dragon Ball, Naruto, One Piece, Demon Slayer y mucho más.',
      imageUrl: img(IMGS.catAnime, 1200, 400),
    },
    create: {
      name: 'Anime Figures',
      slug: 'anime-figures',
      description: 'La mejor selección de figuras anime: Dragon Ball, Naruto, One Piece, Demon Slayer y mucho más.',
      imageUrl: img(IMGS.catAnime, 1200, 400),
      active: true,
    },
  })

  const colLegoTechnic = await prisma.collection.upsert({
    where: { slug: 'lego-technic' },
    update: {
      description: 'Sets LEGO Technic de alta complejidad. Perfectos para ingenieros y amantes de los mecanismos reales.',
      imageUrl: img(IMGS.catLego, 1200, 400),
    },
    create: {
      name: 'LEGO Technic',
      slug: 'lego-technic',
      description: 'Sets LEGO Technic de alta complejidad. Perfectos para ingenieros y amantes de los mecanismos reales.',
      imageUrl: img(IMGS.catLego, 1200, 400),
      active: true,
    },
  })

  // Asociar productos a colecciones
  const associations = [
    { collectionId: colBestsellers.id, productId: p1.id },
    { collectionId: colBestsellers.id, productId: p3.id },
    { collectionId: colBestsellers.id, productId: p7.id },
    { collectionId: colBestsellers.id, productId: p10.id },
    { collectionId: colAnime.id, productId: p1.id },
    { collectionId: colAnime.id, productId: p2.id },
    { collectionId: colAnime.id, productId: p4.id },
    { collectionId: colAnime.id, productId: p5.id },
    { collectionId: colAnime.id, productId: p9.id },
    { collectionId: colAnime.id, productId: p11.id },
    { collectionId: colLegoTechnic.id, productId: p3.id },
    { collectionId: colLegoTechnic.id, productId: p6.id },
    { collectionId: colLegoTechnic.id, productId: p10.id },
  ]

  for (const assoc of associations) {
    await prisma.productCollection.upsert({
      where: { productId_collectionId: assoc },
      update: {},
      create: assoc,
    })
  }

  console.log(`Collections: ${colBestsellers.name}, ${colAnime.name}, ${colLegoTechnic.name}`)
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
