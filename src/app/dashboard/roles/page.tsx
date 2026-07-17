'use client'

import { useState, useEffect } from 'react'
import { roleService, Role } from '@/features/roles'
import { PERMISSION_MODULES, PERMISSIONS, PermissionKey, getAllPermissions } from '@/lib/constants/permissions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Search, Edit2, Trash2, Shield, Lock, ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react'
import { toast } from 'sonner'

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Editor State
  const [showEditor, setShowEditor] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPermissions, setEditPermissions] = useState<PermissionKey[]>([])
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

  // Delete State
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

  useEffect(() => {
    loadRoles()
    // Expand all modules by default
    const defaultExpanded = PERMISSION_MODULES.reduce((acc, mod) => {
      acc[mod] = true
      return acc
    }, {} as Record<string, boolean>)
    setExpandedModules(defaultExpanded)
  }, [])

  const loadRoles = async () => {
    try {
      setLoading(true)
      const data = await roleService.getAllRoles()
      setRoles(data)
    } catch (error: any) {
      toast.error('Failed to load roles: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEditor = (role?: Role) => {
    if (role) {
      if (role.isSystem) {
        toast.warning('System roles can only be partially edited.')
      }
      setEditingRole(role)
      setEditName(role.name)
      setEditDescription(role.description)
      setEditPermissions(role.permissions)
    } else {
      setEditingRole(null)
      setEditName('')
      setEditDescription('')
      setEditPermissions([])
    }
    setShowEditor(true)
  }

  const handleSaveRole = async () => {
    if (!editName.trim()) {
      toast.error('Role name is required')
      return
    }

    try {
      if (editingRole) {
        if (editingRole.isSystem) {
          // Only allow updating description and permissions for system roles (if allowed by business logic)
          await roleService.updateRole(editingRole.id, {
            description: editDescription,
            permissions: editPermissions
          })
        } else {
          await roleService.updateRole(editingRole.id, {
            name: editName,
            description: editDescription,
            permissions: editPermissions
          })
        }
        toast.success('Role updated successfully')
      } else {
        await roleService.createRole({
          name: editName,
          description: editDescription,
          permissions: editPermissions
        })
        toast.success('Role created successfully')
      }
      setShowEditor(false)
      loadRoles()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save role')
    }
  }

  const handleDeleteClick = (role: Role) => {
    if (role.isSystem) {
      toast.error('System protected roles cannot be deleted.')
      return
    }
    setRoleToDelete(role)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return
    try {
      await roleService.deleteRole(roleToDelete.id, roleToDelete)
      toast.success('Role deleted successfully')
      setShowDeleteDialog(false)
      loadRoles()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete role')
    }
  }

  const togglePermission = (perm: PermissionKey) => {
    if (editPermissions.includes(perm)) {
      setEditPermissions(prev => prev.filter(p => p !== perm))
    } else {
      setEditPermissions(prev => [...prev, perm])
    }
  }

  const toggleModuleExpanded = (mod: string) => {
    setExpandedModules(prev => ({ ...prev, [mod]: !prev[mod] }))
  }

  const selectAllInModule = (mod: keyof typeof PERMISSIONS) => {
    const actions = PERMISSIONS[mod]
    const permsToAdd = actions.map(a => `${mod}.${a}` as PermissionKey)
    const newPerms = Array.from(new Set([...editPermissions, ...permsToAdd]))
    setEditPermissions(newPerms)
  }

  const clearAllInModule = (mod: keyof typeof PERMISSIONS) => {
    const actions = PERMISSIONS[mod]
    const permsToRemove = actions.map(a => `${mod}.${a}` as PermissionKey)
    const newPerms = editPermissions.filter(p => !permsToRemove.includes(p))
    setEditPermissions(newPerms)
  }

  const selectAll = () => setEditPermissions(getAllPermissions() as PermissionKey[])
  const clearAll = () => setEditPermissions([])

  const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.description.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900">
            <Shield className="h-8 w-8 text-indigo-600" />
            Roles & Permissions
          </h1>
          <p className="text-slate-500 mt-1">
            Manage enterprise role-based access control and system permissions.
          </p>
        </div>
        <Button onClick={() => handleOpenEditor()} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Roles List */}
        <Card className="lg:col-span-1 shadow-sm flex flex-col max-h-[800px]">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading roles...</div>
            ) : filteredRoles.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No roles found</div>
            ) : (
              <div className="space-y-1">
                {filteredRoles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => handleOpenEditor(role)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 border-2 ${
                      editingRole?.id === role.id
                        ? 'border-indigo-600 bg-indigo-50/50'
                        : 'border-transparent hover:bg-slate-50 hover:border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        {role.name}
                        {role.isSystem && <Lock className="h-3 w-3 text-slate-400" />}
                      </h3>
                      <Badge variant="secondary" className="bg-white">{role.permissions.length} perms</Badge>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2">{role.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Role Editor */}
        <Card className="lg:col-span-2 shadow-sm min-h-[600px] flex flex-col bg-white">
          {!showEditor ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
              <Shield className="h-16 w-16 mb-4 opacity-20" />
              <h2 className="text-xl font-medium text-slate-600">No Role Selected</h2>
              <p className="text-sm mt-2 text-center max-w-md">
                Select a role from the list to view or edit its permissions, or create a new role to grant custom access to modules.
              </p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingRole ? 'Edit Role' : 'Create New Role'}
                  </h2>
                  {editingRole?.isSystem && (
                    <p className="text-sm text-orange-600 mt-1 flex items-center gap-1 font-medium">
                      <Lock className="h-4 w-4" /> System protected role. Name cannot be changed.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
                  <Button onClick={handleSaveRole} className="bg-indigo-600 hover:bg-indigo-700">Save Role</Button>
                </div>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="roleName" className="font-semibold text-slate-700">Role Name</Label>
                    <Input
                      id="roleName"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={editingRole?.isSystem}
                      className="bg-slate-50"
                      placeholder="e.g. Content Reviewer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleDesc" className="font-semibold text-slate-700">Description</Label>
                    <Input
                      id="roleDesc"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="bg-slate-50"
                      placeholder="What does this role do?"
                    />
                  </div>
                </div>

                {/* Permissions matrix */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900">Module Permissions</h3>
                      <p className="text-sm text-slate-500">Fine-tune access for this role.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={selectAll} className="text-xs">
                        <CheckSquare className="h-3 w-3 mr-1" /> Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearAll} className="text-xs">
                        <Square className="h-3 w-3 mr-1" /> Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {PERMISSION_MODULES.map(module => {
                      const actions = PERMISSIONS[module]
                      const isExpanded = expandedModules[module]
                      const modulePerms = actions.map(a => `${module}.${a}` as PermissionKey)
                      const selectedCount = modulePerms.filter(p => editPermissions.includes(p)).length
                      const isAllSelected = selectedCount === modulePerms.length

                      return (
                        <Card key={module} className="border border-slate-200 overflow-hidden">
                          <div 
                            className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => toggleModuleExpanded(module)}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                              <span className="font-semibold capitalize text-slate-700">{module}</span>
                              <Badge variant="secondary" className="text-[10px] h-5 bg-white">{selectedCount}/{modulePerms.length}</Badge>
                            </div>
                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                onClick={() => isAllSelected ? clearAllInModule(module) : selectAllInModule(module)}
                              >
                                {isAllSelected ? 'Clear' : 'All'}
                              </Button>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="p-4 grid grid-cols-2 gap-3 bg-white">
                              {actions.map(action => {
                                const permKey = `${module}.${action}` as PermissionKey
                                return (
                                  <div key={permKey} className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={permKey} 
                                      checked={editPermissions.includes(permKey)}
                                      onCheckedChange={() => togglePermission(permKey)}
                                    />
                                    <Label 
                                      htmlFor={permKey} 
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize text-slate-600 cursor-pointer"
                                    >
                                      {action.replace('_', ' ')}
                                    </Label>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                </div>

                {editingRole && !editingRole.isSystem && (
                  <div className="pt-8 border-t flex justify-end">
                    <Button 
                      variant="destructive" 
                      onClick={() => handleDeleteClick(editingRole)}
                      className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Role
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the <strong>{roleToDelete?.name}</strong> role? This action cannot be undone. Users with this role may lose access to the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
