import { useCallback, useEffect, useState } from "react";
import {
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
import { userClient } from "../lib/clients";
import { PageHeader } from "../components/PageHeader";
import { TeamPicker } from "../components/TeamPicker";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import type { SearchUserItem } from "../gen/user_iface/v2/v2_user_pb";

const PAGE_SIZE = 20;

// Lists every user across all teams (V2UserService.SearchUser, team_id 0 = all),
// with keyword search and an optional team filter. Not team-scoped, so it does not
// use TeamScopeGate. SearchUserResponse has no PageInfo, so pagination is manual:
// Next is disabled once a page returns fewer than PAGE_SIZE rows.
export function AllUsersPage() {
  const [q, setQ] = useState("");
  const [teamId, setTeamId] = useState<bigint>(0n);
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<SearchUserItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (toPage: number) => {
      setLoading(true);
      try {
        const res = await userClient.searchUser({
          filter: { case: "keyword", value: { q, teamId } },
          page: BigInt(toPage),
          pageSize: BigInt(PAGE_SIZE),
        });
        setUsers(res.users);
        setPage(toPage);
      } catch (err) {
        toaster.create({
          title: "Failed to load users",
          description: errMessage(err),
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [q, teamId],
  );

  // Show all users on entry, and reload from page 1 whenever the team filter changes.
  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

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
            placeholder="name / email / username / phone"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void load(1);
            }}
          />
        </Field.Root>
        <Field.Root width="280px">
          <Field.Label>Team</Field.Label>
          <TeamPicker
            value={teamId}
            onChange={setTeamId}
            allowAny
            showTypeFilter
            placeholder="All teams"
            width="280px"
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
        ) : users.length === 0 ? (
          <Text p={6} color="gray.500">
            No users found.
          </Text>
        ) : (
          <Table.Root size="sm" interactive>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>ID</Table.ColumnHeader>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Username</Table.ColumnHeader>
                <Table.ColumnHeader>Email</Table.ColumnHeader>
                <Table.ColumnHeader>Phone</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users.map((u) => (
                <Table.Row key={u.id.toString()}>
                  <Table.Cell>{u.id.toString()}</Table.Cell>
                  <Table.Cell>{u.name}</Table.Cell>
                  <Table.Cell>{u.username}</Table.Cell>
                  <Table.Cell>{u.email}</Table.Cell>
                  <Table.Cell>{u.phoneNumber}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      {/* SearchUser returns no total, so paginate by result-count heuristic. */}
      <HStack justify="flex-end" gap={2}>
        <Button
          size="sm"
          variant="outline"
          disabled={loading || page <= 1}
          onClick={() => void load(page - 1)}
        >
          Previous
        </Button>
        <Text fontSize="sm" color="gray.600">
          Page {page}
        </Text>
        <Button
          size="sm"
          variant="outline"
          disabled={loading || users.length < PAGE_SIZE}
          onClick={() => void load(page + 1)}
        >
          Next
        </Button>
      </HStack>
    </Stack>
  );
}
