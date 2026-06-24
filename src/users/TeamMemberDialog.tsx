import { useEffect, useState } from "react";
import { Button, Dialog, Field, Input, Portal, Stack } from "@chakra-ui/react";
import { userClient } from "../lib/clients";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { RoleSelect } from "../components/RoleSelect";
import { Role } from "../gen/role_base/v1/role_pb";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  teamId: bigint;
  // When set, lock the user id (change-role mode); otherwise add a new member.
  presetUserId?: bigint;
  initialRole?: Role;
}

export function TeamMemberDialog({
  open,
  onOpenChange,
  onSaved,
  teamId,
  presetUserId,
  initialRole,
}: Props) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<Role>(Role.TEAM_ADMIN);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setUserId(presetUserId !== undefined ? presetUserId.toString() : "");
      setRole(initialRole ?? Role.TEAM_ADMIN);
    }
  }, [open, presetUserId, initialRole]);

  const submit = async () => {
    const parsed = userId.trim();
    if (!parsed) {
      toaster.create({ title: "User id is required", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await userClient.teamUserUpdate({
        teamId,
        action: {
          case: "add",
          value: { userId: BigInt(parsed), role },
        },
      });
      toaster.create({ title: "Team membership saved", type: "success" });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toaster.create({
        title: "Save failed",
        description: errMessage(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const changeMode = presetUserId !== undefined;

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                {changeMode ? "Change role" : "Add member to team"}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                <Field.Root required>
                  <Field.Label>User ID</Field.Label>
                  <Input
                    type="number"
                    value={userId}
                    disabled={changeMode}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Role</Field.Label>
                  <RoleSelect value={role} onChange={setRole} width="100%" />
                </Field.Root>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>
              <Button colorPalette="brand" loading={loading} onClick={submit}>
                Save
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
