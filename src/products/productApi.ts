import { create } from "@bufbuild/protobuf";
import { PageInfoSchema, type PageInfo } from "../gen/common/v1/common_pb";
import type { TeamAccessItem } from "../gen/user_iface/v2/v2_user_pb";
import type { StockChangeType } from "../inventory/inventoryApi";

// ============================================================================
// FRONTEND-OWNED product types — intentionally NOT the generated proto types.
// The page is built against this seam now; a real Connect-RPC
// (warehouse_iface.InventoryService.ProductList / WarehouseService.SellingTeamList)
// is designed LATER and mapped INTO these shapes. Keep this file the single seam:
// swapping in the backend changes ONLY the bodies below, never the page.
// ============================================================================

/** One per-SKU row shown in the warehouse product list. */
export interface WarehouseProductRow {
  skuId: string;
  productId: string;
  variantId: string;
  productName: string;
  productRefId: string; // external/marketplace product ref
  variantRefId: string; // external/marketplace variant ref
  image: string; // thumbnail URL ("" = none)
  price: number; // IDR; a proto bigint price maps to number at the seam
  stockReady: number;
  stockPending: number;
  lastInboundMs?: number; // epoch millis; undefined = never (proto Timestamp -> ms at the seam)
  lastOutboundMs?: number;
  sellingTeamId: string; // owning sku team_id (string-encoded bigint) — drives the team filter
  sellingTeamName: string;
}

/** Dynamic selling-team option for the filter dropdown. */
export interface SellingTeamOption {
  id: string; // string-encoded bigint
  name: string;
}

export type ProductSortKey = "stockReady" | "stockPending" | "price" | "name";
export type SortDir = "asc" | "desc";

/** Which text field the search box matches against. */
export type ProductSearchType = "name" | "sku" | "ref";

export interface ProductListParams {
  warehouseId: string; // resolved via currentWarehouseId(team) — see seam below
  sellingTeamId?: string; // "" / undefined = all selling teams
  search?: string;
  searchType?: ProductSearchType;
  emptyStockOnly?: boolean; // only rows with stockReady === 0
  sortKey?: ProductSortKey;
  sortDir?: SortDir;
  page: number;
  limit: number;
}

export interface ProductListResult {
  rows: WarehouseProductRow[];
  pageInfo: PageInfo; // reuse the generated PageInfo so <Pagination> is unchanged
}

// ----------------------------------------------------------------------------
// SEAM: warehouse-id resolution — deferred to the backend plan. For now every
// warehouse team maps to one placeholder warehouse. The later RPC plan changes
// ONLY this function (e.g. a resolve RPC, or team metadata).
// ----------------------------------------------------------------------------
export function currentWarehouseId(team: TeamAccessItem | null): string {
  // TODO(backend): resolve the real warehouse_id for this warehouse team.
  return team ? `wh-${team.teamId.toString()}` : "wh-unknown";
}

// ----------------------------------------------------------------------------
// MOCK DATA + STUB IMPLEMENTATIONS.
// TODO(backend): replace the bodies of listWarehouseProducts / listSellingTeams
// with real InventoryService.ProductList / SellingTeamList calls. The signatures
// must stay identical so the page does not change.
// ----------------------------------------------------------------------------
const DELAY_MS = 350;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SELLING_TEAMS: SellingTeamOption[] = [
  { id: "101", name: "Acme Selling" },
  { id: "102", name: "Borneo Retail" },
  { id: "103", name: "Cahaya Store" },
];

function makeMockRows(): WarehouseProductRow[] {
  const names = ["Cotton Tee", "Denim Jacket", "Canvas Tote", "Wool Scarf", "Linen Shirt"];
  const rows: WarehouseProductRow[] = [];
  for (let i = 0; i < 47; i++) {
    // 47 rows -> exercises pagination (3 pages @ 20)
    const team = SELLING_TEAMS[i % SELLING_TEAMS.length];
    const ready = i % 7 === 0 ? 0 : (i * 3) % 120; // some zero-stock rows
    rows.push({
      skuId: `SKU-${1000 + i}`,
      productId: `P-${100 + i}`,
      variantId: `V-${200 + i}`,
      productName: `${names[i % names.length]} ${i + 1}`,
      productRefId: `PRD-${9000 + i}`,
      variantRefId: `VAR-${9000 + i}`,
      image: "",
      price: 50_000 + (i % 9) * 12_500,
      stockReady: ready,
      stockPending: (i * 2) % 35,
      lastInboundMs: i % 5 === 0 ? undefined : Date.now() - i * 36e5,
      lastOutboundMs: i % 4 === 0 ? undefined : Date.now() - i * 18e5,
      sellingTeamId: team.id,
      sellingTeamName: team.name,
    });
  }
  return rows;
}
const ALL_ROWS = makeMockRows();

