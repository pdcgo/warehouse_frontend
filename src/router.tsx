import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "./auth/LoginPage";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { UsersPage } from "./users/UsersPage";
import { OutgoingPaymentsPage } from "./payments/OutgoingPaymentsPage";
import { IncomingPaymentsPage } from "./payments/IncomingPaymentsPage";
import { BalanceLogPage } from "./balance/BalanceLogPage";
import { SettingsGeneralPage } from "./settings/SettingsGeneralPage";
import { PlaceholderPage } from "./components/PlaceholderPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      // `/` (and any route outside the team's menu) is redirected to the team's
      // default page by TeamRouteGuard in Layout.
      { path: "users", element: <UsersPage /> },
      { path: "payments/outgoing", element: <OutgoingPaymentsPage /> },
      { path: "payments/incoming", element: <IncomingPaymentsPage /> },
      { path: "balance-log", element: <BalanceLogPage /> },
      { path: "settings/general", element: <SettingsGeneralPage /> },
      // Warehouse pages (initial stubs — to be built out later).
      { path: "product", element: <PlaceholderPage title="Product" /> },
      { path: "inbound", element: <PlaceholderPage title="Inbound" /> },
      { path: "outbound", element: <PlaceholderPage title="Outbound" /> },
      // Add future pages here, plus an entry in nav.ts.
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
