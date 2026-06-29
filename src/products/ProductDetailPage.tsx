import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import {
  Badge,
  Box,
  Flex,
  HStack,
  Image,
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
import { STOCK_CHANGE_TYPE_LABELS } from "../inventory/inventoryApi";
import {
  formatMs,
  getWarehouseProduct,
  listProductBatches,
  listProductPlacements,
  listProductPriceGroups,
  listProductStockHistory,
  type ProductBatch,
  type ProductDetail,
  type ProductPlacementRow,
  type ProductPriceGroup,
  type ProductStockHistoryItem,
} from "./productApi";

const money = (n: number) => `Rp ${n.toLocaleString()}`;

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

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box borderWidth="1px" borderColor="border" rounded="lg" p={5} bg="white">
      <Text fontWeight="semibold" mb={4}>
        {title}
      </Text>
      {children}
    </Box>
  );
}

function TableBox({ children }: { children: ReactNode }) {
  return (
    <Box borderWidth="1px" rounded="md" overflow="hidden">
      {children}
    </Box>
  );
}

export function ProductDetailPage() {
  const { skuId = "" } = useParams<{ skuId: string }>();

  const [detail, setDetail] = useState<ProductDetail | undefined>();
  const [placements, setPlacements] = useState<ProductPlacementRow[]>([]);
  const [history, setHistory] = useState<ProductStockHistoryItem[]>([]);
  const [priceGroups, setPriceGroups] = useState<ProductPriceGroup[]>([]);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("placements");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getWarehouseProduct(skuId),
      listProductPlacements(skuId),
      listProductStockHistory(skuId),
      listProductPriceGroups(skuId),
      listProductBatches(skuId),
    ])
      .then(([d, pl, h, pg, b]) => {
        if (cancelled) return;
        setDetail(d);
        setPlacements(pl);
        setHistory(h);
        setPriceGroups(pg);
        setBatches(b);
      })
      .catch((err) => {
        if (!cancelled) {
          toaster.create({
            title: "Failed to load product",
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
  }, [skuId]);

  const title = detail?.productName ?? "Product";

  return (
    <Stack gap={6}>
      <PageHeader
        back={{ to: "/product" }}
        title={title}
        breadcrumb={[{ label: "Product", path: "/product" }, { label: title }]}
      />

      {loading ? (
        <Flex py={10} justify="center">
          <Spinner color="brand.solid" />
        </Flex>
      ) : !detail ? (
        <Text color="fg.muted">Product not found.</Text>
      ) : (
        <>
          {/* General Info */}
          <Card title="General Info">
            <HStack gap={5} align="flex-start">
              {detail.images[0] ? (
                <Image
                  src={detail.images[0]}
                  alt={detail.productName}
                  boxSize="96px"
                  rounded="md"
                  objectFit="cover"
                />
              ) : (
                <Box boxSize="96px" rounded="md" bg="gray.100" flexShrink={0} />
              )}
              <SimpleGrid columns={{ base: 2, md: 4 }} gap={5} flex="1">
                <Stat label="Product" value={detail.productName} />
                <Stat label="SKU" value={detail.skuId} />
                <Box>
                  <Text fontSize="xs" color="fg.muted">
                    Team owner
                  </Text>
                  <Badge colorPalette="green">{detail.sellingTeamName}</Badge>
                </Box>
                <Stat label="Price" value={money(detail.price)} />
              </SimpleGrid>
            </HStack>
          </Card>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
            <Card title="Stock Info">
              <SimpleGrid columns={2} gap={3}>
                <Stat label="Ready count" value={detail.readyCount.toLocaleString()} />
                <Stat label="Ready amount" value={money(detail.readyAmount)} />
                <Stat label="Ongoing count" value={detail.ongoingCount.toLocaleString()} />
                <Stat label="Ongoing amount" value={money(detail.ongoingAmount)} />
              </SimpleGrid>
            </Card>

            <Card title="Last Restock">
              {detail.lastRestock ? (
                <SimpleGrid columns={2} gap={3}>
                  <Stat label="Supplier" value={detail.lastRestock.supplier} />
                  <Stat label="Created" value={formatMs(detail.lastRestock.createdMs)} />
                  <Stat label="Accepted" value={formatMs(detail.lastRestock.acceptedMs)} />
                  <Stat label="Quantity" value={detail.lastRestock.quantity.toLocaleString()} />
                  <Stat label="Amount" value={money(detail.lastRestock.amount)} />
                </SimpleGrid>
              ) : (
                <Text color="fg.muted" fontSize="sm">
                  No restock yet.
                </Text>
              )}
            </Card>

            <Card title="Last Return">
              {detail.lastReturn ? (
                <SimpleGrid columns={2} gap={3}>
                  <Stat label="Created" value={formatMs(detail.lastReturn.createdMs)} />
                  <Stat label="Accepted" value={formatMs(detail.lastReturn.acceptedMs)} />
                  <Stat label="Quantity" value={detail.lastReturn.quantity.toLocaleString()} />
                  <Stat label="Amount" value={money(detail.lastReturn.amount)} />
                </SimpleGrid>
              ) : (
                <Text color="fg.muted" fontSize="sm">
                  No returns yet.
                </Text>
              )}
            </Card>
          </SimpleGrid>

          {/* Tabs */}
          <Tabs.Root value={tab} onValueChange={(e) => setTab(e.value)}>
            <Tabs.List>
              <Tabs.Trigger value="placements">Placements</Tabs.Trigger>
              <Tabs.Trigger value="stock-history">Stock History</Tabs.Trigger>
              <Tabs.Trigger value="price">Price</Tabs.Trigger>
              <Tabs.Trigger value="batch">Batch</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="placements">
              <TableBox>
                {placements.length === 0 ? (
                  <Text p={6} color="gray.500">
                    Not placed on any rack.
                  </Text>
                ) : (
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Rack</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">Count</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {placements.map((p) => (
                        <Table.Row key={p.rackName}>
                          <Table.Cell>{p.rackName}</Table.Cell>
                          <Table.Cell textAlign="end">{p.count.toLocaleString()}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                )}
              </TableBox>
            </Tabs.Content>

            <Tabs.Content value="stock-history">
              <TableBox>
                {history.length === 0 ? (
                  <Text p={6} color="gray.500">
                    No stock history.
                  </Text>
                ) : (
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Date</Table.ColumnHeader>
                        <Table.ColumnHeader>Type</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">Change</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">Balance</Table.ColumnHeader>
                        <Table.ColumnHeader>By</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {history.map((h) => (
                        <Table.Row key={h.id}>
                          <Table.Cell>{formatMs(h.createdMs)}</Table.Cell>
                          <Table.Cell>
                            <Badge colorPalette="purple">
                              {STOCK_CHANGE_TYPE_LABELS[h.changeType]}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell textAlign="end">
                            <Text color={h.change < 0 ? "red.500" : "green.600"}>
                              {h.change > 0 ? `+${h.change}` : h.change}
                            </Text>
                          </Table.Cell>
                          <Table.Cell textAlign="end">{h.balanceCount}</Table.Cell>
                          <Table.Cell>{h.userName}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                )}
              </TableBox>
            </Tabs.Content>

            <Tabs.Content value="price">
              <TableBox>
                {priceGroups.length === 0 ? (
                  <Text p={6} color="gray.500">
                    No priced stock.
                  </Text>
                ) : (
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Price</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">Ready qty</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">Ready amount</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {priceGroups.map((g) => (
                        <Table.Row key={g.price}>
                          <Table.Cell>{money(g.price)}</Table.Cell>
                          <Table.Cell textAlign="end">{g.readyCount.toLocaleString()}</Table.Cell>
                          <Table.Cell textAlign="end">{money(g.readyAmount)}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                )}
              </TableBox>
            </Tabs.Content>

            <Tabs.Content value="batch">
              <TableBox>
                {batches.length === 0 ? (
                  <Text p={6} color="gray.500">
                    No batches.
                  </Text>
                ) : (
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Created</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">Init count</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">Init amount</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">Ready count</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">Ready amount</Table.ColumnHeader>
                        <Table.ColumnHeader>By</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {batches.map((b) => (
                        <Table.Row key={b.id}>
                          <Table.Cell>{formatMs(b.createdMs)}</Table.Cell>
                          <Table.Cell textAlign="end">{b.initCount.toLocaleString()}</Table.Cell>
                          <Table.Cell textAlign="end">{money(b.initAmount)}</Table.Cell>
                          <Table.Cell textAlign="end">{b.readyCount.toLocaleString()}</Table.Cell>
                          <Table.Cell textAlign="end">{money(b.readyAmount)}</Table.Cell>
                          <Table.Cell>{b.createdBy}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                )}
              </TableBox>
            </Tabs.Content>
          </Tabs.Root>
        </>
      )}
    </Stack>
  );
}
