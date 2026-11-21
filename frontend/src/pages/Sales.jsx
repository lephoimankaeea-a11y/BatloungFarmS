import { useEffect, useState } from 'react';
import { fetchAPI } from '../services/api';

export default function Sales() {
    const [vendors, setVendors] = useState([]);
    const [fruits, setFruits] = useState([]);
    const [pricingCatalog, setPricingCatalog] = useState([]);
    const [salesHistory, setSalesHistory] = useState([]);
    const [vendorId, setVendorId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentStatus, setPaymentStatus] = useState('PAID');
    const [amountPaid, setAmountPaid] = useState('');
    const [items, setItems] = useState([{ fruit_id: '', quantity: '1', unit_price: 0, packaging_size: 'Small' }]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [vRes, fRes, pRes, sRes] = await Promise.all([
                fetchAPI('/vendors'),
                fetchAPI('/fruits'),
                fetchAPI('/fruits/pricing'),
                fetchAPI('/sales')
            ]);
            setVendors(vRes.data || []);
            setFruits(fRes.data || []);
            setPricingCatalog(pRes.data || []);
            setSalesHistory(sRes.data || []);

            // Set initial price for first fruit if available
            if (fRes.data && fRes.data.length > 0 && pRes.data) {
                const firstFruit = fRes.data[0];
                const pricing = pRes.data.find(p => p.fruit_id === firstFruit.fruit_id);
                const defaultPrice = pricing?.prices?.Small || 75;
                setItems([{ fruit_id: firstFruit.fruit_id, quantity: '1', unit_price: defaultPrice, packaging_size: 'Small' }]);
            }
        } catch (err) {
            console.error('Failed to load sales data:', err);
        }
    };

    // Helper to get automatic price for fruit + size
    const getAutoPrice = (fruitId, size) => {
        const itemPricing = pricingCatalog.find(p => p.fruit_id === parseInt(fruitId, 10));
        if (itemPricing && itemPricing.prices) {
            const normSize = size.charAt(0).toUpperCase() + size.slice(1).toLowerCase();
            return itemPricing.prices[normSize] || 60;
        }
        return size === 'Large' ? 140 : size === 'Medium' ? 90 : 60;
    };

    const addItem = () => {
        const defaultFruitId = fruits[0]?.fruit_id || '';
        const price = getAutoPrice(defaultFruitId, 'Small');
        setItems([...items, { fruit_id: defaultFruitId, quantity: '1', unit_price: price, packaging_size: 'Small' }]);
    };

    const removeItem = (index) => {
        if (items.length <= 1) return;
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleFruitChange = (index, newFruitId) => {
        const newItems = [...items];
        newItems[index].fruit_id = newFruitId;
        newItems[index].unit_price = getAutoPrice(newFruitId, newItems[index].packaging_size);
        setItems(newItems);
    };

    const handleSizeChange = (index, newSize) => {
        const newItems = [...items];
        newItems[index].packaging_size = newSize;
        newItems[index].unit_price = getAutoPrice(newItems[index].fruit_id, newSize);
        setItems(newItems);
    };

    const handleQuantityChange = (index, qty) => {
        const newItems = [...items];
        newItems[index].quantity = qty;
        setItems(newItems);
    };

    // Calculate Grand Total automatically
    const grandTotal = items.reduce((sum, item) => {
        const q = parseFloat(item.quantity) || 0;
        const p = parseFloat(item.unit_price) || 0;
        return sum + (q * p);
    }, 0);

    // Auto-update amount paid if status is PAID
    const handleStatusChange = (status) => {
        setPaymentStatus(status);
        if (status === 'PAID') {
            setAmountPaid(grandTotal.toFixed(2));
        } else if (status === 'UNPAID') {
            setAmountPaid('0.00');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const payload = {
                vendor_id: parseInt(vendorId, 10),
                payment_method: paymentMethod,
                payment_status: paymentStatus,
                amount_paid: paymentStatus === 'PAID' ? grandTotal : (parseFloat(amountPaid) || 0),
                items: items.map(item => ({
                    fruit_id: parseInt(item.fruit_id, 10),
                    packaging_size: item.packaging_size,
                    quantity: parseInt(item.quantity, 10),
                    unit_price: parseFloat(item.unit_price)
                }))
            };

            const res = await fetchAPI('/sales', {
                method: 'POST',
                body: payload
            });

            setMessage(`✅ Sale successfully recorded! Total Amount: M ${res.total_amount.toFixed(2)} | Method: ${res.payment_method} | Status: ${res.payment_status}`);
            setAmountPaid('');
            
            // Reload history and refresh
            const updatedSales = await fetchAPI('/sales');
            setSalesHistory(updatedSales.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Record Vendor Sale (Point of Sale)</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Select a street vendor, choose fruit & packaging size (Small, Medium, Large). Selling prices and order totals are calculated automatically.
                    </p>
                </div>
            </div>

            {message && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-medium">{message}</div>}
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-300 text-rose-700 rounded-lg font-medium">
                    <strong>⚠️ Transaction Rejection / Error:</strong>
                    <p className="mt-1">{error}</p>
                    <span className="text-xs text-rose-600">Note: The system automatically rolled back the transaction to preserve stock and relational integrity.</span>
                </div>
            )}

            {/* Sale Form */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <div>
                        <label className="block text-xs font-bold text-emerald-900 uppercase mb-1">Select Registered Vendor *</label>
                        <select
                            value={vendorId}
                            onChange={(e) => setVendorId(e.target.value)}
                            required
                            className="w-full p-2.5 border rounded-lg bg-white focus:outline-emerald-600"
                        >
                            <option value="">-- Choose Vendor --</option>
                            {vendors.map(v => (
                                <option key={v.vendor_id} value={v.vendor_id}>
                                    {v.vendor_name} ({v.location})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-emerald-900 uppercase mb-1">Payment Method</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full p-2.5 border rounded-lg bg-white focus:outline-emerald-600"
                        >
                            <option value="Cash">Cash Payment</option>
                            <option value="Mobile Money">Mobile Money (M-Pesa / EcoCash)</option>
                            <option value="Credit">Credit (Outstanding Account)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-emerald-900 uppercase mb-1">Payment Status</label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="w-full p-2.5 border rounded-lg bg-white focus:outline-emerald-600"
                        >
                            <option value="PAID">PAID (Full Settlement)</option>
                            <option value="PARTIALLY_PAID">PARTIALLY_PAID (Deposit)</option>
                            <option value="UNPAID">UNPAID (100% Credit)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-emerald-900 uppercase mb-1">
                            Amount Paid Now (M)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={paymentStatus === 'PAID' ? grandTotal.toFixed(2) : amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            disabled={paymentStatus === 'PAID' || paymentStatus === 'UNPAID'}
                            className="w-full p-2.5 border rounded-lg bg-white focus:outline-emerald-600 font-bold"
                        />
                    </div>
                </div>

                {/* Multiple Fruit Items in Sale */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-800">Sale Line Items (Multi-Item Order)</h4>
                        <span className="text-xs text-gray-500">Each packaging size has an automated predefined selling price</span>
                    </div>

                    {items.map((item, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                            {/* Fruit Selection */}
                            <div className="md:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">Fruit Variety</label>
                                <select
                                    value={item.fruit_id}
                                    onChange={(e) => handleFruitChange(index, e.target.value)}
                                    required
                                    className="w-full p-2 border rounded-lg bg-white"
                                >
                                    <option value="">Select Fruit</option>
                                    {fruits.map(f => (
                                        <option key={f.fruit_id} value={f.fruit_id}>
                                            {f.fruit_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Packaging Size */}
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Packaging Size</label>
                                <select
                                    value={item.packaging_size}
                                    onChange={(e) => handleSizeChange(index, e.target.value)}
                                    className="w-full p-2 border rounded-lg bg-white font-semibold text-emerald-700"
                                >
                                    <option value="Small">Small Box</option>
                                    <option value="Medium">Medium Box</option>
                                    <option value="Large">Large Box</option>
                                </select>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Quantity (Boxes)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                                    required
                                    className="w-full p-2 border rounded-lg bg-white font-bold"
                                />
                            </div>

                            {/* Unit Selling Price (Automatic!) */}
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Unit Price (Auto)</label>
                                <div className="p-2 bg-gray-100 border rounded-lg font-bold text-gray-700">
                                    M {Number(item.unit_price).toFixed(2)}
                                </div>
                            </div>

                            {/* Subtotal & Remove */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="block text-xs text-gray-500">Subtotal</span>
                                    <span className="font-bold text-emerald-800">
                                        M {(Number(item.quantity || 0) * Number(item.unit_price || 0)).toFixed(2)}
                                    </span>
                                </div>
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="text-red-600 hover:text-red-800 font-bold text-lg p-1"
                                        title="Remove Line"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-between items-center pt-2">
                        <button
                            type="button"
                            onClick={addItem}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-300"
                        >
                            + Add Another Fruit Item to Sale
                        </button>
                        <div className="text-right">
                            <span className="text-gray-600 mr-3">Total Payable by Vendor:</span>
                            <span className="text-2xl font-black text-emerald-700">M {grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-emerald-600 text-white font-bold text-lg rounded-lg hover:bg-emerald-700 transition shadow"
                >
                    {loading ? 'Processing Sale & Deducting Stock...' : 'Confirm Sale & Deduct Inventory (Atomic Transaction)'}
                </button>
            </form>

            {/* Sales Transaction History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Recent Vendor Sales Records</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b text-gray-500 text-xs uppercase">
                                <th className="pb-3">Sale ID</th>
                                <th className="pb-3">Date</th>
                                <th className="pb-3">Vendor</th>
                                <th className="pb-3">Method</th>
                                <th className="pb-3">Total Billed</th>
                                <th className="pb-3">Amount Paid</th>
                                <th className="pb-3">Balance Due</th>
                                <th className="pb-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {salesHistory.map((s) => (
                                <tr key={s.sale_id} className="hover:bg-gray-50">
                                    <td className="py-3 font-bold text-emerald-800">#{s.sale_id}</td>
                                    <td className="py-3 text-gray-500">{new Date(s.sale_date).toLocaleString()}</td>
                                    <td className="py-3 font-semibold text-gray-800">{s.vendor_name}</td>
                                    <td className="py-3 text-gray-600">{s.payment_method}</td>
                                    <td className="py-3 font-bold">M {Number(s.total_amount).toFixed(2)}</td>
                                    <td className="py-3 text-emerald-700 font-semibold">M {Number(s.amount_paid).toFixed(2)}</td>
                                    <td className="py-3 font-semibold text-rose-600">
                                        M {Number(s.balance_due || (s.total_amount - s.amount_paid)).toFixed(2)}
                                    </td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            s.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                                            s.payment_status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' :
                                            'bg-rose-100 text-rose-800'
                                        }`}>
                                            {s.payment_status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {salesHistory.length === 0 && (
                                <tr><td colSpan="8" className="py-6 text-center text-gray-500">No sales transactions recorded yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
