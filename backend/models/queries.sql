-- =====================================================================
-- PART D: SQL REPORTING QUERIES FOR BATLOUNG FARM SYSTEM
-- =====================================================================

-- 1. The five most frequently sold fruits:
SELECT 
    f.fruit_id,
    f.fruit_name, 
    SUM(sd.quantity) AS total_quantity_sold
FROM sales_details sd
JOIN fruits f ON sd.fruit_id = f.fruit_id
GROUP BY f.fruit_id, f.fruit_name
ORDER BY total_quantity_sold DESC
LIMIT 5;

-- 2. Total sales revenue generated during a specified date range:
SELECT 
    COALESCE(SUM(total_amount), 0.00) AS total_revenue
FROM sales
WHERE sale_date BETWEEN ? AND ?
  AND payment_status != 'UNPAID';

-- 3. The vendor who has purchased the highest number of boxes:
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

-- 4. Current stock levels for each fruit and packaging size:
SELECT 
    s.stock_id,
    f.fruit_id,
    f.fruit_name, 
    s.packaging_size, 
    s.available_quantity,
    s.last_updated
FROM stock s
JOIN fruits f ON s.fruit_id = f.fruit_id
ORDER BY f.fruit_name, FIELD(s.packaging_size, 'Small', 'Medium', 'Large');

-- 5. Vendor payment balances (total billed, total paid, outstanding balance):
SELECT 
    v.vendor_id, 
    v.vendor_name, 
    v.phone_number,
    COALESCE(SUM(s.total_amount), 0.00) AS total_billed,
    COALESCE(SUM(s.amount_paid), 0.00) AS total_paid,
    (COALESCE(SUM(s.total_amount), 0.00) - COALESCE(SUM(s.amount_paid), 0.00)) AS outstanding_balance
FROM vendors v
LEFT JOIN sales s ON v.vendor_id = s.vendor_id
GROUP BY v.vendor_id, v.vendor_name, v.phone_number
ORDER BY outstanding_balance DESC;
