# 🔐 Supabase Authentication Setup Guide

Your Golf Round Rivals app now has integrated Supabase authentication! Here's what's been added and how to configure it.

## ✅ What's Been Added

### 1. **Supabase Client Configuration**
- `client/src/lib/supabase.ts` - Supabase client setup
- Authentication helper functions
- Database helper functions

### 2. **Authentication Context**
- `client/src/contexts/AuthContext.tsx` - React context for auth state
- User session management
- Profile management

### 3. **Authentication Modal**
- `client/src/components/SupabaseAuthModal.tsx` - Modern auth UI
- Sign up, sign in, and password reset
- Form validation and error handling

### 4. **Updated App Structure**
- `client/src/App.tsx` - Wrapped with AuthProvider
- `client/src/pages/Index.tsx` - Updated to use Supabase auth

## 🔧 Configuration Steps

### Step 1: Get Your Supabase Anon Key

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **anon public** key

### Step 2: Update the Supabase Configuration

Update `client/src/lib/supabase.ts` with your actual anon key:

```typescript
const supabaseUrl = 'https://zukouymdwikwgldqhvoz.supabase.co'
const supabaseAnonKey = 'YOUR_ACTUAL_ANON_KEY_HERE' // Replace this!
```

### Step 3: Enable Email Authentication

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Configure email templates if desired

### Step 4: Set Up Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the templates for:
   - Confirm signup
   - Reset password
   - Magic link

## 🎯 Features Available

### ✅ Authentication Features
- **Email/Password Sign Up** - Users can create accounts
- **Email/Password Sign In** - Secure login
- **Password Reset** - Email-based password recovery
- **Session Management** - Automatic session persistence
- **Sign Out** - Secure logout

### ✅ User Profile Features
- **Username** - Unique username for each user
- **Full Name** - Display name
- **Handicap** - Golf handicap tracking
- **Email** - Contact information

### ✅ Security Features
- **Email Verification** - Optional email confirmation
- **Password Validation** - Secure password requirements
- **Session Security** - JWT-based sessions
- **CSRF Protection** - Built-in security

## 🚀 How to Use

### For Users:
1. **Sign Up**: Click "Sign In" → "Sign Up" tab
2. **Fill Details**: Username, name, email, password, handicap
3. **Verify Email**: Check email for verification (if enabled)
4. **Sign In**: Use email and password to login
5. **Reset Password**: Use "Reset" tab if needed

### For Developers:
```typescript
import { useAuth } from '@/contexts/AuthContext'

const MyComponent = () => {
  const { user, profile, signOut, updateProfile } = useAuth()
  
  // Check if user is logged in
  if (!user) return <div>Please sign in</div>
  
  // Access user data
  console.log(user.email, profile?.name)
  
  // Sign out
  const handleSignOut = () => signOut()
}
```

## 🔒 Security Best Practices

### 1. **Environment Variables**
Never commit your Supabase keys to Git. Use environment variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. **Row Level Security (RLS)**
Enable RLS on your tables in Supabase:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### 3. **Email Verification**
Consider enabling email verification for production:

```sql
-- In Supabase Dashboard → Authentication → Settings
-- Enable "Confirm email"
```

## 🎨 Customization

### Styling the Auth Modal
The auth modal uses Tailwind CSS and shadcn/ui components. You can customize:

- Colors in `SupabaseAuthModal.tsx`
- Layout and spacing
- Form validation messages
- Success/error states

### Adding Social Login
To add Google, GitHub, etc.:

1. Enable providers in Supabase Dashboard
2. Add OAuth buttons to the modal
3. Handle social auth callbacks

## 🐛 Troubleshooting

### Common Issues:

1. **"Invalid API key"**
   - Check your anon key is correct
   - Ensure the key is from the right project

2. **"Email not confirmed"**
   - Check spam folder
   - Verify email templates are configured

3. **"User not found"**
   - Check if user exists in Supabase
   - Verify RLS policies

4. **"Network error"**
   - Check internet connection
   - Verify Supabase project is active

### Debug Mode:
Add this to see detailed logs:

```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    debug: true
  }
})
```

## 📱 Mobile Optimization

The auth modal is already:
- ✅ Responsive design
- ✅ Touch-friendly inputs
- ✅ Mobile-optimized layout
- ✅ Keyboard-friendly navigation

## 🚀 Next Steps

1. **Test the authentication flow**
2. **Customize the UI to match your brand**
3. **Add social login providers**
4. **Set up email templates**
5. **Configure RLS policies**
6. **Deploy to production**

Your app now has enterprise-grade authentication! 🎉 