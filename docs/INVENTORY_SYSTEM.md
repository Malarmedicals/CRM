# Inventory Management System - Documentation

## Overview
The inventory management system automatically tracks and updates stock levels when orders are processed. Stock is automatically reduced when orders are marked as **delivered**.

## Features

### 1. Automatic Stock Reduction
- When an order's delivery status changes to `'delivered'`, the system automatically:
  - Validates stock availability
  - Reduces stock quantities for all products in the order
  - Creates stock movement records for audit trail
  - Checks for low stock conditions
  - Sends notifications if products fall below minimum stock levels

### 2. Stock Movement Tracking
Every stock change is logged with:
- Product ID and name
- Movement type (`in`, `out`, `adjustment`, `expired`, `returned`, `damaged`)
- Quantity changed
- Reason for change
- User who performed the action
- Previous and new stock levels
- Timestamp
- Optional notes

### 3. Low Stock Alerts
The system automatically:
- Monitors stock levels after each order delivery
- Compares current stock against minimum stock levels
- Creates notifications when products fall below threshold
- Displays alerts in the CRM dashboard

## How It Works

### Order Delivery Flow

```
1. Admin marks order as "Delivered" in Orders page
   ↓
2. System validates stock availability
   ↓
3. Order status is updated in database
   ↓
4. Stock is reduced for each product in the order
   ↓
5. Stock movement records are created
   ↓
6. Low stock check is performed
   ↓
7. Notifications are sent if needed
   ↓
8. Success message shown to admin
```

### Stock Movement Types

| Type | Description | Stock Change |
|------|-------------|--------------|
| `in` | Stock added (purchase, restock) | Increases |
| `out` | Stock removed (order delivered) | Decreases |
| `adjustment` | Manual correction | Direct set |
| `expired` | Expired products removed | Decreases |
| `returned` | Customer returns | Increases |
| `damaged` | Damaged goods removed | Decreases |

## Usage Guide

### Marking an Order as Delivered

1. Navigate to **Dashboard → Orders**
2. Find the order you want to mark as delivered
3. Click the **Edit** button
4. Change **Delivery Status** to **Delivered**
5. Click **Save**
6. System will:
   - Update the order status
   - Automatically reduce inventory stock
   - Show confirmation: *"Order marked as delivered! Inventory stock has been automatically reduced."*

### Viewing Stock Movements

1. Navigate to **Dashboard → Inventory**
2. Click on any product
3. View the **Stock Movement History** section
4. See all stock changes with:
   - Date and time
   - Type of movement
   - Quantity changed
   - Reason
   - Who made the change
   - Previous and new stock levels

### Manual Stock Adjustment

1. Navigate to **Dashboard → Inventory**
2. Find the product
3. Click **Update Stock**
4. Enter:
   - Quantity
   - Movement type
   - Reason
   - Optional notes
5. Click **Save**

## API Reference

### Inventory Integration Service

Located at: `src/features/orders/inventory-integration-service.ts`

#### Methods

##### `reduceStockForOrder(order: Order): Promise<void>`
Reduces stock for all products in an order when it's delivered.

**Parameters:**
- `order`: The order object containing products to reduce stock for

**Throws:**
- Error if product ID is missing
- Error if stock reduction fails for any product

**Example:**
```typescript
await inventoryIntegrationService.reduceStockForOrder(order)
```

##### `restoreStockForOrder(order: Order): Promise<void>`
Restores stock for an order (e.g., when cancelled after delivery).

**Parameters:**
- `order`: The order object containing products to restore stock for

##### `validateStockForDelivery(order: Order): Promise<{valid: boolean, errors: string[]}>`
Validates if sufficient stock is available before marking order as delivered.

**Returns:**
```typescript
{
  valid: boolean,      // true if all products have sufficient stock
  errors: string[]     // array of error messages if validation fails
}
```

**Example:**
```typescript
const validation = await inventoryIntegrationService.validateStockForDelivery(order)
if (!validation.valid) {
  console.error('Insufficient stock:', validation.errors)
}
```

##### `checkAndNotifyLowStock(products: OrderItem[]): Promise<void>`
Checks if any products are low stock and creates notifications.

### Inventory Service

Located at: `src/features/products/inventory-service.ts`

#### Methods

##### `updateStock(productId, quantity, type, reason, notes?): Promise<void>`
Updates stock quantity and creates movement record.

