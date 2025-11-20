# Fix: "Missing or insufficient permissions" When Adding Products

## Problem

You're getting "Failed to add product: Missing or insufficient permissions" when trying to add a product in the CRM.

## Root Cause

Firestore security rules require users to have `admin` or `manager` role to create products. Your current user account doesn't have this role set.

## Solution Options

### Option 1: Set Your User as Admin (Recommended)

1. **Go to Firebase Console:**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to **Firestore Database**

2. **Find Your User Document:**
   - Open the `users` collection
   - Find the document with your user ID (from Firebase Auth)
   - If you don't see your user document, you need to log out and log back in first (the auth service will create it)

3. **Set Admin Role:**
   - Click on your user document
   - Edit the `role` field
   - Change it to `"admin"` (with quotes)
   - Click **Update**

4. **Refresh Your CRM:**
   - Go back to your CRM
   - Refresh the page
   - Try adding a product again

### Option 2: Log Out and Log Back In

If you're the first user, the auth service should automatically set you as admin:

1. **Log out** from the CRM
2. **Log back in**
3. The auth service will:
   - Create your user document if it doesn't exist
   - Set you as `admin` if you're the first user
4. Try adding a product again

### Option 3: Verify Your User Document Exists

1. **Check Firebase Console:**
   - Go to Firestore Database → `users` collection
   - Look for a document with your Firebase Auth user ID

2. **If document doesn't exist:**
   - Log out and log back in
   - The auth service will create it automatically

3. **If document exists but no role:**
   - Edit the document
   - Add field: `role` = `"admin"`
   - Save

## Quick Check: Verify Your Role

Run this in your browser console (F12) while logged into CRM:

```javascript
// Get your user ID
import { auth } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const user = auth.currentUser
if (user) {
  const userDoc = await getDoc(doc(db, 'users', user.uid))
  console.log('Your role:', userDoc.data()?.role)
  console.log('Is admin?', userDoc.data()?.role === 'admin' || userDoc.data()?.role === 'manager')
}
```

## Expected User Document Structure

Your user document in Firestore should look like this:

```json
{
  "id": "your-user-id",
  "email": "your@email.com",
  "displayName": "Your Name",
  "role": "admin",  // ← This must be "admin" or "manager"
  "isBlocked": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## After Fixing

Once you've set your role to `admin`:

1. ✅ Refresh the CRM page
2. ✅ Try adding a product again
3. ✅ It should work now!

## Why This Happens

The Firestore security rules check:
1. User is authenticated ✓
2. User document exists in `users` collection ✓
3. User's `role` field is `'admin'` or `'manager'` ✗ (This is likely missing)

If any of these fail, the write operation is blocked.

## Still Having Issues?

1. **Check browser console** for detailed error messages
2. **Verify you're logged in** - check if `auth.currentUser` exists
3. **Check Firestore rules are deployed** - go to Firebase Console → Firestore → Rules
4. **Try in incognito mode** - to rule out cache issues


