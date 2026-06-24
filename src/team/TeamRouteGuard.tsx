import type { ReactNode } from "react";
import { Flex, Spinner } from "@chakra-ui/react";
import { Navigate, useLocation } from "react-router-dom";
import { useTeam } from "./TeamContext";
import { firstPathFor, isPathAllowed } from "../nav";
import { TeamType } from "../gen/user_iface/v2/v2_user_pb";

// Sends `/` and any route not in the current team's menu to that team's default page,
// so team types can't reach pages outside their menu by direct URL.
export function TeamRouteGuard({ children }: { children: ReactNode }) {
  const { currentTeam, loading } = useTeam();
  const { pathname } = useLocation();

  if (loading && !currentTeam) {
    return (
      <Flex py={10} justify="center">
        <Spinner color="brand.solid" />
      </Flex>
    );
  }

  const teamType = currentTeam?.teamType ?? TeamType.UNSPECIFIED;
  const fallback = firstPathFor(teamType) ?? "/settings/general";

  if ((pathname === "/" || !isPathAllowed(pathname, teamType)) && pathname !== fallback) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
