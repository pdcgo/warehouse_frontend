import { ConnectError } from "@connectrpc/connect";

export function errMessage(err: unknown): string {
  if (err instanceof ConnectError) {
    return err.rawMessage || err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}
