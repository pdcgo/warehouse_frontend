import { useCallback, useEffect, useState } from "react";
import { Button, Field, HStack, Input, Stack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useTeam } from "../team/TeamContext";
import { TeamScopeGate } from "../team/TeamScopeGate";
import { PageHeader } from "../components/PageHeader";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { Pagination } from "../payments/Pagination";
import { currentWarehouseId } from "../products/productApi";
import type { PageInfo } from "../gen/common/v1/common_pb";
import { listRacks, type Rack } from "./inventoryApi";
import { RackTable } from "./RackTable";
import { AddRackDialog } from "./AddRackDialog";

const LIMIT = 20;

export function RackListPage() {
  const { currentTeam } = useTeam();
  const navigate = useNavigate();
  const warehouseId = currentWarehouseId(currentTeam);

  const [search, setSearch] = useState("");
  const [racks, setRacks] = useState<Rack[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(
    async (toPage: number) => {
      if (!currentTeam) return;
      setLoading(true);
      try {
        const res = await listRacks({ warehouseId, search, page: toPage, limit: LIMIT });
        setRacks(res.racks);
        setPageInfo(res.pageInfo);
        setPage(toPage);
      } catch (err) {
        toaster.create({
          title: "Failed to load racks",
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

  // Reload page 1 whenever the selected team changes.
  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeam?.teamId]);

  return (
    <Stack gap={6}>
      <PageHeader>
        <Button colorPalette="brand" disabled={!currentTeam} onClick={() => setAddOpen(true)}>
          Add rack
        </Button>
      </PageHeader>

      <TeamScopeGate>
        <HStack gap={4} align="flex-end" wrap="wrap">
          <Field.Root width="240px">
            <Field.Label>Search</Field.Label>
            <Input
              value={search}
              placeholder="rack name"
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field.Root>
          <Button onClick={() => void load(1)} loading={loading}>
            Load
          </Button>
        </HStack>

        <RackTable
          racks={racks}
          loading={loading}
          onSelect={(rack) => navigate(`/inventory/placements/${rack.id}`)}
          emptyText="No racks in this warehouse."
        />
        <Pagination
          pageInfo={pageInfo}
          page={page}
          onPage={(p) => void load(p)}
          loading={loading}
        />

        <AddRackDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          warehouseId={warehouseId}
          onCreated={() => void load(1)}
        />
      </TeamScopeGate>
    </Stack>
  );
}
