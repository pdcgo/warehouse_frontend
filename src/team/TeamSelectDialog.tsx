import { useEffect, useState } from "react";
import {
  Button,
  CloseButton,
  Dialog,
  Flex,
  Input,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTeam } from "./TeamContext";
import { teamTypeColorPalette, teamTypeIcon, teamTypeLabel } from "./teamType";
import { roleLabel } from "../lib/roles";
import { CheckIcon } from "../components/icons";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamSelectDialog({ open, onOpenChange }: Props) {
  const { teams, currentTeam, selectTeam } = useTeam();
  const [query, setQuery] = useState("");

  // Reset the search each time the dialog opens.
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? teams.filter((t) => t.teamName.toLowerCase().includes(q))
    : teams;

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Select team</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {teams.length === 0 ? (
                <Text color="fg.muted">You don't have access to any team.</Text>
              ) : (
                <Stack gap={3}>
                  <Input
                    placeholder="Search team…"
                    value={query}
                    autoFocus
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {filtered.length === 0 ? (
                    <Text color="fg.muted" fontSize="sm">
                      No teams match “{query}”.
                    </Text>
                  ) : (
                    <Stack gap={1}>
                      {filtered.map((t) => {
                        const Icon = teamTypeIcon(t.teamType);
                        const active = currentTeam?.teamId === t.teamId;
                        return (
                          <Button
                            key={t.teamId.toString()}
                            variant={active ? "subtle" : "ghost"}
                            colorPalette="brand"
                            justifyContent="flex-start"
                            h="auto"
                            py={2}
                            onClick={() => {
                              selectTeam(t.teamId);
                              onOpenChange(false);
                            }}
                          >
                            <Flex
                              colorPalette={teamTypeColorPalette(t.teamType)}
                              align="center"
                              justify="center"
                              boxSize={9}
                              rounded="md"
                              bg="colorPalette.subtle"
                              color="colorPalette.fg"
                              flexShrink={0}
                            >
                              <Icon boxSize={5} />
                            </Flex>
                            <Stack gap={0} flex="1" textAlign="start">
                              <Text fontWeight="medium" color="fg">
                                {t.teamName}
                              </Text>
                              <Text fontSize="xs" color="fg.muted">
                                {teamTypeLabel(t.teamType)} · {roleLabel(t.role)}
                              </Text>
                            </Stack>
                            {active && <CheckIcon boxSize={4} color="brand.fg" />}
                          </Button>
                        );
                      })}
                    </Stack>
                  )}
                </Stack>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>
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
