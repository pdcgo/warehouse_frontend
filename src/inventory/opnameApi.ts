import { create } from "@bufbuild/protobuf";
import { PageInfoSchema, type PageInfo } from "../gen/common/v1/common_pb";
import { adjustRack, listRacks } from "./inventoryApi";

// ============================================================================
// FRONTEND-OWNED opname (stock-take) SESSION types — the single seam. The real
// inventory_iface RPCs are wired LATER and mapped into these shapes. "Opname"
// has no backend model yet, so shapes are defined freely. Completing a session
// applies the counts via inventoryApi.adjustRack so each rack's item count +
// per-rack Opname History stay consistent.
// ============================================================================

export type OpnameStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export const OPNAME_STATUS_LABELS: Record<OpnameStatus, string> = {
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const OPNAME_STATUS_COLORS: Record<OpnameStatus, string> = {
  IN_PROGRESS: "blue",
  COMPLETED: "green",
  CANCELLED: "gray",
};

export interface OpnameSession {
  id: string;
  name: string;
  status: OpnameStatus;
  createdMs: number;
  createdBy: string;
  rackCount: number;
  countedCount: number;
  discrepancyCount: number;
  completedMs?: number;
  completedBy?: string;
}

export interface OpnameLine {
  rackId: string;
  rackName: string;
  systemCount: number;
  countedCount: number | null; // null = not yet counted
}

export interface OpnameSessionDetail {
  session: OpnameSession;
  lines: OpnameLine[];
}

export interface OpnameSessionListResult {
  sessions: OpnameSession[];
  pageInfo: PageInfo;
}

// ----------------------------------------------------------------------------
// MOCK STORE + STUB IMPLEMENTATIONS.
// TODO(inventory): replace the bodies below with real inventory_iface client
// calls. Signatures must stay identical so the pages do not change.
// ----------------------------------------------------------------------------
const DELAY_MS = 300;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SESSIONS: OpnameSession[] = [];
const SESSION_LINES: Record<string, OpnameLine[]> = {};
let nextSessionId = 1;

function recompute(session: OpnameSession) {
  const lines = SESSION_LINES[session.id] ?? [];
  session.rackCount = lines.length;
  session.countedCount = lines.filter((l) => l.countedCount !== null).length;
  session.discrepancyCount = lines.filter(
    (l) => l.countedCount !== null && l.countedCount !== l.systemCount,
  ).length;
}

async function snapshotLines(warehouseId: string): Promise<OpnameLine[]> {
  const { racks } = await listRacks({ warehouseId, page: 1, limit: 9999 });
  return racks.map((r) => ({
    rackId: r.id,
    rackName: r.name,
    systemCount: r.itemCount,
    countedCount: null,
  }));
}

// One seeded completed + one in-progress session so the list isn't empty.
let seeded = false;
async function ensureSeed(warehouseId: string) {
  if (seeded) return;
  seeded = true;

  const doneLines = (await snapshotLines(warehouseId)).map((l, i) => ({
    ...l,
    countedCount: i % 4 === 0 ? l.systemCount + 1 : l.systemCount, // a few discrepancies
  }));
  const doneId = String(nextSessionId++);
  SESSION_LINES[doneId] = doneLines;
  const done: OpnameSession = {
    id: doneId,
    name: "Opname — last week",
    status: "COMPLETED",
    createdMs: Date.now() - 7 * 864e5,
    createdBy: "andi",
    rackCount: 0,
    countedCount: 0,
    discrepancyCount: 0,
    completedMs: Date.now() - 6 * 864e5,
    completedBy: "andi",
  };
  recompute(done);
  SESSIONS.unshift(done);

  const wipLines = (await snapshotLines(warehouseId)).map((l, i) => ({
    ...l,
    countedCount: i < 3 ? l.systemCount : null, // partially counted
  }));
  const wipId = String(nextSessionId++);
  SESSION_LINES[wipId] = wipLines;
  const wip: OpnameSession = {
    id: wipId,
    name: "Opname — this week",
    status: "IN_PROGRESS",
    createdMs: Date.now() - 2 * 864e5,
    createdBy: "budi",
    rackCount: 0,
    countedCount: 0,
    discrepancyCount: 0,
  };
  recompute(wip);
  SESSIONS.unshift(wip);
}

export async function listOpnameSessions(
  warehouseId: string,
  page: number,
  limit: number,
): Promise<OpnameSessionListResult> {
  await sleep(DELAY_MS);
  await ensureSeed(warehouseId);
  // TODO(inventory): inventory_iface.v1 OpnameSessionList(warehouse_id, page)

  const total = SESSIONS.length;
  const lim = Math.max(limit, 1);
  const totalPage = Math.max(Math.ceil(total / lim), 1);
  const p = Math.min(Math.max(page, 1), totalPage);
  const start = (p - 1) * lim;
  const paged = SESSIONS.slice(start, start + lim);

  const pageInfo = create(PageInfoSchema, {
    currentPage: BigInt(p),
    totalPage: BigInt(totalPage),
    totalItems: BigInt(total),
  });
  return { sessions: paged.map((s) => ({ ...s })), pageInfo };
}

export async function getOpnameSession(
  sessionId: string,
): Promise<OpnameSessionDetail | undefined> {
  await sleep(DELAY_MS);
  // TODO(inventory): inventory_iface.v1 OpnameSessionGet(session_id)
  const session = SESSIONS.find((s) => s.id === sessionId);
  if (!session) return undefined;
  return {
    session: { ...session },
    lines: (SESSION_LINES[sessionId] ?? []).map((l) => ({ ...l })),
  };
}

export async function createOpnameSession(
  warehouseId: string,
  name: string,
  byUser: string,
): Promise<OpnameSession> {
  await sleep(DELAY_MS);
  await ensureSeed(warehouseId);
  // TODO(inventory): inventory_iface.v1 OpnameSessionCreate(warehouse_id, name)
  const id = String(nextSessionId++);
  SESSION_LINES[id] = await snapshotLines(warehouseId);
  const session: OpnameSession = {
    id,
    name,
    status: "IN_PROGRESS",
    createdMs: Date.now(),
    createdBy: byUser,
    rackCount: 0,
    countedCount: 0,
    discrepancyCount: 0,
  };
  recompute(session);
  SESSIONS.unshift(session);
  return { ...session };
}

export async function countOpnameLine(
  sessionId: string,
  rackId: string,
  countedCount: number,
): Promise<void> {
  await sleep(DELAY_MS);
  // TODO(inventory): inventory_iface.v1 OpnameLineCount(session_id, rack_id, count)
  const line = (SESSION_LINES[sessionId] ?? []).find((l) => l.rackId === rackId);
  if (line) line.countedCount = countedCount;
  const session = SESSIONS.find((s) => s.id === sessionId);
  if (session) recompute(session);
}

export async function completeOpnameSession(
  sessionId: string,
  byUser: string,
): Promise<void> {
  await sleep(DELAY_MS);
  // TODO(inventory): inventory_iface.v1 OpnameSessionComplete(session_id)
  const session = SESSIONS.find((s) => s.id === sessionId);
  if (!session) return;
  const lines = SESSION_LINES[sessionId] ?? [];
  for (const line of lines) {
    if (line.countedCount === null || line.countedCount === line.systemCount) continue;
    await adjustRack(line.rackId, {
      name: line.rackName,
      itemCount: line.countedCount,
      note: `Opname: ${session.name}`,
      byUser,
    });
  }
  session.status = "COMPLETED";
  session.completedMs = Date.now();
  session.completedBy = byUser;
}

export async function cancelOpnameSession(sessionId: string): Promise<void> {
  await sleep(DELAY_MS);
  // TODO(inventory): inventory_iface.v1 OpnameSessionCancel(session_id)
  const session = SESSIONS.find((s) => s.id === sessionId);
  if (session) session.status = "CANCELLED";
}
