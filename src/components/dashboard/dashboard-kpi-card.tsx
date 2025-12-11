import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

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
}

export function DashboardKPICard({
    title,
    value,
    icon: Icon,
    trend,
    color = "default",
    className,
}: DashboardKPICardProps) {
    const colorStyles = {
        teal: "bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white",
        blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
        coral: "bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white",
        default: "bg-gray-100 text-gray-600 group-hover:bg-gray-800 group-hover:text-white",
    }

    const iconColorClass = colorStyles[color]

    return (
        <Card className={cn(
            "group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-none shadow-sm bg-white",
            className
        )}>
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl transition-colors duration-300", iconColorClass)}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
                    </div>
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center text-xs font-medium px-2 py-1 rounded-full",
                        trend.isPositive ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
                    )}>
                        {trend.isPositive ? "+" : ""}{trend.value}%
                    </div>
                )}
            </div>
            <div className={cn(
                "absolute bottom-0 left-0 h-1 w-full transition-all duration-300 transform scale-x-0 group-hover:scale-x-100",
                color === 'teal' ? "bg-teal-500" :
                    color === 'blue' ? "bg-blue-500" :
                        color === 'coral' ? "bg-orange-500" : "bg-gray-500"
            )} />
        </Card>
    )
}
