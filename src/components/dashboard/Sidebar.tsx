"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LogoutButton } from "@/components/auth/LogoutButton";
import {
  LayoutDashboard,
  Calendar,
  QrCode,
  Trophy,
  Image,
  User,
  Settings,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { section: "Overview", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
      section: "Explore",
      items: [
        { href: "/events", label: "Events", icon: Calendar },
        { href: "/games", label: "Games", icon: Trophy },
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { href: "/gallery", label: "Gallery", icon: Image },
      ],
    },
  {
    section: "Hidden Trail",
    items: [
      { href: "/hidden-trail", label: "The Trail", icon: QrCode },
      { href: "/hidden-trail/result", label: "My Result", icon: Trophy },
      { href: "/hidden-trail/album", label: "My Moments", icon: Image },
      { href: "/hidden-trail/stats", label: "My Stats", icon: User },
    ],
  },
  {
    section: "Account",
    items: [
      { href: "/profile", label: "Profile", icon: User },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden rounded-full bg-[var(--surface)] border border-white/[0.06] p-3 text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--background)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 lg:hidden"
        >
          <div className="absolute inset-0 bg-[var(--background)]/90 backdrop-blur-xl" />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 25 }}
            className="absolute left-0 top-0 bottom-0 w-72 bg-[var(--surface)] border-r border-white/[0.06] p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-lg font-black tracking-wider text-[var(--foreground)] uppercase">
                CHAPTER ONE
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-zinc-500 hover:text-[var(--foreground)] transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 flex flex-col gap-1">
              {navItems.map((section) => (
                <div key={section.section}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-2 mt-4">
                    {section.section}
                  </p>
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        pathname === item.href
                          ? "text-[var(--accent)] bg-[var(--accent-dim)]"
                          : "text-zinc-400 hover:text-[var(--foreground)] hover:bg-white/[0.03]"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
            <div className="mt-auto">
              <LogoutButton />
            </div>
          </motion.aside>
        </motion.div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-64 lg:z-50 lg:flex lg:flex-col">
        <div className="flex flex-col h-full bg-[var(--surface)] border-r border-white/[0.06]">
          <div className="p-6 flex items-center gap-3">
            <span className="text-xl font-black tracking-wider text-[var(--foreground)] uppercase">
              CHAPTER ONE
            </span>
          </div>
          <nav className="flex-1 flex flex-col gap-1 px-3 py-2 overflow-y-auto">
            {navItems.map((section) => (
              <div key={section.section}>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-1 mt-3">
                  {section.section}
                </p>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "text-[var(--accent)] bg-[var(--accent-dim)]"
                        : "text-zinc-400 hover:text-[var(--foreground)] hover:bg-white/[0.03]"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="p-3 border-t border-white/[0.06]">
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}