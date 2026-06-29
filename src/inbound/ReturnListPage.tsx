import { useCallback, useEffect, useState } from "react";
import { Box, HStack, Spinner, Stack, Table, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useTeam } from "../team/TeamContext";
import { TeamScopeGate } from "../team/TeamScopeGate";
import { PageHeader } from "../components/PageHeader";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { Pagination } from "../payments/Pagination";
import { currentWarehouseId, formatMs } from "../products/productApi";
import type { PageInfo } from "../gen/common/v1/common_pb";
import {
  listReturns,
  INBOUND_STATUS_LABELS,
  type InboundStatus,
  type ReturnRow,
} from "./inboundApi";
import { StatusBadge, StatusTabs } from "./inboundStatus";

const LIMIT = 20;

export function ReturnListPage() {
  const { currentTeam } = useTeam();
  const navigate = useNavigate();
  const warehouseId = currentWarehouseId(currentTeam);

  const [status, setStatus] = useState<InboundStatus>("PENDING");
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (toPage: number) => {
      if (!currentTeam) return;
      setLoading(true);
      try {
        const res = await listReturns({ warehouseId, status, page: toPage, limit: LIMIT });
        setRows(res.rows);
        setPageInfo(res.pageInfo);
        setPage(toPage);
      } catch (err) {
        toaster.create({
          title: "Failed to load returns",
          description: errMessage(err),
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [currentTeam, warehouseId, status],
  );

  // Reload page 1 when the team or the active status tab changes.
  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeam?.teamId, status]);

  return (
    <Stack gap={6}>
      <PageHeader />

      <TeamScopeGate>
        <StatusTabs value={status} onChange={setStatus} />

        <Box borderWidth="1px" rounded="md" overflow="hidden">
          {loading ? (
            <HStack p={6} justify="center">
              <Spinner />
            </HStack>
          ) : rows.length === 0 ? (
            <Text p={6} color="gray.500">
              No {INBOUND_STATUS_LABELS[status].toLowerCase()} returns.
            </Text>
          ) : (
            <Table.Root size="sm" interactive>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Receipt</Table.ColumnHeader>
                  <Table.ColumnHeader>Reason</Table.ColumnHeader>
                  <Table.ColumnHeader>Order</Table.ColumnHeader>
                  <Table.ColumnHeader>Created</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Items</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Amount</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rows.map((row) => (
                  <Table.Row
                    key={row.id}
                    cursor="pointer"
                    onClick={() => navigate(`/inbound/return/${row.id}`)}
                  >
                    <Table.Cell>{row.receipt}</Table.Cell>
                    <Table.Cell>{row.reason}</Table.Cell>
                    <Table.Cell>{row.orderId ?? "—"}</Table.Cell>
                    <Table.Cell>{formatMs(row.createdMs)}</Table.Cell>
                    <Table.Cell textAlign="end">{row.itemCount.toLocaleString()}</Table.Cell>
                    <Table.Cell textAlign="end">{`Rp ${row.amount.toLocaleString()}`}</Table.Cell>
                    <Table.Cell>
                      <StatusBadge status={row.status} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>

        <Pagination
          pageInfo={pageInfo}
          page={page}
          onPage={(p) => void load(p)}
          loading={loading}
        />
      </TeamScopeGate>
    </Stack>
  );
}
