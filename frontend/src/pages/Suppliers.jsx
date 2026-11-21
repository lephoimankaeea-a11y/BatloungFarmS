import { useEffect, useState } from 'react';
import { fetchAPI } from '../services/api';

const PROVINCES = [
    'Gauteng', 'Free State', 'KwaZulu-Natal', 'Western Cape', 
    'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West'
];

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [formData, setFormData] = useState({
        business_name: '',
        contact_person: '',
        phone: '',
        province: 'Gauteng',
        address: ''
    });
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        try {
            const res = await fetchAPI('/suppliers');
            setSuppliers(res.data || []);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            setLoading(true);
            await fetchAPI('/suppliers', { method: 'POST', body: formData });
            setMessage(`✅ Supplier "${formData.business_name}" registered successfully.`);
            setFormData({ business_name: '', contact_person: '', phone: '', province: 'Gauteng', address: '' });
            loadSuppliers();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await fetchAPI(`/suppliers/${editingSupplier.supplier_id}`, {
                method: 'PUT',
                body: editingSupplier
            });
            setMessage(`✅ Supplier "${editingSupplier.business_name}" updated successfully.`);
            setEditingSupplier(null);
            loadSuppliers();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (supplierId, businessName) => {
        if (!window.confirm(`Are you sure you want to delete supplier "${businessName}"?`)) return;
        setMessage('');
        setError('');
        try {
            await fetchAPI(`/suppliers/${supplierId}`, { method: 'DELETE' });
            setMessage(`✅ Supplier deleted successfully.`);
            loadSuppliers();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">South African Suppliers Management</h2>
                <p className="text-sm text-gray-600 mt-1">
                    Manage orchard and agricultural suppliers across Gauteng, Free State, KwaZulu-Natal, Western Cape, Eastern Cape, Limpopo, Mpumalanga, and North West.
                </p>
            </div>

            {message && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-medium">{message}</div>}
            {error && <div className="p-4 bg-rose-50 border border-rose-300 text-rose-700 rounded-lg font-medium">{error}</div>}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-lg font-bold text-gray-700">Register New South African Supplier</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Business / Orchard Name"
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        required
                        className="p-3 border rounded-lg focus:outline-emerald-600"
                    />
                    <input
                        type="text"
                        placeholder="Contact Person (Manager / Sales Rep)"
                        value={formData.contact_person}
                        onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                        required
                        className="p-3 border rounded-lg focus:outline-emerald-600"
                    />
                    <input
                        type="text"
                        placeholder="Phone Number (+27 ...)"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="p-3 border rounded-lg focus:outline-emerald-600"
                    />
                    <select
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="p-3 border rounded-lg focus:outline-emerald-600 font-semibold text-emerald-800"
                    >
                        {PROVINCES.map((prov) => (
                            <option key={prov} value={prov}>{prov} Province</option>
                        ))}
                    </select>
                </div>
                <textarea
                    placeholder="Physical Farm / Depot Address in South Africa"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    rows="2"
                    className="w-full p-3 border rounded-lg focus:outline-emerald-600"
                />
                <button type="submit" disabled={loading} className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition">
                    {loading ? 'Registering...' : '+ Register Supplier'}
                </button>
            </form>

            {/* Suppliers List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Registered South African Suppliers</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b text-gray-500 text-xs uppercase">
                                <th className="pb-3">Business Name</th>
                                <th className="pb-3">Contact Person</th>
                                <th className="pb-3">Phone</th>
                                <th className="pb-3">Province</th>
                                <th className="pb-3">Physical Address</th>
                                <th className="pb-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {suppliers.map((s) => (
                                <tr key={s.supplier_id} className="hover:bg-gray-50">
                                    <td className="py-3 font-semibold text-gray-800">{s.business_name}</td>
                                    <td className="py-3 text-gray-600">{s.contact_person}</td>
                                    <td className="py-3 text-gray-600">{s.phone}</td>
                                    <td className="py-3">
                                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                                            {s.province}
                                        </span>
                                    </td>
                                    <td className="py-3 text-gray-600 text-xs">{s.address}</td>
                                    <td className="py-3 text-right space-x-2">
                                        <button
                                            onClick={() => setEditingSupplier(s)}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded hover:bg-gray-200"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(s.supplier_id, s.business_name)}
                                            className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded hover:bg-rose-100"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {suppliers.length === 0 && (
                                <tr><td colSpan="6" className="py-6 text-center text-gray-500">No suppliers registered.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Supplier Modal */}
            {editingSupplier && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '480px' }}>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Supplier Details</h3>
                        <form onSubmit={handleUpdate} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Business Name</label>
                                <input
                                    type="text"
                                    value={editingSupplier.business_name}
                                    onChange={(e) => setEditingSupplier({ ...editingSupplier, business_name: e.target.value })}
                                    required
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Contact Person</label>
                                <input
                                    type="text"
                                    value={editingSupplier.contact_person}
                                    onChange={(e) => setEditingSupplier({ ...editingSupplier, contact_person: e.target.value })}
                                    required
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    value={editingSupplier.phone}
                                    onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                                    required
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Province</label>
                                <select
                                    value={editingSupplier.province}
                                    onChange={(e) => setEditingSupplier({ ...editingSupplier, province: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    {PROVINCES.map((prov) => (
                                        <option key={prov} value={prov}>{prov}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                                <textarea
                                    value={editingSupplier.address}
                                    onChange={(e) => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
                                    required
                                    rows="2"
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingSupplier(null)}
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
