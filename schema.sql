-- ============================================
-- RUVIAOS DATABASE SCHEMA
-- Complete Unified PMS + POS + Stock Management
-- Version 1.0
-- ============================================

-- Connect to the database
\c ruvia_hotel_db;

-- ============================================
-- 1. CORE PMS TABLES
-- ============================================

-- Guests table
CREATE TABLE guests (
    id SERIAL PRIMARY KEY,
    guest_code VARCHAR(20) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    id_number VARCHAR(50),
    nationality VARCHAR(50),
    preferences JSONB DEFAULT '{}',
    total_stays INTEGER DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    floor_number INTEGER,
    bed_count INTEGER DEFAULT 1,
    max_occupancy INTEGER DEFAULT 2,
    base_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ready',
    is_available BOOLEAN DEFAULT true,
    last_maintenance DATE,
    notes TEXT
);

-- Room types reference
CREATE TABLE room_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    amenities JSONB DEFAULT '[]'
);

-- Reservations table
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    reservation_number VARCHAR(20) UNIQUE NOT NULL,
    guest_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    adults INTEGER DEFAULT 1,
    children INTEGER DEFAULT 0,
    total_amount DECIMAL(10, 2),
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'confirmed',
    source VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. POS TABLES
-- ============================================

-- Products / Menu items
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    sub_category VARCHAR(50),
    unit VARCHAR(20) DEFAULT 'piece',
    unit_cost DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    location VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- POS Transactions
