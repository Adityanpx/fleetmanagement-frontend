'use client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine } from 'recharts';
import { inrCompact } from '@/lib/format';
import { POSITIVE, NEGATIVE, GRID, AXIS } from '@/lib/meta';
import ChartTooltip from './ChartTooltip';

/** Signed columns from a zero baseline: green for profit, red for loss. Bars capped at 24px. */
export default function ProfitBars({ data, xKey, yKey = 'profit', xFormat, height = 240, name = 'Profit' }: {
  data: object[]; xKey: string; yKey?: string; xFormat?: (s: string) => string; height?: number; name?: string;
}) {
  const val = (d: object) => Number((d as Record<string, unknown>)[yKey]);
  const hasNeg = data.some((d) => val(d) < 0);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey={xKey} tickFormatter={xFormat} tick={{ fontSize: 12, fill: AXIS }} axisLine={false} tickLine={false} dy={6}
            interval="preserveStartEnd" minTickGap={12} />
          <YAxis tickFormatter={(v) => inrCompact(v)} tick={{ fontSize: 12, fill: AXIS }} axisLine={false} tickLine={false} width={60} />
          {hasNeg && <ReferenceLine y={0} stroke="#d4d4d8" />}
          <Tooltip cursor={{ fill: '#f4f4f5', radius: 6 }}
            content={<ChartTooltip labelFormatter={xFormat} names={{ [yKey]: name }} />} />
          <Bar dataKey={yKey} maxBarSize={24} radius={[4, 4, 0, 0]} animationDuration={800}>
            {data.map((d, i) => <Cell key={i} fill={val(d) >= 0 ? POSITIVE : NEGATIVE} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
