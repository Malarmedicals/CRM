'use client'

import React, { useState, useRef } from 'react'
import Papa from 'papaparse'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Download, Upload, AlertCircle, CheckCircle2, FileUp, XCircle } from 'lucide-react'
import { productService } from './application/product-service'

interface BulkImportModalProps {
  onClose: () => void
  onSuccess: () => void
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'summary'

interface ValidationResult {
  row: number
  data: any
  errors: string[]
  warnings: string[]
  mappedProduct?: any
}

const TEMPLATE_HEADERS = [
  'Product Name', 'Description', 'Category', 'Subcategory', 'Brand',
  'MRP', 'Selling Price', 'Stock Quantity', 'Minimum Stock', 'Batch Number', 'Expiry Date',
  'Composition', 'Dosage Form', 'Strength', 'Indications', 'Side Effects', 'Contraindications', 'Storage Instructions',
  'Prescription Required', 'Narcotic', 'Schedule Type',
  'Weight', 'Dimensions', 'Shipping Class',
  'Meta Title', 'Meta Description', 'Keywords'
]

const SAMPLE_ROW = [
  'Paracetamol 500mg', 'Used for fever and pain relief', 'Medicines', 'Fever', 'Cipla',
  '50', '45', '100', '10', 'B2025-01', '2026-12-31',
  'Paracetamol IP 500mg', 'Tablet', '500mg', 'Fever, Mild pain', 'Nausea, Rash', 'Liver disease', 'Store in a cool, dry place',
  'No', 'No', 'OTC',
  '50g', '10x5x2 cm', 'Standard',
  'Buy Paracetamol 500mg Online', 'Get fast relief from fever with Paracetamol 500mg.', 'paracetamol, fever, painkiller'
]

export function BulkImportModal({ onClose, onSuccess }: BulkImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [summary, setSummary] = useState({ success: 0, failed: 0, errors: [] as any[] })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const csvContent = Papa.unparse([TEMPLATE_HEADERS, SAMPLE_ROW])
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'product_import_template.csv'
    link.click()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseAndValidateCSV(selectedFile)
    }
  }

  const parseBoolean = (val: string) => {
    if (!val) return false
    const lower = val.toLowerCase().trim()
    return ['yes', 'true', '1', 'y'].includes(lower)
  }

  const parseAndValidateCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validated: ValidationResult[] = results.data.map((row: any, index: number) => {
          const errors: string[] = []
          const warnings: string[] = []

          // Basic Validation
          if (!row['Product Name']) errors.push('Missing Product Name')
          
          const mrp = parseFloat(row['MRP'])
          const sellingPrice = parseFloat(row['Selling Price'])
          if (isNaN(mrp)) errors.push('Invalid MRP')
          if (isNaN(sellingPrice)) errors.push('Invalid Selling Price')

          const stock = parseInt(row['Stock Quantity'])
          if (isNaN(stock)) warnings.push('Invalid Stock Quantity, defaults to 0')

          const mappedProduct = {
            name: row['Product Name']?.trim(),
            description: row['Description']?.trim(),
            category: row['Category']?.trim() || 'Uncategorized',
            subcategory: row['Subcategory']?.trim(),
            brandName: row['Brand']?.trim(),
            price: isNaN(mrp) ? 0 : mrp,
            mrp: isNaN(mrp) ? 0 : mrp,
            discount: isNaN(sellingPrice) ? 0 : sellingPrice,
            stockQuantity: isNaN(stock) ? 0 : stock,
            minStockLevel: parseInt(row['Minimum Stock']) || 10,
            batchNumber: row['Batch Number']?.trim(),
            expiryDate: row['Expiry Date'] ? new Date(row['Expiry Date']).toISOString() : undefined,
            status: 'published',
            medicalInfo: {
              composition: row['Composition']?.trim(),
              dosageForm: row['Dosage Form']?.trim(),
              strength: row['Strength']?.trim(),
              indications: row['Indications']?.trim(),
              sideEffects: row['Side Effects']?.trim(),
              contraindications: row['Contraindications']?.trim(),
              storageInstructions: row['Storage Instructions']?.trim()
            },
            compliance: {
              prescriptionRequired: parseBoolean(row['Prescription Required']),
              narcotic: parseBoolean(row['Narcotic']),
              scheduleType: row['Schedule Type']?.trim()
            },
            shipping: {
              weight: row['Weight']?.trim(),
              dimensions: row['Dimensions']?.trim(),
              shippingClass: row['Shipping Class']?.trim()
            },
            seo: {
              metaTitle: row['Meta Title']?.trim(),
              metaDescription: row['Meta Description']?.trim(),
              metaKeywords: row['Keywords']?.trim()
            }
          }

          return { row: index + 2, data: row, errors, warnings, mappedProduct }
        })

        setValidationResults(validated)
        setStep('preview')
      },
      error: (error: any) => {
        alert('Error parsing CSV: ' + error.message)
      }
    })
  }

  const executeImport = async () => {
    setStep('importing')
    const validRows = validationResults.filter(r => r.errors.length === 0)
    setProgress({ current: 0, total: validRows.length })

    const productsToImport = validRows.map(r => r.mappedProduct)
    
    try {
      if (productsToImport.length > 0) {
        // We use insertMany for bulk operation
        await productService.addManyProducts(productsToImport)
      }
      setSummary({
        success: validRows.length,
        failed: validationResults.length - validRows.length,
        errors: validationResults.filter(r => r.errors.length > 0).map(r => ({
          row: r.row,
          name: r.data['Product Name'] || 'Unknown',
          error: r.errors.join(', ')
        }))
      })
      setStep('summary')
    } catch (error: any) {
      alert('Import failed: ' + error.message)
      setStep('preview')
    }
  }

  const downloadErrorReport = () => {
    const errorData = summary.errors.map(err => [err.row, err.name, err.error])
    const csvContent = Papa.unparse([['Row', 'Product', 'Error'], ...errorData])
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'import_errors.csv'
    link.click()
  }

  const validCount = validationResults.filter(r => r.errors.length === 0).length
  const invalidCount = validationResults.length - validCount

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Import Products</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {step === 'upload' && (
            <div className="space-y-6 py-6">
              <div className="bg-muted p-6 rounded-lg border border-dashed flex flex-col items-center text-center space-y-4">
                <FileUp className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-lg">Upload CSV File</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1">
                    Upload your product data. Images cannot be uploaded via CSV. You can add images by editing products after import.
                  </p>
                </div>
                <div className="flex gap-4 mt-4">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="mr-2 w-4 h-4" /> Download Template
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 w-4 h-4" /> Select File
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4 flex flex-col h-full overflow-hidden">
              <div className="flex gap-4">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {validCount} Valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <XCircle className="w-3 h-3 mr-1" /> {invalidCount} Errors
                  </Badge>
                )}
              </div>
              
              <ScrollArea className="flex-1 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Row</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>MRP</TableHead>
                      <TableHead>Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResults.map((result, i) => (
                      <TableRow key={i}>
                        <TableCell>{result.row}</TableCell>
                        <TableCell>
                          {result.errors.length > 0 ? (
                            <XCircle className="w-4 h-4 text-red-500" />
                          ) : result.warnings.length > 0 ? (
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{result.data['Product Name'] || '-'}</TableCell>
                        <TableCell>{result.data['Category'] || '-'}</TableCell>
                        <TableCell>₹{result.data['MRP'] || '-'}</TableCell>
                        <TableCell>
                          {result.errors.length > 0 && (
                            <span className="text-red-600 text-sm block">{result.errors.join(', ')}</span>
                          )}
                          {result.warnings.length > 0 && (
                            <span className="text-yellow-600 text-sm block">{result.warnings.join(', ')}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {step === 'importing' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <div>
                <h3 className="text-lg font-semibold">Importing Products...</h3>
                <p className="text-muted-foreground mt-2">
                  Please do not close this window.
                </p>
              </div>
            </div>
          )}

          {step === 'summary' && (
            <div className="py-8 space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold">Import Complete</h2>
              
              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-2xl font-bold">{summary.success + summary.failed}</div>
                  <div className="text-sm text-muted-foreground">Total Rows</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{summary.success}</div>
                  <div className="text-sm text-green-700">Imported</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">{summary.failed}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>

              {summary.errors.length > 0 && (
                <Button variant="outline" onClick={downloadErrorReport} className="mt-4">
                  <Download className="mr-2 w-4 h-4" /> Download Error Report
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 border-t pt-4">
          {step !== 'importing' && step !== 'summary' && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          {step === 'preview' && (
            <Button onClick={executeImport} disabled={validCount === 0}>
              Import {validCount} Products
            </Button>
          )}
          {step === 'summary' && (
            <Button onClick={onSuccess}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
