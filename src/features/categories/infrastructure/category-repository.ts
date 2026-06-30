// Categories Infrastructure Layer
import { supabase } from '@/lib/supabase/client'

const TABLE = 'categories'

export const categoryRepository = {
  async getAll() {
    const { data, error } = await supabase.from(TABLE).select('*')
    if (error) throw error
    return data.map((doc: any) => {
      const normalizedSubs = (doc.subcategories || []).map((sub: any) => {
        if (typeof sub === 'string') return sub;
        if (sub && typeof sub === 'object' && sub.name) return sub.name;
        return String(sub);
      });
      return {
        id: doc.id,
        name: doc.name,
        subcategories: normalizedSubs,
        createdAt: new Date(doc.created_at || Date.now()),
      };
    })
  },

  async insert(name: string): Promise<void> {
    const { error } = await supabase.from(TABLE).insert({ name })
    if (error) throw error
  },

  async addSubcategory(categoryId: string, subcategoryName: string): Promise<void> {
    const { data, error } = await supabase.from(TABLE).select('subcategories').eq('id', categoryId).single()
    if (error) throw error
    const subs = data.subcategories || []
    if (!subs.includes(subcategoryName)) {
      subs.push(subcategoryName)
      const { error: updateError } = await supabase.from(TABLE).update({ subcategories: subs }).eq('id', categoryId)
      if (updateError) throw updateError
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) throw error
  },

  async update(id: string, name: string): Promise<void> {
    const { error } = await supabase.from(TABLE).update({ name }).eq('id', id)
    if (error) throw error
  },

  async removeSubcategory(categoryId: string, subcategoryName: string): Promise<void> {
    const { data, error } = await supabase.from(TABLE).select('subcategories').eq('id', categoryId).single()
    if (error) throw error
    const subs = data.subcategories || []
    const updatedSubs = subs.filter((sub: string) => sub !== subcategoryName)
    const { error: updateError } = await supabase.from(TABLE).update({ subcategories: updatedSubs }).eq('id', categoryId)
    if (updateError) throw updateError
  },

  async updateSubcategory(categoryId: string, oldName: string, newName: string): Promise<void> {
    const { data, error } = await supabase.from(TABLE).select('subcategories').eq('id', categoryId).single()
    if (error) throw error
    const subs = data.subcategories || []
    const updatedSubs = subs.map((sub: string) => sub === oldName ? newName : sub)
    const { error: updateError } = await supabase.from(TABLE).update({ subcategories: updatedSubs }).eq('id', categoryId)
    if (updateError) throw updateError
  },
}
