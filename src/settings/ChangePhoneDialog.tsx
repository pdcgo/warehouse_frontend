import { useEffect, useState } from "react";
import { Button, CloseButton, Dialog, Field, Input, Portal, Stack, Text } from "@chakra-ui/react";
import { userClient } from "../lib/clients";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { useAuth } from "../auth/AuthContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPhone?: string;
  onSaved: () => void;
}

// Two-step phone change via the userChangePhoneNumber RPC: first send an OTP to
// the new number, then confirm with the code.
export function ChangePhoneDialog({ open, onOpenChange, currentPhone, onSaved }: Props) {
  const { userId } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPhone("");
      setOtp("");
      setStep("phone");
    }
  }, [open]);

  const sendOtp = async () => {
    if (userId === null) return;
    if (!phone.trim()) {
      toaster.create({ title: "New phone number is required", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await userClient.userChangePhoneNumber({
        userId,
        action: { case: "otp", value: { phone: phone.trim() } },
      });
      toaster.create({ title: `OTP sent to ${phone.trim()}`, type: "success" });
      setStep("otp");
    } catch (err) {
      toaster.create({
        title: "Failed to send OTP",
        description: errMessage(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (userId === null) return;
    if (!otp.trim()) {
      toaster.create({ title: "OTP code is required", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await userClient.userChangePhoneNumber({
        userId,
        action: { case: "update", value: { phone: phone.trim(), otp: otp.trim() } },
      });
      toaster.create({ title: "Phone number changed", type: "success" });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toaster.create({
        title: "Failed to change phone number",
        description: errMessage(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Change phone number</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                {currentPhone && (
                  <Text fontSize="sm" color="fg.muted">
                    Current: {currentPhone}
                  </Text>
                )}
                <Field.Root required>
                  <Field.Label>New phone number</Field.Label>
                  <Input
                    value={phone}
                    disabled={step === "otp"}
                    placeholder="08…"
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Field.Root>
                {step === "otp" && (
                  <Field.Root required>
                    <Field.Label>OTP code</Field.Label>
                    <Input
                      value={otp}
                      autoFocus
                      onChange={(e) => setOtp(e.target.value)}
                    />
                    <Field.HelperText>
                      Sent to {phone}.{" "}
                      <Text
                        as="span"
                        color="brand.fg"
                        cursor="pointer"
                        onClick={() => setStep("phone")}
                      >
                        Use a different number
                      </Text>
                    </Field.HelperText>
                  </Field.Root>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>
              {step === "phone" ? (
                <Button colorPalette="brand" loading={loading} onClick={sendOtp}>
                  Send code
                </Button>
              ) : (
                <Button colorPalette="brand" loading={loading} onClick={confirm}>
                  Change phone
                </Button>
              )}
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
