import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getQueryNotice, type AuthSearchParams } from "./validation";
import styles from "./AuthShell.module.scss";

export function AuthShell({ title, description, children, footer, searchParams = {}, admin = false }: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  searchParams?: AuthSearchParams;
  admin?: boolean;
}) {
  const notice = getQueryNotice(searchParams);
  return (
    <main className={styles.shell}>
      <div className={styles.topbar}>
        <Link href="/" className={styles.brand} aria-label="Chapter One home">CHAPTER ONE<span>FRESHERS · 2026</span></Link>
        <Link href="/" className={styles.back}>Back to home <span aria-hidden="true">↗</span></Link>
      </div>
      <div className={styles.layout}>
        <aside className={styles.story} aria-label="Chapter One">
          <div className={styles.artwork}>
            <Image src="/images/hero.jpg" alt="Abstract golden light against a dark background" fill sizes="(min-width: 1024px) 52vw, 100vw" className={styles.image} />
          </div>
          <div className={styles.storyCopy}>
            <p className={styles.eyebrow}>YOUR FIRST PAGE STARTS HERE</p>
            <p className={styles.statement}>A new chapter.<br /><em>Your story.</em></p>
            <p className={styles.storyNote}>New faces. Shared moments. A campus full of possibility.</p>
          </div>
          <span className={styles.index} aria-hidden="true">01 / THE BEGINNING</span>
        </aside>
        <section className={styles.panel} aria-labelledby="auth-title">
          <header className={styles.heading}>
            <p className={styles.eyebrow}>{admin ? "ORGANISER ACCESS" : "CHAPTER ONE / YOUR ACCOUNT"}</p>
            <h1 id="auth-title">{title}</h1>
            <p>{description}</p>
          </header>
          {notice && <p className={notice.kind === "error" ? styles.error : styles.notice} role={notice.kind === "error" ? "alert" : "status"}>{notice.message}</p>}
          {children}
          {footer && <div className={styles.footer}>{footer}</div>}
        </section>
      </div>
    </main>
  );
}
