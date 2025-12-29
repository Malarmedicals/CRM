# Firebase Admin Setup for Data Seeding

## 🔑 Required Environment Variables

To run the seeding script, you need Firebase Admin SDK credentials in your `.env.local` file.

## 📝 Step-by-Step Setup

### 1. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the **gear icon** ⚙️ → **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file

### 2. Add Credentials to `.env.local`

Open your `.env.local` file and add these variables:

```env
# Firebase Admin SDK (for seeding script)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

### 3. Extract Values from Downloaded JSON

The downloaded JSON file looks like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

**Copy these values:**
- `project_id` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and `\n` characters)

### 4. Important Notes

⚠️ **Private Key Formatting:**
- Keep the entire private key in quotes
- Keep the `\n` characters (don't replace with actual newlines)
- Example: `"-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"`

⚠️ **Security:**
- Never commit `.env.local` to git (it's already in `.gitignore`)
- Never share your private key
- Keep the service account JSON file secure

## ✅ Verify Setup

Check if your `.env.local` has these variables:

```bash
# Check if variables are set (PowerShell)
Get-Content .env.local | Select-String "FIREBASE"
```

You should see:
```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

## 🚀 Run the Seeding Script

Once credentials are set up:

```bash
npx tsx scripts/seed-sample-data.ts
```

## 🐛 Troubleshooting

### Error: "Firebase Admin not initialized"
- Check if all three environment variables are set
- Verify the private key is properly formatted with `\n`

### Error: "Invalid service account"
- Ensure you copied the correct values from the JSON file
- Check for extra spaces or missing quotes

### Error: "Permission denied"
- Verify the service account has proper permissions
- Go to Firebase Console → IAM & Admin → Grant "Firebase Admin" role

---

## 📋 Quick Checklist

- [ ] Downloaded service account JSON from Firebase Console
- [ ] Added `NEXT_PUBLIC_FIREBASE_PROJECT_ID` to `.env.local`
- [ ] Added `FIREBASE_CLIENT_EMAIL` to `.env.local`
- [ ] Added `FIREBASE_PRIVATE_KEY` to `.env.local` (with quotes and `\n`)
- [ ] Verified all variables are set correctly
- [ ] Ready to run seeding script!

---

**Need Help?** Check the [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
