import { Badge, Box, HStack, Spinner, Table, Text } from "@chakra-ui/react";
import { formatMs } from "../products/productApi";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, type OrderRow } from "./orderApi";

const money = (n: number) => `Rp ${n.toLocaleString()}`;

interface Props {
  orders: OrderRow[];
  loading: boolean;
  onSelect: (order: OrderRow) => void;
  emptyText?: string;
}

export function OrderTable({ orders, loading, onSelect, emptyText = "No orders." }: Props) {
  return (
    <Box borderWidth="1px" rounded="md" overflow="hidden">
      {loading ? (
        <HStack p={6} justify="center">
          <Spinner />
        </HStack>
      ) : orders.length === 0 ? (
        <Text p={6} color="gray.500">
          {emptyText}
        </Text>
      ) : (
        <Table.Root size="sm" interactive>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Order ref</Table.ColumnHeader>
              <Table.ColumnHeader>Created</Table.ColumnHeader>
              <Table.ColumnHeader>Selling team</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Items</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Amount</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {orders.map((o) => (
              <Table.Row key={o.id} cursor="pointer" onClick={() => onSelect(o)}>
                <Table.Cell>
                  <Text fontWeight="medium">{o.orderRef}</Text>
                </Table.Cell>
                <Table.Cell>{formatMs(o.createdMs)}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette="green">{o.sellingTeamName}</Badge>
                </Table.Cell>
                <Table.Cell textAlign="end">{o.itemCount.toLocaleString()}</Table.Cell>
                <Table.Cell textAlign="end">{money(o.amount)}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={ORDER_STATUS_COLORS[o.status]}>
                    {ORDER_STATUS_LABELS[o.status]}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  );
}
