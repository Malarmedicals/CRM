'use client'

import React, { useState, useRef, useEffect } from 'react'
import Papa from 'papaparse'
import ExcelJS from 'exceljs'
import JSZip from 'jszip'
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
import { Download, Upload, AlertCircle, CheckCircle2, FileUp, XCircle, FileArchive, Image as ImageIcon } from 'lucide-react'
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
  mainImagePreviewUrl?: string
  mainImageFile?: File
  additionalImagePreviewUrls?: string[]
  additionalImageFiles?: File[]
}

const TEMPLATE_HEADERS = [
  'Product Name', 'Description', 'Category', 'Subcategory', 'Brand',
  'MRP', 'Selling Price', 'Stock Quantity', 'Minimum Stock', 'Batch Number', 'Expiry Date',
  'Composition', 'Dosage Form', 'Strength', 'Indications', 'Side Effects', 'Contraindications', 'Storage Instructions',
  'Prescription Required', 'Narcotic', 'Schedule Type',
  'GST Rate (%)', 'HSN Code',
  'Meta Title', 'Meta Description', 'Keywords'
]

const SAMPLE_ROW = [
  'Paracetamol 500mg', 'Used for fever and pain relief', 'Medicines', 'Fever', 'Cipla',
  50, 45, 100, 10, 'B2025-01', '2026-12-31',
  'Paracetamol IP 500mg', 'Tablet', '500mg', 'Fever, Mild pain', 'Nausea, Rash', 'Liver disease', 'Store in a cool, dry place',
  'No', 'No', 'OTC',
  12, '3004',
  'Buy Paracetamol 500mg Online', 'Get fast relief from fever with Paracetamol 500mg.', 'paracetamol, fever, painkiller'
]

