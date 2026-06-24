import {
  BalanceIcon,
  GeneralIcon,
  InboundIcon,
  IncomingIcon,
  InvoiceIcon,
  OutboundIcon,
  OutgoingIcon,
  ProductIcon,
  SettingsIcon,
  UsersIcon,
  type IconComponent,
} from "./components/icons";
import { TeamType } from "./gen/user_iface/v2/v2_user_pb";

export interface NavLeaf {
  label: string;
  path: string;
  icon: IconComponent;
  // Team types this entry is shown for. Omit = visible to all team types.
  teamTypes?: TeamType[];
}

export interface NavGroup {
  label: string;
  icon: IconComponent;
  children: NavLeaf[];
  teamTypes?: TeamType[];
}

export type NavEntry = NavLeaf | NavGroup;

function visibleFor(entry: { teamTypes?: TeamType[] }, teamType: TeamType): boolean {
  return !entry.teamTypes || entry.teamTypes.includes(teamType);
}

// The menu for a given team type: drop entries (and group children) not tagged for it,
// and drop a group that ends up with no visible children.
export function navItemsFor(teamType: TeamType): NavEntry[] {
  const out: NavEntry[] = [];
  for (const item of navItems) {
    if (!visibleFor(item, teamType)) continue;
    if ("children" in item) {
      const children = item.children.filter((c) => visibleFor(c, teamType));
      if (children.length > 0) out.push({ ...item, children });
    } else {
      out.push(item);
    }
  }
  return out;
}

export function navLeavesFor(teamType: TeamType): NavLeaf[] {
  return navItemsFor(teamType).flatMap((i) => ("children" in i ? i.children : [i]));
}

// The default landing path for a team type (first visible leaf).
export function firstPathFor(teamType: TeamType): string | null {
  return navLeavesFor(teamType)[0]?.path ?? null;
}

// Whether a path is reachable for a team type (matches a visible leaf).
export function isPathAllowed(pathname: string, teamType: TeamType): boolean {
  return navLeavesFor(teamType).some(
    (l) => pathname === l.path || pathname.startsWith(l.path + "/"),
  );
}

// Title for the current route, derived from the master nav entries (deepest match wins).
export function pageTitle(pathname: string): string {
  const leaves = navItems.flatMap((i) => ("children" in i ? i.children : [i]));
  const match = leaves
    .filter((l) => pathname === l.path || pathname.startsWith(l.path + "/"))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.label ?? "";
}

// Master menu (source of truth). Add a page here + a route in router.tsx.
// `teamTypes` scopes an entry to specific team types; omit it for all-types entries.
export const navItems: NavEntry[] = [
  // Common to every team type (untagged).
  { label: "Users", path: "/users", icon: UsersIcon },
  // Warehouse only — initial stubs.
  { label: "Product", path: "/product", icon: ProductIcon, teamTypes: [TeamType.WAREHOUSE] },
  { label: "Inbound", path: "/inbound", icon: InboundIcon, teamTypes: [TeamType.WAREHOUSE] },
  { label: "Outbound", path: "/outbound", icon: OutboundIcon, teamTypes: [TeamType.WAREHOUSE] },
  // Selling only.
  {
    label: "Invoice",
    icon: InvoiceIcon,
    teamTypes: [TeamType.SELLING],
    children: [
      { label: "Outgoing Payments", path: "/payments/outgoing", icon: OutgoingIcon },
      { label: "Incoming Payments", path: "/payments/incoming", icon: IncomingIcon },
      { label: "Balance Log", path: "/balance-log", icon: BalanceIcon },
    ],
  },
  // Common to every team type (untagged).
  {
    label: "Settings",
    icon: SettingsIcon,
    children: [
      { label: "General", path: "/settings/general", icon: GeneralIcon },
    ],
  },
];
