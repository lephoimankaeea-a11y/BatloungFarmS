const Vendor = require('../models/Vendor');

// Register a new vendor
exports.createVendor = async (req, res, next) => {
    try {
        const { vendor_name, phone_number, location, registration_date } = req.body;
        if (!vendor_name || !phone_number || !location) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vendor name, phone number, and location are required.' 
            });
        }

        const vendorId = await Vendor.create({ vendor_name, phone_number, location, registration_date });
        res.status(201).json({ 
            success: true, 
            message: 'Vendor registered successfully.', 
            vendorId 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false, 
                message: 'A vendor with this phone number already exists.' 
            });
        }
        next(error);
    }
};

// Retrieve all registered vendors or search using name or phone number
exports.getVendors = async (req, res, next) => {
    try {
        const { search } = req.query;
        const vendors = await Vendor.findAll(search);
        res.status(200).json({ success: true, data: vendors });
    } catch (error) {
        next(error);
    }
};

// Retrieve vendor by ID with account balance
exports.getVendorById = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found.' });
        }
        const balance = await Vendor.getBalance(req.params.id);
        res.status(200).json({ success: true, data: { ...vendor, balance } });
    } catch (error) {
        next(error);
    }
};

// Update vendor details
exports.updateVendor = async (req, res, next) => {
    try {
        const { vendor_name, phone_number, location } = req.body;
        if (!vendor_name || !phone_number || !location) {
            return res.status(400).json({ success: false, message: 'Vendor name, phone, and location are required.' });
        }

        const updated = await Vendor.update(req.params.id, { vendor_name, phone_number, location });
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Vendor not found.' });
        }
        res.status(200).json({ success: true, message: 'Vendor details updated successfully.' });
    } catch (error) {
        next(error);
    }
};

// Delete vendor
exports.deleteVendor = async (req, res, next) => {
    try {
        const vendorId = req.params.id;
        const hasSales = await Vendor.hasSales(vendorId);
        if (hasSales) {
            return res.status(409).json({ 
                success: false, 
                message: 'Cannot delete vendor: sales transactions exist for this vendor account.' 
            });
        }

        const deleted = await Vendor.delete(vendorId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Vendor not found.' });
        }
        res.status(200).json({ success: true, message: 'Vendor deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

// Vendor Payment Management Function:
// Supports (Cash payments, Mobile money payments, Outstanding payments (credit))
// Updates payment status as PAID, PARTIALLY_PAID or UNPAID
// Calculates and returns updated outstanding balance
exports.recordVendorPayment = async (req, res, next) => {
    try {
        const vendorId = req.params.id;
        const { amount, payment_method, notes } = req.body;

        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'A valid payment amount greater than zero is required.' 
            });
        }

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found.' });
        }

        const result = await Vendor.recordPayment(vendorId, { amount, payment_method, notes });
        res.status(200).json({ 
            success: true, 
            message: `Payment of M ${parseFloat(amount).toFixed(2)} recorded successfully via ${result.payment_method}.`, 
            data: result 
        });
    } catch (error) {
        next(error);
    }
};
