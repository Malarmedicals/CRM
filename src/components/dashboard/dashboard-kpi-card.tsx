import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import Link from "next/link"

interface DashboardKPICardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    color?: "teal" | "blue" | "coral" | "default"
    className?: string
    href?: string
}

export function DashboardKPICard({
    title,
    value,
    icon: Icon,
    trend,
    color = "default",
    className,
    href,
}: DashboardKPICardProps) {
    const colorStyles = {
        teal: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
        blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
        coral: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
        default: "bg-slate-50 text-slate-500 group-hover:bg-slate-100",
    }

    const iconColorClass = colorStyles[color]

    const CardContent = (
        <Card className={cn(
            "group relative overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md border-slate-200 bg-white h-full flex flex-col justify-between p-5",
            className
        )}>
            <div className="flex items-start justify-between mb-4">
                <div className={cn("p-3 rounded-xl transition-colors duration-300", iconColorClass)}>
                    <Icon className="h-6 w-6" />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center text-xs font-semibold px-2.5 py-1 rounded-full",
                        trend.isPositive
                            ? "text-emerald-700 bg-emerald-50"
                            : "text-rose-700 bg-rose-50"
                    )}>
                        {trend.isPositive ? "+" : ""}{trend.value}%
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
            </div>
        </Card>
    )

    if (href) {
        return (
            <Link href={href} className="block h-full">
                {CardContent}
            </Link>
        )
    }

    return CardContent
}
