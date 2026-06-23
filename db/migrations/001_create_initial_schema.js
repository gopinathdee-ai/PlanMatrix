export async function up(knex) {
  try {
    // Create floor_plans table
    console.log("Creating floor_plans table...");
    await knex.raw(`
      CREATE TABLE floor_plans (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT (NEWID()),
        building NVARCHAR(255) NOT NULL,
        floor_number NVARCHAR(50) NOT NULL,
        pdf_filename NVARCHAR(255) NOT NULL,
        pdf_url NVARCHAR(500) NOT NULL,
        uploaded_at DATETIME2 DEFAULT (GETUTCDATE()),
        created_by NVARCHAR(255),
        CONSTRAINT UQ_FloorPlans_Building_Floor UNIQUE(building, floor_number)
      );
    `);
    console.log("✓ floor_plans created");
  } catch (err) {
    console.error("Error creating floor_plans:", err.message || err);
    throw err;
  }

  try {
    // Create users table
    console.log("Creating users table...");
    await knex.raw(`
      CREATE TABLE users (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT (NEWID()),
        email NVARCHAR(255) NOT NULL UNIQUE,
        name NVARCHAR(255) NOT NULL,
        department NVARCHAR(255),
        entra_id NVARCHAR(255),
        is_it_admin BIT DEFAULT 0,
        is_system_user BIT DEFAULT 0,
        password_hash NVARCHAR(255),
        status NVARCHAR(50) DEFAULT 'active',
        created_at DATETIME2 DEFAULT (GETUTCDATE()),
        updated_at DATETIME2 DEFAULT (GETUTCDATE())
      );
    `);
    console.log("✓ users created");
  } catch (err) {
    console.error("Error creating users:", err.message || err);
    throw err;
  }

  try {
    // Create markers table
    console.log("Creating markers table...");
    await knex.raw(`
      CREATE TABLE markers (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT (NEWID()),
        floor_plan_id UNIQUEIDENTIFIER NOT NULL,
        marker_number NVARCHAR(50) NOT NULL,
        pixel_x INT NOT NULL,
        pixel_y INT NOT NULL,
        pdf_page_number INT DEFAULT 1,
        created_at DATETIME2 DEFAULT (GETUTCDATE()),
        UNIQUE(floor_plan_id, marker_number)
      );
    `);
    console.log("✓ markers created");
  } catch (err) {
    console.error("Error creating markers:", err.message || err);
    throw err;
  }

  try {
    // Create assignments table
    console.log("Creating assignments table...");
    await knex.raw(`
      CREATE TABLE assignments (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT (NEWID()),
        user_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
        marker_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
        assigned_at DATETIME2 DEFAULT (GETUTCDATE()),
        source NVARCHAR(50) DEFAULT 'manual',
        updated_at DATETIME2 DEFAULT (GETUTCDATE())
      );
    `);
    console.log("✓ assignments created");
  } catch (err) {
    console.error("Error creating assignments:", err.message || err);
    throw err;
  }

  try {
    // Create assignment_history table
    console.log("Creating assignment_history table...");
    await knex.raw(`
      CREATE TABLE assignment_history (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT (NEWID()),
        user_id UNIQUEIDENTIFIER NOT NULL,
        old_marker_id UNIQUEIDENTIFIER,
        new_marker_id UNIQUEIDENTIFIER,
        action NVARCHAR(50) NOT NULL,
        source NVARCHAR(50) DEFAULT 'manual',
        timestamp DATETIME2 DEFAULT (GETUTCDATE())
      );
    `);
    console.log("✓ assignment_history created");
  } catch (err) {
    console.error("Error creating assignment_history:", err.message || err);
    throw err;
  }

  try {
    // Create settings table
    console.log("Creating settings table...");
    await knex.raw(`
      CREATE TABLE settings (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT (NEWID()),
        [key] NVARCHAR(255) NOT NULL UNIQUE,
        value NVARCHAR(MAX) NOT NULL,
        updated_at DATETIME2 DEFAULT (GETUTCDATE())
      );
    `);
    console.log("✓ settings created");
  } catch (err) {
    console.error("Error creating settings:", err.message || err);
    throw err;
  }

  try {
    // Create import_logs table
    console.log("Creating import_logs table...");
    await knex.raw(`
      CREATE TABLE import_logs (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT (NEWID()),
        type NVARCHAR(50) NOT NULL,
        filename NVARCHAR(255) NOT NULL,
        success_count INT DEFAULT 0,
        error_count INT DEFAULT 0,
        errors NVARCHAR(MAX),
        timestamp DATETIME2 DEFAULT (GETUTCDATE())
      );
    `);
    console.log("✓ import_logs created");
  } catch (err) {
    console.error("Error creating import_logs:", err.message || err);
    throw err;
  }

  try {
    // Create indexes
    console.log("Creating indexes...");
    await knex.raw(`CREATE INDEX idx_markers_floor_plan_id ON markers(floor_plan_id)`);
    await knex.raw(`CREATE INDEX idx_assignments_user_id ON assignments(user_id)`);
    await knex.raw(`CREATE INDEX idx_assignments_marker_id ON assignments(marker_id)`);
    await knex.raw(`CREATE INDEX idx_history_user_id ON assignment_history(user_id)`);
    await knex.raw(`CREATE INDEX idx_history_timestamp ON assignment_history(timestamp)`);
    await knex.raw(`CREATE INDEX idx_import_logs_timestamp ON import_logs(timestamp)`);
    console.log("✓ indexes created");
  } catch (err) {
    console.error("Error creating indexes:", err.message || err);
    throw err;
  }
}

export async function down(knex) {
  // Drop in reverse order of creation to respect foreign keys
  await knex.raw(`DROP TABLE IF EXISTS assignment_history`);
  await knex.raw(`DROP TABLE IF EXISTS assignments`);
  await knex.raw(`DROP TABLE IF EXISTS import_logs`);
  await knex.raw(`DROP TABLE IF EXISTS markers`);
  await knex.raw(`DROP TABLE IF EXISTS settings`);
  await knex.raw(`DROP TABLE IF EXISTS users`);
  await knex.raw(`DROP TABLE IF EXISTS floor_plans`);
}
