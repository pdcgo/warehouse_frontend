import { useEffect, useState } from "react";
import {
  Button,
  CloseButton,
  Dialog,
  Field,
  Input,
  Portal,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { useAuth } from "../auth/AuthContext";
import { adjustRack, type Rack } from "./inventoryApi";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rack: Rack | undefined;
  onSaved: () => void;
}

export function AdjustRackDialog({ open, onOpenChange, rack, onSaved }: Props) {
  const { username } = useAuth();
  const [name, setName] = useState("");
  const [itemCount, setItemCount] = useState("0");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill from the rack each time the dialog opens.
  useEffect(() => {
    if (open && rack) {
      setName(rack.name);
      setItemCount(String(rack.itemCount));
      setNote("");
    }
  }, [open, rack]);

  const submit = async () => {
    if (!rack) return;
    if (!name.trim()) {
      toaster.create({ title: "Name is required", type: "error" });
      return;
    }
    const count = Number(itemCount);
    if (!Number.isInteger(count) || count < 0) {
      toaster.create({ title: "Item count must be a whole number ≥ 0", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await adjustRack(rack.id, {
        name: name.trim(),
        itemCount: count,
        note: note.trim(),
        byUser: username ?? "system",
      });
      toaster.create({ title: "Rack adjusted", type: "success" });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toaster.create({
        title: "Adjust failed",
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
              <Dialog.Title>Adjust rack</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                <Field.Root required>
                  <Field.Label>Name</Field.Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Item count</Field.Label>
                  <Input
                    type="number"
                    value={itemCount}
                    onChange={(e) => setItemCount(e.target.value)}
                  />
                  <Field.HelperText>
                    Records a stock-take: updates the count and adds an Opname History entry.
                  </Field.HelperText>
                </Field.Root>
                <Field.Root>
                  <Field.Label>Note</Field.Label>
                  <Textarea
                    value={note}
                    placeholder="reason for the adjustment (optional)"
                    onChange={(e) => setNote(e.target.value)}
                  />
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
