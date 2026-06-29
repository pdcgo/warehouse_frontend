import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Field,
  HStack,
  Input,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StringSelect } from "../components/StringSelect";
import { Pagination } from "../payments/Pagination";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { teamClient } from "../lib/clients";
import { TeamType } from "../gen/common/v1/team_pb";
import type { PageInfo, Team } from "../gen/common/v1/common_pb";

const LIMIT = 20;

const TYPE_OPTIONS = [
  { label: "All types", value: String(TeamType.UNSPECIFIED) },
  { label: "Warehouse", value: String(TeamType.WAREHOUSE) },
  { label: "Selling", value: String(TeamType.SELLING) },
  { label: "Admin", value: String(TeamType.ADMIN) },
];

export function TeamListPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<TeamType>(TeamType.UNSPECIFIED);
  const [rows, setRows] = useState<Team[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (toPage: number) => {
      setLoading(true);
      try {
        const res = await teamClient.publicTeamList({
          q,
          teamType: typeFilter,
          page: { page: BigInt(toPage), limit: BigInt(LIMIT) },
        });
        setRows(res.datas);
        setPageInfo(res.pageInfo);
        setPage(toPage);
      } catch (err) {
        toaster.create({
          title: "Failed to load teams",
          description: errMessage(err),
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [q, typeFilter],
  );

  // Load the first page on mount (the team list is global, not team-scoped).
  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack gap={6}>
      <PageHeader>
        <Button variant="outline" loading={loading} onClick={() => void load(page)}>
          Refresh
        </Button>
      </PageHeader>

      <HStack gap={4} align="flex-end" wrap="wrap">
        <Field.Root width="280px">
          <Field.Label>Search</Field.Label>
          <Input
            value={q}
            placeholder="name / code"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void load(1);
            }}
          />
        </Field.Root>
        <Field.Root width="180px">
          <Field.Label>Type</Field.Label>
          <StringSelect
            value={String(typeFilter)}
            onChange={(v) => setTypeFilter(Number(v) as TeamType)}
            options={TYPE_OPTIONS}
            width="180px"
          />
        </Field.Root>
        <Button onClick={() => void load(1)} loading={loading}>
          Load
        </Button>
      </HStack>

      <Box borderWidth="1px" rounded="md" overflow="hidden">
        {loading ? (
          <HStack p={6} justify="center">
            <Spinner />
          </HStack>
        ) : rows.length === 0 ? (
          <Text p={6} color="gray.500">
            No teams found.
          </Text>
        ) : (
          <Table.Root size="sm" interactive>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>ID</Table.ColumnHeader>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Code</Table.ColumnHeader>
                <Table.ColumnHeader>Type</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((t) => (
                <Table.Row
                  key={t.id.toString()}
                  cursor="pointer"
                  onClick={() => navigate(`/team/${t.id}`)}
                >
                  <Table.Cell>{t.id.toString()}</Table.Cell>
                  <Table.Cell>{t.name}</Table.Cell>
                  <Table.Cell>{t.teamCode}</Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette="purple">{t.type || "—"}</Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      <Pagination pageInfo={pageInfo} page={page} onPage={(p) => void load(p)} loading={loading} />
    </Stack>
  );
}
