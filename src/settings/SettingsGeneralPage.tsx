import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { ChangePasswordForm } from "../components/ChangePasswordForm";

export function SettingsGeneralPage() {
  return (
    <Stack gap={6} maxW="md">
      <Stack gap={1}>
        <Heading size="lg">General</Heading>
        <Text color="fg.muted">Manage your account settings.</Text>
      </Stack>

      <Box borderWidth="1px" borderColor="border" rounded="lg" p={6} bg="white">
        <Heading size="sm" mb={4}>
          Reset password
        </Heading>
        <ChangePasswordForm submitLabel="Reset password" />
      </Box>
    </Stack>
  );
}
