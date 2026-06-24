import { useState } from "react";
import { Button, Field, Stack } from "@chakra-ui/react";
import { PasswordInput } from "./PasswordInput";
import { userClient } from "../lib/clients";
import { toaster } from "./Toaster";
import { errMessage } from "../lib/errors";
import { useAuth } from "../auth/AuthContext";

interface Props {
  // Called after a successful change (e.g. to close a dialog).
  onDone?: () => void;
  submitLabel?: string;
}

// Shared change-password form for the signed-in user. Used by ChangePasswordDialog
// and the Settings > General page. Calls the public ResetPassword RPC, which verifies
// the current password.
export function ChangePasswordForm({ onDone, submitLabel = "Change password" }: Props) {
  const { userId } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (userId === null) {
      toaster.create({ title: "No signed-in user", type: "error" });
      return;
    }
    if (!newPassword) {
      toaster.create({ title: "New password is required", type: "error" });
      return;
    }
    if (newPassword !== confirm) {
      toaster.create({ title: "Passwords do not match", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await userClient.resetPassword({ userId, oldPassword, newPassword });
      toaster.create({ title: "Password changed", type: "success" });
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
      onDone?.();
    } catch (err) {
      toaster.create({
        title: "Change failed",
        description: errMessage(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap={4}>
      <Field.Root required>
        <Field.Label>Current password</Field.Label>
        <PasswordInput value={oldPassword} onChange={setOldPassword} />
      </Field.Root>
      <Field.Root required>
        <Field.Label>New password</Field.Label>
        <PasswordInput value={newPassword} onChange={setNewPassword} />
      </Field.Root>
      <Field.Root required invalid={confirm !== "" && newPassword !== confirm}>
        <Field.Label>Confirm new password</Field.Label>
        <PasswordInput value={confirm} onChange={setConfirm} />
        <Field.ErrorText>Passwords do not match.</Field.ErrorText>
      </Field.Root>
      <Button
        colorPalette="brand"
        loading={loading}
        onClick={submit}
        alignSelf="flex-start"
      >
        {submitLabel}
      </Button>
    </Stack>
  );
}
