# Sample Data Seeding Guide

## 📊 Overview

This script populates your Firestore database with realistic test data for comprehensive CRM testing.

## 🎯 What Gets Seeded

### 1. **Categories** (5 categories)
- Pain Relief
- Vitamins & Supplements
- Diabetes Care
- Cold & Cough
- Skin Care

### 2. **Products** (8 products)
- Dolo 650 Tablet (500 in stock)
- Crocin Advance Tablet (350 in stock)
- Vitamin D3 60K Capsules (200 in stock)
- Metformin 500mg Tablets (150 in stock)
- Vicks Cough Syrup (80 in stock)
- Cetaphil Moisturizing Cream (45 in stock)
- Revital H Multivitamin (120 in stock)
- **Ibuprofen 400mg Tablets (8 in stock - LOW STOCK ALERT)** ⚠️

### 3. **Users** (5 users)

#### Admin User
- **Email:** admin@malarmedicals.com
- **Phone:** +919876543210
- **Password:** Test@123
- **Role:** admin

#### Customer Users
1. **Rajesh Kumar**
   - Email: rajesh.kumar@example.com
   - Phone: +919876543211
   - Password: Test@123

2. **Priya Sharma**
   - Email: priya.sharma@example.com
   - Phone: +919876543212
   - Password: Test@123

3. **Amit Patel**
   - Email: amit.patel@example.com
   - Phone: +919876543213
   - Password: Test@123

4. **Lakshmi Iyer**
   - Email: lakshmi.iyer@example.com
   - Phone: +919876543214
   - Password: Test@123

### 4. **Orders** (4 orders)
- **ORD-001:** Delivered (Rajesh Kumar) - ₹135
- **ORD-002:** Processing (Priya Sharma) - ₹216
- **ORD-003:** Pending (Amit Patel) - ₹76 (Requires prescription)
- **ORD-004:** Shipped (Lakshmi Iyer) - ₹884

### 5. **Prescriptions** (3 prescriptions)
- **PRESC-001:** Approved (Amit Patel) - Diabetes medicines
- **PRESC-002:** Pending (Rajesh Kumar) - Awaiting approval
- **PRESC-003:** Rejected (Priya Sharma) - Unclear image

### 6. **Inventory Movements** (4 records)
- Sale transactions from delivered orders
- Stock adjustment (damaged goods)
- Restock transaction

### 7. **Notifications** (5 notifications)
- New order notification
- Prescription upload notification
- Low stock alert
- Order delivered notification
- Prescription approved notification

### 8. **Banners** (3 banners)
- Mega Health Sale
- Free Home Delivery
- Upload Prescription

---

## 🚀 How to Run

### Prerequisites

1. **Install tsx** (TypeScript executor):
   ```bash
   pnpm add -D tsx
   ```

2. **Set up Firebase Admin credentials** in `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

### Run the Seeding Script

```bash
npx tsx scripts/seed-sample-data.ts
```

### Expected Output

```
🌱 Starting database seeding...

🏷️  Seeding categories...
✅ Seeded 5 categories

📦 Seeding products...
✅ Seeded 8 products

👥 Seeding users...
   Created auth user: Admin User
   Created auth user: Rajesh Kumar
   Created auth user: Priya Sharma
   Created auth user: Amit Patel
   Created auth user: Lakshmi Iyer
✅ Seeded 5 users

🛒 Seeding orders...
✅ Seeded 4 orders

💊 Seeding prescriptions...
✅ Seeded 3 prescriptions

📊 Seeding inventory movements...
✅ Seeded 4 inventory movements

🔔 Seeding notifications...
✅ Seeded 5 notifications

🎨 Seeding banners...
✅ Seeded 3 banners

🎉 Database seeding completed successfully!

📝 Test Credentials:
   Admin:
   - Email: admin@malarmedicals.com
   - Phone: +919876543210
   - Password: Test@123

   Customer (Rajesh Kumar):
   - Email: rajesh.kumar@example.com
   - Phone: +919876543211
   - Password: Test@123
```

---

## 🧪 Testing Scenarios Enabled

### 1. **Order Management Testing**
- ✅ View orders in different statuses
- ✅ Update order status
- ✅ Test inventory reduction on delivery
- ✅ View order details

### 2. **Prescription Workflow Testing**
- ✅ View pending prescriptions
- ✅ Approve prescriptions with medicines
- ✅ View approved/rejected prescriptions
- ✅ Test prescription notifications

### 3. **Inventory Management Testing**
- ✅ View stock levels
- ✅ Test low stock alerts (Ibuprofen has only 8 items)
- ✅ View inventory movements
- ✅ Test auto stock reduction

### 4. **Product Management Testing**
- ✅ View products with images
- ✅ Edit product details
- ✅ Test stock quantity updates
- ✅ Filter by category

### 5. **Notification Testing**
- ✅ View unread notifications
- ✅ Mark notifications as read
- ✅ Test different notification types
- ✅ Navigate from notifications

### 6. **User Management Testing**
- ✅ Login with different users
- ✅ View customer profiles
- ✅ View customer order history

---

## 🔄 Re-running the Script

**Warning:** Running the script multiple times will:
- ✅ Update existing documents (safe)
- ✅ Create auth users if they don't exist
- ⚠️ **NOT delete existing data**

To start fresh:
1. Delete collections manually in Firebase Console
2. Run the script again

---

## 🎯 Quick Testing Checklist

After seeding, test these scenarios:

### Admin Dashboard
- [ ] Login as admin
- [ ] View all 4 orders
- [ ] Approve PRESC-002 (pending prescription)
- [ ] Update ORD-002 status to "Shipped"
- [ ] Check low stock alert for Ibuprofen
- [ ] View inventory movements

### Customer Experience
- [ ] Login as Rajesh Kumar
- [ ] View order history (should see ORD-001)
- [ ] Check notifications (prescription approved)
- [ ] Browse products by category
- [ ] Add products to cart

### Inventory Testing
- [ ] Mark ORD-004 as "Delivered"
- [ ] Verify stock reduction:
  - Cetaphil: 45 → 44
  - Revital H: 120 → 119
- [ ] Check inventory movements log

---

## 📝 Notes

- All passwords are set to `Test@123` for easy testing
- Phone numbers are Indian format (+91...)
- Dates are randomized within the last 30 days
- One product (Ibuprofen) has low stock (8 items) to test alerts
- Prescription images use placeholder URLs

---

## 🛠️ Troubleshooting

### Error: "Firebase Admin not initialized"
- Check your `.env.local` file has correct Firebase credentials
- Ensure `FIREBASE_PRIVATE_KEY` is properly formatted with `\n`

### Error: "User already exists"
- This is normal if re-running the script
- The script will skip creating auth users that already exist

### Error: "Permission denied"
- Check Firestore security rules
- Ensure Firebase Admin SDK has proper permissions

---

## 🎉 Ready to Test!

Once seeded, you can:
1. Login to dashboard: `http://localhost:3000/dashboard`
2. Use admin credentials to access all features
3. Test customer experience with customer accounts
4. Verify all CRM features work with realistic data

**Happy Testing! 🧪**
