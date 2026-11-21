import { useEffect, useState } from 'react';
import { fetchAPI } from '../services/api';

export default function Vendors() {
    const [vendors, setVendors] = useState([]);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState({ vendor_name: '', phone_number: '', location: '' });
    const [editingVendor, setEditingVendor] = useState(null);
    const [payingVendor, setPayingVendor] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadVendors();
    }, [search]);

    const loadVendors = async () => {
        try {
            const res = await fetchAPI(`/vendors?search=${encodeURIComponent(search)}`);
            setVendors(res.data || []);
        } catch (err) {
            setError('Failed to load vendors: ' + err.message);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await fetchAPI('/vendors', { method: 'POST', body: formData });
            setMessage(`✅ Vendor "${formData.vendor_name}" registered successfully.`);
            setFormData({ vendor_name: '', phone_number: '', location: '' });
            loadVendors();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await fetchAPI(`/vendors/${editingVendor.vendor_id}`, {
                method: 'PUT',
                body: {
                    vendor_name: editingVendor.vendor_name,
                    phone_number: editingVendor.phone_number,
                    location: editingVendor.location
                }
            });
            setMessage(`✅ Vendor details updated successfully.`);
            setEditingVendor(null);
            loadVendors();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (vendorId, vendorName) => {
        if (!window.confirm(`Are you sure you want to delete vendor "${vendorName}"?`)) return;
        setMessage('');
        setError('');
        try {
            await fetchAPI(`/vendors/${vendorId}`, { method: 'DELETE' });
            setMessage(`✅ Vendor deleted successfully.`);
            loadVendors();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const res = await fetchAPI(`/vendors/${payingVendor.vendor_id}/payments`, {
                method: 'POST',
                body: {
                    amount: paymentAmount,
                    payment_method: paymentMethod
                }
            });
            setMessage(res.message);
            setPayingVendor(null);
            setPaymentAmount('');
            loadVendors();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Vendor Management & Payment Settlement</h2>
                <p className="text-sm text-gray-600 mt-1">
                    Manage street vendors and small retailers in Lesotho. Register, search, update profiles, and record credit settlements.
                </p>
            </div>

            {message && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-medium">{message}</div>}
            {error && <div className="p-4 bg-rose-50 border border-rose-300 text-rose-700 rounded-lg font-medium">{error}</div>}

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Register New Street Vendor</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Vendor / Stall Name (e.g. Mpho Fruit Stalls)"
                        value={formData.vendor_name}
                        onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                        required
                        className="p-3 border rounded-lg focus:outline-emerald-600"
                    />
                    <input
                        type="text"
                        placeholder="Phone Number (+266 ...)"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        required
                        className="p-3 border rounded-lg focus:outline-emerald-600"
                    />
                    <input
                        type="text"
                        placeholder="Maseru Location (e.g. Bus Stop, Ha Thetsane)"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                        className="p-3 border rounded-lg focus:outline-emerald-600"
                    />
                </div>
                <button type="submit" className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition">
                    + Register Vendor Account
                </button>
            </form>

            {/* Vendors List & Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Registered Vendors Catalog</h3>
                        <span className="text-xs text-gray-500">Search by vendor business name or contact phone</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Search name or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="p-2.5 border rounded-lg text-sm w-72 focus:outline-emerald-600"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b text-gray-500 text-xs uppercase">
                                <th className="pb-3">Vendor Name</th>
                                <th className="pb-3">Phone Number</th>
                                <th className="pb-3">Location</th>
                                <th className="pb-3">Registration Date</th>
                                <th className="pb-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {vendors.map((v) => (
                                <tr key={v.vendor_id} className="hover:bg-gray-50">
                                    <td className="py-3 font-semibold text-gray-800">{v.vendor_name}</td>
                                    <td className="py-3 text-gray-600">{v.phone_number}</td>
                                    <td className="py-3 text-emerald-700 font-medium">{v.location}</td>
                                    <td className="py-3 text-gray-500">
                                        {new Date(v.registration_date).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 text-right space-x-2">
                                        <button
                                            onClick={() => {
                                                setPayingVendor(v);
                                                setPaymentAmount('');
                                            }}
                                            className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded hover:bg-emerald-200"
                                        >
                                            Pay
                                        </button>
                                        <button
                                            onClick={() => setEditingVendor(v)}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded hover:bg-gray-200"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(v.vendor_id, v.vendor_name)}
                                            className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded hover:bg-rose-100"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {vendors.length === 0 && (
                                <tr><td colSpan="5" className="py-6 text-center text-gray-500">No vendors found matching query.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Vendor Modal */}
            {editingVendor && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '440px' }}>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Vendor Information</h3>
                        <form onSubmit={handleUpdate} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Vendor Name</label>
                                <input
                                    type="text"
                                    value={editingVendor.vendor_name}
                                    onChange={(e) => setEditingVendor({ ...editingVendor, vendor_name: e.target.value })}
                                    required
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    value={editingVendor.phone_number}
                                    onChange={(e) => setEditingVendor({ ...editingVendor, phone_number: e.target.value })}
                                    required
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={editingVendor.location}
                                    onChange={(e) => setEditingVendor({ ...editingVendor, location: e.target.value })}
                                    required
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingVendor(null)}
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

            {/* Record Payment Modal */}
            {payingVendor && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '440px' }}>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Record Vendor Payment</h3>
                        <p className="text-sm text-gray-600 mb-4">Accepting debt settlement from <strong>{payingVendor.vendor_name}</strong></p>
                        
                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Mobile Money">Mobile Money (M-Pesa / EcoCash)</option>
                                    <option value="Credit">Credit Note Adjustment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount to Settle (M)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    placeholder="Enter Amount"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-full p-2 border rounded-lg font-bold text-lg"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPayingVendor(null)}
                                    className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-bold"
                                >
                                    Submit Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
