import { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import FruitsStock from './pages/FruitsStock';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Suppliers from './pages/Suppliers';
import Vendors from './pages/Vendors';

export default function App() {
    const [activeTab, setActiveTab] = useState('dashboard');

    // Friendly titles for the header based on active tab
    const tabTitles = {
        dashboard: 'Operational Dashboard & Reports',
        suppliers: 'Supplier Management',
        fruits: 'Fruits & Packaging Stock Management',
        vendors: 'Vendor Management & Balances',
        purchases: 'Record Supplier Purchases',
        sales: 'Record Vendor Sales'
    };

    return (
        <div className="app-container">
            {/* Sidebar Navigation */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Main Content Area with Header and Footer */}
            <div className="content-wrapper">
                <header className="header">
                    <span className="header-title">{tabTitles[activeTab]}</span>
                    <span className="header-user">👤 Administrator (Batloung Farm, Maseru)</span>
                </header>

                <main className="main-content">
                    {activeTab === 'dashboard' && <Dashboard />}
                    {activeTab === 'suppliers' && <Suppliers />}
                    {activeTab === 'fruits' && <FruitsStock />}
                    {activeTab === 'vendors' && <Vendors />}
                    {activeTab === 'purchases' && <Purchases />}
                    {activeTab === 'sales' && <Sales />}
                </main>

<footer className="footer">
    <p>© 2026 Batloung Farm Distribution Management System</p>
</footer>
            </div>
        </div>
    );
}