'use client';
// Recharts wrappers (client components) for the dashboard.
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

const tooltipStyle = {
  backgroundColor: '#191926',
  border: '1px solid #2b2b3a',
  borderRadius: 12,
  fontSize: 12,
  color: '#e4e4e7',
} as const;

export function RevenueChart({ data }: { data: Array<{ day: string; revenue: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#A3E635" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#A3E635" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
        <Tooltip contentStyle={tooltipStyle as any} formatter={(v: any) => [`₹${Math.round(Number(v)).toLocaleString('en-IN')}`, 'Revenue']} />
        <Area type="monotone" dataKey="revenue" stroke="#A3E635" strokeWidth={2.4} fill="url(#rev)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ChannelBarChart({ data }: { data: Array<{ channel: string; orders: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2b" vertical={false} />
        <XAxis dataKey="channel" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: 'rgba(139,92,246,0.08)' }} contentStyle={tooltipStyle as any} />
        <Bar dataKey="orders" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={34} />
      </BarChart>
    </ResponsiveContainer>
  );
}
