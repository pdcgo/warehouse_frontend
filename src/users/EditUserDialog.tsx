import { useEffect, useState } from "react";
import { Button, CloseButton, Dialog, Field, Input, Portal, Stack } from "@chakra-ui/react";
import { userClient } from "../lib/clients";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import type { User } from "../gen/user_iface/v2/v2_user_pb";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  user: User | null;
}

export function EditUserDialog({ open, onOpenChange, onSaved, user }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name);
    }
  }, [user]);

  const submit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await userClient.updateUser({
        id: user.id,
        email,
        name,
      });
      toaster.create({ title: "User updated", type: "success" });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toaster.create({
        title: "Update failed",
        description: errMessage(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Edit user #{user?.id.toString()}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                <Field.Root>
                  <Field.Label>Email</Field.Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Name</Field.Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
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
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
