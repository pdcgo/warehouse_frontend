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
import { create } from "@bufbuild/protobuf";
import { userClient } from "../lib/clients";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { RolePicker } from "../components/RolePicker";
import { roleLabel, statusLabel } from "../lib/roles";
import { Role } from "../gen/role_base/v1/role_pb";
import { UserSchema, UserStatus, type User } from "../gen/user_iface/v2/v2_user_pb";
import { Pagination } from "../payments/Pagination";
import type { PageInfo } from "../gen/common/v1/common_pb";
import { TeamMemberDialog } from "../users/TeamMemberDialog";
import { AddTeamMemberDialog } from "./AddTeamMemberDialog";

const LIMIT = 20;

// Members of one team (by id) with add / remove / change-role. Self-contained and
// parameterized by teamId so it works for any team selected in the Team menu —
// distinct from users/UsersPage which scopes to the *current* team.
export function TeamMemberList({ teamId }: { teamId: bigint }) {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role>(Role.UNSPECIFIED);
  const [users, setUsers] = useState<User[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [roleOpen, setRoleOpen] = useState(false);

  const load = useCallback(
    async (toPage: number) => {
      if (teamId <= 0n) return;
      setLoading(true);
      try {
        const res = await userClient.userList({
          teamId,
          q,
          role: roleFilter,
          page: { page: BigInt(toPage), limit: BigInt(LIMIT) },
        });
        // userList returns UserMapItem { user, alias }; flatten to the User shape
        // this table uses, taking the role from the team-scoped alias.
        setUsers(
          res.users.map((item) =>
            create(UserSchema, {
              id: item.user?.id ?? 0n,
              email: item.user?.email ?? "",
              username: item.user?.username ?? "",
              phoneNumber: item.user?.phoneNumber ?? "",
              name: item.user?.name ?? "",
              status: item.user?.status ?? UserStatus.UNSPECIFIED,
              profilePicture: item.user?.profilePicture ?? "",
              role: item.alias[0]?.role ?? Role.UNSPECIFIED,
            }),
          ),
        );
        setPageInfo(res.pageInfo);
        setPage(toPage);
      } catch (err) {
        toaster.create({
          title: "Failed to load members",
          description: errMessage(err),
          type: "error",
        });
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [teamId, q, roleFilter],
  );

  // Reload when the team changes.
  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const removeFromTeam = async (u: User) => {
    try {
      await userClient.teamUserUpdate({
        teamId,
        action: { case: "remove", value: { userId: u.id } },
      });
      toaster.create({ title: "Removed from team", type: "success" });
      void load(page);
    } catch (err) {
      toaster.create({ title: "Remove failed", description: errMessage(err), type: "error" });
    }
  };

  return (
    <Stack gap={4}>
      <HStack justify="space-between" align="flex-end" wrap="wrap" gap={4}>
        <HStack gap={4} align="flex-end" wrap="wrap">
          <Field.Root width="240px">
            <Field.Label>Search</Field.Label>
            <Input
              value={q}
              placeholder="name / email / username"
              onChange={(e) => setQ(e.target.value)}
            />
          </Field.Root>
          <Field.Root width="220px">
            <Field.Label>Role</Field.Label>
            {/* teamType omitted: this views an arbitrary team whose type isn't a
                v2 TeamType enum here (common_pb Team.type is a string) — falls back
                to all roles. */}
            <RolePicker value={roleFilter} onChange={setRoleFilter} includeAll />
          </Field.Root>
          <Button onClick={() => void load(1)} loading={loading}>
            Load
          </Button>
        </HStack>
        <Button colorPalette="brand" onClick={() => setAddOpen(true)}>
          Add member
        </Button>
      </HStack>

      <Box borderWidth="1px" rounded="md" overflow="hidden">
        {loading ? (
          <HStack p={6} justify="center">
            <Spinner />
          </HStack>
        ) : users.length === 0 ? (
          <Text p={6} color="gray.500">
            No members in this team.
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
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Role</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
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
                  <Table.Cell>
                    <Badge colorPalette={u.status === UserStatus.SUSPENDED ? "red" : "green"}>
                      {statusLabel(u.status)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette="purple">{roleLabel(u.role)}</Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="end">
                    <HStack justify="flex-end" gap={1}>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setRoleTarget(u);
                          setRoleOpen(true);
                        }}
                      >
                        Role
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        colorPalette="red"
                        onClick={() => void removeFromTeam(u)}
                      >
                        Remove
                      </Button>
                    </HStack>
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

      <AddTeamMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        teamId={teamId}
        onSaved={() => void load(page)}
      />
      <TeamMemberDialog
        open={roleOpen}
        onOpenChange={setRoleOpen}
        teamId={teamId}
        presetUserId={roleTarget?.id}
        initialRole={roleTarget?.role}
        onSaved={() => void load(page)}
      />
    </Stack>
  );
}
