import { useCallback, useEffect, useState } from "react";
import { Button, Checkbox, Field, HStack, Input, Stack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useTeam } from "../team/TeamContext";
import { TeamScopeGate } from "../team/TeamScopeGate";
import { PageHeader } from "../components/PageHeader";
import { StringSelect } from "../components/StringSelect";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { Pagination } from "../payments/Pagination";
import type { PageInfo } from "../gen/common/v1/common_pb";
import { ProductTable } from "./ProductTable";
import {
  currentWarehouseId,
  listSellingTeams,
  listWarehouseProducts,
  type ProductSearchType,
  type ProductSortKey,
  type SellingTeamOption,
  type SortDir,
  type WarehouseProductRow,
} from "./productApi";

const LIMIT = 20;

const SEARCH_TYPE_OPTIONS = [
  { label: "Name", value: "name" },
  { label: "SKU", value: "sku" },
  { label: "Ref ID", value: "ref" },
];

// Composite "<key>:<dir>" values so a single dropdown drives both sort key and direction.
const SORT_OPTIONS = [
  { label: "Ready stock (high → low)", value: "stockReady:desc" },
  { label: "Ready stock (low → high)", value: "stockReady:asc" },
  { label: "Pending (high → low)", value: "stockPending:desc" },
  { label: "Name (A → Z)", value: "name:asc" },
  { label: "Price (high → low)", value: "price:desc" },
  { label: "Price (low → high)", value: "price:asc" },
];

export function ProductListPage() {
  const { currentTeam } = useTeam();
  const navigate = useNavigate();
  const warehouseId = currentWarehouseId(currentTeam);

  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<ProductSearchType>("name");
  const [sellingTeamId, setSellingTeamId] = useState("");
  const [emptyStockOnly, setEmptyStockOnly] = useState(false);
  const [sort, setSort] = useState("stockReady:desc");

  const [rows, setRows] = useState<WarehouseProductRow[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sellingTeams, setSellingTeams] = useState<SellingTeamOption[]>([]);

  const load = useCallback(
    async (toPage: number) => {
      if (!currentTeam) return;
      const [sortKey, sortDir] = sort.split(":") as [ProductSortKey, SortDir];
      setLoading(true);
      try {
        const res = await listWarehouseProducts({
          warehouseId,
          sellingTeamId,
          search,
          searchType,
          emptyStockOnly,
          sortKey,
          sortDir,
          page: toPage,
          limit: LIMIT,
        });
        setRows(res.rows);
        setPageInfo(res.pageInfo);
        setPage(toPage);
      } catch (err) {
        toaster.create({
          title: "Failed to load products",
          description: errMessage(err),
          type: "error",
        });
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [currentTeam, warehouseId, sellingTeamId, search, searchType, emptyStockOnly, sort],
  );

  // Reload page 1 whenever the selected team changes.
  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeam?.teamId]);

  // Selling-team options follow the warehouse, fetched once per team change.
  useEffect(() => {
    if (!currentTeam) return;
    let cancelled = false;
    void listSellingTeams(warehouseId).then((t) => {
      if (!cancelled) setSellingTeams(t);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeam?.teamId]);

  const teamOptions = [
    { label: "All selling teams", value: "" },
    ...sellingTeams.map((t) => ({ label: t.name, value: t.id })),
  ];

  return (
    <Stack gap={6}>
      <PageHeader>
        <Button
          variant="outline"
          disabled={!currentTeam}
          loading={loading}
          onClick={() => void load(page)}
        >
          Refresh
        </Button>
      </PageHeader>

      <TeamScopeGate>
        <HStack gap={4} align="flex-end" wrap="wrap">
          <Field.Root width="240px">
            <Field.Label>Search</Field.Label>
            <Input
              value={search}
              placeholder="name / SKU / ref"
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field.Root>
          <Field.Root width="140px">
            <Field.Label>Search by</Field.Label>
            <StringSelect
              value={searchType}
              onChange={(v) => setSearchType(v as ProductSearchType)}
              options={SEARCH_TYPE_OPTIONS}
              width="140px"
            />
          </Field.Root>
          <Field.Root width="220px">
            <Field.Label>Selling team</Field.Label>
            <StringSelect
              value={sellingTeamId}
              onChange={setSellingTeamId}
              options={teamOptions}
              placeholder="All selling teams"
              width="220px"
              disabled={loading}
            />
          </Field.Root>
          <Field.Root width="220px">
            <Field.Label>Sort</Field.Label>
            <StringSelect value={sort} onChange={setSort} options={SORT_OPTIONS} width="220px" />
          </Field.Root>
          <Field.Root width="auto">
            <Checkbox.Root
              checked={emptyStockOnly}
              onCheckedChange={(e) => setEmptyStockOnly(!!e.checked)}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>Empty stock only</Checkbox.Label>
            </Checkbox.Root>
          </Field.Root>
          <Button onClick={() => void load(1)} loading={loading}>
            Load
          </Button>
        </HStack>

        <ProductTable
          rows={rows}
          loading={loading}
          emptyText="No products in this warehouse."
          onSelect={(row) => navigate(`/product/${row.skuId}`)}
        />
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
