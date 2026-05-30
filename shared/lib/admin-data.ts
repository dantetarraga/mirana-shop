export const ORDERS_DATA = [
  { id: "#MIR-2847", customer: "Carlos Mendoza",  email: "carlos.m@gmail.com",       date: "2026-05-28", status: "pendiente", payment: "Tarjeta",      items: [{ name: "Iron Man Hall of Armor",      qty: 1, price: 299.99 }, { name: "Spider-Man Legends", qty: 2, price: 29.99 }], city: "Lima" },
  { id: "#MIR-2846", customer: "Andrea Rivas",    email: "andrea.r@hotmail.com",      date: "2026-05-28", status: "enviado",   payment: "Culqi",        items: [{ name: "LEGO Millennium Falcon",       qty: 1, price: 159.99 }], city: "Arequipa" },
  { id: "#MIR-2845", customer: "Diego Fuentes",   email: "diego.f@gmail.com",         date: "2026-05-27", status: "entregado", payment: "Tarjeta",      items: [{ name: "Goku Ultra Instinct",          qty: 1, price: 54.99  }], city: "Trujillo" },
  { id: "#MIR-2844", customer: "María López",     email: "maria.lopez@outlook.com",   date: "2026-05-27", status: "entregado", payment: "Tarjeta",      items: [{ name: "LEGO Technic Lamborghini",     qty: 1, price: 199.99 }], city: "Cusco" },
  { id: "#MIR-2843", customer: "José Torres",     email: "jose.t@gmail.com",          date: "2026-05-26", status: "pendiente", payment: "Transferencia",items: [{ name: "Hot Wheels Premium Set",        qty: 3, price: 24.99  }], city: "Iquitos" },
  { id: "#MIR-2842", customer: "Sofía Paredes",   email: "sofia.p@gmail.com",         date: "2026-05-26", status: "enviado",   payment: "Culqi",        items: [{ name: "Gundam RX-78-2 MG",            qty: 1, price: 89.99  }], city: "Piura" },
  { id: "#MIR-2841", customer: "Roberto Díaz",    email: "roberto.d@yahoo.com",       date: "2026-05-25", status: "entregado", payment: "Tarjeta",      items: [{ name: "Ferrari 488 Escala 1:18",       qty: 1, price: 74.99  }], city: "Lima" },
  { id: "#MIR-2840", customer: "Lucía Herrera",   email: "lucia.h@gmail.com",         date: "2026-05-25", status: "cancelado", payment: "Tarjeta",      items: [{ name: "Batman Dark Knight",            qty: 1, price: 34.99  }], city: "Lima" },
];

export const USERS_DATA = [
  { id: 1, name: "Carlos Mendoza", email: "carlos.m@gmail.com",       joined: "2023-04-12", orders: 14, spent: 2847.50, status: "vip" },
  { id: 2, name: "Andrea Rivas",   email: "andrea.r@hotmail.com",      joined: "2025-11-03", orders: 3,  spent: 419.97,  status: "activo" },
  { id: 3, name: "Diego Fuentes",  email: "diego.f@gmail.com",         joined: "2021-08-19", orders: 23, spent: 4120.80, status: "vip" },
  { id: 4, name: "María López",    email: "maria.lopez@outlook.com",   joined: "2024-02-27", orders: 8,  spent: 1340.00, status: "activo" },
  { id: 5, name: "José Torres",    email: "jose.t@gmail.com",          joined: "2024-06-15", orders: 11, spent: 980.25,  status: "activo" },
  { id: 6, name: "Lucía Herrera",  email: "lucia.h@gmail.com",         joined: "2026-03-30", orders: 1,  spent: 34.99,   status: "nuevo" },
];

export const BANNERS_DATA = [
  { id: 1, title: "Nueva Temporada 2026",   subtitle: "Colecciona lo extraordinario", cta: "Ver Catálogo",    position: "Hero principal",    status: "activo",     clicks: 8420  },
  { id: 2, title: "Ediciones Limitadas",    subtitle: "Piezas por tiempo limitado",   cta: "Explorar ahora",  position: "Banda CTA",         status: "activo",     clicks: 3210  },
  { id: 3, title: "Envío Gratis +$75",      subtitle: "En todos los pedidos",         cta: "Comprar",         position: "Marquee superior",  status: "activo",     clicks: 12750 },
  { id: 4, title: "Black Friday Anticipado",subtitle: "Hasta 40% de descuento",       cta: "Ver ofertas",     position: "Hero principal",    status: "programado", clicks: 0     },
  { id: 5, title: "Rebajas de Verano",      subtitle: "Liquidación de temporada",     cta: "Aprovecha",       position: "Banda CTA",         status: "inactivo",   clicks: 5640  },
];

export const SALES_DATA = [
  { m: "Jun", v: 38.2 }, { m: "Jul", v: 42.5 }, { m: "Ago", v: 39.8 }, { m: "Sep", v: 47.1 },
  { m: "Oct", v: 52.3 }, { m: "Nov", v: 68.9 }, { m: "Dic", v: 84.2 }, { m: "Ene", v: 51.4 },
  { m: "Feb", v: 49.7 }, { m: "Mar", v: 58.3 }, { m: "Abr", v: 62.1 }, { m: "May", v: 71.6 },
];

export const ORDERS_DAILY = Array.from({ length: 14 }, (_, i) => ({
  d: `D${i + 1}`,
  v: [12, 15, 9, 18, 22, 17, 25, 21, 19, 28, 24, 31, 27, 34][i],
}));

export const CATEGORY_PIE = [
  { name: "Figuras",    value: 54 },
  { name: "LEGO",       value: 31 },
  { name: "Vehículos",  value: 15 },
];

export const PIE_COLORS = ["#58aaff", "#5f9eff", "#7b5fff"];

export const SPARK = {
  revenue: [42, 45, 41, 48, 52, 49, 58, 55, 62, 68, 64, 71, 69, 72],
  orders:  [8,  9,  7,  11, 13, 10, 15, 14, 12, 18, 16, 21, 19, 24],
  users:   [2,  3,  2,  4,  3,  5,  4,  6,  5,  7,  6,  8,  9,  11],
  ticket:  [95, 98, 92, 101,99, 105,110,108,115,112,118,121,119,124],
};
