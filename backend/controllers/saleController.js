const Sale = require('../models/Sale');

// Record sales to vendors
exports.recordSale = async (req, res, next) => {
    try {
        const { vendor_id, payment_method, payment_status, amount_paid, items, notes } = req.body;

        if (!vendor_id) {
            return res.status(400).json({ success: false, message: 'Vendor selection is required.' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Sale items array must contain at least one item.' });
        }

        const result = await Sale.createSale({
            vendor_id,
            payment_method,
            payment_status,
            amount_paid,
            items,
            notes
        });

        res.status(201).json({ 
            success: true, 
            message: 'Sale successfully recorded and inventory balances updated.', 
            sale_id: result.sale_id,
            total_amount: result.total_amount,
            amount_paid: result.amount_paid,
            payment_status: result.payment_status,
            payment_method: result.payment_method,
            items: result.items
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                details: {
                    requested: error.requested,
                    available: error.available,
                    fruit: error.fruit
                }
            });
        }
        next(error);
    }
};

// Retrieve all sales
exports.getAllSales = async (req, res, next) => {
    try {
        const sales = await Sale.findAll();
        res.status(200).json({ success: true, data: sales });
    } catch (error) {
        next(error);
    }
};

// Retrieve single sale by ID with items
exports.getSaleById = async (req, res, next) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale record not found.' });
        }
        res.status(200).json({ success: true, data: sale });
    } catch (error) {
        next(error);
    }
};
