import { useState } from "react";
import {
  Box,
  Button,
  Field,
  Heading,
  HStack,
  Input,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { userClient } from "../lib/clients";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import type { SearchUserItem } from "../gen/user_iface/v2/v2_user_pb";

const PAGE_SIZE = 20;

export function SearchUsersPage() {
  const [q, setQ] = useState("");
  const [teamId, setTeamId] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<SearchUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const teamIdBig = (): bigint => {
    try {
      return BigInt(teamId.trim() || "0");
    } catch {
      return 0n;
    }
  };

  const search = async (toPage: number) => {
    setLoading(true);
    try {
      const res = await userClient.searchUser({
        filter: {
          case: "keyword",
          value: { q, teamId: teamIdBig() },
        },
        page: BigInt(toPage),
        pageSize: BigInt(PAGE_SIZE),
      });
      setUsers(res.users);
      setPage(toPage);
      setSearched(true);
    } catch (err) {
      toaster.create({
        title: "Search failed",
        description: errMessage(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap={6}>
      <Heading size="lg">Search Users</Heading>

      <HStack gap={4} align="flex-end" wrap="wrap">
        <Field.Root width="280px">
          <Field.Label>Keyword</Field.Label>
          <Input
            value={q}
            placeholder="name / email / username / phone"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void search(1);
            }}
          />
        </Field.Root>
        <Field.Root width="160px">
          <Field.Label>Team ID (optional)</Field.Label>
          <Input
            type="number"
            value={teamId}
            placeholder="all teams"
            onChange={(e) => setTeamId(e.target.value)}
          />
        </Field.Root>
        <Button colorPalette="brand" onClick={() => void search(1)} loading={loading}>
          Search
        </Button>
      </HStack>

      <Box borderWidth="1px" rounded="md" overflow="hidden">
        {loading ? (
          <HStack p={6} justify="center">
            <Spinner />
          </HStack>
        ) : !searched ? (
          <Text p={6} color="gray.500">
            Enter a keyword and search.
          </Text>
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

      {searched ? (
        <HStack justify="flex-end" gap={2}>
          <Button
            size="sm"
            variant="outline"
            disabled={loading || page <= 1}
            onClick={() => void search(page - 1)}
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
            onClick={() => void search(page + 1)}
          >
            Next
          </Button>
        </HStack>
      ) : null}
    </Stack>
  );
}
