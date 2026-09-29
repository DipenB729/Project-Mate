const sql = require('mssql');
require('dotenv').config();
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'ProjectMate',
    port: Number(process.env.DB_PORT || 1433),
    connectionTimeout: 10000,
    options: {
        encrypt: process.env.DB_ENCRYPT !== 'false',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        abortTransactionOnError: true
    }
};
module.exports = { sql, dbConfig };
