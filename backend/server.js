const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 1. Initialize Express app FIRST
const app = express();

// 2. Middleware
app.use(express.json());
app.use(cors());

// 3. Import Routes
// Homepage Route
app.get('/', (req, res) => {
    res.send('Batloung Fruits Distribution Management System API is running!');
});
const supplierRoutes = require('./routes/supplierRoutes');
const fruitRoutes = require('./routes/fruitRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const saleRoutes = require('./routes/saleRoutes');
const reportRoutes = require('./routes/reportRoutes'); // Make sure this file exists in your routes folder!

// 4. Register API Routes (app is fully initialized now)
app.use('/api/suppliers', supplierRoutes);
app.use('/api/fruits', fruitRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reports', reportRoutes);

// 5. Global Error Handler
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// 6. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});