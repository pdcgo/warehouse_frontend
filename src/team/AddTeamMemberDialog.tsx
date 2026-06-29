import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  CloseButton,
  Combobox,
  Dialog,
  Field,
  Portal,
  Spinner,
  Stack,
  useListCollection,
} from "@chakra-ui/react";
import { userClient } from "../lib/clients";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { RolePicker } from "../components/RolePicker";
import { Role } from "../gen/role_base/v1/role_pb";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: bigint;
  onSaved: () => void;
}

interface UserItem {
  label: string;
  value: string;
}

function userLabel(name: string, username: string, email: string): string {
  const handle = username || email;
  return handle ? `${name || handle} (${handle})` : name || "Unnamed user";
}

// Add a user to a team via a searchable picker. Searches all users (team_id 0)
// with the global keyword search, then assigns the chosen role through
// V2UserService.TeamUserUpdate (add action).
export function AddTeamMemberDialog({ open, onOpenChange, teamId, onSaved }: Props) {
  const { collection, set } = useListCollection<UserItem>({
    initialItems: [],
    itemToString: (item) => item.label,
    itemToValue: (item) => item.value,
  });
  const [selectedId, setSelectedId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [role, setRole] = useState<Role>(Role.TEAM_ADMIN);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (q: string) => {
      setSearching(true);
      try {
        const res = await userClient.searchUser({
          filter: { case: "keyword", value: { q, teamId: 0n } },
          page: 1n,
          pageSize: 25n,
        });
        set(
          res.users.map((u) => ({
            label: userLabel(u.name, u.username, u.email),
            value: u.id.toString(),
          })),
        );
      } catch (err) {
        toaster.create({
          title: "Failed to search users",
          description: errMessage(err),
          type: "error",
        });
      } finally {
        setSearching(false);
      }
    },
    [set],
  );

  // Reset and load the first page of results each time the dialog opens.
  useEffect(() => {
    if (open) {
      setSelectedId("");
      setInputValue("");
      setRole(Role.TEAM_ADMIN);
      void search("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (!selectedId) {
      toaster.create({ title: "Pick a user to add", type: "error" });
      return;
    }
    setSaving(true);
    try {
      await userClient.teamUserUpdate({
        teamId,
        action: { case: "add", value: { userId: BigInt(selectedId), role } },
      });
      toaster.create({ title: "Member added", type: "success" });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toaster.create({
        title: "Add failed",
        description: errMessage(err),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Add member to team</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                <Field.Root required>
                  <Field.Label>User</Field.Label>
                  <Combobox.Root
                    collection={collection}
                    width="100%"
                    value={selectedId ? [selectedId] : []}
                    inputValue={inputValue}
                    onInputValueChange={(details) => {
                      setInputValue(details.inputValue);
                      if (timer.current) clearTimeout(timer.current);
                      timer.current = setTimeout(
                        () => void search(details.inputValue),
                        300,
                      );
                    }}
                    onValueChange={(details) => setSelectedId(details.value[0] ?? "")}
                    openOnClick
                  >
                    <Combobox.Control>
                      <Combobox.Input placeholder="Search name / email / username…" />
                      <Combobox.IndicatorGroup>
                        {searching ? <Spinner size="xs" /> : null}
                        <Combobox.Trigger />
                      </Combobox.IndicatorGroup>
                    </Combobox.Control>
                    <Portal>
                      <Combobox.Positioner>
                        <Combobox.Content>
                          <Combobox.Empty>No users found</Combobox.Empty>
                          {collection.items.map((item) => (
                            <Combobox.Item item={item} key={item.value}>
                              {item.label}
                              <Combobox.ItemIndicator />
                            </Combobox.Item>
                          ))}
                        </Combobox.Content>
                      </Combobox.Positioner>
                    </Portal>
                  </Combobox.Root>
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Role</Field.Label>
                  <RolePicker value={role} onChange={setRole} width="100%" />
                </Field.Root>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>
              <Button colorPalette="brand" loading={saving} onClick={submit}>
                Add
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
