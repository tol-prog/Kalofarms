import Link from "next/link";
import { db, schema } from "@/db";
import { desc, sql } from "drizzle-orm";
import { fetchWeather, weatherLabel } from "@/lib/weather";
import { timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { IncomeExpenseChart, type MonthlyPoint } from "./income-expense-chart";
import { Cloud, Droplets, Wind, AlertTriangle, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

async function getFarmSettings() {
  const [row] = await db.select().from(schema.farmSettings).limit(1);
  if (row) return row;
  const [created] = await db.insert(schema.farmSettings).values({}).returning();
  return created;
}

async function getInventoryAlerts() {
  const items = await db.select().from(schema.inventoryItems);
  return items.filter((item) => {
    if (!item.reorderThreshold) return false;
    return parseFloat(item.quantityAvailable) <= parseFloat(item.reorderThreshold);
  });
}

async function getMonthlyIncomeExpense(): Promise<MonthlyPoint[]> {
  const rows = await db
    .select({
      month: sql<string>`to_char(${schema.transactions.date}, 'Mon YYYY')`,
      monthKey: sql<string>`to_char(${schema.transactions.date}, 'YYYY-MM')`,
      type: schema.transactions.type,
      amount: schema.transactions.amount,
    })
    .from(schema.transactions);

  const buckets = new Map<string, MonthlyPoint>();
  for (const r of rows) {
    const key = r.monthKey;
    if (!buckets.has(key)) {
      buckets.set(key, { month: r.month, income: 0, expense: 0, net: 0 });
    }
    const b = buckets.get(key)!;
    const amt = parseFloat(r.amount);
    if (r.type === "income") b.income += amt;
    else if (r.type === "expense") b.expense += amt;
  }
  const sortedKeys = Array.from(buckets.keys()).sort();
  return sortedKeys.slice(-12).map((k) => {
    const b = buckets.get(k)!;
    return { ...b, net: b.income - b.expense, expense: -b.expense };
  });
}

async function getRecentActivity() {
  const activity = await db
    .select({
      id: schema.livestockActivity.id,
      date: schema.livestockActivity.date,
      type: schema.livestockActivity.type,
      notes: schema.livestockActivity.notes,
      livestockId: schema.livestockActivity.livestockId,
      yieldAmount: schema.livestockActivity.yieldAmount,
      yieldUnit: schema.livestockActivity.yieldUnit,
      deceasedCount: schema.livestockActivity.deceasedCount,
      livestockName: schema.livestock.nameOrLabel,
    })
    .from(schema.livestockActivity)
    .leftJoin(schema.livestock, sql`${schema.livestockActivity.livestockId} = ${schema.livestock.id}`)
    .orderBy(desc(schema.livestockActivity.createdAt))
    .limit(8);
  return activity;
}

export default async function DashboardPage() {
  const farm = await getFarmSettings();
  const [weather, alerts, monthly, activity] = await Promise.all([
    fetchWeather(farm.latitude ?? 9.0667, farm.longitude ?? 38.4833),
    getInventoryAlerts(),
    getMonthlyIncomeExpense(),
    getRecentActivity(),
  ]);

  const locationLabel = farm.location.split(",")[0];

  return (
    <div>
      <PageHeader title="Dashboard" description={farm.farmName} />

      {alerts.length > 0 && (
        <Link
          href="/resources/inventory"
          className="flex items-center gap-2 mb-5 px-4 py-2.5 rounded-md border text-sm font-medium"
          style={{ background: "var(--color-warning-bg)", borderColor: "#f0e0b0", color: "var(--color-warning)" }}
        >
          <AlertTriangle size={16} />
          {alerts.length} Inventory Alert{alerts.length !== 1 ? "s" : ""} &mdash; low stock on{" "}
          {alerts.slice(0, 3).map((a) => a.name).join(", ")}
          {alerts.length > 3 ? " and more" : ""}
          <ArrowRight size={14} className="ml-auto" />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="kf-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Weather for {locationLabel}
          </p>
          {weather ? (
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-3">
                <Cloud size={40} className="text-gray-400" strokeWidth={1.5} />
                <div>
                  <p className="text-3xl font-semibold leading-none">{Math.round(weather.currentTempC)}°C</p>
                  <p className="text-sm text-gray-500 mt-1">{weatherLabel(weather.weatherCode)}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  H {Math.round(weather.highC)}°C &middot; L {Math.round(weather.lowC)}°C
                </p>
                <p className="flex items-center gap-1.5">
                  <Wind size={13} /> {weather.windSpeed} km/h
                </p>
                <p className="flex items-center gap-1.5">
                  <Droplets size={13} /> {weather.humidity}% humidity
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Weather data unavailable.</p>
          )}
        </div>

        <div className="kf-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Recent Activity</p>
            <Link href="/livestock/animals" className="text-xs font-medium text-[--color-primary]">
              View all
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No recent activity recorded.</p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--color-card-border)" }}>
              {activity.map((a) => (
                <li key={a.id} className="py-2 text-sm flex items-center justify-between gap-3">
                  <div>
                    <span className="font-medium">{a.livestockName ?? "Unknown"}</span>{" "}
                    <span className="text-gray-500">
                      {a.type === "harvest" && `harvested ${a.yieldAmount ?? ""} ${a.yieldUnit ?? ""}`}
                      {a.type === "change_count" && a.deceasedCount ? `${a.deceasedCount} deceased` : null}
                      {a.type === "note" && (a.notes ?? "note added")}
                      {!["harvest", "change_count", "note"].includes(a.type) && a.type.replace("_", " ")}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{timeAgo(a.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="kf-card p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Income vs Expense</p>
          <Link href="/accounting/pl" className="text-xs font-medium text-[--color-primary]">
            Accounting
          </Link>
        </div>
        {monthly.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">
            No transactions yet. Record income and expenses under Accounting to see trends here.
          </p>
        ) : (
          <IncomeExpenseChart data={monthly} />
        )}
      </div>
    </div>
  );
}
