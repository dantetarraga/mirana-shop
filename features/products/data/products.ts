export type ProductCategory = "figures" | "lego" | "vehicles";

export interface Product {
  id: number;
  name: string;
  cat: ProductCategory;
  price: number;
  badge: string | null;
  rating: number;
  reviews: number;
  isNew: boolean;
  stock: number;
  sku: string;
  desc: string;
  brand?: string;
}

export const CAT_LABELS: Record<ProductCategory, string> = {
  figures: "Figura de Acción",
  lego: "Set LEGO",
  vehicles: "Modelo Escala",
};

export const CAT_STRIPE: Record<ProductCategory, string> = {
  figures: "stripe-fig",
  lego: "stripe-lego",
  vehicles: "stripe-veh",
};

export const PRODUCTS: Product[] = [
  {
    id: 1, name: "Spider-Man Legends", cat: "figures", price: 29.99, badge: "NUEVO",
    rating: 4.8, reviews: 124, isNew: true, stock: 42, sku: "FIG-MAR-001",
    desc: "Figura articulada de 15 cm con 32 puntos de articulación y 4 accesorios intercambiables. Pintura facial print de alta definición. Compatible con el universo Marvel Legends Series.",
  },
  {
    id: 2, name: "Gundam RX-78-2 MG", cat: "figures", price: 89.99, badge: "BESTSELLER",
    rating: 4.9, reviews: 87, isNew: true, stock: 18, sku: "FIG-BAN-014",
    desc: "Master Grade 1:100. Más de 300 piezas con inner frame completo y paneles de color individuales. Soporte articulado incluido. Para constructores avanzados.",
  },
  {
    id: 3, name: "LEGO Millennium Falcon", cat: "lego", price: 159.99, badge: "ED. LIMITADA",
    rating: 5.0, reviews: 203, isNew: false, stock: 5, sku: "LEG-SW-022",
    desc: "7,541 piezas. El set más icónico de la galaxia. Incluye 7 minifiguras exclusivas. Sistema de paneles intercambiables. Para mayores de 16 años.",
  },
  {
    id: 4, name: "Hot Wheels Premium Set", cat: "vehicles", price: 24.99, badge: null,
    rating: 4.5, reviews: 56, isNew: false, stock: 128, sku: "VEH-HW-007",
    desc: "Set de 5 vehículos premium con carrocería de metal fundido, ruedas de goma y detalles de coleccionista de alta gama.",
  },
  {
    id: 5, name: "Optimus Prime Deluxe", cat: "figures", price: 49.99, badge: "NUEVO",
    rating: 4.7, reviews: 91, isNew: true, stock: 24, sku: "FIG-HAS-031",
    desc: "Transformers Studio Series. Se transforma en camión en 30 pasos. 21 cm de alto. Compatible con el sistema de display de la línea Studio Series.",
  },
  {
    id: 6, name: "Naruto Sage Mode", cat: "figures", price: 39.99, badge: null,
    rating: 4.6, reviews: 78, isNew: false, stock: 0, sku: "FIG-GSC-019",
    desc: "Figura coleccionable con efectos de chakra intercambiables. 3 expresiones faciales. 17 cm de altura con base articulada incluida.",
  },
  {
    id: 7, name: "LEGO Technic Lamborghini", cat: "lego", price: 199.99, badge: "PREMIUM",
    rating: 4.9, reviews: 165, isNew: false, stock: 8, sku: "LEG-TEC-042",
    desc: "3,696 piezas. Motor V12 funcional con pistones móviles, transmisión de 8 velocidades y dirección activa. Escala 1:8. Incluye libro de instrucciones exclusivo.",
  },
  {
    id: 8, name: "Batman Dark Knight", cat: "figures", price: 34.99, badge: null,
    rating: 4.4, reviews: 43, isNew: false, stock: 36, sku: "FIG-MCF-008",
    desc: "DC Multiverse. Traje de armadura de titanio con capa de tela real. 18 cm, 22 puntos de articulación y 3 accesorios intercambiables.",
  },
  {
    id: 9, name: "Ferrari 488 Escala 1:18", cat: "vehicles", price: 74.99, badge: "COLECCIONABLE",
    rating: 4.8, reviews: 67, isNew: true, stock: 14, sku: "VEH-BUR-003",
    desc: "Modelo de metal fundido a presión. Puertas, cofre y capó abribles. Interior completamente detallado. Acabado en rojo Ferrari auténtico.",
  },
  {
    id: 10, name: "Goku Ultra Instinct", cat: "figures", price: 54.99, badge: "BESTSELLER",
    rating: 4.9, reviews: 189, isNew: false, stock: 67, sku: "FIG-BAN-027",
    desc: "Dragon Ball Super. Efectos de aura plateada intercambiables, 3 expresiones faciales distintas. 17 cm de altura con base temática incluida.",
  },
  {
    id: 11, name: "LEGO Eiffel Tower", cat: "lego", price: 119.99, badge: null,
    rating: 4.7, reviews: 112, isNew: false, stock: 3, sku: "LEG-ARC-011",
    desc: "10,001 piezas. Torre Eiffel a escala real con detalles arquitectónicos auténticos. La estructura más alta jamás construida en LEGO.",
  },
  {
    id: 12, name: "Iron Man Hall of Armor", cat: "figures", price: 299.99, badge: "EXCLUSIVO",
    rating: 5.0, reviews: 34, isNew: true, stock: 2, sku: "FIG-EXC-001",
    desc: "Diorama premium con 7 armaduras intercambiables e iluminación LED integrada. Edición de coleccionista numerada. Solo 500 unidades mundiales.",
  },
];

