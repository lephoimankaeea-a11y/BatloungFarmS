const pool = require('../config/db');

const Report = {
    // 1. The five most frequently sold fruits
    getTopSellingFruits: async () => {
        const [rows] = await pool.query(`
            SELECT 
                f.fruit_id,
                f.fruit_name, 
                SUM(sd.quantity) AS total_quantity_sold
            FROM sales_details sd
            JOIN fruits f ON sd.fruit_id = f.fruit_id
            GROUP BY f.fruit_id, f.fruit_name
            ORDER BY total_quantity_sold DESC
            LIMIT 5
        `);
        return rows;
    },

    // 2. The total sales revenue generated during a specified date range
    getRevenueByDateRange: async (startDate, endDate) => {
        const start = startDate ? `${startDate} 00:00:00` : '2026-01-01 00:00:00';
        const end = endDate ? `${endDate} 23:59:59` : '2026-12-31 23:59:59';

        const [rows] = await pool.query(`
            SELECT 
                COALESCE(SUM(total_amount), 0.00) AS total_revenue
            FROM sales
            WHERE sale_date BETWEEN ? AND ?
              AND payment_status != 'UNPAID'
        `, [start, end]);

        return {
            revenue: parseFloat(rows[0].total_revenue || 0),
            startDate: start,
            endDate: end
        };
    },

    // 3. The vendor who has purchased the highest number of boxes
    getTopVendor: async () => {
        const [rows] = await pool.query(`
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
            LIMIT 1
        `);
        return rows[0] || null;
    },

    // 4. Current stock levels for each fruit and packaging size
    getStockLevels: async () => {
        const [rows] = await pool.query(`
            SELECT 
                s.stock_id,
                f.fruit_id,
                f.fruit_name, 
                s.packaging_size, 
                s.available_quantity,
                s.last_updated
            FROM stock s
            JOIN fruits f ON s.fruit_id = f.fruit_id
            ORDER BY f.fruit_name, FIELD(s.packaging_size, 'Small', 'Medium', 'Large')
        `);
        return rows;
    },

    // 5. Vendor payment management: Calculate and display outstanding balance for each vendor
    getVendorBalances: async () => {
        const [rows] = await pool.query(`
            SELECT 
                v.vendor_id, 
                v.vendor_name, 
                v.phone_number,
                v.location,
                COALESCE(SUM(s.total_amount), 0.00) AS total_billed,
                COALESCE(SUM(s.amount_paid), 0.00) AS total_paid,
                (COALESCE(SUM(s.total_amount), 0.00) - COALESCE(SUM(s.amount_paid), 0.00)) AS outstanding_balance
            FROM vendors v
            LEFT JOIN sales s ON v.vendor_id = s.vendor_id
            GROUP BY v.vendor_id, v.vendor_name, v.phone_number, v.location
            ORDER BY outstanding_balance DESC
        `);
        return rows;
    }
};

module.exports = Report;
