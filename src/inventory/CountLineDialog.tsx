import { useEffect, useState } from "react";
import { Button, CloseButton, Dialog, Field, Input, Portal, Stack, Text } from "@chakra-ui/react";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { countOpnameLine, type OpnameLine } from "./opnameApi";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  line: OpnameLine | null;
  onSaved: () => void;
}

export function CountLineDialog({ open, onOpenChange, sessionId, line, onSaved }: Props) {
  const [counted, setCounted] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && line) {
      setCounted(line.countedCount !== null ? String(line.countedCount) : "");
    }
  }, [open, line]);

  const submit = async () => {
    if (!line) return;
    const count = Number(counted);
    if (!Number.isInteger(count) || count < 0) {
      toaster.create({ title: "Counted must be a whole number ≥ 0", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await countOpnameLine(sessionId, line.rackId, count);
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toaster.create({
        title: "Failed to save count",
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
              <Dialog.Title>Count {line?.rackName}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                <Text fontSize="sm" color="fg.muted">
                  System count: <b>{line?.systemCount ?? 0}</b>
                </Text>
                <Field.Root required>
                  <Field.Label>Counted</Field.Label>
                  <Input
                    type="number"
                    value={counted}
                    autoFocus
                    onChange={(e) => setCounted(e.target.value)}
                  />
                </Field.Root>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>
              <Button colorPalette="brand" loading={loading} onClick={submit}>
                Save count
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
