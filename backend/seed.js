const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

async function seed() {
    const conn = await pool.getConnection();
    try {
        console.log('🌱 Starting database setup and seed...');
        const sqlPath = path.join(__dirname, '..', 'database.sql');
        const rawSql = fs.readFileSync(sqlPath, 'utf8');

        // Normalize line endings
        const cleanSql = rawSql.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // Split by semicolon and extract SQL statements without comments
        const statements = cleanSql
            .split(/;(?:\n|$)/)
            .map(block => {
                return block
                    .split('\n')
                    .filter(line => !line.trim().startsWith('--'))
                    .join('\n')
                    .trim();
            })
            .filter(s => s.length > 0 && !s.toLowerCase().startsWith('select'));

        await conn.query('SET FOREIGN_KEY_CHECKS = 0');

        for (let stmt of statements) {
            console.log(`Executing: ${stmt.substring(0, 50).replace(/\n/g, ' ')}...`);
            try {
                await conn.query(stmt);
            } catch (err) {
                console.error(`❌ Failed on statement:\n${stmt}\nError: ${err.message}`);
                throw err;
            }
        }

        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Database setup and seed completed successfully!');

        // Verify row counts
        const tables = ['suppliers', 'fruits', 'vendors', 'stock', 'purchases', 'purchase_details', 'sales', 'sales_details'];
        for (let t of tables) {
            const [rows] = await conn.query(`SELECT COUNT(*) AS count FROM ${t}`);
            console.log(`  - ${t}: ${rows[0].count} rows`);
        }
    } finally {
        conn.release();
    }
}

seed().then(() => process.exit(0)).catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
});
