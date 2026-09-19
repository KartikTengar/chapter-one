"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const subscribe = () => () => {};
const getSnapshot = () => typeof HTMLDialogElement !== "undefined" && typeof HTMLDialogElement.prototype.showModal === "function";
const getServerSnapshot = () => false;

const mobileLinks = [
  { label: "Events", href: "/events" },
  { label: "Games", href: "/games" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Gallery", href: "/gallery" },
  { label: "Hidden Trail", href: "/hidden-trail" },
  { label: "Dashboard", href: "/dashboard" },
];

const links = [
  { label: "Home", href: "/" },
  { label: "Events", href: "/events" },
  { label: "Games", href: "/games" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Gallery", href: "/gallery" },
  { label: "Hidden Trail", href: "/hidden-trail" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Profile", href: "/profile" },
];

export function Navbar() {
  const enhanced = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 24);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = triggerRef.current;
    const overflow = document.body.style.overflow;
    const priority = document.body.style.getPropertyPriority("overflow");
    document.body.style.setProperty("overflow", "hidden");
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>("button")?.focus();
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      dialog.close();
      if (overflow) document.body.style.setProperty("overflow", overflow, priority);
      else document.body.style.removeProperty("overflow");
      if (trigger?.isConnected && trigger.getClientRects().length > 0) {
        trigger.focus({ preventScroll: true });
      } else if (desktop.matches) {
        document.querySelector<HTMLAnchorElement>(".navbar .nav-link")?.focus({ preventScroll: true });
      }
    };
  }, [open]);

  const getButtonColorClass = (href: string) => {
    if (href === "/") return "nav-home";
    if (href.includes("/events")) return "nav-events";
    if (href.includes("/games")) return "nav-games";
    if (href.includes("/leaderboard")) return "nav-leaderboard";
    if (href.includes("/hidden-trail")) return "nav-trail";
    if (href.includes("/dashboard")) return "nav-dashboard";
    if (href.includes("/profile")) return "nav-profile";
    return "";
  };

  return (
    <>
      <div className={`navbar-spacer${enhanced ? " is-enhanced" : ""}`} aria-hidden="true" />
      <header className={`navbar${scrolled ? " is-scrolled" : ""}${enhanced ? " is-enhanced" : ""}`}>
        <nav className="navbar-inner" aria-label="Main navigation">
          <Link href="/" className="wordmark" aria-label="Chapter One home">
            <span className="chapter">CHAPTER</span><span className="one">ONE</span>
          </Link>
          <ul className="radial-menu">
            {links.map((link) => (
              <li key={link.href} className={`radial-item ${getButtonColorClass(link.href)}`}>
                <Link href={link.href} className="radial-link">{link.label}</Link>
              </li>
            ))}
          </ul>
          <div className="desktop-actions">
            {links.map((link) => {
              const isAuth = link.href === "/login" || link.href === "/signup";
              if (isAuth) {
                return link.label === "Login" ? (
                  <Link key={link.href} href={link.href} className="account-link account-ghost" onClick={() => setOpen(false)}>Login</Link>
                ) : (
                  <Link key={link.href} href={link.href} className="account-link account-primary" onClick={() => setOpen(false)}>Enter</Link>
                );
              }
              return null;
            })}
          </div>
          <button
            ref={triggerRef}
            type="button"
            className="menu-trigger icon-button"
            aria-label="Open navigation menu"
            aria-expanded={open}
            aria-controls={menuId}
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
          >
            <Menu aria-hidden="true" size={24} strokeWidth={1.5} />
          </button>
        </nav>
      </header>
      <dialog
        ref={dialogRef}
        id={menuId}
        className="mobile-menu"
        aria-label="Navigation menu"
        aria-modal="true"
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
          const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
            'a[href], button, [tabindex]',
          )).filter((element) => (
            element.tabIndex >= 0
            && !element.matches(":disabled")
            && !element.closest("[inert]")
            && element.getClientRects().length > 0
          ));
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          const active = document.activeElement;
          if (!first) {
            event.preventDefault();
            event.currentTarget.focus();
          } else if (!focusable.some((element) => element === active) || (event.shiftKey ? active === first : active === last)) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
          }
        }}
      >
        <div className="mobile-top">
          <span className="wordmark" aria-label="Chapter One">
            <span className="chapter">CHAPTER</span><span className="one">ONE</span>
          </span>
          <button type="button" className="icon-button" aria-label="Close navigation menu" onClick={() => setOpen(false)}>
            <X aria-hidden="true" size={24} strokeWidth={1.5} />
          </button>
        </div>
        <nav className="mobile-navigation" aria-label="Mobile navigation">
          <p className="menu-eyebrow">YOUR NEXT CHAPTER</p>
          <ul className="mobile-links">
            {mobileLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="mobile-link" onClick={() => setOpen(false)}>{link.label}</Link>
              </li>
            ))}
          </ul>
          <div className="mobile-actions">
            <Link href="/login" className="account-link account-ghost" onClick={() => setOpen(false)}>Login</Link>
            <Link href="/signup" className="account-link account-primary" onClick={() => setOpen(false)}>Enter</Link>
          </div>
        </nav>
      </dialog>
      <style jsx>{`
        .navbar-spacer { display: none; height: var(--space-8); flex-shrink: 0; }
        .navbar-spacer.is-enhanced { display: block; }
        .navbar:not(.is-enhanced) { position: relative; height: auto; background: var(--bg); }
        .navbar:not(.is-enhanced) .navbar-inner { height: auto; min-height: var(--space-8); flex-wrap: wrap; padding-block: var(--space-3); }
        .navbar:not(.is-enhanced) .radial-menu, .navbar:not(.is-enhanced) .desktop-actions { display: flex; flex-wrap: wrap; }
        .navbar:not(.is-enhanced) .radial-menu { gap: var(--space-4); }
        .navbar:not(.is-enhanced) .menu-trigger { display: none; }
        .navbar {
          position: fixed;
          inset: 0 0 auto;
          z-index: 50;
          height: var(--space-8);
          box-sizing: border-box;
          background: var(--bg);
          border-bottom: 1px solid var(--transparent);
          font-family: var(--font-ui);
          transition: background var(--dur-normal) var(--ease), border-color var(--dur-normal) var(--ease);
          isolation: isolate;
        }
        .navbar.is-scrolled {
          background: color-mix(in srgb, var(--bg) 85%, var(--transparent));
          backdrop-filter: blur(var(--space-4));
          -webkit-backdrop-filter: blur(var(--space-4));
          border-bottom-color: var(--border);
        }
        .navbar-inner, .mobile-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-5);
          height: var(--space-8);
          max-width: calc(var(--space-10) * 11);
          margin-inline: auto;
          padding-inline: var(--space-4);
        }
        :global(.navbar .wordmark), .mobile-top .wordmark {
          display: inline-flex;
          align-items: baseline;
          gap: var(--space-2);
          flex-shrink: 0;
          text-decoration: none;
          white-space: nowrap;
          line-height: 1;
        }
        .chapter { font-family: var(--font-display); font-size: var(--text-h3); font-weight: 500; color: var(--accent); }
        .one { font-family: var(--font-ui); font-size: var(--text-label); font-weight: 700; letter-spacing: 0.12em; color: var(--text); }
        .radial-menu {
          display: flex;
          gap: var(--space-6);
          list-style: none;
          padding: 0;
          margin: 0;
          align-items: center;
        }
        .radial-item {
          position: relative;
        }
        .radial-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: calc(var(--space-7) - var(--space-1));
          height: calc(var(--space-7) - var(--space-1));
          border: 1px solid var(--border);
          border-radius: var(--radius-btn);
          background: var(--transparent);
          color: var(--muted);
          font-size: var(--text-label);
          font-weight: 600;
          letter-spacing: 0.04em;
          text-decoration: none;
          transition: color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
          z-index: 10;
        }
        .radial-link:hover, .radial-link:focus-visible {
          color: var(--accent);
          border-color: var(--border-accent);
          background: var(--accent-dim);
        }
        .radial-link:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: var(--space-1);
          border-radius: var(--radius-btn);
        }
        .nav-home .radial-link { color: var(--muted); }
        .nav-home .radial-link:hover, .nav-home .radial-link:focus-visible { color: var(--accent); border-color: var(--border-accent); background: var(--accent-dim); }
        .nav-events .radial-link { color: var(--muted); }
        .nav-events .radial-link:hover, .nav-events .radial-link:focus-visible { color: var(--accent); border-color: var(--border-accent); background: var(--accent-dim); }
        .nav-games .radial-link { color: var(--muted); }
        .nav-games .radial-link:hover, .nav-games .radial-link:focus-visible { color: var(--accent); border-color: var(--border-accent); background: var(--accent-dim); }
        .nav-leaderboard .radial-link { color: var(--muted); }
        .nav-leaderboard .radial-link:hover, .nav-leaderboard .radial-link:focus-visible { color: var(--accent); border-color: var(--border-accent); background: var(--accent-dim); }
        .nav-trail .radial-link { color: var(--muted); }
        .nav-trail .radial-link:hover, .nav-trail .radial-link:focus-visible { color: var(--accent); border-color: var(--border-accent); background: var(--accent-dim); }
        .nav-dashboard .radial-link { color: var(--muted); }
        .nav-dashboard .radial-link:hover, .nav-dashboard .radial-link:focus-visible { color: var(--accent); border-color: var(--border-accent); background: var(--accent-dim); }
        .account-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-3) var(--space-5);
          border: 1px solid var(--transparent);
          border-radius: var(--radius-btn);
          font-size: var(--text-body);
          font-weight: 600;
          line-height: 1.2;
          text-decoration: none;
        }
        :global(.navbar .account-ghost) { color: var(--muted); }
        :global(.navbar .account-primary) { background: var(--accent); color: var(--bg); }
        :global(.navbar .account-link:hover), :global(.mobile-menu .account-link:hover) { background: var(--accent-dim); color: var(--text); border-color: var(--border-accent); }
        .icon-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: calc(var(--space-7) - var(--space-1));
          height: calc(var(--space-7) - var(--space-1));
          padding: 0;
          border: 1px solid var(--border);
          border-radius: var(--radius-btn);
          background: var(--transparent);
          color: var(--text);
          cursor: pointer;
        }
        .icon-button:hover { color: var(--accent); border-color: var(--border-accent); background: var(--accent-dim); }
        :global(.navbar a:focus-visible), :global(.mobile-menu a:focus-visible), .icon-button:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: var(--space-1);
          border-radius: var(--radius-btn);
        }
        .mobile-menu {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100dvh;
          max-width: none;
          max-height: none;
          margin: 0;
          padding: 0;
          border: 0;
          box-sizing: border-box;
          overflow-y: auto;
          overscroll-behavior: contain;
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-ui);
        }
        .mobile-menu:not([open]) { display: none; }
        .mobile-menu[open] { display: flex; flex-direction: column; }
        .mobile-menu::backdrop { background: var(--bg); }
        .mobile-top { box-sizing: border-box; width: 100%; flex-shrink: 0; border-bottom: 1px solid var(--border); }
        .mobile-navigation { width: 100%; box-sizing: border-box; margin-block: auto; padding: var(--space-7) var(--space-5); }
        .menu-eyebrow { margin: 0 0 var(--space-5); font-size: var(--text-meta); letter-spacing: 0.16em; color: var(--muted); }
        .mobile-links { list-style: none; padding: 0; margin: 0; }
        .mobile-links li { border-bottom: 1px solid var(--border); }
        :global(.mobile-menu .mobile-link) {
          display: block;
          padding-block: var(--space-4);
          font-family: var(--font-display);
          font-size: var(--text-h1);
          line-height: 1.2;
          color: var(--text);
          text-decoration: none;
          transition: color var(--dur-fast) var(--ease);
        }
        .mobile-actions { display: flex; gap: var(--space-3); padding-top: var(--space-6); }
        .mobile-menu[open] .mobile-links li, .mobile-menu[open] .mobile-actions { animation: reveal var(--dur-slow) var(--ease) both; }
        .mobile-links li:nth-child(2) { animation-delay: calc(var(--dur-fast) / 2); }
        .mobile-links li:nth-child(3) { animation-delay: var(--dur-fast); }
        .mobile-links li:nth-child(4) { animation-delay: calc(var(--dur-fast) * 1.5); }
        .mobile-menu[open] .mobile-actions { animation-delay: var(--dur-normal); }
        @keyframes reveal {
          from { opacity: 0; transform: translateY(var(--space-3)); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 640px) {
          .navbar-inner, .mobile-top { padding-inline: var(--space-5); }
          .mobile-navigation { padding-inline: var(--space-7); }
        }
        @media (min-width: 1024px) {
          .navbar-inner { padding-inline: var(--space-7); }
          .radial-menu { justify-content: center; }
          .desktop-links, .desktop-actions { display: flex; }
          .menu-trigger { display: none; }
          .account-link { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .navbar, :global(.navbar .nav-link), :global(.mobile-menu .mobile-link) { transition: none; }
          .mobile-menu[open] .mobile-links li, .mobile-menu[open] .mobile-actions { animation: none; }
        }
      `}</style>
    </>
  );
}