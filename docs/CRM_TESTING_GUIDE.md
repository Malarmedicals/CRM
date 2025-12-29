# Malar CRM - Comprehensive Testing Guide

## 🎯 Testing Overview

This guide provides a systematic approach to testing all features of your Malar Medical CRM system. Follow the order below for best results.

---

## 📋 Pre-Testing Checklist

- [ ] Dev server is running (`pnpm run dev`)
- [ ] Firebase connection is active
- [ ] You have admin credentials ready
- [ ] Browser console is open (F12) to monitor errors
- [ ] Network tab is open to check API calls

---

## 1️⃣ Authentication & User Management

### Login/Logout Flow
- [ ] Navigate to `/dashboard`
- [ ] Test login with valid credentials
- [ ] Verify redirect to dashboard after login
- [ ] Test logout functionality
- [ ] Verify redirect to login page after logout
- [ ] Test "Remember me" functionality (if applicable)

### User Roles & Permissions
- [ ] Login as Admin user
- [ ] Login as Staff user (if applicable)
- [ ] Verify different permission levels work correctly
- [ ] Test unauthorized access attempts

**Test URL:** `http://localhost:3000/dashboard`

---

## 2️⃣ Product Management

### Add New Product
- [ ] Navigate to `/dashboard/products/add`
- [ ] Fill in all required fields:
  - Product name
  - Category & subcategory
  - Price (MRP, selling price, discount)
  - Stock quantity
  - Description
  - Primary image
  - Additional images (test multiple uploads)
- [ ] Test image upload from:
  - Local files
  - External URLs (Amazon, IndiaMART)
- [ ] Verify form validation (empty fields, invalid prices)
- [ ] Submit and verify product is created
- [ ] Check if product appears in product list

### Edit Product
- [ ] Navigate to `/dashboard/products`
- [ ] Click "Edit" on a product
- [ ] Modify various fields
- [ ] Update images (add/remove)
- [ ] Save changes
- [ ] Verify changes are reflected

### Delete Product
- [ ] Click "Delete" on a product
- [ ] Verify confirmation dialog appears
- [ ] Confirm deletion
- [ ] Verify product is removed from list

### Product Search & Filter
- [ ] Test search by product name
- [ ] Filter by category
- [ ] Filter by stock status (In Stock, Low Stock, Out of Stock)
- [ ] Test pagination (if applicable)

**Test URLs:**
- `http://localhost:3000/dashboard/products`
- `http://localhost:3000/dashboard/products/add`

---

## 3️⃣ Category Management

### Add Category
- [ ] Navigate to `/dashboard/categories`
- [ ] Click "Add Category"
- [ ] Enter category name
- [ ] Upload category image
- [ ] Add subcategories
- [ ] Save and verify creation

### Edit Category
- [ ] Edit existing category
- [ ] Modify name, image, subcategories
- [ ] Save and verify changes

### Delete Category
- [ ] Delete a category
- [ ] Verify products in that category are handled correctly

**Test URL:** `http://localhost:3000/dashboard/categories`

---

## 4️⃣ Order Management

### View Orders
- [ ] Navigate to `/dashboard/orders`
- [ ] Verify all orders are displayed
- [ ] Check order details (customer, items, total, status)
- [ ] Test order filtering by status:
  - Pending
  - Processing
  - Shipped
  - Delivered
  - Cancelled

### Update Order Status
- [ ] Click on an order
- [ ] Change order status
- [ ] Verify status update is saved
- [ ] Check if customer receives notification (if implemented)

### Order Details
- [ ] View complete order details
- [ ] Verify customer information
- [ ] Check product list and quantities
- [ ] Verify pricing calculations
- [ ] Check delivery address

### Inventory Auto-Reduction
- [ ] Create a test order
- [ ] Mark order as "Delivered"
- [ ] Navigate to Products page
- [ ] Verify stock quantity has decreased correctly
- [ ] Check inventory movements/logs

**Test URL:** `http://localhost:3000/dashboard/orders`

---

## 5️⃣ Prescription Management

### View Prescriptions
- [ ] Navigate to `/dashboard/prescriptions`
- [ ] Verify all uploaded prescriptions are visible
- [ ] Check prescription details (customer, phone, images)
- [ ] Filter by status (Pending, Approved, Rejected)

### Approve Prescription
- [ ] Click on a pending prescription
- [ ] Review prescription images
- [ ] Add prescribed medicines with:
  - Medicine name
  - Dosage
  - Days/duration
- [ ] Approve prescription
- [ ] Verify status changes to "Approved"
- [ ] Check if notification is sent to customer

