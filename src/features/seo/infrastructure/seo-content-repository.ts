import { supabase } from '@/lib/supabase/client';

export type SeoSectionType = 'prose' | 'bullets';

export interface SeoSection {
  heading: string;
  body_html: string;
  type: SeoSectionType;
}

export interface SeoFaq {
  question: string;
  answer: string;
}

export interface SeoContentBlock {
  id: string;
  page_type: 'homepage' | 'category' | 'subcategory';
  page_slug: string;
  meta_title: string;
  meta_description: string;
  intro_html: string;
  sections: SeoSection[];
  faqs: SeoFaq[];
  created_at: string;
  updated_at: string;
}

export type SeoContentBlockInput = Omit<SeoContentBlock, 'id' | 'created_at' | 'updated_at'>;

const TABLE_NAME = 'seo_content_blocks';

export const seoContentRepository = {
  async getAll(): Promise<SeoContentBlock[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        // Table doesn't exist yet
        return [];
      }
      console.error('Error fetching seo blocks:', error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string): Promise<SeoContentBlock | null> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching seo block:', error);
      throw error;
    }

    return data;
  },

  async getByPage(page_type: string, page_slug: string): Promise<SeoContentBlock | null> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('page_type', page_type)
      .eq('page_slug', page_slug)
      .single();

    if (error && error.code !== 'PGRST116') {
      if (error.code === '42P01') return null; // Table doesn't exist yet
      console.error('Error fetching seo block by page:', error);
      throw error;
    }

    return data;
  },

  async upsert(block: SeoContentBlockInput & { id?: string }): Promise<SeoContentBlock> {
    const payload = {
      ...block,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .upsert(payload, { onConflict: 'page_type,page_slug' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting seo block:', error);
      throw error;
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting seo block:', error);
      throw error;
    }
  }
};
