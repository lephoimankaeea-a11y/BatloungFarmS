// =====================================================================
// AUTOMATED TEST SUITE FOR BATLOUNG FARM DISTRIBUTION SYSTEM
// Tests all Part A, B, C, and D rubric requirements
// =====================================================================

const pool = require('./config/db');
const Supplier = require('./models/Supplier');
const Fruit = require('./models/Fruit');
const Vendor = require('./models/Vendor');
const Purchase = require('./models/Purchase');
const Sale = require('./models/Sale');
const Stock = require('./models/Stock');
const Report = require('./models/Report');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passedTests++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    }
}

async function runTests() {
    console.log('====================================================');
    console.log('🧪 Starting Batloung Farm System Automated Test Suite');
    console.log('====================================================\n');

    // -----------------------------------------------------------------
    // TEST GROUP 1: Database Schema & Part A Tables
    // -----------------------------------------------------------------
    console.log('📋 Test Group 1: Database Schema & Relational Tables');
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    const expectedTables = ['suppliers', 'fruits', 'vendors', 'purchases', 'purchase_details', 'sales', 'sales_details', 'stock'];
    for (let expected of expectedTables) {
        assert(tableNames.includes(expected), `Table '${expected}' exists in batloung_farm_db`);
    }

    // -----------------------------------------------------------------
    // TEST GROUP 2: Supplier Management
    // -----------------------------------------------------------------
    console.log('\n📋 Test Group 2: Supplier Management (CRUD)');
    const supId = await Supplier.create({
        business_name: `Test Orchard ${Date.now()}`,
        contact_person: 'Koos Nel',
        phone: '+27 12 345 6789',
        province: 'Gauteng',
        address: 'Pretoria Agricultural plots'
    });
    assert(supId > 0, `Registered new supplier with ID: ${supId}`);

    const supplier = await Supplier.findById(supId);
    assert(supplier && supplier.province === 'Gauteng', 'Retrieved supplier by ID matches province');

    const updated = await Supplier.update(supId, {
        business_name: supplier.business_name,
        contact_person: 'Koos Nel Jr.',
        phone: '+27 12 345 9999',
        province: 'Gauteng',
        address: 'Updated plot address'
    });
    assert(updated === true, 'Supplier updated successfully');

    const deleted = await Supplier.delete(supId);
    assert(deleted === true, 'Supplier deleted successfully when no purchases exist');

    // -----------------------------------------------------------------
    // TEST GROUP 3: Vendor Management (Fixes registiration_date typo)
    // -----------------------------------------------------------------
    console.log('\n📋 Test Group 3: Vendor Management & Search');
    const testPhone = `+266 5${Math.floor(1000000 + Math.random() * 9000000)}`;
    const vendorId = await Vendor.create({
        vendor_name: 'Khothatso Fruit Corner',
        phone_number: testPhone,
        location: 'Maseru Pitso Ground',
        registration_date: '2026-03-01'
    });
    assert(vendorId > 0, `Vendor registered successfully with ID: ${vendorId} (registration_date typo fixed!)`);

    const searchResults = await Vendor.findAll('Khothatso');
    assert(searchResults.some(v => v.vendor_id === vendorId), 'Found vendor via name search query');

    const phoneSearchResults = await Vendor.findAll(testPhone);
    assert(phoneSearchResults.some(v => v.vendor_id === vendorId), 'Found vendor via phone search query');

    // -----------------------------------------------------------------
    // TEST GROUP 4: Fruit & Stock Management (Packaging Sizes)
    // -----------------------------------------------------------------
    console.log('\n📋 Test Group 4: Fruit & Packaging-Specific Stock Design');
    const fruitId = await Fruit.create({
        fruit_name: `Test Peaches ${Date.now()}`,
        description: 'Juicy yellow cling peaches',
        status: 'AVAILABLE'
    });
    assert(fruitId > 0, `Fruit created with ID: ${fruitId}`);

    const stockLevels = await Stock.findAll();
    const fruitStock = stockLevels.filter(s => s.fruit_id === fruitId);
    assert(fruitStock.length === 3, 'Created separate stock records for Small, Medium, and Large packaging sizes');

    // -----------------------------------------------------------------
    // TEST GROUP 5: Purchase Management & Automated Stock Increase
    // -----------------------------------------------------------------
    console.log('\n📋 Test Group 5: Purchase Management & Stock Updates');
    const [initialStock] = await pool.query(
        `SELECT available_quantity FROM stock WHERE fruit_id = ? AND packaging_size = 'Large'`,
        [fruitId]
    );
    const initialQty = initialStock[0].available_quantity;

    const purchase = await Purchase.createPurchase({
        supplier_id: 1, // Highveld Orchards
        items: [
            { fruit_id: fruitId, quantity: 15, unit_cost: 200.00, packaging_size: 'Large' },
            { fruit_id: fruitId, quantity: 20, unit_cost: 150.00, packaging_size: 'Small' }
        ]
    });
    assert(purchase.total_amount === (15 * 200 + 20 * 150), `Total purchase amount automatically calculated: M ${purchase.total_amount}`);

    const [afterStock] = await pool.query(
        `SELECT available_quantity FROM stock WHERE fruit_id = ? AND packaging_size = 'Large'`,
        [fruitId]
    );
    assert(afterStock[0].available_quantity === initialQty + 15, 'Stock quantity for Large packaging size increased by 15');

    // -----------------------------------------------------------------
    // TEST GROUP 6: Sales Management & Automatic Price Calculations
    // -----------------------------------------------------------------
    console.log('\n📋 Test Group 6: Sales Management & Automated Calculation');
    const saleResult = await Sale.createSale({
        vendor_id: vendorId,
        payment_method: 'Mobile Money',
        amount_paid: 200.00,
        items: [
            { fruit_id: fruitId, packaging_size: 'Large', quantity: 3 }
        ]
    });
    assert(saleResult.sale_id > 0, `Sale recorded successfully with ID: ${saleResult.sale_id}`);
    assert(saleResult.total_amount > 0, `System automatically calculated total selling price: M ${saleResult.total_amount}`);
    assert(saleResult.payment_method === 'Mobile Money', 'Payment method normalized to Mobile Money without truncation error');
    assert(saleResult.payment_status === 'PARTIALLY_PAID', 'Payment status automatically determined as PARTIALLY_PAID (Paid M200 towards total M420)');

    const [afterSaleStock] = await pool.query(
        `SELECT available_quantity FROM stock WHERE fruit_id = ? AND packaging_size = 'Large'`,
        [fruitId]
    );
    assert(afterSaleStock[0].available_quantity === initialQty + 15 - 3, 'Stock quantity accurately decreased by 3 units');

    // -----------------------------------------------------------------
    // TEST GROUP 7: Transaction Rollback on Insufficient Stock
    // Requirement: "A vendor requests 10 large boxes of apples, but only 6 large boxes are available.
    // The API must reject the entire sale without reducing available stock or creating incomplete transaction."
    // -----------------------------------------------------------------
    console.log('\n📋 Test Group 7: Transaction Rollback on Insufficient Stock (10 vs 6)');
    
    // Set stock of apples (fruit_id 1) Large to exactly 6 boxes
    await pool.query(
        `UPDATE stock SET available_quantity = 6 WHERE fruit_id = 1 AND packaging_size = 'Large'`
    );

    const [salesBefore] = await pool.query('SELECT COUNT(*) AS count FROM sales');
    let rollbackSuccess = false;

    try {
        await Sale.createSale({
            vendor_id: vendorId,
            payment_method: 'Cash',
            items: [
                { fruit_id: 1, packaging_size: 'Large', quantity: 10 } // Requested 10 when only 6 available
            ]
        });
    } catch (err) {
        if (err.statusCode === 400 && err.message.includes('Requested 10')) {
            rollbackSuccess = true;
        }
    }

    assert(rollbackSuccess === true, 'Sale rejected with HTTP 400 when requested (10) exceeds available (6)');

    const [salesAfter] = await pool.query('SELECT COUNT(*) AS count FROM sales');
    assert(salesBefore[0].count === salesAfter[0].count, 'Transaction rolled back: NO sales header record inserted');

    const [stockAfterAttempt] = await pool.query(
        `SELECT available_quantity FROM stock WHERE fruit_id = 1 AND packaging_size = 'Large'`
    );
    assert(stockAfterAttempt[0].available_quantity === 6, 'Transaction rolled back: Stock remains untouched at exactly 6 boxes');

    // -----------------------------------------------------------------
    // TEST GROUP 8: SQL Reporting Queries (Part D)
    // -----------------------------------------------------------------
    console.log('\n📋 Test Group 8: SQL Reporting Queries');
    
    // Query 1: Top 5 sold fruits
    const topFruits = await Report.getTopSellingFruits();
    assert(Array.isArray(topFruits) && topFruits.length <= 5, 'Query 1: Retrieved top 5 most frequently sold fruits');

    // Query 2: Sales revenue in date range
    const revenueReport = await Report.getRevenueByDateRange('2026-01-01', '2026-12-31');
    assert(typeof revenueReport.revenue === 'number' && revenueReport.revenue >= 0, `Query 2: Total sales revenue calculated: M ${revenueReport.revenue}`);

    // Query 3: Top vendor by boxes purchased
    const topVendor = await Report.getTopVendor();
    assert(topVendor !== null && topVendor.vendor_name !== undefined, `Query 3: Identified top vendor: ${topVendor ? topVendor.vendor_name : 'None'}`);

    // Query 4: Stock levels per packaging size
    const stockReport = await Report.getStockLevels();
    assert(stockReport.length > 0 && stockReport[0].packaging_size !== undefined, 'Query 4: Current stock levels retrieved with packaging sizes');

    // -----------------------------------------------------------------
    // TEST GROUP 9: Vendor Payment Management & Outstanding Balances
    // -----------------------------------------------------------------
    console.log('\n📋 Test Group 9: Vendor Payment Management & Debt Settlement');
    const balanceBefore = await Vendor.getBalance(vendorId);
    const initialDebt = parseFloat(balanceBefore.outstanding_balance);
    assert(initialDebt > 0, `Vendor has outstanding credit balance: M ${initialDebt}`);

    // Settle payment of M 100 via Cash
    const paymentResult = await Vendor.recordPayment(vendorId, {
        amount: 100.00,
        payment_method: 'Cash'
    });
    assert(paymentResult.amount_received === 100.00, 'Recorded vendor payment of M 100.00 via Cash');
    
    const balanceAfter = await Vendor.getBalance(vendorId);
    const newDebt = parseFloat(balanceAfter.outstanding_balance);
    assert(newDebt === (initialDebt - 100.00), `Outstanding balance updated accurately from M ${initialDebt} to M ${newDebt}`);

    // Clean up test fruit
    await pool.query(`DELETE FROM sales_details WHERE fruit_id = ?`, [fruitId]);
    await pool.query(`DELETE FROM purchase_details WHERE fruit_id = ?`, [fruitId]);
    await Fruit.delete(fruitId);
    await pool.query(`DELETE FROM sales WHERE vendor_id = ?`, [vendorId]);
    await Vendor.delete(vendorId);

    console.log('\n====================================================');
    console.log(`🎉 ALL TESTS PASSED: ${passedTests}/${totalTests} assertions successful!`);
    console.log('====================================================');
}

runTests()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('\n❌ Test suite encountered a critical error:', err);
        process.exit(1);
    });