export const BRANDS = [
  { name: "MARVEL",      sub: "LEGENDS SERIES",         style: "" },
  { name: "LEGO®",       sub: "OFFICIAL PARTNER",        style: "font-serif" },
  { name: "BANDAI",      sub: "TAMASHII NATIONS",        style: "" },
  { name: "HOT WHEELS",  sub: "PREMIUM COLLECTION",      style: "italic" },
  { name: "HASBRO",      sub: "GLOBAL RETAILER",         style: "" },
  { name: "McFARLANE",   sub: "TOYS",                    style: "italic" },
  { name: "FUNKO",       sub: "POP! AUTHORIZED",         style: "font-mono" },
  { name: "MATTEL",      sub: "CREATIONS",               style: "font-serif" },
  { name: "GOOD SMILE",  sub: "COMPANY · NENDOROID",     style: "" },
  { name: "KOTOBUKIYA",  sub: "ARTFX SERIES",            style: "font-mono" },
];

export const REVIEWS = [
  {
    name: "Carlos M.", role: "Coleccionista · 3 años", initials: "CM", stars: 5,
    text: "La calidad de las figuras es absurda. Pedí el Iron Man Hall of Armor y llegó con un empaque que da miedo abrir. Es mi tienda fija.",
  },
  {
    name: "Andrea R.", role: "Cliente nuevo", initials: "AR", stars: 5,
    text: "Compré el LEGO Millennium Falcon como regalo y el unboxing fue una experiencia. Envío en 48h y todo perfecto.",
  },
  {
    name: "Diego F.", role: "Coleccionista · 5 años", initials: "DF", stars: 5,
    text: "Llevo más de 20 piezas compradas. Las ediciones limitadas se agotan rápido pero el equipo siempre responde por WhatsApp.",
  },
  {
    name: "María L.", role: "Cliente recurrente", initials: "ML", stars: 4,
    text: "Excelente catálogo de figuras de anime. El Goku Ultra Instinct superó mis expectativas — la pintura es de otro nivel.",
  },
  {
    name: "José T.", role: "Padre coleccionista", initials: "JT", stars: 5,
    text: "Mi hijo y yo compramos juntos cada mes. El servicio es impecable y los precios son justos para la calidad premium.",
  },
  {
    name: "Sofía P.", role: "Coleccionista · 2 años", initials: "SP", stars: 5,
    text: "La curaduría de productos es lo mejor — no encuentras este nivel en otra tienda online en español. Recomendado 100%.",
  },
];
