import Link from "next/link";
import { db, schema } from "@/db";
import { and, desc, eq, gte, ilike, inArray, sql } from "drizzle-orm";
import { fetchWeather, weatherLabel } from "@/lib/weather";
import { timeAgo, formatNumber, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { IncomeExpenseChart, type MonthlyPoint } from "./income-expense-chart";
import {
  Cloud,
  Droplets,
  Wind,
  AlertTriangle,
  ArrowRight,
  Egg,
  Skull,
  Syringe,
  Scale,
  PackagePlus,
  Receipt,
  FlaskConical,
  Plus,
  Wheat,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getFarmSettings() {
  const [row] = await db.select().from(schema.farmSettings).limit(1);
  if (row) return row;
  const [created] = await db.insert(schema.farmSettings).values({}).returning();
  return created;
}

async function getInventoryAlerts() {
  const items = await db.select().from(schema.inventoryItems);
  return items
    .filter((item) => {
      if (!item.reorderThreshold) return false;
      return parseFloat(item.quantityAvailable) <= parseFloat(item.reorderThreshold);
    })
    .sort((a, b) => parseFloat(a.quantityAvailable) - parseFloat(b.quantityAvailable));
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

/** The layer chicken flock — a "livestock" set-record, not a single bird. */
async function getLayerFlock() {
  const [flock] = await db
    .select()
    .from(schema.livestock)
    .where(ilike(schema.livestock.nameOrLabel, "%layer%"))
    .limit(1);
  if (!flock) return null;

  const today = new Date().toISOString().slice(0, 10);

  const [todayHarvest] = await db
    .select({
      regular: sql<string>`coalesce(sum(${schema.livestockActivity.regularEggs}), 0)`,
      oversized: sql<string>`coalesce(sum(${schema.livestockActivity.oversizedEggs}), 0)`,
      broken: sql<string>`coalesce(sum(${schema.livestockActivity.brokenEggs}), 0)`,
    })
    .from(schema.livestockActivity)
    .where(
      and(
        eq(schema.livestockActivity.livestockId, flock.id),
        eq(schema.livestockActivity.type, "harvest"),
        eq(schema.livestockActivity.date, today)
      )
    );

  const [todayMortality] = await db
    .select({ total: sql<string>`coalesce(sum(${schema.livestockActivity.deceasedCount}), 0)` })
    .from(schema.livestockActivity)
    .where(
      and(
        eq(schema.livestockActivity.livestockId, flock.id),
        eq(schema.livestockActivity.type, "change_count"),
        eq(schema.livestockActivity.date, today)
      )
    );

  const [lastTreatment] = await db
    .select()
    .from(schema.livestockActivity)
    .where(and(eq(schema.livestockActivity.livestockId, flock.id), eq(schema.livestockActivity.type, "treatment")))
    .orderBy(desc(schema.livestockActivity.date))
    .limit(1);

  return { flock, todayHarvest, todayMortality, lastTreatment };
}

/** Feed types = inventory items produced by at least one recipe. */
async function getFeedSummary() {
  const recipeCounts = await db
    .select({ producesItemId: schema.inventoryRecipes.producesItemId, recipeCount: sql<number>`count(*)::int` })
    .from(schema.inventoryRecipes)
    .groupBy(schema.inventoryRecipes.producesItemId);

  const feedItemIds = recipeCounts.map((r) => r.producesItemId);
  if (feedItemIds.length === 0) return { recipeCount: 0, batchesToday: 0, amountToday: 0, unit: "kg" };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const madeToday = await db
    .select({
      batches: sql<number>`count(*)::int`,
      amount: sql<string>`coalesce(sum(${schema.inventoryTransactions.amount}), 0)`,
    })
    .from(schema.inventoryTransactions)
    .where(
      and(
        eq(schema.inventoryTransactions.type, "recipe_produce"),
        inArray(schema.inventoryTransactions.itemId, feedItemIds),
        gte(schema.inventoryTransactions.date, todayStart)
      )
    );

  return {
    recipeCount: recipeCounts.reduce((s, r) => s + r.recipeCount, 0),
    feedTypeCount: feedItemIds.length,
    batchesToday: madeToday[0]?.batches ?? 0,
    amountToday: parseFloat(madeToday[0]?.amount ?? "0"),
  };
}

export default async function DashboardPage() {
  const farm = await getFarmSettings();
  const [weather, alerts, monthly, activity, layer, feed] = await Promise.all([
    fetchWeather(farm.latitude ?? 9.0667, farm.longitude ?? 38.4833),
    getInventoryAlerts(),
    getMonthlyIncomeExpense(),
    getRecentActivity(),
    getLayerFlock(),
    getFeedSummary(),
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

      {/* Layer Chickens / Feed Production split — the two things staff do most */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Layer Chickens */}
        <div className="kf-card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--color-sidebar-active-bg)" }}
            >
              <Egg size={16} className="text-[--color-primary]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-sm">Layer Chickens</h2>
              <p className="text-xs text-gray-500">
                {layer ? `${layer.flock.nameOrLabel} · ${formatNumber(layer.flock.numberInSet)} birds` : "No flock recorded yet"}
              </p>
            </div>
            {layer && (
              <Link href={`/livestock/animals/${layer.flock.id}`} className="text-xs font-medium text-[--color-primary] shrink-0">
                Open &rarr;
              </Link>
            )}
          </div>

          {layer ? (
            <>
              <Link
                href="/livestock/harvest"
                className="flex items-center gap-3 rounded-lg px-4 py-3.5 mb-3 text-white"
                style={{ background: "var(--color-primary)" }}
              >
                <Egg size={20} />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Log Today&apos;s Harvest</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.85)" }}>
                    Regular, oversized &amp; broken eggs
                  </p>
                </div>
                <ArrowRight size={16} />
              </Link>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <Link
                  href={`/livestock/animals/${layer.flock.id}?type=change_count#record-activity`}
                  className="kf-card flex flex-col items-center gap-1.5 py-3 text-center"
                >
                  <Skull size={16} className="text-[--color-danger]" />
                  <span className="text-xs font-medium">Mortality</span>
                </Link>
                <Link
                  href={`/livestock/animals/${layer.flock.id}?type=treatment#record-activity`}
                  className="kf-card flex flex-col items-center gap-1.5 py-3 text-center"
                >
                  <Syringe size={16} className="text-[--color-warning]" />
                  <span className="text-xs font-medium">Treatment</span>
                </Link>
                <Link
                  href={`/livestock/animals/${layer.flock.id}?type=weight#record-activity`}
                  className="kf-card flex flex-col items-center gap-1.5 py-3 text-center"
                >
                  <Scale size={16} className="text-gray-500" />
                  <span className="text-xs font-medium">Weigh &amp; Feed</span>
                </Link>
              </div>

              <div className="border-t pt-3" style={{ borderColor: "var(--color-card-border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Today</p>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <p className="text-lg font-semibold leading-none">{formatNumber(layer.todayHarvest?.regular ?? "0")}</p>
                    <p className="text-[11px] text-gray-500 mt-1">Regular</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold leading-none">{formatNumber(layer.todayHarvest?.oversized ?? "0")}</p>
                    <p className="text-[11px] text-gray-500 mt-1">Oversized</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold leading-none" style={{ color: "var(--color-danger)" }}>
                      {formatNumber(layer.todayHarvest?.broken ?? "0")}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">Broken</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {formatNumber(layer.todayMortality?.total ?? "0")} mortality today
                  {layer.lastTreatment && (
                    <>
                      {" "}
                      &middot; Last vaccine: {layer.lastTreatment.treatmentName ?? "treatment"} &middot;{" "}
                      {timeAgo(layer.lastTreatment.date)}
                      {layer.lastTreatment.withdrawalUntil && new Date(layer.lastTreatment.withdrawalUntil) > new Date() ? (
                        <span
                          className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)" }}
                        >
                          Withdrawal until {formatDate(layer.lastTreatment.withdrawalUntil)}
                        </span>
                      ) : (
                        <span
                          className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: "var(--color-sidebar-active-bg)", color: "var(--color-primary)" }}
                        >
                          Withdrawal clear
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 py-6 text-center">
              No livestock record matching &ldquo;layer&rdquo; found yet.{" "}
              <Link href="/livestock/animals/new" className="text-[--color-primary] font-medium">
                Add your flock
              </Link>
              .
            </p>
          )}
        </div>

        {/* Feed Production */}
        <div className="kf-card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#eef2fb" }}
            >
              <Wheat size={16} style={{ color: "#3454a8" }} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-sm">Feed Production</h2>
              <p className="text-xs text-gray-500">
                {feed.feedTypeCount ?? 0} feed type{feed.feedTypeCount === 1 ? "" : "s"} &middot; {feed.recipeCount} recipe
                {feed.recipeCount === 1 ? "" : "s"}
              </p>
            </div>
            <Link href="/resources/feed-types" className="text-xs font-medium text-[--color-primary] shrink-0">
              Open &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <Link href="/resources/inventory/receive" className="kf-card flex items-center gap-2.5 px-3.5 py-3">
              <PackagePlus size={16} style={{ color: "#3454a8" }} />
              <span className="text-xs font-medium">Add Inventory</span>
            </Link>
            <Link href="/sales/new" className="kf-card flex items-center gap-2.5 px-3.5 py-3">
              <Receipt size={16} style={{ color: "#3454a8" }} />
              <span className="text-xs font-medium">Log Sale</span>
            </Link>
            <Link
              href="/resources/feed-types"
              className="flex items-center gap-2.5 px-3.5 py-3 rounded-md text-white"
              style={{ background: "var(--color-primary)" }}
            >
              <FlaskConical size={16} />
              <span className="text-xs font-medium">Make Recipe</span>
            </Link>
            <Link href="/resources/feed-types" className="kf-card flex items-center gap-2.5 px-3.5 py-3">
              <Plus size={16} className="text-gray-500" />
              <span className="text-xs font-medium">New Recipe</span>
            </Link>
          </div>

          <div className="border-t pt-3 mb-3" style={{ borderColor: "var(--color-card-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Recipes made today</p>
            <p className="text-lg font-semibold leading-none">
              {feed.batchesToday} batch{feed.batchesToday !== 1 ? "es" : ""} &middot; {formatNumber(feed.amountToday)} kg
            </p>
          </div>

          {alerts.length > 0 && (
            <div className="border-t pt-3" style={{ borderColor: "var(--color-card-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Low stock</p>
              <div className="space-y-2">
                {alerts.slice(0, 2).map((a) => {
                  const qty = parseFloat(a.quantityAvailable);
                  const threshold = a.reorderThreshold ? parseFloat(a.reorderThreshold) : 1;
                  const pct = Math.min(100, Math.max(6, (qty / (threshold * 2)) * 100));
                  return (
                    <div key={a.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{a.name}</span>
                        <span style={{ color: "var(--color-danger)" }}>
                          {formatNumber(qty)} {a.unit}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "var(--color-card-border)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: "var(--color-danger)" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

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
