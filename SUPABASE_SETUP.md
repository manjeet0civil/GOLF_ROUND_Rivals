# Supabase Setup Guide for Golf Round Rivals

This guide will help you set up Supabase as your database for the Golf Round Rivals application.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `golf-round-rivals` (or any name you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to you
5. Click "Create new project"
6. Wait for the project to be set up (this takes a few minutes)

## Step 2: Get Your Database Connection String

1. In your Supabase dashboard, go to **Settings** → **Database**
2. Scroll down to "Connection string"
3. Select "URI" format
4. Copy the connection string that looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the password you created in Step 1

## Step 3: Set Up Environment Variables

Create a `.env` file in your project root with the following content:

```env
# Supabase Database URL
DATABASE_URL="postgresql://postgres:your-actual-password@db.your-project-ref.supabase.co:5432/postgres"

# Session Secret (generate a random string)
SESSION_SECRET="your-super-secret-session-key-here"
```

## Step 4: Install Dependencies

Run the following command to install the required dependencies:

```bash
npm install
```

## Step 5: Set Up Database Tables

Run the following command to create the database tables:

```bash
npm run db:push
```

This will create the following tables in your Supabase database:
- `users` - User accounts
- `games` - Golf games
- `game_players` - Players in each game
- `scorecards` - Individual hole scores

## Step 6: Run the Application

Start the development server:

```bash
npm run dev
```

The application will now be running on `http://localhost:5000` and will use your Supabase database!

## Step 7: Verify Setup

1. Open your browser and go to `http://localhost:5000`
2. Try creating a new account
3. Check your Supabase dashboard → **Table Editor** to see if data is being stored

## Troubleshooting

### PowerShell Execution Policy Error
If you get a PowerShell execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Database Connection Issues
- Make sure your DATABASE_URL is correct
- Check that your Supabase project is active
- Verify the password in the connection string matches your database password

### Missing Tables
If tables don't exist, run:
```bash
npm run db:push
```

## Benefits of Using Supabase

✅ **No local database setup required**  
✅ **Automatic backups**  
✅ **Real-time capabilities** (can be added later)  
✅ **Built-in authentication** (can be integrated later)  
✅ **Free tier available**  
✅ **Easy scaling**  

## Next Steps

Once your app is running with Supabase, you can:
1. Add real-time features using Supabase's real-time subscriptions
2. Integrate Supabase Auth for better user management
3. Set up Row Level Security (RLS) for data protection
4. Use Supabase Edge Functions for serverless backend logic

## Support

If you encounter any issues:
1. Check the Supabase documentation: https://supabase.com/docs
2. Verify your connection string format
3. Check the browser console and server logs for errors 