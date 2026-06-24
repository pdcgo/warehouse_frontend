import { Badge, Box, Button, HStack, Spinner, Table, Text } from "@chakra-ui/react";
import { PaymentStatus, type Payment } from "../gen/invoice_iface/v2/v2_service_pb";
import { formatTs, paymentStatusColor, paymentStatusLabel } from "../lib/payments";

interface Props {
  payments: Payment[];
  loading: boolean;
  emptyText?: string;
  onAccept?: (p: Payment) => void;
  onReject?: (p: Payment) => void;
}

export function PaymentTable({
  payments,
  loading,
  emptyText = "No payments.",
  onAccept,
  onReject,
}: Props) {
  const hasActions = Boolean(onAccept || onReject);

  return (
    <Box borderWidth="1px" rounded="md" overflow="hidden">
      {loading ? (
        <HStack p={6} justify="center">
          <Spinner />
        </HStack>
      ) : payments.length === 0 ? (
        <Text p={6} color="gray.500">
          {emptyText}
        </Text>
      ) : (
        <Table.Root size="sm" interactive>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>ID</Table.ColumnHeader>
              <Table.ColumnHeader>From</Table.ColumnHeader>
              <Table.ColumnHeader>To</Table.ColumnHeader>
              <Table.ColumnHeader>Amount</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader>Document</Table.ColumnHeader>
              <Table.ColumnHeader>Created</Table.ColumnHeader>
              <Table.ColumnHeader>Note</Table.ColumnHeader>
              {hasActions && (
                <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
              )}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {payments.map((p) => (
              <Table.Row key={p.id.toString()}>
                <Table.Cell>{p.id.toString()}</Table.Cell>
                <Table.Cell>{p.teamId.toString()}</Table.Cell>
                <Table.Cell>{p.forTeamId.toString()}</Table.Cell>
                <Table.Cell>{p.amount.toLocaleString()}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={paymentStatusColor(p.status)}>
                    {paymentStatusLabel(p.status)}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{p.documentId || "—"}</Table.Cell>
                <Table.Cell>{formatTs(p.createdAt)}</Table.Cell>
                <Table.Cell>{p.note || "—"}</Table.Cell>
                {hasActions && (
                  <Table.Cell textAlign="end">
                    {p.status === PaymentStatus.PENDING ? (
                      <HStack justify="flex-end" gap={1}>
                        {onAccept && (
                          <Button
                            size="xs"
                            variant="outline"
                            colorPalette="green"
                            onClick={() => onAccept(p)}
                          >
                            Accept
                          </Button>
                        )}
                        {onReject && (
                          <Button
                            size="xs"
                            variant="outline"
                            colorPalette="red"
                            onClick={() => onReject(p)}
                          >
                            Reject
                          </Button>
                        )}
                      </HStack>
                    ) : (
                      <Text color="gray.400">—</Text>
                    )}
                  </Table.Cell>
                )}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  );
}
