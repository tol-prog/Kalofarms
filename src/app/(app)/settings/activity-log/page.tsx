import { db, schema } from "@/db";
import { desc, eq, gte, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ActivityTrendChart, type DayPoint } from "./activity-trend-chart";
import {
  LogIn,
  KeyRound,
  PackagePlus,
  FlaskConical,
  Receipt,
  Egg,
  Wheat,
  Users,
  Beef,
  ClipboardList,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ACTION_ICONS: Record<string, typeof LogIn> = {
  login: LogIn,
  password_changed: KeyRound,
  inventory_item_created: PackagePlus,
  inventory_adjusted: PackagePlus,
  recipe_created: FlaskConical,
  recipe_made: FlaskConical,
  transaction_created: Receipt,
  order_created: Receipt,
  egg_sale: Egg,
  feed_sale: Wheat,
  user_created: Users,
  user_enabled: Users,
  user_disabled: Users,
  livestock_created: Beef,
  livestock_deleted: Beef,
  equipment_created: ClipboardList,
};

function actionLabel(action: string): string {
  if (action.startsWith("activity_")) {
    const sub = action.replace("activity_", "").replace("_", " ");
    return `Livestock: ${sub}`;
  }
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  await requireAdmin();
  const { userId } = await searchParams;

  const [logs, users, thirtyDayCounts] = await Promise.all([
    db
      .select()
      .from(schema.activityLogs)
      .where(userId ? eq(schema.activityLogs.userId, userId) : undefined)
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(200),
    db.select({ id: schema.users.id, displayName: schema.users.displayName }).from(schema.users),
    db
      .select({
        day: sql<string>`to_char(${schema.activityLogs.createdAt}, 'Mon DD')`,
        dayKey: sql<string>`to_char(${schema.activityLogs.createdAt}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.activityLogs)
      .where(gte(schema.activityLogs.createdAt, sql`now() - interval '14 days'`))
      .groupBy(sql`1, 2`),
  ]);

  // Fill in every day of the last 14 days, even ones with zero activity.
  const countsByDay = new Map(thirtyDayCounts.map((r) => [r.dayKey, r.count]));
  const chartData: DayPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(d);
    chartData.push({ day: label, count: countsByDay.get(key) ?? 0 });
  }

  // Who's been most active in the last 30 days (from the same fetched page,
  // approximated from what's loaded — good enough for a quick glance).
  const byUser = new Map<string, number>();
  for (const log of logs) {
    byUser.set(log.userName, (byUser.get(log.userName) ?? 0) + 1);
  }
  const topUsers = Array.from(byUser.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxUserCount = topUsers[0]?.[1] ?? 1;

  return (
    <div>
      <PageHeader title="Activity Log" description="Who did what, and when — visible to admins only." />

      <div className="kf-card p-5 mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Actions per day (last 14 days)</p>
        <ActivityTrendChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 kf-card overflow-x-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--color-card-border)" }}>
            <h2 className="text-sm font-semibold">Recent Activity</h2>
            <form className="flex items-center gap-2" method="get">
              <select name="userId" defaultValue={userId ?? ""} className="kf-input text-xs py-1" style={{ width: "auto" }}>
                <option value="">All users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName}
                  </option>
                ))}
              </select>
              <button type="submit" className="kf-btn-secondary text-xs py-1 px-2.5">
                Filter
              </button>
            </form>
          </div>
          {logs.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--color-table-border)" }}>
              {logs.map((log) => {
                const Icon = ACTION_ICONS[log.action] ?? ClipboardList;
                return (
                  <li key={log.id} className="px-4 py-2.5 flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "var(--color-badge-muted-bg)" }}
                    >
                      <Icon size={13} className="text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{log.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(log.createdAt)}
                      </p>
                    </div>
                    <Badge variant="muted" className="shrink-0">
                      {actionLabel(log.action)}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="kf-card p-5 h-fit">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Most active (shown page)</p>
          {topUsers.length === 0 ? (
            <p className="text-sm text-gray-400">No activity yet.</p>
          ) : (
            <div className="space-y-2.5">
              {topUsers.map(([name, count]) => (
                <div key={name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{name}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "var(--color-card-border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(6, (count / maxUserCount) * 100)}%`, background: "var(--color-primary)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
