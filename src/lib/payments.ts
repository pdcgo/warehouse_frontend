import { timestampDate, type Timestamp } from "@bufbuild/protobuf/wkt";
import { PaymentStatus } from "../gen/invoice_iface/v2/v2_service_pb";
import {
  BalanceChangeType,
  BalanceType,
} from "../gen/invoice_iface/v2/v2_balance_pb";
import type { EnumOption } from "../components/EnumSelect";

export const PAYMENT_STATUS_OPTIONS: EnumOption[] = [
  { label: "Pending", value: PaymentStatus.PENDING },
  { label: "Accepted", value: PaymentStatus.ACCEPTED },
  { label: "Rejected", value: PaymentStatus.REJECTED },
];

export function paymentStatusLabel(s: PaymentStatus): string {
  switch (s) {
    case PaymentStatus.PENDING:
      return "Pending";
    case PaymentStatus.ACCEPTED:
      return "Accepted";
    case PaymentStatus.REJECTED:
      return "Rejected";
    default:
      return "Unknown";
  }
}

export function paymentStatusColor(s: PaymentStatus): string {
  switch (s) {
    case PaymentStatus.ACCEPTED:
      return "green";
    case PaymentStatus.REJECTED:
      return "red";
    case PaymentStatus.PENDING:
      return "yellow";
    default:
      return "gray";
  }
}

export const BALANCE_TYPE_OPTIONS: EnumOption[] = [
  { label: "Payable", value: BalanceType.PAYABLE },
  { label: "Receivable", value: BalanceType.RECEIVABLE },
];

export const BALANCE_CHANGE_TYPE_OPTIONS: EnumOption[] = [
  { label: "Adjustment", value: BalanceChangeType.ADJUSTMENT },
  { label: "Warehouse Fee", value: BalanceChangeType.WAREHOUSE_FEE },
  { label: "COD Fee", value: BalanceChangeType.COD_FEE },
  { label: "Product Fee", value: BalanceChangeType.PRODUCT_FEE },
  { label: "Payment", value: BalanceChangeType.PAYMENT },
];

export function formatTs(ts?: Timestamp): string {
  return ts ? timestampDate(ts).toLocaleString() : "—";
}
