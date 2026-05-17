SELECT user_id, username, email, SUBSTRING(password, 1, 30) as pwd_prefix FROM users WHERE email = 'admin@kanini.com';
