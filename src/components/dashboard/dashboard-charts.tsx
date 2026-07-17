"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from "recharts"

const COLORS = ["#059669", "#2563eb", "#d97706", "#475569"] // Emerald, Blue, Amber, Slate

interface SalesOverviewProps {
    data: { name: string; value: number }[]
}

export function SalesOverviewChart({ data }: SalesOverviewProps) {
    return (
        <Card className="border border-slate-200 shadow-sm bg-white h-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Sales Overview</CardTitle>
                <p className="text-sm text-slate-500">Last 30 Days Performance</p>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#059669" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff', color: '#0f172a' }}
                                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Sales']}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#059669"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}

interface RevenueBreakdownProps {
    data: { name: string; value: number }[]
}

export function RevenueBreakdownChart({ data }: RevenueBreakdownProps) {
    return (
        <Card className="border border-slate-200 shadow-sm bg-white h-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Revenue by Category</CardTitle>
                <p className="text-sm text-slate-500">Distribution across product types</p>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff', color: '#0f172a' }}
                                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-4 flex-wrap">
                    {data.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-xs text-slate-500 font-medium">{entry.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

interface TopSellingProps {
    data: { name: string; sales: number }[]
}

export function TopSellingChart({ data }: TopSellingProps) {
    return (
        <Card className="border border-slate-200 shadow-sm bg-white h-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Top Selling Medicines</CardTitle>
                <p className="text-sm text-slate-500">Highest performing products</p>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                width={80}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff', color: '#0f172a' }}
                            />
                            <Bar dataKey="sales" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
