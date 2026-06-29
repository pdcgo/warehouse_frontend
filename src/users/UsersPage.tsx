import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  CloseButton,
  Dialog,
  Field,
  HStack,
  Input,
  Portal,
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
import { useTeam } from "../team/TeamContext";
import { TeamScopeGate } from "../team/TeamScopeGate";
import { PageHeader } from "../components/PageHeader";
import { CreateUserDialog } from "./CreateUserDialog";
import { EditUserDialog } from "./EditUserDialog";
import { TeamMemberDialog } from "./TeamMemberDialog";
import { Pagination } from "../payments/Pagination";
import type { PageInfo } from "../gen/common/v1/common_pb";

const LIMIT = 20;

export function UsersPage() {
  const { currentTeam } = useTeam();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role>(Role.UNSPECIFIED);
  const [users, setUsers] = useState<User[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberPreset, setMemberPreset] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const load = useCallback(async (toPage: number) => {
    if (!currentTeam) return;
    setLoading(true);
    try {
      const res = await userClient.userList({
        teamId: currentTeam.teamId,
        q,
        role: roleFilter,
        page: { page: BigInt(toPage), limit: BigInt(LIMIT) },
      });
      // userList returns UserMapItem { user, alias }; flatten to the User shape
      // this page uses, taking the role from the team-scoped alias.
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
        title: "Failed to load users",
        description: errMessage(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeam, q, roleFilter]);

  // Reload when the selected team changes.
  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeam?.teamId]);

  const suspend = async (u: User) => {
    try {
      await userClient.suspendUser({ userId: u.id });
      toaster.create({ title: "User suspended", type: "success" });
      void load(page);
    } catch (err) {
      toaster.create({ title: "Suspend failed", description: errMessage(err), type: "error" });
    }
  };

  const removeFromTeam = async (u: User) => {
    if (!currentTeam) return;
    try {
      await userClient.teamUserUpdate({
        teamId: currentTeam.teamId,
        action: { case: "remove", value: { userId: u.id } },
      });
      toaster.create({ title: "Removed from team", type: "success" });
      void load(page);
    } catch (err) {
      toaster.create({ title: "Remove failed", description: errMessage(err), type: "error" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await userClient.deleteUser({ id: deleteTarget.id });
      toaster.create({ title: "User deleted", type: "success" });
      setDeleteTarget(null);
      void load(page);
    } catch (err) {
      toaster.create({ title: "Delete failed", description: errMessage(err), type: "error" });
    }
  };

  return (
    <Stack gap={6}>
      <PageHeader>
        <Button
          colorPalette="brand"
          disabled={!currentTeam}
          onClick={() => setCreateOpen(true)}
        >
          Create user
        </Button>
        <Button
          variant="outline"
          disabled={!currentTeam}
          onClick={() => {
            setMemberPreset(null);
            setMemberOpen(true);
          }}
        >
          Add member
        </Button>
      </PageHeader>

      <TeamScopeGate>
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
          {/* Filter lists every role (no teamType): a member may legitimately hold a
              role outside this team's type, and the filter must be able to reach it. */}
          <RolePicker value={roleFilter} onChange={setRoleFilter} includeAll />
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
                    <Badge
                      colorPalette={
                        u.status === UserStatus.SUSPENDED ? "red" : "green"
                      }
                    >
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
                          setEditUser(u);
                          setEditOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setMemberPreset(u);
                          setMemberOpen(true);
                        }}
                      >
                        Role
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        colorPalette="orange"
                        onClick={() => void suspend(u)}
                      >
                        Suspend
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => void removeFromTeam(u)}
                      >
                        Remove
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        colorPalette="red"
                        onClick={() => setDeleteTarget(u)}
                      >
                        Delete
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

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void load(page)}
      />
      <EditUserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={editUser}
        onSaved={() => void load(page)}
      />
      <TeamMemberDialog
        open={memberOpen}
        onOpenChange={setMemberOpen}
        teamId={currentTeam?.teamId ?? 0n}
        presetUserId={memberPreset?.id}
        initialRole={memberPreset?.role}
        onSaved={() => void load(page)}
      />

      <Dialog.Root
        open={deleteTarget !== null}
        onOpenChange={(e) => !e.open && setDeleteTarget(null)}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Delete user</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  Permanently delete user{" "}
                  <Text as="span" fontWeight="semibold">
                    {deleteTarget?.username}
                  </Text>{" "}
                  (#{deleteTarget?.id.toString()})? This cannot be undone.
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Cancel</Button>
                </Dialog.ActionTrigger>
                <Button colorPalette="red" onClick={() => void confirmDelete()}>
                  Delete
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
      </TeamScopeGate>
    </Stack>
  );
}
