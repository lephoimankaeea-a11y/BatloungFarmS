import { useEffect, useState } from 'react';
import { fetchAPI } from '../services/api';

export default function FruitsStock() {
    const [fruits, setFruits] = useState([]);
    const [stock, setStock] = useState([]);
    const [pricing, setPricing] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [fruitName, setFruitName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('AVAILABLE');
    const [editingFruit, setEditingFruit] = useState(null);
    const [threshold, setThreshold] = useState(5);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, [threshold]);

    const loadData = async () => {
        try {
            const [fRes, sRes, lRes, pRes] = await Promise.all([
                fetchAPI('/fruits'),
                fetchAPI('/fruits/stock/levels'),
                fetchAPI(`/fruits/stock/low?threshold=${threshold}`),
                fetchAPI('/fruits/pricing')
            ]);
            setFruits(fRes.data || []);
            setStock(sRes.data || []);
            setLowStock(lRes.data || []);
            setPricing(pRes.data || []);
        } catch (err) {
            setError('Error loading fruits and stock: ' + err.message);
        }
    };

    const handleAddFruit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await fetchAPI('/fruits', {
                method: 'POST',
                body: { fruit_name: fruitName, description, status }
            });
            setMessage(`✅ Fruit "${fruitName}" registered! Stock levels initialized for Small, Medium, and Large packaging sizes.`);
            setFruitName('');
            setDescription('');
            loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUpdateFruit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await fetchAPI(`/fruits/${editingFruit.fruit_id}`, {
                method: 'PUT',
                body: editingFruit
            });
            setMessage(`✅ Fruit "${editingFruit.fruit_name}" updated successfully.`);
            setEditingFruit(null);
            loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteFruit = async (fruitId, fruitName) => {
        if (!window.confirm(`Are you sure you want to delete fruit "${fruitName}"?`)) return;
        setMessage('');
        setError('');
        try {
            await fetchAPI(`/fruits/${fruitId}`, { method: 'DELETE' });
            setMessage(`✅ Fruit deleted successfully.`);
            loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    // Helper to get price for packaging size
    const getPrice = (fruitId, size) => {
        const p = pricing.find(item => item.fruit_id === fruitId);
        if (p && p.prices) {
            return p.prices[size] || 70;
        }
        return size === 'Large' ? 140 : size === 'Medium' ? 90 : 60;
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Fruits Catalog & Packaging Stock Management</h2>
                <p className="text-sm text-gray-600 mt-1">
                    Manage core fruit lines (Apples, Bananas, Oranges, Mangoes, Grapes) and track separate stock balances for Small, Medium, and Large packaging sizes.
                </p>
            </div>

            {message && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-medium">{message}</div>}
            {error && <div className="p-4 bg-rose-50 border border-rose-300 text-rose-700 rounded-lg font-medium">{error}</div>}

            {/* Low Stock Alert Banner (Part C Requirement) */}
            {lowStock.length > 0 && (
                <div className="p-5 bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-lg flex items-center gap-2">
                             Low Stock Threshold Warning (&lt; {threshold} boxes)
                        </h4>
                        <div className="flex items-center gap-2 text-xs">
                            <span>Adjust Alert Threshold:</span>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={threshold}
                                onChange={(e) => setThreshold(e.target.value)}
                                className="w-16 p-1 border rounded bg-white font-bold"
                            />
                        </div>
                    </div>
                    <p className="text-sm text-amber-800 mb-3">
                        The following fruits have critically low stock for the specified packaging size. Reorder from South African suppliers immediately:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {lowStock.map((ls, idx) => (
                            <div key={idx} className="bg-white p-2.5 rounded-lg border border-amber-200 text-sm font-semibold flex justify-between">
                                <span>{ls.fruit_name} ({ls.packaging_size})</span>
                                <span className="text-rose-600 font-bold">{ls.available_quantity} boxes left</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Register New Fruit Form */}
            <form onSubmit={handleAddFruit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Register New Fruit Variety</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Fruit Name (e.g. Crisp Red Apples, Valencia Oranges)"
                        value={fruitName}
                        onChange={(e) => setFruitName(e.target.value)}
                        required
                        className="p-3 border rounded-lg focus:outline-emerald-600"
                    />
                    <input
                        type="text"
                        placeholder="Description (e.g. Royal Gala apples from Highveld)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="p-3 border rounded-lg focus:outline-emerald-600"
                    />
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="p-3 border rounded-lg focus:outline-emerald-600 font-semibold text-emerald-800"
                    >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                        <option value="DISCONTINUED">DISCONTINUED</option>
                    </select>
                </div>
                <button type="submit" className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition">
                    + Register Fruit & Initialize Packaging Stock
                </button>
            </form>

            {/* Packaging-Specific Stock Balances (Part A & C Key Requirement) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">
                         Inventory Stock Levels by Packaging Size (Small, Medium, Large)
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Stock quantities are strictly partitioned by packaging size to prevent errors and ensure packaging-specific stock tracking.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b text-gray-500 text-xs uppercase">
                                <th className="pb-3">Stock ID</th>
                                <th className="pb-3">Fruit Variety</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3">Packaging Size</th>
                                <th className="pb-3">Selling Price (Auto)</th>
                                <th className="pb-3">Available Quantity</th>
                                <th className="pb-3">Stock Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {stock.map((st) => {
                                const isLow = st.available_quantity < threshold;
                                const price = getPrice(st.fruit_id, st.packaging_size);
                                return (
                                    <tr key={st.stock_id} className="hover:bg-gray-50">
                                        <td className="py-3 text-gray-400 font-mono">#{st.stock_id}</td>
                                        <td className="py-3 font-semibold text-gray-800">{st.fruit_name}</td>
                                        <td className="py-3">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                                                {st.fruit_status || 'AVAILABLE'}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded font-bold text-xs uppercase border border-emerald-200">
                                                {st.packaging_size} Box
                                            </span>
                                        </td>
                                        <td className="py-3 font-semibold text-gray-700">
                                            M {Number(price).toFixed(2)}
                                        </td>
                                        <td className="py-3 font-bold text-gray-800 text-base">
                                            {st.available_quantity} boxes
                                        </td>
                                        <td className="py-3">
                                            {isLow ? (
                                                <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold">
                                                    Low Stock
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                                                    ✅ In Stock
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Fruits Catalog CRUD Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Registered Fruit Catalog</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b text-gray-500 text-xs uppercase">
                                <th className="pb-3">ID</th>
                                <th className="pb-3">Fruit Name</th>
                                <th className="pb-3">Description</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {fruits.map((f) => (
                                <tr key={f.fruit_id} className="hover:bg-gray-50">
                                    <td className="py-3 font-mono text-gray-400">#{f.fruit_id}</td>
                                    <td className="py-3 font-bold text-gray-800">{f.fruit_name}</td>
                                    <td className="py-3 text-gray-600 text-xs">{f.description || '-'}</td>
                                    <td className="py-3 font-semibold text-emerald-700">{f.status}</td>
                                    <td className="py-3 text-right space-x-2">
                                        <button
                                            onClick={() => setEditingFruit(f)}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded hover:bg-gray-200"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteFruit(f.fruit_id, f.fruit_name)}
                                            className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded hover:bg-rose-100"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Fruit Modal */}
            {editingFruit && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '440px' }}>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Fruit Variety</h3>
                        <form onSubmit={handleUpdateFruit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Fruit Name</label>
                                <input
                                    type="text"
                                    value={editingFruit.fruit_name}
                                    onChange={(e) => setEditingFruit({ ...editingFruit, fruit_name: e.target.value })}
                                    required
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={editingFruit.description || ''}
                                    onChange={(e) => setEditingFruit({ ...editingFruit, description: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Catalog Status</label>
                                <select
                                    value={editingFruit.status}
                                    onChange={(e) => setEditingFruit({ ...editingFruit, status: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    <option value="AVAILABLE">AVAILABLE</option>
                                    <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                                    <option value="DISCONTINUED">DISCONTINUED</option>
                                </select>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingFruit(null)}
                                    className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-bold"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
