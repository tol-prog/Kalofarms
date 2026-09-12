"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Beef,
  Sprout,
  Warehouse,
  Landmark,
  ShoppingBag,
  IdCard,
  CloudSun,
  FileText,
  ChevronDown,
  Leaf,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS } from "./nav-config";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Beef,
  Sprout,
  Warehouse,
  Landmark,
  ShoppingBag,
  IdCard,
  CloudSun,
  FileText,
};

export function Sidebar() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const item of NAV_ITEMS) {
      if (item.children?.some((c) => pathname.startsWith(c.href))) {
        initial[item.label] = true;
      }
    }
    return initial;
  });

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col border-r shrink-0"
      style={{ background: "var(--color-sidebar-bg)", borderColor: "var(--color-sidebar-border)" }}
    >
      <div className="flex items-center gap-2 px-5 h-16 border-b" style={{ borderColor: "var(--color-sidebar-border)" }}>
        <Leaf className="text-[--color-primary]" size={22} />
        <span className="font-semibold text-lg tracking-tight" style={{ color: "var(--color-sidebar-text)" }}>
          Kalo Farm
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          if (!item.children) {
            const active = item.href ? pathname.startsWith(item.href) : false;
            return (
              <Link
                key={item.label}
                href={item.href!}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium mb-0.5 transition-colors"
                style={{
                  color: active ? "var(--color-sidebar-active-text)" : "var(--color-sidebar-text)",
                  background: active ? "var(--color-sidebar-active-bg)" : "transparent",
                }}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          }

          const isOpen = !!openGroups[item.label];
          const groupActive = item.children.some((c) => pathname.startsWith(c.href));

          return (
            <div key={item.label} className="mb-0.5">
              <button
                type="button"
                onClick={() => setOpenGroups((s) => ({ ...s, [item.label]: !s[item.label] }))}
                className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  color: groupActive ? "var(--color-sidebar-active-text)" : "var(--color-sidebar-text)",
                  background: groupActive && !isOpen ? "var(--color-sidebar-active-bg)" : "transparent",
                }}
              >
                <Icon size={17} />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  size={15}
                  className="transition-transform"
                  style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              {isOpen && (
                <div className="ml-[1.65rem] mt-0.5 flex flex-col border-l" style={{ borderColor: "var(--color-sidebar-border)" }}>
                  {item.children.map((child) => {
                    const active = pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="px-3 py-1.5 text-sm ml-1 rounded-r-md"
                        style={{
                          color: active ? "var(--color-sidebar-active-text)" : "var(--color-sidebar-text-muted)",
                          background: active ? "var(--color-sidebar-active-bg)" : "transparent",
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
