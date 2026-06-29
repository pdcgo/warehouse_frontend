import { Select, createListCollection, Portal } from "@chakra-ui/react";

export interface EnumOption {
  label: string;
  value: number;
}

interface EnumSelectProps {
  value: number;
  onChange: (value: number) => void;
  options: EnumOption[];
  placeholder?: string;
  width?: string;
}

// Generic numeric-enum dropdown (mirrors RolePicker). Values are protobuf-es
// enum numbers; strings are used internally because Select works on strings.
export function EnumSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  width = "200px",
}: EnumSelectProps) {
  const items = options.map((o) => ({ label: o.label, value: String(o.value) }));
  const collection = createListCollection({ items });

  return (
    <Select.Root
      collection={collection}
      value={[String(value)]}
      onValueChange={(e) => onChange(Number(e.value[0]))}
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
