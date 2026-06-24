import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { BrandIcon, UserIcon } from "../components/icons";
import { PasswordInput } from "../components/PasswordInput";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { errMessage } from "../lib/errors";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [resetOpen, setResetOpen] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: { username?: string; password?: string } = {};
    if (!username.trim()) nextErrors.username = "Username is required";
    if (!password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setFormError(null);
    setLoading(true);
    try {
      await login(username, password, remember);
      navigate("/users", { replace: true });
    } catch (err) {
      setFormError(errMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="brand.50"
      p={4}
    >
      <Box
        as="form"
        onSubmit={onSubmit}
        bg="white"
        p={8}
        borderWidth="1px"
        borderColor="border"
        rounded="xl"
        shadow="md"
        w="sm"
      >
        <Stack align="center" gap={2} mb={6}>
          <Flex
            align="center"
            justify="center"
            boxSize={12}
            rounded="xl"
            bg="brand.solid"
            color="brand.contrast"
          >
            <BrandIcon boxSize={7} />
          </Flex>
          <Heading size="lg">User Login</Heading>
          <Text color="fg.muted" fontSize="sm">
            Sign in to your account
          </Text>
        </Stack>

        <Stack gap={4}>
          {formError && (
            <Alert.Root status="error" rounded="md">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{formError}</Alert.Title>
              </Alert.Content>
            </Alert.Root>
          )}

          <Field.Root invalid={!!errors.username}>
            <Field.Label>Username</Field.Label>
            <InputGroup startElement={<UserIcon color="fg.muted" />}>
              <Input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors((x) => ({ ...x, username: undefined }));
                }}
                autoFocus
              />
            </InputGroup>
            <Field.ErrorText>{errors.username}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.password}>
            <Field.Label>Password</Field.Label>
            <PasswordInput
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (errors.password) setErrors((x) => ({ ...x, password: undefined }));
              }}
            />
            <Field.ErrorText>{errors.password}</Field.ErrorText>
          </Field.Root>

          <HStack justify="space-between">
            <Checkbox.Root
              checked={remember}
              onCheckedChange={(e) => setRemember(e.checked === true)}
              colorPalette="brand"
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>Remember me</Checkbox.Label>
            </Checkbox.Root>
            <Button
              type="button"
              variant="plain"
              size="sm"
              h="auto"
              px={0}
              color="brand.fg"
              fontWeight="medium"
              _hover={{ textDecoration: "underline" }}
              onClick={() => setResetOpen(true)}
            >
              Reset password
            </Button>
          </HStack>

          <Button type="submit" colorPalette="brand" w="full" loading={loading}>
            Sign in
          </Button>
        </Stack>
      </Box>
      <ResetPasswordDialog open={resetOpen} onOpenChange={setResetOpen} />
    </Box>
  );
}
