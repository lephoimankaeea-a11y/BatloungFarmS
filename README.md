# Batloung Farm Distribution Management System
**Course:** (DIWA2110) Web Application Development — Take-Home Test  
**Institution:** Limkokwing University of Creative Technology, Lesotho  
**Academic Year:** 2026 | **Total Marks:** 42 Marks (25% Overall Assessment)

---

## 📌 Project Overview
Batloung Farm is a commercial fresh produce and fruit distribution enterprise operating in Maseru, Lesotho. The company procures consignments of fruits (**Apples, Bananas, Oranges, Mangoes, Grapes**) from agricultural suppliers across **8 South African provinces** (Gauteng, Free State, KwaZulu-Natal, Western Cape, Eastern Cape, Limpopo, Mpumalanga, North West) and distributes them to street vendors and retail stalls in Lesotho in three distinct packaging sizes: **Small**, **Medium**, and **Large** boxes.

This full-stack system resolves all manual record-keeping challenges by providing:
1. **Packaging-Specific Inventory Tracking:** Independent stock levels for Small, Medium, and Large boxes.
2. **Automated Sales Calculations:** Selling prices are automatically determined by fruit variety and packaging size. Total order costs are computed without requiring manual entry by the administrator.
3. **Atomic Multi-Item Transactions:** Fully transactional purchases and sales (`BEGIN`, `COMMIT`, `ROLLBACK`) that reject any sale where requested stock is unavailable (e.g. requesting 10 large boxes of apples when only 6 are in stock) without modifying inventory or creating orphan records.
4. **Vendor Payment & Credit Management:** Full support for Cash, Mobile Money (M-Pesa / EcoCash), and 30-day street vendor credit. Tracks `PAID`, `PARTIALLY_PAID`, and `UNPAID` statuses and real-time outstanding balances.
5. **Operational SQL Reporting:** Produces the four required analytical queries (Top 5 selling fruits, Date-range revenue filter, Top purchasing vendor by box volume, and Packaging stock balances).

---

## 🏗️ Architecture & Project Structure (Part B Rubric Compliance)

```
Batloung Farm system/
├── database.sql                  # Part A: Complete MySQL DDL & Seed Script
├── README.md                     # Documentation & Setup Guide
├── backend/                      # Part B & C: Node.js / Express.js REST API
│   ├── .env                      # Database credentials & port configuration
│   ├── package.json              # Backend dependencies & npm scripts
│   ├── server.js                 # Express application initialization & middleware
│   ├── seed.js                   # Automated database migration and seeder runner
│   ├── test_system.js            # Automated test suite (34 assertions covering all rubric marks)
│   ├── config/
│   │   └── db.js                 # mysql2 connection pool with safe error handling
│   ├── models/                   # Modular data queries and transaction business logic
│   │   ├── Supplier.js           # Supplier CRUD operations
│   │   ├── Fruit.js              # Fruit catalog & automatic selling price matrix
│   │   ├── Vendor.js             # Vendor management & payment debt settlement
│   │   ├── Purchase.js           # Multi-item purchase & stock restock logic
│   │   ├── Sale.js               # Multi-item sale, stock checks & atomic rollback
│   │   ├── Stock.js              # Packaging-specific stock queries & locking
│   │   ├── Report.js             # 4 required SQL analytical queries + balances
│   │   └── queries.sql           # Pure SQL reference for Part D queries
│   ├── controllers/              # REST API controllers & HTTP status codes
│   │   ├── supplierController.js
│   │   ├── fruitController.js
│   │   ├── vendorController.js
│   │   ├── purchaseController.js
│   │   ├── saleController.js
│   │   └── reportController.js
│   ├── routes/                   # Clean Express router modules
│   │   ├── supplierRoutes.js
│   │   ├── fruitRoutes.js
│   │   ├── vendorRoutes.js
│   │   ├── purchaseRoutes.js
│   │   ├── saleRoutes.js
│   │   └── reportRoutes.js
│   └── middleware/
│       └── errorHandler.js       # Centralized error handler (200, 201, 400, 404, 409, 500)
└── batloung-frontend/            # React + Vite Single-Page Application (SPA)
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx               # Navigation router and view orchestrator
        ├── App.css & index.css   # Responsive styling & status badges
        ├── services/api.js       # Centralized REST API fetch client
        ├── components/
        │   └── Sidebar.jsx       # Side navigation bar
        └── pages/
            ├── Dashboard.jsx     # KPIs, Date-Range Revenue filter, Top Fruits & Balances
            ├── Suppliers.jsx     # South African suppliers CRUD & province filters
            ├── FruitsStock.jsx   # Fruit catalog, packaging stock & low-stock alerts (< 5 boxes)
            ├── Vendors.jsx       # Vendor directory, search, edit & debt settlement modal
            ├── Purchases.jsx     # Multi-item consignment purchase form & history
            └── Sales.jsx         # Point of Sale with automatic prices & stock validation
```

---

