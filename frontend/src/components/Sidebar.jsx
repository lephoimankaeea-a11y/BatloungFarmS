
export default function Sidebar({ activeTab, setActiveTab }) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard & Reports' },
        { id: 'suppliers', label: 'Suppliers' },
        { id: 'fruits', label: 'Fruits & Stock' },
        { id: 'vendors', label: 'Vendors & Balances' },
        { id: 'purchases', label: 'Record Purchase' },
        { id: 'sales', label: 'Record Sale' },
    ];

    return (
        <div className="sidebar">
            <h1 className="sidebar-title">🍎 Batloung Farm</h1>
            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>
        </div>
    );
}