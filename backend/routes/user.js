const express = require('express');
const { sql, dbConfig } = require('../config/db');

// Note: `upload` middleware is passed in from server.js
// so we export a factory function that accepts it
module.exports = (upload) => {
    const router = express.Router(); // create INSIDE the factory

    // --- UPDATE PROFILE ---
    router.put('/update-profile', upload.single('profilePic'), async (req, res) => {
        try {
            const { userId, fullName, address, existingPic } = req.body;

            console.log("Update Request Body:", req.body);
            console.log("Uploaded File:", req.file);

            if (!userId) return res.status(400).json({ error: "User ID is missing" });

            let profilePicPath = existingPic;
            if (req.file) {
                profilePicPath = `/uploads/${req.file.filename}`;
            }

            const pool = await sql.connect(dbConfig);
            await pool.request()
                .input('uid', sql.Int, userId)
                .input('name', sql.NVarChar, fullName)
                .input('address', sql.NVarChar, address || null)
                .input('pic', sql.NVarChar, profilePicPath || null)
                .query(`
                    UPDATE Users 
                    SET FullName = @name, Address = @address, ProfilePic = @pic, IsModified = GETDATE() 
                    WHERE UserId = @uid
                `);

            res.json({
                message: "Profile updated successfully",
                profilePic: profilePicPath,
                fullName: fullName
            });
        } catch (err) {
            console.error("DETAILED SQL ERROR:", err);
            res.status(500).json({ error: err.message });
        }
    });

    // --- GET USER DETAILS ---
    router.get('/details/:userId', async (req, res) => {
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .input('uid', sql.Int, req.params.userId)
                .query('SELECT FullName, Email, Address, ProfilePic FROM Users WHERE UserId = @uid');
            res.json(result.recordset[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};