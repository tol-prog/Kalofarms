"use client";

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export type DayPoint = { day: string; count: number };

export function ActivityTrendChart({ data }: { data: DayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e9ece8" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#7c887d" }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#7c887d" }} axisLine={false} tickLine={false} width={28} />
        <Tooltip
          formatter={(value) => [value, "actions"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e3e8e2" }}
        />
        <Bar dataKey="count" fill="#3a8a3f" radius={[3, 3, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