### Reject Prescription
- [ ] Select a prescription
- [ ] Reject with reason
- [ ] Verify status changes to "Rejected"
- [ ] Check if notification is sent

**Test URL:** `http://localhost:3000/dashboard/prescriptions`

---

## 6️⃣ Banner Management

### Create Banner
- [ ] Navigate to `/dashboard/banners`
- [ ] Click "Add Banner"
- [ ] Upload banner image
- [ ] Set banner title and description
- [ ] Set link URL (if applicable)
- [ ] Set display order/priority
- [ ] Set active/inactive status
- [ ] Save and verify

### Edit Banner
- [ ] Edit existing banner
- [ ] Change image, text, or settings
- [ ] Save and verify changes

### Banner Display Order
- [ ] Change banner order
- [ ] Verify order is reflected on homepage

**Test URL:** `http://localhost:3000/dashboard/banners`

---

## 7️⃣ Customer/User Management

### View Customers
- [ ] Navigate to `/dashboard/users`
- [ ] Verify customer list displays
- [ ] Check customer details (name, phone, email, orders)
- [ ] Search for specific customers

### Customer Order History
- [ ] Click on a customer
- [ ] View their order history
- [ ] Verify all past orders are shown

**Test URL:** `http://localhost:3000/dashboard/users`

---

## 8️⃣ Inventory Management

### Stock Tracking
- [ ] Navigate to inventory section
- [ ] Verify current stock levels
- [ ] Check low stock alerts
- [ ] Test stock movement history

### Stock Adjustments
- [ ] Manually adjust stock for a product
- [ ] Add stock (restock)
- [ ] Reduce stock (damage/loss)
- [ ] Verify changes are logged

**Test URL:** `http://localhost:3000/dashboard/inventory` (if exists)

---

## 9️⃣ Notifications System

### View Notifications
- [ ] Check notification bell icon
- [ ] Verify unread count is accurate
- [ ] Click to view notifications
- [ ] Test different notification types:
  - New order
  - Prescription uploaded
  - Low stock alert
  - Order status change

### Mark as Read
- [ ] Click on a notification
- [ ] Verify it's marked as read
- [ ] Check unread count decreases

### Notification Actions
- [ ] Click notification to navigate to related item
- [ ] Verify correct page/item is opened

---

## 🔟 WhatsApp Integration

### WhatsApp Notifications
- [ ] Trigger an event that sends WhatsApp message:
  - Order confirmation
  - Order status update
  - Prescription approval
- [ ] Verify message is sent (check WhatsApp)
- [ ] Verify message content is correct
- [ ] Check message delivery status in CRM

**Note:** Requires WhatsApp Business API setup

---

## 1️⃣1️⃣ E-Commerce Frontend Testing

### Homepage
- [ ] Navigate to `http://localhost:3000`
- [ ] Verify all sections load:
  - Hero/Banner section
  - Shop by Health Concern
  - Trust badges
  - Offer banners
  - Offers section
  - Prescription upload section
- [ ] Test banner carousel/slideshow
- [ ] Test mobile responsiveness (360px-430px)
- [ ] Verify no horizontal scrolling on mobile

### Product Browsing
- [ ] Browse products by category
- [ ] Test product search
- [ ] View product details
- [ ] Test image gallery/carousel
- [ ] Verify pricing displays correctly

### Shopping Cart
- [ ] Add products to cart
- [ ] Update quantities
- [ ] Remove items
- [ ] Verify cart total calculations
- [ ] Test cart persistence (refresh page)

### Checkout Process
- [ ] Proceed to checkout
- [ ] Fill in delivery information
- [ ] Add customer notes/medication notes
- [ ] Review order summary
- [ ] Place order
- [ ] Verify order confirmation

### Prescription Upload (Customer Side)
- [ ] Navigate to prescription upload page
- [ ] Test camera capture (mobile)
- [ ] Test file upload
- [ ] Enter customer details (name, phone)
- [ ] Add medication notes
- [ ] Submit prescription
- [ ] Verify success message
- [ ] Check if prescription appears in CRM

### Location Services
- [ ] Test location detection
- [ ] Verify address display
- [ ] Test manual address entry

**Test URLs:**
- `http://localhost:3000` (Homepage)
- `http://localhost:3000/category/[category-slug]`
- `http://localhost:3000/cart`
- `http://localhost:3000/checkout`
- `http://localhost:3000/upload-prescription`

---

## 1️⃣2️⃣ Edge Cases & Error Handling

### Network Issues
- [ ] Test with slow network (throttle in DevTools)
- [ ] Test offline behavior
- [ ] Verify loading states display correctly
- [ ] Test error messages for failed requests

