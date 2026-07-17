'use client'

import { useState, useEffect } from 'react'
import { userService } from '@/features/users'
import { roleService, Role } from '@/features/roles'
import type { User } from '@/features/users/domain/types'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Search,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Shield,
  Trash2,
  Edit,
  Users as UsersIcon,
  UserCheck,
  UserMinus,
  Lock,
  Unlock,
  MoreHorizontal,
  UserPlus
} from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // Edit user dialog
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editRole, setEditRole] = useState<string>('')
  const [editStatus, setEditStatus] = useState<string>('active')

  // Delete user dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  // Add user dialog
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addDisplayName, setAddDisplayName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [addRole, setAddRole] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    managers: 0,
    customers: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterUsers()
    calculateStats()
  }, [searchTerm, roleFilter, users])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersData, rolesData] = await Promise.all([
        userService.getAllUsers(),
        roleService.getAllRoles()
      ])

      setRoles(rolesData)
      setUsers(usersData as User[])
    } catch (error: any) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load users or roles')
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter((user) =>
        user.displayName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.phoneNumber?.toLowerCase().includes(search)
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    filtered.sort((a, b) => a.displayName.localeCompare(b.displayName))
    setFilteredUsers(filtered)
  }

  const calculateStats = () => {
    setStats({
      total: users.length,
      active: users.filter(u => !u.isBlocked).length,
      inactive: users.filter(u => u.isBlocked).length,
      admins: users.filter(u => u.role.toLowerCase().includes('admin')).length,
      managers: users.filter(u => u.role.toLowerCase().includes('manager')).length,
      customers: users.filter(u => u.role.toLowerCase() === 'customer').length,
    })
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    const roleExists = roles.some(r => r.name === user.role)
    setEditRole(roleExists ? user.role : '')
    setEditStatus(user.isBlocked ? 'inactive' : 'active')
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    try {
      if (editRole !== editingUser.role) {
        await userService.updateUserRole(editingUser.id, editRole)
      }

      const isBlocked = editStatus === 'inactive'
      if (isBlocked !== editingUser.isBlocked) {
        await userService.toggleBlockUser(editingUser.id, isBlocked)
      }

      toast.success('User updated successfully')
      setShowEditDialog(false)
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user')
    }
  }

  const handleDeleteClick = (user: User) => {
    if (user.role === 'Super Administrator') {
      toast.error('Cannot delete a Super Administrator')
      return
    }
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
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user')
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addEmail || !addPassword || !addDisplayName || !addRole) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      setAddLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          email: addEmail,
          password: addPassword,
          displayName: addDisplayName,
          role: addRole
        })
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      toast.success('User created successfully')
      setShowAddDialog(false)
      // Reset form
      setAddDisplayName('')
      setAddEmail('')
      setAddPassword('')
      setAddRole('')
      await loadData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setAddLoading(false)
    }
  }

  const handleResetPassword = async (user: User) => {
    // In a real app, this would trigger a password reset email via supabase auth
    toast.info(`Password reset email would be sent to ${user.email}`)
  }

  const getRoleBadgeStyle = (roleName: string) => {
    const role = roleName.toLowerCase()
    if (role.includes('admin')) return 'bg-purple-100 text-purple-800 border-purple-200'
    if (role.includes('manager')) return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    if (role === 'customer') return 'bg-slate-100 text-slate-800 border-slate-200'
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900">
            User Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage users, assign enterprise roles, and control access.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium mb-1">Total Users</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </Card>
        <Card className="p-4 shadow-sm border-emerald-200 bg-emerald-50/50">
          <p className="text-xs text-emerald-600 font-medium mb-1">Active</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
        </Card>
        <Card className="p-4 shadow-sm border-red-200 bg-red-50/50">
          <p className="text-xs text-red-600 font-medium mb-1">Inactive</p>
          <p className="text-2xl font-bold text-red-700">{stats.inactive}</p>
        </Card>
        <Card className="p-4 shadow-sm border-purple-200 bg-purple-50/50">
          <p className="text-xs text-purple-600 font-medium mb-1">Admins</p>
          <p className="text-2xl font-bold text-purple-700">{stats.admins}</p>
        </Card>
        <Card className="p-4 shadow-sm border-indigo-200 bg-indigo-50/50">
          <p className="text-xs text-indigo-600 font-medium mb-1">Managers</p>
          <p className="text-2xl font-bold text-indigo-700">{stats.managers}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium mb-1">Customers</p>
          <p className="text-2xl font-bold text-slate-900">{stats.customers}</p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200"
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="bg-slate-50 border-slate-200">
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map(r => (
                <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.displayName}</p>
                          <p className="text-xs text-slate-500">{user.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`${getRoleBadgeStyle(user.role)}`}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {user.isBlocked ? (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-red-100 text-red-700">
                          <Lock className="h-3 w-3" /> Inactive
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
                          <Unlock className="h-3 w-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {user.email}
                      </div>
                      {user.phoneNumber && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {user.phoneNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                            <Mail className="h-4 w-4 mr-2" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(user)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>
              Modify user roles and access status.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-500">Name</Label>
                  <p className="font-medium">{editingUser.displayName}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-500">Email</Label>
                  <p className="font-medium text-sm truncate">{editingUser.email}</p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="role">Assigned Role</Label>
                <Select value={editRole || undefined} onValueChange={setEditRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Changing the role immediately updates the user's permissions.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="status">Account Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Can Login)</SelectItem>
                    <SelectItem value="inactive">Inactive (Blocked)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-indigo-600 hover:bg-indigo-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete User Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.displayName}</strong>? This action cannot be undone and will remove all their access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account and assign their role.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddUser} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Display Name</Label>
              <Input
                id="add-name"
                placeholder="John Doe"
                value={addDisplayName}
                onChange={(e) => setAddDisplayName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                placeholder="john@example.com"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                type="password"
                placeholder="Create a strong password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-role">Role</Label>
              <Select value={addRole || undefined} onValueChange={setAddRole} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addLoading} className="bg-indigo-600 hover:bg-indigo-700">
                {addLoading ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
