import { TeamType } from "../gen/user_iface/v2/v2_user_pb";
import {
  AdminIcon,
  SellingIcon,
  WarehouseIcon,
  type IconComponent,
} from "../components/icons";

export function teamTypeLabel(type: TeamType): string {
  switch (type) {
    case TeamType.WAREHOUSE:
      return "Warehouse";
    case TeamType.SELLING:
      return "Selling";
    case TeamType.ADMIN:
      return "Admin";
    default:
      return "Team";
  }
}

export function teamTypeIcon(type: TeamType): IconComponent {
  switch (type) {
    case TeamType.WAREHOUSE:
      return WarehouseIcon;
    case TeamType.SELLING:
      return SellingIcon;
    case TeamType.ADMIN:
      return AdminIcon;
    default:
      return AdminIcon;
  }
}

// A distinct Chakra colorPalette per team type, so each type reads at a glance.
export function teamTypeColorPalette(type: TeamType): string {
  switch (type) {
    case TeamType.WAREHOUSE:
      return "blue";
    case TeamType.SELLING:
      return "green";
    case TeamType.ADMIN:
      return "purple";
    default:
      return "gray";
  }
}
