import { Badge, Box, HStack, Spinner, Table, Text } from "@chakra-ui/react";
import { formatMs, type Rack } from "./inventoryApi";

interface Props {
  racks: Rack[];
  loading: boolean;
  onSelect: (rack: Rack) => void;
  emptyText?: string;
}

export function RackTable({ racks, loading, onSelect, emptyText = "No racks." }: Props) {
  return (
    <Box borderWidth="1px" rounded="md" overflow="hidden">
      {loading ? (
        <HStack p={6} justify="center">
          <Spinner />
        </HStack>
      ) : racks.length === 0 ? (
        <Text p={6} color="gray.500">
          {emptyText}
        </Text>
      ) : (
        <Table.Root size="sm" interactive>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Name</Table.ColumnHeader>
              <Table.ColumnHeader>Created</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Items</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Products</Table.ColumnHeader>
              <Table.ColumnHeader>Last opname</Table.ColumnHeader>
              <Table.ColumnHeader>Opname by</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {racks.map((rack) => (
              <Table.Row
                key={rack.id}
                cursor="pointer"
                onClick={() => onSelect(rack)}
              >
                <Table.Cell>
                  <Text fontWeight="medium">{rack.name}</Text>
                </Table.Cell>
                <Table.Cell>{formatMs(rack.createdMs)}</Table.Cell>
                <Table.Cell textAlign="end">
                  <Badge colorPalette={rack.itemCount === 0 ? "gray" : "blue"}>
                    {rack.itemCount.toLocaleString()}
                  </Badge>
                </Table.Cell>
                <Table.Cell textAlign="end">{rack.productCount.toLocaleString()}</Table.Cell>
                <Table.Cell>{formatMs(rack.lastOpnameMs)}</Table.Cell>
                <Table.Cell>{rack.lastOpnameBy ?? "—"}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  );
}
