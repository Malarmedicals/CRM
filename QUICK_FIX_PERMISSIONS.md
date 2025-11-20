# Quick Fix: Firestore Permissions Error

## Immediate Solution

You're getting "Missing or insufficient permissions" because Firestore security rules are blocking access. Here's how to fix it:

### Step 1: Deploy Security Rules (Choose One Method)

#### Method A: Firebase Console (Fastest - 2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Firestore Database** in the left menu
4. Click the **Rules** tab
5. Copy the entire contents of `firestore.rules` file from this project
6. Paste into the rules editor
7. Click **Publish**

#### Method B: Firebase CLI (If you have it installed)

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Login
firebase login

# Initialize (if not done)
firebase init firestore
# Select your project, use existing firestore.rules

# Deploy
firebase deploy --only firestore:rules
```

### Step 2: Verify Your User Has Admin Role

The rules require users to have `role: 'admin'` or `role: 'manager'` to access the users collection.

**Check your user in Firestore:**
1. Go to Firebase Console > Firestore Database
2. Open the `users` collection
3. Find your user document (by your user ID from Firebase Auth)
4. Verify it has `role: 'admin'` or `role: 'manager'`

**If your user doesn't have admin role:**
- Manually add it in Firestore Console, OR
- Update your auth service to set admin role on first login

### Step 3: Create User Document on Login (If Missing)

If you don't have a user document yet, add this to your auth service:

```typescript
// In lib/services/auth-service.ts or wherever you handle login
import { collection, doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// After successful login/signup
async function createUserDocument(user: any) {
  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      id: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      role: 'admin', // Set first user as admin, or 'user' for others
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
}
```

### Step 4: Test

1. Refresh your CRM page
2. Try accessing the Users page again
3. The error should be gone!

## Temporary Test Mode (Development Only!)

If you need to test quickly and rules deployment is taking time, you can temporarily use test mode:

**⚠️ WARNING: Only use this for local development!**

In Firebase Console > Firestore > Rules, use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

This allows full access until the date specified. **Remove this before going to production!**

## Still Having Issues?

1. **Check browser console** for the exact error message
2. **Verify you're logged in** - check Firebase Auth in browser DevTools
3. **Check user document exists** in Firestore `users` collection
4. **Verify rules were published** - check the Rules tab shows your new rules
5. **Clear browser cache** and try again

