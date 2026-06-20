CREATE TABLE zones (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    layout_x FLOAT DEFAULT 0.0,
    layout_y FLOAT DEFAULT 0.0,
    rotation FLOAT DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE slots (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    zone_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'EMPTY',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE
);

CREATE TABLE parking_cards (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    card_code VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    is_inside BIT DEFAULT 0,
    assigned_plate VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parking_sessions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    plate_number VARCHAR(50) NOT NULL,
    rfid_card_id BIGINT,
    time_in DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    time_out DATETIME,
    gate_in_id BIGINT,
    gate_out_id BIGINT,
    allocated_slot_id BIGINT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    total_fee DECIMAL(18,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rfid_card_id) REFERENCES parking_cards(id),
    FOREIGN KEY (allocated_slot_id) REFERENCES slots(id)
);

-- Seed some mock zones
INSERT INTO zones (name, capacity, vehicle_type, layout_x, layout_y, rotation) VALUES ('Khu vực A (VIP)', 5, 'CAR', 100, 100, 0);
INSERT INTO zones (name, capacity, vehicle_type, layout_x, layout_y, rotation) VALUES ('Khu vực B', 10, 'MOTORBIKE', 400, 100, 0);

-- Seed some mock slots
INSERT INTO slots (zone_id, name, status) VALUES (1, 'A-01', 'EMPTY');
INSERT INTO slots (zone_id, name, status) VALUES (1, 'A-02', 'EMPTY');
INSERT INTO slots (zone_id, name, status) VALUES (1, 'A-03', 'EMPTY');
INSERT INTO slots (zone_id, name, status) VALUES (1, 'A-04', 'EMPTY');
INSERT INTO slots (zone_id, name, status) VALUES (1, 'A-05', 'EMPTY');

INSERT INTO slots (zone_id, name, status) VALUES (2, 'B-01', 'EMPTY');
INSERT INTO slots (zone_id, name, status) VALUES (2, 'B-02', 'EMPTY');
INSERT INTO slots (zone_id, name, status) VALUES (2, 'B-03', 'EMPTY');
INSERT INTO slots (zone_id, name, status) VALUES (2, 'B-04', 'EMPTY');
INSERT INTO slots (zone_id, name, status) VALUES (2, 'B-05', 'EMPTY');
INSERT INTO slots (zone_id, name, status) VALUES (2, 'B-06', 'EMPTY');
INSERT INTO slots (zone_id, name, status) VALUES (2, 'B-07', 'EMPTY');
INSERT INTO slots (zone_id, name, status) VALUES (2, 'B-08', 'EMPTY');
INSERT INTO slots (zone_id, name, status) VALUES (2, 'B-09', 'EMPTY');
INSERT INTO slots (zone_id, name, status) VALUES (2, 'B-10', 'EMPTY');
