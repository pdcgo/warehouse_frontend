import { create } from "@bufbuild/protobuf";
import { PageInfoSchema, type PageInfo } from "../gen/common/v1/common_pb";

// ============================================================================
// FRONTEND-OWNED inventory types — intentionally NOT the generated proto types.
// The pages are built against this seam now; the real Connect-RPCs
// (inventory_iface.v1: RackList / RackCreate / ProductPlacementList /
// ProductPlacementLog, and a NEW Opname/Adjust RPC) are wired LATER and mapped
// INTO these shapes. Keep this file the single seam: swapping in the backend
// changes ONLY the bodies below.
// Mirrors existing models: db_models.Rack / inventory_models.StockPlacement
// {rackId,productId,count} and StockPlacementLog{changeType,change,balanceCount}.
// "Opname" (stock-take) has no backend model yet — shaped here freely.
// ============================================================================

/** A storage rack in the warehouse (the placement list). */
export interface Rack {
  id: string; // string-encoded bigint
  name: string;
  itemCount: number; // total units placed on the rack (sum of placements)
  productCount: number; // distinct products on the rack
  createdMs: number; // epoch millis (proto Timestamp -> ms at the seam)
  lastOpnameMs?: number; // most recent stock-take time (undefined = never)
  lastOpnameBy?: string; // who did the most recent opname
}

/** A product currently placed on a rack (the "Product" tab). */
export interface RackProduct {
  productId: string;
  name: string;
  count: number;
}

/** Mirrors inventory_iface.v1.StockChangeType. */
export type StockChangeType =
  | "RESTOCK"
  | "RETURN"
  | "ADJUSTMENT"
  | "TRANSFER"
  | "ORDER_CREATED"
  | "ORDER_CANCELED"
  | "PROBLEM"
  | "FOUND_BACK";

export const STOCK_CHANGE_TYPE_LABELS: Record<StockChangeType, string> = {
  RESTOCK: "Restock",
  RETURN: "Return",
  ADJUSTMENT: "Adjustment",
  TRANSFER: "Transfer",
  ORDER_CREATED: "Order created",
  ORDER_CANCELED: "Order canceled",
  PROBLEM: "Problem",
  FOUND_BACK: "Found back",
};

/** One placement-history entry on a rack (the "Placement History" tab). */
export interface PlacementLogItem {
  id: string;
  productName: string;
  changeType: StockChangeType;
  change: number; // signed delta (+ in / − out)
  balanceCount: number; // rack count after the change
  userName: string;
  createdMs: number;
}

/** One stock-take/adjustment entry on a rack (the "Opname History" tab). */
export interface OpnameItem {
  id: string;
  createdMs: number;
  byUser: string;
  previousCount: number; // rack item count before the opname
  newCount: number; // counted/adjusted item count
  note: string;
}

export interface RackListParams {
  warehouseId: string;
  search?: string;
  page: number;
  limit: number;
}

export interface RackListResult {
  racks: Rack[];
  pageInfo: PageInfo; // reuse the generated PageInfo so <Pagination> is unchanged
}

export interface AdjustRackInput {
  name: string;
  itemCount: number;
  note: string;
  byUser: string;
}

// ----------------------------------------------------------------------------
// MOCK DATA + STUB IMPLEMENTATIONS.
// TODO(inventory): replace the bodies below with real inventory_iface client
// calls. Signatures must stay identical so the pages do not change.
// ----------------------------------------------------------------------------
const DELAY_MS = 300;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PRODUCT_POOL = [
  "Cotton Tee",
  "Denim Jacket",
  "Canvas Tote",
  "Wool Scarf",
  "Linen Shirt",
  "Leather Belt",
  "Knit Beanie",
  "Running Shoes",
];
const USER_POOL = ["andi", "budi", "citra", "dewi"];
const CHANGE_TYPES: StockChangeType[] = [
  "RESTOCK",
  "ORDER_CREATED",
  "RETURN",
  "ADJUSTMENT",
  "TRANSFER",
  "ORDER_CANCELED",
];

// Deterministic per-rack seed so a rack always shows the same data.
function seed(rackId: string): number {
  return Math.abs(Number(rackId)) || 1;
}

// Pure products-on-rack generator — drives both the Product tab and a rack's
// itemCount/productCount so list and detail stay consistent.
function rackProductsSync(rackId: string): RackProduct[] {
  const s = seed(rackId);
  const n = s % 6; // 0..5 products on the rack
  return Array.from({ length: n }, (_, i) => ({
    productId: `P-${100 + ((s + i) % 50)}`,
    name: PRODUCT_POOL[(s + i) % PRODUCT_POOL.length],
    count: ((s + i) * 3) % 40,
  }));
}

function makeSeedOpname(rackId: string, currentCount: number): OpnameItem[] {
  const s = seed(rackId);
  const n = (s % 3) + 1; // 1..3 entries
  const items: OpnameItem[] = [];
  let newCount = currentCount;
  for (let i = 0; i < n; i++) {
    const prev = Math.max(0, newCount + (((s + i) % 5) - 2));
    items.push({
      id: `${rackId}-op-${i}`,
      createdMs: Date.now() - i * 7 * 864e5, // ~weekly
      byUser: USER_POOL[(s + i) % USER_POOL.length],
      previousCount: prev,
      newCount,
      note: i % 2 === 0 ? "Cycle count" : "",
    });
    newCount = prev;
  }
  return items; // newest first
}

// Module-level stores so addRack/adjustRack persist across navigation per session.
const OPNAME_LOG: Record<string, OpnameItem[]> = {};
let RACKS: Rack[] = makeMockRacks();
let nextId = RACKS.length + 1;

