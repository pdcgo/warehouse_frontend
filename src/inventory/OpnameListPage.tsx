import { useCallback, useEffect, useState } from "react";
import { Badge, Box, Button, HStack, Spinner, Stack, Table, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useTeam } from "../team/TeamContext";
import { TeamScopeGate } from "../team/TeamScopeGate";
import { PageHeader } from "../components/PageHeader";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { Pagination } from "../payments/Pagination";
import { currentWarehouseId } from "../products/productApi";
import { formatMs } from "./inventoryApi";
import type { PageInfo } from "../gen/common/v1/common_pb";
import {
  listOpnameSessions,
  OPNAME_STATUS_COLORS,
  OPNAME_STATUS_LABELS,
  type OpnameSession,
} from "./opnameApi";
import { StartOpnameDialog } from "./StartOpnameDialog";

const LIMIT = 20;

export function OpnameListPage() {
  const { currentTeam } = useTeam();
  const navigate = useNavigate();
  const warehouseId = currentWarehouseId(currentTeam);

  const [sessions, setSessions] = useState<OpnameSession[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [startOpen, setStartOpen] = useState(false);

  const load = useCallback(
    async (toPage: number) => {
      if (!currentTeam) return;
      setLoading(true);
      try {
        const res = await listOpnameSessions(warehouseId, toPage, LIMIT);
        setSessions(res.sessions);
        setPageInfo(res.pageInfo);
        setPage(toPage);
      } catch (err) {
        toaster.create({
          title: "Failed to load opname sessions",
          description: errMessage(err),
          type: "error",
        });
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [currentTeam, warehouseId],
  );

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeam?.teamId]);

  return (
    <Stack gap={6}>
      <PageHeader>
        <Button colorPalette="brand" disabled={!currentTeam} onClick={() => setStartOpen(true)}>
          Start opname
        </Button>
      </PageHeader>

      <TeamScopeGate>
        <Box borderWidth="1px" rounded="md" overflow="hidden">
          {loading ? (
            <HStack p={6} justify="center">
              <Spinner />
            </HStack>
          ) : sessions.length === 0 ? (
            <Text p={6} color="gray.500">
              No opname sessions yet.
            </Text>
          ) : (
            <Table.Root size="sm" interactive>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Name</Table.ColumnHeader>
                  <Table.ColumnHeader>Created</Table.ColumnHeader>
                  <Table.ColumnHeader>By</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Progress</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Discrepancies</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {sessions.map((s) => (
                  <Table.Row
                    key={s.id}
                    cursor="pointer"
                    onClick={() => navigate(`/inventory/opname/${s.id}`)}
                  >
                    <Table.Cell>
                      <Text fontWeight="medium">{s.name}</Text>
                    </Table.Cell>
                    <Table.Cell>{formatMs(s.createdMs)}</Table.Cell>
                    <Table.Cell>{s.createdBy}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={OPNAME_STATUS_COLORS[s.status]}>
                        {OPNAME_STATUS_LABELS[s.status]}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell textAlign="end">
                      {s.countedCount}/{s.rackCount}
                    </Table.Cell>
                    <Table.Cell textAlign="end">
                      {s.discrepancyCount > 0 ? (
                        <Badge colorPalette="orange">{s.discrepancyCount}</Badge>
                      ) : (
                        "—"
                      )}
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

        <StartOpnameDialog
          open={startOpen}
          onOpenChange={setStartOpen}
          warehouseId={warehouseId}
        />
      </TeamScopeGate>
    </Stack>
  );
}
