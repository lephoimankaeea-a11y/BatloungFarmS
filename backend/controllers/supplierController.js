const Supplier = require('../models/Supplier');

// Register a new supplier
exports.createSupplier = async (req, res, next) => {
    try {
        const { business_name, contact_person, phone, province, address } = req.body;
        if (!business_name || !contact_person || !phone || !province || !address) {
            return res.status(400).json({ 
                success: false, 
                message: 'All supplier fields (business_name, contact_person, phone, province, address) are required.' 
            });
        }

        const validProvinces = [
            'Gauteng', 'Free State', 'KwaZulu-Natal', 'Western Cape', 
            'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West'
        ];
        if (!validProvinces.includes(province)) {
            return res.status(400).json({
                success: false,
                message: `Invalid South African province. Must be one of: ${validProvinces.join(', ')}`
            });
        }

        const supplierId = await Supplier.create({ business_name, contact_person, phone, province, address });
        res.status(201).json({ 
            success: true, 
            message: 'Supplier registered successfully.', 
            supplierId 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false, 
                message: 'A supplier with this business name already exists.' 
            });
        }
        next(error);
    }
};

// Retrieve all suppliers
exports.getAllSuppliers = async (req, res, next) => {
    try {
        const suppliers = await Supplier.findAll();
        res.status(200).json({ success: true, data: suppliers });
    } catch (error) {
        next(error);
    }
};

// Retrieve supplier by ID
exports.getSupplierById = async (req, res, next) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found.' });
        }
        res.status(200).json({ success: true, data: supplier });
    } catch (error) {
        next(error);
    }
};

// Update supplier information
exports.updateSupplier = async (req, res, next) => {
    try {
        const { business_name, contact_person, phone, province, address } = req.body;
        const updated = await Supplier.update(req.params.id, { business_name, contact_person, phone, province, address });
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Supplier not found.' });
        }
        res.status(200).json({ success: true, message: 'Supplier updated successfully.' });
    } catch (error) {
        next(error);
    }
};

// Delete a supplier, subject to applicable business constraints
exports.deleteSupplier = async (req, res, next) => {
    try {
        const supplierId = req.params.id;

        // Check if supplier has linked purchases
        const hasPurchases = await Supplier.hasPurchases(supplierId);
        if (hasPurchases) {
            return res.status(409).json({ 
                success: false, 
                message: 'Cannot delete supplier: this supplier has linked purchase consignment records.' 
            });
        }

        const deleted = await Supplier.delete(supplierId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Supplier not found.' });
        }

        res.status(200).json({ success: true, message: 'Supplier deleted successfully.' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ 
                success: false, 
                message: 'Cannot delete supplier due to existing relational database constraints.' 
            });
        }
        next(error);
    }
};
