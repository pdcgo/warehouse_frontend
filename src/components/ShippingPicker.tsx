import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Popover,
  Portal,
  Spinner,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import { shipmentClient } from "../lib/clients";
import { toaster } from "./Toaster";
import { errMessage } from "../lib/errors";
import { CheckIcon, PlusIcon } from "./icons";
import type { Shipment } from "../gen/common/v1/shipment_pb";

interface ShippingPickerProps {
  value: bigint[];
  onChange: (ids: bigint[]) => void;
  /** Allow selecting more than one courier (default true). */
  multiple?: boolean;
  /** Show a "Clear" action in the popup to reset the selection. */
  allowAny?: boolean;
  /** Label of the trigger button. */
  buttonLabel?: string;
  /** Placeholder of the in-popup search box. */
  placeholder?: string;
  width?: string;
}

function shipmentLabel(s: Shipment): string {
  return s.displayName || s.key || `Shipment ${s.id.toString()}`;
}

// ShippingPicker selects shipping couriers. The trigger is an "Add" button that pops
// up a searchable panel where couriers are freely toggled (multi-select by default).
// Selected couriers render as removable chips. The courier list is small and fetched
// once from the public ShipmentService, then filtered client-side.
export function ShippingPicker({
  value,
  onChange,
  multiple = true,
  allowAny = false,
  buttonLabel = "Add courier",
  placeholder = "Search courier…",
  width = "320px",
}: ShippingPickerProps) {
  const [couriers, setCouriers] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Load every courier once; the set is small so there is no server-side search.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await shipmentClient.publicShipmentList({});
        if (!cancelled) setCouriers(res.data);
      } catch (err) {
        if (!cancelled) {
          toaster.create({
            title: "Failed to load couriers",
            description: errMessage(err),
            type: "error",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = new Set(value.map((v) => v.toString()));
  const nameById = new Map(couriers.map((c) => [c.id.toString(), shipmentLabel(c)]));

  const ql = query.trim().toLowerCase();
  const filtered = ql
    ? couriers.filter((c) => `${c.displayName} ${c.key}`.toLowerCase().includes(ql))
    : couriers;

  const toggle = (id: bigint) => {
    const idStr = id.toString();
    if (multiple) {
      onChange(
        selected.has(idStr) ? value.filter((x) => x.toString() !== idStr) : [...value, id],
      );
    } else {
      onChange([id]);
      setOpen(false);
    }
  };

  const removeId = (idStr: string) =>
    onChange(value.filter((x) => x.toString() !== idStr));

  return (
    <Flex direction="column" gap={2} width={width}>
      {value.length > 0 && (
        <Flex wrap="wrap" gap={1.5}>
          {value.map((id) => {
            const idStr = id.toString();
            return (
              <Tag.Root key={idStr} colorPalette="brand">
                <Tag.Label>{nameById.get(idStr) ?? `#${idStr}`}</Tag.Label>
                <Tag.CloseTrigger onClick={() => removeId(idStr)} />
              </Tag.Root>
            );
          })}
        </Flex>
      )}

      <Popover.Root
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
        positioning={{ placement: "bottom-start" }}
      >
        <Popover.Trigger asChild>
          <Button variant="outline" size="sm" gap={2} alignSelf="flex-start">
            <PlusIcon />
            {buttonLabel}
          </Button>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content width={width}>
              <Popover.Body p={2}>
                <Stack gap={2}>
                  <Input
                    size="sm"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Box maxH="240px" overflowY="auto">
                    {loading ? (
                      <Flex justify="center" py={4}>
                        <Spinner size="sm" />
                      </Flex>
                    ) : filtered.length === 0 ? (
                      <Text p={2} fontSize="sm" color="fg.muted">
                        No couriers found
                      </Text>
                    ) : (
                      <Stack gap={0}>
                        {filtered.map((c) => {
                          const idStr = c.id.toString();
                          const isSelected = selected.has(idStr);
                          return (
                            <Button
                              key={idStr}
                              variant="ghost"
                              size="sm"
                              justifyContent="space-between"
                              colorPalette={isSelected ? "brand" : undefined}
                              onClick={() => toggle(c.id)}
                            >
                              <Text as="span">{shipmentLabel(c)}</Text>
                              {isSelected && <CheckIcon color="brand.fg" />}
                            </Button>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                  {allowAny && value.length > 0 && (
                    <>
                      <Box borderTopWidth="1px" borderColor="border" />
                      <HStack justify="flex-end">
                        <Button size="xs" variant="ghost" onClick={() => onChange([])}>
                          Clear
                        </Button>
                      </HStack>
                    </>
                  )}
                </Stack>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </Flex>
  );
}