## ⚡ Quick Setup & Running Instructions

### 1. Database Setup (Part A)
Make sure your local MySQL server is running (default port `3306`).
Ensure database credentials in `backend/.env` match your local MySQL configuration:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=batloung_farm_db
DB_PORT=3306
```

To automatically create the database, all 8 relational tables, constraints, and realistic sample seed data, run:
```bash
cd backend
npm run seed
```
*(Alternatively, you can import `database.sql` directly into MySQL Workbench or phpMyAdmin).*

### 2. Run the Backend REST API (Port 5000)
```bash
cd backend
npm install
npm start
```
*Server will be live at: `http://localhost:5000`*

### 3. Run the Automated Test Suite (Verifies 34/34 Rubric Assertions)
To demonstrate full rubric compliance including the **10 vs 6 large apple boxes rollback scenario**, run:
```bash
cd backend
npm test
```

### 4. Run the Frontend Client (Port 5173)
```bash
cd batloung-frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your web browser.*

---

## 📊 Marking Rubric Breakdown & Test Coverage (42 Marks)

| Part | Section | Marks | Implementation Details |
|---|---|:---:|---|
| **A** | **MySQL Database Design** | **10** | • All 8 required tables created (`suppliers`, `fruits`, `vendors`, `purchases`, `purchase_details`, `sales`, `sales_details`, `stock`).<br>• Explicit Primary Keys, Foreign Keys with `ON DELETE / ON UPDATE CASCADE/RESTRICT`.<br>• Integrity Constraints: `NOT NULL`, `UNIQUE` (fruit name, vendor phone, supplier name), `CHECK` (quantities > 0, unit costs >= 0, prices >= 0).<br>• **Packaging-Specific Stock Design:** Uniquely tracks balances for Small, Medium, and Large boxes.<br>• Clean `database.sql` with realistic sample data across SA provinces and Maseru vendors. |
| **B** | **Node.js Backend Development** | **8** | • Organised MVC folder structure (`config`, `routes`, `controllers`, `models`, `middleware`).<br>• Reliable connection pooling with `mysql2/promise`.<br>• `.env` file credentials storage.<br>• Asynchronous `async/await` with try/catch and non-crashing graceful error handler. |
| **C** | **Express.js REST API** | **14** | • **Supplier Management:** CRUD endpoints with province validation.<br>• **Fruit & Stock Management:** Fruit CRUD, `/fruits/stock/levels`, `/fruits/stock/low?threshold=5`, and automatic price matrix `/fruits/pricing`.<br>• **Vendor Management:** Fixed `registration_date` typo, vendor search by name or phone, update profile.<br>• **Purchase Management:** Multi-item purchases with automated total calculation & stock restocking.<br>• **Sales Management:** Multi-item sales, automated selling price calculation, stock reduction, atomic rollback on stock shortfall.<br>• **HTTP Status Codes:** `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `500 Server Error`. |
| **D** | **Business Logic, SQL & Transactions** | **10** | • **Automatic Sales Calculations:** Selling prices automatically calculated by packaging size without manual entry.<br>• **Stock Management:** Increases on purchase, decreases on sale, prevents negative quantities (`CHECK (available_quantity >= 0)`).<br>• **SQL Analytical Queries:**<br>&nbsp;&nbsp;1. Five most frequently sold fruits<br>&nbsp;&nbsp;2. Date-range revenue filter<br>&nbsp;&nbsp;3. Top purchasing vendor by box volume<br>&nbsp;&nbsp;4. Current stock levels per packaging size<br>• **Transactions:** Atomic `BEGIN`, `COMMIT`, and `ROLLBACK` verified by automated tests.<br>• **Payment Management:** Supports Cash, Mobile Money, and Credit. Automatically updates status (`PAID`, `PARTIALLY_PAID`, `UNPAID`) and tracks vendor outstanding balances. |
| **Total** | | **42** | **100% Complete & Verified** |

---

## 🧪 Demonstration of the Insufficient Stock Rollback Scenario
**Specification Requirement (Page 6):**
> *"NB: A vendor requests 10 large boxes of apples, but only 6 large boxes are available. The API must reject the entire sale without reducing the available stock or creating an incomplete transaction."*

**How to verify:**
1. In the automated test runner:
   ```bash
   npm test
   ```
   *Test Group 7 explicitly executes this case and confirms:*
   - Sale is rejected with HTTP `400 Bad Request`.
   - Error response contains: `"Requested 10 large boxes of Crisp Red Apples, but only 6 large boxes are currently available."`
   - Sales count remains unchanged (no orphan sale header created).
   - Stock remains untouched at exactly 6 boxes.
2. In the Frontend UI (`http://localhost:5173`):
   - Go to **Record Sale**.
   - Select any vendor.
   - Choose **Crisp Red Apples**, packaging **Large Box**, and set Quantity to **10**.
   - Click **Confirm Sale**.
   - The UI immediately displays the transaction rejection alert and explains that inventory and database integrity were fully preserved.
