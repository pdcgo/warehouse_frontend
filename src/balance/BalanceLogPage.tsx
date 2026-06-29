import { useState } from "react";
import { Button, Field, Input, Stack, Text, Textarea } from "@chakra-ui/react";
import { invoiceClient } from "../lib/clients";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { EnumSelect } from "../components/EnumSelect";
import { TeamPicker } from "../components/TeamPicker";
import { useTeam } from "../team/TeamContext";
import { TeamScopeGate } from "../team/TeamScopeGate";
import { BALANCE_CHANGE_TYPE_OPTIONS, BALANCE_TYPE_OPTIONS } from "../lib/payments";
import {
  BalanceChangeType,
  BalanceType,
} from "../gen/invoice_iface/v2/v2_types_pb";

export function BalanceLogPage() {
  const { currentTeam } = useTeam();
  const [forTeamId, setForTeamId] = useState<bigint>(0n);
  const [changeType, setChangeType] = useState<BalanceChangeType>(
    BalanceChangeType.ADJUSTMENT,
  );
  const [balanceType, setBalanceType] = useState<BalanceType>(BalanceType.PAYABLE);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!currentTeam) return;
    if (!(forTeamId > 0n)) {
      toaster.create({ title: "For-team is required", type: "error" });
      return;
    }
    const amt = Number(amount);
    if (!(amt > 0)) {
      toaster.create({ title: "Amount must be greater than zero", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await invoiceClient.createBalanceLog({
        teamId: currentTeam.teamId,
        forTeamId,
        changeType,
        changeAmount: amt,
        balanceType,
        note,
      });
      toaster.create({ title: "Balance log posted", type: "success" });
      setAmount("");
      setNote("");
    } catch (err) {
      toaster.create({
        title: "Failed to post balance log",
        description: errMessage(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap={6} maxW="lg">
      <Text color="fg.muted">
        Post a manual double-entry balance change from your team to another team.
      </Text>

      <TeamScopeGate>
        <Stack gap={4}>
          <Field.Root required>
            <Field.Label>For Team</Field.Label>
            <TeamPicker value={forTeamId} onChange={setForTeamId} width="100%" />
          </Field.Root>
          <Field.Root>
          <Field.Label>Change type</Field.Label>
          <EnumSelect
            value={changeType}
            onChange={(v) => setChangeType(v as BalanceChangeType)}
            options={BALANCE_CHANGE_TYPE_OPTIONS}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Balance type</Field.Label>
          <EnumSelect
            value={balanceType}
            onChange={(v) => setBalanceType(v as BalanceType)}
            options={BALANCE_TYPE_OPTIONS}
          />
        </Field.Root>
        <Field.Root required>
          <Field.Label>Change amount</Field.Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field.Root>
        <Field.Root>
          <Field.Label>Note</Field.Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field.Root>
          <Button colorPalette="brand" loading={loading} onClick={submit} alignSelf="flex-start">
            Post balance log
          </Button>
        </Stack>
      </TeamScopeGate>
    </Stack>
  );
}
