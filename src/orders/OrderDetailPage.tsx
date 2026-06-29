import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { PageHeader } from "../components/PageHeader";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { useAuth } from "../auth/AuthContext";
import { formatMs } from "../products/productApi";
import {
  acceptOrder,
  getOrder,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  type OrderDetail,
} from "./orderApi";
import { MarkProblemDialog } from "./MarkProblemDialog";

const money = (n: number) => `Rp ${n.toLocaleString()}`;

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack gap={0}>
      <Text fontSize="xs" color="fg.muted">
        {label}
      </Text>
      {typeof value === "string" ? <Text fontWeight="medium">{value}</Text> : value}
    </Stack>
  );
}

export function OrderDetailPage() {
  const { orderId = "" } = useParams<{ orderId: string }>();
  const { username } = useAuth();

  const [order, setOrder] = useState<OrderDetail | undefined>();
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [problemOpen, setProblemOpen] = useState(false);
  const [tab, setTab] = useState("items");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrder(await getOrder(orderId));
    } catch (err) {
      toaster.create({
        title: "Failed to load order",
        description: errMessage(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const accept = async () => {
    setActing(true);
    try {
      await acceptOrder(orderId, username ?? "system");
      toaster.create({ title: "Order accepted", type: "success" });
      await load();
    } catch (err) {
      toaster.create({ title: "Accept failed", description: errMessage(err), type: "error" });
    } finally {
      setActing(false);
    }
  };

  const pending = order?.status === "PENDING";
  const title = order?.orderRef ?? `Order ${orderId}`;

  return (
    <Stack gap={6}>
      <PageHeader
        back={{ to: "/order" }}
        title={title}
        breadcrumb={[{ label: "Order", path: "/order" }, { label: title }]}
      >
        {pending && (
          <HStack>
            <Button variant="outline" disabled={acting} onClick={() => setProblemOpen(true)}>
              Mark problem
            </Button>
            <Button colorPalette="brand" loading={acting} onClick={() => void accept()}>
              Accept
            </Button>
          </HStack>
        )}
      </PageHeader>

      {loading ? (
        <Flex py={10} justify="center">
          <Spinner color="brand.solid" />
        </Flex>
      ) : !order ? (
        <Text color="fg.muted">Order not found.</Text>
      ) : (
        <>
          <Box borderWidth="1px" borderColor="border" rounded="lg" p={5} bg="white">
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={5}>
              <Stat label="Order ref" value={order.orderRef} />
              <Stat label="Created" value={formatMs(order.createdMs)} />
              <Stat label="Selling team" value={order.sellingTeamName} />
              <Stat
                label="Status"
                value={
                  <Badge colorPalette={ORDER_STATUS_COLORS[order.status]}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                }
              />
              <Stat label="Items" value={order.itemCount.toLocaleString()} />
              <Stat label="Amount" value={money(order.amount)} />
              <Stat label="Recipient" value={order.recipient} />
              <Stat label="Courier" value={order.courier} />
              {order.acceptedMs && <Stat label="Accepted" value={formatMs(order.acceptedMs)} />}
              {order.problemNote && <Stat label="Problem" value={order.problemNote} />}
            </SimpleGrid>
          </Box>

          <Tabs.Root value={tab} onValueChange={(e) => setTab(e.value)}>
            <Tabs.List>
              <Tabs.Trigger value="items">Items</Tabs.Trigger>
              <Tabs.Trigger value="history">History</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="items">
              <Box borderWidth="1px" rounded="md" overflow="hidden">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Product</Table.ColumnHeader>
                      <Table.ColumnHeader>SKU</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end">Qty</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end">Price</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end">Amount</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {order.items.map((it) => (
                      <Table.Row key={it.sku}>
                        <Table.Cell>
                          <Text fontWeight="medium">{it.productName}</Text>
                        </Table.Cell>
                        <Table.Cell>{it.sku}</Table.Cell>
                        <Table.Cell textAlign="end">{it.qty}</Table.Cell>
                        <Table.Cell textAlign="end">{money(it.price)}</Table.Cell>
                        <Table.Cell textAlign="end">{money(it.amount)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </Tabs.Content>

            <Tabs.Content value="history">
              <Box borderWidth="1px" rounded="md" overflow="hidden">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Date</Table.ColumnHeader>
                      <Table.ColumnHeader>Status</Table.ColumnHeader>
                      <Table.ColumnHeader>By</Table.ColumnHeader>
                      <Table.ColumnHeader>Note</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {order.history.map((h, i) => (
                      <Table.Row key={i}>
                        <Table.Cell>{formatMs(h.createdMs)}</Table.Cell>
                        <Table.Cell>
                          <Badge colorPalette={ORDER_STATUS_COLORS[h.status]}>
                            {ORDER_STATUS_LABELS[h.status]}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>{h.byUser}</Table.Cell>
                        <Table.Cell>{h.note || "—"}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </Tabs.Content>
          </Tabs.Root>

          <MarkProblemDialog
            open={problemOpen}
            onOpenChange={setProblemOpen}
            orderId={orderId}
            onSaved={() => void load()}
          />
        </>
      )}
    </Stack>
  );
}
