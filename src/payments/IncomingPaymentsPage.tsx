import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  Field,
  Heading,
  HStack,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { invoiceClient } from "../lib/clients";
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

const LIMIT = 20;

type PendingAction = { payment: Payment; type: "accept" | "reject" };

export function IncomingPaymentsPage() {
  const { currentTeam } = useTeam(); // scope = receiver (for_team_id)
  const [payerId, setPayerId] = useState<bigint>(0n); // optional payer filter (team_id)
  const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.UNSPECIFIED);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<PendingAction | null>(null);

  const load = useCallback(async (toPage: number) => {
    if (!currentTeam) return;
    setLoading(true);
    try {
      const res = await invoiceClient.listIncomingPayment({
        forTeamId: currentTeam.teamId,
        teamId: payerId,
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
  }, [currentTeam, payerId, status]);

  // Reload page 1 whenever the selected team changes.
  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeam?.teamId]);

  const confirmAction = async () => {
    if (!action || !currentTeam) return;
    const { payment, type } = action;
    try {
      if (type === "accept") {
        await invoiceClient.acceptPayment({
          teamId: payment.teamId,
          forTeamId: currentTeam.teamId,
          paymentId: payment.id,
        });
        toaster.create({ title: "Payment accepted", type: "success" });
      } else {
        await invoiceClient.rejectPayment({
          teamId: payment.teamId,
          forTeamId: currentTeam.teamId,
          paymentId: payment.id,
        });
        toaster.create({ title: "Payment rejected", type: "success" });
      }
      setAction(null);
      void load(page);
    } catch (err) {
      toaster.create({
        title: "Action failed",
        description: errMessage(err),
        type: "error",
      });
    }
  };

  return (
    <Stack gap={6}>
      <Heading size="lg">Incoming Payments</Heading>

      <TeamScopeGate>
        <HStack gap={4} align="flex-end" wrap="wrap">
          <Field.Root width="240px">
            <Field.Label>Payer</Field.Label>
            <TeamPicker value={payerId} onChange={setPayerId} allowAny placeholder="any" />
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

        <PaymentTable
          payments={payments}
          loading={loading}
          emptyText="No incoming payments."
          onAccept={(p) => setAction({ payment: p, type: "accept" })}
          onReject={(p) => setAction({ payment: p, type: "reject" })}
        />
        <Pagination pageInfo={pageInfo} page={page} onPage={(p) => void load(p)} loading={loading} />
      </TeamScopeGate>

      <Dialog.Root open={action !== null} onOpenChange={(e) => !e.open && setAction(null)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>
                  {action?.type === "accept" ? "Accept payment" : "Reject payment"}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  {action?.type === "accept" ? "Accept" : "Reject"} payment{" "}
                  <Text as="span" fontWeight="semibold">
                    #{action?.payment.id.toString()}
                  </Text>{" "}
                  of{" "}
                  <Text as="span" fontWeight="semibold">
                    {action?.payment.amount.toLocaleString()}
                  </Text>{" "}
                  from team{" "}
                  <Text as="span" fontWeight="semibold">
                    {action?.payment.teamId.toString()}
                  </Text>
                  ?
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Cancel</Button>
                </Dialog.ActionTrigger>
                <Button
                  colorPalette={action?.type === "accept" ? "green" : "red"}
                  onClick={() => void confirmAction()}
                >
                  {action?.type === "accept" ? "Accept" : "Reject"}
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Stack>
  );
}
