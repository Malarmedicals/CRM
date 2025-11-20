# Create User Document in Firestore

If the `users` collection is not showing in Firebase Console, follow these steps:

## Method 1: Log Out and Log Back In (Easiest)

The auth service will automatically create your user document when you log in:

1. **In your CRM:**
   - Click logout/sign out
   - Log back in with your email and password

2. **The auth service will:**
   - Check if `users` collection exists (it will be created automatically)
   - Create your user document
   - Set you as `admin` if you're the first user

3. **Verify in Firebase Console:**
   - Go to Firestore Database
   - You should now see the `users` collection
   - Your user document should be there

## Method 2: Create User Document Manually

If Method 1 doesn't work, create it manually:

### Step 1: Get Your User ID

1. **In your CRM browser console (F12):**
   ```javascript
   // Run this in browser console while logged in
   import { auth } from '@/lib/firebase'
   console.log('Your User ID:', auth.currentUser?.uid)
   ```

   OR

2. **Check Firebase Console:**
   - Go to **Authentication** (left menu)
   - You'll see your user listed
   - Copy the **User UID** (long string of characters)

### Step 2: Create Users Collection and Document

1. **In Firebase Console:**
   - Go to **Firestore Database** → **Data** tab
   - Click **"+ Start collection"** (if no collections exist)
   - OR click **"+ Add document"** if you see other collections

2. **Create Collection:**
   - Collection ID: `users`
   - Click **Next**

3. **Create Document:**
   - Document ID: Paste your **User UID** from Step 1
   - Click **Next**

4. **Add Fields:**
   Click **"Add field"** for each of these:

   | Field | Type | Value |
   |-------|------|-------|
   | `email` | string | Your email address |
   | `displayName` | string | Your name |
   | `role` | string | `admin` |
   | `isBlocked` | boolean | `false` |
   | `createdAt` | timestamp | Click "Set" and use current time |
   | `updatedAt` | timestamp | Click "Set" and use current time |

5. **Click Save**

### Step 3: Verify

Your document should look like this:
```json
{
  "email": "your@email.com",
  "displayName": "Your Name",
  "role": "admin",
  "isBlocked": false,
  "createdAt": [timestamp],
  "updatedAt": [timestamp]
}
```

## Method 3: Use Browser Console (Quick)

Run this in your CRM browser console (F12) while logged in:

```javascript
// Get your user info
import { auth, db } from '@/lib/firebase'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

const user = auth.currentUser
if (user) {
  await setDoc(doc(db, 'users', user.uid), {
    email: user.email,
    displayName: user.displayName || '',
    role: 'admin', // Set as admin
    isBlocked: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  console.log('✅ User document created!')
} else {
  console.log('❌ Not logged in')
}
```

## After Creating User Document

1. **Refresh your CRM page**
2. **Try adding a product again** - it should work now!
3. **Check Users page** - you should see yourself listed

## Troubleshooting

### "Collection doesn't exist" error:
- Firestore creates collections automatically when you add the first document
- Just create the document and the collection will be created

### "Permission denied" when creating:
- Make sure you're logged in to Firebase Console with the same account
- Check Firestore rules allow user document creation (they should)

### Still can't see users collection:
- Refresh the Firebase Console page
- Check you're looking at the correct database (default)
- Try logging out and back in to CRM first

