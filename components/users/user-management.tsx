'use client'

import { useState, useEffect } from 'react'
import { userService } from '@/lib/services/user-service'
import { User } from '@/lib/models/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Lock, Unlock } from 'lucide-react'

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    const filtered = users.filter((user) =>
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers()
      setUsers(data)
    } catch (error) {
      console.error('Failed to load users:', error)
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="text-left">
              <th className="pb-3 font-semibold">Name</th>
              <th className="pb-3 font-semibold">Email</th>
              <th className="pb-3 font-semibold">Role</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                <td className="py-4">{user.displayName}</td>
                <td className="py-4">{user.email}</td>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No users found</p>
        </Card>
      )}
    </div>
  )
}
