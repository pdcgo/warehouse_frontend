import {
  AllUsersIcon,
  BalanceIcon,
  GeneralIcon,
  HomeIcon,
  InboundIcon,
  IncomingIcon,
  InventoryIcon,
  InvoiceIcon,
  OpnameIcon,
  OrderIcon,
  OutgoingIcon,
  PlacementsIcon,
  ProductIcon,
  RestockIcon,
  ReturnIcon,
  SettingsIcon,
  TeamIcon,
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

// One step in a breadcrumb trail. `path` omitted = non-clickable (e.g. a group label,
// which has no route of its own).
export interface Crumb {
  label: string;
  path?: string;
}

// The leaf entry whose path best matches a route (deepest match wins), plus its parent
// group if it lives in one.
function matchLeaf(
  pathname: string,
): { group?: NavGroup; leaf: NavLeaf } | undefined {
  let best: { group?: NavGroup; leaf: NavLeaf } | undefined;
  const consider = (leaf: NavLeaf, group?: NavGroup) => {
    if (pathname !== leaf.path && !pathname.startsWith(leaf.path + "/")) return;
    if (!best || leaf.path.length > best.leaf.path.length) best = { group, leaf };
  };
  for (const item of navItems) {
    if ("children" in item) item.children.forEach((c) => consider(c, item));
    else consider(item);
  }
  return best;
}

// Title for the current route, derived from the master nav entries (deepest match wins).
export function pageTitle(pathname: string): string {
  return matchLeaf(pathname)?.leaf.label ?? "";
}

// Breadcrumb trail for a route: [group, page] when the page is inside a group, else just
// [page]. The group crumb has no `path` (groups aren't routable). Empty when nothing
// matches — detail/sub-pages supply their own trail via <PageHeader breadcrumb=...>.
export function breadcrumbFor(pathname: string): Crumb[] {
  const match = matchLeaf(pathname);
  if (!match) return [];
  const trail: Crumb[] = [];
  if (match.group) trail.push({ label: match.group.label });
  trail.push({ label: match.leaf.label, path: match.leaf.path });
  return trail;
}

// Master menu (source of truth). Add a page here + a route in router.tsx.
// `teamTypes` scopes an entry to specific team types; omit it for all-types entries.
export const navItems: NavEntry[] = [
  // Home — untagged, so it shows for every team type and is the default landing.
  { label: "Home", path: "/home", icon: HomeIcon },
  // Warehouse only — initial stubs.
  { label: "Product", path: "/product", icon: ProductIcon, teamTypes: [TeamType.WAREHOUSE] },
  {
    label: "Inventory",
    icon: InventoryIcon,
    teamTypes: [TeamType.WAREHOUSE],
    children: [
      { label: "Placement", path: "/inventory/placements", icon: PlacementsIcon },
      { label: "Opname", path: "/inventory/opname", icon: OpnameIcon },
    ],
  },
  {
    label: "Inbound",
    icon: InboundIcon,
    teamTypes: [TeamType.WAREHOUSE],
    children: [
      { label: "Restock", path: "/inbound/restock", icon: RestockIcon },
      { label: "Return", path: "/inbound/return", icon: ReturnIcon },
    ],
  },
  { label: "Order", path: "/order", icon: OrderIcon, teamTypes: [TeamType.WAREHOUSE] },
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
  // Admin only — manage all teams and their members.
  { label: "Team", path: "/team", icon: TeamIcon, teamTypes: [TeamType.ADMIN] },
  // Common to every team type (untagged) — Users sits just before Settings.
  { label: "My User", path: "/users", icon: UsersIcon },
  // Admin only — directory of all users across teams.
  { label: "All User", path: "/all-users", icon: AllUsersIcon, teamTypes: [TeamType.ADMIN] },
  {
    label: "Settings",
    icon: SettingsIcon,
    children: [
      { label: "General", path: "/settings/general", icon: GeneralIcon },
    ],
  },
];
