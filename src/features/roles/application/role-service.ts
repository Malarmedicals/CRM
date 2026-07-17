import { roleRepository, Role } from '../infrastructure/role-repository'

export const roleService = {
  async getAllRoles(): Promise<Role[]> {
    return roleRepository.getAll()
  },

  async getRoleByName(name: string): Promise<Role | null> {
    return roleRepository.getByName(name)
  },

  async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>): Promise<Role> {
    return roleRepository.create(role)
  },

  async updateRole(id: string, updates: Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>>): Promise<Role> {
    return roleRepository.update(id, updates)
  },

  async deleteRole(id: string, role: Role): Promise<void> {
    if (role.isSystem) {
      throw new Error('Cannot delete a system protected role')
    }
    return roleRepository.delete(id)
  }
}
