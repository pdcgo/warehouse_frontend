import { useCallback, useEffect, useRef, useState } from "react";
import {
  Combobox,
  Portal,
  Spinner,
  useListCollection,
} from "@chakra-ui/react";
import { teamClient } from "../lib/clients";
import { toaster } from "./Toaster";
import { errMessage } from "../lib/errors";

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
}

function teamLabel(name: string, teamCode: string, id: bigint): string {
  const base = name || `Team ${id.toString()}`;
  return teamCode ? `${base} (${teamCode})` : base;
}

// TeamPicker is a searchable team selector backed by the public TeamService.
// It queries the server on each (debounced) keystroke, so it scales past a
// single page of teams.
export function TeamPicker({
  value,
  onChange,
  allowAny = false,
  placeholder = "Search team…",
  width = "240px",
}: TeamPickerProps) {
  const { collection, set } = useListCollection<TeamItem>({
    initialItems: [],
    itemToString: (item) => item.label,
    itemToValue: (item) => item.value,
  });
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const res = await teamClient.publicTeamList({
          q,
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
    void search("");
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

  return (
    <Combobox.Root
      collection={collection}
      width={width}
      value={value > 0n ? [value.toString()] : []}
      inputValue={inputValue}
      onInputValueChange={(details) => {
        setInputValue(details.inputValue);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void search(details.inputValue), 300);
      }}
      onValueChange={(details) => {
        const next = details.value[0];
        onChange(next ? BigInt(next) : 0n);
      }}
      openOnClick
    >
      <Combobox.Control>
        <Combobox.Input placeholder={placeholder} />
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
}
