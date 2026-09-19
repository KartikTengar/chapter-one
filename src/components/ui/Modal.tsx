"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import type { DialogHTMLAttributes, ReactEventHandler } from "react";

export interface ModalProps extends Omit<DialogHTMLAttributes<HTMLDialogElement>, "open" | "title"> {
  open: boolean;
  onClose: ReactEventHandler<HTMLDialogElement>;
  title: string;
  description?: string;
  closeLabel?: string;
}

export function Modal({
  open,
  onClose,
  onCancel,
  onKeyDown,
  title,
  description,
  closeLabel = "Close dialog",
  children,
  className,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...rest
}: ModalProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const restoreFocus = useCallback(() => {
    const element = previousFocus.current;
    previousFocus.current = null;
    if (element?.isConnected) element.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (dialog?.open) dialog.close();
      restoreFocus();
    };
  }, [restoreFocus]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      previousFocus.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      restoreFocus();
    }
  }, [open, restoreFocus]);

  return (
    <dialog
      {...rest}
      ref={dialogRef}
      className={`ui-modal${className ? ` ${className}` : ""}`}
      aria-labelledby={labelledBy || titleId}
      aria-describedby={[describedBy, description ? descriptionId : undefined].filter(Boolean).join(" ") || undefined}
      onCancel={onCancel}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;

        const dialog = event.currentTarget;
        if (!dialog.open) return;

        const candidates = Array.from(dialog.querySelectorAll<HTMLElement>(
          'a[href], area[href], button, input, select, textarea, iframe, object, embed, audio[controls], video[controls], summary, [contenteditable], [tabindex]',
        )).filter((element) => (
          element.tabIndex >= 0
          && !element.matches(":disabled")
          && !element.closest("[inert]")
          && element.getClientRects().length > 0
          && element.checkVisibility({ visibilityProperty: true })
        ));
        const focusable = candidates.filter((element) => {
          if (!(element instanceof HTMLInputElement) || element.type !== "radio" || !element.name) return true;
          const group = candidates.filter((candidate) => (
            candidate instanceof HTMLInputElement
            && candidate.type === "radio"
            && candidate.name === element.name
            && candidate.form === element.form
          ));
          return element === (group.find((candidate) => (candidate as HTMLInputElement).checked) ?? group[0]);
        }).sort((a, b) => (a.tabIndex || Infinity) - (b.tabIndex || Infinity));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = dialog.ownerDocument.activeElement;

        if (!first) {
          event.preventDefault();
          dialog.focus({ preventScroll: true });
        } else if (!focusable.some((element) => element === active) || (event.shiftKey ? active === first : active === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }}
      onClose={(event) => {
        if (event.currentTarget.open) return;
        restoreFocus();
        if (open) onClose(event);
      }}
    >
      <div className="modal-header">
        <h2 id={titleId} className="modal-title">{title}</h2>
        <button
          type="button"
          className="modal-close"
          onClick={() => dialogRef.current?.close()}
          aria-label={closeLabel}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      {description && (
        <p id={descriptionId} className="modal-description">{description}</p>
      )}
      <div className="modal-body">{children}</div>
      <style jsx>{`
        .ui-modal {
          box-sizing: border-box;
          margin: auto;
          padding: var(--space-5);
          border: 1px solid var(--border);
          border-radius: var(--radius-surface);
          background: var(--surface);
          color: var(--text);
          box-shadow: var(--shadow-elevated);
          width: var(--modal-max-width, calc(var(--space-10) * 4));
          max-width: calc(100% - var(--space-5) * 2);
          max-height: calc(100dvh - var(--space-5) * 2);
          overflow: auto;
        }
        .ui-modal::backdrop {
          background: var(--modal-backdrop, var(--bg));
        }
        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-4);
        }
        .modal-title {
          margin: 0;
          font-family: var(--font-ui);
          font-size: var(--text-h2);
          font-weight: 700;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }
        .modal-close {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: var(--space-7);
          min-height: var(--space-7);
          padding: var(--space-2);
          border: none;
          border-radius: var(--radius-btn);
          background: var(--transparent);
          color: var(--text);
          font: inherit;
          font-size: var(--text-h3);
          line-height: 1;
          cursor: pointer;
        }
        .modal-close:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: var(--space-1);
        }
        .modal-close:hover {
          background: var(--accent-dim);
        }
        .modal-description {
          margin: var(--space-3) 0 0;
          font-size: var(--text-body);
          color: var(--muted);
        }
        .modal-body {
          margin-top: var(--space-4);
        }
      `}</style>
    </dialog>
  );
}

export default Modal;
