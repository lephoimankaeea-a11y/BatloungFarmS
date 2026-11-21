const pool = require('../config/db');

const Supplier = {
    // Create new supplier
    create: async ({ business_name, contact_person, phone, province, address }) => {
        const [result] = await pool.query(
            `INSERT INTO suppliers (business_name, contact_person, phone, province, address) 
             VALUES (?, ?, ?, ?, ?)`,
            [business_name, contact_person, phone, province, address]
        );
        return result.insertId;
    },

    // Retrieve all suppliers
    findAll: async () => {
        const [rows] = await pool.query(`SELECT * FROM suppliers ORDER BY supplier_id ASC`);
        return rows;
    },

    // Retrieve supplier by ID
    findById: async (id) => {
        const [rows] = await pool.query(`SELECT * FROM suppliers WHERE supplier_id = ?`, [id]);
        return rows[0] || null;
    },

    // Update supplier
    update: async (id, { business_name, contact_person, phone, province, address }) => {
        const [result] = await pool.query(
            `UPDATE suppliers 
             SET business_name = ?, contact_person = ?, phone = ?, province = ?, address = ? 
             WHERE supplier_id = ?`,
            [business_name, contact_person, phone, province, address, id]
        );
        return result.affectedRows > 0;
    },

    // Check if supplier has purchases before deleting
    hasPurchases: async (id) => {
        const [rows] = await pool.query(
            `SELECT COUNT(*) AS count FROM purchases WHERE supplier_id = ?`,
            [id]
        );
        return rows[0].count > 0;
    },

    // Delete supplier
    delete: async (id) => {
        const [result] = await pool.query(`DELETE FROM suppliers WHERE supplier_id = ?`, [id]);
        return result.affectedRows > 0;
    }
};

module.exports = Supplier;
