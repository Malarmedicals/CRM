import { useState, useEffect } from "react"
import { Search, Bell, Calendar as CalendarIcon, Filter, Menu, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarPopover } from "@/components/dashboard/calendar-popover"
import { NotificationBell } from "@/components/notifications/notification-bell"


interface DashboardHeaderProps {
    onMenuClick?: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {

    return (
        <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 md:px-6 backdrop-blur-md transition-all">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                <Menu className="h-6 w-6" />
            </Button>
            <div className="flex flex-1 items-center gap-4">
                {/* Search removed */}
            </div>
            <div className="flex items-center gap-3">
                <CalendarPopover />

                <Button variant="outline" size="icon" className="rounded-xl border-border text-muted-foreground hover:text-foreground">
                    <Filter className="h-4 w-4" />
                </Button>
                <NotificationBell />
                <div className="h-8 w-px bg-border mx-1" />
                <div className="flex items-center gap-2">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium leading-none text-foreground">Admin User</p>
                        <p className="text-xs text-muted-foreground">Malar Medicals</p>
                    </div>
                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                        <AvatarImage src="" alt="Avatar" />
                        <AvatarFallback className="bg-primary/10 text-primary">MM</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </div>
    )
}
