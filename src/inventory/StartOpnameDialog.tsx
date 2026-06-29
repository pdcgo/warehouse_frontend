import { useEffect, useState } from "react";
import { Button, CloseButton, Dialog, Field, Input, Portal, Stack, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { useAuth } from "../auth/AuthContext";
import { createOpnameSession } from "./opnameApi";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
}

function defaultName(): string {
  return `Opname ${new Date().toLocaleDateString()}`;
}

export function StartOpnameDialog({ open, onOpenChange, warehouseId }: Props) {
  const { username } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(defaultName());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setName(defaultName());
  }, [open]);

  const submit = async () => {
    if (!name.trim()) {
      toaster.create({ title: "Name is required", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const session = await createOpnameSession(
        warehouseId,
        name.trim(),
        username ?? "system",
      );
      onOpenChange(false);
      navigate(`/inventory/opname/${session.id}`);
    } catch (err) {
      toaster.create({
        title: "Failed to start opname",
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
              <Dialog.Title>Start opname</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                <Field.Root required>
                  <Field.Label>Name</Field.Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field.Root>
                <Text fontSize="sm" color="fg.muted">
                  Covers all racks in this warehouse. You can count any subset and
                  complete when done.
                </Text>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>
              <Button colorPalette="brand" loading={loading} onClick={submit}>
                Start
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
