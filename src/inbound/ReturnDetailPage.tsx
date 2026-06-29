import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Flex, SimpleGrid, Spinner, Stack, Table, Text } from "@chakra-ui/react";
import { PageHeader } from "../components/PageHeader";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { formatMs } from "../products/productApi";
import { getReturn, type ReturnDetail } from "./inboundApi";
import { StatusBadge } from "./inboundStatus";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={0}>
      <Text fontSize="xs" color="fg.muted">
        {label}
      </Text>
      <Text fontWeight="medium">{value}</Text>
    </Stack>
  );
}

export function ReturnDetailPage() {
  const { returnId = "" } = useParams<{ returnId: string }>();
  const [detail, setDetail] = useState<ReturnDetail | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getReturn(returnId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err) => {
        if (!cancelled) {
          toaster.create({
            title: "Failed to load return",
            description: errMessage(err),
            type: "error",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [returnId]);

  const title = detail?.receipt ?? `Return ${returnId}`;

  return (
    <Stack gap={6}>
      <PageHeader
        back={{ to: "/inbound/return" }}
        title={title}
        breadcrumb={[
          { label: "Inbound" },
          { label: "Return", path: "/inbound/return" },
          { label: title },
        ]}
      />

      {loading ? (
        <Flex py={10} justify="center">
          <Spinner color="brand.solid" />
        </Flex>
      ) : !detail ? (
        <Text color="fg.muted">Return not found.</Text>
      ) : (
        <>
          <Box borderWidth="1px" borderColor="border" rounded="lg" p={5} bg="white">
            <SimpleGrid columns={{ base: 2, md: 3 }} gap={5}>
              <Stat label="Reason" value={detail.reason} />
              <Stat label="Order" value={detail.orderId ?? "—"} />
              <Stat label="Created" value={formatMs(detail.createdMs)} />
              <Stat label="Accepted" value={formatMs(detail.acceptedMs)} />
              <Stat label="Items" value={detail.itemCount.toLocaleString()} />
              <Stack gap={1}>
                <Text fontSize="xs" color="fg.muted">
                  Status
                </Text>
                <Box>
                  <StatusBadge status={detail.status} />
                </Box>
              </Stack>
            </SimpleGrid>
            {detail.note && (
              <Box mt={4} pt={4} borderTopWidth="1px" borderColor="border">
                <Text fontSize="xs" color="fg.muted">
                  Note
                </Text>
                <Text fontWeight="medium">{detail.note}</Text>
              </Box>
            )}
          </Box>

          <Box borderWidth="1px" rounded="md" overflow="hidden">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>SKU</Table.ColumnHeader>
                  <Table.ColumnHeader>Product</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Count</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Price</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Total</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {detail.items.map((it) => (
                  <Table.Row key={it.sku}>
                    <Table.Cell>{it.sku}</Table.Cell>
                    <Table.Cell>{it.productName}</Table.Cell>
                    <Table.Cell textAlign="end">{it.count.toLocaleString()}</Table.Cell>
                    <Table.Cell textAlign="end">{`Rp ${it.price.toLocaleString()}`}</Table.Cell>
                    <Table.Cell textAlign="end">{`Rp ${it.total.toLocaleString()}`}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        </>
      )}
    </Stack>
  );
}
