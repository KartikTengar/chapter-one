"use client";

import { useState } from "react";
import type { InputProps } from "@/components/ui/Input";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import styles from "./AuthShell.module.scss";

export function PasswordField(props: InputProps & { id: string }) {
  const [visible, setVisible] = useState(false);
  const label = props.label?.toLowerCase() ?? "password";
  return (
    <div className={styles.passwordField}>
      <Input {...props} type={visible ? "text" : "password"} />
      <Button variant="ghost" className={styles.passwordToggle} aria-controls={props.id} aria-pressed={visible} aria-label={`${visible ? "Hide" : "Show"} ${label}`} onClick={() => setVisible(!visible)}>
        {visible ? "Hide" : "Show"} {label}
      </Button>
    </div>
  );
}
