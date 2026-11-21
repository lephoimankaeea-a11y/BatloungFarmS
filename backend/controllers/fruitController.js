const Fruit = require('../models/Fruit');
const Stock = require('../models/Stock');

// Register new fruit types
exports.createFruit = async (req, res, next) => {
    try {
        const { fruit_name, description, status } = req.body;
        if (!fruit_name || fruit_name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Fruit name is required.' });
        }

        const validStatuses = ['AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED'];
        const fruitStatus = status && validStatuses.includes(status.toUpperCase()) ? status.toUpperCase() : 'AVAILABLE';

        const fruitId = await Fruit.create({ fruit_name: fruit_name.trim(), description, status: fruitStatus });
        res.status(201).json({ 
            success: true, 
            message: 'Fruit registered successfully and packaging stock balances initialized (Small, Medium, Large).', 
            fruitId 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'A fruit with this name already exists in the system.' });
        }
        next(error);
    }
};

// Retrieve all available fruits
exports.getAllFruits = async (req, res, next) => {
    try {
        const fruits = await Fruit.findAll();
        res.status(200).json({ success: true, data: fruits });
    } catch (error) {
        next(error);
    }
};

// Retrieve fruit by ID
exports.getFruitById = async (req, res, next) => {
    try {
        const fruit = await Fruit.findById(req.params.id);
        if (!fruit) {
            return res.status(404).json({ success: false, message: 'Fruit not found.' });
        }
        res.status(200).json({ success: true, data: fruit });
    } catch (error) {
        next(error);
    }
};

// Update fruit information
exports.updateFruit = async (req, res, next) => {
    try {
        const { fruit_name, description, status } = req.body;
        if (!fruit_name) {
            return res.status(400).json({ success: false, message: 'Fruit name is required.' });
        }

        const updated = await Fruit.update(req.params.id, { fruit_name, description, status });
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Fruit not found.' });
        }
        res.status(200).json({ success: true, message: 'Fruit information updated successfully.' });
    } catch (error) {
        next(error);
    }
};

// Delete fruit (subject to transaction constraints)
exports.deleteFruit = async (req, res, next) => {
    try {
        const fruitId = req.params.id;
        const hasTx = await Fruit.hasTransactions(fruitId);
        if (hasTx) {
            return res.status(409).json({ 
                success: false, 
                message: 'Cannot delete fruit: transactions (purchases or sales) exist for this fruit.' 
            });
        }

        const deleted = await Fruit.delete(fruitId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Fruit not found.' });
        }
        res.status(200).json({ success: true, message: 'Fruit deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

// View stock quantities for each packaging size (small, medium, large)
exports.getStockLevels = async (req, res, next) => {
    try {
        const stock = await Stock.findAll();
        res.status(200).json({ success: true, data: stock });
    } catch (error) {
        next(error);
    }
};

// Identify fruits with low stock levels (< 5 threshold)
exports.getLowStockFruits = async (req, res, next) => {
    try {
        const threshold = parseInt(req.query.threshold, 10) || 5;
        const lowStock = await Stock.findLowStock(threshold);
        res.status(200).json({ success: true, data: lowStock, threshold });
    } catch (error) {
        next(error);
    }
};

// Retrieve selling price catalog for Small, Medium, and Large packaging sizes
exports.getPricing = async (req, res, next) => {
    try {
        const pricing = await Fruit.getAllPricing();
        res.status(200).json({ success: true, data: pricing });
    } catch (error) {
        next(error);
    }
};
