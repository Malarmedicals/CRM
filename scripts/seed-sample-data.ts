/**
 * Sample Data Seeding Script for Malar CRM
 * 
 * This script populates Firestore with realistic test data for:
 * - Users (Customers & Admin)
 * - Products
 * - Categories
 * - Orders
 * - Prescriptions
 * - Inventory
 * - Notifications
 * - Banners
 * 
 * Run with: npx tsx scripts/seed-sample-data.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// Initialize Firebase Admin (only if not already initialized)
if (!getApps().length) {
    console.log('🔍 Debugging environment variables:')
    console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
    console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL)
    console.log('Private Key exists:', !!process.env.FIREBASE_PRIVATE_KEY)
    console.log('Private Key length:', process.env.FIREBASE_PRIVATE_KEY?.length)

    initializeApp({
        credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    })
}

const db = getFirestore()
const auth = getAuth()

// Helper function to generate random date within last 30 days
function randomRecentDate(daysAgo: number = 30): Date {
    const now = new Date()
    const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()))
}

// Sample Categories
const categories = [
    {
        id: 'pain-relief',
        name: 'Pain Relief',
        slug: 'pain-relief',
        description: 'Medicines for pain management',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/placeholder/pain-relief.jpg',
        subcategories: ['Headache', 'Body Pain', 'Joint Pain', 'Muscle Pain'],
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: 'vitamins-supplements',
        name: 'Vitamins & Supplements',
        slug: 'vitamins-supplements',
        description: 'Essential vitamins and dietary supplements',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/placeholder/vitamins.jpg',
        subcategories: ['Multivitamins', 'Vitamin D', 'Calcium', 'Omega-3', 'Protein'],
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: 'diabetes-care',
        name: 'Diabetes Care',
        slug: 'diabetes-care',
        description: 'Products for diabetes management',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/placeholder/diabetes.jpg',
        subcategories: ['Blood Glucose Monitors', 'Insulin', 'Test Strips', 'Diabetic Supplements'],
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: 'cold-cough',
        name: 'Cold & Cough',
        slug: 'cold-cough',
        description: 'Relief from cold and cough symptoms',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/placeholder/cold-cough.jpg',
        subcategories: ['Cough Syrup', 'Lozenges', 'Nasal Spray', 'Decongestants'],
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: 'skin-care',
        name: 'Skin Care',
        slug: 'skin-care',
        description: 'Dermatological and skin care products',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/placeholder/skincare.jpg',
        subcategories: ['Moisturizers', 'Sunscreen', 'Anti-Acne', 'Anti-Aging'],
        isActive: true,
        createdAt: Timestamp.now(),
    },
]

// Sample Products
const products = [
    {
        id: 'dolo-650',
        name: 'Dolo 650 Tablet',
        category: 'Pain Relief',
        subcategory: 'Headache',
        description: 'Paracetamol 650mg tablets for fever and pain relief. Effective for headaches, body pain, and fever.',
        mrp: 35.00,
        price: 30.00,
        discount: 14,
        stockQuantity: 500,
        unit: 'strip',
        manufacturer: 'Micro Labs',
        prescriptionRequired: false,
        primaryImage: 'https://5.imimg.com/data5/SELLER/Default/2021/6/NP/XQ/LC/12976451/dolo-650-tablet-500x500.jpg',
        additionalImages: [],
        tags: ['fever', 'pain relief', 'paracetamol', 'headache'],
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: 'crocin-advance',
        name: 'Crocin Advance Tablet',
        category: 'Pain Relief',
        subcategory: 'Headache',
        description: 'Fast relief from headache and body pain. Contains Paracetamol with Optizorb technology.',
        mrp: 40.00,
        price: 36.00,
        discount: 10,
        stockQuantity: 350,
        unit: 'strip',
        manufacturer: 'GSK',
        prescriptionRequired: false,
        primaryImage: 'https://m.media-amazon.com/images/I/61k7u5i4GLL._AC_UF1000,1000_QL80_.jpg',
        additionalImages: [],
        tags: ['fever', 'pain relief', 'paracetamol'],
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: 'vitamin-d3',
        name: 'Vitamin D3 60K Capsules',
        category: 'Vitamins & Supplements',
        subcategory: 'Vitamin D',
        description: 'Cholecalciferol 60,000 IU capsules for Vitamin D deficiency.',
        mrp: 85.00,
        price: 75.00,
        discount: 12,
        stockQuantity: 200,
        unit: 'capsule',
        manufacturer: 'Sun Pharma',
        prescriptionRequired: true,
        primaryImage: 'https://m.media-amazon.com/images/I/61M-FwO-bIL._SX679_.jpg',
        additionalImages: [],
        tags: ['vitamin d', 'supplements', 'bone health'],
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: 'metformin-500',
        name: 'Metformin 500mg Tablets',
        category: 'Diabetes Care',
        subcategory: 'Insulin',
        description: 'Oral anti-diabetic medication for type 2 diabetes management.',
        mrp: 45.00,
        price: 38.00,
        discount: 16,
        stockQuantity: 150,
        unit: 'strip',
        manufacturer: 'Cipla',
        prescriptionRequired: true,
        primaryImage: 'https://m.media-amazon.com/images/I/41-i2aWbVPL._SX300_SY300_QL70_FMwebp_.jpg',
        additionalImages: [],
        tags: ['diabetes', 'blood sugar', 'metformin'],
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: 'vicks-cough-syrup',
        name: 'Vicks Cough Syrup',
        category: 'Cold & Cough',
        subcategory: 'Cough Syrup',
        description: 'Relief from dry and wet cough. Honey-based formula.',
        mrp: 120.00,
        price: 108.00,
        discount: 10,
        stockQuantity: 80,
        unit: 'bottle',
        manufacturer: 'P&G',
        prescriptionRequired: false,
        primaryImage: 'https://m.media-amazon.com/images/I/61VqZJLxONL._SX679_.jpg',
        additionalImages: [],
        tags: ['cough', 'cold', 'syrup'],
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: 'cetaphil-moisturizer',
        name: 'Cetaphil Moisturizing Cream',
        category: 'Skin Care',
        subcategory: 'Moisturizers',
        description: 'Gentle moisturizing cream for dry and sensitive skin.',
        mrp: 599.00,
        price: 499.00,
        discount: 17,
        stockQuantity: 45,
        unit: 'tube',
        manufacturer: 'Galderma',
        prescriptionRequired: false,
        primaryImage: 'https://m.media-amazon.com/images/I/51qXH0YmKkL._SX679_.jpg',
        additionalImages: [],
        tags: ['moisturizer', 'skincare', 'dry skin'],
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: 'revital-h',
        name: 'Revital H Multivitamin',
        category: 'Vitamins & Supplements',
        subcategory: 'Multivitamins',
        description: 'Daily health supplement with vitamins, minerals, and ginseng.',
        mrp: 450.00,
        price: 385.00,
        discount: 14,
        stockQuantity: 120,
        unit: 'bottle',
        manufacturer: 'Ranbaxy',
        prescriptionRequired: false,
        primaryImage: 'https://m.media-amazon.com/images/I/71ZqJPqH0LL._SX679_.jpg',
        additionalImages: [],
        tags: ['multivitamin', 'energy', 'immunity'],
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: 'ibuprofen-400',
        name: 'Ibuprofen 400mg Tablets',
        category: 'Pain Relief',
        subcategory: 'Body Pain',
        description: 'Anti-inflammatory pain reliever for body pain and inflammation.',
        mrp: 55.00,
        price: 48.00,
        discount: 13,
        stockQuantity: 8,
        unit: 'strip',
        manufacturer: 'Dr. Reddy\'s',
        prescriptionRequired: false,
        primaryImage: 'https://m.media-amazon.com/images/I/61xQqH9YQYL._SX679_.jpg',
        additionalImages: [],
        tags: ['pain relief', 'anti-inflammatory', 'ibuprofen'],
        isActive: true,
        createdAt: Timestamp.now(),
    },
]

// Sample Users
const users = [
    {
        uid: 'admin-001',
        email: 'admin@malarmedicals.com',
        phoneNumber: '+919876543210',
        displayName: 'Admin User',
        role: 'admin',
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        uid: 'customer-001',
        phoneNumber: '+919876543211',
        displayName: 'Rajesh Kumar',
        email: 'rajesh.kumar@example.com',
        role: 'customer',
        isActive: true,
        createdAt: Timestamp.now(),
        address: {
            street: '123, MG Road',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600001',
            landmark: 'Near Apollo Hospital',
        },
    },
    {
        uid: 'customer-002',
        phoneNumber: '+919876543212',
        displayName: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        role: 'customer',
        isActive: true,
        createdAt: Timestamp.now(),
        address: {
            street: '45, Anna Salai',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600002',
            landmark: 'Opposite to Reliance Fresh',
        },
    },
    {
        uid: 'customer-003',
        phoneNumber: '+919876543213',
        displayName: 'Amit Patel',
        email: 'amit.patel@example.com',
        role: 'customer',
        isActive: true,
        createdAt: Timestamp.now(),
        address: {
            street: '78, T Nagar Main Road',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600017',
            landmark: 'Near Panagal Park',
        },
    },
    {
        uid: 'customer-004',
        phoneNumber: '+919876543214',
        displayName: 'Lakshmi Iyer',
        email: 'lakshmi.iyer@example.com',
        role: 'customer',
        isActive: true,
        createdAt: Timestamp.now(),
        address: {
            street: '12, Adyar Main Road',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600020',
            landmark: 'Near Adyar Bakery',
        },
    },
]

// Sample Orders
const orders = [
    {
        id: 'ORD-001',
        userId: 'customer-001',
        customerName: 'Rajesh Kumar',
        customerPhone: '+919876543211',
        customerEmail: 'rajesh.kumar@example.com',
        items: [
            {
                productId: 'dolo-650',
                productName: 'Dolo 650 Tablet',
                quantity: 2,
                price: 30.00,
                total: 60.00,
            },
            {
                productId: 'vitamin-d3',
                productName: 'Vitamin D3 60K Capsules',
                quantity: 1,
                price: 75.00,
                total: 75.00,
            },
        ],
        subtotal: 135.00,
        deliveryCharges: 0,
        total: 135.00,
        status: 'delivered',
        deliveryAddress: {
            street: '123, MG Road',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600001',
            landmark: 'Near Apollo Hospital',
        },
        paymentMethod: 'cod',
        paymentStatus: 'paid',
        createdAt: Timestamp.fromDate(randomRecentDate(15)),
        updatedAt: Timestamp.fromDate(randomRecentDate(10)),
        deliveredAt: Timestamp.fromDate(randomRecentDate(8)),
    },
    {
        id: 'ORD-002',
        userId: 'customer-002',
        customerName: 'Priya Sharma',
        customerPhone: '+919876543212',
        customerEmail: 'priya.sharma@example.com',
        items: [
            {
                productId: 'crocin-advance',
                productName: 'Crocin Advance Tablet',
                quantity: 3,
                price: 36.00,
                total: 108.00,
            },
            {
                productId: 'vicks-cough-syrup',
                productName: 'Vicks Cough Syrup',
                quantity: 1,
                price: 108.00,
                total: 108.00,
            },
        ],
        subtotal: 216.00,
        deliveryCharges: 0,
        total: 216.00,
        status: 'processing',
        deliveryAddress: {
            street: '45, Anna Salai',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600002',
            landmark: 'Opposite to Reliance Fresh',
        },
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        createdAt: Timestamp.fromDate(randomRecentDate(5)),
        updatedAt: Timestamp.fromDate(randomRecentDate(3)),
    },
    {
        id: 'ORD-003',
        userId: 'customer-003',
        customerName: 'Amit Patel',
        customerPhone: '+919876543213',
        customerEmail: 'amit.patel@example.com',
        items: [
            {
                productId: 'metformin-500',
                productName: 'Metformin 500mg Tablets',
                quantity: 2,
                price: 38.00,
                total: 76.00,
            },
        ],
        subtotal: 76.00,
        deliveryCharges: 0,
        total: 76.00,
        status: 'pending',
        deliveryAddress: {
            street: '78, T Nagar Main Road',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600017',
            landmark: 'Near Panagal Park',
        },
        paymentMethod: 'online',
        paymentStatus: 'pending',
        prescriptionRequired: true,
        prescriptionId: 'PRESC-001',
        createdAt: Timestamp.fromDate(randomRecentDate(2)),
        updatedAt: Timestamp.fromDate(randomRecentDate(2)),
    },
    {
        id: 'ORD-004',
        userId: 'customer-004',
        customerName: 'Lakshmi Iyer',
        customerPhone: '+919876543214',
        customerEmail: 'lakshmi.iyer@example.com',
        items: [
            {
                productId: 'cetaphil-moisturizer',
                productName: 'Cetaphil Moisturizing Cream',
                quantity: 1,
                price: 499.00,
                total: 499.00,
            },
            {
                productId: 'revital-h',
                productName: 'Revital H Multivitamin',
                quantity: 1,
                price: 385.00,
                total: 385.00,
            },
        ],
        subtotal: 884.00,
        deliveryCharges: 0,
        total: 884.00,
        status: 'shipped',
        deliveryAddress: {
            street: '12, Adyar Main Road',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600020',
            landmark: 'Near Adyar Bakery',
        },
        paymentMethod: 'online',
        paymentStatus: 'paid',
        createdAt: Timestamp.fromDate(randomRecentDate(7)),
        updatedAt: Timestamp.fromDate(randomRecentDate(4)),
    },
]

// Sample Prescriptions
const prescriptions = [
    {
        id: 'PRESC-001',
        userId: 'customer-003',
        customerName: 'Amit Patel',
        customerPhone: '+919876543213',
        imageUrls: [
            'https://firebasestorage.googleapis.com/v0/b/placeholder/prescription-1.jpg',
        ],
        status: 'approved',
        customerNotes: 'Need medicines for diabetes management',
        prescribedMedicines: [
            {
                name: 'Metformin 500mg',
                dosage: '1 tablet',
                days: '30',
            },
            {
                name: 'Glimepiride 2mg',
                dosage: '1 tablet',
                days: '30',
            },
        ],
        createdAt: Timestamp.fromDate(randomRecentDate(10)),
        updatedAt: Timestamp.fromDate(randomRecentDate(8)),
        approvedAt: Timestamp.fromDate(randomRecentDate(8)),
    },
    {
        id: 'PRESC-002',
        userId: 'customer-001',
        customerName: 'Rajesh Kumar',
        customerPhone: '+919876543211',
        imageUrls: [
            'https://firebasestorage.googleapis.com/v0/b/placeholder/prescription-2.jpg',
        ],
        status: 'pending',
        customerNotes: 'Urgent - need pain relief medicines',
        createdAt: Timestamp.fromDate(randomRecentDate(3)),
        updatedAt: Timestamp.fromDate(randomRecentDate(3)),
    },
    {
        id: 'PRESC-003',
        userId: 'customer-002',
        customerName: 'Priya Sharma',
        customerPhone: '+919876543212',
        imageUrls: [
            'https://firebasestorage.googleapis.com/v0/b/placeholder/prescription-3.jpg',
        ],
        status: 'rejected',
        customerNotes: 'Skin allergy treatment',
        rejectionReason: 'Prescription image is not clear. Please upload a clearer image.',
        createdAt: Timestamp.fromDate(randomRecentDate(12)),
        updatedAt: Timestamp.fromDate(randomRecentDate(11)),
        rejectedAt: Timestamp.fromDate(randomRecentDate(11)),
    },
]

// Sample Inventory Movements
const inventoryMovements = [
    {
        id: 'INV-001',
        productId: 'dolo-650',
        productName: 'Dolo 650 Tablet',
        type: 'sale',
        quantity: -2,
        previousStock: 502,
        newStock: 500,
        orderId: 'ORD-001',
        reason: 'Order delivered',
        createdAt: Timestamp.fromDate(randomRecentDate(8)),
    },
    {
        id: 'INV-002',
        productId: 'vitamin-d3',
        productName: 'Vitamin D3 60K Capsules',
        type: 'sale',
        quantity: -1,
        previousStock: 201,
        newStock: 200,
        orderId: 'ORD-001',
        reason: 'Order delivered',
        createdAt: Timestamp.fromDate(randomRecentDate(8)),
    },
    {
        id: 'INV-003',
        productId: 'ibuprofen-400',
        productName: 'Ibuprofen 400mg Tablets',
        type: 'adjustment',
        quantity: -12,
        previousStock: 20,
        newStock: 8,
        reason: 'Damaged stock removed',
        createdAt: Timestamp.fromDate(randomRecentDate(5)),
    },
    {
        id: 'INV-004',
        productId: 'revital-h',
        productName: 'Revital H Multivitamin',
        type: 'restock',
        quantity: 50,
        previousStock: 70,
        newStock: 120,
        reason: 'New stock received',
        createdAt: Timestamp.fromDate(randomRecentDate(14)),
    },
]

// Sample Notifications
const notifications = [
    {
        id: 'NOTIF-001',
        userId: 'admin-001',
        type: 'new_order',
        message: 'New order received from Priya Sharma',
        isRead: false,
        metadata: {
            orderId: 'ORD-002',
            customerName: 'Priya Sharma',
        },
        createdAt: Timestamp.fromDate(randomRecentDate(5)),
    },
    {
        id: 'NOTIF-002',
        userId: 'admin-001',
        type: 'prescription_uploaded',
        message: 'New prescription uploaded by Rajesh Kumar',
        isRead: false,
        metadata: {
            prescriptionId: 'PRESC-002',
            customerName: 'Rajesh Kumar',
        },
        createdAt: Timestamp.fromDate(randomRecentDate(3)),
    },
    {
        id: 'NOTIF-003',
        userId: 'admin-001',
        type: 'low_stock',
        message: 'Low stock alert: Ibuprofen 400mg Tablets (8 items remaining)',
        isRead: true,
        metadata: {
            productId: 'ibuprofen-400',
            productName: 'Ibuprofen 400mg Tablets',
            stockQuantity: 8,
        },
        createdAt: Timestamp.fromDate(randomRecentDate(6)),
    },
    {
        id: 'NOTIF-004',
        userId: 'customer-001',
        type: 'order_delivered',
        message: 'Your order ORD-001 has been delivered',
        isRead: true,
        metadata: {
            orderId: 'ORD-001',
        },
        createdAt: Timestamp.fromDate(randomRecentDate(8)),
    },
    {
        id: 'NOTIF-005',
        userId: 'customer-003',
        type: 'prescription_approved',
        message: 'Your prescription has been approved',
        isRead: false,
        metadata: {
            prescriptionId: 'PRESC-001',
            relatedId: 'PRESC-001',
        },
        createdAt: Timestamp.fromDate(randomRecentDate(8)),
    },
]

// Sample Banners
const banners = [
    {
        id: 'BANNER-001',
        title: 'Mega Health Sale',
        description: 'Up to 30% off on all vitamins and supplements',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/placeholder/banner-1.jpg',
        linkUrl: '/category/vitamins-supplements',
        displayOrder: 1,
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: 'BANNER-002',
        title: 'Free Home Delivery',
        description: 'On orders above ₹500',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/placeholder/banner-2.jpg',
        linkUrl: '/products',
        displayOrder: 2,
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: 'BANNER-003',
        title: 'Upload Prescription',
        description: 'Get your medicines delivered in 24 hours',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/placeholder/banner-3.jpg',
        linkUrl: '/upload-prescription',
        displayOrder: 3,
        isActive: true,
        createdAt: Timestamp.now(),
    },
]

// Seeding Functions
async function seedCategories() {
    console.log('🏷️  Seeding categories...')
    const batch = db.batch()

    categories.forEach((category) => {
        const ref = db.collection('categories').doc(category.id)
        batch.set(ref, category)
    })

    await batch.commit()
    console.log(`✅ Seeded ${categories.length} categories`)
}

async function seedProducts() {
    console.log('📦 Seeding products...')
    const batch = db.batch()

    products.forEach((product) => {
        const ref = db.collection('products').doc(product.id)
        batch.set(ref, product)
    })

    await batch.commit()
    console.log(`✅ Seeded ${products.length} products`)
}

async function seedUsers() {
    console.log('👥 Seeding users...')

    for (const user of users) {
        try {
            // Create auth user if it doesn't exist
            try {
                await auth.getUser(user.uid)
                console.log(`   User ${user.uid} already exists in Auth`)
            } catch (error: any) {
                if (error.code === 'auth/user-not-found') {
                    // Create auth user
                    await auth.createUser({
                        uid: user.uid,
                        email: user.email,
                        phoneNumber: user.phoneNumber,
                        displayName: user.displayName,
                        password: 'Test@123', // Default password for testing
                    })
                    console.log(`   Created auth user: ${user.displayName}`)
                }
            }

            // Create Firestore document
            await db.collection('users').doc(user.uid).set(user)
        } catch (error) {
            console.error(`   Error creating user ${user.uid}:`, error)
        }
    }

    console.log(`✅ Seeded ${users.length} users`)
}

async function seedOrders() {
    console.log('🛒 Seeding orders...')
    const batch = db.batch()

    orders.forEach((order) => {
        const ref = db.collection('orders').doc(order.id)
        batch.set(ref, order)
    })

    await batch.commit()
    console.log(`✅ Seeded ${orders.length} orders`)
}

async function seedPrescriptions() {
    console.log('💊 Seeding prescriptions...')
    const batch = db.batch()

    prescriptions.forEach((prescription) => {
        const ref = db.collection('prescriptions').doc(prescription.id)
        batch.set(ref, prescription)
    })

    await batch.commit()
    console.log(`✅ Seeded ${prescriptions.length} prescriptions`)
}

async function seedInventoryMovements() {
    console.log('📊 Seeding inventory movements...')
    const batch = db.batch()

    inventoryMovements.forEach((movement) => {
        const ref = db.collection('inventory_movements').doc(movement.id)
        batch.set(ref, movement)
    })

    await batch.commit()
    console.log(`✅ Seeded ${inventoryMovements.length} inventory movements`)
}

async function seedNotifications() {
    console.log('🔔 Seeding notifications...')
    const batch = db.batch()

    notifications.forEach((notification) => {
        const ref = db.collection('notifications').doc(notification.id)
        batch.set(ref, notification)
    })

    await batch.commit()
    console.log(`✅ Seeded ${notifications.length} notifications`)
}

async function seedBanners() {
    console.log('🎨 Seeding banners...')
    const batch = db.batch()

    banners.forEach((banner) => {
        const ref = db.collection('banners').doc(banner.id)
        batch.set(ref, banner)
    })

    await batch.commit()
    console.log(`✅ Seeded ${banners.length} banners`)
}

// Main seeding function
async function seedAll() {
    console.log('🌱 Starting database seeding...\n')

    try {
        await seedCategories()
        await seedProducts()
        await seedUsers()
        await seedOrders()
        await seedPrescriptions()
        await seedInventoryMovements()
        await seedNotifications()
        await seedBanners()

        console.log('\n🎉 Database seeding completed successfully!')
        console.log('\n📝 Test Credentials:')
        console.log('   Admin:')
        console.log('   - Email: admin@malarmedicals.com')
        console.log('   - Phone: +919876543210')
        console.log('   - Password: Test@123')
        console.log('\n   Customer (Rajesh Kumar):')
        console.log('   - Email: rajesh.kumar@example.com')
        console.log('   - Phone: +919876543211')
        console.log('   - Password: Test@123')

    } catch (error) {
        console.error('❌ Error seeding database:', error)
        process.exit(1)
    }
}

// Run seeding
seedAll()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
