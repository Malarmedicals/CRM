'use client'

import { useState, useEffect } from 'react'
import { userService } from '@/features/users/user-service'
import { User } from '@/lib/models/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Search,
  UserPlus,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Shield,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Users as UsersIcon,
  UserCheck,
  UserX,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { fixUserRoles } from '@/lib/utils/fix-user-roles'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // Edit user dialog
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editPhone, setEditPhone] = useState('')
  const [editRole, setEditRole] = useState<'admin' | 'manager' | 'customer'>('customer')

  // Delete user dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  // Migration state
  const [isMigrating, setIsMigrating] = useState(false)

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    managers: 0,
    customers: 0,
  })

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
    calculateStats()
  }, [searchTerm, roleFilter, users])

  const safeNormalizeRole = (role: any): 'admin' | 'manager' | 'customer' => {
    if (role == null || role === '') return 'customer'
    if (typeof role !== 'string') {
      try {
        const roleStr = String(role).toLowerCase().trim()
        if (['admin', 'manager', 'customer'].includes(roleStr)) {
          return roleStr as any
        }
      } catch {
        return 'customer'
      }
    }
    const normalized = role.toLowerCase().trim()
    if (['admin', 'manager', 'customer'].includes(normalized)) {
      return normalized as any
    }
    return 'customer'
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await userService.getAllUsers()

      if (!Array.isArray(data)) {
        setUsers([])
        toast.error('Invalid data format received')
        return
      }

      const normalizedUsers = data.map((user) => ({
        ...user,
        email: user.email || '',
        displayName: user.displayName || 'Unknown User',
        role: safeNormalizeRole(user.role),
        isBlocked: user.isBlocked === true,
      })).filter((user): user is User => user !== null)

      setUsers(normalizedUsers)
      toast.success('Users loaded successfully')
    } catch (error: any) {
      console.error('Failed to load users:', error)
      toast.error(error.message || 'Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter((user) =>
        user.displayName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.phoneNumber?.toLowerCase().includes(search)
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    // Sort by role priority, then by name
    filtered.sort((a, b) => {
      const roleOrder: Record<string, number> = { admin: 0, manager: 1, user: 2, customer: 3 }
      const roleCompare = (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99)
      if (roleCompare !== 0) return roleCompare
      return a.displayName.localeCompare(b.displayName)
    })

    setFilteredUsers(filtered)
  }

  const calculateStats = () => {
    setStats({
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      managers: users.filter(u => u.role === 'manager').length,
      customers: users.filter(u => u.role === 'customer').length,
    })
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditPhone(user.phoneNumber || '')
    setEditRole(user.role)
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    try {
      // Update phone if changed
      if (editPhone !== editingUser.phoneNumber) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/
        const cleanPhone = editPhone.replace(/\s|-|\(|\)/g, '')
        const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`

        if (editPhone && !phoneRegex.test(formattedPhone)) {
          toast.error('Invalid phone number format')
          return
        }

        await userService.updateUserPhone(editingUser.id, editPhone ? formattedPhone : '')
      }

      // Update role if changed
      if (editRole !== editingUser.role) {
        await userService.updateUserRole(editingUser.id, editRole)
      }

      toast.success('User updated successfully')
      setShowEditDialog(false)
      await loadUsers()
    } catch (error: any) {
      console.error('Failed to update user:', error)
      toast.error(error.message || 'Failed to update user')
    }
  }



  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      await userService.deleteUser(userToDelete.id)
      toast.success('User deleted successfully')
      setShowDeleteDialog(false)
      setUserToDelete(null)
      await loadUsers()
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      toast.error(error.message || 'Failed to delete user')
    }
  }

  const handleFixRoles = async () => {
    if (isMigrating) return

    const confirmed = window.confirm(
      'This will assign the "customer" role to all users who are missing a role. Continue?'
    )

    if (!confirmed) return

    setIsMigrating(true)
    try {
      const result = await fixUserRoles()
      if (result.success) {
        toast.success(result.message)
        await loadUsers() // Reload users to reflect changes
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      console.error('Migration error:', error)
      toast.error('Migration failed: ' + error.message)
    } finally {
      setIsMigrating(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 border-red-300',
      manager: 'bg-blue-100 text-blue-800 border-blue-300',
      customer: 'bg-purple-100 text-purple-800 border-purple-300',
    }
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getRoleIcon = (role: string) => {
    const icons: Record<string, React.ReactNode> = {
      admin: <Shield className="h-3 w-3" />,
      manager: <UserCheck className="h-3 w-3" />,
      customer: <UsersIcon className="h-3 w-3" />,
    }
    return icons[role] || <UsersIcon className="h-3 w-3" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            👥 User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFixRoles}
            disabled={isMigrating}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            {isMigrating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Fix Missing Roles
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <UsersIcon className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>

        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-red-600" />
            <p className="text-xs text-red-800 font-medium">Admins</p>
          </div>
          <p className="text-2xl font-bold text-red-800">{stats.admins}</p>
        </Card>

        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-blue-800 font-medium">Managers</p>
          </div>
          <p className="text-2xl font-bold text-blue-800">{stats.managers}</p>
        </Card>

        <Card className="p-4 border-purple-200 bg-purple-50">
          <div className="flex items-center gap-2 mb-2">
            <UsersIcon className="h-4 w-4 text-purple-600" />
            <p className="text-xs text-purple-800 font-medium">Customers</p>
          </div>
          <p className="text-2xl font-bold text-purple-800">{stats.customers}</p>
        </Card>


      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2 bg-background border border-input rounded-lg px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 bg-transparent"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users List - Desktop Table & Mobile Cards */}
      <div className="space-y-4">
        {/* Desktop View */}
        <Card className="hidden md:block overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr className="text-left text-xs font-semibold uppercase">
                  <th className="p-4 whitespace-nowrap">User</th>
                  <th className="p-4 whitespace-nowrap">Contact</th>
                  <th className="p-4 whitespace-nowrap">Role</th>
                  <th className="p-4 whitespace-nowrap">Joined</th>
                  <th className="p-4 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-muted/10'
                      } ${user.isBlocked ? 'opacity-50' : ''}`}
                  >
                    {/* User */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-semibold text-primary">
                            {user.displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground truncate max-w-[200px]">
                            {user.email}
                          </span>
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-1 text-xs">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{user.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-4">
                      <Badge className={`${getRoleBadgeColor(user.role)} border text-xs flex items-center gap-1 w-fit`}>
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role}</span>
                      </Badge>
                    </td>

                    {/* Joined Date */}
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                            : 'N/A'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-semibold text-primary">
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{user.displayName}</p>
                    <Badge className={`mt-1 ${getRoleBadgeColor(user.role)} border text-xs flex items-center gap-1 w-fit`}>
                      <span className="capitalize">{user.role}</span>
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Joined on {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-2 border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditUser(user)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-destructive hover:bg-red-50"
                  onClick={() => handleDeleteClick(user)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {filteredUsers.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {users.length === 0 ? 'No users found' : 'No users matching your filters'}
          </p>
        </Card>
      )}

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editingUser.displayName} disabled />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editingUser.email} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+919876543210"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  International format: +91XXXXXXXXXX
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={editRole} onValueChange={(value: any) => setEditRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {userToDelete && (
            <div className="py-4">
              <Card className="p-4 bg-red-50 border-red-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="font-semibold text-red-800">
                      {userToDelete.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-red-900">{userToDelete.displayName}</p>
                    <p className="text-xs text-red-700">{userToDelete.email}</p>
                  </div>
                </div>
              </Card>
              <p className="text-sm text-muted-foreground mt-4">
                ⚠️ This will permanently delete the user account and all associated data.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