**Parameters:**
- `productId`: Product ID
- `quantity`: Amount to change
- `type`: Movement type (`'in' | 'out' | 'adjustment' | 'expired' | 'returned' | 'damaged'`)
- `reason`: Reason for stock change
- `notes`: Optional additional notes

**Example:**
```typescript
await inventoryService.updateStock(
  'product123',
  10,
  'out',
  'Order delivered: #ABC12345',
  'Automatic stock reduction'
)
```

##### `getLowStockProducts(): Promise<Product[]>`
Gets all products with stock below minimum level.

##### `getOutOfStockProducts(): Promise<Product[]>`
Gets all products with zero stock.

##### `getStockMovements(productId?, limitCount?): Promise<StockMovement[]>`
Gets stock movement history for a product or all products.

## Database Schema

### Stock Movements Collection (`stockMovements`)

```typescript
{
  id: string                    // Auto-generated
  productId: string             // Reference to product
  productName: string           // Product name (denormalized)
  type: string                  // Movement type
  quantity: number              // Amount changed
  reason: string                // Why the change was made
  orderId?: string              // Related order ID (if applicable)
  performedBy: string           // User ID who made the change
  performedByName?: string      // User display name
  previousStock: number         // Stock before change
  newStock: number              // Stock after change
  timestamp: Date               // When the change occurred
  notes?: string                // Additional notes
}
```

### Products Collection (`products`)

Relevant fields:
```typescript
{
  stockQuantity: number         // Current stock level
  minStockLevel?: number        // Minimum threshold (default: 10)
  maxStockLevel?: number        // Maximum capacity
  lastRestocked?: Date          // Last time stock was added
  // ... other product fields
}
```

## Error Handling

### Stock Reduction Errors

If stock reduction fails:
1. Error is logged to console
2. Order status remains as "delivered"
3. Admin can manually adjust stock in Inventory page
4. Stock movement can be reviewed in history

### Validation Warnings

If stock validation fails (insufficient stock):
1. Warning is logged to console
2. Order can still be marked as delivered (configurable)
3. Admin is notified of the issue
4. Can be configured to prevent delivery if stock is insufficient

## Configuration

### Enable Strict Stock Validation

To prevent orders from being delivered if stock is insufficient, uncomment this line in `order-service.ts`:

```typescript
if (!validation.valid) {
  throw new Error(`Cannot deliver order: ${validation.errors.join(', ')}`)
}
```

### Revert Order on Stock Reduction Failure

To automatically revert order status if stock reduction fails, uncomment this section in `order-service.ts`:

```typescript
await updateDoc(doc(db, 'orders', id), {
  deliveryStatus: previousDeliveryStatus,
  updatedAt: Timestamp.now(),
})
throw new Error(`Order updated but stock reduction failed: ${stockError.message}`)
```

## Best Practices

1. **Regular Stock Audits**: Periodically review stock movements to ensure accuracy
2. **Set Minimum Stock Levels**: Configure `minStockLevel` for each product
3. **Monitor Notifications**: Check low stock alerts regularly
4. **Review Failed Reductions**: Check console logs for any stock reduction failures
5. **Manual Adjustments**: Use the adjustment type for corrections, not `in` or `out`

## Troubleshooting

### Stock Not Reducing

**Problem**: Order marked as delivered but stock didn't reduce

**Solutions**:
1. Check browser console for errors
2. Verify product has valid `productId` in order
3. Check stock movement history for the product
4. Manually adjust stock if needed

### Insufficient Stock Warning

**Problem**: Warning about insufficient stock when marking as delivered

**Solutions**:
1. Check current stock levels in Inventory page
2. Restock the product before delivery
3. Or configure system to allow delivery anyway (current default)

### Low Stock Notifications Not Appearing

**Problem**: Not receiving low stock alerts

**Solutions**:
1. Verify `minStockLevel` is set for products
2. Check Notifications page for alerts
3. Ensure notification service is working

## Future Enhancements

Potential improvements:
- Automatic reorder when stock falls below threshold
- Stock reservation when order is placed (before delivery)
- Batch/lot tracking for medicines with expiry dates
- Multi-warehouse support
- Stock forecasting based on sales trends
- Barcode scanning for stock updates
- Integration with suppliers for automatic reordering

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Review stock movement history
3. Verify Firebase permissions
4. Check network connectivity
