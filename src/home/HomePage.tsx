import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { useAuth } from "../auth/AuthContext";
import { useTeam } from "../team/TeamContext";
import { BrandIcon } from "../components/icons";
import { teamTypeColorPalette, teamTypeIcon, teamTypeLabel } from "../team/teamType";

// The Home landing page — shown to every team type. For now it's just a welcome.
export function HomePage() {
  const { username } = useAuth();
  const { currentTeam } = useTeam();

  return (
    <Stack gap={6} maxW="2xl">
      <Box
        borderWidth="1px"
        borderColor="border"
        rounded="xl"
        p={{ base: 6, md: 8 }}
        bg="brand.subtle"
      >
        <Flex align="center" gap={4}>
          <Flex
            colorPalette="brand"
            align="center"
            justify="center"
            boxSize={12}
            rounded="lg"
            bg="colorPalette.solid"
            color="colorPalette.contrast"
            flexShrink={0}
          >
            <BrandIcon boxSize={7} />
          </Flex>
          <Stack gap={1}>
            <Heading size="lg" color="fg">
              Welcome{username ? `, ${username}` : ""} 👋
            </Heading>
            <Text color="fg.muted">
              This is your warehouse workspace. Pick a menu on the left to get
              started.
            </Text>
          </Stack>
        </Flex>
      </Box>

      {currentTeam && (
        <Box borderWidth="1px" borderColor="border" rounded="lg" p={5} bg="white">
          <Text fontSize="sm" color="fg.muted" mb={2}>
            You're working in
          </Text>
          <Flex align="center" gap={3}>
            <Flex
              colorPalette={teamTypeColorPalette(currentTeam.teamType)}
              align="center"
              justify="center"
              boxSize={10}
              rounded="md"
              bg="colorPalette.subtle"
              color="colorPalette.fg"
              flexShrink={0}
            >
              {(() => {
                const Icon = teamTypeIcon(currentTeam.teamType);
                return <Icon boxSize={5} />;
              })()}
            </Flex>
            <Stack gap={0}>
              <Text fontWeight="medium" color="fg">
                {currentTeam.teamName}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {teamTypeLabel(currentTeam.teamType)} team
              </Text>
            </Stack>
          </Flex>
        </Box>
      )}
    </Stack>
  );
}
