# Quick Start Guide: Inventory Stock Management

## 🚀 How to Use the Automatic Stock Reduction System

### Step 1: View Orders
1. Navigate to **Dashboard → Orders**
2. You'll see a list of all orders

### Step 2: Mark Order as Delivered
1. Find the order you want to mark as delivered
2. Click the **Edit** button (blue pencil icon)
3. Change the **Delivery Status** dropdown to **✅ Delivered**
4. Click the **Save** button (green checkmark)

### Step 3: Automatic Stock Reduction
The system will automatically:
- ✅ Update the order status
- ✅ Reduce inventory stock for all products in the order
- ✅ Create stock movement records
- ✅ Check for low stock conditions
- ✅ Send notifications if products are running low

### Step 4: Confirmation
You'll see a success message:
> **"Order marked as delivered! Inventory stock has been automatically reduced."**

This confirms that the inventory has been updated.

### Step 5: View Stock Changes
1. Click the **View** button (eye icon) on the delivered order
2. Scroll down to see **"Stock Movements for This Order"**
3. You'll see detailed information about what stock was reduced

---

## 📊 Viewing Inventory Levels

### Check Current Stock
1. Navigate to **Dashboard → Inventory**
2. View all products with current stock levels
3. Products are color-coded:
   - 🟢 **Green**: Good stock
   - 🟡 **Yellow**: Low stock (below minimum)
   - 🔴 **Red**: Out of stock

### View Stock Movement History
1. In the Inventory page, click on any product
2. View the **Stock Movement History** section
3. See all changes with:
   - Date and time
   - Type of movement (in/out/adjustment)
   - Quantity changed
   - Reason for change
   - Who made the change

---

## 🔔 Low Stock Notifications

### Automatic Alerts
When stock falls below the minimum level:
1. A notification is automatically created
2. View notifications by clicking the 🔔 bell icon in the top navigation
3. Notifications show:
   - Product name
   - Current stock level
   - Minimum stock level

### Taking Action
1. Click on the notification to view details
2. Navigate to Inventory page
3. Restock the product by clicking **Update Stock**
4. Select **📥 In** as the movement type
5. Enter quantity and reason
6. Click **Save**

---

## 🛠️ Manual Stock Adjustments

### When to Use Manual Adjustments
- Correcting errors
- Adding new stock (restocking)
- Removing damaged/expired items
- Physical inventory count adjustments

### How to Adjust Stock Manually
1. Navigate to **Dashboard → Inventory**
2. Find the product
3. Click **Update Stock**
4. Fill in the form:
   - **Quantity**: Amount to change
   - **Type**: Select from:
     - 📥 **In**: Adding stock (purchase, restock)
     - 📤 **Out**: Removing stock (manual sale)
     - ⚙️ **Adjustment**: Direct correction
     - ⏰ **Expired**: Removing expired items
     - ↩️ **Returned**: Customer returns
     - ⚠️ **Damaged**: Damaged goods
   - **Reason**: Why you're making this change
   - **Notes**: Additional details (optional)
5. Click **Save**

---

## 📋 Order Details View

### What You'll See
When viewing a delivered order:

1. **Order Summary**
   - Order ID
   - Date
   - Payment method
   - Delivery status

2. **Customer Information**
   - Name
   - Phone number

3. **Products List**
   - Product names
   - Quantities
   - Prices
   - Categories

4. **Stock Movements** (for delivered orders)
   - Shows exactly what stock was reduced
   - Quantity changes
   - Previous and new stock levels
   - Date and time of change
   - Who made the change

5. **Total Amount**
   - Final order total

---

## ⚠️ Important Notes

### Stock Validation
- The system checks if sufficient stock is available
- If stock is low, you'll see a warning in the console
- Currently, the system allows delivery even if stock is insufficient
- Stock movements are still recorded for audit purposes

### Error Handling
- If stock reduction fails, the order status is still updated
- You'll see an error in the browser console
- You can manually adjust stock in the Inventory page

### Audit Trail
- Every stock change is permanently recorded
- You can always review the history
- Includes who made the change and why

---

## 🎯 Best Practices

### 1. Set Minimum Stock Levels
- For each product, set a `minStockLevel`
- System will alert you when stock falls below this
- Recommended: Set to 10-20 units depending on product

### 2. Regular Stock Audits
- Periodically review stock levels
- Compare physical inventory with system
- Use "Adjustment" type to correct discrepancies

### 3. Monitor Notifications
- Check notifications daily
- Respond to low stock alerts promptly
- Restock before items run out

### 4. Review Stock Movements
- Check stock movement history regularly
- Look for unusual patterns
- Verify automatic reductions are correct

### 5. Document Changes
- Always provide clear reasons for manual adjustments
- Add notes for future reference
- Helps with auditing and troubleshooting

---

## 🆘 Troubleshooting

### Stock Didn't Reduce
**Problem**: Order marked as delivered but stock didn't change

**Solution**:
1. Check browser console for errors (F12)
2. Verify product has a valid Product ID
3. Check stock movement history
4. Manually adjust stock if needed

### Can't Find Stock Movements
**Problem**: Stock movements not showing in order details

**Solution**:
1. Ensure order is marked as "Delivered"
2. Refresh the page
3. Check that products have valid Product IDs

### Low Stock Alert Not Showing
**Problem**: Not receiving low stock notifications

**Solution**:
1. Verify `minStockLevel` is set for the product
2. Check Notifications page (🔔 bell icon)
3. Ensure stock is actually below minimum level

---

## 📞 Need Help?

If you encounter issues:
1. Check the browser console (F12) for error messages
2. Review the stock movement history
3. Verify Firebase connection
4. Check that you have proper permissions

For detailed technical documentation, see:
- `docs/INVENTORY_SYSTEM.md` - Complete system documentation
- `docs/INVENTORY_IMPLEMENTATION_SUMMARY.md` - Implementation details

---

## ✨ Summary

**The inventory system is now fully automated!**

When you mark an order as delivered:
1. ✅ Stock is automatically reduced
2. ✅ Movement records are created
3. ✅ Low stock alerts are sent
4. ✅ You can view the history

**No manual stock updates needed!** 🎉

Just mark orders as delivered and the system handles the rest.
