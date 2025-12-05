'use client'

import { useState, useEffect } from 'react'
import { userService } from '@/lib/services/user-service'
import { User } from '@/lib/models/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Lock, Unlock, Phone, Edit2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [updating, setUpdating] = useState(false)

  // Helper function to safely normalize role (must be defined before use)
  // This function NEVER throws an error, always returns a valid role
  const safeNormalizeRole = (role: any): 'admin' | 'manager' | 'user' => {
    try {
      // Handle null, undefined, or empty values
      if (role == null || role === '') {
        return 'user'
      }
      
      // Ensure it's a string before calling toLowerCase
      if (typeof role !== 'string') {
        // Try to convert to string if it's not already
        try {
          const roleStr = String(role)
          if (!roleStr || roleStr === 'null' || roleStr === 'undefined' || typeof roleStr !== 'string') {
            return 'user'
          }
          // Double-check it's a string before toLowerCase
          if (typeof roleStr.toLowerCase !== 'function') {
            return 'user'
          }
          const normalized = roleStr.toLowerCase().trim()
          if (normalized === 'admin' || normalized === 'manager' || normalized === 'user') {
            return normalized as 'admin' | 'manager' | 'user'
          }
        } catch (err) {
          console.warn('[DEBUG] Error converting role to string:', err, role)
          return 'user'
        }
        return 'user'
      }
      
      // It's a string, but verify toLowerCase exists before calling
      if (typeof role.toLowerCase !== 'function') {
        console.warn('[DEBUG] role.toLowerCase is not a function:', role)
        return 'user'
      }
      
      try {
        const normalized = role.toLowerCase().trim()
        if (normalized === 'admin' || normalized === 'manager' || normalized === 'user') {
          return normalized as 'admin' | 'manager' | 'user'
        }
      } catch (err) {
        console.warn('[DEBUG] Error calling toLowerCase on role:', err, role)
        return 'user'
      }
      
      return 'user'
    } catch (error) {
      // If ANY error occurs, return 'user' as safe default
      console.warn('[DEBUG] Error in safeNormalizeRole:', error, 'role:', role)
      return 'user'
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    // Ensure users is an array before filtering
    if (!Array.isArray(users)) {
      console.warn('[DEBUG] users is not an array:', typeof users, users)
      setFilteredUsers([])
      return
    }
    
    // Safely get search term - ensure it's always a string
    let searchLower = ''
    try {
      if (searchTerm != null && typeof searchTerm === 'string') {
        searchLower = searchTerm.toLowerCase().trim()
      } else if (searchTerm != null) {
        searchLower = String(searchTerm).toLowerCase().trim()
      }
    } catch (err) {
      console.warn('[DEBUG] Error processing search term:', err)
      searchLower = ''
    }
    const filtered = users
      .filter((user) => {
        // Skip if user is null/undefined
        if (!user || typeof user !== 'object') {
          return false
        }
        
        try {
          // Helper to safely convert to lowercase string
          const safeToLower = (value: any): string => {
            try {
              if (value == null || value === undefined) return ''
              // Double-check it's not already a problem
              if (typeof value === 'string') {
                return value.toLowerCase()
              }
              const str = String(value)
              // Ensure String() didn't return something weird
              if (typeof str !== 'string') return ''
              return str.toLowerCase()
            } catch (err) {
              console.warn('[DEBUG] safeToLower error:', err, 'value:', value)
              return ''
            }
          }
          
          // Safely get display name and email
          const displayName = safeToLower(user.displayName)
          const email = safeToLower(user.email)
          // Use the safe helper function for role
          const role = safeNormalizeRole(user.role)
          
          // Ensure all values are strings before calling includes
          const safeIncludes = (str: any, search: string): boolean => {
            try {
              if (str == null || typeof str !== 'string') return false
              return str.includes(search)
            } catch {
              return false
            }
          }
          
          // Search in name, email, and role
          return safeIncludes(displayName, searchLower) || 
                 safeIncludes(email, searchLower) || 
                 safeIncludes(role, searchLower)
        } catch (error) {
          // If any error occurs, log it and exclude this user from results
          console.warn('[DEBUG] Error filtering user:', error, user)
          return false
        }
      })
      // Sort by role: admin first, then manager, then user
      .sort((a, b) => {
        if (!a || !b) return 0
        try {
          const roleOrder: Record<string, number> = { admin: 0, manager: 1, user: 2 }
          const roleA = safeNormalizeRole(a.role)
          const roleB = safeNormalizeRole(b.role)
          return (roleOrder[roleA] ?? 99) - (roleOrder[roleB] ?? 99)
        } catch (error) {
          console.warn('[DEBUG] Error sorting users:', error)
          return 0
        }
      })
    
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const loadUsers = async () => {
    try {
      setError(null)
      const data = await userService.getAllUsers()
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('[DEBUG] getAllUsers did not return an array:', typeof data, data)
        setUsers([])
        setError('Invalid data format received')
        return
      }
      
      // Ensure all users have required fields with defaults and normalize role
      const normalizedUsers = data.map((user) => {
        if (!user) {
          console.warn('[DEBUG] Found null/undefined user in data')
          return null
        }
        
        // Safely normalize role
        const normalizedRole = safeNormalizeRole(user.role)
        
        // Debug log if role was missing or invalid
        if (!user.role || typeof user.role !== 'string') {
          console.warn(`[DEBUG] User ${user.id} has missing or invalid role:`, {
            userId: user.id,
            email: user.email,
            role: user.role || 'MISSING',
            normalizedRole
          })
        }
        
        return {
          ...user,
          email: user.email && typeof user.email === 'string' ? user.email : '',
          displayName: user.displayName && typeof user.displayName === 'string' ? user.displayName : 'Unknown User',
          role: normalizedRole,
          isBlocked: user.isBlocked === true,
        }
      }).filter((user): user is User => user !== null)
      
      setUsers(normalizedUsers)
    } catch (error: any) {
      console.error('Failed to load users:', error)
      setError(error.message || 'Failed to load users')
      setUsers([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleBlockToggle = async (userId: string, isBlocked: boolean) => {
    try {
      await userService.toggleBlockUser(userId, !isBlocked)
      setUsers(users.map((user) =>
        user.id === userId ? { ...user, isBlocked: !isBlocked } : user
      ))
    } catch (error) {
      console.error('Failed to toggle block status:', error)
    }
  }

  const handleEditPhone = (user: User) => {
    setEditingUser(user)
    setPhoneNumber(user.phoneNumber || '')
  }

  const handleUpdatePhone = async () => {
    if (!editingUser) return

    setUpdating(true)
    try {
      // Validate phone number format
      const phoneRegex = /^\+?[1-9]\d{1,14}$/
      const cleanPhone = phoneNumber.replace(/\s|-|\(|\)/g, '')
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`

      if (phoneNumber && !phoneRegex.test(formattedPhone)) {
        setError('Invalid phone number format. Use international format: +1234567890')
        setUpdating(false)
        return
      }

      await userService.updateUserPhone(editingUser.id, phoneNumber ? formattedPhone : '')
      setUsers(users.map((user) =>
        user.id === editingUser.id ? { ...user, phoneNumber: phoneNumber ? formattedPhone : undefined } : user
      ))
      setEditingUser(null)
      setPhoneNumber('')
      setError(null)
    } catch (error: any) {
      console.error('Failed to update phone number:', error)
      setError(error.message || 'Failed to update phone number')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">Manage customer and user accounts</p>
      </div>

      <div className="flex items-center gap-2 bg-background border border-input rounded-lg px-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 bg-transparent"
        />
      </div>

      {loading && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading users...</p>
        </Card>
      )}

      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left">
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Phone</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                <td className="py-4">{user.displayName || 'N/A'}</td>
                <td className="py-4">{user.email || 'N/A'}</td>
                <td className="py-4">
                  {user.phoneNumber ? (
                    <span className="text-sm">{user.phoneNumber}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm italic">Not set</span>
                  )}
                </td>
                <td className="py-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                    {user.role}
                  </span>
                </td>
                <td className="py-4">
                  {user.isBlocked ? (
                    <span className="text-red-600 font-medium">Blocked</span>
                  ) : (
                    <span className="text-green-600 font-medium">Active</span>
                  )}
                </td>
                <td className="py-4">
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPhone(user)}
                          className="gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {user.phoneNumber ? 'Edit' : 'Add'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Phone Number</DialogTitle>
                          <DialogDescription>
                            Add or update phone number for {user.displayName || user.email}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              placeholder="+919876543210"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              disabled={updating}
                            />
                            <p className="text-xs text-muted-foreground">
                              Use international format: +91XXXXXXXXXX (India) or +1234567890 (required for WhatsApp notifications)
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              India example: +919876543210 (10 digits after +91)
                            </p>
                          </div>
                          {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                              <p className="text-sm text-destructive">{error}</p>
                            </div>
                          )}
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingUser(null)
                                setPhoneNumber('')
                                setError(null)
                              }}
                              disabled={updating}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleUpdatePhone} disabled={updating} className="gap-2">
                              {updating ? 'Updating...' : 'Update Phone'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBlockToggle(user.id, user.isBlocked)}
                      className="gap-2"
                    >
                      {user.isBlocked ? (
                        <>
                          <Unlock className="h-3 w-3" />
                          Unblock
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" />
                          Block
                        </>
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <Card className="p-8 text-center border-destructive">
          <p className="text-destructive font-medium">{error}</p>
          {error.includes('permissions') || error.includes('Insufficient') ? (
            <p className="text-muted-foreground mt-2 text-sm">
              You need admin or manager role to view users.
            </p>
          ) : null}
        </Card>
      )}

      {filteredUsers.length === 0 && !loading && !error && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {users.length === 0 ? 'No users are there yet' : 'No users found matching your search'}
          </p>
        </Card>
      )}
    </div>
  )
}
