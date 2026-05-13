import type { DashboardStats } from "@/types";

// TODO: remove mock
export const getDashboardStats = (): Promise<DashboardStats> => {
  const today = new Date();
  const revenueChart = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return {
      date: d.toISOString().split("T")[0],
      revenue: Math.floor(Math.random() * 2000) + 500,
    };
  });

  return Promise.resolve({
    totalRevenue: 42850,
    revenueChange: 12.5,
    totalOrders: 318,
    ordersChange: 8.2,
    totalCustomers: 204,
    customersChange: 5.1,
    totalProducts: 24,
    pendingOrders: 7,
    lowStockCount: 3,
    openReturns: 2,
    revenueChart,
    ordersByStatus: [
      { status: "PENDING", count: 7 },
      { status: "CONFIRMED", count: 12 },
      { status: "PROCESSING", count: 18 },
      { status: "SHIPPED", count: 24 },
      { status: "DELIVERED", count: 248 },
      { status: "CANCELLED", count: 6 },
      { status: "REFUNDED", count: 3 },
    ],
    topProducts: [
      {
        productId: "hoodie-black",
        name: "Classic Hoodie - Black",
        image: "/collections/hoodies/hoodieBlackMan.jpg",
        unitsSold: 89,
        revenue: 7565,
      },
      {
        productId: "boxers-white",
        name: "Signature Boxer - White",
        image: "/collections/boxers/boxersWhite.jpeg",
        unitsSold: 142,
        revenue: 6390,
      },
      {
        productId: "outlaw-glasses",
        name: "Outlaw Shades",
        image: "/collections/glases/outlawGlasses1.jpg",
        unitsSold: 67,
        revenue: 5025,
      },
      {
        productId: "bold-cap-black",
        name: "Bold Society Cap - Black",
        image: "/collections/headwear/boldSocietyCapBlack.jpg",
        unitsSold: 54,
        revenue: 2970,
      },
      {
        productId: "track-set",
        name: "Movement Track Set",
        image: "/collections/tracks/track.jpg",
        unitsSold: 28,
        revenue: 2660,
      },
    ],
  });
};
