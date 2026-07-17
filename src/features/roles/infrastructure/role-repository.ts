import { supabase } from '@/lib/supabase/client'
import type { PermissionKey } from '@/lib/constants/permissions'

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: PermissionKey[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ROLES_TABLE = 'roles'

function mapDbRowToRole(doc: any): Role {
  return {
    id: doc.id,
    name: doc.name,
    description: doc.description || '',
    permissions: doc.permissions || [],
    isSystem: doc.is_system === true,
    createdAt: new Date(doc.created_at || Date.now()),
    updatedAt: new Date(doc.updated_at || Date.now()),
  }
}

export const roleRepository = {
  async getAll(): Promise<Role[]> {
    const { data, error } = await supabase.from(ROLES_TABLE).select('*').order('created_at', { ascending: true })
    if (error) throw error
    return data.map(mapDbRowToRole)
  },

  async getByName(name: string): Promise<Role | null> {
    const { data, error } = await supabase.from(ROLES_TABLE).select('*').eq('name', name).single()
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return mapDbRowToRole(data)
  },

  async create(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>): Promise<Role> {
    const { data, error } = await supabase
      .from(ROLES_TABLE)
      .insert({
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        is_system: false,
      })
      .select()
      .single()
    
    if (error) throw error
    return mapDbRowToRole(data)
  },

  async update(id: string, updates: Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>>): Promise<Role> {
    const dbUpdates: any = { updated_at: new Date().toISOString() }
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.permissions !== undefined) dbUpdates.permissions = updates.permissions

    const { data, error } = await supabase
      .from(ROLES_TABLE)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    return mapDbRowToRole(data)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(ROLES_TABLE).delete().eq('id', id)
    if (error) throw error
  }
}
