-- Verify admin user exists
SELECT id, username, created_at FROM "User" WHERE username = 'admin';

-- Check password hash
SELECT username, LEFT(password_hash, 20) as hash_preview FROM "User" WHERE username = 'admin';
