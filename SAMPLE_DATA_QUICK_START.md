# 🎯 Sample Data & Testing - Quick Start

## 📦 What I've Created for You

I've set up a complete sample data seeding system with realistic test data for your Malar CRM.

### Files Created:
1. **`scripts/seed-sample-data.ts`** - Main seeding script
2. **`scripts/README_SEEDING.md`** - Detailed seeding documentation
3. **`scripts/FIREBASE_ADMIN_SETUP.md`** - Firebase Admin setup guide
4. **`docs/CRM_TESTING_GUIDE.md`** - Comprehensive testing guide

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Install Dependencies ✅
Already done! I've installed:
- `tsx` (TypeScript executor)
- `firebase-admin` (Firebase Admin SDK)

### Step 2: Set Up Firebase Admin Credentials

1. **Download Service Account Key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Your Project → ⚙️ Settings → Service accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Add to `.env.local`:**
   ```env
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"
   ```

   📖 **Detailed instructions:** See `scripts/FIREBASE_ADMIN_SETUP.md`

### Step 3: Run the Seeding Script

```bash
npx tsx scripts/seed-sample-data.ts
```

---

## 📊 Sample Data Overview

### 🏷️ Categories (5)
- Pain Relief, Vitamins & Supplements, Diabetes Care, Cold & Cough, Skin Care

### 📦 Products (8)
- Dolo 650, Crocin, Vitamin D3, Metformin, Vicks, Cetaphil, Revital H
- **Ibuprofen (LOW STOCK: 8 items)** ⚠️

### 👥 Users (5)

#### Admin Account
```
Email: admin@malarmedicals.com
Phone: +919876543210
Password: Test@123
```

#### Customer Accounts (4)
```
1. Rajesh Kumar    - rajesh.kumar@example.com    - +919876543211
2. Priya Sharma    - priya.sharma@example.com    - +919876543212
3. Amit Patel      - amit.patel@example.com      - +919876543213
4. Lakshmi Iyer    - lakshmi.iyer@example.com    - +919876543214

All passwords: Test@123
```

### 🛒 Orders (4)
- **ORD-001:** Delivered (₹135)
- **ORD-002:** Processing (₹216)
- **ORD-003:** Pending (₹76) - Requires prescription
- **ORD-004:** Shipped (₹884)

### 💊 Prescriptions (3)
- **PRESC-001:** ✅ Approved (Diabetes medicines)
- **PRESC-002:** ⏳ Pending (Awaiting approval)
- **PRESC-003:** ❌ Rejected (Unclear image)

### 📊 Inventory Movements (4)
- Sales, restocks, and adjustments

### 🔔 Notifications (5)
- New orders, prescriptions, low stock alerts

### 🎨 Banners (3)
- Promotional banners for homepage

---

## 🧪 Testing Workflow

### After Seeding, Test These:

#### 1. Admin Dashboard
```
1. Login: http://localhost:3000/dashboard
   - Email: admin@malarmedicals.com
   - Password: Test@123

2. Test Features:
   ✅ View all 4 orders
   ✅ Approve PRESC-002 (pending prescription)
   ✅ Update ORD-002 status to "Shipped"
   ✅ Check low stock alert for Ibuprofen
   ✅ View inventory movements
   ✅ Check notifications (5 total, 2 unread)
```

#### 2. Prescription Workflow
```
1. Go to: /dashboard/prescriptions
2. Click on PRESC-002 (Pending)
3. Add medicines:
   - Medicine: Dolo 650
   - Dosage: 1 tablet
   - Days: 5
4. Approve prescription
5. Verify notification sent to customer
```

#### 3. Inventory Auto-Reduction
```
1. Go to: /dashboard/orders
2. Find ORD-004 (Shipped)
3. Change status to "Delivered"
4. Go to: /dashboard/products
5. Verify stock reduced:
   - Cetaphil: 45 → 44
   - Revital H: 120 → 119
6. Check inventory movements log
```

#### 4. Customer Experience
```
1. Login as customer:
   - Email: rajesh.kumar@example.com
   - Password: Test@123

2. Test:
   ✅ View order history (ORD-001)
   ✅ Browse products
   ✅ Add to cart
   ✅ Checkout process
   ✅ Upload prescription
```

---

## 📋 Testing Checklist

### Critical Features
- [ ] User login/logout (admin & customer)
- [ ] View and manage orders
- [ ] Update order status
- [ ] Inventory auto-reduction on delivery
- [ ] Approve/reject prescriptions
- [ ] View notifications
- [ ] Low stock alerts
- [ ] Product management
- [ ] Category browsing

### CRM Tools
- [ ] WhatsApp notifications (if configured)
- [ ] Order tracking
- [ ] Customer management
- [ ] Inventory movements
- [ ] Banner management

---

## 🎯 Key Testing Scenarios

### Scenario 1: Complete Order Flow
```
Customer uploads prescription → Admin approves → 
Customer places order → Admin processes → 
Order delivered → Stock auto-reduces
```

### Scenario 2: Low Stock Alert
```
1. Check Ibuprofen (8 items - LOW STOCK)
2. Verify low stock notification appears
3. Test restock functionality
```

### Scenario 3: Prescription Approval
```
1. View PRESC-002 (pending)
2. Add prescribed medicines
3. Approve
4. Verify customer notification
5. Customer can now order medicines
```

---

## 📖 Detailed Documentation

- **Seeding Guide:** `scripts/README_SEEDING.md`
- **Firebase Setup:** `scripts/FIREBASE_ADMIN_SETUP.md`
- **Testing Guide:** `docs/CRM_TESTING_GUIDE.md`

---

## 🐛 Troubleshooting

### Script won't run?
- Check Firebase Admin credentials in `.env.local`
- Ensure `tsx` is installed: `pnpm add -D tsx`
- Verify Firebase project ID is correct

### Users not created?
- Check Firebase Authentication is enabled
- Verify service account has proper permissions
- Check console for error messages

### Data not appearing?
- Refresh the page
- Check Firestore security rules
- Verify collections are created in Firebase Console

---

## ✅ Ready to Test!

Once you've run the seeding script:

1. **Open Dashboard:** http://localhost:3000/dashboard
2. **Login as Admin:** admin@malarmedicals.com / Test@123
3. **Start Testing:** Follow the testing guide

---

## 🎉 What's Next?

After testing with sample data:
1. Identify and fix any bugs
2. Test edge cases
3. Verify mobile responsiveness
4. Test WhatsApp integration
5. Performance testing
6. Security testing
7. Production deployment!

---

**Happy Testing! 🚀**

*Need help? Check the detailed guides in the `scripts/` and `docs/` folders.*
