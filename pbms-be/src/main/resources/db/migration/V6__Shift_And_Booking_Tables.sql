CREATE TABLE staff_work_sessions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    staff_id BIGINT NOT NULL,
    gate_id BIGINT,
    working_mode VARCHAR(50) DEFAULT 'MANUAL',
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    sys_total_online DECIMAL(18,2) DEFAULT 0,
    sys_total_cash DECIMAL(18,2) DEFAULT 0,
    declared_cash DECIMAL(18,2),
    variance_amount DECIMAL(18,2),
    variance_reason VARCHAR(MAX),
    settlement_status VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES users(id)
);

ALTER TABLE parking_sessions
ADD checkout_staff_id BIGINT NULL;

ALTER TABLE parking_sessions
ADD expiry_time DATETIME NULL;

ALTER TABLE parking_sessions
ADD CONSTRAINT fk_checkout_staff FOREIGN KEY (checkout_staff_id) REFERENCES users(id);
