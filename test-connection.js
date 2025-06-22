import postgres from 'postgres';

const connectionStrings = [
  "postgresql://postgres:Manjeet2901@db.zukouymdwikwgldqhvoz.supabase.co:5432/postgres",
  "postgresql://postgres.zukouymdwikwgldqhvoz:Manjeet2901@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
  "postgresql://postgres.zukouymdwikwgldqhvoz:Manjeet2901@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
];

async function testConnection(connectionString, index) {
  try {
    console.log(`\n🔍 Testing connection ${index + 1}:`);
    console.log('URL:', connectionString.replace(/Manjeet2901/, '***'));
    
    const sql = postgres(connectionString);
    
    // Test basic connection
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Connection successful!');
    console.log('Current time from database:', result[0].current_time);
    
    // Test if we can create a simple table
    await sql`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Table creation successful!');
    
    // Insert test data
    await sql`
      INSERT INTO test_connection (message) 
      VALUES ('Connection test successful')
    `;
    console.log('✅ Data insertion successful!');
    
    // Query test data
    const testData = await sql`SELECT * FROM test_connection ORDER BY created_at DESC LIMIT 1`;
    console.log('✅ Data query successful!');
    console.log('Test data:', testData[0]);
    
    await sql.end();
    console.log('🎉 Connection ' + (index + 1) + ' is working perfectly!');
    return true;
    
  } catch (error) {
    console.error('❌ Connection ' + (index + 1) + ' failed:', error.message);
    return false;
  }
}

async function testAllConnections() {
  console.log('🚀 Testing all Supabase connection strings...\n');
  
  const results = [];
  for (let i = 0; i < connectionStrings.length; i++) {
    const success = await testConnection(connectionStrings[i], i);
    results.push({ index: i, success, url: connectionStrings[i] });
  }
  
  console.log('\n📊 RESULTS SUMMARY:');
  console.log('==================');
  
  const workingConnections = results.filter(r => r.success);
  
  if (workingConnections.length === 0) {
    console.log('❌ No connections are working. Please check your Supabase project status.');
  } else {
    console.log(`✅ ${workingConnections.length} out of ${connectionStrings.length} connections are working!`);
    console.log('\n🎯 Recommended connection string:');
    console.log(workingConnections[0].url.replace(/Manjeet2901/, '***'));
    
    // Save the working connection to .env
    const fs = await import('fs');
    const envContent = `DATABASE_URL="${workingConnections[0].url}"\nSESSION_SECRET="golf-round-rivals-session-secret-2024"`;
    fs.writeFileSync('.env', envContent);
    console.log('\n💾 Working connection saved to .env file!');
  }
}

testAllConnections(); 