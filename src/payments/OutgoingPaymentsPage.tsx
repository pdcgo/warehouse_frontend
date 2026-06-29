import { useCallback, useEffect, useState } from "react";
import { Button, Field, HStack, Stack } from "@chakra-ui/react";
import { invoiceClient } from "../lib/clients";
import { PageHeader } from "../components/PageHeader";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { EnumSelect } from "../components/EnumSelect";
import { TeamPicker } from "../components/TeamPicker";
import { useTeam } from "../team/TeamContext";
import { TeamScopeGate } from "../team/TeamScopeGate";
import { PAYMENT_STATUS_OPTIONS } from "../lib/payments";
import { PaymentStatus, type Payment } from "../gen/invoice_iface/v2/v2_service_pb";
import type { PageInfo } from "../gen/common/v1/common_pb";
import { PaymentTable } from "./PaymentTable";
import { Pagination } from "./Pagination";
import { CreatePaymentDialog } from "./CreatePaymentDialog";

const LIMIT = 20;

export function OutgoingPaymentsPage() {
  const { currentTeam } = useTeam();
  const [forTeamId, setForTeamId] = useState<bigint>(0n);
  const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.UNSPECIFIED);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async (toPage: number) => {
    if (!currentTeam) return;
    setLoading(true);
    try {
      const res = await invoiceClient.listPayment({
        teamId: currentTeam.teamId,
        forTeamId,
        status,
        page: { page: BigInt(toPage), limit: BigInt(LIMIT) },
      });
      setPayments(res.payments);
      setPageInfo(res.pageInfo);
      setPage(toPage);
    } catch (err) {
      toaster.create({
        title: "Failed to load payments",
        description: errMessage(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeam, forTeamId, status]);

  // Reload page 1 whenever the selected team changes.
  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeam?.teamId]);

  return (
    <Stack gap={6}>
      <PageHeader>
        <Button
          colorPalette="brand"
          disabled={!currentTeam}
          onClick={() => setCreateOpen(true)}
        >
          Create payment
        </Button>
      </PageHeader>

      <TeamScopeGate>
        <HStack gap={4} align="flex-end" wrap="wrap">
          <Field.Root width="240px">
            <Field.Label>Counterparty</Field.Label>
            <TeamPicker value={forTeamId} onChange={setForTeamId} allowAny placeholder="any" />
          </Field.Root>
          <Field.Root width="200px">
            <Field.Label>Status</Field.Label>
            <EnumSelect
              value={status}
              onChange={(v) => setStatus(v as PaymentStatus)}
              options={[{ label: "All statuses", value: PaymentStatus.UNSPECIFIED }, ...PAYMENT_STATUS_OPTIONS]}
            />
          </Field.Root>
          <Button onClick={() => void load(1)} loading={loading}>
            Load
          </Button>
        </HStack>

        <PaymentTable payments={payments} loading={loading} emptyText="No outgoing payments." />
        <Pagination pageInfo={pageInfo} page={page} onPage={(p) => void load(p)} loading={loading} />

        <CreatePaymentDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          teamId={currentTeam?.teamId ?? 0n}
          onCreated={() => void load(1)}
        />
      </TeamScopeGate>
    </Stack>
  );
}
