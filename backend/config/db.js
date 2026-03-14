const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: 'sa',
    password: 'diladmin123@#$',
    server: 'localhost',
    database: 'ProjectMate',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    port: 1433
};

module.exports = { sql, dbConfig };