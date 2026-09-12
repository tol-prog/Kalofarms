export type NavLeaf = { label: string; href: string };
export type NavItem = {
  label: string;
  href?: string;
  icon: string; // lucide icon name, resolved in sidebar.tsx
  children?: NavLeaf[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  {
    label: "Livestock",
    icon: "Beef",
    children: [
      { label: "Animals", href: "/livestock/animals" },
      { label: "Livestock Groups", href: "/livestock/groups" },
      { label: "Grazing", href: "/livestock/grazing" },
    ],
  },
  { label: "Plantings", href: "/plantings", icon: "Sprout" },
  {
    label: "Resources",
    icon: "Warehouse",
    children: [
      { label: "Equipment", href: "/resources/equipment" },
      { label: "Warehouses", href: "/resources/warehouses" },
      { label: "Inventory", href: "/resources/inventory" },
    ],
  },
  {
    label: "Accounting",
    icon: "Landmark",
    children: [
      { label: "Transactions", href: "/accounting/transactions" },
      { label: "P&L Statement", href: "/accounting/pl" },
      { label: "Cash Flow", href: "/accounting/cashflow" },
      { label: "Balance Sheet", href: "/accounting/balance-sheet" },
      { label: "Budgeting", href: "/accounting/budgeting" },
      { label: "Categories", href: "/accounting/categories" },
    ],
  },
  {
    label: "Market",
    icon: "ShoppingBag",
    children: [
      { label: "Products", href: "/market/products" },
      { label: "Orders", href: "/market/orders" },
    ],
  },
  { label: "Contacts", href: "/contacts", icon: "IdCard" },
  { label: "Climate", href: "/climate", icon: "CloudSun" },
  { label: "Reports", href: "/reports", icon: "FileText" },
];
