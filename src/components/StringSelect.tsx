import { Select, createListCollection, Portal } from "@chakra-ui/react";

export interface StringOption {
  label: string;
  value: string;
}

interface StringSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: StringOption[];
  placeholder?: string;
  width?: string;
  disabled?: boolean;
}

// Generic string-valued dropdown — the string sibling of EnumSelect (same Chakra v3
// Select idiom). Use for dynamic option lists (e.g. selling teams) or string-keyed
// choices (search-by, sort) where the numeric EnumSelect doesn't fit.
export function StringSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  width = "200px",
  disabled,
}: StringSelectProps) {
  const collection = createListCollection({ items: options });

  return (
    <Select.Root
      collection={collection}
      value={[value]}
      onValueChange={(e) => onChange(e.value[0] ?? "")}
      width={width}
      disabled={disabled}
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
            {options.map((item) => (
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
