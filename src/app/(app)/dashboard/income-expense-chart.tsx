"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type MonthlyPoint = {
  month: string;
  income: number;
  expense: number;
  net: number;
};

export function IncomeExpenseChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e9ece8" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#7c887d" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#7c887d" }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(value) => (typeof value === "number" ? value.toLocaleString() : value)}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e3e8e2" }}
        />
        <Bar dataKey="income" fill="#3a8a3f" radius={[3, 3, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expense" fill="#c0392b" radius={[0, 0, 3, 3]} maxBarSize={28} />
        <Line type="monotone" dataKey="net" stroke="#1f2a20" strokeWidth={2} dot={{ r: 2 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
