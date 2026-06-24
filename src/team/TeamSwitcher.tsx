import { useState } from "react";
import { Button, Flex, Spinner, Stack, Text } from "@chakra-ui/react";
import { useTeam } from "./TeamContext";
import { teamTypeColorPalette, teamTypeIcon, teamTypeLabel } from "./teamType";
import { roleLabel } from "../lib/roles";
import { ChevronIcon, WarningIcon } from "../components/icons";
import { TeamSelectDialog } from "./TeamSelectDialog";

// Sidebar team-switcher card. Replaces the old brand lockup: shows the current
// team (type icon + name + role); click to pick another team.
export function TeamSwitcher({ collapsed }: { collapsed: boolean }) {
  const { currentTeam, loading, noAccess } = useTeam();
  const [open, setOpen] = useState(false);

  if (loading && !currentTeam) {
    return (
      <Flex align="center" justify="center" gap={2} py={2} minH={10}>
        <Spinner size="sm" color="brand.solid" />
        {!collapsed && (
          <Text fontSize="sm" color="fg.muted">
            Loading…
          </Text>
        )}
      </Flex>
    );
  }

  if (noAccess) {
    return collapsed ? (
      <Flex justify="center" py={2} title="No team access">
        <WarningIcon boxSize={5} color="orange.500" />
      </Flex>
    ) : (
      <Flex
        align="center"
        gap={2}
        px={3}
        py={2}
        rounded="md"
        borderWidth="1px"
        borderColor="orange.200"
        bg="orange.50"
      >
        <WarningIcon boxSize={4} color="orange.500" />
        <Text fontSize="sm" color="orange.700">
          No team access
        </Text>
      </Flex>
    );
  }

  if (!currentTeam) return null;

  const Icon = teamTypeIcon(currentTeam.teamType);

  return (
    <>
      <Button
        variant="outline"
        w="full"
        h="auto"
        py={2}
        px={collapsed ? 0 : 2}
        gap={2}
        justifyContent={collapsed ? "center" : "flex-start"}
        title={collapsed ? currentTeam.teamName : undefined}
        onClick={() => setOpen(true)}
      >
        <Flex
          colorPalette={teamTypeColorPalette(currentTeam.teamType)}
          align="center"
          justify="center"
          boxSize={8}
          rounded="md"
          bg="colorPalette.solid"
          color="colorPalette.contrast"
          flexShrink={0}
        >
          <Icon boxSize={5} />
        </Flex>
        {!collapsed && (
          <>
            <Stack gap={0} flex="1" textAlign="start" overflow="hidden">
              <Text
                fontWeight="semibold"
                color="fg"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
              >
                {currentTeam.teamName}
              </Text>
              <Text
                fontSize="xs"
                color="fg.muted"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
              >
                {teamTypeLabel(currentTeam.teamType)} · {roleLabel(currentTeam.role)}
              </Text>
            </Stack>
            <ChevronIcon boxSize={4} color="fg.muted" flexShrink={0} />
          </>
        )}
      </Button>
      <TeamSelectDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
