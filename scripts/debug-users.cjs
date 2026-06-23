const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

async function debugUsers() {
  try {
    const pool = new sql.ConnectionPool({
      server: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '1433'),
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      options: {
        trustServerCertificate: true,
        encrypt: false,
      },
    });

    await pool.connect();

    console.log('\n=== ALL USERS IN DATABASE ===\n');
    const result = await pool.request().query(`
      SELECT id, email, name, department, status, is_system_user, is_it_admin, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    console.log(`Total users: ${result.recordset.length}\n`);
    result.recordset.forEach((user, idx) => {
      console.log(`${idx + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email || '(NULL)'}`);
      console.log(`   Name: ${user.name || '(NULL)'}`);
      console.log(`   Department: ${user.department || '(NULL)'}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   System User: ${user.is_system_user}`);
      console.log(`   IT Admin: ${user.is_it_admin}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });

    console.log('\n=== QUERY RESULT (like /api/users) ===\n');
    const filteredResult = await pool.request().query(`
      SELECT id, email, name, department, status, is_it_admin, created_at
      FROM users
      WHERE email IS NOT NULL AND is_system_user = 0
      ORDER BY created_at DESC
    `);

    console.log(`Filtered users: ${filteredResult.recordset.length}\n`);
    filteredResult.recordset.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email || '(NULL)'} | ${user.name || '(NULL)'}`);
    });

    await pool.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugUsers();
