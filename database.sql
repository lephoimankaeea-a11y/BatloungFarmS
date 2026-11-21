
-- =====================================================================
-- BATLOUNG FARM DISTRIBUTION MANAGEMENT SYSTEM
-- Course: DIWA2110 Web Application Development
-- Limkokwing University of Creative Technology, Lesotho
-- =====================================================================

USE batloung_farmsystem;

SET FOREIGN_KEY_CHECKS = 0;

-- DROP EXISTING TABLES
DROP TABLE IF EXISTS purchase_details;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS sales_details;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS stock;
DROP TABLE IF EXISTS fruits;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS suppliers;

-- =====================================================================
-- 1. SUPPLIERS
-- =====================================================================

CREATE TABLE suppliers (
    supplier_id INT NOT NULL AUTO_INCREMENT,
    business_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(25) NOT NULL,
    province ENUM(
        'Gauteng',
        'Free State',
        'KwaZulu-Natal',
        'Western Cape',
        'Eastern Cape',
        'Limpopo',
        'Mpumalanga',
        'North West'
    ) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (supplier_id),
    UNIQUE KEY uq_supplier_business (business_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 2. FRUITS
-- =====================================================================

CREATE TABLE fruits (
    fruit_id INT NOT NULL AUTO_INCREMENT,
    fruit_name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    status ENUM('AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED')
        NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (fruit_id),
    UNIQUE KEY uq_fruit_name (fruit_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 3. VENDORS IN LESOTHO
-- =====================================================================

CREATE TABLE vendors (
    vendor_id INT NOT NULL AUTO_INCREMENT,
    vendor_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(25) NOT NULL,
    location VARCHAR(150) NOT NULL,
    registration_date DATE NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (vendor_id),
    UNIQUE KEY uq_vendor_phone (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 4. PURCHASES
-- =====================================================================

CREATE TABLE purchases (
    purchase_id INT NOT NULL AUTO_INCREMENT,
    supplier_id INT NOT NULL,
    purchase_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (purchase_id),
    KEY idx_purchases_supplier (supplier_id),
    CONSTRAINT fk_purchases_supplier FOREIGN KEY (supplier_id)
        REFERENCES suppliers (supplier_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_purchases_total CHECK (total_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 5. PURCHASE DETAILS
-- =====================================================================

CREATE TABLE purchase_details (
    purchase_detail_id INT NOT NULL AUTO_INCREMENT,
    purchase_id INT NOT NULL,
    fruit_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    packaging_size ENUM('Small', 'Medium', 'Large') NOT NULL,
    PRIMARY KEY (purchase_detail_id),
    KEY idx_pd_purchase (purchase_id),
    KEY idx_pd_fruit (fruit_id),
    CONSTRAINT fk_pd_purchase FOREIGN KEY (purchase_id)
        REFERENCES purchases (purchase_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pd_fruit FOREIGN KEY (fruit_id)
        REFERENCES fruits (fruit_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_pd_quantity CHECK (quantity > 0),
    CONSTRAINT chk_pd_unit_cost CHECK (unit_cost >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 6. SALES
-- =====================================================================

CREATE TABLE sales (
    sale_id INT NOT NULL AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('Cash', 'Mobile Money', 'Credit') NOT NULL DEFAULT 'Cash',
    payment_status ENUM('PAID', 'PARTIALLY_PAID', 'UNPAID') NOT NULL DEFAULT 'UNPAID',
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (sale_id),
    KEY idx_sales_vendor (vendor_id),
    CONSTRAINT fk_sales_vendor FOREIGN KEY (vendor_id)
        REFERENCES vendors (vendor_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_sales_amount_paid CHECK (amount_paid >= 0),
    CONSTRAINT chk_sales_total_amount CHECK (total_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 7. SALES DETAILS
-- =====================================================================

CREATE TABLE sales_details (
    sales_detail_id INT NOT NULL AUTO_INCREMENT,
    sale_id INT NOT NULL,
    fruit_id INT NOT NULL,
    packaging_size ENUM('Small', 'Medium', 'Large') NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (sales_detail_id),
    KEY idx_sd_sale (sale_id),
    KEY idx_sd_fruit (fruit_id),
    CONSTRAINT fk_sd_sale FOREIGN KEY (sale_id)
        REFERENCES sales (sale_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sd_fruit FOREIGN KEY (fruit_id)
        REFERENCES fruits (fruit_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_sd_quantity CHECK (quantity > 0),
    CONSTRAINT chk_sd_unit_price CHECK (unit_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 8. STOCK
-- =====================================================================

CREATE TABLE stock (
    stock_id INT NOT NULL AUTO_INCREMENT,
    fruit_id INT NOT NULL,
    packaging_size ENUM('Small', 'Medium', 'Large') NOT NULL,
    available_quantity INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (stock_id),
    UNIQUE KEY uq_fruit_packaging (fruit_id, packaging_size),
    CONSTRAINT fk_stock_fruit FOREIGN KEY (fruit_id)
        REFERENCES fruits (fruit_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_stock_quantity CHECK (available_quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- SAMPLE DATA
-- =====================================================================

-- 1. SUPPLIERS

INSERT INTO suppliers
(business_name, contact_person, phone, province, address)
VALUES
('Highveld Orchards Ltd', 'Thabo thabi', '+27 11 832 9400', 'Gauteng', 'Plot 44, Springs Agricultural Holdings, Johannesburg'),
('Maluti Fresh Farms', 'Maki Ntlo', '+27 58 303 5521', 'Free State', 'Farm Rooikrans, Ficksburg, Eastern Free State'),
('Durban Subtropical Produce', 'Sipho selala', '+27 31 569 2200', 'KwaZulu-Natal', '12 Umgeni Road, Riverhorse Valley, Durban'),
('Cape Valley Fruit Growers', 'Palesa See', '+27 21 870 1199', 'Western Cape', 'Valley Road, Paarl, Western Cape'),
('Sundays River Citrus Co', 'Thabo Koena', '+27 42 230 0411', 'Eastern Cape', 'Main Street, Kirkwood, Sundays River Valley'),
('Limpopo Golden Mangoes', 'Hennie Botha', '+27 15 307 8899', 'Limpopo', 'Agri Park, Tzaneen, Limpopo'),
('Lowveld Banana Wholesalers', 'Lephoi l', '+27 13 752 4433', 'Mpumalanga', 'Lowveld Industrial Area, Nelspruit'),
('Rustenburg Citrus Estates', 'Keketso Kubu', '+27 14 592 1010', 'North West', 'Plot 12, Kroondal, Rustenburg');
-- 2. FRUITS

INSERT INTO fruits (fruit_id, fruit_name, description, status)
VALUES
(1, 'Crisp Red Apples', 'Crisp Royal Gala and Top Red orchard apples', 'AVAILABLE'),
(2, 'Cavendish Bananas', 'Sweet ripe Cavendish bananas in ventilated boxes', 'AVAILABLE'),
(3, 'Valencia Oranges', 'Juicy seedless Valencia sweet citrus oranges', 'AVAILABLE'),
(4, 'Tommy Atkins Mangoes', 'Sweet aromatic tropical mangoes from Limpopo', 'AVAILABLE'),
(5, 'Crimson Seedless Grapes', 'Crisp sweet premium red seedless table grapes', 'AVAILABLE');

-- 3. LESOTHO VENDORS

INSERT INTO vendors
(vendor_id, vendor_name, phone_number, location, registration_date)
VALUES
(1, 'Mpho Mokoena Fresh Produce', '+266 5889 1234', 'Kingsway Street, Maseru Central', '2026-01-15'),
(2, 'Lineo Mofokeng General Dealers', '+266 6201 4455', 'Sebaboleng, Maseru', '2026-02-01'),
(3, 'Palesa Ntlhoki Fruit Stall', '+266 5912 3344', 'Ha Thetsane, Maseru', '2026-02-20'),
(4, 'Teboho Khaketla Retail Shop', '+266 5005 6677', 'Maseru Bus Stop, Maseru', '2026-03-05'),
(5, 'Masechaba Rantso Fresh Market', '+266 6310 9988', 'Cathedral Area, Maseru', '2026-03-18'),
(6, 'Khotso Mokhothu Produce Stall', '+266 5774 2211', 'Lithabaneng, Maseru', '2026-04-10');

-- 4. INITIAL STOCK

INSERT INTO stock (fruit_id, packaging_size, available_quantity)
VALUES
(1, 'Small', 45),
(1, 'Medium', 35),
(1, 'Large', 6),
(2, 'Small', 60),
(2, 'Medium', 40),
(2, 'Large', 20),
(3, 'Small', 50),
(3, 'Medium', 30),
(3, 'Large', 15),
(4, 'Small', 25),
(4, 'Medium', 18),
(4, 'Large', 4),
(5, 'Small', 30),
(5, 'Medium', 20),
(5, 'Large', 10);

-- 5. SAMPLE PURCHASES

INSERT INTO purchases
(purchase_id, supplier_id, purchase_date, total_amount, notes)
VALUES
(1, 1, '2026-10-01 09:30:00', 8500.00, 'Consignment of Gala Apples'),
(2, 2, '2026-10-10 11:15:00', 6200.00, 'Free State Oranges shipment'),
(3, 7, '2026-10-25 14:00:00', 9400.00, 'Lowveld Cavendish Bananas');

INSERT INTO purchase_details
(purchase_id, fruit_id, quantity, unit_cost, packaging_size)
VALUES
(1, 1, 20, 250.00, 'Small'),
(1, 1, 10, 350.00, 'Large'),
(2, 3, 20, 180.00, 'Medium'),
(2, 3, 10, 260.00, 'Large'),
(3, 2, 30, 200.00, 'Small'),
(3, 2, 17, 200.00, 'Medium');

-- 6. SAMPLE SALES

INSERT INTO sales
(sale_id, vendor_id, sale_date, payment_method, payment_status, amount_paid, total_amount, notes)
VALUES
(1, 1, '2026-11-01 10:00:00', 'Cash', 'PAID', 1250.00, 1250.00, 'Paid in full on collection'),
(2, 2, '2026-11-05 14:30:00', 'Mobile Money', 'PARTIALLY_PAID', 800.00, 1500.00, 'M-Pesa deposit, balance pending'),
(3, 3, '2026-11-10 09:15:00', 'Credit', 'UNPAID', 0.00, 2100.00, '30-day street vendor credit line'),
(4, 4, '2026-11-12 16:45:00', 'Cash', 'PAID', 950.00, 950.00, 'Bus stop terminal order'),
(5, 1, '2026-11-15 11:20:00', 'Mobile Money', 'PAID', 1800.00, 1800.00, 'EcoCash settlement');

INSERT INTO sales_details
(sale_id, fruit_id, packaging_size, quantity, unit_price)
VALUES
(1, 1, 'Small', 10, 75.00),
(1, 2, 'Medium', 5, 100.00),
(2, 3, 'Small', 15, 60.00),
(2, 4, 'Medium', 5, 120.00),
(3, 1, 'Large', 10, 150.00),
(3, 5, 'Small', 10, 60.00),
(4, 2, 'Small', 10, 55.00),
(4, 3, 'Medium', 5, 80.00),
(5, 1, 'Medium', 12, 100.00),
(5, 4, 'Small', 8, 75.00);

-- =====================================================================
-- PART D: SQL REPORTING QUERIES
-- =====================================================================

-- 1. FIVE MOST FREQUENTLY SOLD FRUITS

SELECT
    f.fruit_id,
    f.fruit_name,
    SUM(sd.quantity) AS total_quantity_sold
FROM sales_details sd
JOIN fruits f ON sd.fruit_id = f.fruit_id
GROUP BY f.fruit_id, f.fruit_name
ORDER BY total_quantity_sold DESC
LIMIT 5;

-- 2. TOTAL SALES REVENUE

SELECT
    COALESCE(SUM(total_amount), 0.00) AS total_revenue
FROM sales
WHERE sale_date BETWEEN '2026-01-01 00:00:00' AND '2026-12-31 23:59:59'
AND payment_status != 'UNPAID';

-- 3. VENDOR WHO PURCHASED THE MOST BOXES

SELECT
    v.vendor_id,
    v.vendor_name,
    v.phone_number,
    SUM(sd.quantity) AS total_boxes_purchased
FROM sales_details sd
JOIN sales s ON sd.sale_id = s.sale_id
JOIN vendors v ON s.vendor_id = v.vendor_id
GROUP BY v.vendor_id, v.vendor_name, v.phone_number
ORDER BY total_boxes_purchased DESC
LIMIT 1;

-- 4. CURRENT STOCK LEVELS

SELECT
    s.stock_id,
    f.fruit_id,
    f.fruit_name,
    s.packaging_size,
    s.available_quantity,
    s.last_updated
FROM stock s
JOIN fruits f ON s.fruit_id = f.fruit_id
ORDER BY f.fruit_name,
FIELD(s.packaging_size, 'Small', 'Medium', 'Large');

-- 5. VENDOR PAYMENT BALANCES

SELECT
    v.vendor_id,
    v.vendor_name,
    v.phone_number,
    COALESCE(SUM(s.total_amount), 0.00) AS total_billed,
    COALESCE(SUM(s.amount_paid), 0.00) AS total_paid,
    (
        COALESCE(SUM(s.total_amount), 0.00)
        - COALESCE(SUM(s.amount_paid), 0.00)
    ) AS outstanding_balance
FROM vendors v
LEFT JOIN sales s ON v.vendor_id = s.vendor_id
GROUP BY v.vendor_id, v.vendor_name, v.phone_number
ORDER BY outstanding_balance DESC;