function makeMockRacks(): Rack[] {
  const racks: Rack[] = [];
  for (let i = 1; i <= 23; i++) {
    // 23 racks -> exercises pagination (2 pages @ 20)
    const id = String(i);
    const zone = String.fromCharCode(65 + ((i - 1) % 4)); // A..D
    const num = String(i).padStart(2, "0");
    const products = rackProductsSync(id);
    const itemCount = products.reduce((sum, p) => sum + p.count, 0);
    const rack: Rack = {
      id,
      name: `${zone}-${num}`,
      itemCount,
      productCount: products.length,
      createdMs: Date.now() - i * 36e5,
    };
    if (i % 2 === 0) {
      // half the racks have an opname history
      const entries = makeSeedOpname(id, itemCount);
      OPNAME_LOG[id] = entries;
      rack.lastOpnameMs = entries[0].createdMs;
      rack.lastOpnameBy = entries[0].byUser;
    }
    racks.push(rack);
  }
  return racks;
}

export async function listRacks(params: RackListParams): Promise<RackListResult> {
  await sleep(DELAY_MS);
  // TODO(inventory): inventory_iface.v1 RackList(warehouse_id, search, page)
  let racks = RACKS;
  const q = params.search?.trim().toLowerCase();
  if (q) {
    racks = racks.filter((r) => r.name.toLowerCase().includes(q));
  }

  const total = racks.length;
  const limit = Math.max(params.limit, 1);
  const totalPage = Math.max(Math.ceil(total / limit), 1);
  const page = Math.min(Math.max(params.page, 1), totalPage);
  const start = (page - 1) * limit;
  const paged = racks.slice(start, start + limit);

  const pageInfo = create(PageInfoSchema, {
    currentPage: BigInt(page),
    totalPage: BigInt(totalPage),
    totalItems: BigInt(total),
  });
  return { racks: paged.map((r) => ({ ...r })), pageInfo };
}

export async function getRack(rackId: string): Promise<Rack | undefined> {
  await sleep(DELAY_MS);
  // TODO(inventory): inventory_iface.v1 RackGet(rack_id)
  const rack = RACKS.find((r) => r.id === rackId);
  return rack ? { ...rack } : undefined;
}

export async function addRack(_warehouseId: string, name: string): Promise<Rack> {
  await sleep(DELAY_MS);
  // TODO(inventory): inventory_iface.v1 RackCreate(warehouse_id, name)
  const rack: Rack = {
    id: String(nextId++),
    name,
    itemCount: 0,
    productCount: 0,
    createdMs: Date.now(),
  };
  RACKS = [rack, ...RACKS];
  return { ...rack };
}

// Edits the rack's info shown in the detail (name + item count) and records it
// as a stock-take: stamps last-opname info and appends an Opname History row.
export async function adjustRack(
  rackId: string,
  input: AdjustRackInput,
): Promise<Rack> {
  await sleep(DELAY_MS);
  // TODO(inventory): inventory_iface.v1 RackAdjust/Opname(rack_id, count, note)
  const rack = RACKS.find((r) => r.id === rackId);
  if (!rack) throw new Error("Rack not found");

  const previousCount = rack.itemCount;
  const now = Date.now();
  rack.name = input.name;
  rack.itemCount = input.itemCount;
  rack.lastOpnameMs = now;
  rack.lastOpnameBy = input.byUser;

  const entry: OpnameItem = {
    id: `${rackId}-op-${now}`,
    createdMs: now,
    byUser: input.byUser,
    previousCount,
    newCount: input.itemCount,
    note: input.note,
  };
  OPNAME_LOG[rackId] = [entry, ...(OPNAME_LOG[rackId] ?? [])];
  return { ...rack };
}

export async function listRackProducts(rackId: string): Promise<RackProduct[]> {
  await sleep(DELAY_MS);
  // TODO(inventory): inventory_iface.v1 ProductPlacementList(rack_id)
  return rackProductsSync(rackId);
}

export async function listRackPlacementLog(
  rackId: string,
): Promise<PlacementLogItem[]> {
  await sleep(DELAY_MS);
  // TODO(inventory): inventory_iface.v1 ProductPlacementLog(rack_id)
  const s = seed(rackId);
  const n = s % 9; // 0..8 history entries
  let balance = (s * 5) % 50;
  return Array.from({ length: n }, (_, i) => {
    const type = CHANGE_TYPES[(s + i) % CHANGE_TYPES.length];
    const outbound = type === "ORDER_CREATED" || type === "TRANSFER";
    const change = (outbound ? -1 : 1) * (((s + i) % 7) + 1);
    balance = Math.max(0, balance + change);
    return {
      id: `${rackId}-${i}`,
      productName: PRODUCT_POOL[(s + i) % PRODUCT_POOL.length],
      changeType: type,
      change,
      balanceCount: balance,
      userName: USER_POOL[(s + i) % USER_POOL.length],
      createdMs: Date.now() - i * 5.4e6,
    };
  });
}

export async function listRackOpnameLog(rackId: string): Promise<OpnameItem[]> {
  await sleep(DELAY_MS);
  // TODO(inventory): inventory_iface.v1 RackOpnameLog(rack_id)
  return OPNAME_LOG[rackId] ? OPNAME_LOG[rackId].map((o) => ({ ...o })) : [];
}

/** Format a frontend-owned epoch-millis field for display. */
export function formatMs(ms?: number): string {
  return ms ? new Date(ms).toLocaleString() : "—";
}
