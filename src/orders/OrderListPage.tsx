import { useCallback, useEffect, useState } from "react";
import { Button, Field, HStack, Input, Stack, Tabs } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useTeam } from "../team/TeamContext";
import { TeamScopeGate } from "../team/TeamScopeGate";
import { PageHeader } from "../components/PageHeader";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { Pagination } from "../payments/Pagination";
import { currentWarehouseId } from "../products/productApi";
import type { PageInfo } from "../gen/common/v1/common_pb";
import {
  listOrders,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type OrderRow,
  type OrderStatus,
} from "./orderApi";
import { OrderTable } from "./OrderTable";

const LIMIT = 20;

export function OrderListPage() {
  const { currentTeam } = useTeam();
  const navigate = useNavigate();
  const warehouseId = currentWarehouseId(currentTeam);

  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (toPage: number, st: OrderStatus) => {
      if (!currentTeam) return;
      setLoading(true);
      try {
        const res = await listOrders({ warehouseId, status: st, search, page: toPage, limit: LIMIT });
        setOrders(res.orders);
        setPageInfo(res.pageInfo);
        setPage(toPage);
      } catch (err) {
        toaster.create({
          title: "Failed to load orders",
          description: errMessage(err),
          type: "error",
        });
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [currentTeam, warehouseId, search],
  );

  // Reload page 1 on team change or status-tab change.
  useEffect(() => {
    void load(1, status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeam?.teamId, status]);

  return (
    <Stack gap={6}>
      <PageHeader>
        <Button
          variant="outline"
          disabled={!currentTeam}
          loading={loading}
          onClick={() => void load(page, status)}
        >
          Refresh
        </Button>
      </PageHeader>

      <TeamScopeGate>
        <Tabs.Root value={status} onValueChange={(e) => setStatus(e.value as OrderStatus)}>
          <Tabs.List>
            {ORDER_STATUSES.map((s) => (
              <Tabs.Trigger key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>

        <HStack gap={4} align="flex-end" wrap="wrap">
          <Field.Root width="260px">
            <Field.Label>Search</Field.Label>
            <Input
              value={search}
              placeholder="order ref / recipient / team"
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field.Root>
          <Button onClick={() => void load(1, status)} loading={loading}>
            Load
          </Button>
        </HStack>

        <OrderTable
          orders={orders}
          loading={loading}
          onSelect={(o) => navigate(`/order/${o.id}`)}
          emptyText={`No ${ORDER_STATUS_LABELS[status].toLowerCase()} orders.`}
        />
        <Pagination
          pageInfo={pageInfo}
          page={page}
          onPage={(p) => void load(p, status)}
          loading={loading}
        />
      </TeamScopeGate>
    </Stack>
  );
}
