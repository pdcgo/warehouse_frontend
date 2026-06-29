import type { ReactNode } from "react";
import { Box, Code, Heading, Stack, Text } from "@chakra-ui/react";

interface Props {
  title: string;
  description?: string;
  usage?: string;
  children: ReactNode;
}

// One section of the dev component gallery: a titled card with an optional
// description + usage snippet and a bordered "canvas" rendering the live demo.
// Reused once per showcased component so adding a component is a single section.
export function ComponentShowcase({ title, description, usage, children }: Props) {
  return (
    <Box borderWidth="1px" borderColor="border" rounded="lg" p={6} bg="white">
      <Stack gap={3}>
        <Stack gap={1}>
          <Heading size="md">{title}</Heading>
          {description && (
            <Text color="fg.muted" fontSize="sm">
              {description}
            </Text>
          )}
          {usage && (
            <Code variant="surface" px={2} py={1} rounded="sm" w="fit-content">
              {usage}
            </Code>
          )}
        </Stack>
        <Box borderWidth="1px" borderColor="border" rounded="md" p={4} bg="bg.subtle">
          {children}
        </Box>
      </Stack>
    </Box>
  );
}
