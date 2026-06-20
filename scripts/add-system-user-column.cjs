const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  try {
    const pool = new sql.ConnectionPool({
      server: process.env.DATABASE_HOST,
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      options: {
        trustServerCertificate: true,
        encrypt: false,
      },
    });

    await pool.connect();

    // Add is_system_user column if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME='users' AND COLUMN_NAME='is_system_user'
      )
      BEGIN
        ALTER TABLE users ADD is_system_user BIT DEFAULT 0
      END
    `);

    console.log('✅ Column is_system_user added successfully');

    // Mark admin@planmatrix.local as system user
    await pool.request()
      .input('email', sql.VarChar, 'admin@planmatrix.local')
      .query(`
        UPDATE users
        SET is_system_user = 1
        WHERE email = @email
      `);

    console.log('✅ Admin user marked as system user');

    await pool.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

migrate();
