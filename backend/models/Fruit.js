const pool = require('../config/db');

// Standard selling price schedule based on fruit and packaging size (Small, Medium, Large)
const DEFAULT_PRICING = {
    1: { name: 'Crisp Red Apples', Small: 75.00, Medium: 100.00, Large: 150.00 },
    2: { name: 'Cavendish Bananas', Small: 55.00, Medium: 85.00, Large: 130.00 },
    3: { name: 'Valencia Oranges', Small: 60.00, Medium: 80.00, Large: 120.00 },
    4: { name: 'Tommy Atkins Mangoes', Small: 75.00, Medium: 120.00, Large: 180.00 },
    5: { name: 'Crimson Seedless Grapes', Small: 60.00, Medium: 95.00, Large: 140.00 }
};

// Base fallback prices if fruit not in list
const BASE_FALLBACK_PRICE = {
    Small: 60.00,
    Medium: 90.00,
    Large: 140.00
};

const Fruit = {
    // Create new fruit type
    create: async ({ fruit_name, description, status = 'AVAILABLE' }) => {
        const [result] = await pool.query(
            `INSERT INTO fruits (fruit_name, description, status) VALUES (?, ?, ?)`,
            [fruit_name, description || '', status]
        );
        const fruitId = result.insertId;

        // Initialize stock records for small, medium, and large packaging sizes
        const sizes = ['Small', 'Medium', 'Large'];
        for (let size of sizes) {
            await pool.query(
                `INSERT INTO stock (fruit_id, packaging_size, available_quantity) 
                 VALUES (?, ?, 0) 
                 ON DUPLICATE KEY UPDATE available_quantity = available_quantity`,
                [fruitId, size]
            );
        }

        return fruitId;
    },

    // Retrieve all fruits
    findAll: async () => {
        const [rows] = await pool.query(`SELECT * FROM fruits ORDER BY fruit_id ASC`);
        return rows;
    },

    // Retrieve fruit by ID
    findById: async (id) => {
        const [rows] = await pool.query(`SELECT * FROM fruits WHERE fruit_id = ?`, [id]);
        return rows[0] || null;
    },

    // Update fruit information
    update: async (id, { fruit_name, description, status }) => {
        const [result] = await pool.query(
            `UPDATE fruits SET fruit_name = ?, description = ?, status = ? WHERE fruit_id = ?`,
            [fruit_name, description, status || 'AVAILABLE', id]
        );
        return result.affectedRows > 0;
    },

    // Check if fruit has transactions
    hasTransactions: async (id) => {
        const [pRows] = await pool.query(`SELECT COUNT(*) AS count FROM purchase_details WHERE fruit_id = ?`, [id]);
        const [sRows] = await pool.query(`SELECT COUNT(*) AS count FROM sales_details WHERE fruit_id = ?`, [id]);
        return (pRows[0].count + sRows[0].count) > 0;
    },

    // Delete fruit
    delete: async (id) => {
        await pool.query(`DELETE FROM stock WHERE fruit_id = ?`, [id]);
        const [result] = await pool.query(`DELETE FROM fruits WHERE fruit_id = ?`, [id]);
        return result.affectedRows > 0;
    },

    // Get unit selling price for fruit and packaging size
    getSellingPrice: (fruit_id, packaging_size) => {
        const normalizedSize = packaging_size.charAt(0).toUpperCase() + packaging_size.slice(1).toLowerCase();
        if (DEFAULT_PRICING[fruit_id] && DEFAULT_PRICING[fruit_id][normalizedSize]) {
            return DEFAULT_PRICING[fruit_id][normalizedSize];
        }
        return BASE_FALLBACK_PRICE[normalizedSize] || 70.00;
    },

    // Get pricing catalog
    getAllPricing: async () => {
        const [fruits] = await pool.query(`SELECT * FROM fruits`);
        return fruits.map(f => {
            const pricing = DEFAULT_PRICING[f.fruit_id] || {
                Small: BASE_FALLBACK_PRICE.Small,
                Medium: BASE_FALLBACK_PRICE.Medium,
                Large: BASE_FALLBACK_PRICE.Large
            };
            return {
                fruit_id: f.fruit_id,
                fruit_name: f.fruit_name,
                prices: {
                    Small: pricing.Small,
                    Medium: pricing.Medium,
                    Large: pricing.Large
                }
            };
        });
    }
};

module.exports = Fruit;
