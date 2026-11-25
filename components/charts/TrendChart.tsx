'use client';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { fmtMonth, inrCompact } from '@/lib/format';
import { INCOME, COST, GRID, AXIS } from '@/lib/meta';
import ChartTooltip from './ChartTooltip';

export interface MonthPoint { month: string; income: number; cost: number; profit: number }

/** Income vs cost over months — two series on ONE axis, legend + crosshair tooltip. */
export default function TrendChart({ data, height = 260, xFormat = fmtMonth }: { data: MonthPoint[]; height?: number; xFormat?: (s: string) => string }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-zinc-500">
        <Legend color={INCOME} label="Income" />
        <Legend color={COST} label="Cost" />
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="gIncome" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={INCOME} stopOpacity={0.16} /><stop offset="100%" stopColor={INCOME} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gCost" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={COST} stopOpacity={0.12} /><stop offset="100%" stopColor={COST} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="month" tickFormatter={xFormat} tick={{ fontSize: 12, fill: AXIS }} axisLine={false} tickLine={false} dy={6} />
            <YAxis tickFormatter={(v) => inrCompact(v)} tick={{ fontSize: 12, fill: AXIS }} axisLine={false} tickLine={false} width={60} />
            <Tooltip cursor={{ stroke: '#d4d4d8', strokeWidth: 1 }}
              content={<ChartTooltip labelFormatter={xFormat} names={{ income: 'Income', cost: 'Cost' }}
                extra={(d) => [{ label: 'Profit', value: Number(d.profit), tone: Number(d.profit) >= 0 ? 'pos' : 'neg' }]} />} />
            <Area type="monotone" dataKey="income" stroke={INCOME} strokeWidth={2} fill="url(#gIncome)"
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} dot={data.length === 1 ? { r: 4, fill: INCOME, stroke: '#fff', strokeWidth: 2 } : false}
              animationDuration={900} />
            <Area type="monotone" dataKey="cost" stroke={COST} strokeWidth={2} fill="url(#gCost)"
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} dot={data.length === 1 ? { r: 4, fill: COST, stroke: '#fff', strokeWidth: 2 } : false}
              animationDuration={900} animationBegin={150} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-full" style={{ background: color }} />{label}</span>;
}
