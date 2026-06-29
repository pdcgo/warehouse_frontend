import { useEffect, useState } from "react";
import { Button, CloseButton, Dialog, Field, Portal, Stack, Textarea } from "@chakra-ui/react";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { useAuth } from "../auth/AuthContext";
import { flagOrderProblem } from "./orderApi";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onSaved: () => void;
}

export function MarkProblemDialog({ open, onOpenChange, orderId, onSaved }: Props) {
  const { username } = useAuth();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setNote("");
  }, [open]);

  const submit = async () => {
    if (!note.trim()) {
      toaster.create({ title: "Describe the problem", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await flagOrderProblem(orderId, note.trim(), username ?? "system");
      toaster.create({ title: "Order flagged", type: "success" });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toaster.create({ title: "Failed", description: errMessage(err), type: "error" });
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
              <Dialog.Title>Mark problem</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                <Field.Root required>
                  <Field.Label>Problem note</Field.Label>
                  <Textarea
                    value={note}
                    placeholder="what went wrong?"
                    autoFocus
                    onChange={(e) => setNote(e.target.value)}
                  />
                </Field.Root>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>
              <Button colorPalette="red" loading={loading} onClick={submit}>
                Mark problem
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
