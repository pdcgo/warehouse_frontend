import { createClient } from "@connectrpc/connect";
import { V2AuthService } from "../gen/user_iface/v2/v2_auth_pb";
import { V2UserService } from "../gen/user_iface/v2/v2_user_pb";
import { InvoiceService } from "../gen/invoice_iface/v2/v2_service_pb";
import { TeamService } from "../gen/common/v1/team_pb";
import { ShipmentService } from "../gen/common/v1/shipment_pb";
import { transport } from "./transport";

export const authClient = createClient(V2AuthService, transport);
export const userClient = createClient(V2UserService, transport);
export const invoiceClient = createClient(InvoiceService, transport);
export const teamClient = createClient(TeamService, transport);
export const shipmentClient = createClient(ShipmentService, transport);
