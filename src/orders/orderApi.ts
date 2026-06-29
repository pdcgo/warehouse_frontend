import { create } from "@bufbuild/protobuf";
import { PageInfoSchema, type PageInfo } from "../gen/common/v1/common_pb";

// ============================================================================
// FRONTEND-OWNED order (outbound fulfillment) types — the single seam. Real
// Connect-RPCs (warehouse_iface order/outbound list + accept/problem) are wired
// LATER and mapped into these shapes. Frontend-first with mock data.
// TODO(backend): swap the bodies for the real client; signatures stay identical.
// ============================================================================

export type OrderStatus = "PENDING" | "ACCEPTED" | "PROBLEM";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  PROBLEM: "Problem",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "orange",
  ACCEPTED: "green",
  PROBLEM: "red",
};

export const ORDER_STATUSES: OrderStatus[] = ["PENDING", "ACCEPTED", "PROBLEM"];

export interface OrderRow {
  id: string;
  orderRef: string;
  createdMs: number;
  sellingTeamName: string;
  itemCount: number;
  amount: number;
  status: OrderStatus;
}

export interface OrderItem {
  productName: string;
  sku: string;
  qty: number;
  price: number;
  amount: number;
}

export interface OrderHistoryItem {
  createdMs: number;
  status: OrderStatus;
  note: string;
  byUser: string;
}

export interface OrderDetail extends OrderRow {
  acceptedMs?: number;
  problemNote?: string;
  recipient: string;
  courier: string;
  items: OrderItem[];
  history: OrderHistoryItem[];
}

export interface OrderListParams {
  warehouseId: string;
  status: OrderStatus;
  search?: string;
  page: number;
  limit: number;
}

export interface OrderListResult {
  orders: OrderRow[];
  pageInfo: PageInfo;
}

// ----------------------------------------------------------------------------
// MOCK STORE.
// ----------------------------------------------------------------------------
const DELAY_MS = 300;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SELLING_TEAMS = ["Acme Selling", "Borneo Retail", "Cahaya Store"];
const PRODUCT_POOL = ["Cotton Tee", "Denim Jacket", "Canvas Tote", "Wool Scarf", "Linen Shirt"];
const COURIERS = ["JNE", "SiCepat", "AnterAja", "J&T"];
const RECIPIENTS = ["Andi P.", "Budi S.", "Citra W.", "Dewi K.", "Eka R."];

interface OrderRecord extends OrderDetail {}

function makeItems(seed: number): OrderItem[] {
  const n = (seed % 4) + 1;
  return Array.from({ length: n }, (_, i) => {
    const qty = ((seed + i) % 6) + 1;
    const price = 50_000 + ((seed + i) % 8) * 12_500;
    return {
      productName: PRODUCT_POOL[(seed + i) % PRODUCT_POOL.length],
      sku: `SKU-${1000 + ((seed + i) % 47)}`,
      qty,
      price,
      amount: qty * price,
    };
  });
}

function makeMockOrders(): OrderRecord[] {
  const out: OrderRecord[] = [];
  for (let i = 1; i <= 40; i++) {
    const status = ORDER_STATUSES[i % 3];
    const items = makeItems(i);
    const itemCount = items.reduce((s, it) => s + it.qty, 0);
    const amount = items.reduce((s, it) => s + it.amount, 0);
    const createdMs = Date.now() - i * 5.4e6;
    const history: OrderHistoryItem[] = [
      { createdMs, status: "PENDING", note: "Order received", byUser: "system" },
    ];
    let acceptedMs: number | undefined;
    let problemNote: string | undefined;
    if (status === "ACCEPTED") {
      acceptedMs = createdMs + 36e5;
      history.unshift({ createdMs: acceptedMs, status: "ACCEPTED", note: "Picked & packed", byUser: "andi" });
    } else if (status === "PROBLEM") {
      problemNote = "Stock mismatch on pick";
      history.unshift({ createdMs: createdMs + 18e5, status: "PROBLEM", note: problemNote, byUser: "budi" });
    }
    out.push({
      id: String(i),
      orderRef: `ORD-${20000 + i}`,
      createdMs,
      sellingTeamName: SELLING_TEAMS[i % SELLING_TEAMS.length],
      itemCount,
      amount,
      status,
      acceptedMs,
      problemNote,
      recipient: RECIPIENTS[i % RECIPIENTS.length],
      courier: COURIERS[i % COURIERS.length],
      items,
      history,
    });
  }
  return out;
}

const ORDERS: OrderRecord[] = makeMockOrders();

function toRow(o: OrderRecord): OrderRow {
  return {
    id: o.id,
    orderRef: o.orderRef,
    createdMs: o.createdMs,
    sellingTeamName: o.sellingTeamName,
    itemCount: o.itemCount,
    amount: o.amount,
    status: o.status,
  };
}

export async function listOrders(params: OrderListParams): Promise<OrderListResult> {
  await sleep(DELAY_MS);
  // TODO(backend): warehouse_iface OrderList(warehouse_id, status, search, page)
  let orders = ORDERS.filter((o) => o.status === params.status);
  const q = params.search?.trim().toLowerCase();
  if (q) {
    orders = orders.filter(
      (o) =>
        o.orderRef.toLowerCase().includes(q) ||
        o.recipient.toLowerCase().includes(q) ||
        o.sellingTeamName.toLowerCase().includes(q),
    );
  }

  const total = orders.length;
  const limit = Math.max(params.limit, 1);
  const totalPage = Math.max(Math.ceil(total / limit), 1);
  const page = Math.min(Math.max(params.page, 1), totalPage);
  const start = (page - 1) * limit;
  const paged = orders.slice(start, start + limit).map(toRow);

  const pageInfo = create(PageInfoSchema, {
    currentPage: BigInt(page),
    totalPage: BigInt(totalPage),
    totalItems: BigInt(total),
  });
  return { orders: paged, pageInfo };
}

export async function getOrder(orderId: string): Promise<OrderDetail | undefined> {
  await sleep(DELAY_MS);
  // TODO(backend): warehouse_iface OrderGet(order_id)
  const o = ORDERS.find((r) => r.id === orderId);
  return o ? { ...o, items: [...o.items], history: [...o.history] } : undefined;
}

export async function acceptOrder(orderId: string, byUser: string): Promise<void> {
  await sleep(DELAY_MS);
  // TODO(backend): warehouse_iface OrderAccept(order_id)
  const o = ORDERS.find((r) => r.id === orderId);
  if (!o) return;
  const now = Date.now();
  o.status = "ACCEPTED";
  o.acceptedMs = now;
  o.problemNote = undefined;
  o.history = [
    { createdMs: now, status: "ACCEPTED", note: "Picked & packed", byUser },
    ...o.history,
  ];
}

export async function flagOrderProblem(
  orderId: string,
  note: string,
  byUser: string,
): Promise<void> {
  await sleep(DELAY_MS);
  // TODO(backend): warehouse_iface OrderProblem(order_id, note)
  const o = ORDERS.find((r) => r.id === orderId);
  if (!o) return;
  const now = Date.now();
  o.status = "PROBLEM";
  o.problemNote = note;
  o.history = [
    { createdMs: now, status: "PROBLEM", note, byUser },
    ...o.history,
  ];
}
