import { useState } from "react";
import { IconButton, Input, InputGroup } from "@chakra-ui/react";
import { EyeIcon, EyeOffIcon, LockIcon } from "./icons";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

// Password field with a leading lock icon and a show/hide toggle.
export function PasswordInput({ value, onChange, placeholder, autoFocus }: Props) {
  const [show, setShow] = useState(false);
  return (
    <InputGroup
      startElement={<LockIcon color="fg.muted" />}
      endElement={
        <IconButton
          aria-label={show ? "Hide password" : "Show password"}
          variant="ghost"
          size="xs"
          onClick={() => setShow((v) => !v)}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </IconButton>
      }
    >
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
    </InputGroup>
  );
}
