DECLARE @AppPassword NVARCHAR(128) = ''; -- 👈 SET YOUR PASSWORD HERE

/*
==============================================================================
Setup script for Floor Plan Management System
Run this as a user with sysadmin (sa) or equivalent privileges.
==============================================================================
*/

-- Validation
IF @AppPassword = ''
BEGIN
    RAISERROR('❌ ERROR: You must set the @AppPassword variable on line 1!', 16, 1);
    RETURN;
END

-- 1. Create the Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'floorplan_db')
BEGIN
    EXEC('CREATE DATABASE floorplan_db');
    PRINT '✅ Database [floorplan_db] created.';
END
ELSE
BEGIN
    PRINT 'ℹ️ Database [floorplan_db] already exists.';
END

-- 2. Create the Server-level Login
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'floorplan_user')
BEGIN
    DECLARE @CreateLoginSQL NVARCHAR(MAX) = 'CREATE LOGIN floorplan_user WITH PASSWORD = ''' + REPLACE(@AppPassword, '''', '''''') + ''';';
    EXEC sp_executesql @CreateLoginSQL;
    PRINT '✅ Login [floorplan_user] created.';
END
ELSE
BEGIN
    PRINT 'ℹ️ Login [floorplan_user] already exists.';
END

-- 3. Create the Database-level User and Grant Permissions
-- Using dynamic SQL to switch context to floorplan_db
DECLARE @SetupPermissionsSQL NVARCHAR(MAX) = '
USE floorplan_db;
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = ''floorplan_user'')
BEGIN
    CREATE USER floorplan_user FOR LOGIN floorplan_user;
    PRINT ''✅ User [floorplan_user] created in [floorplan_db].'';
END

GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO floorplan_user;
GRANT CREATE TABLE TO floorplan_user;
GRANT ALTER ON SCHEMA::dbo TO floorplan_user;
PRINT ''✅ Permissions granted to [floorplan_user].'';
';

EXEC sp_executesql @SetupPermissionsSQL;

PRINT '==================================================';
PRINT '🎉 DATABASE SETUP COMPLETE';
PRINT '==================================================';
