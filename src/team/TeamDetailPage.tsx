import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { Box, Flex, Heading, SimpleGrid, Spinner, Stack, Text } from "@chakra-ui/react";
import { PageHeader } from "../components/PageHeader";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { teamClient } from "../lib/clients";
import type { Team } from "../gen/common/v1/common_pb";
import { TeamMemberList } from "./TeamMemberList";

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

function parseId(raw: string): bigint {
  try {
    return BigInt(raw);
  } catch {
    return 0n;
  }
}

export function TeamDetailPage() {
  const { teamId = "" } = useParams<{ teamId: string }>();
  const id = parseId(teamId);

  const [team, setTeam] = useState<Team | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id <= 0n) {
      setTeam(undefined);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    teamClient
      .publicTeamIDs({ ids: [id] })
      .then((res) => {
        if (!cancelled) setTeam(res.data[id.toString()]);
      })
      .catch((err) => {
        if (!cancelled) {
          toaster.create({
            title: "Failed to load team",
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
  }, [id]);

  const title = team?.name || (id > 0n ? `Team ${id.toString()}` : "Team");

  return (
    <Stack gap={6}>
      <PageHeader
        back={{ to: "/team" }}
        title={title}
        breadcrumb={[{ label: "Team", path: "/team" }, { label: title }]}
      />

      {loading ? (
        <Flex py={10} justify="center">
          <Spinner color="brand.solid" />
        </Flex>
      ) : !team ? (
        <Text color="fg.muted">Team not found.</Text>
      ) : (
        <>
          <Card title="General Info">
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={5}>
              <Stat label="Name" value={team.name || "—"} />
              <Stat label="Team code" value={team.teamCode || "—"} />
              <Stat label="Type" value={team.type || "—"} />
              <Stat
                label="Contact number"
                value={team.info?.contactNumber || "—"}
              />
              <Stat
                label="Return warehouse"
                value={
                  team.info && team.info.returnWarehouseId > 0n
                    ? team.info.returnWarehouseId.toString()
                    : "—"
                }
              />
              <Stat
                label="Return user"
                value={
                  team.info && team.info.returnUserId > 0n
                    ? team.info.returnUserId.toString()
                    : "—"
                }
              />
            </SimpleGrid>
          </Card>

          <Stack gap={3}>
            <Heading size="md">Members</Heading>
            <TeamMemberList teamId={id} />
          </Stack>
        </>
      )}
    </Stack>
  );
}
