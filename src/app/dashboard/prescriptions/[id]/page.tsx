'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { prescriptionService } from '@/features/prescriptions/prescription-service'
import { Prescription, PrescriptionItem, Product } from '@/lib/models/types'
import { MedicineSelector } from '@/features/prescriptions/components/medicine-selector'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Trash2,
    ChevronLeft,
    Save,
    FileText
} from 'lucide-react'
import { toast } from 'sonner'

export default function PrescriptionVerificationPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    // Unwrap params using React.use()
    const { id } = use(params)

    const [prescription, setPrescription] = useState<Prescription | null>(null)
    const [loading, setLoading] = useState(true)
    const [medicines, setMedicines] = useState<PrescriptionItem[]>([])

    // Image Viewer State
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)

    // Validation State
    const [notes, setNotes] = useState('')
    const [doctorName, setDoctorName] = useState('')
    const [patientName, setPatientName] = useState('')

    // Dialog State
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [processing, setProcessing] = useState(false)

    // Checklist
    const [checklist, setChecklist] = useState({
        doctorDetails: false,
        patientName: false,
        dateValid: false,
        medicineInfo: false
    })

    useEffect(() => {
        loadPrescription()
    }, [id])

    // Reset checklist when confirmed
    useEffect(() => {
        if (prescription) {
            setNotes(prescription.verificationNotes || '')
            setDoctorName(prescription.doctorName || '')
            setPatientName(prescription.patientName || '')
            setMedicines(prescription.prescribedMedicines || [])
        }
    }, [prescription])

    const loadPrescription = async () => {
        try {
            const data = await prescriptionService.getPrescriptionById(id)
            if (!data) {
                toast.error('Prescription not found')
                router.push('/dashboard/prescriptions')
                return
            }
            setPrescription(data)
        } catch (error) {
            console.error('Failed to load prescription:', error)
            toast.error('Failed to load prescription data')
        } finally {
            setLoading(false)
        }
    }

    // --- Medicine Management ---
    const handleAddMedicine = (product: Product) => {
        // Check if already added
        if (medicines.some(m => m.productId === product.id)) {
            toast.warning('Medicine already added to list')
            return
        }

        const newItem: PrescriptionItem = {
            medicineName: product.name,
            productId: product.id,
            productName: product.name,
            quantity: 1,
            price: product.price || 0,
            dosage: '1-0-1',
            duration: '5 days',
            isSubstitute: false
        }
        setMedicines([...medicines, newItem])
    }

    const handleUpdateMedicine = (index: number, field: keyof PrescriptionItem, value: any) => {
        const updated = [...medicines]
        updated[index] = { ...updated[index], [field]: value }
        setMedicines(updated)
    }

    const handleRemoveMedicine = (index: number) => {
        setMedicines(medicines.filter((_, i) => i !== index))
    }

    // Calculate Total
    const totalEstimate = medicines.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0)

    // --- Actions ---
    const handleApprove = async () => {
        // Validation
        if (!prescription) return
        const allChecked = Object.values(checklist).every(v => v)
        if (!allChecked) {
            toast.error('Please complete the verification checklist first')
            return
        }
        if (medicines.length === 0) {
            toast.error('Please add at least one medicine')
            return
        }

        setProcessing(true)
        try {
            // For now, hardcoding admin/pharmacist ID until auth context is fully ready
            const pharmacistId = 'admin-user-id'

            await prescriptionService.updatePrescription(prescription.id, {
                doctorName,
                patientName,
                // Assuming current date for prescription date if not set, or we could add a date picker
            })

            await prescriptionService.approvePrescription(
                prescription.id,
                medicines,
                pharmacistId,
                notes,
                prescription.userId // Pass userId for notification
            )

            // Order creation removed as per requirement - User will presumably confirm from their end

            toast.success('Prescription approved successfully')
            router.push('/dashboard/prescriptions')
        } catch (error) {
            console.error('Approval failed:', error)
            toast.error('Failed to approve prescription')
        } finally {
            setProcessing(false)
        }
    }

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Rejection reason is required')
            return
        }

        setProcessing(true)
        try {
            const pharmacistId = 'admin-user-id'
            await prescriptionService.rejectPrescription(
                prescription!.id,
                rejectionReason,
                pharmacistId
            )
            toast.success('Prescription rejected')
            router.push('/dashboard/prescriptions')
        } catch (error) {
            console.error('Rejection failed:', error)
            toast.error('Failed to reject prescription')
        } finally {
            setProcessing(false)
            setShowRejectDialog(false)
        }
    }

    if (loading || !prescription) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    const isPdf = prescription.fileType?.includes('pdf') || prescription.fileUrl.toLowerCase().includes('.pdf')

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col gap-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            Prescription Verification
                            <Badge variant="outline" className="ml-2">
                                #{prescription.id.slice(0, 8)}
                            </Badge>
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Uploaded by {prescription.customerName || 'Customer'} on {new Date(prescription.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {prescription.status === 'pending' || prescription.status === 'verifying' ? (
                        <>
                            <Button
                                variant="destructive"
                                onClick={() => setShowRejectDialog(true)}
                                disabled={processing}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={handleApprove}
                                disabled={processing}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve Prescription
                            </Button>
                        </>
                    ) : (
                        <Badge className="text-base px-4 py-1">
                            Status: {prescription.status.toUpperCase()}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Left Side: Viewer */}
                <Card className="flex flex-col overflow-hidden bg-slate-900 border-slate-800">
                    <div className="p-2 border-b border-slate-800 bg-slate-900 flex justify-between items-center text-white">
                        <span className="text-sm font-medium pl-2">Document Viewer</span>
                        <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <span className="text-xs flex items-center w-12 justify-center">{Math.round(zoom * 100)}%</span>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setZoom(z => Math.min(3, z + 0.2))}>
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <div className="w-px h-4 bg-slate-700 mx-1"></div>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setRotation(r => r + 90)}>
                                <RotateCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-950 p-4 relative">
                        {isPdf ? (
                            <iframe
                                src={prescription.fileUrl}
                                className="w-full h-full border-none"
                                title="PDF Viewer"
                            />
                        ) : (
                            <div
                                className="transition-transform duration-200 ease-out origin-center"
                                style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                            >
                                {/* Using standard img tag for direct control in this specific viewer context */}
                                <img
                                    src={prescription.fileUrl}
                                    alt="Prescription"
                                    className="max-w-full max-h-full object-contain shadow-xl"
                                />
                            </div>
                        )}
                    </div>
                </Card>

                {/* Right Side: Verification Form */}
                <Card className="flex flex-col overflow-hidden bg-white">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Checklist */}
                        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-primary" />
                                Verification Checklist
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.keys(checklist).map((key) => {
                                    const label = key === 'doctorDetails' ? 'Doctor Details Visible' :
                                        key === 'patientName' ? 'Patient Name Matches' :
                                            key === 'dateValid' ? 'Date within 6 months' :
                                                'Medicines Legible'

                                    return (
                                        <label key={key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={(checklist as any)[key]}
                                                onChange={(e) => setChecklist({ ...checklist, [key]: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span className={checklist[key as keyof typeof checklist] ? 'text-foreground' : 'text-muted-foreground'}>
                                                {label}
                                            </span>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Transcription Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Doctor Name / Clinic</Label>
                                <Input
                                    value={doctorName}
                                    onChange={(e) => setDoctorName(e.target.value)}
                                    placeholder="e.g. Dr. A. Smith"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Patient Name</Label>
                                <Input
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                        </div>

                        {/* Medicine Selector */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold">Prescribed Medicines</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-primary">
                                        Total Est: ₹{totalEstimate.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {medicines.length} items
                                    </span>
                                </div>
                            </div>

                            <MedicineSelector onSelect={handleAddMedicine} />

                            {/* Medicine List */}
                            <div className="space-y-3 mt-4">
                                {medicines.length === 0 ? (
                                    <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                                        Search and add medicines from the inventory
                                    </div>
                                ) : (
                                    medicines.map((item, index) => (
                                        <div key={index} className="p-3 bg-card border rounded-lg shadow-sm space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-sm">{item.medicineName}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {item.productId ? (
                                                            <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">
                                                                In Stock
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-200">
                                                                Manual Entry
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleRemoveMedicine(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <Label className="text-[10px] uppercase text-muted-foreground">Qty</Label>
                                                    <Input
                                                        type="number"
                                                        className="h-7 text-xs"
                                                        value={item.quantity}
                                                        onChange={(e) => handleUpdateMedicine(index, 'quantity', parseInt(e.target.value) || 0)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] uppercase text-muted-foreground">Dosage</Label>
                                                    <Input
                                                        className="h-7 text-xs"
                                                        value={item.dosage}
                                                        placeholder="1-0-1"
                                                        onChange={(e) => handleUpdateMedicine(index, 'dosage', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] uppercase text-muted-foreground">Duration</Label>
                                                    <Input
                                                        className="h-7 text-xs"
                                                        value={item.duration || ''}
                                                        placeholder="5 days"
                                                        onChange={(e) => handleUpdateMedicine(index, 'duration', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label>Pharmacist Notes (Internal)</Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any special storage instructions or notes..."
                                className="h-20 resize-none"
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Reject Prescription
                        </DialogTitle>
                        <DialogDescription>
                            Please provide a clear reason for rejection. This will be sent to the customer.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g. Image is blurry, Date expired, Doctor signature missing..."
                            className="min-h-[100px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectionReason || processing}
                        >
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
