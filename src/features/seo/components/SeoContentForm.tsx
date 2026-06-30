'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { seoContentRepository, type SeoContentBlock, type SeoSection, type SeoFaq } from '../infrastructure/seo-content-repository'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash, Plus, ArrowLeft, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

interface SeoContentFormProps {
  initialData?: SeoContentBlock | null
}

export function SeoContentForm({ initialData }: SeoContentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [pageType, setPageType] = useState(initialData?.page_type || 'homepage')
  const [pageSlug, setPageSlug] = useState(initialData?.page_slug || 'home')
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title || '')
  const [metaDescription, setMetaDescription] = useState(initialData?.meta_description || '')
  const [introHtml, setIntroHtml] = useState(initialData?.intro_html || '')

  const [sections, setSections] = useState<SeoSection[]>(initialData?.sections || [])
  const [faqs, setFaqs] = useState<SeoFaq[]>(initialData?.faqs || [])

  const addSection = () => setSections([...sections, { heading: '', body_html: '', type: 'prose' }])
  const removeSection = (index: number) => setSections(sections.filter((_, i) => i !== index))
  const updateSection = (index: number, field: keyof SeoSection, value: string) => {
    const newSections = [...sections]
    newSections[index] = { ...newSections[index], [field]: value }
    setSections(newSections)
  }

  const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }])
  const removeFaq = (index: number) => setFaqs(faqs.filter((_, i) => i !== index))
  const updateFaq = (index: number, field: keyof SeoFaq, value: string) => {
    const newFaqs = [...faqs]
    newFaqs[index] = { ...newFaqs[index], [field]: value }
    setFaqs(newFaqs)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await seoContentRepository.upsert({
        ...(initialData?.id ? { id: initialData.id } : {}),
        page_type: pageType as any,
        page_slug: pageSlug,
        meta_title: metaTitle,
        meta_description: metaDescription,
        intro_html: introHtml,
        sections,
        faqs
      })
      toast.success('SEO Content Block saved successfully')
      router.push('/dashboard/seo-content')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Failed to save SEO content block')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {initialData ? 'Edit SEO Block' : 'Create SEO Block'}
          </h1>
        </div>
        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Page Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Page Type</Label>
              <Select value={pageType} onValueChange={setPageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homepage">Homepage</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="subcategory">Subcategory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Page Slug</Label>
              <Input 
                value={pageSlug} 
                onChange={(e) => setPageSlug(e.target.value)} 
                placeholder="e.g. home, diabetes-care"
                required
              />
              <p className="text-xs text-muted-foreground">The exact URL slug this applies to.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meta Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Meta Title</Label>
              <Input 
                value={metaTitle} 
                onChange={(e) => setMetaTitle(e.target.value)} 
                placeholder="Buy Medicines Online | Malar Medicals"
              />
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea 
                value={metaDescription} 
                onChange={(e) => setMetaDescription(e.target.value)} 
                placeholder="Brief description for search engines..."
                className="h-20"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Intro Text</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea 
            value={introHtml} 
            onChange={(e) => setIntroHtml(e.target.value)} 
            placeholder="Write 2-4 sentences with inline HTML links <a>..."
            className="min-h-[150px]"
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Content Sections</h2>
          <Button type="button" variant="outline" size="sm" onClick={addSection} className="gap-2">
            <Plus className="h-4 w-4" /> Add Section
          </Button>
        </div>
        {sections.length === 0 && <p className="text-muted-foreground italic text-sm">No sections added yet.</p>}
        {sections.map((section, index) => (
          <Card key={index} className="relative">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              onClick={() => removeSection(index)}
            >
              <Trash className="h-4 w-4" />
            </Button>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">Section {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 space-y-2">
                  <Label>Heading (H2)</Label>
                  <Input 
                    value={section.heading} 
                    onChange={(e) => updateSection(index, 'heading', e.target.value)} 
                    placeholder="e.g. Why choose us?"
                  />
                </div>
                <div className="col-span-1 space-y-2">
                  <Label>Format Type</Label>
                  <Select value={section.type} onValueChange={(val) => updateSection(index, 'type', val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prose">Paragraphs (Prose)</SelectItem>
                      <SelectItem value="bullets">Bullet List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Body Content (HTML/Text)</Label>
                <Textarea 
                  value={section.body_html} 
                  onChange={(e) => updateSection(index, 'body_html', e.target.value)} 
                  placeholder={section.type === 'bullets' ? "<li>Point 1</li>\n<li>Point 2</li>" : "Paragraph text here..."}
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4 border-t pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
            <p className="text-sm text-muted-foreground">Will be wrapped in FAQPage JSON-LD schema automatically.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addFaq} className="gap-2">
            <Plus className="h-4 w-4" /> Add FAQ
          </Button>
        </div>
        {faqs.length === 0 && <p className="text-muted-foreground italic text-sm">No FAQs added yet.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="relative">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 h-8 w-8"
                onClick={() => removeFaq(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Input 
                    value={faq.question} 
                    onChange={(e) => updateFaq(index, 'question', e.target.value)} 
                    placeholder="e.g. Do you offer free shipping?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Answer</Label>
                  <Textarea 
                    value={faq.answer} 
                    onChange={(e) => updateFaq(index, 'answer', e.target.value)} 
                    placeholder="Yes, we offer free shipping on orders over ₹500."
                    className="h-20"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </form>
  )
}
