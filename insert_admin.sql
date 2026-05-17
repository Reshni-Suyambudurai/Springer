INSERT INTO users (username, email, password, department, location, role_id, is_active, created_at)
SELECT 'Admin', 'admin@kanini.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhLK', 'Data Analytics & AI', 'Coimbatore',
  (SELECT role_id FROM roles WHERE role_name = 'SYSTEM_ADMIN'), TRUE, NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@kanini.com');
