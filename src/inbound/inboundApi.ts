import { create } from "@bufbuild/protobuf";
import { PageInfoSchema, type PageInfo } from "../gen/common/v1/common_pb";

// ============================================================================
// FRONTEND-OWNED inbound types — intentionally NOT the generated proto types.
// Restock and Return share the Pending/Accepted/Problem status vocabulary and the
// list+detail shape. A real backend (warehouse_iface.InboundService) is wired in
// LATER and mapped INTO these shapes — swapping it changes ONLY the stub bodies.
// ============================================================================

// Real statuses map to these: waiting -> PENDING, ongoing/completed -> ACCEPTED,
// IsBroken / problem notes -> PROBLEM.
export type InboundStatus = "PENDING" | "ACCEPTED" | "PROBLEM";

export const INBOUND_STATUSES: InboundStatus[] = ["PENDING", "ACCEPTED", "PROBLEM"];

export const INBOUND_STATUS_LABELS: Record<InboundStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  PROBLEM: "Problem",
};

export const INBOUND_STATUS_COLORS: Record<InboundStatus, string> = {
  PENDING: "yellow",
  ACCEPTED: "green",
  PROBLEM: "red",
};

export interface InboundItemRow {
  sku: string;
  productName: string;
  count: number;
  price: number;
  total: number;
}

export interface RestockRow {
  id: string;
  receipt: string;
  supplier: string;
  createdMs: number;
  itemCount: number;
  amount: number;
  status: InboundStatus;
}

export interface ReturnRow {
  id: string;
  receipt: string;
  reason: string;
  orderId?: string;
  createdMs: number;
  itemCount: number;
  amount: number;
  status: InboundStatus;
}

export type RestockDetail = RestockRow & {
  acceptedMs?: number;
  createdBy: string;
  note?: string;
  items: InboundItemRow[];
};

export type ReturnDetail = ReturnRow & {
  acceptedMs?: number;
  createdBy: string;
  note?: string;
  items: InboundItemRow[];
};

export interface InboundListParams {
  warehouseId: string;
  status?: InboundStatus;
  page: number;
  limit: number;
}

export interface RestockListResult {
  rows: RestockRow[];
  pageInfo: PageInfo;
}

export interface ReturnListResult {
  rows: ReturnRow[];
  pageInfo: PageInfo;
}

// ----------------------------------------------------------------------------
// MOCK DATA + STUB IMPLEMENTATIONS.
// TODO(backend): replace the bodies with warehouse_iface.InboundService calls.
// Keep the signatures identical so the pages do not change.
// ----------------------------------------------------------------------------
const DELAY_MS = 300;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SUPPLIERS = ["Acme Supply", "Borneo Textile", "Cahaya Goods", "Dewi Fabrics"];
const PRODUCTS = ["Cotton Tee", "Denim Jacket", "Canvas Tote", "Wool Scarf", "Linen Shirt"];

function statusFor(i: number): InboundStatus {
  if (i % 7 === 0) return "PROBLEM";
  if (i % 3 === 0) return "ACCEPTED";
  return "PENDING";
}

function mockItems(seed: number): InboundItemRow[] {
  const n = (seed % 3) + 2;
  const items: InboundItemRow[] = [];
  for (let j = 0; j < n; j++) {
    const count = ((seed + j) * 4) % 40 || 8;
    const price = 25_000 + ((seed + j) % 6) * 5_000;
    items.push({
      sku: `SKU-${1000 + seed + j}`,
      productName: `${PRODUCTS[(seed + j) % PRODUCTS.length]} ${seed + j}`,
      count,
      price,
      total: count * price,
    });
  }
  return items;
}

function makeRestocks(): RestockRow[] {
  const rows: RestockRow[] = [];
  for (let i = 1; i <= 23; i++) {
    const items = mockItems(i);
    rows.push({
      id: `RST-${String(i).padStart(4, "0")}`,
      receipt: `RCP-${9000 + i}`,
      supplier: SUPPLIERS[i % SUPPLIERS.length],
      createdMs: Date.now() - i * 36e5,
      itemCount: items.reduce((a, b) => a + b.count, 0),
      amount: items.reduce((a, b) => a + b.total, 0),
      status: statusFor(i),
    });
  }
  return rows;
}

function makeReturns(): ReturnRow[] {
  const reasons = ["Wrong item", "Damaged", "Customer cancel", "Size mismatch"];
  const rows: ReturnRow[] = [];
  for (let i = 1; i <= 20; i++) {
    const items = mockItems(i + 50);
    rows.push({
      id: `RET-${String(i).padStart(4, "0")}`,
      receipt: `RTR-${8000 + i}`,
      reason: reasons[i % reasons.length],
      orderId: i % 2 === 0 ? `ORD-${7000 + i}` : undefined,
      createdMs: Date.now() - i * 24e5,
      itemCount: items.reduce((a, b) => a + b.count, 0),
      amount: items.reduce((a, b) => a + b.total, 0),
      status: statusFor(i),
    });
  }
  return rows;
}

const ALL_RESTOCKS = makeRestocks();
const ALL_RETURNS = makeReturns();

function paginate<T>(all: T[], page: number, limit: number): { rows: T[]; pageInfo: PageInfo } {
  const total = all.length;
  const lim = Math.max(limit, 1);
  const totalPage = Math.max(Math.ceil(total / lim), 1);
  const cur = Math.min(Math.max(page, 1), totalPage);
  const start = (cur - 1) * lim;
  const pageInfo = create(PageInfoSchema, {
    currentPage: BigInt(cur),
    totalPage: BigInt(totalPage),
    totalItems: BigInt(total),
  });
  return { rows: all.slice(start, start + lim), pageInfo };
}

export async function listRestocks(params: InboundListParams): Promise<RestockListResult> {
  await sleep(DELAY_MS);
  const filtered = params.status
    ? ALL_RESTOCKS.filter((r) => r.status === params.status)
    : ALL_RESTOCKS;
  return paginate(filtered, params.page, params.limit);
}

export async function getRestock(id: string): Promise<RestockDetail | undefined> {
  await sleep(DELAY_MS);
  const row = ALL_RESTOCKS.find((r) => r.id === id);
  if (!row) return undefined;
  const seed = Number(row.id.replace(/\D/g, "")) || 1;
  return {
    ...row,
    acceptedMs: row.status === "ACCEPTED" ? row.createdMs + 18e5 : undefined,
    createdBy: "Gudang Staff",
    note: row.status === "PROBLEM" ? "Quantity mismatch on arrival" : undefined,
    items: mockItems(seed),
  };
}

export async function listReturns(params: InboundListParams): Promise<ReturnListResult> {
  await sleep(DELAY_MS);
  const filtered = params.status
    ? ALL_RETURNS.filter((r) => r.status === params.status)
    : ALL_RETURNS;
  return paginate(filtered, params.page, params.limit);
}

export async function getReturn(id: string): Promise<ReturnDetail | undefined> {
  await sleep(DELAY_MS);
  const row = ALL_RETURNS.find((r) => r.id === id);
  if (!row) return undefined;
  const seed = (Number(row.id.replace(/\D/g, "")) || 1) + 50;
  return {
    ...row,
    acceptedMs: row.status === "ACCEPTED" ? row.createdMs + 12e5 : undefined,
    createdBy: "Gudang Staff",
    note: row.status === "PROBLEM" ? "Returned items damaged" : undefined,
    items: mockItems(seed),
  };
}
