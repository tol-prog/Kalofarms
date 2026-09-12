"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function InventoryHistoryChart({
  data,
}: {
  data: { date: string; quantity: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e9ece8" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#7c887d" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#7c887d" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e3e8e2" }} />
        <Line type="stepAfter" dataKey="quantity" stroke="#3a8a3f" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
