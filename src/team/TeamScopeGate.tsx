import type { ReactNode } from "react";
import { Flex, Spinner, Text } from "@chakra-ui/react";
import { useTeam } from "./TeamContext";
import { WarningIcon } from "../components/icons";

// Gates team-scoped page content: shows a spinner while teams load and a notice
// when no team is selected, so children can safely assume a current team.
export function TeamScopeGate({ children }: { children: ReactNode }) {
  const { currentTeam, loading, noAccess } = useTeam();

  if (loading && !currentTeam) {
    return (
      <Flex py={10} justify="center">
        <Spinner color="brand.solid" />
      </Flex>
    );
  }

  if (!currentTeam) {
    return (
      <Flex
        align="center"
        gap={2}
        p={4}
        rounded="md"
        borderWidth="1px"
        borderColor="orange.200"
        bg="orange.50"
      >
        <WarningIcon boxSize={4} color="orange.500" />
        <Text color="orange.700">
          {noAccess
            ? "You don't have access to any team."
            : "Select a team to continue."}
        </Text>
      </Flex>
    );
  }

  return <>{children}</>;
}
