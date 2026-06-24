import { useState } from "react";
import {
  Button,
  Dialog,
  Field,
  Input,
  InputGroup,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { toaster } from "../components/Toaster";
import { PasswordInput } from "../components/PasswordInput";
import { UserIcon } from "../components/icons";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Self-service reset from the login screen. The backend ResetPassword RPC verifies
// the current password, so this asks for it (there is no forgotten-password flow yet).
export function ResetPasswordDialog({ open, onOpenChange }: Props) {
  const [username, setUsername] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const clear = () => {
    setUsername("");
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const submit = async () => {
    if (!username.trim()) {
      toaster.create({ title: "Username is required", type: "error" });
      return;
    }
    if (!current) {
      toaster.create({ title: "Current password is required", type: "error" });
      return;
    }
    if (!next) {
      toaster.create({ title: "New password is required", type: "error" });
      return;
    }
    if (next !== confirm) {
      toaster.create({ title: "Passwords do not match", type: "error" });
      return;
    }

    setLoading(true);
    try {
      // TODO(reset-password): wire the backend call (to be discussed).
      // Planned: resolve userId via login(username, current), then
      //   userClient.resetPassword({ userId, oldPassword: current, newPassword: next }).
      toaster.create({
        title: "Reset password not wired yet",
        description: "The form is ready — backend wiring is pending.",
        type: "info",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) clear();
        onOpenChange(e.open);
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Reset password</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                <Text color="fg.muted" fontSize="sm">
                  Enter your username and current password to set a new one.
                </Text>
                <Field.Root required>
                  <Field.Label>Username</Field.Label>
                  <InputGroup startElement={<UserIcon color="fg.muted" />}>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </InputGroup>
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Current password</Field.Label>
                  <PasswordInput value={current} onChange={setCurrent} />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>New password</Field.Label>
                  <PasswordInput value={next} onChange={setNext} />
                </Field.Root>
                <Field.Root required invalid={confirm !== "" && next !== confirm}>
                  <Field.Label>Confirm new password</Field.Label>
                  <PasswordInput value={confirm} onChange={setConfirm} />
                  <Field.ErrorText>Passwords do not match.</Field.ErrorText>
                </Field.Root>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>
              <Button colorPalette="brand" loading={loading} onClick={submit}>
                Reset password
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
