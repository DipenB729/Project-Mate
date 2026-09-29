require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { sql, dbConfig } = require('../config/db');
(async () => {
    let pool;
    try {
        pool = await new sql.ConnectionPool(dbConfig).connect();
        for (const file of fs.readdirSync(path.join(__dirname, '../migrations')).filter(f => f.endsWith('.sql')).sort()) {
            await pool.request().batch(fs.readFileSync(path.join(__dirname, '../migrations', file), 'utf8'));
            console.log(`Applied ${file}`);
        }
        const result = await pool.request().query(`SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Users') AND name IN ('InterestsText', 'AboutText', 'PreferredRole')`);
        if (result.recordset.length !== 3) throw new Error('Profile migration verification failed.');
        console.log('Migration verified.');
    } catch (err) {
        console.error(`Migration failed (${err.code || 'error'}): ${err.message}`);
        process.exitCode = 1;
    } finally { if (pool) await pool.close(); }
})();
