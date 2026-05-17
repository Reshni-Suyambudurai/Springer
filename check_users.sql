SELECT user_id, username, email, SUBSTRING(password, 1, 40) as pwd_prefix FROM users;
