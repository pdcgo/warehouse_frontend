import { useState, type ReactNode } from "react";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Menu,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  ChevronIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  LogoutIcon,
  type IconComponent,
} from "./icons";
import { navItemsFor, pageTitle, type NavGroup } from "../nav";
import { TeamType } from "../gen/user_iface/v2/v2_user_pb";
import { useTeam } from "../team/TeamContext";
import { TeamSwitcher } from "../team/TeamSwitcher";
import { TeamRouteGuard } from "../team/TeamRouteGuard";

function isActive(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(path + "/");
}

// A single sidebar entry. The icon always sits in a fixed-width slot so every item
// lines up in one column (and collapses cleanly to an icon-only rail).
function NavButton({
  label,
  icon: IconCmp,
  active,
  subtle,
  collapsed,
  onClick,
  trailing,
}: {
  label: string;
  icon: IconComponent;
  active: boolean;
  subtle?: boolean;
  collapsed?: boolean;
  onClick: () => void;
  trailing?: ReactNode;
}) {
  return (
    <Button
      variant={active ? "solid" : "ghost"}
      colorPalette="brand"
      w="full"
      size="sm"
      justifyContent={collapsed ? "center" : "flex-start"}
      fontWeight="medium"
      gap={2}
      px={collapsed ? 0 : 3}
      title={collapsed ? label : undefined}
      color={active ? "colorPalette.contrast" : subtle ? "colorPalette.fg" : "fg"}
      bg={active ? "colorPalette.solid" : subtle ? "colorPalette.subtle" : "transparent"}
      _hover={{
        bg: active ? "colorPalette.solid" : "colorPalette.subtle",
        color: active ? "colorPalette.contrast" : "colorPalette.fg",
      }}
      onClick={onClick}
    >
      <Flex as="span" align="center" justify="center" boxSize={5} flexShrink={0}>
        <IconCmp boxSize={4} />
      </Flex>
      {!collapsed && (
        <Box
          as="span"
          flex="1"
          textAlign="start"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {label}
        </Box>
      )}
      {!collapsed && trailing}
    </Button>
  );
}

// A collapsible parent that nests its children under a connector line.
// Auto-expands when a child route is active. In the collapsed rail, clicking the
// parent expands the sidebar and opens the group.
function NavGroupView({
  group,
  collapsed,
  onRequestExpand,
}: {
  group: NavGroup;
  collapsed: boolean;
  onRequestExpand: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const childActive = group.children.some((c) => isActive(location.pathname, c.path));
  const [open, setOpen] = useState(childActive);

  const onParentClick = () => {
    if (collapsed) {
      onRequestExpand();
      setOpen(true);
    } else {
      setOpen((v) => !v);
    }
  };

  return (
    <Stack gap={1}>
      <NavButton
        label={group.label}
        icon={group.icon}
        active={false}
        subtle={childActive}
        collapsed={collapsed}
        onClick={onParentClick}
        trailing={
          <ChevronIcon
            boxSize={4}
            transition="transform 0.2s"
            transform={open ? "rotate(180deg)" : undefined}
          />
        }
      />
      {open && !collapsed && (
        <Stack
          gap={1}
          ms={4}
          ps={2}
          borderInlineStartWidth="1px"
          borderColor="border"
        >
          {group.children.map((c) => (
            <NavButton
              key={c.path}
              label={c.label}
              icon={c.icon}
              active={isActive(location.pathname, c.path)}
              onClick={() => navigate(c.path)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export function Layout() {
  const { username, logout } = useAuth();
  const { currentTeam } = useTeam();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const items = navItemsFor(currentTeam?.teamType ?? TeamType.UNSPECIFIED);

  const onLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <Flex minH="100vh">
      <Flex
        as="nav"
        direction="column"
        flexShrink={0}
        w={collapsed ? "72px" : "240px"}
        bg="white"
        color="gray.900"
        borderRightWidth="1px"
        borderColor="border"
        p={3}
        transition="width 0.2s"
      >
        <Stack gap={3} mb={6}>
          <Flex justify={collapsed ? "center" : "flex-end"}>
            <IconButton
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              variant="subtle"
              colorPalette="brand"
              size="sm"
              rounded="full"
              onClick={() => setCollapsed((v) => !v)}
            >
              {collapsed ? (
                <ChevronsRightIcon boxSize={5} />
              ) : (
                <ChevronsLeftIcon boxSize={5} />
              )}
            </IconButton>
          </Flex>
          <TeamSwitcher collapsed={collapsed} />
        </Stack>

        <Stack gap={1} flex="1" overflowY="auto" overflowX="hidden">
          {items.map((item) =>
            "children" in item ? (
              <NavGroupView
                key={item.label}
                group={item}
                collapsed={collapsed}
                onRequestExpand={() => setCollapsed(false)}
              />
            ) : (
              <NavButton
                key={item.path}
                label={item.label}
                icon={item.icon}
                active={isActive(location.pathname, item.path)}
                collapsed={collapsed}
                onClick={() => navigate(item.path)}
              />
            ),
          )}
        </Stack>

        <Box pt={2} mt={2} borderTopWidth="1px" borderColor="border">
          <NavButton
            label="Logout"
            icon={LogoutIcon}
            active={false}
            collapsed={collapsed}
            onClick={onLogout}
          />
        </Box>
      </Flex>

      <Flex direction="column" flex="1" minW={0}>
        <Flex
          as="header"
          justify="space-between"
          align="center"
          px={6}
          py={3}
          borderBottomWidth="1px"
          borderColor="border"
        >
          <Heading size="md">{pageTitle(location.pathname)}</Heading>

          <Menu.Root>
            <Menu.Trigger asChild>
              <Button variant="ghost" size="sm" gap={2} px={2}>
                <Avatar.Root size="xs" colorPalette="brand">
                  <Avatar.Fallback name={username ?? "User"} />
                </Avatar.Root>
                <Text fontWeight="medium">{username ?? "User"}</Text>
                <ChevronIcon boxSize={4} color="fg.muted" />
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content minW="44">
                  <Menu.ItemGroup>
                    <Menu.ItemGroupLabel>{username ?? "User"}</Menu.ItemGroupLabel>
                    <Menu.Item
                      value="settings"
                      onClick={() => navigate("/settings/general")}
                    >
                      Settings
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Item value="logout" color="fg.error" onClick={onLogout}>
                      Logout
                    </Menu.Item>
                  </Menu.ItemGroup>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Flex>
        <Box p={6} flex="1" overflow="auto">
          <TeamRouteGuard>
            <Outlet />
          </TeamRouteGuard>
        </Box>
      </Flex>
    </Flex>
  );
}
