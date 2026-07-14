import { createRouter, createWebHistory } from "@ionic/vue-router"

import TabbedView from "@/views/TabbedView.vue"

const routes = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "Home",
    component: () => import("@/views/Home.vue"),
  },
  {
    path: "/procurement",
    name: "Procurement",
    component: () => import("@/views/procurement/Dashboard.vue"),
  },
  {
    path: "/sales",
    name: "Sales",
    component: () => import("@/views/sales/Dashboard.vue"),
  },
  {
    path: "/ict",
    name: "ICT",
    component: () => import("@/views/ict/Dashboard.vue"),
  },
  {
    path: "/ict/new",
    name: "ICTFormView",
    component: () => import("@/views/ict/Form.vue"),
  },
  {
    path: "/ict/list",
    name: "ICTListView",
    component: () => import("@/views/ict/List.vue"),
  },
  {
    path: "/reservations",
    name: "Reservations",
    component: () => import("@/views/reservations/Dashboard.vue"),
  },
  {
    path: "/reservations/new",
    name: "ReservationsFormView",
    component: () => import("@/views/reservations/Form.vue"),
  },
  {
    path: "/reservations/list",
    name: "ReservationsListView",
    component: () => import("@/views/reservations/List.vue"),
  },
]

const router = createRouter({
  history: createWebHistory("/oil-ops"),
  routes,
})

export default router
