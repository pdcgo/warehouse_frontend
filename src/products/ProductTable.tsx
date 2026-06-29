import { Badge, Box, HStack, Image, Spinner, Stack, Table, Text } from "@chakra-ui/react";
import { formatMs, type WarehouseProductRow } from "./productApi";

interface Props {
  rows: WarehouseProductRow[];
  loading: boolean;
  emptyText?: string;
  onSelect?: (row: WarehouseProductRow) => void;
}

export function ProductTable({ rows, loading, emptyText = "No products.", onSelect }: Props) {
  return (
    <Box borderWidth="1px" rounded="md" overflow="hidden">
      {loading ? (
        <HStack p={6} justify="center">
          <Spinner />
        </HStack>
      ) : rows.length === 0 ? (
        <Text p={6} color="gray.500">
          {emptyText}
        </Text>
      ) : (
        <Table.Root size="sm" interactive>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Image</Table.ColumnHeader>
              <Table.ColumnHeader>Product</Table.ColumnHeader>
              <Table.ColumnHeader>SKU</Table.ColumnHeader>
              <Table.ColumnHeader>Selling Team</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Ready</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Pending</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Price</Table.ColumnHeader>
              <Table.ColumnHeader>Last In</Table.ColumnHeader>
              <Table.ColumnHeader>Last Out</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((row) => (
              <Table.Row
                key={row.skuId}
                cursor={onSelect ? "pointer" : undefined}
                onClick={onSelect ? () => onSelect(row) : undefined}
              >
                <Table.Cell>
                  {row.image ? (
                    <Image
                      src={row.image}
                      alt={row.productName}
                      boxSize="40px"
                      rounded="sm"
                      objectFit="cover"
                    />
                  ) : (
                    <Box boxSize="40px" rounded="sm" bg="gray.100" />
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Stack gap={0}>
                    <Text>{row.productName}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {row.productRefId} / {row.variantRefId}
                    </Text>
                  </Stack>
                </Table.Cell>
                <Table.Cell>{row.skuId}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette="green">{row.sellingTeamName}</Badge>
                </Table.Cell>
                <Table.Cell textAlign="end">
                  <Badge colorPalette={row.stockReady === 0 ? "red" : "green"}>
                    {row.stockReady.toLocaleString()}
                  </Badge>
                </Table.Cell>
                <Table.Cell textAlign="end">{row.stockPending.toLocaleString()}</Table.Cell>
                <Table.Cell textAlign="end">{row.price.toLocaleString()}</Table.Cell>
                <Table.Cell>{formatMs(row.lastInboundMs)}</Table.Cell>
                <Table.Cell>{formatMs(row.lastOutboundMs)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  );
}
