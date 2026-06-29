import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { ChangePasswordForm } from "../components/ChangePasswordForm";
import { GeneralUserInfo } from "./GeneralUserInfo";

export function SettingsGeneralPage() {
  return (
    <Stack gap={6} maxW="md">
      <Text color="fg.muted">Manage your account settings.</Text>

      <GeneralUserInfo />

      <Box borderWidth="1px" borderColor="border" rounded="lg" p={6} bg="white">
        <Heading size="sm" mb={4}>
          Reset password
        </Heading>
        <ChangePasswordForm submitLabel="Reset password" />
      </Box>
    </Stack>
  );
}
