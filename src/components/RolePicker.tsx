import { Select, createListCollection, Portal } from "@chakra-ui/react";
import { Role } from "../gen/role_base/v1/role_pb";
import { roleLabel, rolesForTeamType } from "../lib/roles";
import { TeamType } from "../gen/user_iface/v2/v2_user_pb";

interface RolePickerProps {
  value: Role;
  onChange: (role: Role) => void;
  /**
   * Scope the offered roles to a team type (Warehouse / Selling / Admin). Omit to
   * offer every assignable role. The grouping lives in `rolesForTeamType` (lib/roles).
   */
  teamType?: TeamType;
  /** Prepend the "All roles" (UNSPECIFIED) option — used for list filters. */
  includeAll?: boolean;
  width?: string;
  placeholder?: string;
}

// RolePicker is the shareable role selector (replaces the old RoleSelect). With no
// `teamType` and no `includeAll` it renders exactly the old flat role list; pass
// `teamType` to scope the choices to a team's type.
export function RolePicker({
  value,
  onChange,
  teamType,
  includeAll = false,
  width = "220px",
  placeholder = "Select role",
}: RolePickerProps) {
  const items = [
    ...(includeAll ? [{ label: "All roles", value: String(Role.UNSPECIFIED) }] : []),
    ...rolesForTeamType(teamType).map((o) => ({ label: o.label, value: String(o.value) })),
  ];
  // Keep the current selection displayable: if `value` is a real role outside the
  // scoped list (e.g. a member whose role doesn't match this team type), append it
  // so the trigger shows the role instead of a blank placeholder. (UNSPECIFIED is
  // "nothing selected" and correctly shows the placeholder.)
  if (value !== Role.UNSPECIFIED && !items.some((i) => i.value === String(value))) {
    items.push({ label: roleLabel(value), value: String(value) });
  }
  const collection = createListCollection({ items });

  return (
    <Select.Root
      collection={collection}
      value={[String(value)]}
      onValueChange={(e) => onChange(Number(e.value[0]) as Role)}
      width={width}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder={placeholder} />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {items.map((item) => (
              <Select.Item item={item} key={item.value}>
                {item.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
