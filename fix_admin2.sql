UPDATE users SET password = (SELECT password FROM (SELECT password FROM users WHERE email = 'mozhi@kanini.com') as tmp) WHERE email = 'admin@kanini.com';
