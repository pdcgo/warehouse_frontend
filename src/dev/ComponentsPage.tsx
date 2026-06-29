import { useState } from "react";
import { Box, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { TeamPicker } from "../components/TeamPicker";
import { ShippingPicker } from "../components/ShippingPicker";
import { RolePicker } from "../components/RolePicker";
import { TeamType } from "../gen/common/v1/team_pb";
import { TeamType as UserTeamType } from "../gen/user_iface/v2/v2_user_pb";
import { Role } from "../gen/role_base/v1/role_pb";
import { roleLabel } from "../lib/roles";
import { ComponentShowcase } from "./ComponentShowcase";

function Readout({ id }: { id: bigint }) {
  return (
    <HStack gap={2}>
      <Text fontSize="sm" color="fg.muted">
        Selected team id:
      </Text>
      <Text fontSize="sm" fontWeight="medium">
        {id === 0n ? "—" : id.toString()}
      </Text>
    </HStack>
  );
}

function IdsReadout({ label, ids }: { label: string; ids: bigint[] }) {
  return (
    <HStack gap={2}>
      <Text fontSize="sm" color="fg.muted">
        {label}:
      </Text>
      <Text fontSize="sm" fontWeight="medium">
        {ids.length === 0 ? "—" : ids.map((i) => i.toString()).join(", ")}
      </Text>
    </HStack>
  );
}

function RoleReadout({ role }: { role: Role }) {
  return (
    <HStack gap={2}>
      <Text fontSize="sm" color="fg.muted">
        Selected role:
      </Text>
      <Text fontSize="sm" fontWeight="medium">
        {role === Role.UNSPECIFIED ? "—" : roleLabel(role)}
      </Text>
    </HStack>
  );
}

// Internal dev-only gallery of shareable components. Hidden from the sidebar and
// mounted outside the team-gated Layout (see router.tsx) — reachable at /components.
// Add a component by adding one more <ComponentShowcase> section below.
export function ComponentsPage() {
  const [teamId, setTeamId] = useState<bigint>(0n);
  const [typedTeamId, setTypedTeamId] = useState<bigint>(0n);
  const [warehouseTeamId, setWarehouseTeamId] = useState<bigint>(0n);
  const [shippingIds, setShippingIds] = useState<bigint[]>([]);
  const [shippingOne, setShippingOne] = useState<bigint[]>([]);
  const [role, setRole] = useState<Role>(Role.UNSPECIFIED);
  const [warehouseRole, setWarehouseRole] = useState<Role>(Role.UNSPECIFIED);
  const [roleFilter, setRoleFilter] = useState<Role>(Role.UNSPECIFIED);

  return (
    <Box p={8} maxW="5xl" mx="auto">
      <Stack gap={6}>
        <Stack gap={1}>
          <Heading size="lg">Components</Heading>
          <Text color="fg.muted">Internal dev gallery of shareable components.</Text>
        </Stack>

        <ComponentShowcase
          title="TeamPicker"
          description="Searchable team selector (value/onChange), backed by TeamService.publicTeamList."
          usage="<TeamPicker value={id} onChange={setId} allowAny />"
        >
          <Stack gap={3} align="flex-start">
            <TeamPicker value={teamId} onChange={setTeamId} allowAny />
            <Readout id={teamId} />
          </Stack>
        </ComponentShowcase>

        <ComponentShowcase
          title="TeamPicker — type filter"
          description="Adds a Warehouse/Selling/Admin dropdown on the left; the chosen type scopes the server search (team_type)."
          usage="<TeamPicker showTypeFilter value={id} onChange={setId} allowAny />"
        >
          <Stack gap={3} align="flex-start">
            <TeamPicker
              showTypeFilter
              value={typedTeamId}
              onChange={setTypedTeamId}
              allowAny
              width="380px"
            />
            <Readout id={typedTeamId} />
          </Stack>
        </ComponentShowcase>

        <ComponentShowcase
          title="TeamPicker — warehouse-locked"
          description="Locked to warehouse-type teams via the teamType prop; no dropdown, the filter is applied silently."
          usage="<TeamPicker teamType={TeamType.WAREHOUSE} value={id} onChange={setId} />"
        >
          <Stack gap={3} align="flex-start">
            <TeamPicker
              teamType={TeamType.WAREHOUSE}
              value={warehouseTeamId}
              onChange={setWarehouseTeamId}
              allowAny
            />
            <Readout id={warehouseTeamId} />
          </Stack>
        </ComponentShowcase>

        <ComponentShowcase
          title="RolePicker"
          description="Shareable role selector (replaces RoleSelect). value/onChange over the Role enum; offers every assignable role by default."
          usage="<RolePicker value={role} onChange={setRole} />"
        >
          <Stack gap={3} align="flex-start">
            <RolePicker value={role} onChange={setRole} />
            <RoleReadout role={role} />
          </Stack>
        </ComponentShowcase>

        <ComponentShowcase
          title="RolePicker — scoped to a team type"
          description="teamType scopes the offered roles (Warehouse roles for warehouse teams, Team/CS for selling, etc.). Here: warehouse-only."
          usage="<RolePicker teamType={TeamType.WAREHOUSE} value={role} onChange={setRole} />"
        >
          <Stack gap={3} align="flex-start">
            <RolePicker
              teamType={UserTeamType.WAREHOUSE}
              value={warehouseRole}
              onChange={setWarehouseRole}
            />
            <RoleReadout role={warehouseRole} />
          </Stack>
        </ComponentShowcase>

        <ComponentShowcase
          title="RolePicker — list filter"
          description="includeAll prepends an 'All roles' (UNSPECIFIED) option, for list/table role filters."
          usage="<RolePicker includeAll value={role} onChange={setRole} />"
        >
          <Stack gap={3} align="flex-start">
            <RolePicker includeAll value={roleFilter} onChange={setRoleFilter} />
            <RoleReadout role={roleFilter} />
          </Stack>
        </ComponentShowcase>

        <ComponentShowcase
          title="ShippingPicker — multi-select"
          description="An 'Add courier' button opens a searchable popup to freely toggle couriers (multi-select), backed by ShipmentService.publicShipmentList (loaded once, filtered client-side). Selected couriers show as removable chips."
          usage="<ShippingPicker value={ids} onChange={setIds} allowAny />"
        >
          <Stack gap={3} align="flex-start">
            <ShippingPicker value={shippingIds} onChange={setShippingIds} allowAny />
            <IdsReadout label="Selected shipping ids" ids={shippingIds} />
          </Stack>
        </ComponentShowcase>

        <ComponentShowcase
          title="ShippingPicker — single-select"
          description="Same component with multiple={false} — the popup picks one courier and closes (replaces on select)."
          usage="<ShippingPicker multiple={false} value={ids} onChange={setIds} allowAny />"
        >
          <Stack gap={3} align="flex-start">
            <ShippingPicker
              multiple={false}
              value={shippingOne}
              onChange={setShippingOne}
              allowAny
            />
            <IdsReadout label="Selected shipping id" ids={shippingOne} />
          </Stack>
        </ComponentShowcase>
      </Stack>
    </Box>
  );
}
