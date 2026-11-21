const Purchase = require('../models/Purchase');

// Record a purchase from a supplier with multiple fruit items
exports.recordPurchase = async (req, res, next) => {
    try {
        const { supplier_id, items, notes } = req.body;

        if (!supplier_id) {
            return res.status(400).json({ success: false, message: 'Supplier ID is required.' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'A non-empty items array is required for purchase.' });
        }

        const result = await Purchase.createPurchase({ supplier_id, items, notes });

        res.status(201).json({ 
            success: true, 
            message: 'Purchase recorded and stock quantities updated successfully.', 
            purchase_id: result.purchase_id, 
            total_amount: result.total_amount,
            item_count: result.item_count
        });
    } catch (error) {
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message.includes('valid fruit ID') || error.message.includes('required')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

// Retrieve all purchases
exports.getAllPurchases = async (req, res, next) => {
    try {
        const purchases = await Purchase.findAll();
        res.status(200).json({ success: true, data: purchases });
    } catch (error) {
        next(error);
    }
};

// Retrieve purchase by ID
exports.getPurchaseById = async (req, res, next) => {
    try {
        const purchase = await Purchase.findById(req.params.id);
        if (!purchase) {
            return res.status(404).json({ success: false, message: 'Purchase record not found.' });
        }
        res.status(200).json({ success: true, data: purchase });
    } catch (error) {
        next(error);
    }
};
