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
        teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:bg-teal-500 group-hover:text-white",
        blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white",
        coral: "bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white",
        default: "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground",
    }

    const iconColorClass = colorStyles[color]

    const CardContent = (
        <Card className={cn(
            "group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border shadow-sm bg-card h-full",
            className
        )}>
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl transition-colors duration-300", iconColorClass)}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold mt-1 text-card-foreground">{value}</h3>
                    </div>
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center text-xs font-medium px-2.5 py-1 rounded-full",
                        trend.isPositive
                            ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400"
                            : "text-rose-700 bg-rose-100 dark:bg-rose-500/20 dark:text-rose-400"
                    )}>
                        {trend.isPositive ? "+" : ""}{trend.value}%
                    </div>
                )}
            </div>
            <div className={cn(
                "absolute bottom-0 left-0 h-1 w-full transition-all duration-300 transform scale-x-0 group-hover:scale-x-100",
                color === 'teal' ? "bg-teal-500" :
                    color === 'blue' ? "bg-blue-500" :
                        color === 'coral' ? "bg-orange-500" : "bg-primary"
            )} />
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
