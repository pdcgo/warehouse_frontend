import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { userClient } from "../lib/clients";
import { toaster } from "../components/Toaster";
import { errMessage } from "../lib/errors";
import { useAuth } from "../auth/AuthContext";
import { ChangePhoneDialog } from "./ChangePhoneDialog";

interface UserInfo {
  name: string;
  username: string;
  email: string;
  phone: string;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={0}>
      <Text fontSize="xs" color="fg.muted">
        {label}
      </Text>
      <Text fontWeight="medium">{value || "—"}</Text>
    </Stack>
  );
}

export function GeneralUserInfo() {
  const { userId } = useAuth();
  const [info, setInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneOpen, setPhoneOpen] = useState(false);

  const load = useCallback(async () => {
    if (userId === null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await userClient.userByIDs({ ids: [userId], teamId: 0n });
      const u = res.users[userId.toString()]?.user;
      setInfo({
        name: u?.name ?? "",
        username: u?.username ?? "",
        email: u?.email ?? "",
        phone: u?.phoneNumber ?? "",
      });
    } catch (err) {
      toaster.create({
        title: "Failed to load your info",
        description: errMessage(err),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Box borderWidth="1px" borderColor="border" rounded="lg" p={6} bg="white">
      <Heading size="sm" mb={4}>
        General Info
      </Heading>

      {loading ? (
        <Flex py={4} justify="center">
          <Spinner color="brand.solid" />
        </Flex>
      ) : !info ? (
        <Text color="fg.muted">Could not load your info.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
          <Field label="Name" value={info.name} />
          <Field label="Username" value={info.username} />
          <Field label="Email" value={info.email} />
          <Stack gap={0}>
            <Text fontSize="xs" color="fg.muted">
              Phone
            </Text>
            <HStack justify="space-between">
              <Text fontWeight="medium">{info.phone || "—"}</Text>
              <Button size="xs" variant="outline" onClick={() => setPhoneOpen(true)}>
                Change
              </Button>
            </HStack>
          </Stack>
        </SimpleGrid>
      )}

      <ChangePhoneDialog
        open={phoneOpen}
        onOpenChange={setPhoneOpen}
        currentPhone={info?.phone || undefined}
        onSaved={() => void load()}
      />
    </Box>
  );
}
