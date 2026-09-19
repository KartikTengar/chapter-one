"use client";

import { useId } from "react";
import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  children?: never;
}

export function Input({
  label,
  error,
  id: idProp,
  className,
  "aria-invalid": invalid,
  "aria-describedby": describedBy,
  ...rest
}: InputProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const errorId = `${id}-error`;

  return (
    <div className="field">
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      <input
        {...rest}
        id={id}
        className={`field-input${className ? ` ${className}` : ""}`}
        aria-invalid={error ? true : invalid}
        aria-describedby={[describedBy, error ? errorId : undefined].filter(Boolean).join(" ") || undefined}
      />
      {error && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
      <style jsx>{`
        .field {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .field-label {
          font-size: var(--text-label);
          font-weight: 500;
          color: var(--text);
        }
        .field-input {
          width: 100%;
          padding: var(--space-3);
          border-radius: var(--radius-btn);
          border: 1px solid var(--border-control);
          background: var(--surface-2);
          color: var(--text);
          font-family: var(--font-ui);
          font-size: var(--text-body);
          transition:
            border-color var(--dur-fast) var(--ease),
            box-shadow var(--dur-fast) var(--ease);
        }
        .field-input::placeholder {
          color: var(--muted);
        }
        .field-input:hover:not(:disabled) {
          border-color: var(--accent);
        }
        .field-input:focus {
          outline: 2px solid var(--accent);
          outline-offset: var(--space-1);
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent-dim);
        }
        .field-input:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .field-input[aria-invalid="true"] {
          border-color: var(--error);
        }
        .field-input[aria-invalid="true"]:focus {
          box-shadow: 0 0 0 2px var(--error);
        }
        .field-error {
          margin: 0;
          font-size: var(--text-meta);
          color: var(--error);
        }
      `}</style>
    </div>
  );
}

export default Input;
