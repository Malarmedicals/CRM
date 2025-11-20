# How to Deploy Firestore Security Rules

The `firestore.rules` file contains the security rules for your Firestore database. You need to deploy these rules to Firebase.

## Option 1: Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**:
```bash
firebase login
```

3. **Initialize Firebase in your project** (if not already done):
```bash
firebase init firestore
```
- Select your Firebase project
- Use the existing `firestore.rules` file when prompted

4. **Deploy the rules**:
```bash
firebase deploy --only firestore:rules
```

## Option 2: Using Firebase Console (Web UI)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** > **Rules** tab
4. Copy the contents of `firestore.rules` file
5. Paste into the rules editor
6. Click **Publish**

## Verify Rules Are Active

After deploying, test by:
1. Logging in as an admin user in your CRM
2. Try accessing the Users page - it should work now
3. Check browser console for any permission errors

## Troubleshooting

**Error: "Missing or insufficient permissions"**
- Make sure you're logged in as a user with `role: 'admin'` or `role: 'manager'`
- Verify the user document exists in Firestore `users` collection
- Check that the rules were deployed successfully

**Error: "User document doesn't exist"**
- When a user first logs in, create their user document in Firestore:
```typescript
// In your auth service, after user signs up/logs in
await addDoc(collection(db, 'users'), {
  id: user.uid,
  email: user.email,
  displayName: user.displayName || '',
  role: 'user', // or 'admin' for first admin
  isBlocked: false,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
})
```

## Quick Test

To quickly test if rules are working, you can temporarily use test mode (NOT for production):

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

**⚠️ WARNING: This allows full access. Only use for testing!**