export async function listSellingTeams(_warehouseId: string): Promise<SellingTeamOption[]> {
  await sleep(DELAY_MS);
  // TODO(backend): warehouse_iface.WarehouseService.SellingTeamList(warehouse_id)
  return SELLING_TEAMS;
}

export async function listWarehouseProducts(
  params: ProductListParams,
): Promise<ProductListResult> {
  await sleep(DELAY_MS);
  // TODO(backend): warehouse_iface.InventoryService.ProductList(filter, sort, page)

  let rows = ALL_ROWS;

  if (params.sellingTeamId) {
    rows = rows.filter((r) => r.sellingTeamId === params.sellingTeamId);
  }
  if (params.emptyStockOnly) {
    rows = rows.filter((r) => r.stockReady === 0);
  }
  const q = params.search?.trim().toLowerCase();
  if (q) {
    rows = rows.filter((r) => {
      switch (params.searchType) {
        case "sku":
          return r.skuId.toLowerCase().includes(q);
        case "ref":
          return (r.productRefId + " " + r.variantRefId).toLowerCase().includes(q);
        default:
          return r.productName.toLowerCase().includes(q);
      }
    });
  }
  if (params.sortKey) {
    const dir = params.sortDir === "asc" ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      switch (params.sortKey) {
        case "name":
          return a.productName.localeCompare(b.productName) * dir;
        case "price":
          return (a.price - b.price) * dir;
        case "stockPending":
          return (a.stockPending - b.stockPending) * dir;
        default:
          return (a.stockReady - b.stockReady) * dir; // stockReady
      }
    });
  }

  const total = rows.length;
  const limit = Math.max(params.limit, 1);
  const totalPage = Math.max(Math.ceil(total / limit), 1);
  const page = Math.min(Math.max(params.page, 1), totalPage);
  const start = (page - 1) * limit;
  const paged = rows.slice(start, start + limit);

  const pageInfo = create(PageInfoSchema, {
    currentPage: BigInt(page),
    totalPage: BigInt(totalPage),
    totalItems: BigInt(total),
  });

  return { rows: paged, pageInfo };
}

/** Format a frontend-owned epoch-millis field for display. */
export function formatMs(ms?: number): string {
  return ms ? new Date(ms).toLocaleString() : "—";
}

// ============================================================================
// PRODUCT DETAIL seam (per-SKU). Frontend-owned shapes mirroring the backend:
// WarehouseProduct (general+stock), InvTransaction restock/return (Created /
// Arrived / qty / amount + Supplier), StockPlacement (placements),
// StockPlacementLog (stock history), StockBatch{startCount,endCount,price}
// (price groups + batches). "amount" = count × price, computed here.
// TODO(backend): swap the bodies for inventory_iface/warehouse_iface clients.
// ============================================================================

export interface RestockInfo {
  supplier: string;
  createdMs: number;
  acceptedMs?: number;
  quantity: number;
  amount: number;
}

export interface ReturnInfo {
  createdMs: number;
  acceptedMs?: number;
  quantity: number;
  amount: number;
}

export interface ProductDetail {
  skuId: string;
  productId: string;
  productName: string;
  images: string[];
  sellingTeamName: string;
  price: number;
  readyCount: number;
  readyAmount: number;
  ongoingCount: number;
  ongoingAmount: number;
  lastRestock?: RestockInfo;
  lastReturn?: ReturnInfo;
}

export interface ProductPlacementRow {
  rackName: string;
  count: number;
}

// Stock history reuses the inventory change-type vocabulary (StockChangeType +
// STOCK_CHANGE_TYPE_LABELS live in inventory/inventoryApi).
export interface ProductStockHistoryItem {
  id: string;
  changeType: StockChangeType;
  change: number;
  balanceCount: number;
  userName: string;
  createdMs: number;
}

export interface ProductPriceGroup {
  price: number;
  readyCount: number;
  readyAmount: number;
}

export interface ProductBatch {
  id: string;
  createdMs: number;
  initCount: number;
  initAmount: number;
  readyCount: number;
  readyAmount: number;
  createdBy: string;
}

const SUPPLIERS = ["Acme Supply", "Borneo Textile", "Cahaya Goods", "Delta Imports"];
const HISTORY_TYPES: StockChangeType[] = [
  "RESTOCK",
  "ORDER_CREATED",
  "RETURN",
  "ADJUSTMENT",
  "TRANSFER",
  "ORDER_CANCELED",
];

function seedNum(skuId: string): number {
  let h = 0;
  for (let i = 0; i < skuId.length; i++) h = (h * 31 + skuId.charCodeAt(i)) >>> 0;
  return h || 1;
}

