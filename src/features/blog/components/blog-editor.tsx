'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RichTextEditor } from './rich-text-editor'
import { blogRepository } from '@/features/blog/infrastructure/blog-repository'
import type { BlogPost, BlogCategory } from '@/features/blog/domain/types'
import { ArrowLeft, Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'

interface BlogEditorProps {
  initialData?: BlogPost
}

export function BlogEditor({ initialData }: BlogEditorProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    excerpt: initialData?.excerpt || '',
    content: initialData?.content || '',
    categoryId: initialData?.categoryId || '',
    featuredImage: initialData?.featuredImage || '',
    featuredImageAlt: initialData?.featuredImageAlt || '',
    status: initialData?.status || 'draft',
    seoTitle: initialData?.seoTitle || '',
    metaDescription: initialData?.metaDescription || '',
    focusKeyword: initialData?.focusKeyword || '',
    canonicalUrl: initialData?.canonicalUrl || '',
  })

  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await blogRepository.getAllCategories()
      setCategories(cats)
    }
    fetchCategories()
  }, [])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      if (field === 'title' && !initialData) {
        updated.slug = (value as string).toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }
      return updated
    })
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      if (!formData.title || !formData.slug) {
        alert('Title and Slug are required')
        return
      }

      if (initialData) {
        await blogRepository.updatePost(initialData.id, formData)
      } else {
        const newId = await blogRepository.insertPost(formData)
        router.push(`/dashboard/blog/edit/${newId}`)
        return
      }
      alert('Saved successfully!')
      router.push('/dashboard/blog')
    } catch (error: any) {
      console.error('Save failed', error)
      alert('Error saving post: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // SEO Score calculation
  const seoScore = useMemo(() => {
    let score = 0
    let checks = []
    
    if (formData.seoTitle && formData.seoTitle.length > 30) { score += 20; checks.push({ msg: 'SEO Title length is good', pass: true }) }
    else { checks.push({ msg: 'SEO Title missing or too short', pass: false }) }

    if (formData.metaDescription && formData.metaDescription.length > 100) { score += 20; checks.push({ msg: 'Meta description length is good', pass: true }) }
    else { checks.push({ msg: 'Meta description missing or too short', pass: false }) }

    if (formData.focusKeyword) {
      score += 20
      checks.push({ msg: 'Focus keyword set', pass: true })
      
      if (formData.seoTitle?.toLowerCase().includes(formData.focusKeyword.toLowerCase())) {
        score += 15; checks.push({ msg: 'Keyword in SEO title', pass: true })
      } else { checks.push({ msg: 'Keyword not in SEO title', pass: false }) }

      if (formData.content?.toLowerCase().includes(formData.focusKeyword.toLowerCase())) {
        score += 15; checks.push({ msg: 'Keyword in content', pass: true })
      } else { checks.push({ msg: 'Keyword not in content', pass: false }) }
    } else {
      checks.push({ msg: 'Focus keyword not set', pass: false })
      checks.push({ msg: 'Keyword in SEO title', pass: false })
      checks.push({ msg: 'Keyword in content', pass: false })
    }

    if (formData.featuredImage) { score += 10; checks.push({ msg: 'Featured image set', pass: true }) }
    else { checks.push({ msg: 'Featured image missing', pass: false }) }

    return { score, checks }
  }, [formData])

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/blog')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex-1">{initialData ? 'Edit Article' : 'Create Article'}</h1>
          <Button onClick={handleSave} disabled={loading} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="bg-white border w-full justify-start h-auto p-1">
            <TabsTrigger value="content" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">Content</TabsTrigger>
            <TabsTrigger value="seo" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">SEO & Metadata</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-6 mt-6">
            <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold text-slate-900">Title</Label>
                <Input 
                  value={formData.title} 
                  onChange={e => handleChange('title', e.target.value)} 
                  placeholder="e.g. How to Build a Healthy Daily Routine" 
                  className="text-lg py-6"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold text-slate-900">Content</Label>
                <RichTextEditor 
                  value={formData.content} 
                  onChange={html => handleChange('content', html)} 
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Article Excerpt</h3>
              <p className="text-sm text-slate-500">A short summary of the article. Used in blog listings.</p>
              <Textarea 
                value={formData.excerpt}
                onChange={e => handleChange('excerpt', e.target.value)}
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Search Engine Optimization</h3>
                <div className="space-y-2">
                  <Label>SEO Title</Label>
                  <Input 
                    value={formData.seoTitle} 
                    onChange={e => handleChange('seoTitle', e.target.value)} 
                  />
                  <p className="text-xs text-slate-500 text-right">{formData.seoTitle.length} / 60 characters</p>
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea 
                    value={formData.metaDescription} 
                    onChange={e => handleChange('metaDescription', e.target.value)} 
                    rows={3}
                  />
                  <p className="text-xs text-slate-500 text-right">{formData.metaDescription.length} / 160 characters</p>
                </div>
                <div className="space-y-2">
                  <Label>Focus Keyword</Label>
                  <Input 
                    value={formData.focusKeyword} 
                    onChange={e => handleChange('focusKeyword', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Canonical URL</Label>
                  <Input 
                    value={formData.canonicalUrl} 
                    onChange={e => handleChange('canonicalUrl', e.target.value)} 
                    placeholder="https://example.com/blog/..."
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">SEO Quality Score</h3>
                <div className="flex items-center gap-4 py-4">
                  <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-8 border-slate-100">
                    <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
                      <circle cx="50%" cy="50%" r="40%" fill="none" strokeWidth="8" stroke={seoScore.score >= 80 ? '#10b981' : seoScore.score >= 50 ? '#f59e0b' : '#ef4444'} strokeDasharray={`${(seoScore.score / 100) * 251} 251`} className="transition-all duration-1000" />
                    </svg>
                    <span className="text-2xl font-bold">{seoScore.score}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">
                      {seoScore.score >= 80 ? 'Excellent' : seoScore.score >= 50 ? 'Needs Improvement' : 'Poor'}
                    </h4>
                    <p className="text-sm text-slate-500">Optimize your content for better rankings.</p>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  {seoScore.checks.map((check, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      {check.pass ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      )}
                      <span className={check.pass ? 'text-slate-700' : 'text-slate-500'}>{check.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-white p-5 rounded-lg border shadow-sm space-y-4">
          <h3 className="font-semibold border-b pb-2">Publish Settings</h3>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>URL Slug</Label>
            <Input 
              value={formData.slug} 
              onChange={e => handleChange('slug', e.target.value)} 
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm space-y-4">
          <h3 className="font-semibold border-b pb-2">Organization</h3>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={formData.categoryId || ''} onValueChange={(v) => handleChange('categoryId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm space-y-4">
          <h3 className="font-semibold border-b pb-2">Featured Image</h3>
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input 
              value={formData.featuredImage} 
              onChange={e => handleChange('featuredImage', e.target.value)} 
              placeholder="https://..."
            />
          </div>
          {formData.featuredImage && (
            <img src={formData.featuredImage} alt="Preview" className="w-full h-auto rounded border" />
          )}
          <div className="space-y-2">
            <Label>Image Alt Text</Label>
            <Input 
              value={formData.featuredImageAlt} 
              onChange={e => handleChange('featuredImageAlt', e.target.value)} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}
