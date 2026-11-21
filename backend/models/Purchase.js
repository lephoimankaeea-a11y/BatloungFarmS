const pool = require('../config/db');
const Stock = require('./Stock');

const Purchase = {
    // Record a purchase from a supplier with atomic transaction
    createPurchase: async ({ supplier_id, items, notes = '' }) => {
        if (!supplier_id || !Array.isArray(items) || items.length === 0) {
            throw new Error('Supplier ID and at least one purchase item are required.');
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Verify supplier exists
            const [supRows] = await conn.query(`SELECT supplier_id FROM suppliers WHERE supplier_id = ?`, [supplier_id]);
            if (supRows.length === 0) {
                throw new Error(`Supplier with ID ${supplier_id} not found.`);
            }

            // Calculate total purchase amount automatically
            let total_amount = 0;
            const normalizedItems = [];

            for (let item of items) {
                const qty = parseInt(item.quantity, 10);
                const cost = parseFloat(item.unit_cost);
                const fruit_id = parseInt(item.fruit_id, 10);
                const size = Stock.normalizeSize(item.packaging_size);

                if (isNaN(fruit_id) || isNaN(qty) || qty <= 0 || isNaN(cost) || cost < 0) {
                    throw new Error('Each item must have a valid fruit ID, quantity (>0), and unit cost (>=0).');
                }

                // Verify fruit exists
                const [fruitRows] = await conn.query(`SELECT fruit_id FROM fruits WHERE fruit_id = ?`, [fruit_id]);
                if (fruitRows.length === 0) {
                    throw new Error(`Fruit with ID ${fruit_id} does not exist.`);
                }

                total_amount += qty * cost;
                normalizedItems.push({ fruit_id, quantity: qty, unit_cost: cost, packaging_size: size });
            }

            // 1. Insert into Purchases header
            const [purchaseResult] = await conn.query(
                `INSERT INTO purchases (supplier_id, total_amount, notes) VALUES (?, ?, ?)`,
                [supplier_id, total_amount.toFixed(2), notes || null]
            );
            const purchase_id = purchaseResult.insertId;

            // 2. Insert into purchase_details and update stock atomically
            for (let item of normalizedItems) {
                await conn.query(
                    `INSERT INTO purchase_details (purchase_id, fruit_id, quantity, unit_cost, packaging_size) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [purchase_id, item.fruit_id, item.quantity, item.unit_cost, item.packaging_size]
                );

                // Increase packaging-specific stock
                await Stock.increaseStock(conn, item.fruit_id, item.packaging_size, item.quantity);
            }

            await conn.commit();

            return {
                purchase_id,
                supplier_id,
                total_amount: Number(total_amount.toFixed(2)),
                item_count: normalizedItems.length
            };
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    },

    // Retrieve all purchases with supplier details
    findAll: async () => {
        const [rows] = await pool.query(`
            SELECT 
                p.purchase_id,
                p.purchase_date,
                p.total_amount,
                p.notes,
                s.supplier_id,
                s.business_name,
                s.province,
                COUNT(pd.purchase_detail_id) AS total_items,
                COALESCE(SUM(pd.quantity), 0) AS total_boxes
            FROM purchases p
            JOIN suppliers s ON p.supplier_id = s.supplier_id
            LEFT JOIN purchase_details pd ON p.purchase_id = pd.purchase_id
            GROUP BY p.purchase_id, s.supplier_id, s.business_name, s.province
            ORDER BY p.purchase_date DESC
        `);
        return rows;
    },

    // Retrieve single purchase with all line details
    findById: async (id) => {
        const [pRows] = await pool.query(`
            SELECT p.*, s.business_name, s.contact_person, s.phone, s.province 
            FROM purchases p 
            JOIN suppliers s ON p.supplier_id = s.supplier_id 
            WHERE p.purchase_id = ?
        `, [id]);
        if (pRows.length === 0) return null;

        const [dRows] = await pool.query(`
            SELECT pd.*, f.fruit_name 
            FROM purchase_details pd 
            JOIN fruits f ON pd.fruit_id = f.fruit_id 
            WHERE pd.purchase_id = ?
        `, [id]);

        return { ...pRows[0], items: dRows };
    }
};

module.exports = Purchase;
