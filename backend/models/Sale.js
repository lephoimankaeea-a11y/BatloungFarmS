const pool = require('../config/db');
const Stock = require('./Stock');
const Fruit = require('./Fruit');

const normalizePaymentMethod = (method) => {
    if (!method) return 'Cash';
    const m = String(method).toUpperCase();
    if (m.includes('MOBILE')) return 'Mobile Money';
    if (m.includes('CREDIT')) return 'Credit';
    return 'Cash';
};

const Sale = {
    normalizePaymentMethod,

    // Automatic sales calculations and atomic inventory deduction with rollback
    createSale: async ({ vendor_id, payment_method = 'Cash', payment_status, amount_paid = 0, items, notes = '' }) => {
        if (!vendor_id || !Array.isArray(items) || items.length === 0) {
            const err = new Error('Vendor ID and at least one sale item are required.');
            err.statusCode = 400;
            throw err;
        }

        const method = normalizePaymentMethod(payment_method);
        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            // 1. Verify vendor exists
            const [vendorRows] = await conn.query(`SELECT vendor_id, vendor_name FROM vendors WHERE vendor_id = ?`, [vendor_id]);
            if (vendorRows.length === 0) {
                const err = new Error(`Vendor with ID ${vendor_id} does not exist.`);
                err.statusCode = 404;
                throw err;
            }

            // 2. Validate all items, fetch automatic selling prices, and check stock availability
            let total_amount = 0;
            const validatedItems = [];

            for (let item of items) {
                const fruit_id = parseInt(item.fruit_id, 10);
                const quantity = parseInt(item.quantity, 10);
                const packaging_size = Stock.normalizeSize(item.packaging_size);

                if (isNaN(fruit_id) || isNaN(quantity) || quantity <= 0) {
                    const err = new Error('Each item must contain a valid fruit ID and quantity greater than zero.');
                    err.statusCode = 400;
                    throw err;
                }

                // Check fruit existence
                const [fruitRows] = await conn.query(`SELECT fruit_id, fruit_name FROM fruits WHERE fruit_id = ?`, [fruit_id]);
                if (fruitRows.length === 0) {
                    const err = new Error(`Fruit with ID ${fruit_id} does not exist.`);
                    err.statusCode = 404;
                    throw err;
                }
                const fruitName = fruitRows[0].fruit_name;

                // Automatic calculation: look up predefined selling price for packaging size
                // If caller supplied unit_price > 0, use it; otherwise use the automatic catalogue selling price
                let unit_price = parseFloat(item.unit_price);
                if (isNaN(unit_price) || unit_price <= 0) {
                    unit_price = Fruit.getSellingPrice(fruit_id, packaging_size);
                }

                const lineTotal = quantity * unit_price;
                total_amount += lineTotal;

                // Check available stock using FOR UPDATE lock
                const availableQuantity = await Stock.getQuantityForUpdate(conn, fruit_id, packaging_size);

                // Check: e.g. 10 requested, only 6 available -> reject entire transaction atomically
                if (availableQuantity < quantity) {
                    const err = new Error(
                        `Sale rejected: Requested ${quantity} ${packaging_size.toLowerCase()} boxes of ${fruitName}, but only ${availableQuantity} ${packaging_size.toLowerCase()} boxes are currently available.`
                    );
                    err.statusCode = 400;
                    err.available = availableQuantity;
                    err.requested = quantity;
                    err.fruit = fruitName;
                    throw err;
                }

                validatedItems.push({
                    fruit_id,
                    fruit_name: fruitName,
                    packaging_size,
                    quantity,
                    unit_price: Number(unit_price.toFixed(2))
                });
            }

            total_amount = Number(total_amount.toFixed(2));

            // Automatic calculation of payable amount and payment status
            const parsedPaid = parseFloat(amount_paid) || 0;
            let finalStatus = payment_status;
            if (!finalStatus) {
                if (parsedPaid >= total_amount) {
                    finalStatus = 'PAID';
                } else if (parsedPaid > 0) {
                    finalStatus = 'PARTIALLY_PAID';
                } else {
                    finalStatus = 'UNPAID';
                }
            }

            // 3. Insert into Sales header
            const [saleResult] = await conn.query(
                `INSERT INTO sales (vendor_id, payment_method, payment_status, amount_paid, total_amount, notes) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [vendor_id, method, finalStatus, parsedPaid.toFixed(2), total_amount.toFixed(2), notes || null]
            );
            const sale_id = saleResult.insertId;

            // 4. Insert into Sales_Details and reduce stock atomically
            for (let item of validatedItems) {
                await conn.query(
                    `INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [sale_id, item.fruit_id, item.packaging_size, item.quantity, item.unit_price]
                );

                // Reduce inventory for specific packaging size
                await Stock.decreaseStock(conn, item.fruit_id, item.packaging_size, item.quantity);
            }

            await conn.commit();

            return {
                sale_id,
                vendor_id,
                vendor_name: vendorRows[0].vendor_name,
                total_amount,
                amount_paid: parsedPaid,
                payment_method: method,
                payment_status: finalStatus,
                items: validatedItems
            };
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    },

    // Retrieve all sales with vendor info and totals
    findAll: async () => {
        const [rows] = await pool.query(`
            SELECT 
                s.sale_id,
                s.sale_date,
                s.payment_method,
                s.payment_status,
                s.amount_paid,
                s.total_amount,
                (s.total_amount - s.amount_paid) AS balance_due,
                v.vendor_id,
                v.vendor_name,
                v.phone_number,
                COUNT(sd.sales_detail_id) AS item_count,
                COALESCE(SUM(sd.quantity), 0) AS total_boxes
            FROM sales s
            JOIN vendors v ON s.vendor_id = v.vendor_id
            LEFT JOIN sales_details sd ON s.sale_id = sd.sale_id
            GROUP BY s.sale_id, v.vendor_id, v.vendor_name, v.phone_number
            ORDER BY s.sale_date DESC
        `);
        return rows;
    },

    // Retrieve single sale with items
    findById: async (id) => {
        const [sRows] = await pool.query(`
            SELECT s.*, v.vendor_name, v.phone_number, v.location 
            FROM sales s 
            JOIN vendors v ON s.vendor_id = v.vendor_id 
            WHERE s.sale_id = ?
        `, [id]);
        if (sRows.length === 0) return null;

        const [dRows] = await pool.query(`
            SELECT sd.*, f.fruit_name 
            FROM sales_details sd 
            JOIN fruits f ON sd.fruit_id = f.fruit_id 
            WHERE sd.sale_id = ?
        `, [id]);

        return { ...sRows[0], items: dRows };
    }
};

module.exports = Sale;
