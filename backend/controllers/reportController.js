const Report = require('../models/Report');

// 1. The five most frequently sold fruits
exports.getTopSellingFruits = async (req, res, next) => {
    try {
        const data = await Report.getTopSellingFruits();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// 2. The total sales revenue generated during a specified date range
exports.getRevenueByDateRange = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const data = await Report.getRevenueByDateRange(startDate, endDate);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// 3. The vendor who has purchased the highest number of boxes
exports.getTopVendor = async (req, res, next) => {
    try {
        const data = await Report.getTopVendor();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// 4. Current stock levels for each fruit and packaging size
exports.getCurrentStockReport = async (req, res, next) => {
    try {
        const data = await Report.getStockLevels();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// 5. Vendor payment management: Calculate and display the outstanding balance for each vendor
exports.getVendorBalances = async (req, res, next) => {
    try {
        const data = await Report.getVendorBalances();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
