"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Egg, Receipt, Warehouse, Menu, X } from "lucide-react";
import { NAV_ITEMS } from "./nav-config";
import { ICONS } from "./sidebar";
import { KALO_LOGO_DATA_URL } from "@/lib/logo";

const PRIMARY = [
  { label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Harvest", href: "/livestock/harvest", Icon: Egg },
  { label: "Sales", href: "/sales/new", Icon: Receipt },
  { label: "Inventory", href: "/resources/inventory", Icon: Warehouse },
];

/**
 * Bottom tab bar shown only below the `md` breakpoint. The desktop Sidebar
 * is `hidden` on mobile, so this is the only navigation staff have on their
 * phones — the device they use for most day-to-day data entry.
 */
export function MobileNav({ role }: { role?: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 flex items-stretch border-t z-30"
        style={{ background: "var(--color-sidebar-bg)", borderColor: "var(--color-sidebar-border)" }}
      >
        {PRIMARY.map(({ label, href, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium"
              style={{ color: active ? "var(--color-primary)" : "var(--color-sidebar-text-muted)" }}
            >
              <Icon size={19} />
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium"
          style={{ color: "var(--color-sidebar-text-muted)" }}
        >
          <Menu size={19} />
          Menu
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div
            className="relative rounded-t-xl max-h-[80vh] overflow-y-auto"
            style={{ background: "var(--color-sidebar-bg)" }}
          >
            <div
              className="flex items-center justify-between px-4 h-14 border-b sticky top-0"
              style={{ borderColor: "var(--color-sidebar-border)", background: "var(--color-sidebar-bg)" }}
            >
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={KALO_LOGO_DATA_URL} alt="Kalo Farms" className="h-5 w-auto" />
                <span className="font-semibold text-sm">Kalo Farms</span>
              </div>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <div className="p-3 pb-8">
              {items.map((item) => {
                const Icon = ICONS[item.icon];
                if (!item.children) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href!}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium"
                      style={{ color: "var(--color-sidebar-text)" }}
                    >
                      <Icon size={18} /> {item.label}
                    </Link>
                  );
                }
                return (
                  <div key={item.label} className="mb-1">
                    <p
                      className="flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--color-sidebar-text-muted)" }}
                    >
                      <Icon size={15} /> {item.label}
                    </p>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center rounded-md pl-11 pr-3 py-2 text-sm"
                        style={{ color: "var(--color-sidebar-text)" }}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
