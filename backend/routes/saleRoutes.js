const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');

router.post('/', saleController.recordSale);
router.get('/', saleController.getAllSales);
router.get('/:id', saleController.getSaleById);

module.exports = router;
