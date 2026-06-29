import { Badge, Tabs } from "@chakra-ui/react";
import {
  INBOUND_STATUS_COLORS,
  INBOUND_STATUS_LABELS,
  INBOUND_STATUSES,
  type InboundStatus,
} from "./inboundApi";

// Pending/Accepted/Problem badge — shared by inbound list + detail pages.
export function StatusBadge({ status }: { status: InboundStatus }) {
  return (
    <Badge colorPalette={INBOUND_STATUS_COLORS[status]}>
      {INBOUND_STATUS_LABELS[status]}
    </Badge>
  );
}

// Status filter tabs (Pending/Accepted/Problem) for inbound list pages. Renders only
// the tab strip; the table below reacts to the selected value.
export function StatusTabs({
  value,
  onChange,
}: {
  value: InboundStatus;
  onChange: (status: InboundStatus) => void;
}) {
  return (
    <Tabs.Root value={value} onValueChange={(e) => onChange(e.value as InboundStatus)}>
      <Tabs.List>
        {INBOUND_STATUSES.map((s) => (
          <Tabs.Trigger key={s} value={s}>
            {INBOUND_STATUS_LABELS[s]}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
