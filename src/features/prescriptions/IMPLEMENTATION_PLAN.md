# Prescription Management Module Implementation Plan

## 1. Module Structure
We will implement the Prescription Management System using a Feature-Sliced Design approach, keeping everything self-contained in `src/features/prescriptions` and `src/app/dashboard/prescriptions`.

```
src/
├── features/
│   └── prescriptions/
│       ├── prescription-service.ts       # Firestore logic
│       ├── use-prescriptions.ts          # Hooks for state management
│       ├── components/
│       │   ├── prescription-viewer.tsx   # Zoom/Pan image viewer
│       │   ├── medicine-selector.tsx     # Inventory search & selection
│       │   └── verification-form.tsx     # Pharmacist validation checklist
├── app/
    └── dashboard/
        └── prescriptions/
            ├── page.tsx                  # Kanban/List view of prescriptions
            └── [id]/
                └── page.tsx              # Detailed verification interface
```

## 2. Database Schema (Firestore)

We will add the `Prescription` interface to `src/lib/models/types.ts`.

### Collection: `prescriptions`
```typescript
interface Prescription {
  id: string;
  userId: string;
  customerName?: string;
  customerPhone?: string; // Important for contacting
  fileUrl: string; // URL of the uploaded image/pdf
  fileType: 'image/jpeg' | 'image/png' | 'application/pdf';
  status: 'pending' | 'verifying' | 'approved' | 'rejected' | 'ordered';
  
  // Verification Data
  pharmacistId?: string;
  pharmacistName?: string;
  verificationNotes?: string;
  rejectionReason?: string; // Mandatory if rejected
  
  // Digitized Medicines (created by pharmacist)
  prescribedMedicines?: Array<{
    medicineName: string; // As written by doctor
    productId?: string; // Linked system product ID (if found)
    quantity: number;
    dosage: string; // e.g., "1-0-1 after food"
    duration?: string; // e.g., "5 days"
    isSubstitute?: boolean; // If original was replaced
  }>;
  
  // Metadata
  doctorName?: string;
  patientName?: string;
  prescriptionDate?: Date;
  
  // Workflow
  orderId?: string; // Linked generated order
  createdAt: Date;
  updatedAt: Date;
}
```

## 3. Workflow & Logic

### A. Intake (Existing in User App)
- User uploads file -> stored in `prescriptions` collection with status `pending`.

### B. Verification (Pharmacist Dashboard)
1. **Queue**: Pharmacist sees list of `pending` prescriptions.
2. **Review**:
   - Opens detail view.
   - Uses `PrescriptionViewer` to inspect the image.
   - Fills "Valid Prescription?" checklist (Doctor details, Date, etc.).
3. **Digitization**:
   - Pharmacist searches inventory using `MedicineSelector`.
   - Adds medicines to the digital list.
   - If exact match not found, can select generic substitute (with flag).
   - If stock is low/out, system warns.
4. **Action**:
   - **Approve**: Generates a "Draft Order" or specialized "Approved Prescription" state ready for checkout.
   - **Reject**: User must provide reason (e.g., "Illegible", "Expired", "Not a valid prescription").

### C. Order Creation
- Once approved, the system generates a draft order.
- Notification sent to user: "Your prescription is verified. [Click to Pay & Order]".
- User confirms -> Order becomes active -> Inventory deducted.

## 4. Security & Compliance
- **Storage Rules**: Only the uploader and users with 'admin'/'pharmacist' role can read prescription files.
- **Audit**: Every status change log includes `pharmacistId` and timestamp.

## 5. UI Components

### `MedicineSelector`
- Autocomplete input querying `products` collection.
- Shows real-time stock status.
- Shows batch expiry alerts.

### `VerificationDesign` (Split View)
- Left Pane: High-res image viewer.
- Right Pane: Digital form & inventory search.

## 6. Implementation Steps
1.  **Update Types**: Add `Prescription` to `types.ts`.
2.  **Service Layer**: Implement `prescriptionService` with methods:
    `getPending()`, `assignToPharmacist()`, `updateStatus()`, `verifyAndCreateOrderDraft()`.
3.  **UI Build**:
    - List Page (Data Table with status badges).
    - Detail Page (Split view verification).
4.  **Integration**: Connect button actions to service.
5.  **Notifications**: Hook into existing notification system.
