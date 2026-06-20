CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    is_verified BIT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE otp_verifications (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_used BIT DEFAULT 0
);

CREATE TABLE building_profiles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    hotline VARCHAR(50) NOT NULL,
    operating_hours VARCHAR(255) NOT NULL,
    rules VARCHAR(MAX),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_configs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    config_key VARCHAR(255) NOT NULL UNIQUE,
    config_value VARCHAR(MAX) NOT NULL,
    description VARCHAR(500),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bcrypt hash for '123456aA@'
INSERT INTO users (email, password, role, is_verified) VALUES ('admin@pbms.com', '$2a$10$X86Z96yGg5o1x/bMv9UaHe2sIqGZ.6jH8eP/gK.9O3x/n90qM0lS2', 'ROLE_SUPER_ADMIN', 1);
INSERT INTO users (email, password, role, is_verified) VALUES ('manager@pbms.com', '$2a$10$X86Z96yGg5o1x/bMv9UaHe2sIqGZ.6jH8eP/gK.9O3x/n90qM0lS2', 'ROLE_MANAGER', 1);
INSERT INTO users (email, password, role, is_verified) VALUES ('staff@pbms.com', '$2a$10$X86Z96yGg5o1x/bMv9UaHe2sIqGZ.6jH8eP/gK.9O3x/n90qM0lS2', 'ROLE_STAFF', 1);
INSERT INTO users (email, password, role, is_verified) VALUES ('customer@pbms.com', '$2a$10$X86Z96yGg5o1x/bMv9UaHe2sIqGZ.6jH8eP/gK.9O3x/n90qM0lS2', 'ROLE_CUSTOMER', 1);

INSERT INTO building_profiles (name, address, hotline, operating_hours, rules) 
VALUES ('PBMS Default Building', '123 Main St, City', '1800-123-456', '24/7', '1. No smoking.');

INSERT INTO system_configs (config_key, config_value, description)
VALUES ('MAX_LOGIN_ATTEMPTS', '5', 'Maximum number of failed login attempts before lockout');

INSERT INTO system_configs (config_key, config_value, description)
VALUES ('PARKING_FEE_HOURLY', '15000', 'Hourly parking fee in VND');
