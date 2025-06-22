import postgres from 'postgres';
import fs from 'fs';

// Read the DATABASE_URL from .env file
const envContent = fs.readFileSync('.env', 'utf8');
const match = envContent.match(/DATABASE_URL="([^"]+)"/);
const DATABASE_URL = match ? match[1] : null;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database tables...');
    const sql = postgres(DATABASE_URL);
    
    // Create users table with Supabase UUID support
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        supabase_id TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        handicap INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Users table created');
    
    // Create games table with Supabase UUID for host_id
    await sql`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        host_id TEXT NOT NULL,
        game_code VARCHAR(6) NOT NULL UNIQUE,
        course_name TEXT NOT NULL,
        course_par INTEGER NOT NULL DEFAULT 72,
        max_players INTEGER NOT NULL DEFAULT 4,
        status TEXT NOT NULL DEFAULT 'waiting',
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `;
    console.log('✅ Games table created');
    
    // Create game_players table with Supabase UUID for player_id
    await sql`
      CREATE TABLE IF NOT EXISTS game_players (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL,
        player_id TEXT NOT NULL,
        joined_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Game players table created');
    
    // Create scorecards table with Supabase UUID for player_id
    await sql`
      CREATE TABLE IF NOT EXISTS scorecards (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL,
        player_id TEXT NOT NULL,
        hole INTEGER NOT NULL,
        strokes INTEGER,
        par INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Scorecards table created');
    
    // Create game_results table for winning history
    await sql`
      CREATE TABLE IF NOT EXISTS game_results (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL,
        player_id TEXT NOT NULL,
        total_strokes INTEGER NOT NULL,
        total_par INTEGER NOT NULL,
        net_score INTEGER NOT NULL,
        handicap INTEGER NOT NULL DEFAULT 0,
        position INTEGER,
        is_winner BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Game results table created');
    
    await sql.end();
    console.log('🎉 All database tables created successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase(); 