export function BulkImportModal({ onClose, onSuccess }: BulkImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [dataFile, setDataFile] = useState<File | null>(null)
  
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [summary, setSummary] = useState({ success: 0, failed: 0, errors: [] as any[] })
  
  const dataInputRef = useRef<HTMLInputElement>(null)
  
  const [dbData, setDbData] = useState<{categories: string[], subcategories: string[], existingNames: Set<string>, existingBatches: Set<string>}>({
    categories: [], subcategories: [], existingNames: new Set(), existingBatches: new Set()
  });

  const SCHEDULE_TYPES = ['OTC', 'Schedule H', 'Schedule H1', 'Schedule X'];

  useEffect(() => {
    // Load validation lists on mount
    const loadValidationData = async () => {
      try {
        const { categories, subcategories } = await productService.getUniqueCategories()
        const identifiers = await productService.getExistingIdentifiers()
        
        setDbData({
          categories,
          subcategories,
          existingNames: new Set(identifiers.map(i => i.name.toLowerCase())),
          existingBatches: new Set(identifiers.map(i => i.batchNumber.toLowerCase()))
        })
      } catch (err) {
        console.error("Failed to load validation data", err)
      }
    }
    loadValidationData()
  }, [])

  // Clean up object URLs when unmounting or starting new validation
  useEffect(() => {
    return () => {
      validationResults.forEach(r => {
        if (r.mainImagePreviewUrl && r.mainImagePreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(r.mainImagePreviewUrl)
        }
        if (r.additionalImagePreviewUrls) {
          r.additionalImagePreviewUrls.forEach(url => {
            if (url.startsWith('blob:')) URL.revokeObjectURL(url)
          })
        }
      })
    }
  }, [validationResults])

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');
    const lookupSheet = workbook.addWorksheet('Lookups', { state: 'veryHidden' });

    // Populate Lookups
    const catCol = lookupSheet.getColumn('A');
    catCol.values = ['Categories', ...dbData.categories];
    const subcatCol = lookupSheet.getColumn('B');
    subcatCol.values = ['Subcategories', ...dbData.subcategories];
    const schCol = lookupSheet.getColumn('C');
    schCol.values = ['Schedule Types', ...SCHEDULE_TYPES];

    // Headers
    worksheet.addRow(TEMPLATE_HEADERS);
    worksheet.addRow(SAMPLE_ROW);

    // Data Validation
    const catColIdx = TEMPLATE_HEADERS.indexOf('Category') + 1;
    const subcatColIdx = TEMPLATE_HEADERS.indexOf('Subcategory') + 1;
    const schColIdx = TEMPLATE_HEADERS.indexOf('Schedule Type') + 1;
    const preColIdx = TEMPLATE_HEADERS.indexOf('Prescription Required') + 1;
    const narColIdx = TEMPLATE_HEADERS.indexOf('Narcotic') + 1;

    for (let i = 2; i <= 1000; i++) {
      if (dbData.categories.length > 0) {
        worksheet.getCell(i, catColIdx).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`Lookups!$A$2:$A$${dbData.categories.length + 1}`]
        };
      }
      if (dbData.subcategories.length > 0) {
        worksheet.getCell(i, subcatColIdx).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`Lookups!$B$2:$B$${dbData.subcategories.length + 1}`]
        };
      }
      worksheet.getCell(i, schColIdx).dataValidation = {
        type: 'list', allowBlank: true, formulae: [`Lookups!$C$2:$C$${SCHEDULE_TYPES.length + 1}`]
      };
      const yesNo = '"Yes,No"';
      worksheet.getCell(i, preColIdx).dataValidation = { type: 'list', allowBlank: true, formulae: [yesNo] };
      worksheet.getCell(i, narColIdx).dataValidation = { type: 'list', allowBlank: true, formulae: [yesNo] };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'product_import_template.xlsx';
    link.click();
  }

  const handleDataUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setDataFile(e.target.files[0])
  }

  const parseBoolean = (val: any) => {
    if (!val) return false
    const lower = String(val).toLowerCase().trim()
    return ['yes', 'true', '1', 'y'].includes(lower)
  }

  const processImport = async () => {
    if (!dataFile) return;
    
    setStep('importing'); // Using importing state as a loading indicator for parsing

    let rows: any[] = [];
    
    if (dataFile.name.endsWith('.xlsx')) {
      const workbook = new ExcelJS.Workbook();
      const buffer = await dataFile.arrayBuffer();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      
      const headers: string[] = [];
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value?.toString().trim() || '';
      });
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowData: any = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (headers[colNumber]) {
             // Handle formulas/rich text if needed
             let val = cell.value;
             if (val && typeof val === 'object' && 'result' in val) val = val.result;
             rowData[headers[colNumber]] = val;
          }
        });
        if (Object.keys(rowData).length > 0 && rowData['Product Name']) {
          rows.push(rowData);
        }
      });
    } else {
      const text = await dataFile.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      rows = parsed.data;
    }

    if (rows.length > 500) {
       alert("Maximum 500 rows allowed per import.");
       setStep('upload');
       return;
    }

    const validated: ValidationResult[] = rows.map((row: any, index: number) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      const name = String(row['Product Name'] || '').trim();
      const batch = String(row['Batch Number'] || '').trim();
      
      if (!name) errors.push('Missing Product Name');
      if (dbData.existingNames.has(name.toLowerCase())) errors.push(`Duplicate Name in DB`);
      if (batch && dbData.existingBatches.has(batch.toLowerCase())) errors.push(`Duplicate Batch in DB`);

      const mrp = parseFloat(row['MRP']);
      const sellingPrice = parseFloat(row['Selling Price']);
      if (isNaN(mrp)) errors.push('Invalid MRP');
      if (isNaN(sellingPrice)) errors.push('Invalid Selling Price');
      if (mrp < sellingPrice) warnings.push('MRP is less than Selling Price');

      const stock = parseInt(row['Stock Quantity']);
      if (isNaN(stock)) warnings.push('Invalid Stock Quantity, defaults to 0');
      
      const expDateStr = row['Expiry Date'];
      let expiryDate = undefined;
      if (expDateStr) {
        const d = new Date(expDateStr);
        if (isNaN(d.getTime())) {
          errors.push('Invalid Expiry Date');
        } else if (d <= new Date()) {
          errors.push('Expiry Date must be in future');
        } else {
          expiryDate = d.toISOString();
        }
      }

      const category = String(row['Category'] || '').trim();
      if (category && !dbData.categories.map(c=>c.toLowerCase()).includes(category.toLowerCase())) {
        errors.push(`Invalid Category: ${category}`);
      }
      
      const subcategory = String(row['Subcategory'] || '').trim();
      if (subcategory && !dbData.subcategories.map(c=>c.toLowerCase()).includes(subcategory.toLowerCase())) {
        errors.push(`Invalid Subcategory: ${subcategory}`);
      }

      const scheduleType = String(row['Schedule Type'] || '').trim();
      if (scheduleType && !SCHEDULE_TYPES.map(c=>c.toLowerCase()).includes(scheduleType.toLowerCase())) {
        errors.push(`Invalid Schedule Type: ${scheduleType}`);
      }

      const mappedProduct = {
        name,
        description: row['Description']?.toString().trim(),
        category: category || 'Uncategorized',
        subcategory: subcategory,
        brandName: row['Brand']?.toString().trim(),
        price: isNaN(mrp) ? 0 : mrp,
        mrp: isNaN(mrp) ? 0 : mrp,
        discount: isNaN(sellingPrice) ? 0 : sellingPrice,
        stockQuantity: isNaN(stock) ? 0 : stock,
        minStockLevel: parseInt(row['Minimum Stock']) || 10,
        batchNumber: batch,
        expiryDate,
        status: 'published',
        medicalInfo: {
          composition: row['Composition']?.toString().trim(),
          dosageForm: row['Dosage Form']?.toString().trim(),
          strength: row['Strength']?.toString().trim(),
          indications: row['Indications']?.toString().trim(),
          sideEffects: row['Side Effects']?.toString().trim(),
          contraindications: row['Contraindications']?.toString().trim(),
          storageInstructions: row['Storage Instructions']?.toString().trim()
        },
        compliance: {
          prescriptionRequired: parseBoolean(row['Prescription Required']),
          narcotic: parseBoolean(row['Narcotic']),
          scheduleType: scheduleType || 'OTC'
        },
        gstRate: row['GST Rate (%)'] ? parseFloat(row['GST Rate (%)']) : undefined,
        hsnCode: row['HSN Code']?.toString().trim(),
        seo: {
          metaTitle: row['Meta Title']?.toString().trim(),
          metaDescription: row['Meta Description']?.toString().trim(),
          metaKeywords: row['Keywords']?.toString().trim()
        },
        _mainImageFilename: null,
        _additionalImageFilenames: []
      }

      return { 
        row: index + 2, 
        data: row, 
        errors, 
        warnings, 
        mappedProduct,
        mainImagePreviewUrl: undefined,
        mainImageFile: undefined,
        additionalImagePreviewUrls: [],
        additionalImageFiles: []
      }
    })

    // Check for in-file duplicates
    const fileNames = new Set();
    const fileBatches = new Set();
    validated.forEach(v => {
      if (v.mappedProduct.name) {
         const ln = v.mappedProduct.name.toLowerCase();
         if (fileNames.has(ln)) v.errors.push(`Duplicate Name in file`);
         fileNames.add(ln);
      }
      if (v.mappedProduct.batchNumber) {
         const lb = v.mappedProduct.batchNumber.toLowerCase();
         if (fileBatches.has(lb)) v.errors.push(`Duplicate Batch in file`);
         fileBatches.add(lb);
      }
    });

    setValidationResults(validated)
    setStep('preview')
  }

  const executeImport = async () => {
    setStep('importing')
    const validRows = validationResults.filter(r => r.errors.length === 0)
    const productsToImport = validRows.map(r => r.mappedProduct)
    const imageFilesMap = new Map<string, File>()
    
    validRows.forEach(r => {
      if (r.mappedProduct._mainImageFilename && r.mainImageFile) {
        imageFilesMap.set(r.mappedProduct._mainImageFilename, r.mainImageFile)
      }
      if (r.mappedProduct._additionalImageFilenames && r.additionalImageFiles) {
        r.mappedProduct._additionalImageFilenames.forEach((name: string, idx: number) => {
          if (r.additionalImageFiles![idx]) {
            imageFilesMap.set(name, r.additionalImageFiles![idx])
          }
        })
      }
    })
    
    try {
      if (productsToImport.length > 0) {
        await productService.importProductsWithImages(productsToImport, imageFilesMap)
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

  const handleInlineImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'additional') => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newResults = [...validationResults];
      newResults[index] = { ...newResults[index] };
      newResults[index].mappedProduct = { ...newResults[index].mappedProduct };

      if (type === 'main') {
        const file = files[0];
        const url = URL.createObjectURL(file);
        newResults[index].mainImageFile = file;
        newResults[index].mainImagePreviewUrl = url;
        newResults[index].mappedProduct._mainImageFilename = `inline_main_${Date.now()}_${file.name}`;
      } else {
        const urls = files.map(f => URL.createObjectURL(f));
        newResults[index].additionalImageFiles = [...(newResults[index].additionalImageFiles || []), ...files];
        newResults[index].additionalImagePreviewUrls = [...(newResults[index].additionalImagePreviewUrls || []), ...urls];
        const newNames = files.map(f => `inline_add_${Date.now()}_${Math.random().toString(36).substr(2, 5)}_${f.name}`);
        newResults[index].mappedProduct._additionalImageFilenames = [
          ...(newResults[index].mappedProduct._additionalImageFilenames || []),
          ...newNames
        ];
      }
      
      setValidationResults(newResults);
    }
    e.target.value = '';
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
      <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Import Products</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {step === 'upload' && (
            <div className="space-y-6 py-6">
              <div className="flex justify-center">
                <div className="bg-muted p-8 rounded-lg border border-dashed flex flex-col items-center text-center space-y-4 max-w-xl w-full">
                  <FileUp className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold text-lg">Upload Data</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1">
                      Upload your CSV or XLSX file containing product details. Max 500 rows. You will be able to add images to products in the next step.
                    </p>
                    {dataFile && <Badge className="mt-4" variant="secondary">{dataFile.name}</Badge>}
                  </div>
                  <div className="flex gap-4 mt-6">
                    <Button variant="outline" onClick={downloadTemplate}>
                      <Download className="mr-2 w-4 h-4" /> Template
                    </Button>
                    <Button onClick={() => dataInputRef.current?.click()}>
                      <Upload className="mr-2 w-4 h-4" /> Select Data File
                    </Button>
                    <input type="file" ref={dataInputRef} className="hidden" accept=".csv, .xlsx" onChange={handleDataUpload} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                 <Button onClick={processImport} disabled={!dataFile}>Process File</Button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4 flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> {validCount} Valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-3 py-1">
                      <XCircle className="w-4 h-4 mr-2" /> {invalidCount} Errors
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                   Invalid rows will be skipped. You can click the image icons to upload main and additional images for each product.
                </div>
              </div>
              
              <ScrollArea className="flex-1 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Row</TableHead>
                      <TableHead>Main Image</TableHead>
                      <TableHead>Additional Images</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category / Sub</TableHead>
                      <TableHead>MRP / Sell</TableHead>
                      <TableHead className="w-[300px]">Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResults.map((result, i) => (
                      <TableRow key={i} className={result.errors.length > 0 ? "bg-red-50/50" : ""}>
                        <TableCell className="font-medium text-muted-foreground">{result.row}</TableCell>
                        <TableCell>
                          {result.mainImagePreviewUrl ? (
                            <div className="relative group w-12 h-12">
                              <img src={result.mainImagePreviewUrl} alt="Main Preview" className="w-12 h-12 object-cover rounded border" />
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleInlineImageUpload(i, e, 'main')} title="Change Main Image" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center relative group border border-dashed">
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleInlineImageUpload(i, e, 'main')} title="Upload Main Image" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 items-center flex-wrap max-w-[200px]">
                            {result.additionalImagePreviewUrls?.map((url, idx) => (
                              <img key={idx} src={url} alt={`Add ${idx}`} className="w-10 h-10 object-cover rounded border" />
                            ))}
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center relative group shrink-0 border border-dashed hover:border-primary transition-colors">
                              <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                              <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleInlineImageUpload(i, e, 'additional')} title="Add Additional Images" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{result.data['Product Name'] || '-'}</TableCell>
                        <TableCell>
                          {result.data['Category'] || '-'}
                          {result.data['Subcategory'] ? ` / ${result.data['Subcategory']}` : ''}
                        </TableCell>
                        <TableCell>
                          ₹{result.data['MRP'] || '-'} / ₹{result.data['Selling Price'] || '-'}
                        </TableCell>
                        <TableCell>
                          {result.errors.length > 0 && (
                            <div className="text-red-600 text-sm font-medium mb-1">
                              {result.errors.map((e, idx) => <div key={idx}>• {e}</div>)}
                            </div>
                          )}
                          {result.warnings.length > 0 && (
                            <div className="text-yellow-600 text-sm">
                              {result.warnings.map((w, idx) => <div key={idx}>• {w}</div>)}
                            </div>
                          )}
                          {result.errors.length === 0 && result.warnings.length === 0 && (
                            <span className="text-green-600 text-sm">Valid</span>
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
            <div className="py-12 flex flex-col items-center justify-center h-full space-y-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <div>
                <h3 className="text-lg font-semibold">Processing Import...</h3>
                <p className="text-muted-foreground mt-2">
                  Please do not close this window. Uploading images and writing to database.
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
                  <div className="text-sm text-red-700">Skipped (Errors)</div>
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
              Commit {validCount} Products
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
