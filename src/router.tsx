import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "./auth/LoginPage";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./home/HomePage";
import { UsersPage } from "./users/UsersPage";
import { AllUsersPage } from "./users/AllUsersPage";
import { OutgoingPaymentsPage } from "./payments/OutgoingPaymentsPage";
import { IncomingPaymentsPage } from "./payments/IncomingPaymentsPage";
import { BalanceLogPage } from "./balance/BalanceLogPage";
import { SettingsGeneralPage } from "./settings/SettingsGeneralPage";
import { ProductListPage } from "./products/ProductListPage";
import { ProductDetailPage } from "./products/ProductDetailPage";
import { RackListPage } from "./inventory/RackListPage";
import { RackDetailPage } from "./inventory/RackDetailPage";
import { OpnameListPage } from "./inventory/OpnameListPage";
import { OpnameSessionPage } from "./inventory/OpnameSessionPage";
import { RestockListPage } from "./inbound/RestockListPage";
import { RestockDetailPage } from "./inbound/RestockDetailPage";
import { ReturnListPage } from "./inbound/ReturnListPage";
import { ReturnDetailPage } from "./inbound/ReturnDetailPage";
import { OrderListPage } from "./orders/OrderListPage";
import { OrderDetailPage } from "./orders/OrderDetailPage";
import { TeamListPage } from "./team/TeamListPage";
import { TeamDetailPage } from "./team/TeamDetailPage";
import { ComponentsPage } from "./dev/ComponentsPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  // Dev-only component gallery — hidden from the sidebar and mounted outside the
  // team-gated Layout so TeamRouteGuard doesn't redirect it. Reach it at /components.
  {
    path: "/components",
    element: (
      <ProtectedRoute>
        <ComponentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      // `/` (and any route outside the team's menu) is redirected to the team's
      // default page by TeamRouteGuard in Layout — Home, being the first menu
      // entry for every team type, is that default.
      { path: "home", element: <HomePage /> },
      { path: "users", element: <UsersPage /> },
      { path: "all-users", element: <AllUsersPage /> },
      { path: "payments/outgoing", element: <OutgoingPaymentsPage /> },
      { path: "payments/incoming", element: <IncomingPaymentsPage /> },
      { path: "balance-log", element: <BalanceLogPage /> },
      { path: "settings/general", element: <SettingsGeneralPage /> },
      // Warehouse pages (initial stubs — to be built out later).
      { path: "product", element: <ProductListPage /> },
      { path: "product/:skuId", element: <ProductDetailPage /> },
      { path: "inventory/placements", element: <RackListPage /> },
      { path: "inventory/placements/:rackId", element: <RackDetailPage /> },
      { path: "inventory/opname", element: <OpnameListPage /> },
      { path: "inventory/opname/:sessionId", element: <OpnameSessionPage /> },
      { path: "inbound/restock", element: <RestockListPage /> },
      { path: "inbound/restock/:restockId", element: <RestockDetailPage /> },
      { path: "inbound/return", element: <ReturnListPage /> },
      { path: "inbound/return/:returnId", element: <ReturnDetailPage /> },
      { path: "order", element: <OrderListPage /> },
      { path: "order/:orderId", element: <OrderDetailPage /> },
      // Admin only — team management.
      { path: "team", element: <TeamListPage /> },
      { path: "team/:teamId", element: <TeamDetailPage /> },
      // Add future pages here, plus an entry in nav.ts.
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
