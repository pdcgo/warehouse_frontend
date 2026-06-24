import { useState } from "react";
import {
  Button,
  Dialog,
  Field,
  Input,
  Portal,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import { invoiceClient } from "../lib/clients";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { TeamPicker } from "../components/TeamPicker";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: bigint;
  onCreated: () => void;
}

export function CreatePaymentDialog({ open, onOpenChange, teamId, onCreated }: Props) {
  const [forTeamId, setForTeamId] = useState<bigint>(0n);
  const [amount, setAmount] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setForTeamId(0n);
    setAmount("");
    setDocumentId("");
    setNote("");
  };

  const submit = async () => {
    if (!(forTeamId > 0n)) {
      toaster.create({ title: "Counterparty team is required", type: "error" });
      return;
    }
    const amt = Number(amount);
    if (!(amt > 0)) {
      toaster.create({ title: "Amount must be greater than zero", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await invoiceClient.createPayment({
        teamId,
        forTeamId,
        amount: amt,
        note,
        documentId,
      });
      toaster.create({ title: "Payment created", type: "success" });
      reset();
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toaster.create({
        title: "Create failed",
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
        if (!e.open) reset();
        onOpenChange(e.open);
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Create payment</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                <Field.Root required>
                  <Field.Label>To team</Field.Label>
                  <TeamPicker value={forTeamId} onChange={setForTeamId} width="100%" />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Amount</Field.Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Proof document ID</Field.Label>
                  <Input
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Note</Field.Label>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
                </Field.Root>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>
              <Button colorPalette="brand" loading={loading} onClick={submit}>
                Create
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
