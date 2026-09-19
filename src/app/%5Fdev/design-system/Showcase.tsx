"use client";

import { useState } from "react";
import { Badge, Button, Card, Chip, Input, Modal, Skeleton } from "@/components/ui";
import styles from "./Showcase.module.scss";

const variants = ["default", "accent", "success", "warning", "error"] as const;
const buttonVariants = ["primary", "secondary", "ghost", "danger"] as const;

export default function Showcase() {
  const [action, setAction] = useState("No button pressed yet.");
  const [chipVisible, setChipVisible] = useState(true);
  const [name, setName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  return (
    <div className={styles.stack}>
      <section aria-labelledby="buttons-title" className={styles.panel}>
        <h3 id="buttons-title">Button</h3>
        <div className={styles.row}>
          {buttonVariants.map((variant) => (
            <Button key={variant} variant={variant} onClick={() => setAction(`${variant} pressed.`)}>
              {variant}
            </Button>
          ))}
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
        <p role="status" className={styles.muted}>{action}</p>
      </section>
      <div className="bs-d-md-flex bs-gap-5">
        <section aria-labelledby="chips-title" className={styles.panel}>
          <h3 id="chips-title">Chip</h3>
          <div className={styles.row}>
            {variants.map((variant) => <Chip key={variant} variant={variant}>{variant}</Chip>)}
            {chipVisible && (
              <Chip
                variant="accent"
                removeLabel="Remove selected category"
                onRemove={() => {
                  setChipVisible(false);
                  document.getElementById("restore-chip")?.focus();
                }}
              >
                Selected category
              </Chip>
            )}
          </div>
          <Button id="restore-chip" variant="secondary" onClick={() => setChipVisible(true)}>
            Restore removable chip
          </Button>
          <p role="status" className={styles.muted}>
            {chipVisible ? "Selected category is present." : "Selected category removed."}
          </p>
        </section>
        <section aria-labelledby="badges-title" className={styles.panel}>
          <h3 id="badges-title">Badge</h3>
          <div className={styles.row}>
            {variants.map((variant) => <Badge key={variant} variant={variant}>{variant}</Badge>)}
          </div>
        </section>
      </div>
      <div className="bs-d-md-flex bs-gap-5">
        <section aria-labelledby="inputs-title" className={styles.panel}>
          <h3 id="inputs-title">Input</h3>
          <Input label="Email" type="email" placeholder="you@college.edu" autoComplete="off" />
          <Input
            label="Required display name"
            value={name}
            required
            onChange={(event) => setName(event.target.value)}
            error={name.trim() ? undefined : "Enter a display name to clear this error."}
          />
          <Input label="Disabled input" value="Unavailable" disabled />
        </section>
        <section aria-labelledby="cards-title" className={styles.panel}>
          <h3 id="cards-title">Card</h3>
          <Card>
            <div className={styles.stack}>
              <h4>Primitive sample</h4>
              <p className={styles.muted}>Surface, border, radius-card and shadow-subtle tokens.</p>
              <Badge variant="accent">Preview</Badge>
              <Button variant="secondary" onClick={() => setModalOpen(true)}>Inspect in modal</Button>
            </div>
          </Card>
        </section>
      </div>
      <div className="bs-d-md-flex bs-gap-5">
        <section aria-labelledby="skeletons-title" className={styles.panel}>
          <h3 id="skeletons-title">Skeleton</h3>
          <Button
            variant="secondary"
            aria-pressed={showSkeleton}
            onClick={() => setShowSkeleton((visible) => !visible)}
          >
            Toggle skeleton preview
          </Button>
          <p role="status" className={styles.muted}>
            {showSkeleton ? "Loading preview: text, rectangle and circle." : "Content loaded."}
          </p>
          {showSkeleton ? (
            <div className={styles.stack}>
              <Skeleton shape="text" />
              <Skeleton shape="rect" height="var(--space-8)" />
              <Skeleton shape="circle" />
            </div>
          ) : (
            <Card>Loaded content replaces the decorative skeletons.</Card>
          )}
        </section>
        <section aria-labelledby="modal-title" className={styles.panel}>
          <h3 id="modal-title">Modal</h3>
          <p className={styles.muted}>Open, Tab through the controls, then press Escape. Focus returns to the opener.</p>
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
        </section>
      </div>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Native dialog preview"
        description="Focus stays inside this modal. Escape, the close icon, or Done closes it."
      >
        <form method="dialog" className={styles.stack}>
          <Input label="Dialog input" placeholder="Try keyboard navigation" />
          <Button type="submit">Done</Button>
        </form>
      </Modal>
    </div>
  );
}
