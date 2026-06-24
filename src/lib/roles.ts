import { Role } from "../gen/role_base/v1/role_pb";
import { UserStatus } from "../gen/user_iface/v2/v2_user_pb";

export interface RoleOption {
  label: string;
  value: Role;
}

// Team-assignable roles (excludes UNSPECIFIED).
export const ROLE_OPTIONS: RoleOption[] = [
  { label: "Root", value: Role.ROOT },
  { label: "Admin", value: Role.ADMIN },
  { label: "Team Owner", value: Role.TEAM_OWNER },
  { label: "Team Admin", value: Role.TEAM_ADMIN },
  { label: "Customer Service", value: Role.TEAM_CUSTOMER_SERVICE },
  { label: "Warehouse Owner", value: Role.WAREHOUSE_OWNER },
  { label: "Warehouse Admin", value: Role.WAREHOUSE_ADMIN },
  { label: "Warehouse Staff", value: Role.WAREHOUSE_STAFF },
];

export function roleLabel(role: Role): string {
  return ROLE_OPTIONS.find((o) => o.value === role)?.label ?? "Unknown";
}

export function statusLabel(status: UserStatus): string {
  switch (status) {
    case UserStatus.ACTIVE:
      return "Active";
    case UserStatus.SUSPENDED:
      return "Suspended";
    default:
      return "Unknown";
  }
}
