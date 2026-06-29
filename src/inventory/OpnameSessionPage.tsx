import { useCallback, useEffect, useState } from "react";
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
  Text,
} from "@chakra-ui/react";
import { PageHeader } from "../components/PageHeader";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { useAuth } from "../auth/AuthContext";
import { formatMs } from "./inventoryApi";
import {
  cancelOpnameSession,
  completeOpnameSession,
  getOpnameSession,
  OPNAME_STATUS_COLORS,
  OPNAME_STATUS_LABELS,
  type OpnameLine,
  type OpnameSession,
} from "./opnameApi";
import { CountLineDialog } from "./CountLineDialog";

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

export function OpnameSessionPage() {
  const { sessionId = "" } = useParams<{ sessionId: string }>();
  const { username } = useAuth();

  const [session, setSession] = useState<OpnameSession | undefined>();
  const [lines, setLines] = useState<OpnameLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [countLine, setCountLine] = useState<OpnameLine | null>(null);
  const [countOpen, setCountOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOpnameSession(sessionId);
      setSession(res?.session);
      setLines(res?.lines ?? []);
    } catch (err) {
      toaster.create({
        title: "Failed to load opname",
        description: errMessage(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const inProgress = session?.status === "IN_PROGRESS";

  const complete = async () => {
    setActing(true);
    try {
      await completeOpnameSession(sessionId, username ?? "system");
      toaster.create({ title: "Opname completed", type: "success" });
      await load();
    } catch (err) {
      toaster.create({ title: "Complete failed", description: errMessage(err), type: "error" });
    } finally {
      setActing(false);
    }
  };

  const cancel = async () => {
    setActing(true);
    try {
      await cancelOpnameSession(sessionId);
      toaster.create({ title: "Opname cancelled", type: "success" });
      await load();
    } catch (err) {
      toaster.create({ title: "Cancel failed", description: errMessage(err), type: "error" });
    } finally {
      setActing(false);
    }
  };

  const title = session?.name ?? `Opname ${sessionId}`;

  return (
    <Stack gap={6}>
      <PageHeader
        back={{ to: "/inventory/opname" }}
        title={title}
        breadcrumb={[
          { label: "Inventory" },
          { label: "Opname", path: "/inventory/opname" },
          { label: title },
        ]}
      >
        {inProgress && (
          <HStack>
            <Button variant="outline" disabled={acting} onClick={() => void cancel()}>
              Cancel opname
            </Button>
            <Button colorPalette="brand" loading={acting} onClick={() => void complete()}>
              Complete
            </Button>
          </HStack>
        )}
      </PageHeader>

      {loading ? (
        <Flex py={10} justify="center">
          <Spinner color="brand.solid" />
        </Flex>
      ) : !session ? (
        <Text color="fg.muted">Opname session not found.</Text>
      ) : (
        <>
          <Box borderWidth="1px" borderColor="border" rounded="lg" p={5} bg="white">
            <SimpleGrid columns={{ base: 2, md: 5 }} gap={5}>
              <Stat label="Status" value={OPNAME_STATUS_LABELS[session.status]} />
              <Stat label="Created" value={formatMs(session.createdMs)} />
              <Stat label="By" value={session.createdBy} />
              <Stat label="Progress" value={`${session.countedCount}/${session.rackCount}`} />
              <Stat label="Discrepancies" value={String(session.discrepancyCount)} />
            </SimpleGrid>
          </Box>

          <Box borderWidth="1px" rounded="md" overflow="hidden">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Rack</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">System</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Counted</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Diff</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  {inProgress && <Table.ColumnHeader textAlign="end">Action</Table.ColumnHeader>}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {lines.map((line) => {
                  const counted = line.countedCount;
                  const diff = counted !== null ? counted - line.systemCount : null;
                  return (
                    <Table.Row key={line.rackId}>
                      <Table.Cell>
                        <Text fontWeight="medium">{line.rackName}</Text>
                      </Table.Cell>
                      <Table.Cell textAlign="end">{line.systemCount}</Table.Cell>
                      <Table.Cell textAlign="end">{counted ?? "—"}</Table.Cell>
                      <Table.Cell textAlign="end">
                        {diff === null ? (
                          "—"
                        ) : (
                          <Text color={diff < 0 ? "red.500" : diff > 0 ? "green.600" : "fg.muted"}>
                            {diff > 0 ? `+${diff}` : diff}
                          </Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {counted === null ? (
                          <Badge colorPalette="gray">Pending</Badge>
                        ) : diff !== 0 ? (
                          <Badge colorPalette="orange">Discrepancy</Badge>
                        ) : (
                          <Badge colorPalette="green">Matched</Badge>
                        )}
                      </Table.Cell>
                      {inProgress && (
                        <Table.Cell textAlign="end">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              setCountLine(line);
                              setCountOpen(true);
                            }}
                          >
                            Count
                          </Button>
                        </Table.Cell>
                      )}
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Box>

          <CountLineDialog
            open={countOpen}
            onOpenChange={setCountOpen}
            sessionId={sessionId}
            line={countLine}
            onSaved={() => void load()}
          />
        </>
      )}
    </Stack>
  );
}
