const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// 1. The five most frequently sold fruits
router.get('/top-fruits', reportController.getTopSellingFruits);

// 2. The total sales revenue generated during a specified date range
router.get('/revenue', reportController.getRevenueByDateRange);

// 3. The vendor who has purchased the highest number of boxes
router.get('/top-vendor', reportController.getTopVendor);

// 4. Current stock levels for each fruit and packaging size
router.get('/stock-report', reportController.getCurrentStockReport);

// 5. Vendor payment management balances
router.get('/vendor-balances', reportController.getVendorBalances);

module.exports = router;
