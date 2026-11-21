const pool = require('../config/db');

// Helper to normalize packaging size casing
const normalizeSize = (size) => {
    if (!size) return 'Small';
    const s = String(size).trim().toLowerCase();
    if (s === 'medium') return 'Medium';
    if (s === 'large') return 'Large';
    return 'Small';
};

const Stock = {
    normalizeSize,

    // Current stock levels for each fruit and packaging size
    findAll: async () => {
        const [rows] = await pool.query(`
            SELECT 
                s.stock_id, 
                f.fruit_id, 
                f.fruit_name, 
                f.status AS fruit_status,
                s.packaging_size, 
                s.available_quantity,
                s.last_updated
            FROM stock s
            JOIN fruits f ON s.fruit_id = f.fruit_id
            ORDER BY f.fruit_name, FIELD(s.packaging_size, 'Small', 'Medium', 'Large')
        `);
        return rows;
    },

    // Identify fruits with low stock levels
    findLowStock: async (threshold = 5) => {
        const [rows] = await pool.query(`
            SELECT 
                s.stock_id, 
                f.fruit_id,
                f.fruit_name, 
                s.packaging_size, 
                s.available_quantity
            FROM stock s
            JOIN fruits f ON s.fruit_id = f.fruit_id
            WHERE s.available_quantity < ?
            ORDER BY s.available_quantity ASC
        `, [threshold]);
        return rows;
    },

    // Check specific available quantity with locking inside transaction
    getQuantityForUpdate: async (conn, fruit_id, packaging_size) => {
        const size = normalizeSize(packaging_size);
        const [rows] = await conn.query(
            `SELECT available_quantity FROM stock WHERE fruit_id = ? AND packaging_size = ? FOR UPDATE`,
            [fruit_id, size]
        );
        return rows.length > 0 ? rows[0].available_quantity : 0;
    },

    // Increase stock (for Purchases)
    increaseStock: async (conn, fruit_id, packaging_size, quantity) => {
        const size = normalizeSize(packaging_size);
        await conn.query(`
            INSERT INTO stock (fruit_id, packaging_size, available_quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE available_quantity = available_quantity + ?
        `, [fruit_id, size, quantity, quantity]);
    },

    // Decrease stock (for Sales)
    decreaseStock: async (conn, fruit_id, packaging_size, quantity) => {
        const size = normalizeSize(packaging_size);
        const [result] = await conn.query(`
            UPDATE stock 
            SET available_quantity = available_quantity - ? 
            WHERE fruit_id = ? AND packaging_size = ? AND available_quantity >= ?
        `, [quantity, fruit_id, size, quantity]);

        if (result.affectedRows === 0) {
            throw new Error(`Insufficient stock for Fruit ID ${fruit_id} (${size}).`);
        }
    }
};

module.exports = Stock;
