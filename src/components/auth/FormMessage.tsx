"use client";

import { useEffect, useRef } from "react";
import styles from "./AuthShell.module.scss";

export function FormMessage({ message, error = false }: { message: string; error?: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (message) ref.current?.focus();
  }, [message]);
  if (!message) return null;
  return <p ref={ref} tabIndex={-1} className={error ? styles.error : styles.notice} role={error ? "alert" : "status"}>{message}</p>;
}
