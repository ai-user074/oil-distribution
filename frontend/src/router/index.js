import { createRouter, createWebHistory } from "@ionic/vue-router"

const routes = [
  {
    path: "/",
    redirect: "/dashboards",
  },
  {
    path: "/dashboards",
    name: "Dashboard",
    component: () => import("@/views/Dashboards.vue"),
  },
  {
    path: "/procurement",
    name: "Procurement",
    component: () => import("@/views/Procurement.vue"),
  },
  {
    path: "/sales",
    name: "Sales",
    component: () => import("@/views/Sales.vue"),
  },
  {
    path: "/ict",
    name: "ICT",
    component: () => import("@/views/ICT.vue"),
  },
  {
    path: "/reservations",
    name: "Reservation",
    component: () => import("@/views/Reservations.vue"),
  },
  {
    path: "/command-center",
    name: "CommandCenter",
    component: () => import("@/views/CommandCenter.vue"),
  },
  {
    path: "/stock",
    name: "StockDashboard",
    component: () => import("@/views/StockDashboard.vue"),
  },
  {
    path: "/customers",
    name: "Customers",
    component: () => import("@/views/Customers.vue"),
  },
  {
    path: "/suppliers",
    name: "Suppliers",
    component: () => import("@/views/Suppliers.vue"),
  },
  {
    path: "/items",
    name: "Items",
    component: () => import("@/views/Items.vue"),
  },
]

const router = createRouter({
  history: createWebHistory("/oil-ops"),
  routes,
})

export default router
