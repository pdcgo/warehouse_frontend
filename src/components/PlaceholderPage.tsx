import { Box, Heading, Stack, Text } from "@chakra-ui/react";

// A stub page for menu items that are scaffolded but not yet built.
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <Stack gap={4} maxW="lg">
      <Heading size="lg">{title}</Heading>
      <Box borderWidth="1px" borderColor="border" rounded="lg" p={8} bg="white">
        <Text color="fg.muted">{title} — coming soon.</Text>
      </Box>
    </Stack>
  );
}