export async function getWarehouseProduct(
  skuId: string,
): Promise<ProductDetail | undefined> {
  await sleep(DELAY_MS);
  // TODO(backend): warehouse_iface.InventoryService.ProductDetail(sku_id)
  const row = ALL_ROWS.find((r) => r.skuId === skuId);
  if (!row) return undefined;
  const s = seedNum(skuId);

  const restockQty = (s % 30) + 5;
  const lastRestock: RestockInfo | undefined = row.lastInboundMs
    ? {
        supplier: SUPPLIERS[s % SUPPLIERS.length],
        createdMs: row.lastInboundMs,
        acceptedMs: row.lastInboundMs + 36e5,
        quantity: restockQty,
        amount: restockQty * row.price,
      }
    : undefined;

  const returnQty = (s % 7) + 1;
  const lastReturn: ReturnInfo | undefined = row.lastOutboundMs
    ? {
        createdMs: row.lastOutboundMs,
        acceptedMs: row.lastOutboundMs + 18e5,
        quantity: returnQty,
        amount: returnQty * row.price,
      }
    : undefined;

  return {
    skuId: row.skuId,
    productId: row.productId,
    productName: row.productName,
    images: row.image ? [row.image] : [],
    sellingTeamName: row.sellingTeamName,
    price: row.price,
    readyCount: row.stockReady,
    readyAmount: row.stockReady * row.price,
    ongoingCount: row.stockPending,
    ongoingAmount: row.stockPending * row.price,
    lastRestock,
    lastReturn,
  };
}

export async function listProductPlacements(
  skuId: string,
): Promise<ProductPlacementRow[]> {
  await sleep(DELAY_MS);
  // TODO(backend): inventory_iface.v1 ProductPlacementList(product_id)
  const row = ALL_ROWS.find((r) => r.skuId === skuId);
  if (!row) return [];
  const s = seedNum(skuId);
  const n = (s % 4) + 1; // 1..4 racks
  const zones = ["A", "B", "C", "D"];
  let remaining = row.stockReady;
  return Array.from({ length: n }, (_, i) => {
    const last = i === n - 1;
    const count = last ? remaining : Math.floor(remaining / (n - i));
    remaining -= count;
    return { rackName: `${zones[(s + i) % zones.length]}-${((s + i) % 20) + 1}`, count };
  });
}

export async function listProductStockHistory(
  skuId: string,
): Promise<ProductStockHistoryItem[]> {
  await sleep(DELAY_MS);
  // TODO(backend): inventory_iface.v1 ProductPlacementLog(product_id)
  const s = seedNum(skuId);
  const n = s % 10; // 0..9
  let balance = (s * 3) % 80;
  const users = ["andi", "budi", "citra", "dewi"];
  return Array.from({ length: n }, (_, i) => {
    const type = HISTORY_TYPES[(s + i) % HISTORY_TYPES.length];
    const outbound = type === "ORDER_CREATED" || type === "TRANSFER";
    const change = (outbound ? -1 : 1) * (((s + i) % 9) + 1);
    balance = Math.max(0, balance + change);
    return {
      id: `${skuId}-h-${i}`,
      changeType: type,
      change,
      balanceCount: balance,
      userName: users[(s + i) % users.length],
      createdMs: Date.now() - i * 4.2e6,
    };
  });
}

export async function listProductBatches(skuId: string): Promise<ProductBatch[]> {
  await sleep(DELAY_MS);
  // TODO(backend): inventory_iface.v1 ProductBatchList(product_id)
  const row = ALL_ROWS.find((r) => r.skuId === skuId);
  if (!row) return [];
  const s = seedNum(skuId);
  const n = (s % 3) + 1; // 1..3 batches
  const users = ["andi", "budi", "citra"];
  let remainingReady = row.stockReady;
  return Array.from({ length: n }, (_, i) => {
    const batchPrice = row.price + ((s + i) % 4) * 5_000; // a few price tiers
    const init = (s % 40) + 20;
    const last = i === n - 1;
    const ready = last ? remainingReady : Math.min(init, Math.floor(remainingReady / (n - i)));
    remainingReady = Math.max(0, remainingReady - ready);
    return {
      id: `${skuId}-b-${i}`,
      createdMs: Date.now() - (i + 1) * 6 * 864e5,
      initCount: init,
      initAmount: init * batchPrice,
      readyCount: ready,
      readyAmount: ready * batchPrice,
      createdBy: users[(s + i) % users.length],
    };
  });
}

export async function listProductPriceGroups(
  skuId: string,
): Promise<ProductPriceGroup[]> {
  await sleep(DELAY_MS);
  // TODO(backend): grouped from StockBatch by price.
  const row = ALL_ROWS.find((r) => r.skuId === skuId);
  if (!row) return [];
  const batches = await listProductBatches(skuId);
  const byPrice = new Map<number, ProductPriceGroup>();
  for (const b of batches) {
    if (b.readyCount <= 0) continue;
    const price = Math.round(b.readyAmount / b.readyCount); // batch unit price
    const g = byPrice.get(price) ?? { price, readyCount: 0, readyAmount: 0 };
    g.readyCount += b.readyCount;
    g.readyAmount += b.readyAmount;
    byPrice.set(price, g);
  }
  return [...byPrice.values()].sort((a, b) => a.price - b.price);
}
