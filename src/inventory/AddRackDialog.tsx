import { useState } from "react";
import { Button, CloseButton, Dialog, Field, Input, Portal, Stack } from "@chakra-ui/react";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { addRack } from "./inventoryApi";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  onCreated: () => void;
}

export function AddRackDialog({ open, onOpenChange, warehouseId, onCreated }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      toaster.create({ title: "Rack name is required", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await addRack(warehouseId, name.trim());
      toaster.create({ title: "Rack added", type: "success" });
      setName("");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toaster.create({
        title: "Failed to add rack",
        description: errMessage(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) setName("");
        onOpenChange(e.open);
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Add rack</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                <Field.Root required>
                  <Field.Label>Name</Field.Label>
                  <Input
                    value={name}
                    placeholder="e.g. A-01"
                    autoFocus
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field.Root>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>
              <Button colorPalette="brand" loading={loading} onClick={submit}>
                Add rack
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
