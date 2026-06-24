import { Select, createListCollection, Portal } from "@chakra-ui/react";
import { Role } from "../gen/role_base/v1/role_pb";
import { ROLE_OPTIONS } from "../lib/roles";

interface RoleSelectProps {
  value: Role;
  onChange: (role: Role) => void;
  // include the "All roles" (UNSPECIFIED) option — used for the list filter.
  includeAll?: boolean;
  width?: string;
}

export function RoleSelect({
  value,
  onChange,
  includeAll = false,
  width = "220px",
}: RoleSelectProps) {
  const items = [
    ...(includeAll ? [{ label: "All roles", value: String(Role.UNSPECIFIED) }] : []),
    ...ROLE_OPTIONS.map((o) => ({ label: o.label, value: String(o.value) })),
  ];
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
          <Select.ValueText placeholder="Select role" />
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
