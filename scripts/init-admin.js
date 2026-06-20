const sql = require('mssql');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

async function initAdmin() {
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

    // Hash the password
    const password = 'Password123';
    const passwordHash = await bcrypt.hash(password, 10);

    // Delete any existing users with NULL email
    await pool.request()
      .query('DELETE FROM users WHERE email IS NULL OR email = \'\'');

    // Insert admin user
    const { v4: uuidv4 } = require('uuid');
    const adminId = uuidv4();

    await pool.request()
      .input('id', sql.UniqueIdentifier, adminId)
      .input('email', sql.VarChar, 'admin@planmatrix.local')
      .input('name', sql.VarChar, 'Admin')
      .input('password_hash', sql.VarChar, passwordHash)
      .input('is_it_admin', sql.Bit, 1)
      .input('status', sql.VarChar, 'active')
      .query(`
        INSERT INTO users (id, email, name, password_hash, is_it_admin, status)
        VALUES (@id, @email, @name, @password_hash, @is_it_admin, @status)
      `);

    console.log('✅ Admin user initialized successfully');
    console.log('   Email: admin@planmatrix.local');
    console.log('   Password: Password123');

    await pool.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

initAdmin();
