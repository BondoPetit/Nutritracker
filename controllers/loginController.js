const express = require('express');
const sql = require('mssql');
const router = express.Router();
const { getPool } = require('../database'); // Adjust the path as necessary

// Route for handling user registration
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const pool = await getPool();
        const registrationResult = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .query(`
                INSERT INTO Users (Email, PasswordHash)
                OUTPUT inserted.UserID
                VALUES (@email, @password)
            `);
        const userID = registrationResult.recordset[0].UserID;
        res.redirect(`/MyProfile.html?userID=${userID}`);
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ error: 'An error occurred while registering user.' });
    }
});

// Route for handling user login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .query(`
                SELECT UserID
                FROM Users
                WHERE Email = @email AND PasswordHash = @password
            `);
        if (result.recordset.length > 0) {
            const userID = result.recordset[0].UserID;
            res.redirect(`/MealCreator.html?userID=${userID}`);
        } else {
            res.status(401).json({ message: 'Invalid credentials.' });
        }
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ error: 'An error occurred while logging in.' });
    }
});

module.exports = function() {
    return "hello world";
}

module.exports = router;
