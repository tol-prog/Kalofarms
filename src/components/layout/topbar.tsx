"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Search, Plus, Settings, ChevronDown, LogOut, UserRound, KeyRound } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth-actions";

const QUICK_ADD_LINKS = [
  { label: "Animal", href: "/livestock/animals/new" },
  { label: "Livestock Group", href: "/livestock/groups/new" },
  { label: "Planting", href: "/plantings/new" },
  { label: "Inventory Item", href: "/resources/inventory/new" },
  { label: "Transaction", href: "/accounting/transactions/new" },
  { label: "Contact", href: "/contacts/new" },
  { label: "Order", href: "/market/orders/new" },
];

export function Topbar({ displayName, role }: { displayName: string; role: string }) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setQuickAddOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className="h-16 flex items-center gap-4 px-5 border-b shrink-0"
      style={{ background: "var(--color-topbar-bg)", borderColor: "var(--color-topbar-border)" }}
    >
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          className="kf-input pl-9"
        />
      </div>

      <div className="flex-1" />

      <div className="relative" ref={quickAddRef}>
        <button
          type="button"
          onClick={() => setQuickAddOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium"
          style={{ borderColor: "var(--color-card-border)" }}
        >
          <Plus size={15} /> Quick Add
        </button>
        {quickAddOpen && (
          <div className="absolute right-0 mt-2 w-48 kf-card shadow-lg py-1 z-20">
            {QUICK_ADD_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setQuickAddOpen(false)}
                className="block px-3.5 py-2 text-sm hover:bg-[--color-table-row-hover]"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/settings/users"
        className="p-2 rounded-md hover:bg-[--color-table-row-hover] text-[--color-sidebar-text]"
        title="Settings"
      >
        <Settings size={18} />
      </Link>

      <div className="relative" ref={userMenuRef}>
        <button
          type="button"
          onClick={() => setUserMenuOpen((v) => !v)}
          className="flex items-center gap-2"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[--color-primary] text-white text-xs font-semibold">
            {initials || <UserRound size={15} />}
          </span>
          <ChevronDown size={14} className="text-gray-400" />
        </button>
        {userMenuOpen && (
          <div className="absolute right-0 mt-2 w-52 kf-card shadow-lg py-1 z-20">
            <div className="px-3.5 py-2 border-b" style={{ borderColor: "var(--color-card-border)" }}>
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-gray-500 capitalize">{role.replace("_", " ")}</p>
            </div>
            <Link
              href="/change-password"
              onClick={() => setUserMenuOpen(false)}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-left hover:bg-[--color-table-row-hover]"
            >
              <KeyRound size={14} /> Change Password
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-left hover:bg-[--color-table-row-hover]"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
