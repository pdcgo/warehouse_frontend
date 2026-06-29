import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Flex,
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
import {
  formatMs,
  getRack,
  listRackOpnameLog,
  listRackPlacementLog,
  listRackProducts,
  STOCK_CHANGE_TYPE_LABELS,
  type OpnameItem,
  type PlacementLogItem,
  type Rack,
  type RackProduct,
} from "./inventoryApi";
import { AdjustRackDialog } from "./AdjustRackDialog";

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

export function RackDetailPage() {
  const { rackId = "" } = useParams<{ rackId: string }>();

  const [rack, setRack] = useState<Rack | undefined>();
  const [products, setProducts] = useState<RackProduct[]>([]);
  const [log, setLog] = useState<PlacementLogItem[]>([]);
  const [opname, setOpname] = useState<OpnameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("placement-history");
  const [adjustOpen, setAdjustOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p, l, o] = await Promise.all([
        getRack(rackId),
        listRackProducts(rackId),
        listRackPlacementLog(rackId),
        listRackOpnameLog(rackId),
      ]);
      setRack(r);
      setProducts(p);
      setLog(l);
      setOpname(o);
    } catch (err) {
      toaster.create({
        title: "Failed to load rack",
        description: errMessage(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [rackId]);

  useEffect(() => {
    void load();
  }, [load]);

  const title = rack?.name ?? `Rack ${rackId}`;

  return (
    <Stack gap={6}>
      <PageHeader
        back={{ to: "/inventory/placements" }}
        title={title}
        breadcrumb={[
          { label: "Inventory" },
          { label: "Placement", path: "/inventory/placements" },
          { label: title },
        ]}
      >
        <Button colorPalette="brand" disabled={!rack} onClick={() => setAdjustOpen(true)}>
          Adjust
        </Button>
      </PageHeader>

      {loading ? (
        <Flex py={10} justify="center">
          <Spinner color="brand.solid" />
        </Flex>
      ) : !rack ? (
        <Text color="fg.muted">Rack not found.</Text>
      ) : (
        <>
          <Box borderWidth="1px" borderColor="border" rounded="lg" p={5} bg="white">
            <SimpleGrid columns={{ base: 2, md: 5 }} gap={5}>
              <Stat label="Created" value={formatMs(rack.createdMs)} />
              <Stat label="Item count" value={rack.itemCount.toLocaleString()} />
              <Stat label="Product count" value={rack.productCount.toLocaleString()} />
              <Stat label="Last opname" value={formatMs(rack.lastOpnameMs)} />
              <Stat label="Last opname by" value={rack.lastOpnameBy ?? "—"} />
            </SimpleGrid>
          </Box>

          <Tabs.Root value={tab} onValueChange={(e) => setTab(e.value)}>
            <Tabs.List>
              <Tabs.Trigger value="placement-history">Placement History</Tabs.Trigger>
              <Tabs.Trigger value="product">Product</Tabs.Trigger>
              <Tabs.Trigger value="opname-history">Opname History</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="placement-history">
              <Box borderWidth="1px" rounded="md" overflow="hidden">
                {log.length === 0 ? (
                  <Text p={6} color="gray.500">
                    No placement history on this rack.
                  </Text>
                ) : (
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Date</Table.ColumnHeader>
                        <Table.ColumnHeader>Type</Table.ColumnHeader>
                        <Table.ColumnHeader>Product</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">Change</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">Balance</Table.ColumnHeader>
                        <Table.ColumnHeader>By</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {log.map((item) => (
                        <Table.Row key={item.id}>
                          <Table.Cell>{formatMs(item.createdMs)}</Table.Cell>
                          <Table.Cell>
                            <Badge colorPalette="purple">
                              {STOCK_CHANGE_TYPE_LABELS[item.changeType]}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>{item.productName}</Table.Cell>
                          <Table.Cell textAlign="end">
                            <Text color={item.change < 0 ? "red.500" : "green.600"}>
                              {item.change > 0 ? `+${item.change}` : item.change}
                            </Text>
                          </Table.Cell>
                          <Table.Cell textAlign="end">{item.balanceCount}</Table.Cell>
                          <Table.Cell>{item.userName}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                )}
              </Box>
            </Tabs.Content>

            <Tabs.Content value="product">
              <Box borderWidth="1px" rounded="md" overflow="hidden">
                {products.length === 0 ? (
                  <Text p={6} color="gray.500">
                    No products placed on this rack.
                  </Text>
                ) : (
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Product</Table.ColumnHeader>
                        <Table.ColumnHeader>ID</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">Items</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {products.map((p) => (
                        <Table.Row key={p.productId}>
                          <Table.Cell>
                            <Text fontWeight="medium">{p.name}</Text>
                          </Table.Cell>
                          <Table.Cell>{p.productId}</Table.Cell>
                          <Table.Cell textAlign="end">
                            <Badge colorPalette="blue">{p.count.toLocaleString()}</Badge>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                )}
              </Box>
            </Tabs.Content>

            <Tabs.Content value="opname-history">
              <Box borderWidth="1px" rounded="md" overflow="hidden">
                {opname.length === 0 ? (
                  <Text p={6} color="gray.500">
                    No opname history on this rack.
                  </Text>
                ) : (
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Date</Table.ColumnHeader>
                        <Table.ColumnHeader>By</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">Previous</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">New</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">Change</Table.ColumnHeader>
                        <Table.ColumnHeader>Note</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {opname.map((item) => {
                        const diff = item.newCount - item.previousCount;
                        return (
                          <Table.Row key={item.id}>
                            <Table.Cell>{formatMs(item.createdMs)}</Table.Cell>
                            <Table.Cell>{item.byUser}</Table.Cell>
                            <Table.Cell textAlign="end">{item.previousCount}</Table.Cell>
                            <Table.Cell textAlign="end">{item.newCount}</Table.Cell>
                            <Table.Cell textAlign="end">
                              <Text color={diff < 0 ? "red.500" : diff > 0 ? "green.600" : "fg.muted"}>
                                {diff > 0 ? `+${diff}` : diff}
                              </Text>
                            </Table.Cell>
                            <Table.Cell>{item.note || "—"}</Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Root>
                )}
              </Box>
            </Tabs.Content>
          </Tabs.Root>

          <AdjustRackDialog
            open={adjustOpen}
            onOpenChange={setAdjustOpen}
            rack={rack}
            onSaved={() => void load()}
          />
        </>
      )}
    </Stack>
  );
}
