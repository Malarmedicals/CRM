import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell, Calendar as CalendarIcon, Menu, ChevronRight, LogOut } from "lucide-react"
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
import { authService } from "@/features/auth"
import type { User as AppUser } from "@/features/auth/domain/types"

interface DashboardHeaderProps {
    onMenuClick?: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
    const router = useRouter()
    const [userProfile, setUserProfile] = useState<AppUser | null>(null)
    const [loadingLogout, setLoadingLogout] = useState(false)

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const user = await authService.getCurrentUser()
                if (user) {
                    const profile = await authService.getUserProfile(user.id)
                    setUserProfile(profile)
                }
            } catch (error) {
                console.error("Failed to load user profile in header:", error)
            }
        }
        loadProfile()
    }, [])

    const handleLogout = async () => {
        setLoadingLogout(true)
        try {
            await authService.signOut()
            router.push('/')
        } catch (error) {
            console.error('Logout failed:', error)
        } finally {
            setLoadingLogout(false)
        }
    }

    return (
        <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 md:px-6 backdrop-blur-md transition-all">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                <Menu className="h-6 w-6" />
            </Button>
            <div className="flex flex-1 items-center gap-4">
                {/* Search removed */}
            </div>
            <div className="flex items-center gap-3">
                <CalendarPopover />
                <NotificationBell />
                <div className="h-8 w-px bg-slate-200 mx-1" />
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 p-1 hover:bg-slate-50 h-auto">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-medium leading-none text-slate-800">
                                    {userProfile ? userProfile.displayName : "Loading..."}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {userProfile ? userProfile.role : "Malar Medicals"}
                                </p>
                            </div>
                            <Avatar className="h-9 w-9 border border-slate-200 shadow-sm">
                                <AvatarImage src="" alt="Avatar" />
                                <AvatarFallback className="bg-emerald-50 text-emerald-700 font-medium">
                                    {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{userProfile?.displayName || "User"}</p>
                                <p className="text-xs leading-none text-muted-foreground">{userProfile?.email || ""}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} disabled={loadingLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50 cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>{loadingLogout ? "Logging out..." : "Log out"}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
