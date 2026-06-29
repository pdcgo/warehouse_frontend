import { Role } from "../gen/role_base/v1/role_pb";
import { TeamType, UserStatus } from "../gen/user_iface/v2/v2_user_pb";

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

// Roles offered for a given team type — a frontend UX grouping (the backend does
// not enforce a team-type→role mapping). Omit / UNSPECIFIED returns every role, so
// `rolesForTeamType()` is a safe drop-in for the old flat ROLE_OPTIONS list. Tweak
// the groupings here in one place.
export function rolesForTeamType(teamType?: TeamType): RoleOption[] {
  const pick = (roles: Role[]) => ROLE_OPTIONS.filter((o) => roles.includes(o.value));
  switch (teamType) {
    case TeamType.WAREHOUSE:
      return pick([Role.WAREHOUSE_OWNER, Role.WAREHOUSE_ADMIN, Role.WAREHOUSE_STAFF]);
    case TeamType.SELLING:
      return pick([Role.TEAM_OWNER, Role.TEAM_ADMIN, Role.TEAM_CUSTOMER_SERVICE]);
    case TeamType.ADMIN:
      return pick([Role.ADMIN, Role.ROOT]);
    default:
      return ROLE_OPTIONS;
  }
}

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