### Invalid Data
- [ ] Submit forms with invalid data
- [ ] Test SQL injection attempts (should be blocked)
- [ ] Test XSS attempts (should be sanitized)
- [ ] Upload invalid file types
- [ ] Upload oversized files

### Concurrent Operations
- [ ] Open multiple tabs
- [ ] Make changes in different tabs
- [ ] Verify data consistency
- [ ] Test race conditions (multiple users editing same item)

### Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Test on mobile browsers (iOS Safari, Chrome Mobile)

---

## 1️⃣3️⃣ Performance Testing

### Page Load Times
- [ ] Measure homepage load time
- [ ] Measure dashboard load time
- [ ] Check product list load time with many products
- [ ] Test image loading performance

### Database Queries
- [ ] Monitor Firestore read/write operations
- [ ] Check for unnecessary queries
- [ ] Verify pagination is working
- [ ] Test with large datasets

### Image Optimization
- [ ] Verify images are loading correctly
- [ ] Check image sizes
- [ ] Test lazy loading (if implemented)

---

## 1️⃣4️⃣ Security Testing

### Authentication
- [ ] Test unauthorized access to admin pages
- [ ] Verify session timeout
- [ ] Test password requirements
- [ ] Check for exposed API keys (should be in .env)

### Data Validation
- [ ] Test input sanitization
- [ ] Verify server-side validation
- [ ] Check for exposed sensitive data in responses

### Firestore Security Rules
- [ ] Test read/write permissions
- [ ] Verify users can't access other users' data
- [ ] Test admin-only operations

---

## 📊 Testing Checklist Summary

### Critical Features (Must Work)
- [ ] User login/logout
- [ ] Add/Edit/Delete products
- [ ] View and manage orders
- [ ] Update order status
- [ ] Inventory auto-reduction on delivery
- [ ] Prescription upload and approval
- [ ] Customer checkout process
- [ ] WhatsApp notifications

### Important Features (Should Work)
- [ ] Product search and filtering
- [ ] Category management
- [ ] Banner management
- [ ] Customer management
- [ ] Notification system
- [ ] Mobile responsiveness

### Nice-to-Have Features
- [ ] Advanced analytics
- [ ] Bulk operations
- [ ] Export functionality
- [ ] Advanced reporting

---

## 🐛 Bug Reporting Template

When you find a bug, document it with:

```
**Bug Title:** [Short description]

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. Enter...
4. See error

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots/Error Messages:**
[Paste console errors or screenshots]

**Environment:**
- Browser: [Chrome/Firefox/etc.]
- Device: [Desktop/Mobile]
- URL: [Page where bug occurred]
```

---

## 🚀 Recommended Testing Order

1. **Start with Authentication** - Ensure you can access the system
2. **Test Product Management** - Core functionality
3. **Test Order Flow** - Critical business process
4. **Test Prescription Workflow** - Unique feature
5. **Test E-Commerce Frontend** - Customer-facing
6. **Test Notifications & WhatsApp** - Communication
7. **Test Edge Cases** - Robustness
8. **Performance & Security** - Production readiness

---

## 📝 Testing Notes

- **Keep browser console open** to catch JavaScript errors
- **Check Network tab** for failed API calls
- **Test on both desktop and mobile** devices
- **Use real data** when possible for realistic testing
- **Document all bugs** immediately
- **Retest after fixes** to ensure issues are resolved

---

## ✅ Production Readiness Checklist

Before going live:
- [ ] All critical features tested and working
- [ ] No console errors on any page
- [ ] Mobile responsiveness verified
- [ ] Performance is acceptable
- [ ] Security measures in place
- [ ] Backup strategy implemented
- [ ] Error handling is graceful
- [ ] User feedback is clear and helpful
- [ ] WhatsApp integration is working
- [ ] Payment gateway tested (if applicable)

---

## 🎯 Quick Test Scenarios

### Scenario 1: New Order Flow
1. Customer uploads prescription → 2. Admin approves → 3. Customer receives notification → 4. Customer places order → 5. Admin processes order → 6. Stock reduces automatically

### Scenario 2: Product Management
1. Add new product → 2. Upload images → 3. Set pricing → 4. Publish → 5. Verify on frontend → 6. Customer can purchase

### Scenario 3: Inventory Management
1. Check stock levels → 2. Order is delivered → 3. Stock auto-reduces → 4. Low stock alert triggers → 5. Admin restocks → 6. Stock updated

---

**Happy Testing! 🧪**

*Last Updated: December 29, 2025*
