const pool = require('../config/db');

const Vendor = {
    // Register a new vendor (Fixes typo: registration_date)
    create: async ({ vendor_name, phone_number, location, registration_date }) => {
        const regDate = registration_date || new Date().toISOString().split('T')[0];
        const [result] = await pool.query(
            `INSERT INTO vendors (vendor_name, phone_number, location, registration_date) 
             VALUES (?, ?, ?, ?)`,
            [vendor_name, phone_number, location, regDate]
        );
        return result.insertId;
    },

    // Retrieve vendors with optional search by name or phone
    findAll: async (search = '') => {
        let sql = `SELECT * FROM vendors`;
        const params = [];
        if (search && search.trim() !== '') {
            sql += ` WHERE vendor_name LIKE ? OR phone_number LIKE ?`;
            params.push(`%${search.trim()}%`, `%${search.trim()}%`);
        }
        sql += ` ORDER BY vendor_id ASC`;
        const [rows] = await pool.query(sql, params);
        return rows;
    },

    // Retrieve single vendor by ID
    findById: async (id) => {
        const [rows] = await pool.query(`SELECT * FROM vendors WHERE vendor_id = ?`, [id]);
        return rows[0] || null;
    },

    // Update vendor details
    update: async (id, { vendor_name, phone_number, location }) => {
        const [result] = await pool.query(
            `UPDATE vendors 
             SET vendor_name = ?, phone_number = ?, location = ? 
             WHERE vendor_id = ?`,
            [vendor_name, phone_number, location, id]
        );
        return result.affectedRows > 0;
    },

    // Check if vendor has sales records
    hasSales: async (id) => {
        const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM sales WHERE vendor_id = ?`, [id]);
        return rows[0].count > 0;
    },

    // Delete vendor
    delete: async (id) => {
        const [result] = await pool.query(`DELETE FROM vendors WHERE vendor_id = ?`, [id]);
        return result.affectedRows > 0;
    },

    // Calculate vendor outstanding balance
    getBalance: async (id) => {
        const [rows] = await pool.query(
            `SELECT 
                v.vendor_id, 
                v.vendor_name, 
                v.phone_number,
                COALESCE(SUM(s.total_amount), 0.00) AS total_billed,
                COALESCE(SUM(s.amount_paid), 0.00) AS total_paid,
                (COALESCE(SUM(s.total_amount), 0.00) - COALESCE(SUM(s.amount_paid), 0.00)) AS outstanding_balance
             FROM vendors v
             LEFT JOIN sales s ON v.vendor_id = s.vendor_id
             WHERE v.vendor_id = ?
             GROUP BY v.vendor_id, v.vendor_name, v.phone_number`,
            [id]
        );
        return rows[0] || null;
    },

    // Vendor Payment Management Function:
    // Supports Cash payments, Mobile money payments, and settlements of credit balances.
    // Records payment status as PAID, PARTIALLY_PAID, or UNPAID.
    recordPayment: async (vendor_id, { amount, payment_method = 'Cash', notes = '' }) => {
        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            throw new Error('Valid payment amount greater than zero is required.');
        }

        // Normalize payment method enum: 'Cash', 'Mobile Money', 'Credit'
        let method = 'Cash';
        const pmUpper = String(payment_method).toUpperCase();
        if (pmUpper.includes('MOBILE')) method = 'Mobile Money';
        else if (pmUpper.includes('CREDIT')) method = 'Credit';
        else method = 'Cash';

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Find unpaid or partially paid sales for this vendor ordered by date
            const [sales] = await conn.query(
                `SELECT sale_id, total_amount, amount_paid, payment_status 
                 FROM sales 
                 WHERE vendor_id = ? AND payment_status != 'PAID'
                 ORDER BY sale_date ASC 
                 FOR UPDATE`,
                [vendor_id]
            );

            let remaining = paymentAmount;
            const updatedSales = [];

            for (let sale of sales) {
                if (remaining <= 0) break;

                const currentPaid = parseFloat(sale.amount_paid);
                const total = parseFloat(sale.total_amount);
                const dueOnSale = total - currentPaid;

                const paymentForThisSale = Math.min(remaining, dueOnSale);
                const newPaid = currentPaid + paymentForThisSale;
                remaining -= paymentForThisSale;

                let newStatus = 'PARTIALLY_PAID';
                if (newPaid >= total) {
                    newStatus = 'PAID';
                }

                await conn.query(
                    `UPDATE sales 
                     SET amount_paid = ?, payment_status = ?, payment_method = ? 
                     WHERE sale_id = ?`,
                    [newPaid.toFixed(2), newStatus, method, sale.sale_id]
                );

                updatedSales.push({
                    sale_id: sale.sale_id,
                    allocated: paymentForThisSale,
                    new_paid: newPaid,
                    status: newStatus
                });
            }

            await conn.commit();

            // Return fresh balance
            const [balanceRows] = await pool.query(
                `SELECT 
                    v.vendor_id, 
                    v.vendor_name, 
                    COALESCE(SUM(s.total_amount), 0.00) AS total_billed,
                    COALESCE(SUM(s.amount_paid), 0.00) AS total_paid,
                    (COALESCE(SUM(s.total_amount), 0.00) - COALESCE(SUM(s.amount_paid), 0.00)) AS outstanding_balance
                 FROM vendors v
                 LEFT JOIN sales s ON v.vendor_id = s.vendor_id
                 WHERE v.vendor_id = ?
                 GROUP BY v.vendor_id, v.vendor_name`,
                [vendor_id]
            );

            return {
                vendor_id,
                amount_received: paymentAmount,
                payment_method: method,
                allocated_sales: updatedSales,
                balance: balanceRows[0] || null
            };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
};

module.exports = Vendor;
