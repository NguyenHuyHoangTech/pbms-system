ALTER TABLE users ADD name VARCHAR(255);
ALTER TABLE users ADD phone VARCHAR(50);
ALTER TABLE users ADD is_active BIT DEFAULT 1;

UPDATE users SET is_active = 1 WHERE is_active IS NULL;
