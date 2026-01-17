-- Run this SQL directly in your PostgreSQL database to create the admin user
-- Password: 12345 (hashed with bcrypt)

INSERT INTO "User" (username, password_hash, created_at)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW())
ON CONFLICT (username) 
DO UPDATE SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- Verify the user was created
SELECT id, username, created_at FROM "User" WHERE username = 'admin';
