// Categories Infrastructure Layer
import { supabase } from '@/lib/supabase/client'

const TABLE = 'categories'

export const categoryRepository = {
  async getAll() {
    const { data, error } = await supabase.from(TABLE).select('*')
    if (error) throw error
    return data.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      subcategories: doc.subcategories || [],
      createdAt: new Date(doc.created_at || Date.now()),
    }))
  },

  async insert(name: string): Promise<void> {
    const { error } = await supabase.from(TABLE).insert({ name })
    if (error) throw error
  },

  async addSubcategory(categoryId: string, subcategoryName: string): Promise<void> {
    const { data, error } = await supabase.from(TABLE).select('subcategories').eq('id', categoryId).single()
    if (error) throw error
    const subs = data.subcategories || []
    subs.push(subcategoryName)
    const { error: updateError } = await supabase.from(TABLE).update({ subcategories: subs }).eq('id', categoryId)
    if (updateError) throw updateError
  },
}
