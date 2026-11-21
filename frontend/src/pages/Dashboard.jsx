import { useEffect, useState } from 'react';
import { fetchAPI } from '../services/api';

export default function Dashboard() {
    const [topFruits, setTopFruits] = useState([]);
    const [topVendor, setTopVendor] = useState(null);
    const [revenue, setRevenue] = useState(0);
    const [revenueDates, setRevenueDates] = useState({ startDate: '2026-01-01', endDate: '2026-12-31' });
    const [balances, setBalances] = useState([]);
    const [stockSummary, setStockSummary] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state for quick payment
    const [payModalVendor, setPayModalVendor] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [payMessage, setPayMessage] = useState('');
    const [payError, setPayError] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [fruitsRes, vendorRes, revRes, balanceRes, stockRes] = await Promise.all([
                fetchAPI('/reports/top-fruits'),
                fetchAPI('/reports/top-vendor'),
                fetchAPI(`/reports/revenue?startDate=${revenueDates.startDate}&endDate=${revenueDates.endDate}`),
                fetchAPI('/reports/vendor-balances'),
                fetchAPI('/reports/stock-report')
            ]);

            setTopFruits(fruitsRes.data || []);
            setTopVendor(vendorRes.data || null);
            setRevenue(revRes.data?.revenue || 0);
            setBalances(balanceRes.data || []);
            setStockSummary(stockRes.data || []);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterRevenue = async (e) => {
        e.preventDefault();
        try {
            const revRes = await fetchAPI(`/reports/revenue?startDate=${revenueDates.startDate}&endDate=${revenueDates.endDate}`);
            setRevenue(revRes.data?.revenue || 0);
        } catch (err) {
            alert('Failed to update revenue filter: ' + err.message);
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setPayMessage('');
        setPayError('');
        try {
            const res = await fetchAPI(`/vendors/${payModalVendor.vendor_id}/payments`, {
                method: 'POST',
                body: {
                    amount: paymentAmount,
                    payment_method: paymentMethod
                }
            });
            setPayMessage(res.message);
            setPaymentAmount('');
            // Reload balances and revenue
            loadDashboardData();
            setTimeout(() => {
                setPayModalVendor(null);
                setPayMessage('');
            }, 1800);
        } catch (err) {
            setPayError(err.message);
        }
    };

    const totalOutstanding = balances.reduce((sum, b) => sum + Math.max(0, parseFloat(b.outstanding_balance || 0)), 0);

    if (loading) {
        return <div className="loading-state">Loading farm operational metrics...</div>;
    }

    return (
        <div className="dashboard-container">
            {/* Top Header Banner */}
            <div className="dashboard-header-banner">
                <div>
                    <h2>Batloung Farm Distribution Overview</h2>
                    <p>Real-time fruit inventory, multi-province consignments, and vendor accounts in Maseru.</p>
                </div>
                <div className="date-badge">
                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
            </div>

            {/* KPI Metric Cards Grid */}
            <div className="grid-3">
                <div className="metric-card revenue-card">
                    <div className="metric-icon"></div>
                    <div>
                        <p>Total Sales Revenue</p>
                        <h3>M {Number(revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        <span className="metric-sub">Filterable by date range below</span>
                    </div>
                </div>

                <div className="metric-card vendor-card">
                    <div className="metric-icon"></div>
                    <div>
                        <p>Top Purchasing Vendor</p>
                        <h3>{topVendor ? topVendor.vendor_name : 'No sales yet'}</h3>
                        <span className="metric-sub">{topVendor ? `${topVendor.total_boxes_purchased} boxes delivered` : 'Awaiting orders'}</span>
                    </div>
                </div>

                <div className="metric-card fruit-card">
                    <div className="metric-icon"></div>
                    <div>
                        <p>Top Selling Fruit</p>
                        <h3>{topFruits.length > 0 ? topFruits[0].fruit_name : 'No data'}</h3>
                        <span className="metric-sub">{topFruits.length > 0 ? `${topFruits[0].total_quantity_sold} boxes sold` : 'Awaiting sales'}</span>
                    </div>
                </div>
            </div>

            {/* Date Range Revenue Filter (Part D Query 2) */}
            <div className="card" style={{ padding: '20px' }}>
                <form onSubmit={handleFilterRevenue} style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: '#422615' }}>Revenue Report by Date Range:</span>
                    <label style={{ fontSize: '0.9rem', color: '#555' }}>
                        From: 
                        <input
                            type="date"
                            value={revenueDates.startDate}
                            onChange={(e) => setRevenueDates({ ...revenueDates, startDate: e.target.value })}
                            style={{ marginLeft: '8px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc' }}
                        />
                    </label>
                    <label style={{ fontSize: '0.9rem', color: '#555' }}>
                        To: 
                        <input
                            type="date"
                            value={revenueDates.endDate}
                            onChange={(e) => setRevenueDates({ ...revenueDates, endDate: e.target.value })}
                            style={{ marginLeft: '8px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc' }}
                        />
                    </label>
                    <button
                        type="submit"
                        style={{
                            background: '#6f4024',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Apply Date Range Filter
                    </button>
                    <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#6f4024' }}>
                        Calculated Revenue: M {Number(revenue || 0).toFixed(2)}
                    </span>
                </form>
            </div>

            {/* Split Section: Top 5 Fruits & Stock Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                {/* 1. Top 5 Frequently Sold Fruits (Part D Query 1) */}
                <div className="card">
                    <h3 style={{ marginBottom: '14px', color: '#422615' }}>Top 5 Most Frequently Sold Fruits</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee', color: '#666', fontSize: '0.85rem' }}>
                                    <th style={{ padding: '8px' }}>Rank</th>
                                    <th style={{ padding: '8px' }}>Fruit Name</th>
                                    <th style={{ padding: '8px', textAlign: 'right' }}>Total Boxes Sold</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topFruits.map((f, idx) => (
                                    <tr key={f.fruit_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '10px 8px', fontWeight: 'bold', color: '#6f4024' }}>#{idx + 1}</td>
                                        <td style={{ padding: '10px 8px', fontWeight: 600 }}>{f.fruit_name}</td>
                                        <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold' }}>{f.total_quantity_sold} boxes</td>
                                    </tr>
                                ))}
                                {topFruits.length === 0 && (
                                    <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No sales data available.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. Stock Levels by Packaging Size (Part D Query 4) */}
                <div className="card">
                    <h3 style={{ marginBottom: '14px', color: '#422615' }}>Packaging Stock Summary (Small, Med, Large)</h3>
                    <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee', color: '#666', fontSize: '0.85rem' }}>
                                    <th style={{ padding: '8px' }}>Fruit</th>
                                    <th style={{ padding: '8px' }}>Packaging</th>
                                    <th style={{ padding: '8px', textAlign: 'right' }}>Available Boxes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockSummary.slice(0, 8).map((st) => (
                                    <tr key={st.stock_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '8px', fontWeight: 500 }}>{st.fruit_name}</td>
                                        <td style={{ padding: '8px', fontWeight: 'bold', color: '#422615' }}>{st.packaging_size}</td>
                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: st.available_quantity < 5 ? '#e53935' : '#6f4024' }}>
                                            {st.available_quantity} {st.available_quantity < 5 && '(Low)'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Vendor Payment Management & Outstanding Balances Table Section */}
            <div className="card table-card">
                <div className="table-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3>Vendor Payment Management & Outstanding Balances</h3>
                        <p className="table-desc">Track billing records, payments settled (Cash / Mobile Money), and credit status across Maseru vendors.</p>
                    </div>
                    <div style={{ textAlign: 'right', background: '#fff3e0', padding: '10px 16px', borderRadius: '8px', border: '1px solid #ffe0b2' }}>
                        <span style={{ fontSize: '0.8rem', color: '#e65100', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Unpaid Credit:</span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#bf360c' }}>M {totalOutstanding.toFixed(2)}</div>
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Vendor Name</th>
                                <th>Phone Contact</th>
                                <th>Total Billed (M)</th>
                                <th>Total Paid (M)</th>
                                <th>Outstanding Balance (M)</th>
                                <th>Account Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {balances.map((b) => {
                                const balance = Number(b.outstanding_balance || 0);
                                const isCredit = balance < 0;
                                const isUnpaid = balance > 0;
                                
                                return (
                                    <tr key={b.vendor_id}>
                                        <td className="font-semibold">{b.vendor_name}</td>
                                        <td className="text-muted">{b.phone_number}</td>
                                        <td>M {Number(b.total_billed).toFixed(2)}</td>
                                        <td className="text-emerald font-semibold">M {Number(b.total_paid).toFixed(2)}</td>
                                        <td className={balance > 0 ? 'text-rose font-bold' : 'font-bold'}>
                                            M {balance.toFixed(2)}
                                        </td>
                                        <td>
                                            {isCredit ? (
                                                <span className="badge badge-credit">Advance Credit</span>
                                            ) : isUnpaid ? (
                                                <span className="badge badge-pending">Balance Due</span>
                                            ) : (
                                                <span className="badge badge-settled">Settled (Paid)</span>
                                            )}
                                        </td>
                                        <td>
                                            {balance > 0 ? (
                                                <button
                                                    onClick={() => {
                                                        setPayModalVendor(b);
                                                        setPaymentAmount(balance.toFixed(2));
                                                        setPayMessage('');
                                                        setPayError('');
                                                    }}
                                                    style={{
                                                        background: '#6f4024',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    Record Payment
                                                </button>
                                            ) : (
                                                <span style={{ color: '#999', fontSize: '0.8rem' }}>No balance</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {balances.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                        No vendor account records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Payment Modal */}
            {payModalVendor && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '28px',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '460px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ color: '#422615', marginBottom: '8px' }}>Record Vendor Payment</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '16px' }}>
                            Receiving payment from <strong>{payModalVendor.vendor_name}</strong> (Outstanding: M {Number(payModalVendor.outstanding_balance).toFixed(2)})
                        </p>

                        {payMessage && <div style={{ padding: '10px', background: '#efe2d5', color: '#58331d', border: '1px solid #dec5b0', borderRadius: '6px', marginBottom: '12px', fontWeight: 600 }}>{payMessage}</div>}
                        {payError && <div style={{ padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '6px', marginBottom: '12px', fontWeight: 600 }}>{payError}</div>}

                        <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#444', marginBottom: '4px' }}>Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                                >
                                    <option value="Cash">Cash Payment</option>
                                    <option value="Mobile Money">Mobile Money (M-Pesa / EcoCash)</option>
                                    <option value="Credit">Credit Adjustment</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#444', marginBottom: '4px' }}>Amount to Pay (M)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1.1rem', fontWeight: 'bold' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setPayModalVendor(null)}
                                    style={{ flex: 1, padding: '10px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ flex: 2, padding: '10px', background: '#6f4024', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    Confirm Settlement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