CREATE TABLE pos_transactions (
    id SERIAL PRIMARY KEY,
    transaction_number VARCHAR(20) UNIQUE NOT NULL,
    guest_id INTEGER REFERENCES guests(id) ON DELETE SET NULL,
    reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL,
    room_number VARCHAR(10),
    server_name VARCHAR(100),
    outlet VARCHAR(50),
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    posted_to_folio BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- POS Transaction Lines
CREATE TABLE pos_transaction_lines (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES pos_transactions(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(10, 2) NOT NULL,
    modifiers JSONB DEFAULT '[]'
);

-- ============================================
-- 3. STOCK MANAGEMENT TABLES
-- ============================================

-- Stock movements
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    quantity_change INTEGER NOT NULL,
    previous_stock INTEGER,
    new_stock INTEGER,
    reason VARCHAR(50) NOT NULL,
    reference_id INTEGER,
    reference_type VARCHAR(50),
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Orders
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier VARCHAR(100),
    supplier_contact VARCHAR(100),
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery DATE,
    received_date DATE,
    status VARCHAR(20) DEFAULT 'draft',
    total_cost DECIMAL(10, 2),
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Order Lines
CREATE TABLE purchase_order_lines (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    total_line_cost DECIMAL(10, 2) NOT NULL,
    quantity_received INTEGER DEFAULT 0
);

-- Stocktakes
CREATE TABLE stocktakes (
    id SERIAL PRIMARY KEY,
    stocktake_number VARCHAR(20) UNIQUE NOT NULL,
    location VARCHAR(50),
    scheduled_date DATE,
    completed_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stocktake Lines
CREATE TABLE stocktake_lines (
    id SERIAL PRIMARY KEY,
    stocktake_id INTEGER REFERENCES stocktakes(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    expected_quantity INTEGER,
    actual_quantity INTEGER,
    variance INTEGER GENERATED ALWAYS AS (actual_quantity - expected_quantity) STORED,
    notes TEXT
);

-- Recipes
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    ingredient_id INTEGER REFERENCES products(id),
    quantity_required DECIMAL(10, 3) NOT NULL,
    unit VARCHAR(20),
    unit_cost_at_time DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. HOUSEKEEPING & MAINTENANCE
-- ============================================

-- Housekeeping tasks
CREATE TABLE housekeeping_tasks (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id),
    task_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'pending',
    assigned_to VARCHAR(100),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance requests
CREATE TABLE maintenance_requests (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id),
    guest_id INTEGER REFERENCES guests(id),
    issue_type VARCHAR(50),
    description TEXT,
    photo_url TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'reported',
    assigned_to VARCHAR(100),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. STAFF & AUTHENTICATION
-- ============================================

-- Staff members
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    staff_code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    department VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    password_hash VARCHAR(255) NOT NULL,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. AUDIT LOGS
-- ============================================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_type VARCHAR(20),
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_guests_name ON guests(full_name);
CREATE INDEX idx_guests_email ON guests(email);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX idx_reservations_guest ON reservations(guest_id);
CREATE INDEX idx_pos_transactions_guest ON pos_transactions(guest_id);
CREATE INDEX idx_pos_transactions_created ON pos_transactions(created_at);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_housekeeping_status ON housekeeping_tasks(status);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);

-- ============================================
-- TRIGGER: Update stock automatically
-- ============================================

CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET current_stock = current_stock + NEW.quantity_change
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock
AFTER INSERT ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION update_product_stock();

-- ============================================
-- VIEWS
-- ============================================

-- Current inventory status
CREATE VIEW v_current_inventory AS
SELECT 
    p.id,
    p.sku,
    p.name,
    p.category,
    p.current_stock,
    p.reorder_level,
    CASE 
        WHEN p.current_stock <= p.reorder_level THEN '⚠️ LOW STOCK'
        WHEN p.current_stock = 0 THEN '❌ OUT OF STOCK'
        ELSE '✅ OK'
    END AS stock_status,
    p.unit_cost,
    p.unit_price,
    (p.current_stock * p.unit_cost) AS inventory_value
FROM products p
WHERE p.is_active = true;

-- Today's arrivals
CREATE VIEW v_todays_arrivals AS
SELECT 
    r.reservation_number,
    g.full_name,
    g.phone,
    r.check_in,
    rm.room_number,
    rm.room_type
FROM reservations r
JOIN guests g ON r.guest_id = g.id
JOIN rooms rm ON r.room_id = rm.id
WHERE r.check_in = CURRENT_DATE
AND r.status = 'confirmed';

-- Today's departures
CREATE VIEW v_todays_departures AS
SELECT 
    r.reservation_number,
    g.full_name,
    rm.room_number,
    r.check_out,
    COALESCE(SUM(pt.total_amount), 0) AS outstanding_balance
FROM reservations r
JOIN guests g ON r.guest_id = g.id
JOIN rooms rm ON r.room_id = rm.id
LEFT JOIN pos_transactions pt ON pt.reservation_id = r.id AND pt.payment_status != 'paid'
WHERE r.check_out = CURRENT_DATE
AND r.status = 'checked-in'
GROUP BY r.id, g.id, rm.id;

-- Housekeeping board
CREATE VIEW v_housekeeping_board AS
SELECT 
    rm.room_number,
    rm.room_type,
    rm.status AS room_status,
    CASE 
        WHEN rm.status = 'ready' THEN '🟢 Clean'
        WHEN rm.status = 'dirty' THEN '🔴 Needs Cleaning'
        WHEN rm.status = 'maintenance' THEN '⚪ Maintenance'
        ELSE '🟡 Other'
    END AS display_status,
    hk.task_type,
    hk.assigned_to
FROM rooms rm
LEFT JOIN housekeeping_tasks hk ON hk.room_id = rm.id AND hk.status = 'pending'
ORDER BY rm.room_number;

-- ============================================
-- SAMPLE DATA FOR RUVIAOS
-- ============================================

-- Room types
INSERT INTO room_types (type_name, description, base_price, amenities) VALUES
('Standard', 'Comfortable room', 80.00, '["WiFi", "TV", "AC"]'),
('Deluxe', 'Spacious room', 120.00, '["WiFi", "TV", "AC", "Mini Bar"]'),
('Suite', 'Luxury suite', 200.00, '["WiFi", "TV", "AC", "Mini Bar", "Bathtub"]');

-- Rooms
INSERT INTO rooms (room_number, room_type, floor_number, bed_count, max_occupancy, base_price, status) VALUES
('101', 'Standard', 1, 1, 2, 80.00, 'ready'),
('102', 'Standard', 1, 1, 2, 80.00, 'ready'),
('103', 'Standard', 1, 2, 3, 90.00, 'dirty'),
('201', 'Deluxe', 2, 1, 2, 120.00, 'ready'),
('202', 'Deluxe', 2, 1, 2, 120.00, 'ready'),
('203', 'Deluxe', 2, 2, 4, 140.00, 'ready'),
('301', 'Suite', 3, 1, 2, 200.00, 'ready'),
('302', 'Suite', 3, 1, 2, 200.00, 'maintenance');

-- Products
INSERT INTO products (sku, name, category, unit, unit_cost, unit_price, current_stock, reorder_level, reorder_quantity, location) VALUES
('BEER-001', 'Local Beer', 'beverage', 'bottle', 1.50, 4.00, 200, 50, 100, 'Bar Cooler'),
('WINE-001', 'House Wine', 'beverage', 'glass', 2.00, 6.00, 100, 30, 60, 'Bar Cooler'),
('COFFEE-001', 'Fresh Coffee', 'beverage', 'cup', 0.50, 3.00, 150, 40, 80, 'Kitchen'),
('STEAK-001', 'Grilled Steak', 'food', 'piece', 8.00, 25.00, 30, 10, 20, 'Kitchen Freezer'),
('BURGER-001', 'Beef Burger', 'food', 'piece', 3.50, 12.00, 25, 8, 15, 'Kitchen Freezer'),
('SODA-001', 'Soft Drink', 'beverage', 'can', 0.80, 2.50, 100, 30, 60, 'Bar Cooler'),
('SPA-001', 'Massage', 'spa', 'session', 15.00, 50.00, 10, 2, 5, 'Spa Stock');

-- Staff
INSERT INTO staff (staff_code, full_name, email, role, department, password_hash) VALUES
('ADMIN-001', 'Hotel Manager', 'manager@ruvia.com', 'general_manager', 'management', 'change_me'),
('FD-001', 'Front Desk Agent', 'frontdesk@ruvia.com', 'front_desk', 'front_office', 'change_me'),
('HK-001', 'Housekeeping Lead', 'housekeeping@ruvia.com', 'housekeeping', 'housekeeping', 'change_me'),
('BAR-001', 'Bartender', 'bar@ruvia.com', 'server', 'fandb', 'change_me');

-- Sample guest
INSERT INTO guests (guest_code, full_name, email, phone, preferences) VALUES
('GUEST-001', 'John Smith', 'john.smith@example.com', '+1234567890', '{"pillow": "firm", "coffee": "decaf"}');

-- Sample reservation
INSERT INTO reservations (reservation_number, guest_id, room_id, check_in, check_out, adults, total_amount, status) VALUES
('RES-2024-001', 1, 101, CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days', 2, 320.00, 'confirmed');

-- ============================================
-- RUVIAOS SCHEMA COMPLETE
-- ============================================