import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Combobox,
  createListCollection,
  Flex,
  Portal,
  Select,
  Spinner,
  useListCollection,
} from "@chakra-ui/react";
import { teamClient } from "../lib/clients";
import { toaster } from "./Toaster";
import { errMessage } from "../lib/errors";
import { TeamType } from "../gen/common/v1/team_pb";

interface TeamItem {
  label: string;
  value: string;
}

interface TeamPickerProps {
  value: bigint;
  onChange: (id: bigint) => void;
  /** Allow clearing the selection back to 0n (for optional/counterparty filters). */
  allowAny?: boolean;
  placeholder?: string;
  width?: string;
  /**
   * Lock the search to a single team type (e.g. TeamType.WAREHOUSE for a
   * "warehouse select"). No type dropdown is shown; the filter is applied silently.
   */
  teamType?: TeamType;
  /**
   * Render a Warehouse/Selling/Admin type selector joined into the same input on the
   * left so the user can scope the search by type. Ignored when `teamType` is set.
   */
  showTypeFilter?: boolean;
}

const TYPE_OPTIONS = [
  { label: "All types", value: TeamType.UNSPECIFIED },
  { label: "Warehouse", value: TeamType.WAREHOUSE },
  { label: "Selling", value: TeamType.SELLING },
  { label: "Admin", value: TeamType.ADMIN },
];

function teamLabel(name: string, teamCode: string, id: bigint): string {
  const base = name || `Team ${id.toString()}`;
  return teamCode ? `${base} (${teamCode})` : base;
}

// Borderless type selector used as the left segment of the unified picker field.
function InlineTypeSelect({
  value,
  onChange,
  width = "130px",
}: {
  value: number;
  onChange: (value: number) => void;
  width?: string;
}) {
  const items = TYPE_OPTIONS.map((o) => ({ label: o.label, value: String(o.value) }));
  const collection = createListCollection({ items });
  return (
    <Select.Root
      collection={collection}
      value={[String(value)]}
      onValueChange={(e) => onChange(Number(e.value[0]))}
      width={width}
      flexShrink={0}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger
          borderWidth="0"
          rounded="0"
          bg="transparent"
          _focusVisible={{ boxShadow: "none", outline: "none" }}
        >
          <Select.ValueText />
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

// TeamPicker is a searchable team selector backed by the public TeamService.
// It queries the server on each (debounced) keystroke, so it scales past a
// single page of teams. Optionally scopes results by team type — locked via the
// `teamType` prop, or user-selectable via `showTypeFilter` (joined into one input).
export function TeamPicker({
  value,
  onChange,
  allowAny = false,
  placeholder = "Search team…",
  width = "240px",
  teamType,
  showTypeFilter = false,
}: TeamPickerProps) {
  const { collection, set } = useListCollection<TeamItem>({
    initialItems: [],
    itemToString: (item) => item.label,
    itemToValue: (item) => item.value,
  });
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedType, setSelectedType] = useState<TeamType>(TeamType.UNSPECIFIED);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // `teamType` (if given) locks the filter; otherwise the dropdown's selection applies.
  const locked = teamType !== undefined;
  const effectiveType = locked ? teamType : selectedType;
  const showDropdown = showTypeFilter && !locked;

  const search = useCallback(
    async (q: string, type: TeamType) => {
      setLoading(true);
      try {
        const res = await teamClient.publicTeamList({
          q,
          teamType: type,
          page: { page: 1n, limit: 25n },
        });
        set(
          res.datas.map((t) => ({
            label: teamLabel(t.name, t.teamCode, t.id),
            value: t.id.toString(),
          })),
        );
      } catch (err) {
        toaster.create({
          title: "Failed to load teams",
          description: errMessage(err),
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [set],
  );

  // Load the first page on mount and resolve the label of any preselected team
  // so it renders even though it may not be in the first search page.
  useEffect(() => {
    void search("", effectiveType);
    if (value > 0n) {
      void (async () => {
        try {
          const res = await teamClient.publicTeamIDs({ ids: [value] });
          const t = res.data[value.toString()];
          if (t) setInputValue(teamLabel(t.name, t.teamCode, t.id));
        } catch {
          /* best-effort label resolution */
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The combobox segment. `bare` strips its border so it can sit inside the unified
  // field next to the type selector (the outer Flex owns the border instead).
  const combobox = (bare: boolean) => (
    <Combobox.Root
      collection={collection}
      width={bare ? undefined : width}
      flex={bare ? "1" : undefined}
      minW={0}
      value={value > 0n ? [value.toString()] : []}
      inputValue={inputValue}
      onInputValueChange={(details) => {
        setInputValue(details.inputValue);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(
          () => void search(details.inputValue, effectiveType),
          300,
        );
      }}
      onValueChange={(details) => {
        const next = details.value[0];
        onChange(next ? BigInt(next) : 0n);
      }}
      openOnClick
    >
      <Combobox.Control>
        <Combobox.Input
          placeholder={placeholder}
          {...(bare
            ? { borderWidth: "0", _focusVisible: { boxShadow: "none", outline: "none" } }
            : {})}
        />
        <Combobox.IndicatorGroup>
          {loading ? <Spinner size="xs" /> : null}
          {allowAny ? <Combobox.ClearTrigger /> : null}
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.Empty>No teams found</Combobox.Empty>
            {collection.items.map((item) => (
              <Combobox.Item item={item} key={item.value}>
                {item.label}
                <Combobox.ItemIndicator />
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );

  if (!showDropdown) return combobox(false);

  // Unified field: type selector + search share one border, so it reads as one input.
  return (
    <Flex
      w={width}
      align="stretch"
      borderWidth="1px"
      borderColor="border"
      rounded="md"
      overflow="hidden"
      _focusWithin={{ borderColor: "brand.solid" }}
    >
      <InlineTypeSelect
        value={selectedType}
        onChange={(v) => {
          setSelectedType(v as TeamType);
          void search(inputValue, v as TeamType);
        }}
      />
      <Box w="1px" alignSelf="stretch" bg="border" flexShrink={0} />
      {combobox(true)}
    </Flex>
  );
}
