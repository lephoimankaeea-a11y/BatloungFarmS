import { useEffect, useState } from 'react';
import { fetchAPI } from '../services/api';

export default function Purchases() {
    const [suppliers, setSuppliers] = useState([]);
    const [fruits, setFruits] = useState([]);
    const [purchaseHistory, setPurchaseHistory] = useState([]);
    const [supplierId, setSupplierId] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([{ fruit_id: '', quantity: '10', unit_cost: '150.00', packaging_size: 'Small' }]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [sRes, fRes, pRes] = await Promise.all([
                fetchAPI('/suppliers'),
                fetchAPI('/fruits'),
                fetchAPI('/purchases')
            ]);
            setSuppliers(sRes.data || []);
            setFruits(fRes.data || []);
            setPurchaseHistory(pRes.data || []);

            if (fRes.data && fRes.data.length > 0) {
                setItems([{ fruit_id: fRes.data[0].fruit_id, quantity: '10', unit_cost: '150.00', packaging_size: 'Small' }]);
            }
        } catch (err) {
            console.error('Failed to load purchase data:', err);
        }
    };

    const addItem = () => {
        const defaultFruitId = fruits[0]?.fruit_id || '';
        setItems([...items, { fruit_id: defaultFruitId, quantity: '10', unit_cost: '150.00', packaging_size: 'Small' }]);
    };

    const removeItem = (index) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const grandTotal = items.reduce((sum, item) => {
        const q = parseFloat(item.quantity) || 0;
        const c = parseFloat(item.unit_cost) || 0;
        return sum + (q * c);
    }, 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const payload = {
                supplier_id: parseInt(supplierId, 10),
                notes,
                items: items.map(item => ({
                    fruit_id: parseInt(item.fruit_id, 10),
                    packaging_size: item.packaging_size,
                    quantity: parseInt(item.quantity, 10),
                    unit_cost: parseFloat(item.unit_cost)
                }))
            };

            const res = await fetchAPI('/purchases', {
                method: 'POST',
                body: payload
            });

            setMessage(`✅ Purchase #${res.purchase_id} recorded! Total Consignment Amount: M ${res.total_amount.toFixed(2)}. Inventory stock increased.`);
            setNotes('');

            // Refresh purchase history
            const pRes = await fetchAPI('/purchases');
            setPurchaseHistory(pRes.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Record Consignment Purchase from Supplier</h2>
                <p className="text-sm text-gray-600 mt-1">
                    Procure multi-fruit consignments from South African provincial orchards and automatically restock packaging-specific boxes.
                </p>
            </div>

            {message && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-medium">{message}</div>}
            {error && <div className="p-4 bg-rose-50 border border-rose-300 text-rose-700 rounded-lg font-medium">{error}</div>}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <div>
                        <label className="block text-xs font-bold text-emerald-900 uppercase mb-1">Select Supplier *</label>
                        <select
                            value={supplierId}
                            onChange={(e) => setSupplierId(e.target.value)}
                            required
                            className="w-full p-2.5 border rounded-lg bg-white focus:outline-emerald-600"
                        >
                            <option value="">-- Choose South African Supplier --</option>
                            {suppliers.map(s => (
                                <option key={s.supplier_id} value={s.supplier_id}>
                                    {s.business_name} ({s.province} Province)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-emerald-900 uppercase mb-1">Consignment Notes / Invoice Ref</label>
                        <input
                            type="text"
                            placeholder="e.g. Weekly Gala shipment, truck consignment #890"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-2.5 border rounded-lg bg-white focus:outline-emerald-600"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-bold text-gray-800">Consignment Purchase Items (Multi-Item Consignment)</h4>

                    {items.map((item, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="md:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">Fruit Variety</label>
                                <select
                                    value={item.fruit_id}
                                    onChange={(e) => updateItem(index, 'fruit_id', e.target.value)}
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

                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Packaging Size</label>
                                <select
                                    value={item.packaging_size}
                                    onChange={(e) => updateItem(index, 'packaging_size', e.target.value)}
                                    className="w-full p-2 border rounded-lg bg-white font-semibold text-emerald-700"
                                >
                                    <option value="Small">Small Box</option>
                                    <option value="Medium">Medium Box</option>
                                    <option value="Large">Large Box</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Quantity (Boxes)</label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Boxes"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                    required
                                    className="w-full p-2 border rounded-lg bg-white font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Unit Cost (M)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Unit Cost"
                                    value={item.unit_cost}
                                    onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                                    required
                                    className="w-full p-2 border rounded-lg bg-white font-bold"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="block text-xs text-gray-500">Subtotal</span>
                                    <span className="font-bold text-emerald-800">
                                        M {(Number(item.quantity || 0) * Number(item.unit_cost || 0)).toFixed(2)}
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
                            + Add Another Fruit to Consignment
                        </button>
                        <div className="text-right">
                            <span className="text-gray-600 mr-3">Total Consignment Cost:</span>
                            <span className="text-2xl font-black text-emerald-700">M {grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-emerald-600 text-white font-bold text-lg rounded-lg hover:bg-emerald-700 transition shadow"
                >
                    {loading ? 'Recording Purchase & Restocking...' : 'Submit Consignment Purchase & Increase Stock'}
                </button>
            </form>

            {/* Purchase History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Consignment Purchase History</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b text-gray-500 text-xs uppercase">
                                <th className="pb-3">Purchase ID</th>
                                <th className="pb-3">Date</th>
                                <th className="pb-3">Supplier Name</th>
                                <th className="pb-3">Province</th>
                                <th className="pb-3">Total Boxes</th>
                                <th className="pb-3">Total Cost (M)</th>
                                <th className="pb-3">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {purchaseHistory.map((p) => (
                                <tr key={p.purchase_id} className="hover:bg-gray-50">
                                    <td className="py-3 font-bold text-emerald-800">#{p.purchase_id}</td>
                                    <td className="py-3 text-gray-500">{new Date(p.purchase_date).toLocaleString()}</td>
                                    <td className="py-3 font-semibold text-gray-800">{p.business_name}</td>
                                    <td className="py-3 font-medium text-emerald-700">{p.province}</td>
                                    <td className="py-3 font-semibold">{p.total_boxes || p.total_items} boxes</td>
                                    <td className="py-3 font-bold text-gray-900">M {Number(p.total_amount).toFixed(2)}</td>
                                    <td className="py-3 text-gray-500 text-xs">{p.notes || '-'}</td>
                                </tr>
                            ))}
                            {purchaseHistory.length === 0 && (
                                <tr><td colSpan="7" className="py-6 text-center text-gray-500">No purchases recorded yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
